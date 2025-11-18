# Arquivo de exemplo para testes da API no Insomnia

## Coleção: Jogo da Forca API

### 1. Criar Jogo PvP (2 jogadores)
POST http://localhost:8000/api/game/new
Content-Type: application/json

{
  "mode": "pvp",
  "players": ["Alice", "Bob"]
}

---

### 2. Criar Jogo PvP (5 jogadores)
POST http://localhost:8000/api/game/new
Content-Type: application/json

{
  "mode": "pvp",
  "players": ["Ana", "Bruno", "Carlos", "Diana", "Eduardo"]
}

---

### 3. Criar Jogo PvC
POST http://localhost:8000/api/game/new
Content-Type: application/json

{
  "mode": "pvc",
  "players": ["Jogador1"]
}

---

### 4. Submeter Palavra (substitua GAME_ID)
POST http://localhost:8000/api/game/GAME_ID/submit-word
Content-Type: application/json

{
  "word": "PYTHON"
}

---

### 5. Adivinhar Letra A (substitua GAME_ID)
POST http://localhost:8000/api/game/GAME_ID/guess
Content-Type: application/json

{
  "letter": "A"
}

---

### 6. Adivinhar Letra E (substitua GAME_ID)
POST http://localhost:8000/api/game/GAME_ID/guess
Content-Type: application/json

{
  "letter": "E"
}

---

### 7. Obter Status do Jogo (substitua GAME_ID)
GET http://localhost:8000/api/game/GAME_ID

---

### 8. Próxima Rodada (substitua GAME_ID)
POST http://localhost:8000/api/game/GAME_ID/next-round
Content-Type: application/json

---

### 9. Listar Todos os Jogos
GET http://localhost:8000/api/games

---

### 10. Deletar Jogo (substitua GAME_ID)
DELETE http://localhost:8000/api/game/GAME_ID

---

### 11. Health Check
GET http://localhost:8000/

---

## Fluxo Completo de Teste PvP:

1. Criar jogo novo (rota 1) - copiar o game_id da resposta
2. Submeter palavra (rota 4) - usar o game_id copiado
3. Fazer várias tentativas (rotas 5-6) - usar o game_id copiado
4. Verificar status (rota 7)
5. Quando rodada terminar, iniciar próxima (rota 8)
6. Repetir passos 2-5 até jogo terminar

## Fluxo Completo de Teste PvC:

1. Criar jogo novo (rota 3) - copiar o game_id da resposta
2. IA já criou a palavra automaticamente
3. Fazer várias tentativas (rotas 5-6)
4. Verificar status (rota 7)
5. Quando rodada terminar, iniciar próxima (rota 8)
6. Repetir passos 3-5 até jogo terminar
