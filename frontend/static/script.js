// Estado do jogo
let gameState = {
    gameId: null,
    mode: 'pvp',
    players: [],
    currentPlayer: null,
    isWordCreator: false
};

// Configuração inicial
document.addEventListener('DOMContentLoaded', () => {
    setupModeSelection();
    createKeyboard();
});

function setupModeSelection() {
    const modeRadios = document.querySelectorAll('input[name="mode"]');
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            gameState.mode = e.target.value;
            updatePlayersInput();
        });
    });
}

function updatePlayersInput() {
    const playersInput = document.getElementById('players-input');
    if (gameState.mode === 'pvc') {
        playersInput.querySelector('h3').textContent = 'Nome do Jogador';
        document.getElementById('players-list').innerHTML = '';
        gameState.players = [];
    } else {
        playersInput.querySelector('h3').textContent = 'Adicionar Jogadores (2-5)';
    }
}

function addPlayer() {
    const input = document.getElementById('player-name-input');
    const playerName = input.value.trim();
    
    if (!playerName) {
        alert('Digite um nome para o jogador!');
        return;
    }
    
    if (gameState.mode === 'pvc') {
        if (gameState.players.length >= 1) {
            alert('No modo Jogador vs CPU, apenas 1 jogador é permitido!');
            return;
        }
    } else {
        if (gameState.players.length >= 5) {
            alert('Máximo de 5 jogadores!');
            return;
        }
        
        if (gameState.players.includes(playerName)) {
            alert('Este jogador já foi adicionado!');
            return;
        }
    }
    
    gameState.players.push(playerName);
    updatePlayersList();
    input.value = '';
}

function updatePlayersList() {
    const list = document.getElementById('players-list');
    list.innerHTML = gameState.players.map((player, index) => `
        <li class="player-tag">
            ${player}
            <button onclick="removePlayer(${index})">×</button>
        </li>
    `).join('');
}

function removePlayer(index) {
    gameState.players.splice(index, 1);
    updatePlayersList();
}

async function startGame() {
    if (gameState.mode === 'pvc' && gameState.players.length !== 1) {
        alert('Adicione 1 jogador para o modo Jogador vs CPU!');
        return;
    }
    
    // PvP: agora pode iniciar com 1 jogador e convidar os demais
    if (gameState.mode === 'pvp' && gameState.players.length < 1) {
        alert('Adicione pelo menos 1 jogador para iniciar no modo PvP!');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch('/api/proxy/game/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                mode: gameState.mode,
                players: gameState.players
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            gameState.gameId = data.game_id;
            showScreen('game-screen');
            updateGameUI(data);
            
            // Se for PvP, mostrar modal adequado
            if (data.mode === 'pvp' && data.game_status === 'waiting_word') {
                showWordModal(data.word_creator);
            } else if (data.mode === 'pvp' && data.game_status === 'waiting_players') {
                // Abrir modal de compartilhamento automaticamente
                shareGame();
                const turnInfo = document.getElementById('turn-info');
                if (turnInfo) {
                    turnInfo.textContent = 'Aguardando outros jogadores entrarem via link...';
                }
            }
        } else {
            alert('Erro ao criar jogo: ' + (data.detail || 'Erro desconhecido'));
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function showWordModal(creatorName) {
    const modal = document.getElementById('word-modal');
    const creatorNameEl = document.getElementById('word-creator-name');
    creatorNameEl.textContent = `${creatorName}, é sua vez de criar a palavra!`;
    modal.classList.add('active');
    
    // Limpar input
    document.getElementById('secret-word-input').value = '';
}

async function submitSecretWord() {
    const input = document.getElementById('secret-word-input');
    const word = input.value.trim().toUpperCase();
    
    if (!word) {
        alert('Digite uma palavra!');
        return;
    }
    
    if (!word.match(/^[A-ZÀ-Ú]+$/)) {
        alert('A palavra deve conter apenas letras!');
        return;
    }
    
    if (word.length < 3) {
        alert('A palavra deve ter pelo menos 3 letras!');
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`/api/proxy/game/${gameState.gameId}/submit-word`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word: word })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Fechar modal
            document.getElementById('word-modal').classList.remove('active');
            
            // Atualizar jogo
            await refreshGameState();
        } else {
            alert('Erro: ' + (data.detail || 'Erro desconhecido'));
        }
    } catch (error) {
        alert('Erro ao enviar palavra: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function createKeyboard() {
    const keyboard = document.getElementById('keyboard');
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    
    keyboard.innerHTML = letters.map(letter => `
        <button class="key" data-letter="${letter}" onclick="guessLetter('${letter}')">${letter}</button>
    `).join('');
}

async function guessLetter(letter) {
    showLoading(true);
    
    try {
        const response = await fetch(`/api/proxy/game/${gameState.gameId}/guess`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ letter: letter })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Desabilitar tecla
            const key = document.querySelector(`[data-letter="${letter}"]`);
            key.disabled = true;
            
            // Atualizar UI
            await refreshGameState();
            
            // Se rodada terminou, mostrar resultado
            if (data.game_status === 'round_finished' || data.game_status === 'game_finished') {
                setTimeout(() => {
                    showResultModal(data);
                }, 1000);
            }
        } else {
            alert('Erro: ' + (data.detail || 'Erro desconhecido'));
        }
    } catch (error) {
        alert('Erro ao enviar tentativa: ' + error.message);
    } finally {
        showLoading(false);
    }
}

async function refreshGameState() {
    try {
        const response = await fetch(`/api/proxy/game/${gameState.gameId}`);
        const data = await response.json();
        
        if (response.ok) {
            updateGameUI(data);
        }
    } catch (error) {
        console.error('Erro ao atualizar estado do jogo:', error);
    }
}

function updateGameUI(data) {
    // Atualizar placar
    const scoresDiv = document.getElementById('scores');
    scoresDiv.innerHTML = Object.entries(data.scores).map(([player, score]) => `
        <div class="score-item">
            <div class="player-name">${player}</div>
            <div class="player-score">${score}</div>
        </div>
    `).join('');
    
    // Atualizar rodada
    const roundNumber = document.getElementById('round-number');
    roundNumber.textContent = `Rodada ${data.current_round}/${data.max_rounds}`;
    
    // Atualizar turno
    const turnInfo = document.getElementById('turn-info');
    if (data.game_status === 'playing') {
        turnInfo.textContent = `${data.word_guesser} está adivinhando`;
    } else if (data.game_status === 'waiting_word') {
        turnInfo.textContent = `Aguardando ${data.word_creator} criar palavra`;
    }
    
    // Atualizar palavra
    if (data.word_length) {
        const wordDisplay = document.getElementById('word-display');
        const word = '_'.repeat(data.word_length).split('');
        
        // Preencher letras corretas
        Object.entries(data.correct_positions).forEach(([letter, positions]) => {
            positions.forEach(pos => {
                word[pos] = letter;
            });
        });
        
        wordDisplay.innerHTML = word.map(char => `
            <div class="letter-box">${char === '_' ? '' : char}</div>
        `).join('');
    }
    
    // Atualizar tentativas
    const attemptsEl = document.getElementById('attempts-left');
    attemptsEl.textContent = `Tentativas: ${data.attempts_left}/${data.max_attempts}`;
    
    // Atualizar boneco
    updateHangman(data.max_attempts - data.attempts_left);
    
    // Atualizar letras tentadas
    const guessedLettersDiv = document.getElementById('guessed-letters');
    guessedLettersDiv.innerHTML = data.guessed_letters.map(letter => {
        const isCorrect = Object.keys(data.correct_positions).includes(letter);
        return `<div class="guessed-letter ${isCorrect ? 'correct' : 'incorrect'}">${letter}</div>`;
    }).join('');
    
    // Atualizar teclado
    data.guessed_letters.forEach(letter => {
        const key = document.querySelector(`[data-letter="${letter}"]`);
        if (key) key.disabled = true;
    });
    
    // Desabilitar teclado se não estiver jogando
    if (data.game_status !== 'playing') {
        document.querySelectorAll('.key').forEach(key => key.disabled = true);
    }
}

function updateHangman(mistakes) {
    const parts = ['head', 'body', 'left-arm', 'right-arm', 'left-leg', 'right-leg'];
    
    // Esconder todas as partes
    parts.forEach(part => {
        document.getElementById(part).classList.remove('visible');
    });
    
    // Mostrar partes de acordo com erros
    for (let i = 0; i < mistakes && i < parts.length; i++) {
        document.getElementById(parts[i]).classList.add('visible');
    }
}

function showResultModal(data) {
    const modal = document.getElementById('result-modal');
    const winnerName = document.getElementById('winner-name');
    const resultMessage = document.getElementById('result-message');
    const nextRoundSection = document.getElementById('next-round-section');
    const gameOverSection = document.getElementById('game-over-section');
    
    winnerName.textContent = data.round_winner || data.game_winner;
    
    if (data.game_status === 'game_finished') {
        resultMessage.textContent = `${data.game_winner} venceu o jogo com ${data.scores[data.game_winner]} ponto(s)!`;
        nextRoundSection.style.display = 'none';
        gameOverSection.style.display = 'block';
    } else {
        resultMessage.textContent = `${data.round_winner} venceu esta rodada!`;
        nextRoundSection.style.display = 'block';
        gameOverSection.style.display = 'none';
    }
    
    modal.classList.add('active');
}

async function nextRound() {
    const modal = document.getElementById('result-modal');
    modal.classList.remove('active');
    
    showLoading(true);
    
    try {
        const response = await fetch(`/api/proxy/game/${gameState.gameId}/next-round`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Resetar teclado
            document.querySelectorAll('.key').forEach(key => {
                key.disabled = false;
            });
            
            // Resetar boneco
            updateHangman(0);
            
            updateGameUI(data);
            
            // Se for PvP, mostrar modal para novo criador
            if (data.mode === 'pvp' && data.game_status === 'waiting_word') {
                showWordModal(data.word_creator);
            }
        } else {
            alert('Erro ao iniciar próxima rodada: ' + (data.detail || 'Erro desconhecido'));
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor: ' + error.message);
    } finally {
        showLoading(false);
    }
}

function backToMenu() {
    const modal = document.getElementById('result-modal');
    modal.classList.remove('active');
    
    // Resetar estado
    gameState = {
        gameId: null,
        mode: 'pvp',
        players: [],
        currentPlayer: null,
        isWordCreator: false
    };
    
    // Voltar para tela de setup
    showScreen('setup-screen');
    
    // Resetar formulário
    document.getElementById('players-list').innerHTML = '';
    document.getElementById('player-name-input').value = '';
    document.querySelectorAll('input[name="mode"]')[0].checked = true;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function showLoading(show) {
    const modal = document.getElementById('loading-modal');
    if (show) {
        modal.classList.add('active');
    } else {
        modal.classList.remove('active');
    }
}

// Permitir Enter para adicionar jogador
document.getElementById('player-name-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addPlayer();
    }
});

// Permitir Enter para submeter palavra
document.getElementById('secret-word-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitSecretWord();
    }
});

// Funções de compartilhamento
function shareGame() {
    if (!gameState.gameId) {
        alert('Nenhum jogo ativo para compartilhar!');
        return;
    }

    // Se estiver em localhost, use o IP local do servidor para gerar link válido na rede
    const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    const base = (isLocal && window.LOCAL_INVITE_BASE) ? window.LOCAL_INVITE_BASE : window.location.origin;
    const gameUrl = `${base}/?game=${gameState.gameId}`;
    document.getElementById('share-link').value = gameUrl;
    
    // Gerar QR Code
    generateQRCode(gameUrl);
    
    // Mostrar modal
    document.getElementById('share-modal').classList.add('active');
}

function copyShareLink() {
    const linkInput = document.getElementById('share-link');
    linkInput.select();
    linkInput.setSelectionRange(0, 99999); // Para mobile
    
    navigator.clipboard.writeText(linkInput.value).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Copiado!';
        btn.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.backgroundColor = '';
        }, 2000);
    }).catch(err => {
        alert('Erro ao copiar: ' + err);
    });
}

function closeShareModal() {
    document.getElementById('share-modal').classList.remove('active');
}

function generateQRCode(url) {
    const qrContainer = document.getElementById('share-qr');
    qrContainer.innerHTML = '';
    
    // Criar QR code usando API do Google Charts (simples e sem dependências)
    const qrSize = 200;
    const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chl=${encodeURIComponent(url)}&chs=${qrSize}x${qrSize}`;
    
    const img = document.createElement('img');
    img.src = qrUrl;
    img.alt = 'QR Code';
    img.style.width = '200px';
    img.style.height = '200px';
    
    qrContainer.appendChild(img);
}

// Verificar se há um ID de jogo na URL ao carregar
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    
    if (gameId) {
        // Tentar entrar no jogo existente
        joinExistingGame(gameId);
    }
});

async function joinExistingGame(gameId) {
    showLoading(true);
    
    try {
        const response = await fetch(`/api/proxy/game/${gameId}`);
        const data = await response.json();
        
        if (response.ok) {
            // Solicitar nome do jogador para entrar
            let name = '';
            while (!name) {
                name = prompt('Digite seu nome para entrar no jogo:')?.trim();
                if (name === null) break;
            }

            if (!name) {
                window.history.replaceState({}, document.title, '/');
                showLoading(false);
                return;
            }

            const joinResp = await fetch(`/api/proxy/game/${gameId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player: name })
            });
            const joined = await joinResp.json();

            if (!joinResp.ok) {
                alert('Não foi possível entrar no jogo: ' + (joined.detail || 'Erro desconhecido'));
                window.history.replaceState({}, document.title, '/');
                showLoading(false);
                return;
            }

            gameState.gameId = gameId;
            gameState.mode = joined.mode;
            gameState.players = joined.players;

            showScreen('game-screen');
            updateGameUI(joined);

            if (joined.mode === 'pvp' && joined.game_status === 'waiting_word') {
                showWordModal(joined.word_creator);
            }

            alert('✅ Você entrou no jogo compartilhado!');

            window.history.replaceState({}, document.title, '/');
        } else {
            alert('❌ Jogo não encontrado ou já finalizado: ' + (data.detail || 'Erro desconhecido'));
            // Limpar URL em caso de erro
            window.history.replaceState({}, document.title, '/');
        }
    } catch (error) {
        alert('❌ Erro ao conectar com o jogo: ' + error.message);
        window.history.replaceState({}, document.title, '/');
    } finally {
        showLoading(false);
    }
}
