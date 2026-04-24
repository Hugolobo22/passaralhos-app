import os
from dotenv import load_dotenv

load_dotenv()

JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "chave-secreta-dev")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))

# SQLite — arquivo local, sem instalação nenhuma
DATABASE_URL: str = "sqlite:///./passaralhos.db"