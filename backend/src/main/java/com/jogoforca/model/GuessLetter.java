package com.jogoforca.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GuessLetter {
    @NotBlank(message = "Letra é obrigatória")
    @Size(min = 1, max = 1, message = "Deve ser apenas uma letra")
    private String letter;
}
