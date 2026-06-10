"""
app/routes/bird_detection.py
Endpoints de detecção de pássaros — protegidos por JWT.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import decode_token
from app.ia.service import BirdDetectionService, get_bird_service
from app.schemas.bird import PredictionResponse, SpeciesListResponse

router = APIRouter(prefix="/birds", tags=["Detecção de Pássaros"])

# Extrai o Bearer token do header Authorization
_bearer = HTTPBearer()


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> str:
    """
    Dependência reutilizável — decodifica o JWT e retorna o user_id.
    Usa o decode_token() que já existe em core/security.py.
    Lança 401 automaticamente se o token for inválido ou expirado.
    """
    return decode_token(credentials.credentials, expected_type="access")


# ── endpoints ────────────────────────────────────────────────

@router.post(
    "/predict",
    response_model=PredictionResponse,
    summary="Detecta espécie de pássaro pelo áudio",
    description="Envie um .wav, .mp3, .flac ou .ogg. Requer Bearer token.",
    status_code=status.HTTP_200_OK,
)
async def predict_species(
    audio: UploadFile = File(..., description="Arquivo de áudio do pássaro"),
    user_id: str = Depends(get_current_user_id),          # ← JWT obrigatório
    service: BirdDetectionService = Depends(get_bird_service),
) -> PredictionResponse:

    # Valida tipo de arquivo — inclui formatos nativos do Android (.m4a/.3gp) e iOS (.caf)
    ALLOWED = {
        "audio/wav", "audio/x-wav",
        "audio/mpeg", "audio/mp3",
        "audio/flac",
        "audio/ogg",
        "audio/mp4", "audio/m4a", "audio/x-m4a",  # Android HIGH_QUALITY / iOS
        "audio/3gpp",                               # Android fallback
        "audio/aac",
    }
    if audio.content_type and audio.content_type not in ALLOWED:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Formato não suportado: {audio.content_type}.",
        )

    # Valida tamanho (máx 10 MB)
    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Arquivo vazio.")
    if len(audio_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                            detail="Arquivo muito grande. Máximo 10 MB.")

    # Inferência
    try:
        result = service.predict(audio_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Erro ao processar áudio: {str(e)}",
        )

    return PredictionResponse(
        species=result.species,
        confidence=result.confidence,
        top5=result.top5,
        filename=audio.filename or "unknown",
        detected_by=user_id,      # registra quem fez a detecção
    )


@router.get(
    "/species",
    response_model=SpeciesListResponse,
    summary="Lista espécies reconhecidas pelo modelo",
)
async def list_species(
    user_id: str = Depends(get_current_user_id),          # ← JWT obrigatório
    service: BirdDetectionService = Depends(get_bird_service),
) -> SpeciesListResponse:
    species = service.list_species()
    return SpeciesListResponse(species=species, total=len(species))


@router.get(
    "/health",
    summary="Status do modelo de IA (público)",
    # sem JWT — útil para monitoramento
)
async def health(service: BirdDetectionService = Depends(get_bird_service)):
    return {
        "status": "ok",
        "model": "BirdCNN",
        "species_count": len(service.list_species()),
        "device": str(service.device),
    }
