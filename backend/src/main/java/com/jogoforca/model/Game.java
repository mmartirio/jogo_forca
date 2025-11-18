package com.jogoforca.model;

import lombok.Data;
import java.util.*;

@Data
public class Game {
    private String gameId;
    private String mode; // "pvp" ou "pvc"
    private List<String> players;
    private int currentRound;
    private int maxRounds;
    private Map<String, Integer> scores;
    private String wordCreator;
    private String wordGuesser;
    private String secretWord;
    private Integer wordLength;
    private List<String> guessedLetters;
    private Map<String, List<Integer>> correctPositions;
    private int attemptsLeft;
    private int maxAttempts;
    private String gameStatus; // "waiting_word", "playing", "round_finished", "game_finished"
    private String roundWinner;
    private String gameWinner;
    
    public Game() {
        this.guessedLetters = new ArrayList<>();
        this.correctPositions = new HashMap<>();
        this.scores = new HashMap<>();
        this.maxAttempts = 6;
        this.attemptsLeft = 6;
    }
}
