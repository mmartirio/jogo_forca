package com.jogoforca.controller;

import com.jogoforca.model.Game;
import com.jogoforca.model.GameConfig;
import com.jogoforca.model.GuessLetter;
import com.jogoforca.model.JoinGameRequest;
import com.jogoforca.model.WordSubmit;
import com.jogoforca.service.GameService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
public class GameController {

    private final GameService gameService;
    private static final Logger log = LoggerFactory.getLogger(GameController.class);

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping("/new")
    public ResponseEntity<?> createGame(@Valid @RequestBody GameConfig config) {
        try {
            log.debug("[createGame] payload mode={}, players={} ", config.getMode(), config.getPlayers());
            Game game = gameService.createGame(config);
            Map<String, Object> resp = convertToResponse(game);
            log.debug("[createGame] created gameId={} status={}", game.getGameId(), game.getGameStatus());
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            log.warn("[createGame] bad request: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            log.error("[createGame] error", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Erro ao criar jogo: " + e.getMessage()));
        }
    }

    @PostMapping("/{gameId}/submit-word")
    public ResponseEntity<?> submitWord(@PathVariable String gameId,
            @Valid @RequestBody WordSubmit wordSubmit) {
        try {
            log.debug("[submitWord] gameId={} wordLength={} hint={} generateHint={}", gameId,
                    wordSubmit.getWord() != null ? wordSubmit.getWord().length() : null,
                    wordSubmit.getHint(), wordSubmit.getGenerateHint());
            Game game = gameService.submitWord(gameId, wordSubmit.getWord(),
                    wordSubmit.getHint(), wordSubmit.getGenerateHint());
            Map<String, Object> resp = convertToResponse(game);
            log.debug("[submitWord] gameId={} -> status={} guesser={} hint={}", gameId, game.getGameStatus(),
                    game.getWordGuesser(), game.getHint() != null ? "presente" : "ausente");
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.warn("[submitWord] bad request for gameId {}: {}", gameId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            log.error("[submitWord] error gameId={}", gameId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Erro ao submeter palavra: " + e.getMessage()));
        }
    }

    @PostMapping("/{gameId}/guess")
    public ResponseEntity<?> guessLetter(@PathVariable String gameId,
            @Valid @RequestBody GuessLetter guessLetter) {
        try {
            log.debug("[guess] gameId={} letter={}", gameId, guessLetter.getLetter());
            Map<String, Object> result = gameService.guessLetter(gameId, guessLetter.getLetter());
            log.debug("[guess] gameId={} result={}", gameId, result);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.warn("[guess] bad request gameId {}: {}", gameId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            log.error("[guess] error gameId={}", gameId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Erro ao adivinhar letra: " + e.getMessage()));
        }
    }

    @PostMapping("/{gameId}/join")
    public ResponseEntity<?> joinGame(@PathVariable String gameId,
            @Valid @RequestBody JoinGameRequest joinGameRequest) {
        try {
            log.debug("[join] gameId={} player={}", gameId, joinGameRequest.getPlayer());
            Game game = gameService.joinGame(gameId, joinGameRequest.getPlayer());
            Map<String, Object> resp = convertToResponse(game);
            log.debug("[join] gameId={} players={} status={} creator={} guesser={} ", gameId, game.getPlayers(),
                    game.getGameStatus(), game.getWordCreator(), game.getWordGuesser());
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.warn("[join] bad request for gameId {}: {}", gameId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            log.error("[join] error gameId={}", gameId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Erro ao entrar no jogo: " + e.getMessage()));
        }
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<?> getGameState(@PathVariable String gameId) {
        try {
            log.debug("[state] gameId={} requested", gameId);
            Game game = gameService.getGame(gameId);
            Map<String, Object> resp = convertToResponse(game);
            log.debug("[state] gameId={} status={} attemptsLeft={} guessedLetters={} ", gameId, game.getGameStatus(),
                    game.getAttemptsLeft(), game.getGuessedLetters());
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException e) {
            log.warn("[state] not found gameId {}: {}", gameId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            log.error("[state] error gameId={}", gameId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Erro ao buscar jogo: " + e.getMessage()));
        }
    }

    @PostMapping("/{gameId}/next-round")
    public ResponseEntity<?> nextRound(@PathVariable String gameId) {
        try {
            log.debug("[nextRound] gameId={} requested", gameId);
            Game game = gameService.nextRound(gameId);
            Map<String, Object> resp = convertToResponse(game);
            log.debug("[nextRound] gameId={} -> status={} round={} creator={} guesser={}", gameId, game.getGameStatus(),
                    game.getCurrentRound(), game.getWordCreator(), game.getWordGuesser());
            return ResponseEntity.ok(resp);
        } catch (IllegalArgumentException | IllegalStateException e) {
            log.warn("[nextRound] bad request for gameId {}: {}", gameId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            log.error("[nextRound] error gameId={}", gameId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Erro ao iniciar próxima rodada: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{gameId}")
    public ResponseEntity<?> deleteGame(@PathVariable String gameId) {
        try {
            log.debug("[delete] gameId={} requested", gameId);
            gameService.deleteGame(gameId);
            return ResponseEntity.ok(Map.of("message", "Jogo deletado com sucesso"));
        } catch (IllegalArgumentException e) {
            log.warn("[delete] not found {}: {}", gameId, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            log.error("[delete] error gameId={}", gameId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Erro ao deletar jogo: " + e.getMessage()));
        }
    }

    private Map<String, Object> convertToResponse(Game game) {
        Map<String, Object> response = new HashMap<>();
        response.put("game_id", game.getGameId());
        response.put("mode", game.getMode());
        response.put("players", game.getPlayers());
        response.put("current_round", game.getCurrentRound());
        response.put("max_rounds", game.getMaxRounds());
        response.put("scores", game.getScores());
        response.put("word_creator", game.getWordCreator() != null ? game.getWordCreator() : "");
        response.put("word_guesser", game.getWordGuesser() != null ? game.getWordGuesser() : "");
        response.put("word_length", game.getWordLength() != null ? game.getWordLength() : 0);
        response.put("hint", game.getHint() != null ? game.getHint() : "");
        response.put("guessed_letters", game.getGuessedLetters());
        response.put("correct_positions", game.getCorrectPositions());
        response.put("attempts_left", game.getAttemptsLeft());
        response.put("max_attempts", game.getMaxAttempts());
        response.put("game_status", game.getGameStatus());
        response.put("round_winner", game.getRoundWinner() != null ? game.getRoundWinner() : "");
        response.put("game_winner", game.getGameWinner() != null ? game.getGameWinner() : "");
        return response;
    }
}
