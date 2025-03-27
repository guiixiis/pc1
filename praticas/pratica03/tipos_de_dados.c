 #include <stdio.h> 
 #include <limits.h>
 #include <float.h>
int main(){
  // char   ->  'A', '\n', 100
  // int     ->  -123, 0, 222
  // float   ->  -100.123456f, 0.0f 565.232564f
  // double  -> -1.12345678901234 0.0 2.123456789630125
  // void    -> sem tipo

  printf("O tipo 'char' ocupa %i byte(s)z\n,", sizeof(char)) ;
  printf("O tipo 'char' ocupa %i byte(s)z\n,", sizeof(int)) ;
  printf("O tipo 'char' ocupa %i byte(s)z\n,", sizeof(float)) ;
  printf("O tipo 'char' ocupa %i byte(s)z\n,", sizeof(double)) ;
  printf("O tipo 'char' ocupa %i byte(s)z\n,", sizeof(void)) ;

printf("O tipo 'char' aceita valor de %i a %i\n" , 
      CHAR_MIN , CHAR_MAX);
printf("O tipo 'int' aceita valor de %i a %i\n" , 
      INT_MIN , INT_MAX);
printf("O tipo 'float' aceita valor de %E a Ef\n", FLT_MIN, FLT_MAX);
printf("O tipo 'double' aceita o valor de %E a %E\n", DBL_MIN, DBL_MAX);
          
  return 0;
}

  