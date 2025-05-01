#include <stdio.h>

int main() {
    int idade = 0;

    printf("Informe sua idade: ");
    scanf("%i", &idade);

    if (idade >= 16) {
        if (idade >= 18 && idade <= 70) {
            printf("Voce eh obrigado a votar!\n");
        } else {
            printf("Voce pode votar\n");
        }
    } else {
        printf("Voce naum pode votar\n");
    }


    return 0;
}
