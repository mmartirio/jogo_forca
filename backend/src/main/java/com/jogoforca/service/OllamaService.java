package com.jogoforca.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Random;

@Service
public class OllamaService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final Random random;
    private static final List<String> FALLBACK_WORDS = List.of(
            "PYTHON", "CODIGO", "PROGRAMA", "COMPUTADOR", "DESENVOLVIMENTO",
            "JAVA", "SPRING", "BOOT", "SISTEMA", "APLICACAO");

    private static final List<String> MODELS = List.of(
            "phi3:mini", "phi", "tinyllama", "llama3.2:1b");

    public OllamaService() {
        this.webClient = WebClient.builder()
                .baseUrl("http://localhost:11434")
                .build();
        this.objectMapper = new ObjectMapper();
        this.random = new Random();
    }

    public String generateWord() {
        for (String model : MODELS) {
            try {
                String word = tryGenerateWithModel(model);
                if (word != null && isValidWord(word)) {
                    return word;
                }
            } catch (Exception e) {
                System.out.println("Modelo " + model + " falhou: " + e.getMessage());
            }
        }

        // Fallback para palavras predefinidas
        return FALLBACK_WORDS.get(random.nextInt(FALLBACK_WORDS.size()));
    }

    private String tryGenerateWithModel(String model) {
        try {
            Map<String, Object> requestBody = Map.of(
                    "model", model,
                    "prompt", "Uma palavra em português: substantivo comum, 5-10 letras. Só a palavra:",
                    "stream", false,
                    "options", Map.of(
                            "temperature", 0.7,
                            "num_predict", 5,
                            "top_p", 0.9));
            String response = webClient.post()
                    .uri("/api/generate")
                    .bodyValue(Objects.requireNonNull(requestBody))
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();

            if (response != null) {
                JsonNode jsonNode = objectMapper.readTree(response);
                String word = jsonNode.get("response").asText().trim().toUpperCase();

                // Limpar caracteres especiais
                word = word.replaceAll("[^A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ]", "");

                return word;
            }
        } catch (Exception e) {
            throw new RuntimeException("Erro ao gerar palavra com " + model, e);
        }
        return null;
    }

    private boolean isValidWord(String word) {
        return word != null &&
                word.length() >= 5 &&
                word.length() <= 10 &&
                word.matches("[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸ]+");
    }
}
