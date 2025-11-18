package com.jogoforca.service;

import com.jogoforca.model.Game;
import com.jogoforca.model.GameConfig;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService {

    private final Map<String, Game> games = new ConcurrentHashMap<>();
    private final OllamaService ollamaService;
    private final Random random = new Random();

    public GameService(OllamaService ollamaService) {
        this.ollamaService = ollamaService;
    }

    public Game createGame(GameConfig config) {
        validateConfig(config);

        String gameId = generateGameId();
        Game game = new Game();
        game.setGameId(gameId);
        game.setMode(config.getMode());
        game.setPlayers(config.getPlayers());
        game.setCurrentRound(1);

        // Determinar número máximo de rodadas
        int maxRounds;
        if ("pvc".equals(config.getMode())) {
            // PvC: melhor de 3 para evitar empates
            maxRounds = 3;
        } else if (config.getPlayers().size() == 2) {
            // PvP com 2 jogadores: melhor de 3
            maxRounds = 3;
        } else {
            // PvP com mais jogadores: 2 rodadas
            maxRounds = 2;
        }
        game.setMaxRounds(maxRounds);

        // Inicializar scores
        Map<String, Integer> scores = new HashMap<>();
        for (String player : config.getPlayers()) {
            scores.put(player, 0);
        }
        if ("pvc".equals(config.getMode())) {
            scores.put("CPU", 0);
        }
        game.setScores(scores);

        game.setGameStatus("waiting_word");

        // Configurar papéis
        if ("pvp".equals(config.getMode())) {
            if (config.getPlayers().size() >= 2) {
                int creatorIndex = random.nextInt(config.getPlayers().size());
                game.setWordCreator(config.getPlayers().get(creatorIndex));
                game.setWordGuesser(config.getPlayers().get((creatorIndex + 1) % config.getPlayers().size()));
                game.setGameStatus("waiting_word");
            } else {
                // Aguardando mais jogadores entrarem via link de convite
                game.setGameStatus("waiting_players");
            }
        } else {
            // PvC
            game.setWordCreator("CPU");
            game.setWordGuesser(config.getPlayers().get(0));
            String word = ollamaService.generateWord();
            game.setSecretWord(word);
            game.setWordLength(word.length());
            game.setGameStatus("playing");
        }

        games.put(gameId, game);
        return game;
    }

    public Game joinGame(String gameId, String playerName) {
        Game game = getGame(gameId);

        if (!"pvp".equals(game.getMode())) {
            throw new IllegalStateException("Apenas jogos PvP aceitam convites");
        }

        if (playerName == null || playerName.trim().isEmpty()) {
            throw new IllegalArgumentException("Nome do jogador é obrigatório");
        }

        if (game.getPlayers().contains(playerName)) {
            throw new IllegalArgumentException("Este jogador já está no jogo");
        }

        if (game.getPlayers().size() >= 5) {
            throw new IllegalStateException("Limite de jogadores atingido");
        }

        if ("playing".equals(game.getGameStatus())) {
            throw new IllegalStateException("Jogo já em andamento");
        }

        game.getPlayers().add(playerName);

        // Se agora houver pelo menos 2 jogadores e ainda estamos aguardando jogadores,
        // definir papéis
        if (game.getPlayers().size() >= 2 && "waiting_players".equals(game.getGameStatus())) {
            int creatorIndex = random.nextInt(game.getPlayers().size());
            game.setWordCreator(game.getPlayers().get(creatorIndex));
            game.setWordGuesser(game.getPlayers().get((creatorIndex + 1) % game.getPlayers().size()));
            game.setGameStatus("waiting_word");

            // Ajustar número de rodadas para 2 jogadores
            if (game.getPlayers().size() == 2) {
                game.setMaxRounds(3);
            }
        }

        return game;
    }

    public Game submitWord(String gameId, String word) {
        Game game = getGame(gameId);

        if (!"pvp".equals(game.getMode())) {
            throw new IllegalStateException("Esta ação só é válida para modo PvP");
        }

        if (!"waiting_word".equals(game.getGameStatus())) {
            throw new IllegalStateException("Não é possível submeter palavra neste momento");
        }

        word = word.toUpperCase().trim();

        if (!word.matches("[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ]+")) {
            throw new IllegalArgumentException("Palavra deve conter apenas letras");
        }

        game.setSecretWord(word);
        game.setWordLength(word.length());
        game.setGameStatus("playing");

        return game;
    }

    public Map<String, Object> guessLetter(String gameId, String letter) {
        Game game = getGame(gameId);

        if (!"playing".equals(game.getGameStatus())) {
            throw new IllegalStateException("Jogo não está em andamento");
        }

        letter = letter.toUpperCase().trim();

        if (!letter.matches("[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ]")) {
            throw new IllegalArgumentException("Deve enviar apenas uma letra");
        }

        if (game.getGuessedLetters().contains(letter)) {
            throw new IllegalArgumentException("Letra já foi tentada");
        }

        game.getGuessedLetters().add(letter);

        // Verificar se letra está na palavra
        String secretWord = game.getSecretWord();
        List<Integer> positions = new ArrayList<>();
        for (int i = 0; i < secretWord.length(); i++) {
            if (secretWord.charAt(i) == letter.charAt(0)) {
                positions.add(i);
            }
        }

        boolean isCorrect = !positions.isEmpty();

        if (isCorrect) {
            game.getCorrectPositions().put(letter, positions);
        } else {
            game.setAttemptsLeft(game.getAttemptsLeft() - 1);
        }

        // Verificar se palavra foi completada
        boolean allLettersFound = secretWord.chars()
                .mapToObj(c -> String.valueOf((char) c))
                .allMatch(c -> game.getCorrectPositions().containsKey(c));

        String revealedWord = null;

        if (allLettersFound) {
            game.setRoundWinner(game.getWordGuesser());
            game.getScores().put(game.getWordGuesser(),
                    game.getScores().get(game.getWordGuesser()) + 1);
            game.setGameStatus("round_finished");
            revealedWord = secretWord;
        } else if (game.getAttemptsLeft() <= 0) {
            game.setRoundWinner(game.getWordCreator());
            game.getScores().put(game.getWordCreator(),
                    game.getScores().get(game.getWordCreator()) + 1);
            game.setGameStatus("round_finished");
            revealedWord = secretWord;
        }

        // Verificar se jogo terminou
        if ("round_finished".equals(game.getGameStatus())) {
            checkGameFinished(game);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("letter", letter);
        result.put("is_correct", isCorrect);
        result.put("positions", positions);
        result.put("attempts_left", game.getAttemptsLeft());
        result.put("game_status", game.getGameStatus());
        result.put("round_winner", game.getRoundWinner());
        result.put("revealed_word", revealedWord);

        return result;
    }

    public Game startNextRound(String gameId) {
        Game game = getGame(gameId);

        if (!"round_finished".equals(game.getGameStatus()) && !"game_finished".equals(game.getGameStatus())) {
            throw new IllegalStateException("Rodada atual ainda não terminou");
        }

        if ("game_finished".equals(game.getGameStatus())) {
            throw new IllegalStateException("Jogo já terminou");
        }

        // Verificar se ainda há rodadas disponíveis
        if (game.getCurrentRound() >= game.getMaxRounds()) {
            throw new IllegalStateException("Todas as rodadas já foram jogadas");
        }

        // Resetar estado da rodada
        game.setCurrentRound(game.getCurrentRound() + 1);
        game.setGuessedLetters(new ArrayList<>());
        game.setCorrectPositions(new HashMap<>());
        game.setAttemptsLeft(6);
        game.setSecretWord(null);
        game.setWordLength(null);
        game.setRoundWinner(null);
        game.setGameStatus("waiting_word");

        // Trocar papéis
        if ("pvp".equals(game.getMode())) {
            if (game.getPlayers().size() == 2) {
                String oldCreator = game.getWordCreator();
                String oldGuesser = game.getWordGuesser();
                game.setWordCreator(oldGuesser);
                game.setWordGuesser(oldCreator);
            } else {
                int currentGuesserIndex = game.getPlayers().indexOf(game.getWordGuesser());
                int nextGuesserIndex = (currentGuesserIndex + 1) % game.getPlayers().size();

                List<String> availableCreators = new ArrayList<>();
                for (int i = 0; i < game.getPlayers().size(); i++) {
                    if (i != nextGuesserIndex) {
                        availableCreators.add(game.getPlayers().get(i));
                    }
                }
                game.setWordCreator(availableCreators.get(random.nextInt(availableCreators.size())));
                game.setWordGuesser(game.getPlayers().get(nextGuesserIndex));
            }
        } else {
            // Modo PvC - CPU sempre é o criador da palavra
            String word = ollamaService.generateWord();
            game.setSecretWord(word);
            game.setWordLength(word.length());
            game.setGameStatus("playing");
        }

        return game;
    }

    public Game nextRound(String gameId) {
        return startNextRound(gameId);
    }

    public Game getGame(String gameId) {
        Game game = games.get(gameId);
        if (game == null) {
            throw new IllegalArgumentException("Jogo não encontrado");
        }
        return game;
    }

    public void deleteGame(String gameId) {
        if (!games.containsKey(gameId)) {
            throw new IllegalArgumentException("Jogo não encontrado");
        }
        games.remove(gameId);
    }

    public Map<String, Object> listGames() {
        Map<String, Object> result = new HashMap<>();
        result.put("games", new ArrayList<>(games.keySet()));
        result.put("total", games.size());
        return result;
    }

    private void validateConfig(GameConfig config) {
        if (!"pvp".equals(config.getMode()) && !"pvc".equals(config.getMode())) {
            throw new IllegalArgumentException("Modo inválido. Use 'pvp' ou 'pvc'");
        }

        // PvP agora permite iniciar com 1 jogador e convidar outros
        if ("pvp".equals(config.getMode()) && config.getPlayers().size() < 1) {
            throw new IllegalArgumentException("Modo PvP requer pelo menos 1 jogador para iniciar");
        }

        if ("pvp".equals(config.getMode()) && config.getPlayers().size() > 5) {
            throw new IllegalArgumentException("Modo PvP permite no máximo 5 jogadores");
        }

        if ("pvc".equals(config.getMode()) && config.getPlayers().size() != 1) {
            throw new IllegalArgumentException("Modo PvC requer exatamente 1 jogador");
        }
    }

    private void checkGameFinished(Game game) {
        if ("pvp".equals(game.getMode()) && game.getPlayers().size() == 2) {
            for (Map.Entry<String, Integer> entry : game.getScores().entrySet()) {
                if (entry.getValue() >= 2) {
                    game.setGameStatus("game_finished");
                    game.setGameWinner(entry.getKey());
                    break;
                }
            }
        } else {
            for (Map.Entry<String, Integer> entry : game.getScores().entrySet()) {
                if (entry.getValue() >= 2) {
                    game.setGameStatus("game_finished");
                    game.setGameWinner(entry.getKey());
                    break;
                }
            }
        }
    }

    private String generateGameId() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}
