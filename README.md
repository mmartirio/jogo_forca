# 🎮 Jogo da Forca - FastAPI + Flask + Ollama

Jogo da Forca completo com modo Jogador vs Jogador (até 5 jogadores) e Jogador vs CPU (IA usando Ollama).

## 📋 Funcionalidades

- **Modo PvP**: 2 a 5 jogadores competindo
- **Modo PvC**: Jogador contra IA (Ollama)
- **Sistema de pontuação**: Melhor de 3 para 2 jogadores, primeiro a 2 pontos para mais jogadores
- **Interface responsiva**: UI/UX amigável e moderna
- **Seleção aleatória**: Escolha automática de quem cria a palavra no PvP
- **Modal secreto**: Apenas o criador da palavra vê a entrada
- **API REST**: Rotas bem definidas para teste via Insomnia

## 🛠️ Tecnologias

- **Backend**: FastAPI (Python)
- **Frontend**: Flask (Python) + HTML/CSS/JavaScript
- **IA**: Ollama (modelo tinyllama)
- **Sem banco de dados**: Armazenamento em memória

## 📦 Pré-requisitos

1. **Python 3.8+** instalado
2. **Ollama** instalado e rodando localmente
   - Download: https://ollama.ai/
   - Instalar modelo leve: `ollama pull tinyllama`

## 🚀 Instalação

### 1. Instalar Dependências do Backend

```powershell
cd backend
pip install -r requirements.txt
```

### 2. Instalar Dependências do Frontend

```powershell
cd ..\frontend
pip install -r requirements.txt
```

## ▶️ Como Executar

### 1. Iniciar Ollama (se ainda não estiver rodando)

Abra um terminal e execute:

```powershell
ollama serve
```

Em outro terminal, baixe o modelo leve:

```powershell
ollama pull tinyllama
```

### 2. Iniciar o Backend (FastAPI)

```powershell
cd backend
python main.py
```

O backend estará disponível em: `http://localhost:8000`

### 3. Iniciar o Frontend (Flask)

Abra outro terminal:

```powershell
cd frontend
python app.py
```

O frontend estará disponível em: `http://localhost:5000`

### 4. Acessar o Jogo

Abra seu navegador e acesse: `http://localhost:5000`

## 🎯 Como Jogar

### Modo Jogador vs Jogador (PvP)

1. Selecione "Jogador vs Jogador"
2. Adicione de 2 a 5 jogadores
3. Clique em "Iniciar Jogo"
4. O sistema escolhe aleatoriamente quem cria a palavra
5. Um modal aparece apenas para o criador inserir a palavra
6. O outro jogador começa a adivinhar usando o teclado virtual
7. Ganhe 2 pontos para vencer (melhor de 3 para 2 jogadores)

### Modo Jogador vs CPU (PvC)

1. Selecione "Jogador vs CPU"
2. Adicione 1 jogador
3. Clique em "Iniciar Jogo"
4. A IA (Ollama) gera automaticamente uma palavra
5. Adivinhe a palavra usando o teclado virtual
6. Primeiro a 2 pontos vence

## 🔌 Testando a API com Insomnia

### Rotas Disponíveis

#### 1. Criar Novo Jogo
**POST** `http://localhost:8000/api/game/new`

Body (JSON):
```json
{
  "mode": "pvp",
  "players": ["Alice", "Bob"]
}
```
ou
```json
{
  "mode": "pvc",
  "players": ["Alice"]
}
```

#### 2. Submeter Palavra Secreta (apenas PvP)
**POST** `http://localhost:8000/api/game/{game_id}/submit-word`

Body (JSON):
```json
{
  "word": "PYTHON"
}
```

#### 3. Adivinhar Letra
**POST** `http://localhost:8000/api/game/{game_id}/guess`

Body (JSON):
```json
{
  "letter": "A"
}
```

#### 4. Obter Status do Jogo
**GET** `http://localhost:8000/api/game/{game_id}`

#### 5. Iniciar Próxima Rodada
**POST** `http://localhost:8000/api/game/{game_id}/next-round`

#### 6. Deletar Jogo
**DELETE** `http://localhost:8000/api/game/{game_id}`

#### 7. Listar Todos os Jogos
**GET** `http://localhost:8000/api/games`

## 📱 Responsividade

A interface é totalmente responsiva e funciona em:
- Desktop (1920px+)
- Tablets (768px - 1024px)
- Smartphones (320px - 767px)

## 🎨 Características da Interface

- **Design moderno**: Gradiente roxo com elementos arredondados
- **Animações suaves**: Transições e efeitos visuais
- **Modais elegantes**: Para criação de palavra e resultado
- **Placar em tempo real**: Acompanhe a pontuação
- **Teclado virtual**: Clique nas letras para adivinhar
- **Boneco da forca**: Desenho SVG que aparece progressivamente
- **Centralizacao**: Todos componentes centralizados

## 🏆 Sistema de Pontuação

- **2 Jogadores**: Melhor de 3 (primeiro a 2 pontos vence)
- **3-5 Jogadores**: Primeiro jogador a fazer 2 pontos vence
- **Modo PvC**: Primeiro a 2 pontos (jogador ou CPU) vence

## 🐛 Troubleshooting

### Ollama não está respondendo
- Verifique se o Ollama está rodando: `ollama serve`
- Verifique se o modelo está instalado: `ollama list`
- Se não tiver o tinyllama, instale: `ollama pull tinyllama`

### Erro de CORS
- Certifique-se de que o backend está rodando na porta 8000
- Verifique as configurações de CORS no arquivo `backend/main.py`

### Frontend não conecta ao backend
- Verifique se ambos servidores estão rodando
- Backend: `http://localhost:8000`
- Frontend: `http://localhost:5000`

## 📝 Observações

- Os jogos são armazenados em memória e serão perdidos ao reiniciar o servidor
- Para produção, considere adicionar persistência com Redis ou banco de dados
- O modelo Ollama pode demorar alguns segundos na primeira execução
- Se o Ollama falhar, o sistema usa palavras padrão como fallback

## 🎮 Exemplo de Fluxo de Jogo (PvP)

1. Alice e Bob iniciam um jogo
2. Sistema escolhe Alice para criar a palavra
3. Alice vê modal secreto e digita "CODIGO"
4. Bob vê 6 espaços vazios e começa a adivinhar
5. Bob tenta "C" - correto! (aparece nas posições)
6. Bob tenta "X" - errado! (boneco começa a aparecer)
7. Bob completa a palavra e ganha a rodada
8. Modal de vitória aparece com troféu
9. Próxima rodada começa com papéis invertidos
10. Primeiro a 2 pontos vence o jogo

Aproveite o jogo! 🎉
