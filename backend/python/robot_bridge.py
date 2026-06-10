"""
Ponte assíncrona entre o servidor C++ (TCP) e o servidor FastAPI (WebSocket).
Mantém reconexão automática ao robô.
"""

import asyncio
import logging
from collections import deque

logger = logging.getLogger(__name__)

RECONNECT_DELAY   = 2.0   # segundos entre tentativas
TELEMETRY_TIMEOUT = 0.05  # timeout ao ler fila de telemetria


class RobotBridge:
    def __init__(self, host: str = "localhost", port: int = 9001) -> None:
        self.host = host
        self.port = port
        self.is_connected = False

        self._reader: asyncio.StreamReader | None = None
        self._writer: asyncio.StreamWriter | None = None
        self._telemetry_queue: asyncio.Queue[str] = asyncio.Queue(maxsize=20)
        self._pending_commands: deque[str] = deque(maxlen=50)

    # ─── Loop de conexão (roda em background) ─────────────────────────────
    async def connect_loop(self) -> None:
        while True:
            try:
                await self._connect()
                await self._receive_loop()
            except (ConnectionRefusedError, OSError) as exc:
                logger.warning("Robô inacessível (%s) — reconectando em %ss...",
                               exc, RECONNECT_DELAY)
            except Exception as exc:
                logger.error("Erro na bridge: %s", exc)
            finally:
                self.is_connected = False
                if self._writer:
                    self._writer.close()
                    self._writer = None
            await asyncio.sleep(RECONNECT_DELAY)

    async def _connect(self) -> None:
        self._reader, self._writer = await asyncio.open_connection(
            self.host, self.port
        )
        self.is_connected = True
        logger.info("Conectado ao robô em %s:%s", self.host, self.port)

        # Envia comandos que ficaram na fila durante desconexão
        while self._pending_commands:
            await self._write(self._pending_commands.popleft())

    async def _receive_loop(self) -> None:
        assert self._reader is not None
        while True:
            line = await self._reader.readline()
            if not line:
                break
            decoded = line.decode("utf-8").strip()
            if decoded:
                # descarta telemetria antiga se fila cheia
                if self._telemetry_queue.full():
                    try:
                        self._telemetry_queue.get_nowait()
                    except asyncio.QueueEmpty:
                        pass
                await self._telemetry_queue.put(decoded)

    # ─── API pública ──────────────────────────────────────────────────────
    async def send_command(self, command: str) -> None:
        if self.is_connected:
            await self._write(command)
        else:
            logger.warning("Robô desconectado — comando enfileirado")
            self._pending_commands.append(command)

    async def get_telemetry(self) -> str | None:
        try:
            return await asyncio.wait_for(
                self._telemetry_queue.get(), timeout=TELEMETRY_TIMEOUT
            )
        except asyncio.TimeoutError:
            return None

    async def disconnect(self) -> None:
        if self._writer:
            self._writer.close()
            await self._writer.wait_closed()

    async def _write(self, data: str) -> None:
        if self._writer:
            self._writer.write((data + "\n").encode("utf-8"))
            await self._writer.drain()
