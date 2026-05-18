import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse

from models import AnalyzeTextRequest, AnalysisResponse
from services import db, gemini, parser, rag_service

router = APIRouter()

# In-memory store for text used in streaming (keyed by analysis_id)
_pending_streams: dict[str, dict] = {}


@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_text(req: AnalyzeTextRequest):
    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Contract text cannot be empty.")

    result = await gemini.analyze_contract(text)

    analysis_id = str(uuid.uuid4())
    doc = {
        "_id": analysis_id,
        "contract_preview": text[:200],
        "risk_score": result["risk_score"],
        "risk_label": result["risk_label"],
        "cards": result["cards"],
        "summary": None,
        "created_at": datetime.now(timezone.utc),
    }
    await db.save_analysis(doc)

    try:
        await rag_service.embed_and_store(analysis_id, text)
    except Exception as e:
        print(f"Error storing embeddings: {e}")

    # Store for SSE streaming
    _pending_streams[analysis_id] = {"text": text, "score": result["risk_score"], "cards": result["cards"]}

    return AnalysisResponse(
        analysis_id=str(analysis_id),
        risk_score=int(result.get("risk_score", 50)),
        risk_label=str(result.get("risk_label", "Medium risk")),
        cards=[
            {
                "type": str(c.get("type", "neutral")),
                "text": str(c.get("text")) if isinstance(c.get("text"), str) else json.dumps(c.get("text"))
            } 
            for c in result.get("cards", [])
        ],
    )


@router.post("/analyze/file", response_model=AnalysisResponse)
async def analyze_file(file: UploadFile = File(...)):
    filename = file.filename or ""
    file_bytes = await file.read()

    if filename.lower().endswith(".pdf"):
        text = parser.extract_text_from_pdf(file_bytes)
    elif filename.lower().endswith(".docx"):
        text = parser.extract_text_from_docx(file_bytes)
    else:
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported.")

    if not text:
        raise HTTPException(status_code=400, detail="Could not extract text from file.")

    result = await gemini.analyze_contract(text)

    analysis_id = str(uuid.uuid4())
    doc = {
        "_id": analysis_id,
        "contract_preview": text[:200],
        "risk_score": result["risk_score"],
        "risk_label": result["risk_label"],
        "cards": result["cards"],
        "summary": None,
        "created_at": datetime.now(timezone.utc),
    }
    await db.save_analysis(doc)

    try:
        await rag_service.embed_and_store(analysis_id, text)
    except Exception as e:
        print(f"Error storing embeddings: {e}")

    _pending_streams[analysis_id] = {"text": text, "score": result["risk_score"], "cards": result["cards"]}

    return AnalysisResponse(
        analysis_id=str(analysis_id),
        risk_score=int(result.get("risk_score", 50)),
        risk_label=str(result.get("risk_label", "Medium risk")),
        cards=[
            {
                "type": str(c.get("type", "neutral")),
                "text": str(c.get("text")) if isinstance(c.get("text"), str) else json.dumps(c.get("text"))
            } 
            for c in result.get("cards", [])
        ],
    )


@router.get("/analyze/stream")
async def stream_summary(id: str = Query(...)):
    pending = _pending_streams.get(id)
    if not pending:
        raise HTTPException(status_code=404, detail="Analysis not found or already streamed.")

    async def event_generator():
        full_summary = ""
        try:
            async for chunk in gemini.stream_summary(
                pending["text"], pending["score"], pending["cards"]
            ):
                full_summary += chunk
                yield {"event": "chunk", "data": chunk}

            # Save summary to DB
            await db.update_summary(id, full_summary)
            yield {"event": "done", "data": ""}
        except Exception as e:
            yield {"event": "error", "data": str(e)}

    return EventSourceResponse(event_generator())
