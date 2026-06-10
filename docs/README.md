# Robô Seguidor de Linha

Projeto completo de robô seguidor de linha com painel de controle web em tempo real.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│  Frontend (React / Vite)        porta 3000                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ControlPanel  │  │  SensorBar   │  │  MotorStatus + Chart │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│           │               │                    │                │
│           └───────────────┴────────────────────┘                │
│                           │ WebSocket /ws                       │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│  Backend Python (FastAPI) porta 8000                            │
│  server.py ──── robot_bridge.py                                  │
└───────────────────────────┼─────────────────────────────────────┘
                            │ TCP 9001 (JSON + newline)
┌───────────────────────────┼─────────────────────────────────────┐
│  Backend C++ (Raspberry Pi)                                     │
│  main.cpp                                                       │
│  ├── SensorArray  (GPIO / simulação)                            │
│  ├── MotorDriver  (WiringPi PWM / simulação)                    │
│  ├── PIDController (proporcional-integral-derivativo)           │
│  └── RobotServer  (POSIX TCP socket)                            │
└─────────────────────────────────────────────────────────────────┘
```

### Fluxo de dados

| Direção            | Canal                | Formato          | Taxa     |
|--------------------|----------------------|------------------|----------|
| C++ → Python       | TCP socket (9001)    | JSON + `\n`      | ~50 Hz   |
| Python → React     | WebSocket (/ws)      | JSON             | ~50 Hz   |
| React → Python     | WebSocket (/ws)      | JSON             | on-demand|
| Python → C++       | TCP socket (9001)    | JSON + `\n`      | on-demand|

---

## Hardware necessário

| Componente                         | Função                          |
|------------------------------------|---------------------------------|
| Raspberry Pi 3B+ / 4               | Processamento central           |
| Array de 8 sensores IR (TCRT5000)  | Detecção da linha               |
| Driver de motor L298N ou L293D     | Controle dos motores DC         |
| 2× Motor DC com caixa de redução   | Locomoção                       |
| Bateria LiPo 7.4V ou pack 6×AA    | Alimentação                     |
| Chassi de 2 rodas + rodízio        | Estrutura mecânica              |

### Pinagem GPIO (numeração física — header 40 pinos)

| Pino | Função              |
|------|---------------------|
| 11   | Sensor IR 1 (S1)    |
| 12   | Sensor IR 2 (S2)    |
| 13   | Sensor IR 3 (S3)    |
| 15   | Sensor IR 4 (S4)    |
| 16   | Sensor IR 5 (S5)    |
| 18   | Sensor IR 6 (S6)    |
| 19   | Sensor IR 7 (S7)    |
| 21   | Sensor IR 8 (S8)    |
| 32   | Motor esquerdo PWM  |
| 29   | Motor esquerdo DIR A|
| 31   | Motor esquerdo DIR B|
| 33   | Motor direito PWM   |
| 35   | Motor direito DIR A |
| 37   | Motor direito DIR B |

> Os pinos podem ser ajustados em `backend/cpp/src/main.cpp`.

---

## Requisitos de software

### Raspberry Pi (Linux)
- GCC ≥ 9 com suporte a C++17
- CMake ≥ 3.16
- WiringPi (`sudo apt install wiringpi`)
- nlohmann/json (`sudo apt install nlohmann-json3-dev`)

### Servidor Python (pode rodar no Pi ou em outro PC)
- Python ≥ 3.11
- Pacotes: ver `backend/python/requirements.txt`

### Frontend (qualquer máquina com Node.js)
- Node.js ≥ 18
- npm ≥ 9

---

## Instalação e execução

### 1 — Backend C++ (Raspberry Pi)

```bash
# Instalar dependências
sudo apt update
sudo apt install -y build-essential cmake wiringpi nlohmann-json3-dev

# Compilar
cd backend/cpp
mkdir -p build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release
make -j$(nproc)

# Executar
./seguidor
```

> **Sem Raspberry Pi?** O binário roda em modo simulação automaticamente quando
> WiringPi não está presente — ideal para desenvolvimento no desktop.

---

### 2 — Backend Python

```bash
cd backend/python

# Criar ambiente virtual
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
# .venv\Scripts\activate         # Windows

# Instalar dependências
pip install -r requirements.txt

# Executar
python server.py
```

O servidor HTTP/WebSocket sobe em `http://localhost:8000`.  
Endpoint de saúde: `GET /health`

---

### 3 — Frontend React

```bash
cd frontend
npm install
npm run dev
```

Abre automaticamente em `http://localhost:3000`.

Para conectar a um Raspberry Pi em outro endereço, crie `.env.local`:

```
VITE_WS_URL=ws://192.168.1.50:8000/ws
```

---

## Calibração dos sensores

1. Posicione o robô **fora da linha** (todos os sensores em branco).
2. Clique em **Calibrar** no painel.
3. Mova o robô lentamente para que todos os sensores passem pela linha preta.
4. Após ~3 segundos o robô registra os valores mínimo e máximo de cada sensor.
5. Clique em **Iniciar** para começar o seguimento.

---

## Ajuste do PID

O controlador PID calcula:

```
output = Kp × erro + Ki × ∫erro dt + Kd × (Δerro/Δt)
```

Onde `erro = position` (posição da linha: −1.0 = extrema esquerda, +1.0 = extrema direita).

### Valores iniciais recomendados

| Ganho | Valor | Efeito                                     |
|-------|-------|--------------------------------------------|
| Kp    | 1.5   | Corrige o desvio proporcional              |
| Ki    | 0.0   | Elimina erro estacionário (use com cuidado)|
| Kd    | 0.8   | Amorte oscilações, resposta mais suave     |

### Processo de ajuste (método empírico)

1. Comece com `Ki = 0`, `Kd = 0` e aumente `Kp` até o robô oscilar.
2. Reduza `Kp` em ~30% e aumente `Kd` até a oscilação diminuir.
3. Se houver erro em linha reta, adicione `Ki` pequeno (0.01–0.1).

---

## Protocolo de comunicação (Python ↔ C++)

### Telemetria (C++ → Python, ~50 Hz)
```json
{
  "type":         "telemetry",
  "sensors":      [0, 0, 1, 1, 0, 0, 0, 0],
  "position":     -0.25,
  "left_speed":   165,
  "right_speed":  135,
  "pid_output":   15.0,
  "line_detected":true,
  "timestamp":    1717123456789
}
```

### Comandos (Python → C++)
```json
{ "type": "start" }
{ "type": "stop"  }
{ "type": "calibrate" }
{ "type": "set_pid",   "kp": 1.5, "ki": 0.0, "kd": 0.8 }
{ "type": "set_speed", "base_speed": 150 }
```

---

## Estrutura do projeto

```
SeguidorDeLinha/
├── backend/
│   ├── cpp/
│   │   ├── CMakeLists.txt
│   │   ├── include/              ← nlohmann/json (se não instalado via apt)
│   │   └── src/
│   │       ├── main.cpp          ← loop de controle principal
│   │       ├── pid_controller.*  ← controlador PID com anti-windup
│   │       ├── sensor_array.*    ← leitura dos sensores IR
│   │       ├── motor_driver.*    ← driver L298N via WiringPi
│   │       └── robot_server.*    ← servidor TCP POSIX
│   └── python/
│       ├── server.py             ← FastAPI + WebSocket
│       ├── robot_bridge.py       ← bridge assíncrona TCP↔WebSocket
│       └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SensorBar.jsx     ← visualização dos sensores
│   │   │   ├── MotorStatus.jsx   ← gauges + gráfico histórico
│   │   │   ├── PIDTuner.jsx      ← sliders Kp/Ki/Kd
│   │   │   ├── ControlPanel.jsx  ← botões + velocidade base
│   │   │   └── ConnectionStatus.jsx
│   │   └── hooks/
│   │       ├── useWebSocket.js   ← WebSocket com reconexão automática
│   │       └── useRobotData.js   ← estado do robô + histórico
│   ├── package.json
│   └── vite.config.js
└── docs/
    └── README.md
```

---

## Licença

MIT — use e modifique livremente.
