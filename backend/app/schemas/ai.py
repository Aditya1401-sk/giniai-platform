from pydantic import BaseModel
from typing import Optional

class AIRequest(BaseModel):
    message: str
    role: Optional[str] = "guest"
    email: Optional[str] = "unknown"
    history: Optional[list] = []