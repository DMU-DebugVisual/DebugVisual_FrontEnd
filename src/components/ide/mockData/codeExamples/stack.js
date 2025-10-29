const stackExample = `#include <stdio.h>

#define STACK_CAP 5

typedef struct {
    int data[STACK_CAP];
    int top; // 비어있으면 -1
} Stack;

void stack_init(Stack* s) { s->top = -1; }
int  stack_empty(const Stack* s) { return s->top == -1; }
int  stack_full (const Stack* s) { return s->top == STACK_CAP - 1; }

int stack_push(Stack* s, int x) {
    if (stack_full(s)) return 0;
    s->data[++(s->top)] = x;
    return 1;
}

int stack_pop(Stack* s, int* out) {
    if (stack_empty(s)) return 0;
    *out = s->data[(s->top)--];
    return 1;
}

int stack_peek(const Stack* s, int* out) {
    if (stack_empty(s)) return 0;
    *out = s->data[s->top];
    return 1;
}

void stack_print(const Stack* s) {
    printf("Stack(top->bottom): ");
    if (stack_empty(s)) { printf("[]\\n"); return; }
    printf("[");
    for (int i = s->top; i >= 0; --i) {
        printf("%d", s->data[i]);
        if (i > 0) printf(", ");
    }
    printf("]\\n");
}

int main(void) {
    Stack s; stack_init(&s);
    printf("=== 스택 데모 (CAP=%d) ===\\n", STACK_CAP);

    for (int x = 1; x <= 6; ++x) {
        if (stack_push(&s, x)) {
            printf("push %d  -> ", x); stack_print(&s);
        } else {
            printf("push %d  -> 실패(가득참)\\n", x);
        }
    }

    int v;
    if (stack_peek(&s, &v)) printf("peek    -> %d\\n", v);

    while (stack_pop(&s, &v)) {
        printf("pop %d   -> ", v); stack_print(&s);
    }
    if (!stack_pop(&s, &v)) printf("pop     -> 실패(비어있음)\\n");
    return 0;
}`;

export default stackExample;
