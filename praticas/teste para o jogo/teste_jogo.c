#include <stdio.h>

#define TAM 5

typedef struct {
    char nome[20];
    int x;
    int y;
    char simbolo;
} Jogador;

int main() {
    char tabuleiro[TAM][TAM];
    Jogador jogador1 = {"Player1", 0, 0, 'A'};
    Jogador jogador2 = {"Player2", TAM-1, TAM-1, 'B'};

    // Inicializa o tabuleiro
    for (int i = 0; i < TAM; i++)
        for (int j = 0; j < TAM; j++)
            tabuleiro[i][j] = '.';

    // Posiciona os jogadores
    tabuleiro[jogador1.x][jogador1.y] = jogador1.simbolo;
    tabuleiro[jogador2.x][jogador2.y] = jogador2.simbolo;

    int turno = 1;
    while (1) {
        // Mostrar tabuleiro
        printf("\nTABULEIRO:\n");
        for (int i = 0; i < TAM; i++) {
            for (int j = 0; j < TAM; j++) {
                printf(" %c", tabuleiro[i][j]);
            }
            printf("\n");
        }

        // Qual jogador vai jogar?
        Jogador *jogadorAtual = (turno % 2 == 1) ? &jogador1 : &jogador2;

        // Movimento
        printf("\n%s, digite o movimento (W/A/S/D): ", jogadorAtual->nome);
        char mov;
        scanf(" %c", &mov);

        // Apaga posição atual
        tabuleiro[jogadorAtual->x][jogadorAtual->y] = '.';

        // Atualiza posição
        if (mov == 'W' || mov == 'w') jogadorAtual->x--;
        if (mov == 'S' || mov == 's') jogadorAtual->x++;
        if (mov == 'A' || mov == 'a') jogadorAtual->y--;
        if (mov == 'D' || mov == 'd') jogadorAtual->y++;

        // Limites
        if (jogadorAtual->x < 0) jogadorAtual->x = 0;
        if (jogadorAtual->x >= TAM) jogadorAtual->x = TAM - 1;
        if (jogadorAtual->y < 0) jogadorAtual->y = 0;
        if (jogadorAtual->y >= TAM) jogadorAtual->y = TAM - 1;

        // Verifica colisão (encontro dos jogadores)
        if (jogador1.x == jogador2.x && jogador1.y == jogador2.y) {
            printf("\n%s encontrou %s! Fim de jogo!\n", jogadorAtual->nome, (turno % 2 == 1) ? jogador2.nome : jogador1.nome);
            break;
        }

        // Atualiza nova posição
        tabuleiro[jogadorAtual->x][jogadorAtual->y] = jogadorAtual->simbolo;

        turno++;
    }

    return 0;
}
