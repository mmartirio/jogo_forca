# 🎮 Jogo da Forca — Spring Boot (Java) + Flask (Python)

Aplicação full-stack do Jogo da Forca com dois modos (PvP e PvC), backend em Spring Boot 3.5 (Java 22) e frontend em Flask. O frontend faz proxy das chamadas para o backend.

## 📋 Funcionalidades

- **Modo PvP**: 2 a 5 jogadores
- **Modo PvC**: Jogador vs CPU (palavra pela CPU; usa Ollama se disponível, com fallback)
- **Pontuação**: Sem empates no PvC (melhor de 3); PvP definido por número de jogadores
- **UI responsiva**: Teclado virtual, modais e placar
- **Compartilhar convite**: Link/QR code para convidar

## 🛠️ Arquitetura e Tecnologias

- **Backend**: Spring Boot 3.5 (Java 22), Maven
- **Frontend**: Flask (Python), HTML/CSS/JS
- **Opcional**: Ollama (ex.: `tinyllama`) para gerar palavras no modo CPU
- **Portas**: Backend `8080`, Frontend `5000`

## 📦 Pré-requisitos

- Windows com PowerShell (v5.1 ou superior)
- Java JDK 22 e Maven 3.9+
- Python 3.10+ e `pip`
- (Opcional) **Ollama** instalado e um modelo leve: `ollama pull tinyllama`

## ▶️ Como Executar (sem .bat)

Abra dois terminais (PowerShell): um para o backend e outro para o frontend.

### 1) Backend (Spring Boot)

```powershell
cd backend
mvn -v
mvn clean package -DskipTests
java -jar target\jogo-forca-backend-1.0.0.jar
# alternativa durante o desenvolvimento:
# mvn spring-boot:run
```

Saúde do backend:

```powershell
Invoke-RestMethod http://localhost:8080/api/health
```

### 2) Frontend (Flask)

```powershell
cd frontend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Saúde do proxy (frontend → backend):

```powershell
Invoke-RestMethod http://localhost:5000/api/proxy/health
```

### 3) Acessar o jogo

Abra o navegador em: `http://localhost:5000`

## 🔌 Testes rápidos de API

Via proxy do frontend (recomendado no navegador/Postman):

- Criar jogo (PvC): `POST http://localhost:5000/api/proxy/game/new`
  Body:
  ```json
  { "mode": "pvc", "players": ["Marcos"] }
  ```
- Adivinhar letra: `POST http://localhost:5000/api/proxy/game/{id}/guess`
  Body:
  ```json
  { "letter": "A" }
  ```
- Próxima rodada: `POST http://localhost:5000/api/proxy/game/{id}/next-round`
- Estado do jogo: `GET http://localhost:5000/api/proxy/game/{id}`

Endpoints diretos do backend (sem proxy): substitua `http://localhost:5000/api/proxy` por `http://localhost:8080/api`.

## 📖 Swagger UI (testes via navegador)

Com o backend rodando, acesse a documentação e execute as rotas pelo navegador:

- Swagger UI: `http://localhost:8080/swagger-ui/`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

No Swagger UI, você pode:
- Explorar todos os endpoints (`/api/game/*`, `/api/health`).
- Clicar em "Try it out" para enviar requisições diretamente pelo browser.
- Preencher parâmetros como `gameId` e bodies JSON sem precisar do Postman.

## 🏆 Regras de pontuação

- **PvC**: melhor de 3 (primeiro a 2 vitórias). Não há empates.
- **PvP**: 2 jogadores (melhor de 3). 3–5 jogadores (primeiro a 2 vitórias).

## 💡 Dicas e troubleshooting

- Liberar portas 8080/5000 (se necessário; requer privilégios):
  ```powershell
  $ports = 8080,5000
  Get-NetTCPConnection -LocalPort $ports -State Listen |
    Select-Object -Expand OwningProcess -Unique |
    ForEach-Object { Stop-Process -Id $_ -Force }
  ```
- Ativação de venv bloqueada? Permitir scripts do PowerShell:
  ```powershell
  Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
  ```
- Ollama opcional: se indisponível, o backend usa fallback de palavra.
- Logs de erro do Flask: consulte `frontend\flask_err.log` (se configurado).

## 📚 Notas

- O arquivo `iniciar.bat` foi removido. Utilize os comandos acima.
- Estado do jogo é mantido em memória (não persistido). Reiniciar o backend limpa os jogos.

Aproveite o jogo! 🎉
