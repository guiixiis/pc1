#include <stdio.h>

int main () {
    // + soma 
    // - subtracao
    // / divisao 
    // % resto da divisao 


   int numero1 = 10;
   int numero2 = 20;
    
   int x = 0;

   x = x + 1;

   
   int soma = numero1 + numero2;
   printf("A soma de %i e %i = %i\n", numero1, numero2, soma);

   int subtracao = numero1 - numero2;
   printf("A subtracao de %i e %i = %i\n", numero1, numero2, subtracao);

   int multiplicacao = numero1 * numero2;
   printf("A multiplicacao de %i e %i = %i\n", numero1, numero2, multiplicacao);

   float divisao = numero1 * 1.0f / numero2; 
   printf("A divisao de %i e %i = %i\n", numero1, numero2, divisao);
   

   int resto = numero1 % numero2;
   printf("O resto de %i e %i = %i\n", numero1, numero2, resto);
   
   int operacao = 1 / 2 + 5 * 4 % 1 - 2;
   printf("A operacao= 1 / 2 +5 * 4 %% 1 - 2 = %i\n", operacao);
   operacao = 1 / 2 + 5 * 4 % 1 - 2;
   printf("A operacao 1 / 2 + 5 * 4 %% 1 - 2 = %i \n", operacao);


    return 0;
}