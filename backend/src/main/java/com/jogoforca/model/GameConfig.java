package com.jogoforca.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import java.util.List;

@Data
public class GameConfig {
    @NotBlank(message = "Modo é obrigatório")
    private String mode; // "pvp" ou "pvc"

    @NotNull(message = "Lista de jogadores é obrigatória")
    @Size(min = 1, max = 5, message = "Deve ter entre 1 e 5 jogadores")
    private List<String> players;
}
