#include <stdio.h>

int main() {
    int numero, maior, menor;

    // Leitura do primeiro número
    printf("Digite um numero (0 para parar): ");
    scanf("%i", &numero);

    // Inicialização do maior e do menor com o primeiro número (caso não seja 0)
    maior = menor = numero;

    while (numero != 0) {
        // Verifica se o número é maior
        if (numero > maior) {
            maior = numero;
        }

        // Verifica se o número é menor
        if (numero < menor) {
            menor = numero;
        }

        // Lê o próximo número
        printf("Digite um numero (0 para parar): ");
        scanf("%i", &numero);
    }

    // Exibe o resultado
    printf("Maior numero: %i\n", maior);
    printf("Menor numero: %i\n", menor);

    return 0;
}
