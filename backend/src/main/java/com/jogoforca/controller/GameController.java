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

@RestController
@RequestMapping("/api/game")
@CrossOrigin(origins = "*")
public class GameController {

    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @PostMapping("/new")
    public ResponseEntity<?> createGame(@Valid @RequestBody GameConfig config) {
        try {
            Game game = gameService.createGame(config);
            return ResponseEntity.ok(convertToResponse(game));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Erro ao criar jogo: " + e.getMessage()));
        }
    }

    @PostMapping("/{gameId}/submit-word")
    public ResponseEntity<?> submitWord(@PathVariable String gameId,
            @Valid @RequestBody WordSubmit wordSubmit) {
        try {
            Game game = gameService.submitWord(gameId, wordSubmit.getWord());
            return ResponseEntity.ok(convertToResponse(game));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Erro ao submeter palavra: " + e.getMessage()));
        }
    }

    @PostMapping("/{gameId}/guess")
    public ResponseEntity<?> guessLetter(@PathVariable String gameId,
            @Valid @RequestBody GuessLetter guessLetter) {
        try {
            Map<String, Object> result = gameService.guessLetter(gameId, guessLetter.getLetter());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Erro ao adivinhar letra: " + e.getMessage()));
        }
    }

    @PostMapping("/{gameId}/join")
    public ResponseEntity<?> joinGame(@PathVariable String gameId,
            @Valid @RequestBody JoinGameRequest joinGameRequest) {
        try {
            Game game = gameService.joinGame(gameId, joinGameRequest.getPlayer());
            return ResponseEntity.ok(convertToResponse(game));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Erro ao entrar no jogo: " + e.getMessage()));
        }
    }

    @GetMapping("/{gameId}")
    public ResponseEntity<?> getGameState(@PathVariable String gameId) {
        try {
            Game game = gameService.getGame(gameId);
            return ResponseEntity.ok(convertToResponse(game));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Erro ao buscar jogo: " + e.getMessage()));
        }
    }

    @PostMapping("/{gameId}/next-round")
    public ResponseEntity<?> nextRound(@PathVariable String gameId) {
        try {
            Game game = gameService.nextRound(gameId);
            return ResponseEntity.ok(convertToResponse(game));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("detail", "Erro ao iniciar próxima rodada: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{gameId}")
    public ResponseEntity<?> deleteGame(@PathVariable String gameId) {
        try {
            gameService.deleteGame(gameId);
            return ResponseEntity.ok(Map.of("message", "Jogo deletado com sucesso"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("detail", e.getMessage()));
        } catch (Exception e) {
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
