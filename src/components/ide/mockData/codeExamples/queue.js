const queueExample = `#include <stdio.h>

#define QUEUE_CAP 5

typedef struct {
    int data[QUEUE_CAP];
    int front; // 출력 위치
    int rear;  // 입력 위치
    int size;  // 원소 개수
} Queue;

void queue_init(Queue* q) { q->front = 0; q->rear = 0; q->size = 0; }
int  queue_empty(const Queue* q) { return q->size == 0; }
int  queue_full (const Queue* q) { return q->size == QUEUE_CAP; }

int enqueue(Queue* q, int x) {
    if (queue_full(q)) return 0;
    q->data[q->rear] = x;
    q->rear = (q->rear + 1) % QUEUE_CAP;
    q->size++;
    return 1;
}

int dequeue(Queue* q, int* out) {
    if (queue_empty(q)) return 0;
    *out = q->data[q->front];
    q->front = (q->front + 1) % QUEUE_CAP;
    q->size--;
    return 1;
}

int queue_peek(const Queue* q, int* out) {
    if (queue_empty(q)) return 0;
    *out = q->data[q->front];
    return 1;
}

void queue_print(const Queue* q) {
    printf("Queue(front->rear): ");
    if (queue_empty(q)) { printf("[]\\n"); return; }
    printf("[");
    for (int i = 0; i < q->size; ++i) {
        int idx = (q->front + i) % QUEUE_CAP;
        printf("%d", q->data[idx]);
        if (i < q->size - 1) printf(", ");
    }
    printf("]\\n");
}

int main(void) {
    Queue q; queue_init(&q);
    printf("=== 큐 데모 (CAP=%d) ===\\n", QUEUE_CAP);

    for (int x = 10; x <= 15; ++x) {
        if (enqueue(&q, x)) {
            printf("enq %d   -> ", x); queue_print(&q);
        } else {
            printf("enq %d   -> 실패(가득참)\\n", x);
        }
    }

    int v;
    if (queue_peek(&q, &v)) printf("peek    -> %d\\n", v);

    while (dequeue(&q, &v)) {
        printf("deq %d   -> ", v); queue_print(&q);
    }
    if (!dequeue(&q, &v)) printf("deq     -> 실패(비어있음)\\n");
    return 0;
}`;

export default queueExample;
