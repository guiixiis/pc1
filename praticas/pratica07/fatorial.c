#include <stdio.h>

int main() {
    int numero, fatorial = 1; // varriável 

    // Leitura do número 
    printf("Digite um numero: ");
    scanf("%i", &numero);

    // Loop para calcular o fatorial 
    for (int i = numero; i > 0; i--) {
        fatorial = fatorial * i;
    }

    // Exibe o resultado 
    printf("O fatorial de %i e %i\n", numero, fatorial);

    return 0; 
} 
