import uuid
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field


class CardItem(BaseModel):
    type: str  # 'warning' | 'safe' | 'neutral'
    text: str


    
class AnalysisDoc(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), alias="_id")
    contract_preview: str
    risk_score: int
    risk_label: str
    cards: List[CardItem]
    summary: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True


class AnalysisResponse(BaseModel):
    analysis_id: str
    risk_score: int
    risk_label: str
    cards: List[CardItem]


class AnalyzeTextRequest(BaseModel):
    text: str
