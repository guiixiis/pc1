#include <stdio.h>
#include <limits.h>
#include <float.h>

int main() {
    // unsigned char -> 0 a 255

   // unsigned int - > 0 a 4bi
   // short int ->32mil a 32mil
   // unsigned short int -> 0 a 65mil
   // long int -nonilhao a nonilhao
   // unsigned long int -> 0 ~ 18lhao
   
   //long double -> quase 0 a um numero que nao sei pronunciar
   printf("O tipo 'short int' ocupa %i bytes\n", sizeof(short int));
   printf("O tipo 'long int'  ocupa %i bytes\n", sizeof(long long int));
   printf("O tipo 'long double' ocupa %i bytes\n", sizeof(long double));

   printf("O tipo 'unsigned char' vai de 0 a %i\n", UCHAR_MAX);
   printf("O tipo 'unsigned int' vai de 0 a %u\n", UINT_MAX);
   printf("O tipo 'short int' vai de %i a %i\n", SHRT_MAX, SHRT_MIN);
   printf("O tipo 'unsigned short int' vai de 0 a %i\n", USHRT_MAX);
   printf("O tipo 'long int' vai de %lli a %lli\n", LLONG_MIN, LLONG_MAX);
   printf("O tipo 'unsigned long int' vai de 0 a %llu\n", ULLONG_MAX);
   printf("O tipo 'long double' vai de %Lf a %Lf\n", LDBL_MIN, LDBL_MAX);

    return 0;
}