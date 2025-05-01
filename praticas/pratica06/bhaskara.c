#include <stdio.h>
#include <math.h>

int main() {
    int a, b, c;
    float delta, x1, x2;

    printf("Digite os valores de a, b e c:\n");
    scanf("%d %d %d", &a, &b, &c);

    delta = b * b - 4 * a * c;

    if (delta < 0) {
        printf("A equacao nao tem raizes reais.\n");
    } else {
        x1 = (-b + sqrt(delta)) / (2 * a);
        x2 = (-b - sqrt(delta)) / (2 * a);
        printf("As raizes da equacao sao: x1 = %.2f e x2 = %.2f\n", x1, x2);
    }

    return 0;
}
