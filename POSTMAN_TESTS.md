# Guia de Testes da API com Postman

## Pré-requisitos
- Backend Spring Boot rodando em `http://localhost:8080`.
- Postman instalado: https://www.postman.com/downloads/

Iniciar o backend (na pasta `backend`):
```powershell
cd backend
mvn spring-boot:run
```

Opcional (via JAR, após `mvn clean package -DskipTests`):
```powershell
cd backend\target
java -jar jogo-forca-backend-1.0.0.jar
```

Health check:
```
GET http://localhost:8080/api/health
```

---

## Importando a coleção e o ambiente
1. Abra o Postman.
2. Vá em Import > Selecionar arquivo e escolha `postman_collection.json` (raiz do projeto).
3. Importe também `postman_environment.json`.
4. Selecione o ambiente "Jogo da Forca Local" no canto superior direito.
5. Após criar um jogo, copie o valor de `game_id` da resposta e atualize a variável `game_id` no ambiente.

---

## Fluxo sugerido de testes
1. Criar jogo (`POST {{base_url}}/api/game/new`) – escolha PvP/PvC e jogadores.
2. Submeter palavra (`POST {{base_url}}/api/game/{{game_id}}/submit-word`).
3. Adivinhar letra (`POST {{base_url}}/api/game/{{game_id}}/guess`).
4. Ver estado do jogo (`GET {{base_url}}/api/game/{{game_id}}`).
5. Iniciar próxima rodada (`POST {{base_url}}/api/game/{{game_id}}/next-round`).
6. Testar abandono (`POST {{base_url}}/api/game/{{game_id}}/abandon`).
7. Deletar jogo (`DELETE {{base_url}}/api/game/{{game_id}}`).

---

## Exemplos de corpos (JSON)
- Criar PvP 2 jogadores:
```json
{ "mode": "pvp", "players": ["Alice", "Bob"] }
```
- Criar PvC:
```json
{ "mode": "pvc", "players": ["Jogador1"] }
```
- Submeter palavra:
```json
{ "word": "exemplo", "hint": "Dica para a palavra", "generateHint": false }
```
- Adivinhar letra:
```json
{ "letter": "A" }
```
- Abandonar jogo:
```json
{ "player": "Alice" }
```

---

## Dicas
- Sempre copie `game_id` da resposta de criação.
- Use o Swagger UI para explorar rapidamente: `http://localhost:8080/swagger-ui/`.
- O frontend (Flask) não é necessário para testes de API no Postman.
