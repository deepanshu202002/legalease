from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

class ChatRequest(BaseModel):
    document_id: str
    question: str
    chat_history: list[dict] = []  # [{"role": "user/assistant", "content": "..."}]

# Initialize synchronous MongoClient globally to avoid repeated DNS resolution timeouts
_mongo_client = None
def get_mongo_client():
    global _mongo_client
    if _mongo_client is None:
        _mongo_client = MongoClient(os.getenv("MONGODB_URL"))
    return _mongo_client

@router.post("/chat/{document_id}")
async def chat_with_contract(document_id: str, request: ChatRequest):
    try:
        client = get_mongo_client()
        collection = client[os.getenv("MONGODB_DB", "legalease")]["document_chunks"]
    except Exception as e:
        print(f"[DB ERROR] Failed to connect to MongoDB: {e}")
        return {
            "answer": "I'm having trouble connecting to my database right now. Please check your network or try again in a few moments.",
            "sources": []
        }
    
    vector_store = MongoDBAtlasVectorSearch(
        collection=collection,
        embedding=GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001", 
            google_api_key=os.getenv("GEMINI_API_KEY", "")
        ),
        index_name="vector_index",
    )
    
    retriever = vector_store.as_retriever(
        search_kwargs={
            "k": 5,
            "pre_filter": {"document_id": document_id}
        }
    )
    
    # Run sync retrieval in background to not block the event loop
    loop = asyncio.get_event_loop()
    relevant_chunks = await loop.run_in_executor(
        None,
        lambda: retriever.invoke(request.question)
    )
    
    context = "\n\n".join([doc.page_content for doc in relevant_chunks])
    
    # Handle empty context (No relevant sections found in the search index)
    if not context.strip():
        return {
            "answer": "I couldn't find any relevant sections in the contract for that specific question. Please try rephrasing or check if the document has been fully indexed (takes ~2 mins).",
            "sources": []
        }    
    system_prompt = """You are a legal contract specialist with native Google Search grounding capabilities.
    
    SCOPE & CAPABILITIES:
    1. USE WEB SEARCH for ANY query related to contracts, legal standards, definitions, or market norms. You are not limited to comparisons; if a contract references a law you don't know, search for it.
    2. CROSS-REFERENCE: Always try to relate web findings back to the provided Contract Context.
    
    STRICT GUARDRAILS:
    1. ONLY answer questions related to contracts and legal documents.
    2. CONCISENESS: Keep your answers brief and direct. Aim for 2-3 sentences maximum unless the user specifically asks for a detailed breakdown.
    3. BLOCK OFF-TOPIC SEARCHES: If the user asks about anything else (e.g., sports, weather, general news, medical advice), politely decline and state that you are a specialized Contract Intelligence Assistant.
    4. You are an AI, NOT a lawyer. All insights are informational. Never provide "official legal advice". 
    
    CITATIONS:
    - Cite contract clauses from the context.
    - Provide clear links for any information found via Google Search."""
    
    messages = [("system", system_prompt)]
    for msg in request.chat_history[-6:]:
        role = "human" if msg["role"] == "user" else "assistant"
        messages.append((role, msg["content"]))
    
    final_prompt = f"Contract Context:\n{context}\n\nQuestion: {request.question}"
    messages.append(("human", final_prompt))
    
    # Initialize LLM with Google Search tool enabled
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash", 
        google_api_key=os.getenv("GEMINI_API_KEY", "")
    ).bind_tools([{"google_search": {}}])
    
    try:
        response = await loop.run_in_executor(
            None,
            lambda: llm.invoke(messages)
        )
        
        # Extract text content from the AIMessage (handles both string and list of parts)
        answer_text = response.content
        if isinstance(answer_text, list):
            # Extract text from parts if it's a list
            answer_text = "".join([part.get("text", "") if isinstance(part, dict) else str(part) for part in answer_text])
            
        return {
            "answer": str(answer_text),
            "sources": [int(doc.metadata.get("chunk_index", 0)) for doc in relevant_chunks]
        }
    except Exception as e:
        # Check if it's a quota error
        error_msg = str(e)
        print(f"[CHAT ERROR] {error_msg}") # Log to terminal
        if "RESOURCE_EXHAUSTED" in error_msg or "429" in error_msg:
            return {
                "answer": f"The chatbot is currently limited by the AI quota. Detail: {error_msg}",
                "sources": []
            }
        return {
            "answer": f"I encountered an error while processing your request: {error_msg}",
            "sources": []
        }
