// Estado do jogo
let gameState = {
    gameId: null,
    mode: 'pvp',
    players: [],
    currentPlayer: null,
    isWordCreator: false
};

// Persistência local para manter sessão ao recarregar
const LS_GAME_ID = 'hangman_game_id';
const LS_PLAYER_NAME = 'hangman_player_name';

function getLocalPlayerName() {
    try { return (localStorage.getItem(LS_PLAYER_NAME) || '').trim(); } catch (_) { return ''; }
}

function hideWordModal() {
    const modal = document.getElementById('word-modal');
    if (modal) modal.classList.remove('active');
}

function setKeyboardEnabledForGuesser(data) {
    const keys = document.querySelectorAll('.key');
    const local = getLocalPlayerName();
    // Por padrão, desabilitar tudo
    keys.forEach(k => k.disabled = true);
    if (data.game_status === 'playing' && local && data.word_guesser === local) {
        // Habilitar apenas as teclas ainda não tentadas
        const guessed = new Set(data.guessed_letters || []);
        keys.forEach(k => {
            const letter = k.getAttribute('data-letter');
            if (!guessed.has(letter)) k.disabled = false;
        });
    }
}
// Ativar logs de debug via flag global (defina window.DEBUG=true no console para ver mais logs)
if (typeof window.DEBUG === 'undefined') { window.DEBUG = false; }
function debugLog(...args) {
    try { if (window.DEBUG) console.log('[DEBUG]', ...args); } catch (_) {}
}

// Configuração inicial
document.addEventListener('DOMContentLoaded', () => {
    setupModeSelection();
    createKeyboard();
});

function setupModeSelection() {
    const modeRadios = document.querySelectorAll('input[name="mode"]');
                debugLog('startGame', { mode: gameState.mode, players: gameState.players });
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
            // Polling de estado (auto-atualização)
            let pollIntervalId = null;
            function startPolling(intervalMs = 1500) {
                try { if (pollIntervalId) clearInterval(pollIntervalId); } catch (_) {}
                if (!gameState.gameId) return;
                pollIntervalId = setInterval(() => {
                    // Apenas atualiza se houver jogo
                    if (gameState.gameId) {
                        refreshGameState();
                    }
                }, intervalMs);
                debugLog('polling:start', { intervalMs });
            }
            function stopPolling() {
                try { if (pollIntervalId) clearInterval(pollIntervalId); } catch (_) {}
                pollIntervalId = null;
                debugLog('polling:stop');
            }
        document.getElementById('players-list').innerHTML = '';
        gameState.players = [];
    } else {
        playersInput.querySelector('h3').textContent = 'Adicionar Jogadores (2-5)';
    }
}
                if (screenId === 'game-screen') {
                    startPolling();
                } else {
                    stopPolling();
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
    if (index >= 0 && index < gameState.players.length) {
        gameState.players.splice(index, 1);
        updatePlayersList();
    }
}

async function startGame() {
    debugLog('startGame', { mode: gameState.mode, players: gameState.players });
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
            body: JSON.stringify({ mode: gameState.mode, players: gameState.players })
        });
        const data = await response.json();
        debugLog('startGame response', { ok: response.ok, data });
        if (response.ok) {
            gameState.gameId = data.game_id;
            try { localStorage.setItem(LS_GAME_ID, data.game_id); } catch (_) {}
            if (gameState.players && gameState.players.length === 1) {
                try { localStorage.setItem(LS_PLAYER_NAME, gameState.players[0]); } catch (_) {}
            }
            try {
                const newUrl = `${window.location.origin}/?game=${data.game_id}`;
                window.history.replaceState({}, document.title, newUrl);
            } catch (_) {}
            showScreen('game-screen');
            updateGameUI(data);
            if (data.mode === 'pvp' && data.game_status === 'waiting_word') {
                if (getLocalPlayerName() && getLocalPlayerName() === data.word_creator) {
                    showWordModal(data.word_creator);
                } else {
                    hideWordModal();
                }
                        const detail = (data && data.detail) ? data.detail : 'Erro desconhecido';
                        if (detail.includes('Jogo já terminou') || detail.includes('rodadas já foram jogadas')) {
                            // Sincroniza estado e mantém modal de resultado fechado, pois é fim de jogo
                            await refreshGameState();
                        } else {
                            alert('Erro ao iniciar próxima rodada: ' + detail);
                        }
                shareGame();
                const turnInfo = document.getElementById('turn-info');
                if (turnInfo) turnInfo.textContent = 'Aguardando outros jogadores entrarem via link...';
            }
            setKeyboardEnabledForGuesser(data);
        } else {
            alert('Erro ao criar jogo: ' + (data.detail || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('startGame error', error);
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
    document.getElementById('secret-word-input').value = '';
}

async function submitSecretWord() {
    debugLog('submitSecretWord');
    const input = document.getElementById('secret-word-input');
    const word = input.value.trim().toUpperCase();
    if (!word) { alert('Digite uma palavra!'); return; }
    if (!word.match(/^[A-ZÀ-Ú]+$/)) { alert('A palavra deve conter apenas letras!'); return; }
    if (word.length < 3) { alert('A palavra deve ter pelo menos 3 letras!'); return; }
    showLoading(true);
    try {
        const response = await fetch(`/api/proxy/game/${gameState.gameId}/submit-word`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word })
        });
        const data = await response.json();
        debugLog('submitSecretWord response', { ok: response.ok, data });
        if (response.ok) {
            document.getElementById('word-modal').classList.remove('active');
            await refreshGameState();
        } else {
            alert('Erro: ' + (data.detail || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('submitSecretWord error', error);
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
            
            // O modal será aberto pelo polling via updateGameUI() com dados completos
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
    const local = getLocalPlayerName();
    if (data.game_status === 'playing') {
        if (local && local === data.word_guesser) {
            turnInfo.textContent = 'É sua vez de adivinhar';
        } else {
            turnInfo.textContent = `${data.word_guesser} está adivinhando`;
        }
        turnInfo.classList.add('playing');
        turnInfo.classList.remove('waiting');
    } else if (data.game_status === 'waiting_word') {
        if (local && local === data.word_creator) {
            turnInfo.textContent = 'É sua vez de criar a palavra';
        } else {
            turnInfo.textContent = `O adversário ${data.word_creator} está inserindo a palavra...`;
        }
        turnInfo.classList.add('waiting');
        turnInfo.classList.remove('playing');
    } else {
        turnInfo.classList.remove('playing');
        turnInfo.classList.remove('waiting');
    }
    // Controlar modal de palavra: somente o criador vê
    if (data.mode === 'pvp') {
        const local = getLocalPlayerName();
        if (data.game_status === 'waiting_word') {
            if (local && local === data.word_creator) {
                showWordModal(data.word_creator);
            } else {
                hideWordModal();
            }
        } else {
            hideWordModal();
        }
    } else {
        hideWordModal();
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
    
    // Atualizar teclado: habilita somente para o adivinhador
    setKeyboardEnabledForGuesser(data);

    // Guardar último status e abrir modal automaticamente em fim de rodada/jogo
    try { gameState.lastStatus = gameState.lastStatus || ''; } catch (_) {}
    const modal = document.getElementById('result-modal');
    if ((data.game_status === 'round_finished' || data.game_status === 'game_finished')) {
        if (!modal.classList.contains('active')) {
            showResultModal(data);
        }
    }
    try { gameState.lastStatus = data.game_status; } catch (_) {}
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
    
    const isFinal = data.game_status === 'game_finished' || (data.game_status === 'round_finished' && data.current_round >= data.max_rounds);

    if (isFinal) {
        // Calcular vencedor(es) pelo placar
        const entries = Object.entries(data.scores || {});
        let top = -Infinity; let winners = [];
        entries.forEach(([name, score]) => {
            if (score > top) { top = score; winners = [name]; }
            else if (score === top) { winners.push(name); }
        });

        if (winners.length <= 1 && winners[0]) {
            winnerName.textContent = winners[0];
            resultMessage.textContent = `${winners[0]} venceu o jogo com ${top} ponto(s)!`;
        } else {
            winnerName.textContent = 'Empate!';
            resultMessage.textContent = `Empate com ${top} ponto(s): ${winners.join(', ')}`;
        }
        nextRoundSection.style.display = 'none';
        gameOverSection.style.display = 'flex';
        triggerConfetti();
    } else {
        winnerName.textContent = data.round_winner || '';
        resultMessage.textContent = `${data.round_winner} venceu esta rodada!`;
        nextRoundSection.style.display = 'block';
        gameOverSection.style.display = 'none';
    }
    
    modal.classList.add('active');
}

function triggerConfetti() {
    const container = document.getElementById('confetti-container');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#eab308', '#22c55e', '#a855f7'];
    const count = 120;
    for (let i = 0; i < count; i++) {
        const piece = document.createElement('span');
        piece.className = 'confetti-piece';
        piece.style.left = Math.random() * 100 + '%';
        const dur = 2.5 + Math.random() * 2.5; // 2.5s - 5s
        piece.style.animationDuration = dur + 's';
        piece.style.animationDelay = (Math.random() * 0.7) + 's';
        piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        piece.style.transform = `rotate(${Math.floor(Math.random()*360)}deg)`;
        container.appendChild(piece);
    }
    // Auto limpar após 7s
    setTimeout(() => { if (container) container.innerHTML = ''; }, 7000);
}

function startNewGameSamePlayers() {
    try {
        const players = Array.isArray(gameState.players) ? gameState.players : [];
        const mode = gameState.mode || 'pvp';
        if (players.length < 1) {
            alert('Sem jogadores para iniciar um novo jogo.');
            return;
        }
        showLoading(true);
        fetch('/api/proxy/game/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ mode, players })
        }).then(async (resp) => {
            const data = await resp.json();
            if (!resp.ok) {
                alert('Erro ao iniciar novo jogo: ' + (data.detail || 'Erro desconhecido'));
                return;
            }
            // Atualiza estado e URL
            gameState.gameId = data.game_id;
            gameState.mode = data.mode;
            gameState.players = data.players || players;
            try { localStorage.setItem(LS_GAME_ID, data.game_id); } catch (_) {}
            try {
                const newUrl = `${window.location.origin}/?game=${data.game_id}`;
                window.history.replaceState({}, document.title, newUrl);
            } catch (_) {}
            // Fecha modal, para confete e mostra tela
            document.getElementById('result-modal')?.classList.remove('active');
            const conf = document.getElementById('confetti-container');
            if (conf) conf.innerHTML = '';
            showScreen('game-screen');
            updateGameUI(data);
            startPolling();
            // Se aguardando palavra, mostra modal apenas ao criador
            if (data.mode === 'pvp' && data.game_status === 'waiting_word') {
                if (getLocalPlayerName() && getLocalPlayerName() === data.word_creator) {
                    showWordModal(data.word_creator);
                } else {
                    hideWordModal();
                }
            } else if (data.mode === 'pvp' && data.game_status === 'waiting_players') {
                shareGame();
            }
        }).catch((e) => {
            alert('Erro ao iniciar novo jogo: ' + e.message);
        }).finally(() => showLoading(false));
    } catch (e) {
        alert('Erro ao iniciar novo jogo: ' + e.message);
        showLoading(false);
    }
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
    const anchor = document.getElementById('share-link-anchor');
    if (anchor) {
        anchor.href = gameUrl;
        anchor.textContent = gameUrl;
    }
    
    // Gerar QR Code
    generateQRCode(gameUrl);
    
    // Mostrar modal
    document.getElementById('share-modal').classList.add('active');
}

function copyShareLink(btn) {
    const linkInput = document.getElementById('share-link');
    linkInput.focus();
    linkInput.select();
    linkInput.setSelectionRange(0, 99999); // Para mobile

    const value = linkInput.value;

    const onCopied = () => {
        if (btn) {
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = '✅ Copiado!';
            btn.style.backgroundColor = '#4CAF50';
            setTimeout(() => {
                btn.textContent = originalText;
                btn.style.backgroundColor = '';
                btn.disabled = false;
            }, 2000);
        }
    };

    // Tenta copiar como HTML (hyperlink) + texto simples
    if (navigator.clipboard && window.isSecureContext) {
        try {
            if (window.ClipboardItem) {
                const html = `<a href="${value}">${value}</a>`;
                const item = new ClipboardItem({
                    'text/plain': new Blob([value], { type: 'text/plain' }),
                    'text/html': new Blob([html], { type: 'text/html' })
                });
                navigator.clipboard.write([item]).then(onCopied).catch(() => {
                    navigator.clipboard.writeText(value).then(onCopied).catch(() => {
                        // Fallback: execCommand
                        try {
                            const ok = document.execCommand('copy');
                            if (ok) onCopied(); else throw new Error('copy command falhou');
                        } catch (err) {
                            alert('Erro ao copiar: ' + err);
                        }
                    });
                });
                return;
            } else {
                // Sem ClipboardItem, copia texto simples
                navigator.clipboard.writeText(value).then(onCopied).catch(() => { /* fallback abaixo */ });
            }
        } catch (e) {
            // Continua para fallback
        }
    }

    // Fallback imediato: execCommand
    try {
        const ok = document.execCommand('copy');
        if (ok) onCopied(); else throw new Error('copy command falhou');
    } catch (err) {
        alert('Erro ao copiar: ' + err);
    }
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
    
    qrContainer.appendChild(img);
}

// Verificar se há um ID de jogo na URL ao carregar ou retomar sessão salva
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('game');
    const savedId = localStorage.getItem(LS_GAME_ID);
    if (gameId) {
        joinExistingGame(gameId, { tryResume: true });
    } else if (savedId) {
        resumeGame(savedId);
    }
});

// Retomar jogo existente sem realizar join (para quem já está na lista de players)
async function resumeGame(gameId) {
    showLoading(true);
    try {
        const response = await fetch(`/api/proxy/game/${gameId}`);
        const data = await response.json();
        if (response.ok) {
            gameState.gameId = gameId;
            gameState.mode = data.mode;
            gameState.players = data.players || [];
            showScreen('game-screen');
            updateGameUI(data);
            startPolling();
            try {
                const url = new URL(window.location.href);
                url.searchParams.set('game', gameId);
                window.history.replaceState({}, document.title, url.toString());
            } catch (_) {}
        } else {
            localStorage.removeItem(LS_GAME_ID);
        }
    } catch (e) {
        console.error('Falha ao retomar jogo:', e);
    } finally {
        showLoading(false);
    }
}

async function joinExistingGame(gameId, opts = { tryResume: false }) {
    showLoading(true);
    
    try {
        const response = await fetch(`/api/proxy/game/${gameId}`);
        const data = await response.json();
        
        if (response.ok) {
            // Se já existe um nome local e ele está nos players, apenas exiba o jogo
            const localName = (localStorage.getItem(LS_PLAYER_NAME) || '').trim();
            if (opts.tryResume && localName && (data.players || []).includes(localName)) {
                gameState.gameId = gameId;
                gameState.mode = data.mode;
                gameState.players = data.players || [];
                showScreen('game-screen');
                updateGameUI(data);
                startPolling();
                try {
                    const url = new URL(window.location.href);
                    url.searchParams.set('game', gameId);
                    window.history.replaceState({}, document.title, url.toString());
                } catch (_) {}
                showLoading(false);
                return;
            }

            // Fluxo de join para novos participantes
            let name = '';
            while (!name) {
                name = prompt('Digite seu nome para entrar no jogo:')?.trim();
                if (name === null) break;
            }
            if (!name) {
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
                showLoading(false);
                return;
            }

            try { localStorage.setItem(LS_GAME_ID, gameId); } catch (_) {}
            try { localStorage.setItem(LS_PLAYER_NAME, name); } catch (_) {}

            gameState.gameId = gameId;
            gameState.mode = joined.mode;
            gameState.players = joined.players;

            showScreen('game-screen');
            updateGameUI(joined);
            startPolling();

            if (joined.mode === 'pvp' && joined.game_status === 'waiting_word') {
                if (getLocalPlayerName() && getLocalPlayerName() === joined.word_creator) {
                    showWordModal(joined.word_creator);
                } else {
                    hideWordModal();
                }
            }

            try {
                const url = new URL(window.location.href);
                url.searchParams.set('game', gameId);
                window.history.replaceState({}, document.title, url.toString());
            } catch (_) {}

            alert('✅ Você entrou no jogo compartilhado!');
        } else {
            alert('❌ Jogo não encontrado ou já finalizado: ' + (data.detail || 'Erro desconhecido'));
            try { localStorage.removeItem(LS_GAME_ID); } catch (_) {}
            try { localStorage.removeItem(LS_PLAYER_NAME); } catch (_) {}
            try { window.history.replaceState({}, document.title, '/'); } catch (_) {}
        }
    } catch (error) {
        alert('❌ Erro ao conectar com o jogo: ' + error.message);
        // Mantém ?game= para tentar novamente
    } finally {
        showLoading(false);
    }
}
