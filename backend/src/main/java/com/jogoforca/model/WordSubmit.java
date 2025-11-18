package com.jogoforca.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class WordSubmit {
    @NotBlank(message = "Palavra é obrigatória")
    @Size(min = 3, max = 15, message = "Palavra deve ter entre 3 e 15 letras")
    private String word;
}
