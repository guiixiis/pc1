#include <stdio.h>

int main() {
    // Loop de 0 a 9
    printf("Contando de 0 a 9:\n");
    for (int i = 0; i < 10; i++) {
        printf("%i ", i);
    }

    printf("\n");

    // Loop de 9 a 0
    printf("Contando de 9 a 0:\n");
    for (int i = 9; i >= 0; i--) {
        printf("%i ", i);
    }

    printf("\n");

    // Loop infinito
    for (;;) {
        printf("Ao infinito e além!\n");
    }

    return 0;
}
