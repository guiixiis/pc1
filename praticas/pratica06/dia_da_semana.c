#include <stdio.h>

int main() {
    int dia;

    printf("Digite um numero de 1 a 7 correspondente ao dia da semana: ");
    scanf("%d", &dia);

    if (dia == 1)
        printf("Domingo\n");
    else if (dia == 2)
        printf("Segunda\n");
    else if (dia == 3)
        printf("Terca\n");
    else if (dia == 4)
        printf("Quarta\n");
    else if (dia == 5)
        printf("Quinta\n");
    else if (dia == 6)
        printf("Sexta\n");
    else if (dia == 7)
        printf("Sábado\n");
    else
        printf("Dia informado é inválido!\n");

    return 0;
}
