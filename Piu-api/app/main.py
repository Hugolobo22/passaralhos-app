from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, bird_detection
from app.ia import service as ia_service
from app.ia.service import BirdDetectionService


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Carregando BirdCNN (modelo customizado)...")
    ia_service.bird_service = BirdDetectionService()
    print("BirdCNN pronto!")
    yield
    print("Encerrando...")


app = FastAPI(
    title="Passaralhos API",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(bird_detection.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
