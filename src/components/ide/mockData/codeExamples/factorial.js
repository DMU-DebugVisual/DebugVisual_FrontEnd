const factorialExample = `#include <stdio.h>

// 팩토리얼 계산 (재귀)
int factorial(int n) {
    // 기저 조건
    if (n <= 1) {
        return 1;
    }
    
    // 재귀 호출
    return n * factorial(n - 1);
}

int main() {
    int n = 5;
    int result;
    
    printf("Input: %d\\n", n);
    
    // 팩토리얼 계산
    result = factorial(n);
    
    printf("Result: %d! = %d\\n", n, result);
    
    return 0;
}`;

export default factorialExample;