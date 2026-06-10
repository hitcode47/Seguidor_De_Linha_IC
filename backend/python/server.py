"""
Servidor FastAPI — bridge entre o robô ESP32-S3 (TCP) e o painel React (WebSocket).

Uso:
    # IP do ESP32 (aparece no Serial Monitor após ligar o robô)
    set ROBOT_HOST=192.168.1.50    (Windows)
    export ROBOT_HOST=192.168.1.50 (Linux/Mac)

    python server.py
"""

import asyncio
import json
import logging
import os
import pathlib
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from robot_bridge import RobotBridge

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ─── Caminhos do firmware C++ ────────────────────────────────────────────────
CPP_ROOT = pathlib.Path(__file__).parent.parent / "cpp"
CPP_SRC  = CPP_ROOT / "src"
EDITABLE = {".cpp", ".hpp", ".h", ".c"}


def _safe_path(filename: str) -> pathlib.Path:
    """Resolve e valida que o arquivo está dentro de CPP_SRC."""
    path = (CPP_SRC / filename).resolve()
    if CPP_SRC.resolve() not in path.parents and path != CPP_SRC.resolve():
        raise HTTPException(400, "Caminho inválido")
    if path.suffix not in EDITABLE:
        raise HTTPException(400, "Extensão não permitida")
    return path


# ─── Configuração do robô ─────────────────────────────────────────────────────
# Use a variável de ambiente ROBOT_HOST com o IP do ESP32.
# Se o mDNS funcionar na sua rede, "robo.local" também serve.
ROBOT_HOST = os.getenv("ROBOT_HOST", "robo.local")
ROBOT_PORT = int(os.getenv("ROBOT_PORT", "9001"))
logger.info("Conectando ao robô em %s:%s", ROBOT_HOST, ROBOT_PORT)

# ─── Estado compartilhado ─────────────────────────────────────────────────────
bridge: RobotBridge = RobotBridge(host=ROBOT_HOST, port=ROBOT_PORT)
clients: set[WebSocket] = set()


async def broadcast_telemetry() -> None:
    """Lê telemetria do robô e envia para todos os clientes WebSocket."""
    while True:
        telemetry = await bridge.get_telemetry()
        if not telemetry or not clients:
            continue

        dead: set[WebSocket] = set()
        for ws in clients:
            try:
                await ws.send_text(telemetry)
            except Exception:
                dead.add(ws)
        clients -= dead


# ─── Ciclo de vida da aplicação ───────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    asyncio.create_task(bridge.connect_loop())
    asyncio.create_task(broadcast_telemetry())
    yield
    await bridge.disconnect()


# ─── Aplicação ────────────────────────────────────────────────────────────────
app = FastAPI(title="Seguidor de Linha — API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket) -> None:
    await ws.accept()
    clients.add(ws)
    logger.info("Frontend conectado. Clientes ativos: %d", len(clients))

    # Informa status inicial ao cliente recém-conectado
    await ws.send_text(
        json.dumps({"type": "status", "robot_connected": bridge.is_connected})
    )

    try:
        while True:
            data = await ws.receive_text()
            logger.debug("Comando recebido: %s", data)
            await bridge.send_command(data)
    except WebSocketDisconnect:
        logger.info("Frontend desconectado")
    finally:
        clients.discard(ws)


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "robot_connected": bridge.is_connected,
        "clients": len(clients),
    }


# ─── Firmware: arquivos ───────────────────────────────────────────────────────

@app.get("/api/files")
async def list_files():
    if not CPP_SRC.exists():
        return []
    return sorted(
        [{"name": f.name} for f in CPP_SRC.iterdir() if f.suffix in EDITABLE],
        key=lambda x: x["name"],
    )


@app.get("/api/files/{filename}")
async def read_file(filename: str):
    path = _safe_path(filename)
    if not path.exists():
        raise HTTPException(404, "Arquivo não encontrado")
    return {"name": filename, "content": path.read_text(encoding="utf-8")}


class FileBody(BaseModel):
    content: str


@app.put("/api/files/{filename}")
async def save_file(filename: str, body: FileBody):
    path = _safe_path(filename)
    path.write_text(body.content, encoding="utf-8")
    logger.info("Arquivo salvo: %s", filename)
    return {"saved": True}


# ─── Firmware: compilar / upload ──────────────────────────────────────────────

async def _stream_pio(args: list[str]):
    """Executa pio com os args dados e faz yield das linhas de saída."""
    try:
        proc = await asyncio.create_subprocess_exec(
            "pio", *args,
            cwd=str(CPP_ROOT),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        async for raw in proc.stdout:
            yield raw.decode("utf-8", errors="replace")
        await proc.wait()
        yield f"\n[EXIT {proc.returncode}]\n"
    except FileNotFoundError:
        yield "⚠  PlatformIO não encontrado. Instale com: pip install platformio\n"
    except Exception as exc:
        yield f"⚠  Erro: {exc}\n"


@app.post("/api/build")
async def build():
    return StreamingResponse(_stream_pio(["run"]), media_type="text/plain; charset=utf-8")


@app.post("/api/upload")
async def upload():
    return StreamingResponse(
        _stream_pio(["run", "--target", "upload"]),
        media_type="text/plain; charset=utf-8",
    )


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
