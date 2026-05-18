import os
import asyncio
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_mongodb import MongoDBAtlasVectorSearch
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

embeddings = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001", 
    google_api_key=os.getenv("GEMINI_API_KEY", "")
)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
)

async def embed_and_store(document_id: str, full_text: str):
    """Chunks the parsed document text and stores it in MongoDB Atlas Vector Search."""
    chunks = text_splitter.split_text(full_text)
    
    # Use synchronous PyMongo client specifically for Langchain
    client = MongoClient(os.getenv("MONGODB_URL"))
    collection = client[os.getenv("MONGODB_DB", "legalease")]["document_chunks"]
    
    vector_store = MongoDBAtlasVectorSearch(
        collection=collection,
        embedding=embeddings,
        index_name="vector_index",
    )
    
    texts_with_metadata = [
        {"document_id": document_id, "chunk_index": i}
        for i, _ in enumerate(chunks)
    ]
    
    # Run synchronous add_texts in an executor to avoid blocking the event loop
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: vector_store.add_texts(
            texts=chunks,
            metadatas=texts_with_metadata
        )
    )
    
    return len(chunks)
