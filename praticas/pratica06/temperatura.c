#include <stdio.h>

int main() {
    float temperatura;

    printf("Digite a temperatura: ");
    scanf("%f", &temperatura);

    if (temperatura > 40.0f) {
        printf("Muito quente\n");
    } else if (temperatura > 30.0f) {
        printf("Quente\n");
    } else if (temperatura > 20.0f) {
        printf("Agradavel\n");
    } else {
        printf("Frio\n");
    }

    return 0;
}
