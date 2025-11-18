package com.jogoforca.model;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JoinGameRequest {
    @NotBlank(message = "Nome do jogador é obrigatório")
    private String player;
}
