# Passaralhos API

Backend do protótipo — FastAPI + SQLite. Sem Docker, sem banco externo.

## Como rodar (Windows)

```bash
# No terminal, dentro da pasta passaralhos-api

# 1. Criar ambiente virtual
python -m venv venv

# 2. Ativar (Windows)
venv\Scripts\activate

# 3. Instalar dependências
pip install -r requirements.txt

# 4. Subir o servidor
uvicorn app.main:app --reload
```

O arquivo `passaralhos.db` (SQLite) é criado automaticamente na primeira execução.

## Endpoints

| Método | Rota                    | Descrição      |
| ------ | ----------------------- | -------------- |
| POST   | `/api/v1/auth/register` | Criar conta    |
| POST   | `/api/v1/auth/login`    | Login          |
| POST   | `/api/v1/auth/refresh`  | Renovar token  |
| GET    | `/api/v1/auth/me`       | Usuário logado |
| POST   | `/api/v1/auth/logout`   | Logout         |
| GET    | `/health`               | Status da API  |

Documentação interativa: http://localhost:8000/docs
