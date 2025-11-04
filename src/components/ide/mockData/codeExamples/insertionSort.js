const insertionSortExample = `#include <stdio.h>

// 삽입 정렬
void insertion_sort(int list[], int n) {
    int i, j, key;
    
    for (i = 1; i < n; i++) {
        key = list[i];
        j = i - 1;
        
        // key보다 큰 요소들을 한 칸씩 뒤로 이동
        while (j >= 0 && list[j] > key) {
            list[j + 1] = list[j];
            j--;
        }
        
        list[j + 1] = key;
    }
}

int main() {
    int i;
    int n = 5;
    int list[5] = {5, 2, 4, 6, 1};
    
    // 삽입 정렬 수행
    insertion_sort(list, n);
    
    // 정렬 결과 출력
    for (i = 0; i < n; i++) {
        printf("%d ", list[i]);
    }
    printf("\\n");
    
    return 0;
}`;

export default insertionSortExample;