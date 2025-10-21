const selectionSortExample = `#include <stdio.h>
#define MAX_SIZE 5

// 선택 정렬
void selection_sort(int list[], int n) {
    int i, j, min_idx, temp;
    
    for (i = 0; i < n - 1; i++) {
        // 최소값의 인덱스 찾기
        min_idx = i;
        
        for (j = i + 1; j < n; j++) {
            if (list[j] < list[min_idx]) {
                min_idx = j;
            }
        }
        
        // 최소값과 현재 위치 교환
        if (min_idx != i) {
            temp = list[i];
            list[i] = list[min_idx];
            list[min_idx] = temp;
        }
    }
}

int main() {
    int i;
    int n = MAX_SIZE;
    int list[n] = {64, 25, 12, 22, 11};
    
    // 선택 정렬 수행
    selection_sort(list, n);
    
    // 정렬 결과 출력
    for (i = 0; i < n; i++) {
        printf("%d ", list[i]);
    }
    printf("\\n");
    
    return 0;
}`;

export default selectionSortExample;