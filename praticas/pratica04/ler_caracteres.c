#include <stdio.h>

int main(){
     char tecla;
    
     printf("Pressione uma tecla e depois ENTER:");
     scanf("%c", &tecla); // nao sabe tecla = valor
                          // entao precisa acessar endereco
                          // da variavel com o operador &
    getchar();                      
    printf("Voce pressionou a tecla '%c'\n", tecla);

    printf("Pressione outra tecla e depois ENTER");
    scanf("%c", &tecla);
    printf("Voce pressionou a tecla '%c'\n", tecla);

    char nome[34];
    printf("Informe seu nome: ");
    scanf("% [^\n]s",nome);
    printf("Ola %s!\n", nome);
  
  
   return 0;
}


    