from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import engine, Base
from app.routes import auth

# Importa models para que o Base os registre
import app.models.user  # noqa: F401

# Cria as tabelas no SQLite ao iniciar (sem migrations, perfeito para protótipo)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Passaralhos API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção: restringir para o domínio do app
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}