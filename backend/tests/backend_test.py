"""Backend tests for the DiCo/DiRi app (Italian termoidraulica)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "https://termoidraulica-dico.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

TEST_EMAIL = "test@idraulico.it"
TEST_PASSWORD = "pass1234"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth_headers(session):
    # Try login first; if 401 (user not existing), register.
    r = session.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
    if r.status_code != 200:
        reg = session.post(f"{API}/auth/register", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD, "name": "Mario Idraulico"
        })
        if reg.status_code not in (200, 201):
            # Email already registered but with different password? create a fresh test user
            unique_email = f"TEST_{uuid.uuid4().hex[:8]}@idraulico.it"
            reg = session.post(f"{API}/auth/register", json={
                "email": unique_email, "password": TEST_PASSWORD, "name": "Mario Idraulico"
            })
            assert reg.status_code == 200, f"Register failed: {reg.status_code} {reg.text}"
        token = reg.json()["session_token"]
    else:
        token = r.json()["session_token"]
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ---------------- Auth ----------------
class TestAuth:
    def test_root(self, session):
        r = session.get(f"{API}/")
        assert r.status_code == 200
        assert "message" in r.json()

    def test_me_unauthenticated(self, session):
        r = session.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_clients_unauthenticated(self, session):
        r = session.get(f"{API}/clients")
        assert r.status_code == 401

    def test_login_wrong_password(self, session):
        r = session.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": "wrongpass"})
        assert r.status_code == 401

    def test_register_duplicate(self, session, auth_headers):
        r = session.post(f"{API}/auth/register", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD, "name": "Dup"
        })
        # If user with TEST_EMAIL exists, must be 400
        assert r.status_code == 400 or r.status_code == 200

    def test_me_authenticated(self, session, auth_headers):
        r = session.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert "user" in data
        assert "email" in data["user"]


# ---------------- Company ----------------
class TestCompany:
    def test_get_company_default(self, session, auth_headers):
        r = session.get(f"{API}/company", headers=auth_headers)
        assert r.status_code == 200
        d = r.json()
        assert "denominazione" in d
        assert "abilitazioni" in d
        assert isinstance(d["abilitazioni"], list)

    def test_update_company(self, session, auth_headers):
        payload = {
            "denominazione": "TEST_Impresa SRL",
            "responsabile_tecnico": "Mario Rossi",
            "partita_iva": "12345678901",
            "codice_fiscale": "RSSMRA80A01H501U",
            "indirizzo": "Via Roma 1",
            "comune": "Milano",
            "provincia": "MI",
            "cap": "20100",
            "telefono": "0212345678",
            "email": "info@test.it",
            "pec": "pec@test.it",
            "cciaa_provincia": "MI",
            "cciaa_numero": "123456",
            "abilitazioni": ["A", "C", "D"],
            "albo_professione": "",
            "albo_provincia": "",
            "albo_numero": "",
        }
        r = session.put(f"{API}/company", headers=auth_headers, json=payload)
        assert r.status_code == 200
        # verify persistence
        g = session.get(f"{API}/company", headers=auth_headers)
        assert g.status_code == 200
        d = g.json()
        assert d["denominazione"] == "TEST_Impresa SRL"
        assert d["abilitazioni"] == ["A", "C", "D"]


# ---------------- Clients ----------------
class TestClients:
    created_id = None

    def test_create_client(self, session, auth_headers):
        payload = {"nome": "TEST_Cliente Uno", "codice_fiscale": "RSSMRA80A01H501U",
                   "telefono": "3331234567", "indirizzo": "Via Verdi 10", "comune": "Milano"}
        r = session.post(f"{API}/clients", headers=auth_headers, json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["nome"] == "TEST_Cliente Uno"
        assert "id" in d
        TestClients.created_id = d["id"]

    def test_list_contains_created(self, session, auth_headers):
        r = session.get(f"{API}/clients", headers=auth_headers)
        assert r.status_code == 200
        ids = [c["id"] for c in r.json()]
        assert TestClients.created_id in ids

    def test_update_client(self, session, auth_headers):
        payload = {"nome": "TEST_Cliente Uno Aggiornato", "codice_fiscale": "", "telefono": "", "email": "",
                   "indirizzo": "", "comune": "", "note": "note", "partita_iva": ""}
        r = session.put(f"{API}/clients/{TestClients.created_id}", headers=auth_headers, json=payload)
        assert r.status_code == 200
        assert r.json()["nome"] == "TEST_Cliente Uno Aggiornato"

    def test_delete_client(self, session, auth_headers):
        r = session.delete(f"{API}/clients/{TestClients.created_id}", headers=auth_headers)
        assert r.status_code == 200
        # verify gone from list
        g = session.get(f"{API}/clients", headers=auth_headers)
        ids = [c["id"] for c in g.json()]
        assert TestClients.created_id not in ids


# ---------------- Installations ----------------
class TestInstallations:
    created_id = None

    def test_create_installation(self, session, auth_headers):
        payload = {"descrizione": "TEST_Impianto Gas", "indirizzo": "Via Dante 5",
                   "comune": "Milano", "provincia": "MI", "cap": "20100"}
        r = session.post(f"{API}/installations", headers=auth_headers, json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["descrizione"] == "TEST_Impianto Gas"
        TestInstallations.created_id = d["id"]

    def test_list_installations(self, session, auth_headers):
        r = session.get(f"{API}/installations", headers=auth_headers)
        assert r.status_code == 200
        ids = [i["id"] for i in r.json()]
        assert TestInstallations.created_id in ids

    def test_update_installation(self, session, auth_headers):
        payload = {"descrizione": "TEST_Impianto Gas v2", "indirizzo": "", "comune": "",
                   "provincia": "", "cap": "", "scala": "", "piano": "", "interno": "",
                   "proprieta": "", "note": ""}
        r = session.put(f"{API}/installations/{TestInstallations.created_id}", headers=auth_headers, json=payload)
        assert r.status_code == 200
        assert r.json()["descrizione"] == "TEST_Impianto Gas v2"

    def test_delete_installation(self, session, auth_headers):
        r = session.delete(f"{API}/installations/{TestInstallations.created_id}", headers=auth_headers)
        assert r.status_code == 200


# ---------------- Documents ----------------
class TestDocuments:
    dico_id = None
    diri_id = None

    def test_create_dico(self, session, auth_headers):
        payload = {"tipo": "dico", "data": {"committente": "TEST", "note": "test"}}
        r = session.post(f"{API}/documents", headers=auth_headers, json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["tipo"] == "dico"
        assert d["numero"].startswith("DICO-")
        assert "id" in d
        TestDocuments.dico_id = d["id"]

    def test_create_diri(self, session, auth_headers):
        payload = {"tipo": "diri", "data": {"proprieta": "TEST"}}
        r = session.post(f"{API}/documents", headers=auth_headers, json=payload)
        assert r.status_code == 200
        d = r.json()
        assert d["tipo"] == "diri"
        assert d["numero"].startswith("DIRI-")
        TestDocuments.diri_id = d["id"]

    def test_invalid_tipo(self, session, auth_headers):
        r = session.post(f"{API}/documents", headers=auth_headers, json={"tipo": "xxx", "data": {}})
        assert r.status_code == 400

    def test_list_documents_sorted_desc(self, session, auth_headers):
        r = session.get(f"{API}/documents", headers=auth_headers)
        assert r.status_code == 200
        docs = r.json()
        assert len(docs) >= 2
        # Verify sort desc by created_at
        created = [d["created_at"] for d in docs]
        assert created == sorted(created, reverse=True)

    def test_get_document_by_id(self, session, auth_headers):
        r = session.get(f"{API}/documents/{TestDocuments.dico_id}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["id"] == TestDocuments.dico_id

    def test_get_document_not_found(self, session, auth_headers):
        r = session.get(f"{API}/documents/nonexistent-id", headers=auth_headers)
        assert r.status_code == 404

    def test_delete_document_soft(self, session, auth_headers):
        r = session.delete(f"{API}/documents/{TestDocuments.dico_id}", headers=auth_headers)
        assert r.status_code == 200
        g = session.get(f"{API}/documents/{TestDocuments.dico_id}", headers=auth_headers)
        assert g.status_code == 404
        # cleanup diri
        session.delete(f"{API}/documents/{TestDocuments.diri_id}", headers=auth_headers)
