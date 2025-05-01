#include <stdio.h>

int main(){
    int nota;

   printf("Digite uma nota (0 a 4): ");
   scanf("%d", &nota);

 switch(nota){
    case 0: printf("Voce ganhou '*'.\n");
    case 1: printf("Voce ganhou '**'.\n");
    case 2: printf("Voce ganhou '***'.\n");
    case 3: printf("Voce ganhou ****!\n");
    case 4: printf("Voce ganhou *****!\n");
    default: printf("Nota invalida! Tente novamente.\n");
}



  return 0;
}