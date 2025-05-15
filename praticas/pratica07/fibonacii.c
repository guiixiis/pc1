#include <stdio.h>

int main() {
    int n, anterior = 0, proximo = 1;

    printf("Digite quantos termos da sequencia de Fibonacci deseja: ");
    scanf("%i", &n);

    for (int i = 0; i < n; i++) {
        printf("%i, ", proximo);

        int auxiliar = proximo;
        proximo = anterior + proximo;
        anterior = auxiliar;
    }

    printf("\n");
    return 0;
}
