"""
app/schemas/bird.py
Schemas Pydantic para a API de detecção de pássaros.
"""

from pydantic import BaseModel, Field


class SpeciesProbability(BaseModel):
    species:     str   = Field(..., example="Northern Cardinal")
    probability: float = Field(..., ge=0, le=1, example=0.9241)


class PredictionResponse(BaseModel):
    species:     str   = Field(..., example="Northern Cardinal")
    confidence:  float = Field(..., ge=0, le=1, example=0.9241)
    top5:        list[SpeciesProbability]
    filename:    str   = Field(..., example="gravacao.wav")
    detected_by: str   = Field(..., example="user-uuid-aqui")

    model_config = {
        "json_schema_extra": {
            "example": {
                "species":     "Northern Cardinal",
                "confidence":  0.9241,
                "filename":    "gravacao.wav",
                "detected_by": "abc123",
                "top5": [
                    {"species": "Northern Cardinal", "probability": 0.9241},
                    {"species": "Bewick's Wren",     "probability": 0.0412},
                    {"species": "Song Sparrow",      "probability": 0.0198},
                    {"species": "House Finch",       "probability": 0.0087},
                    {"species": "American Robin",    "probability": 0.0062},
                ],
            }
        }
    }


class SpeciesListResponse(BaseModel):
    species: list[str]
    total:   int = Field(..., example=20)
