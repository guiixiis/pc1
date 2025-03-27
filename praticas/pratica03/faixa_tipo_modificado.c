#include <stdio.h>
#include <limits.h>
#include <float.h>

int main() {
    printf("O tipo 'unsigned char' aceita valores entre %i e %i.\n", 0, UCHAR_MAX);
    printf("O tipo 'short int' aceita valores entre %i e %i.\n", SHRT_MIN, SHRT_MAX);
    printf("O tipo 'unsigned short int' aceita valores entre %i e %i.\n", 0, USHRT_MAX);

  return 0;
}