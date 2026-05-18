from fastapi import APIRouter, HTTPException
from services import db

router = APIRouter()


@router.get("/history")
async def get_history():
    analyses = await db.get_all_analyses()
    return analyses


@router.get("/history/{analysis_id}")
async def get_analysis(analysis_id: str):
    doc = await db.get_analysis_by_id(analysis_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return doc


@router.delete("/history/{analysis_id}")
async def delete_analysis(analysis_id: str):
    deleted = await db.delete_analysis(analysis_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Analysis not found.")
    return {"message": "Deleted successfully."}
