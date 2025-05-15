#include <stdio.h>

int main() {
    int nota;

    // Inicio da nota / leitura
    printf("Digite uma nota entre 1 e 10: ");
    scanf("%i", &nota);

    // Loop enquanto a nota for inválida
    while (nota < 1 || nota > 10) {
        printf("Nota invalida. Tente novamente!\n");
        scanf("%i", &nota);
    }

    printf("Nota valida: %i\n", nota);

    return 0;
}
