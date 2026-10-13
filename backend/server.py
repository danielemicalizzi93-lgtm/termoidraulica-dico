from fastapi import FastAPI, APIRouter, Depends, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import secrets
import uuid
import bcrypt
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone, timedelta


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

EMERGENT_SESSION_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def ensure_aware(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def new_user_id() -> str:
    return f"user_{uuid.uuid4().hex[:12]}"


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


async def create_session(user_id: str) -> str:
    token = secrets.token_urlsafe(32)
    await db.user_sessions.insert_one({
        "session_token": token,
        "user_id": user_id,
        "created_at": now_utc(),
        "expires_at": now_utc() + timedelta(days=7),
    })
    return token


def public_user(user: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "user_id": user["user_id"],
        "email": user.get("email"),
        "name": user.get("name"),
        "picture": user.get("picture"),
        "auth_provider": user.get("auth_provider", "email"),
    }


async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1].strip()
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    if ensure_aware(session["expires_at"]) < now_utc():
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class RegisterInput(BaseModel):
    email: EmailStr
    password: str
    name: str


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class SessionInput(BaseModel):
    session_id: str


class CompanyProfile(BaseModel):
    denominazione: str = ""
    responsabile_tecnico: str = ""
    partita_iva: str = ""
    codice_fiscale: str = ""
    indirizzo: str = ""
    comune: str = ""
    provincia: str = ""
    cap: str = ""
    telefono: str = ""
    email: str = ""
    pec: str = ""
    cciaa_provincia: str = ""
    cciaa_numero: str = ""
    abilitazioni: List[str] = Field(default_factory=list)
    albo_professione: str = ""
    albo_provincia: str = ""
    albo_numero: str = ""


class Client(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nome: str
    codice_fiscale: str = ""
    partita_iva: str = ""
    telefono: str = ""
    email: str = ""
    indirizzo: str = ""
    comune: str = ""
    note: str = ""


class ClientInput(BaseModel):
    nome: str
    codice_fiscale: str = ""
    partita_iva: str = ""
    telefono: str = ""
    email: str = ""
    indirizzo: str = ""
    comune: str = ""
    note: str = ""


class Installation(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    descrizione: str
    indirizzo: str = ""
    comune: str = ""
    provincia: str = ""
    cap: str = ""
    scala: str = ""
    piano: str = ""
    interno: str = ""
    proprieta: str = ""
    note: str = ""


class InstallationInput(BaseModel):
    descrizione: str
    indirizzo: str = ""
    comune: str = ""
    provincia: str = ""
    cap: str = ""
    scala: str = ""
    piano: str = ""
    interno: str = ""
    proprieta: str = ""
    note: str = ""


class DocumentInput(BaseModel):
    tipo: str  # "dico" | "diri"
    data: Dict[str, Any] = Field(default_factory=dict)


# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "DiCo API"}


@api_router.post("/auth/register")
async def register(payload: RegisterInput):
    email = payload.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email già registrata")
    user = {
        "user_id": new_user_id(),
        "email": email,
        "name": payload.name.strip(),
        "password": hash_password(payload.password),
        "auth_provider": "email",
        "picture": None,
        "created_at": now_utc(),
    }
    await db.users.insert_one(user)
    await db.companies.insert_one({"user_id": user["user_id"], **CompanyProfile().model_dump()})
    token = await create_session(user["user_id"])
    return {"session_token": token, "user": public_user(user)}


@api_router.post("/auth/login")
async def login(payload: LoginInput):
    email = payload.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not user.get("password") or not verify_password(payload.password, user["password"]):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    token = await create_session(user["user_id"])
    return {"session_token": token, "user": public_user(user)}


@api_router.post("/auth/session")
async def auth_session(payload: SessionInput):
    async with httpx.AsyncClient(timeout=15.0) as hc:
        resp = await hc.get(EMERGENT_SESSION_URL, headers={"X-Session-ID": payload.session_id})
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = resp.json()
    email = (data.get("email") or "").lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data.get("name"), "picture": data.get("picture")}},
        )
        user = await db.users.find_one({"user_id": user_id})
    else:
        user = {
            "user_id": new_user_id(),
            "email": email,
            "name": data.get("name"),
            "picture": data.get("picture"),
            "password": None,
            "auth_provider": "google",
            "created_at": now_utc(),
        }
        await db.users.insert_one(user)
        await db.companies.insert_one({"user_id": user["user_id"], **CompanyProfile().model_dump()})

    token = await create_session(user["user_id"])
    return {"session_token": token, "user": public_user(user)}


@api_router.get("/auth/me")
async def me(user: Dict[str, Any] = Depends(get_current_user)):
    return {"user": public_user(user)}


@api_router.post("/auth/logout")
async def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        await db.user_sessions.delete_one({"session_token": token})
    return {"ok": True}


# ---------------------------------------------------------------------------
# Company profile
# ---------------------------------------------------------------------------
@api_router.get("/company")
async def get_company(user: Dict[str, Any] = Depends(get_current_user)):
    doc = await db.companies.find_one({"user_id": user["user_id"]}, {"_id": 0, "user_id": 0})
    if not doc:
        doc = CompanyProfile().model_dump()
        await db.companies.insert_one({"user_id": user["user_id"], **doc})
    return doc


@api_router.put("/company")
async def update_company(payload: CompanyProfile, user: Dict[str, Any] = Depends(get_current_user)):
    await db.companies.update_one(
        {"user_id": user["user_id"]},
        {"$set": payload.model_dump()},
        upsert=True,
    )
    return payload.model_dump()


# ---------------------------------------------------------------------------
# Clients
# ---------------------------------------------------------------------------
@api_router.get("/clients")
async def list_clients(user: Dict[str, Any] = Depends(get_current_user)):
    docs = await db.clients.find(
        {"user_id": user["user_id"], "deleted_at": None}, {"_id": 0, "user_id": 0, "deleted_at": 0}
    ).to_list(1000)
    return docs


@api_router.post("/clients")
async def create_client(payload: ClientInput, user: Dict[str, Any] = Depends(get_current_user)):
    c = Client(**payload.model_dump())
    await db.clients.insert_one({"user_id": user["user_id"], "deleted_at": None, **c.model_dump()})
    return c.model_dump()


@api_router.put("/clients/{client_id}")
async def update_client(client_id: str, payload: ClientInput, user: Dict[str, Any] = Depends(get_current_user)):
    await db.clients.update_one(
        {"user_id": user["user_id"], "id": client_id},
        {"$set": payload.model_dump()},
    )
    doc = await db.clients.find_one({"id": client_id}, {"_id": 0, "user_id": 0, "deleted_at": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Cliente non trovato")
    return doc


@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    await db.clients.update_one(
        {"user_id": user["user_id"], "id": client_id}, {"$set": {"deleted_at": now_utc()}}
    )
    return {"ok": True}


# ---------------------------------------------------------------------------
# Installations
# ---------------------------------------------------------------------------
@api_router.get("/installations")
async def list_installations(user: Dict[str, Any] = Depends(get_current_user)):
    docs = await db.installations.find(
        {"user_id": user["user_id"], "deleted_at": None}, {"_id": 0, "user_id": 0, "deleted_at": 0}
    ).to_list(1000)
    return docs


@api_router.post("/installations")
async def create_installation(payload: InstallationInput, user: Dict[str, Any] = Depends(get_current_user)):
    i = Installation(**payload.model_dump())
    await db.installations.insert_one({"user_id": user["user_id"], "deleted_at": None, **i.model_dump()})
    return i.model_dump()


@api_router.put("/installations/{inst_id}")
async def update_installation(inst_id: str, payload: InstallationInput, user: Dict[str, Any] = Depends(get_current_user)):
    await db.installations.update_one(
        {"user_id": user["user_id"], "id": inst_id},
        {"$set": payload.model_dump()},
    )
    doc = await db.installations.find_one({"id": inst_id}, {"_id": 0, "user_id": 0, "deleted_at": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Impianto non trovato")
    return doc


@api_router.delete("/installations/{inst_id}")
async def delete_installation(inst_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    await db.installations.update_one(
        {"user_id": user["user_id"], "id": inst_id}, {"$set": {"deleted_at": now_utc()}}
    )
    return {"ok": True}


# ---------------------------------------------------------------------------
# Documents
# ---------------------------------------------------------------------------
async def next_doc_number(user_id: str, tipo: str) -> str:
    year = now_utc().year
    prefix = "DICO" if tipo == "dico" else "DIRI"
    count = await db.documents.count_documents({"user_id": user_id, "tipo": tipo})
    return f"{prefix}-{year}-{count + 1:04d}"


@api_router.get("/documents")
async def list_documents(user: Dict[str, Any] = Depends(get_current_user)):
    docs = await db.documents.find(
        {"user_id": user["user_id"], "deleted_at": None}, {"_id": 0, "user_id": 0, "deleted_at": 0}
    ).sort("created_at", -1).to_list(1000)
    return docs


@api_router.get("/documents/{doc_id}")
async def get_document(doc_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    doc = await db.documents.find_one(
        {"user_id": user["user_id"], "id": doc_id, "deleted_at": None},
        {"_id": 0, "user_id": 0, "deleted_at": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Documento non trovato")
    return doc


@api_router.post("/documents")
async def create_document(payload: DocumentInput, user: Dict[str, Any] = Depends(get_current_user)):
    if payload.tipo not in ("dico", "diri"):
        raise HTTPException(status_code=400, detail="Tipo documento non valido")
    doc = {
        "id": str(uuid.uuid4()),
        "numero": await next_doc_number(user["user_id"], payload.tipo),
        "tipo": payload.tipo,
        "data": payload.data,
        "created_at": now_utc(),
        "updated_at": now_utc(),
    }
    await db.documents.insert_one({"user_id": user["user_id"], "deleted_at": None, **doc})
    doc.pop("_id", None)
    return doc


@api_router.put("/documents/{doc_id}")
async def update_document(doc_id: str, payload: DocumentInput, user: Dict[str, Any] = Depends(get_current_user)):
    result = await db.documents.update_one(
        {"user_id": user["user_id"], "id": doc_id, "deleted_at": None},
        {"$set": {"data": payload.data, "updated_at": now_utc()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Documento non trovato")
    doc = await db.documents.find_one(
        {"id": doc_id}, {"_id": 0, "user_id": 0, "deleted_at": 0}
    )
    return doc


@api_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, user: Dict[str, Any] = Depends(get_current_user)):
    await db.documents.update_one(
        {"user_id": user["user_id"], "id": doc_id}, {"$set": {"deleted_at": now_utc()}}
    )
    return {"ok": True}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_indexes():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("user_id")
    await db.user_sessions.create_index("expires_at", expireAfterSeconds=0)
    await db.documents.create_index("user_id")
    await db.clients.create_index("user_id")
    await db.installations.create_index("user_id")
    logger.info("Indexes ready")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
