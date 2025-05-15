#include <stdio.h>

int main() {
    int numero; // declaração da variável 

    // Leitura do número
    printf("Digite um numero: "); 
    scanf("%i", &numero);

    // Loop de 1 a 100
    for (int i = 1; i < 1000; i++) {
        // Verifica se i é múltiplo de numero
        if (i % numero == 0) {
            printf("%i, ", i);
        }
    }

    printf("\n");
    return 0;
}

