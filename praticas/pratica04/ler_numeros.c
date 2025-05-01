#include <stdio.h>

int main() {
    int numero;

    printf("Informe um numero inteiro:"),
    scanf("%i", &numero);
    printf("O numero informado foi %i\n", numero);
    
    float nota; 
    printf("Informa uma nota entre 0.0 a 1.000: ");
    scanf("%f", &nota);
    printf("A sua nota foi %.1f\n", nota);
    

    return 0;
}