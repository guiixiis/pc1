#include <stdio.h>

int main() {
    // int numero1;
    // int numero2;
    // int numero3;
    // int numero4;
    // int numero5;
    // int numero6;
    // int numero7;
    // int numero8;
    // int numero9;
    // int numero10;
                                                              // 0  1 2  3  4  5 6 7  8 9 
    int numeros[10]; // matriz unidimensional = vetor = array = |5|-1|10|6|-5|-7|7|11|2|0|
    
    // como acessa cada posicao
    numeros[0] = 5;
    numeros[1] = -1;
    numeros[2] = 10;
    numeros[3] = 6;
    numeros[4] = -5;
    numeros[5] = -7;
    numeros[6] = 7;
    numeros[7] = 11;
    numeros[8] = 2;
    numeros[9] = 0;

    int maior = -99999;
    int menor = 99999;

    printf("Entre com 10 numeros inteiros\n");
    for(int i=0; i<10; i++) {
        printf("Numero %i: ", i+1);
        scanf("%i", &numeros[i]);
        
        if (maior < numeros[i]) {
            maior = numeros[i];
        }

        if (menor > numeros[i]) {
            menor = numeros[i];
        }
    }

    printf("Seus numeros foram: ");
    for(int i=0; i<10; i++) {
        printf("%i, ", numeros[i]);
    }
    printf("\n");
    printf("O maior numero foi %i e o menor numero foi %i\n", maior, menor);



    return 0;
}