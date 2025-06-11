// IDE.jsx - 코드파일과 JSON파일 분리 및 시각화 로직 개선

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import VisualizationModal from './VisualizationModal';
import './IDE.css';
import config from '../../config';

// ResizeObserver 패치 함수 (기존과 동일)
const applyResizeObserverFix = () => {
    if (window._isResizeObserverPatched) return;
    const originalResizeObserver = window.ResizeObserver;

    class PatchedResizeObserver extends originalResizeObserver {
        constructor(callback) {
            const throttledCallback = (entries, observer) => {
                if (this._rafId) {
                    cancelAnimationFrame(this._rafId);
                }
                this._rafId = requestAnimationFrame(() => {
                    this._rafId = null;
                    try {
                        callback(entries, observer);
                    } catch (e) {
                        console.warn('ResizeObserver 콜백 오류:', e);
                    }
                });
            };
            super(throttledCallback);
            this._rafId = null;
        }

        disconnect() {
            if (this._rafId) {
                cancelAnimationFrame(this._rafId);
                this._rafId = null;
            }
            super.disconnect();
        }
    }

    window.addEventListener('error', (e) => {
        if (e && e.message && (
            e.message.includes('ResizeObserver loop') ||
            e.message.includes('ResizeObserver undelivered notifications')
        )) {
            e.stopImmediatePropagation();
            e.preventDefault();
            return false;
        }
    }, true);

    const originalConsoleError = console.error;
    console.error = (...args) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver')) {
            return;
        }
        originalConsoleError.apply(console, args);
    };

    try {
        window.ResizeObserver = PatchedResizeObserver;
        window._isResizeObserverPatched = true;
    } catch (e) {
        console.warn('ResizeObserver를 패치할 수 없습니다:', e);
    }
};

const IDE = () => {
    // 🆕 파일 타입 구분을 위한 상태 추가
    const [isVisualizationModalOpen, setIsVisualizationModalOpen] = useState(false);
    const [selectedJsonData, setSelectedJsonData] = useState(null);
    const [isExampleFile, setIsExampleFile] = useState(false);
    const [currentFileType, setCurrentFileType] = useState('code'); // 'code' 또는 'json'

    // 기본 상태들
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

    const [code, setCode] = useState('# 여기에 코드를 입력하세요');
    const [fileName, setFileName] = useState("untitled.py");
    const [isSaved, setIsSaved] = useState(true);
    const [activeFile, setActiveFile] = useState("untitled.py");
    const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState("");
    const [input, setInput] = useState("");

    // 🆕 파일 목록을 코드파일과 JSON파일로 분리 관리
    const [savedFiles, setSavedFiles] = useState([
        { name: "untitled.py", code: '# 여기에 코드를 입력하세요', type: 'code' }
    ]);

    // 🆕 더미 파일도 분리하여 관리 (코드파일 + 해당 JSON파일)
    const [dummyFiles] = useState([
        {
            name: "untitled.py",
            code: "# 여기에 코드를 입력하세요"
        },
        {
            name: "bubble_sort.c",
            code: [
                "#include <stdio.h>",
                "",
                "void bubble_sort(int list[], int n) {",
                "    int i, j, temp;",
                "    for (i = n-1; i > 0; i--) {",
                "        for (j = 0; j < i; j++) {",
                "            if (list[j] < list[j+1]) {",
                "                temp = list[j];",
                "                list[j] = list[j+1];",
                "                list[j+1] = temp;",
                "            }",
                "        }",
                "    }",
                "}",
                "",
                "int main(void) {",
                "    int list[] = {5, 1, 7, 4, 3};",
                "    int n = 5;",
                "    bubble_sort(list, n);",
                "    printf(\"정렬된 배열: \");",
                "    for (int i = 0; i < n; i++) {",
                "        printf(\"%d \", list[i]);",
                "    }",
                "    return 0;",
                "}"
            ].join('\n'),
            type: "code"
        },
        {
            name: "linked_list.c",
            code: [
                "#include <stdio.h>",
                "#include <stdlib.h>",
                "",
                "typedef struct Node {",
                "    int data;",
                "    struct Node* next;",
                "} Node;",
                "",
                "int main(void) {",
                "    Node* head = NULL;",
                "    Node* tail = NULL;",
                "    Node* cur = NULL;",
                "    Node* newNode = NULL;",
                "    Node* delNode = NULL;",
                "    Node* delNextNode = NULL;",
                "    int readData;",
                "    ",
                "    while(1) {",
                "        printf(\"자연수 입력: \");",
                "        scanf(\"%d\", &readData);",
                "        if(readData < 1) break;",
                "        ",
                "        newNode = (Node*)malloc(sizeof(Node));",
                "        newNode->data = readData;",
                "        newNode->next = NULL;",
                "        ",
                "        if(head == NULL) {",
                "            head = newNode;",
                "            tail = newNode;",
                "        } else {",
                "            tail->next = newNode;",
                "            tail = newNode;",
                "        }",
                "    }",
                "    ",
                "    printf(\"입력받은 데이터의 전체출력! \\n\");",
                "    if(head == NULL) {",
                "        printf(\"저장된 자연수가 존재하지 않습니다. \\n\");",
                "    } else {",
                "        cur = head;",
                "        printf(\"%d \", cur->data);",
                "        ",
                "        while(cur->next != NULL) {",
                "            cur = cur->next;",
                "            printf(\"%d \", cur->data);",
                "        }",
                "    }",
                "    printf(\"\\n\");",
                "    ",
                "    if(head != NULL) {",
                "        delNode = head;",
                "        delNextNode = head->next;",
                "        ",
                "        printf(\"%d을(를) 삭제합니다. \\n\", delNode->data);",
                "        free(delNode);",
                "        ",
                "        while(delNextNode != NULL) {",
                "            delNode = delNextNode;",
                "            delNextNode = delNextNode->next;",
                "            ",
                "            printf(\"%d을(를) 삭제합니다. \\n\", delNode->data);",
                "            free(delNode);",
                "        }",
                "    }",
                "    ",
                "    return 0;",
                "}"
            ].join('\n'),
            type: "code"
        },
        {
            name: "fibonacci.c",
            code: [
                "#include <stdio.h>",
                "",
                "int fibo(int n) {",
                "    if(n == 0) return 0;",
                "    if(n == 1) return 1;",
                "    return (fibo(n-1) + fibo(n-2));",
                "}",
                "",
                "int main(void) {",
                "    int n;",
                "    printf(\"숫자를 입력하세요: \");",
                "    scanf(\"%d\", &n);",
                "    printf(\"fibo(%d) = %d\\n\", n, fibo(n));",
                "    return 0;",
                "}"
            ].join('\n'),
            type: "code"
        },
        {
            name: "binary_tree.c",
            code: [
                "#include <stdio.h>",
                "#include <stdlib.h>",
                "",
                "typedef struct TreeNode {",
                "    int data;",
                "    struct TreeNode* left, *right;",
                "} TreeNode;",
                "",
                "TreeNode* createNode(int data) {",
                "    TreeNode* newNode = (TreeNode*)malloc(sizeof(TreeNode));",
                "    newNode->data = data;",
                "    newNode->left = newNode->right = NULL;",
                "    return newNode;",
                "}",
                "",
                "TreeNode* insert(TreeNode* root, int data) {",
                "    if(root == NULL) {",
                "        return createNode(data);",
                "    }",
                "    ",
                "    if(data < root->data)",
                "        root->left = insert(root->left, data);",
                "    else if(data > root->data)",
                "        root->right = insert(root->right, data);",
                "    ",
                "    return root;",
                "}",
                "",
                "void inorder(TreeNode* root) {",
                "    if(root) {",
                "        inorder(root->left);",
                "        printf(\"%d \", root->data);",
                "        inorder(root->right);",
                "    }",
                "}",
                "",
                "int main() {",
                "    TreeNode* root = NULL;",
                "    root = insert(root, 50);",
                "    insert(root, 30);",
                "    insert(root, 70);",
                "    insert(root, 20);",
                "    insert(root, 40);",
                "    ",
                "    printf(\"Inorder Traversal: \");",
                "    inorder(root);",
                "    printf(\"\\n\");",
                "    ",
                "    return 0;",
                "}"
            ].join('\n'),
            type: "code"
        },
        {
            name: "heap.c",
            code: [
                "#include <stdio.h>",
                "#include <stdlib.h>",
                "#define MAX_SIZE 100",
                "",
                "typedef struct {",
                "    int key;",
                "} element;",
                "",
                "typedef struct {",
                "    element heap[MAX_SIZE];",
                "    int heap_size;",
                "} HeapType;",
                "",
                "HeapType* create() {",
                "    return (HeapType*)malloc(sizeof(HeapType));",
                "}",
                "",
                "void init(HeapType* h) {",
                "    h->heap_size = 0;",
                "}",
                "",
                "void insert_max_heap(HeapType* h, element item) {",
                "    int i;",
                "    i = ++(h->heap_size);",
                "    ",
                "    while((i != 1) && (item.key > h->heap[i/2].key)) {",
                "        h->heap[i] = h->heap[i/2];",
                "        i /= 2;",
                "    }",
                "    h->heap[i] = item;",
                "}",
                "",
                "element delete_max_heap(HeapType* h) {",
                "    int parent, child;",
                "    element item, temp;",
                "    ",
                "    item = h->heap[1];",
                "    temp = h->heap[(h->heap_size)--];",
                "    parent = 1;",
                "    child = 2;",
                "    ",
                "    while(child <= h->heap_size) {",
                "        if((child < h->heap_size) && ",
                "           (h->heap[child].key < h->heap[child+1].key))",
                "            child++;",
                "        if(temp.key >= h->heap[child].key) break;",
                "        ",
                "        h->heap[parent] = h->heap[child];",
                "        parent = child;",
                "        child *= 2;",
                "    }",
                "    h->heap[parent] = temp;",
                "    return item;",
                "}",
                "",
                "int main(void) {",
                "    HeapType* heap;",
                "    element e1 = {10}, e2 = {5}, e3 = {30};",
                "    element e4, e5, e6;",
                "    ",
                "    heap = create();",
                "    init(heap);",
                "    ",
                "    insert_max_heap(heap, e1);",
                "    insert_max_heap(heap, e2);",
                "    insert_max_heap(heap, e3);",
                "    ",
                "    e4 = delete_max_heap(heap);",
                "    printf(\"<%d> \", e4.key);",
                "    e5 = delete_max_heap(heap);",
                "    printf(\"<%d> \", e5.key);",
                "    e6 = delete_max_heap(heap);",
                "    printf(\"<%d> \", e6.key);",
                "    printf(\"\\n\");",
                "    ",
                "    free(heap);",
                "    return 0;",
                "}"
            ].join('\n'),
            type: "code"
        },
        {
            name: "graph.c",
            code: [
                "#include <stdio.h>",
                "#include <stdlib.h>",
                "#define MAX_VERTICES 50",
                "",
                "typedef struct GraphType {",
                "    int n;",
                "    int adj_mat[MAX_VERTICES][MAX_VERTICES];",
                "} GraphType;",
                "",
                "void init(GraphType* g) {",
                "    int r, c;",
                "    g->n = 0;",
                "    for(r = 0; r < MAX_VERTICES; r++)",
                "        for(c = 0; c < MAX_VERTICES; c++)",
                "            g->adj_mat[r][c] = 0;",
                "}",
                "",
                "void insert_vertex(GraphType* g, int v) {",
                "    if(((g->n) + 1) > MAX_VERTICES) {",
                "        fprintf(stderr, \"그래프: 정점의 개수 초과\");",
                "        return;",
                "    }",
                "    g->n++;",
                "}",
                "",
                "void insert_edge(GraphType* g, int start, int end) {",
                "    if(start >= g->n || end >= g->n) {",
                "        fprintf(stderr, \"그래프: 정점 번호 오류\");",
                "        return;",
                "    }",
                "    g->adj_mat[start][end] = 1;",
                "    g->adj_mat[end][start] = 1;",
                "}",
                "",
                "void print_adj_mat(GraphType* g) {",
                "    for(int i = 0; i < g->n; i++) {",
                "        for(int j = 0; j < g->n; j++) {",
                "            printf(\"%2d \", g->adj_mat[i][j]);",
                "        }",
                "        printf(\"\\n\");",
                "    }",
                "}",
                "",
                "int main(void) {",
                "    GraphType *g;",
                "    g = (GraphType *)malloc(sizeof(GraphType));",
                "    init(g);",
                "    ",
                "    for(int i = 0; i < 4; i++)",
                "        insert_vertex(g, i);",
                "    ",
                "    insert_edge(g, 0, 1);",
                "    insert_edge(g, 0, 2);",
                "    insert_edge(g, 0, 3);",
                "    insert_edge(g, 1, 2);",
                "    insert_edge(g, 2, 3);",
                "    ",
                "    printf(\"인접 행렬\\n\");",
                "    print_adj_mat(g);",
                "    ",
                "    free(g);",
                "    return 0;",
                "}"
            ].join('\n'),
            type: "code"
        },
        {
            name: "bubble_sort.json",
            code: JSON.stringify({
                "algorithm": "bubble-sort",
                "lang": "c",
                "input": "",
                "variables": [
                    { "name": "MAX_SIZE", "type": "int", "initialValue": null, "currentValue": 5 },
                    { "name": "i", "type": "int", "initialValue": null, "currentValue": 0 },
                    { "name": "n", "type": "int", "initialValue": null, "currentValue": 5 },
                    { "name": "list", "type": "array", "initialValue": null, "currentValue": [5, 1, 7, 4, 3] },
                    { "name": "j", "type": "int", "initialValue": null, "currentValue": 0 },
                    { "name": "temp", "type": "int", "initialValue": null, "currentValue": 0 }
                ],
                "functions": [
                    { "name": "bubble_sort", "params": ["list", "n"] }
                ],
                "steps": [
                    { "line": 21, "description": "함수 bubble_sort 호출", "stack": [{ "function": "bubble_sort", "params": [[5, 1, 7, 4, 3], 5] }] },
                    { "line": 8, "description": "i=n-1로 초기화", "changes": [{ "variable": "i", "before": null, "after": 4 }] },
                    { "line": 8, "description": "i 조건 검사 (4>0)", "condition": { "expression": "i>0", "result": true } },
                    { "line": 10, "description": "j=0으로 초기화", "changes": [{ "variable": "j", "before": null, "after": 0 }] },
                    { "line": 10, "description": "j 조건 검사 (0<4)", "condition": { "expression": "j<4", "result": true } },
                    { "line": 12, "description": "조건 검사 (list[0]<list[1]: 5<1)", "condition": { "expression": "list[j]<list[j+1]", "result": false } },
                    { "line": 10, "description": "j++", "changes": [{ "variable": "j", "before": 0, "after": 1 }] },
                    { "line": 10, "description": "j 조건 검사 (1<4)", "condition": { "expression": "j<4", "result": true } },
                    { "line": 12, "description": "조건 검사 (list[1]<list[2]: 1<7)", "condition": { "expression": "list[j]<list[j+1]", "result": true } },
                    { "line": 13, "description": "temp=list[1]=1", "changes": [{ "variable": "temp", "before": null, "after": 1 }] },
                    { "line": 14, "description": "list[1]=list[2]=7", "changes": [{ "variable": "list", "before": [5, 1, 7, 4, 3], "after": [5, 7, 7, 4, 3] }] },
                    { "line": 15, "description": "list[2]=temp=1", "changes": [{ "variable": "list", "before": [5, 7, 7, 4, 3], "after": [5, 7, 1, 4, 3] }] },
                    { "line": 10, "description": "j++", "changes": [{ "variable": "j", "before": 1, "after": 2 }] },
                    { "line": 10, "description": "j 조건 검사 (2<4)", "condition": { "expression": "j<4", "result": true } },
                    { "line": 12, "description": "조건 검사 (list[2]<list[3]: 1<4)", "condition": { "expression": "list[j]<list[j+1]", "result": true } },
                    { "line": 13, "description": "temp=list[2]=1", "changes": [{ "variable": "temp", "before": 1, "after": 1 }] },
                    { "line": 14, "description": "list[2]=list[3]=4", "changes": [{ "variable": "list", "before": [5, 7, 1, 4, 3], "after": [5, 7, 4, 4, 3] }] },
                    { "line": 15, "description": "list[3]=temp=1", "changes": [{ "variable": "list", "before": [5, 7, 4, 4, 3], "after": [5, 7, 4, 1, 3] }] },
                    { "line": 10, "description": "j++", "changes": [{ "variable": "j", "before": 2, "after": 3 }] },
                    { "line": 10, "description": "j 조건 검사 (3<4)", "condition": { "expression": "j<4", "result": true } },
                    { "line": 12, "description": "조건 검사 (list[3]<list[4]: 1<3)", "condition": { "expression": "list[j]<list[j+1]", "result": true } },
                    { "line": 13, "description": "temp=list[3]=1", "changes": [{ "variable": "temp", "before": 1, "after": 1 }] },
                    { "line": 14, "description": "list[3]=list[4]=3", "changes": [{ "variable": "list", "before": [5, 7, 4, 1, 3], "after": [5, 7, 4, 3, 3] }] },
                    { "line": 15, "description": "list[4]=temp=1", "changes": [{ "variable": "list", "before": [5, 7, 4, 3, 3], "after": [5, 7, 4, 3, 1] }] },
                    { "line": 10, "description": "j++", "changes": [{ "variable": "j", "before": 3, "after": 4 }] },
                    { "line": 10, "description": "j 조건 검사 (4<4)", "condition": { "expression": "j<4", "result": false } },
                    { "line": 8, "description": "i--", "changes": [{ "variable": "i", "before": 4, "after": 3 }] },
                    { "line": 8, "description": "i 조건 검사 (3>0)", "condition": { "expression": "i>0", "result": true } },
                    { "line": 10, "description": "j=0으로 초기화", "changes": [{ "variable": "j", "before": 4, "after": 0 }] },
                    { "line": 10, "description": "j 조건 검사 (0<3)", "condition": { "expression": "j<3", "result": true } },
                    { "line": 12, "description": "조건 검사 (list[0]<list[1]: 5<7)", "condition": { "expression": "list[j]<list[j+1]", "result": true } },
                    { "line": 13, "description": "temp=list[0]=5", "changes": [{ "variable": "temp", "before": 1, "after": 5 }] },
                    { "line": 14, "description": "list[0]=list[1]=7", "changes": [{ "variable": "list", "before": [5, 7, 4, 3, 1], "after": [7, 7, 4, 3, 1] }] },
                    { "line": 15, "description": "list[1]=temp=5", "changes": [{ "variable": "list", "before": [7, 7, 4, 3, 1], "after": [7, 5, 4, 3, 1] }] },
                    { "line": 10, "description": "j++", "changes": [{ "variable": "j", "before": 0, "after": 1 }] },
                    { "line": 10, "description": "j 조건 검사 (1<3)", "condition": { "expression": "j<3", "result": true } },
                    { "line": 12, "description": "조건 검사 (list[1]<list[2]: 5<4)", "condition": { "expression": "list[j]<list[j+1]", "result": false } },
                    { "line": 10, "description": "j++", "changes": [{ "variable": "j", "before": 1, "after": 2 }] },
                    { "line": 10, "description": "j 조건 검사 (2<3)", "condition": { "expression": "j<3", "result": true } },
                    { "line": 12, "description": "조건 검사 (list[2]<list[3]: 4<3)", "condition": { "expression": "list[j]<list[j+1]", "result": false } },
                    { "line": 10, "description": "j++", "changes": [{ "variable": "j", "before": 2, "after": 3 }] },
                    { "line": 10, "description": "j 조건 검사 (3<3)", "condition": { "expression": "j<3", "result": false } },
                    { "line": 8, "description": "i--", "changes": [{ "variable": "i", "before": 3, "after": 2 }] },
                    { "line": 8, "description": "i 조건 검사 (2>0)", "condition": { "expression": "i>0", "result": true } },
                    { "line": 10, "description": "j=0으로 초기화", "changes": [{ "variable": "j", "before": 3, "after": 0 }] },
                    { "line": 10, "description": "j 조건 검사 (0<2)", "condition": { "expression": "j<2", "result": true } },
                    { "line": 12, "description": "조건 검사 (list[0]<list[1]: 7<5)", "condition": { "expression": "list[j]<list[j+1]", "result": false } },
                    { "line": 10, "description": "j++", "changes": [{ "variable": "j", "before": 0, "after": 1 }] },
                    { "line": 10, "description": "j 조건 검사 (1<2)", "condition": { "expression": "j<2", "result": true } },
                    { "line": 12, "description": "조건 검사 (list[1]<list[2]: 5<4)", "condition": { "expression": "list[j]<list[j+1]", "result": false } },
                    { "line": 10, "description": "j++", "changes": [{ "variable": "j", "before": 1, "after": 2 }] },
                    { "line": 10, "description": "j 조건 검사 (2<2)", "condition": { "expression": "j<2", "result": false } },
                    { "line": 8, "description": "i--", "changes": [{ "variable": "i", "before": 2, "after": 1 }] },
                    { "line": 8, "description": "i 조건 검사 (1>0)", "condition": { "expression": "i>0", "result": true } },
                    { "line": 10, "description": "j=0으로 초기화", "changes": [{ "variable": "j", "before": 2, "after": 0 }] },
                    { "line": 10, "description": "j 조건 검사 (0<1)", "condition": { "expression": "j<1", "result": true } },
                    { "line": 12, "description": "조건 검사 (list[0]<list[1]: 7<5)", "condition": { "expression": "list[j]<list[j+1]", "result": false } },
                    { "line": 10, "description": "j++", "changes": [{ "variable": "j", "before": 0, "after": 1 }] },
                    { "line": 10, "description": "j 조건 검사 (1<1)", "condition": { "expression": "j<1", "result": false } },
                    { "line": 8, "description": "i--", "changes": [{ "variable": "i", "before": 1, "after": 0 }] },
                    { "line": 8, "description": "i 조건 검사 (0>0)", "condition": { "expression": "i>0", "result": false } },
                    { "line": 22, "description": "함수 bubble_sort 반환", "stack": [] },
                    { "line": 25, "description": "정렬된 배열 출력 (list: [7, 5, 4, 3, 1])" }
                ]
            }, null, 2),
            type: "json"
        },
        {
            name: "graph.json",
            code: JSON.stringify({
  "algorithm": "graph",
  "lang": "c",
  "input": "",
  "variables": [
    { "name": "g", "type": "graph", "initialValue": "empty", "currentValue": "adjacency matrix filled" }
  ],
  "functions": [
    { "name": "init", "params": ["g"], "called": 1 },
    { "name": "insert_vertex", "params": ["g", "v"], "called": 4 },
    { "name": "insert_edge", "params": ["g", "start", "end"], "called": 5 },
    { "name": "print_adj_mat", "params": ["g"], "called": 1 }
  ],
  "steps": [
    {
      "line": 41,
      "description": "그래프 생성 및 초기화",
      "changes": [
        { "variable": "g", "before": "empty", "after": "n=0, adj_mat 초기화됨" }
      ],
      "dataStructure": {
        "type": "graph",
        "nodes": []
      }
    },
    {
      "line": 43,
      "description": "정점 0 삽입 (n=1)",
      "changes": [
        { "variable": "g", "before": "n=0", "after": "n=1" }
      ],
      "dataStructure": {
        "type": "graph",
        "nodes": ["0"]
      }
    },
    {
      "line": 43,
      "description": "정점 1 삽입 (n=2)",
      "changes": [
        { "variable": "g", "before": "n=1", "after": "n=2" }
      ],
      "dataStructure": {
        "type": "graph",
        "nodes": ["0", "1"]
      }
    },
    {
      "line": 43,
      "description": "정점 2 삽입 (n=3)",
      "changes": [
        { "variable": "g", "before": "n=2", "after": "n=3" }
      ],
      "dataStructure": {
        "type": "graph",
        "nodes": ["0", "1", "2"]
      }
    },
    {
      "line": 43,
      "description": "정점 3 삽입 (n=4)",
      "changes": [
        { "variable": "g", "before": "n=3", "after": "n=4" }
      ],
      "dataStructure": {
        "type": "graph",
        "nodes": ["0", "1", "2", "3"]
      }
    },
    {
      "line": 44,
      "description": "간선 (0,1) 추가",
      "changes": [],
      "dataStructure": {
        "type": "graph",
        "nodes": ["0", "1", "2", "3"],
        "edges": [["0", "1"]]
      }
    },
    {
      "line": 45,
      "description": "간선 (0,2) 추가",
      "changes": [],
      "dataStructure": {
        "type": "graph",
        "nodes": ["0", "1", "2", "3"],
        "edges": [["0", "1"], ["0", "2"]]
      }
    },
    {
      "line": 46,
      "description": "간선 (0,3) 추가",
      "changes": [],
      "dataStructure": {
        "type": "graph",
        "nodes": ["0", "1", "2", "3"],
        "edges": [["0", "1"], ["0", "2"], ["0", "3"]]
      }
    },
    {
      "line": 47,
      "description": "간선 (1,2) 추가",
      "changes": [],
      "dataStructure": {
        "type": "graph",
        "nodes": ["0", "1", "2", "3"],
        "edges": [["0", "1"], ["0", "2"], ["0", "3"], ["1", "2"]]
      }
    },
    {
      "line": 48,
      "description": "간선 (2,3) 추가",
      "changes": [],
      "dataStructure": {
        "type": "graph",
        "nodes": ["0", "1", "2", "3"],
        "edges": [["0", "1"], ["0", "2"], ["0", "3"], ["1", "2"], ["2", "3"]]
      }
    },
    {
      "line": 49,
      "description": "인접 행렬 출력",
      "changes": [],
      "dataStructure": {
        "type": "graph",
        "nodes": ["0", "1", "2", "3"],
        "adjacencyMatrix": [
          [0, 1, 1, 1],
          [1, 0, 1, 0],
          [1, 1, 0, 1],
          [1, 0, 1, 0]
        ]
      }
    }
  ]
}, null, 2),
            type: "json"
        },
        {
            name: "binaryTree.json",
            code: JSON.stringify({
  "algorithm": "binary-tree",
  "lang": "c",
  "input": "",
  "variables": [
    { "name": "root", "type": "Node*", "initialValue": "NULL", "currentValue": "0x01" },
    { "name": "newNode", "type": "Node*", "initialValue": null, "currentValue": "0x05" }
  ],
  "functions": [
    { "name": "createNode", "params": ["data"] },
    { "name": "insert", "params": ["root", "data"] },
    { "name": "inorder", "params": ["root"] }
  ],
  "steps": [
    { "line": 29, "description": "main 시작, root 초기화", "changes": [{ "variable": "root", "before": "NULL", "after": "NULL" }] },
    { "line": 30, "description": "insert(root, 50) 호출", "stack": [{ "function": "insert", "params": ["NULL", 50] }] },
    { "line": 17, "description": "root == NULL, createNode(50) 호출", "stack": [{ "function": "createNode", "params": [50] }] },
    { "line": 11, "description": "newNode 생성 및 초기화", "changes": [{ "variable": "newNode", "before": null, "after": "0x01" }], "dataStructure": { "type": "bst", "nodes": [{ "id": "0x01", "value": 50, "links": [] }] } },
    { "line": 13, "description": "createNode 반환", "stack": [{ "function": "insert", "params": ["NULL", 50] }] },
    { "line": 18, "description": "insert 반환, root=0x01", "changes": [{ "variable": "root", "before": "NULL", "after": "0x01" }] },
    { "line": 31, "description": "insert(root, 30) 호출", "stack": [{ "function": "insert", "params": ["0x01", 30] }] },
    { "line": 19, "description": "30 < 50, insert(root->left, 30) 재귀호출", "stack": [{ "function": "insert", "params": ["NULL", 30] }] },
    { "line": 17, "description": "root==NULL, createNode(30) 호출", "stack": [{ "function": "createNode", "params": [30] }] },
    { "line": 11, "description": "newNode 생성 및 초기화", "changes": [{ "variable": "newNode", "before": "0x01", "after": "0x02" }], "dataStructure": { "type": "bst", "nodes": [{ "id": "0x01", "value": 50, "links": ["0x02"] }, { "id": "0x02", "value": 30, "links": [] }] } },
    { "line": 13, "description": "createNode 반환", "stack": [{ "function": "insert", "params": ["NULL", 30] }] },
    { "line": 18, "description": "재귀 insert 반환, root->left=0x02", "stack": [{ "function": "insert", "params": ["0x01", 30] }] },
    { "line": 22, "description": "insert 반환" },
    { "line": 32, "description": "insert(root, 70) 호출", "stack": [{ "function": "insert", "params": ["0x01", 70] }] },
    { "line": 20, "description": "70 > 50, insert(root->right, 70) 재귀호출", "stack": [{ "function": "insert", "params": ["NULL", 70] }] },
    { "line": 17, "description": "root==NULL, createNode(70) 호출", "stack": [{ "function": "createNode", "params": [70] }] },
    { "line": 11, "description": "newNode 생성 및 초기화", "changes": [{ "variable": "newNode", "before": "0x02", "after": "0x03" }], "dataStructure": { "type": "bst", "nodes": [{ "id": "0x01", "value": 50, "links": ["0x02", "0x03"] }, { "id": "0x02", "value": 30, "links": [] }, { "id": "0x03", "value": 70, "links": [] }] } },
    { "line": 13, "description": "createNode 반환", "stack": [{ "function": "insert", "params": ["NULL", 70] }] },
    { "line": 18, "description": "재귀 insert 반환, root->right=0x03", "stack": [{ "function": "insert", "params": ["0x01", 70] }] },
    { "line": 22, "description": "insert 반환" },
    { "line": 33, "description": "insert(root, 20) 호출", "stack": [{ "function": "insert", "params": ["0x01", 20] }] },
    { "line": 19, "description": "20 < 50, insert(root->left, 20) 재귀호출", "stack": [{ "function": "insert", "params": ["0x02", 20] }] },
    { "line": 19, "description": "20 < 30, insert(root->left, 20) 재귀호출", "stack": [{ "function": "insert", "params": ["NULL", 20] }] },
    { "line": 17, "description": "root==NULL, createNode(20) 호출", "stack": [{ "function": "createNode", "params": [20] }] },
    { "line": 11, "description": "newNode 생성 및 초기화", "changes": [{ "variable": "newNode", "before": "0x03", "after": "0x04" }], "dataStructure": { "type": "bst", "nodes": [{ "id": "0x01", "value": 50, "links": ["0x02", "0x03"] }, { "id": "0x02", "value": 30, "links": ["0x04"] }, { "id": "0x03", "value": 70, "links": [] }, { "id": "0x04", "value": 20, "links": [] }] } },
    { "line": 13, "description": "createNode 반환" },
    { "line": 18, "description": "재귀 insert 반환, root->left=0x04" },
    { "line": 18, "description": "재귀 insert 반환, root->left=0x02" },
    { "line": 22, "description": "insert 반환" },
    { "line": 34, "description": "insert(root, 40) 호출", "stack": [{ "function": "insert", "params": ["0x01", 40] }] },
    { "line": 19, "description": "40 < 50, insert(root->left, 40) 재귀호출", "stack": [{ "function": "insert", "params": ["0x02", 40] }] },
    { "line": 20, "description": "40 > 30, insert(root->right, 40) 재귀호출", "stack": [{ "function": "insert", "params": ["NULL", 40] }] },
    { "line": 17, "description": "root==NULL, createNode(40) 호출", "stack": [{ "function": "createNode", "params": [40] }] },
    { "line": 11, "description": "newNode 생성 및 초기화", "changes": [{ "variable": "newNode", "before": "0x04", "after": "0x05" }], "dataStructure": { "type": "bst", "nodes": [{ "id": "0x01", "value": 50, "links": ["0x02", "0x03"] }, { "id": "0x02", "value": 30, "links": ["0x04", "0x05"] }, { "id": "0x03", "value": 70, "links": [] }, { "id": "0x04", "value": 20, "links": [] }, { "id": "0x05", "value": 40, "links": [] }] } },
    { "line": 13, "description": "createNode 반환" },
    { "line": 18, "description": "재귀 insert 반환, root->right=0x05" },
    { "line": 18, "description": "재귀 insert 반환, root->left=0x02" },
    { "line": 22, "description": "insert 반환" },
    { "line": 36, "description": "printf(\"Inorder Traversal\")" },
    { "line": 37, "description": "inorder(root) 호출", "stack": [{ "function": "inorder", "params": ["0x01"] }] },
    { "line": 25, "description": "inorder(root->left) 호출", "stack": [{ "function": "inorder", "params": ["0x02"] }] },
    { "line": 25, "description": "inorder(root->left) 호출", "stack": [{ "function": "inorder", "params": ["0x04"] }] },
    { "line": 25, "description": "inorder(root->left=NULL), 반환" },
    { "line": 27, "description": "출력: 20" },
    { "line": 28, "description": "inorder(root->right=NULL), 반환" },
    { "line": 27, "description": "출력: 30" },
    { "line": 28, "description": "inorder(root->right) 호출", "stack": [{ "function": "inorder", "params": ["0x05"] }] },
    { "line": 25, "description": "inorder(root->left=NULL), 반환" },
    { "line": 27, "description": "출력: 40" },
    { "line": 28, "description": "inorder(root->right=NULL), 반환" },
    { "line": 27, "description": "출력: 50" },
    { "line": 28, "description": "inorder(root->right) 호출", "stack": [{ "function": "inorder", "params": ["0x03"] }] },
    { "line": 25, "description": "inorder(root->left=NULL), 반환" },
    { "line": 27, "description": "출력: 70" },
    { "line": 28, "description": "inorder(root->right=NULL), 반환" },
    { "line": 39, "description": "main 종료" }
  ]
}, null, 2),
            type: "json"
        }

    ]);

    // 🆕 파일 타입 감지 함수
    const getFileType = (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        return extension === 'json' ? 'json' : 'code';
    };

    // 🆕 현재 파일과 매칭되는 JSON 파일명 생성
    const getMatchingJsonFileName = (codeFileName) => {
        const baseName = codeFileName.split('.')[0];
        return `${baseName}.json`;
    };

    // 🆕 현재 파일과 매칭되는 코드 파일명 생성
    const getMatchingCodeFileName = (jsonFileName) => {
        const baseName = jsonFileName.split('.')[0];
        // 기본적으로 .c 확장자를 사용하지만, 실제로는 매칭되는 파일을 찾아야 함
        const possibleExtensions = ['.c', '.cpp', '.py', '.java', '.js'];

        for (const ext of possibleExtensions) {
            const candidateName = `${baseName}${ext}`;
            const exists = savedFiles.find(f => f.name === candidateName) ||
                dummyFiles.find(f => f.name === candidateName);
            if (exists) return candidateName;
        }

        return `${baseName}.c`; // 기본값
    };

    // 🆕 JSON 파일 생성/업데이트 함수
    const createOrUpdateJsonFile = async (jsonFileName, visualizationData) => {
        try {
            const jsonContent = JSON.stringify(visualizationData, null, 2);

            // savedFiles에서 기존 JSON 파일 찾기
            const existingFileIndex = savedFiles.findIndex(f => f.name === jsonFileName);

            if (existingFileIndex >= 0) {
                // 기존 파일 업데이트
                const updatedFiles = [...savedFiles];
                updatedFiles[existingFileIndex] = {
                    name: jsonFileName,
                    code: jsonContent,
                    type: 'json'
                };
                setSavedFiles(updatedFiles);
                console.log(`✅ JSON 파일 업데이트됨: ${jsonFileName}`);
            } else {
                // 새 JSON 파일 생성
                const newJsonFile = {
                    name: jsonFileName,
                    code: jsonContent,
                    type: 'json'
                };
                setSavedFiles(prev => [...prev, newJsonFile]);
                console.log(`✅ JSON 파일 생성됨: ${jsonFileName}`);
            }

            return jsonContent;
        } catch (error) {
            console.error('❌ JSON 파일 생성/업데이트 실패:', error);
            throw error;
        }
    };



// 🆕 개선된 시각화 클릭 핸들러 (AST 부분만 저장)
// IDE.jsx의 handleVisualizationClick 함수에서 수정할 부분

// 🆕 개선된 시각화 클릭 핸들러 (AST 부분만 저장)
// 🆕 JSON 파일 생성/업데이트 함수 (문자열 그대로 저장)
const createOrUpdateJsonFileRaw = async (jsonFileName, content) => {
    try {
        // savedFiles에서 기존 JSON 파일 찾기
        const existingFileIndex = savedFiles.findIndex(f => f.name === jsonFileName);

        if (existingFileIndex >= 0) {
            // 기존 파일 업데이트
            const updatedFiles = [...savedFiles];
            updatedFiles[existingFileIndex] = {
                name: jsonFileName,
                code: content, // JSON.stringify 없이 직접 저장
                type: 'json'
            };
            setSavedFiles(updatedFiles);
            console.log(`✅ JSON 파일 업데이트됨: ${jsonFileName}`);
        } else {
            // 새 JSON 파일 생성
            const newJsonFile = {
                name: jsonFileName,
                code: content, // JSON.stringify 없이 직접 저장
                type: 'json'
            };
            setSavedFiles(prev => [...prev, newJsonFile]);
            console.log(`✅ JSON 파일 생성됨: ${jsonFileName}`);
        }

        return content;
    } catch (error) {
        console.error('❌ JSON 파일 생성/업데이트 실패:', error);
        throw error;
    }
};

// 🆕 개선된 시각화 클릭 핸들러 (AST 부분만 저장)
const handleVisualizationClick = async () => {
    if (!code.trim()) {
        alert('시각화할 코드를 먼저 작성해주세요.');
        return;
    }

    const fileType = getFileType(fileName);
    setCurrentFileType(fileType);

    if (fileType === 'json') {
        // JSON 파일인 경우: API 호출 없이 에디터 내용을 직접 파싱
        console.log('📄 JSON 파일 시각화 - API 호출 없음');
        try {
            const jsonData = JSON.parse(code);
            setSelectedJsonData(jsonData);
            setIsExampleFile(false);
            setIsVisualizationModalOpen(true);
        } catch (error) {
            alert(`JSON 형식이 올바르지 않습니다: ${error.message}`);
            return;
        }
    } else {
        // 코드 파일인 경우: API 호출 후 AST 부분만 JSON 파일로 생성/덮어쓰기
        console.log('💻 코드 파일 시각화 - API 호출 후 AST만 JSON 생성');

        try {
            // API 호출
            const apiUrl = config.API_ENDPOINTS.VISUALIZE_CODE || `${config.API_BASE_URL}/visualize`;
            const requestBody = {
                code: code,
                input: input,
                lang: mapLanguageToAPI(selectedLanguage)
            };

            console.log('🚀 시각화 API 호출:', requestBody);

            const response = await fetch(`${config.API_BASE_URL}/api/code/visualize`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
            }

            const apiResponse = await response.json();
            console.log('✅ API 응답 수신:', apiResponse);

            // 🔥 핵심 변경: AST 부분만 추출 (API에서 온 따옴표 제거)
            let visualizationData = apiResponse.ast || "AST 데이터가 없습니다.";
            
            if (typeof visualizationData === 'string') {
                // 앞부분 제거
                if (visualizationData.startsWith('```json\n')) {
                    visualizationData = visualizationData.slice(7); // "```json\n"는 7글자
                }

                // 뒷부분 제거
                if (visualizationData.endsWith('\n```')) {
                    visualizationData = visualizationData.slice(0, -4); // "\n```"는 4글자
                }
            }
            console.log('📊 AST 데이터 추출 (따옴표 제거 후):', visualizationData);

            // 매칭되는 JSON 파일명 생성
            const jsonFileName = getMatchingJsonFileName(fileName);

            // AST 데이터를 JSON 파일로 생성/업데이트 (JSON.stringify 없이 직접 저장)
            await createOrUpdateJsonFileRaw(jsonFileName, visualizationData);

            // 시각화 모달 열기
            setSelectedJsonData(visualizationData);
            setIsExampleFile(false);
            setIsVisualizationModalOpen(true);

            toast(`시각화 완료! ${jsonFileName} 파일이 생성/업데이트되었습니다.`);

        } catch (error) {
            console.error('❌ 시각화 실패:', error);
            alert(`시각화 실패: ${error.message}`);
        }
    }
};

    // 🆕 개선된 파일 선택 핸들러
    const handleFileSelect = (name) => {
        if (!isSaved) {
            const shouldSave = window.confirm('변경 사항을 저장하시겠습니까?');
            if (shouldSave) {
                handleSave();
            }
        }

        const selectedFile = savedFiles.find((file) => file.name === name);
        if (selectedFile) {
            setFileName(selectedFile.name);
            setCode(selectedFile.code);
            setActiveFile(selectedFile.name);
            setIsSaved(true);

            // 파일 타입 설정
            const fileType = getFileType(selectedFile.name);
            setCurrentFileType(fileType);

            // 일반 파일 선택 시 예제 파일 상태 초기화
            setSelectedJsonData(null);
            setIsExampleFile(false);

            // 파일 확장자에 맞는 언어 설정
            const langId = getLanguageFromFileName(selectedFile.name);
            if (langId && langId !== selectedLanguage) {
                setSelectedLanguage(langId);
            }

            console.log(`📁 파일 선택: ${name} (타입: ${fileType})`);
        }
    };

    // 🆕 더미 파일 선택 핸들러 개선
    const handleDummyFileSelect = (file) => {
        if (!isSaved) {
            const shouldContinue = window.confirm('현재 파일에 저장되지 않은 변경사항이 있습니다. 예제 파일을 불러오시겠습니까?');
            if (!shouldContinue) return;
        }

        setCode(file.code);
        setFileName(file.name);

        // 파일 타입 설정
        const fileType = getFileType(file.name);
        setCurrentFileType(fileType);

        if (file.type === 'json') {
            // JSON 예제 파일인 경우
            try {
                const jsonData = JSON.parse(file.code);
                setSelectedJsonData(jsonData);
                setIsExampleFile(true);
                console.log('🗂️ JSON 예제 파일 선택:', file.name);
                toast(`JSON 예제 파일 "${file.name}"을 불러왔습니다.`);
            } catch (error) {
                console.error('JSON 파싱 실패:', error);
                setSelectedJsonData(null);
                setIsExampleFile(false);
            }
        } else {
            // 코드 예제 파일인 경우
            setSelectedJsonData(null);
            setIsExampleFile(false);
            toast(`코드 예제 파일 "${file.name}"을 불러왔습니다.`);
        }

        // 언어 설정
        const extension = file.name.split('.').pop().toLowerCase();
        const languageFromExtension = getLanguageFromExtension(extension);
        if (languageFromExtension && languageFromExtension !== selectedLanguage) {
            setSelectedLanguage(languageFromExtension);
        }

        setIsSaved(false);
        setActiveFile('');

        console.log(`📚 예제 파일 선택: ${file.name} (타입: ${fileType})`);
    };

    // 🆕 파일 생성 시 자동으로 매칭 파일 확인
    const handleNewFile = () => {
        const currentLang = supportedLanguages.find(lang => lang.id === selectedLanguage) || supportedLanguages[0];
        const defaultName = `untitled${savedFiles.length + 1}${currentLang.extension}`;
        const newFileName = prompt('새 파일 이름을 입력하세요:', defaultName);

        if (!newFileName) return;

        if (savedFiles.some(file => file.name === newFileName)) {
            alert('이미 존재하는 파일 이름입니다.');
            return;
        }

        const fileType = getFileType(newFileName);
        const newFile = {
            name: newFileName,
            code: fileType === 'json' ? '{}' : currentLang.template,
            type: fileType
        };

        setSavedFiles([...savedFiles, newFile]);
        setFileName(newFileName);
        setCode(newFile.code);
        setActiveFile(newFileName);
        setIsSaved(true);
        setCurrentFileType(fileType);

        // 새 파일 생성 시 예제 파일 상태 초기화
        setSelectedJsonData(null);
        setIsExampleFile(false);

        // JSON 파일이 아닌 경우에만 언어 업데이트
        if (fileType !== 'json') {
            const fileExtension = newFileName.split('.').pop().toLowerCase();
            const languageFromExtension = getLanguageFromExtension(fileExtension);
            if (languageFromExtension !== selectedLanguage) {
                setSelectedLanguage(languageFromExtension);
            }
        }

        console.log(`✨ 새 파일 생성: ${newFileName} (타입: ${fileType})`);
    };

    // 🆕 파일 목록을 타입별로 분리하여 렌더링
    const renderFilesByType = () => {
        const codeFiles = savedFiles.filter(f => f.type === 'code');
        const jsonFiles = savedFiles.filter(f => f.type === 'json');

        return (
            <>
                {/* 코드 파일 섹션 */}
                <div className="file-type-section">
                    <div className="file-type-header">
                        <span className="icon-small">💻</span>
                        <span>코드 파일</span>
                        <span className="file-count">({codeFiles.length})</span>
                    </div>
                    <div className="file-list">
                        {codeFiles.map((file) => (
                            <div
                                key={file.name}
                                className={`file-item ${activeFile === file.name ? 'active' : ''}`}
                                onClick={() => handleFileSelect(file.name)}
                            >
                                <span className="icon-small">📄</span>
                                <span>{file.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* JSON 파일 섹션 */}
                {jsonFiles.length > 0 && (
                    <div className="file-type-section">
                        <div className="file-type-header">
                            <span className="icon-small">🗂️</span>
                            <span>JSON 파일</span>
                            <span className="file-count">({jsonFiles.length})</span>
                        </div>
                        <div className="file-list">
                            {jsonFiles.map((file) => (
                                <div
                                    key={file.name}
                                    className={`file-item json-file ${activeFile === file.name ? 'active' : ''}`}
                                    onClick={() => handleFileSelect(file.name)}
                                >
                                    <span className="icon-small">📊</span>
                                    <span>{file.name}</span>
                                    <span className="file-type-badge">JSON</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </>
        );
    };

    // 🆕 예제 파일도 타입별로 분리
    const renderExampleFilesByType = () => {
        const codeExamples = dummyFiles.filter(f => f.type === 'code');
        const jsonExamples = dummyFiles.filter(f => f.type === 'json');

        return (
            <>
                {/* 코드 예제 */}
                <div className="example-subsection">
                    <div className="example-subsection-header">
                        <span className="icon-small">💻</span>
                        <span>코드 예제</span>
                    </div>
                    {codeExamples.map((file, index) => (
                        <div
                            key={`code-${index}`}
                            className={`example-file-item ${fileName === file.name && !activeFile ? 'active' : ''}`}
                            onClick={() => handleDummyFileSelect(file)}
                        >
                            <span className="icon-small">📝</span>
                            <span className="file-name">{file.name}</span>
                        </div>
                    ))}
                </div>

                {/* JSON 예제 */}
                <div className="example-subsection">
                    <div className="example-subsection-header">
                        <span className="icon-small">🗂️</span>
                        <span>JSON 예제</span>
                    </div>
                    {jsonExamples.map((file, index) => (
                        <div
                            key={`json-${index}`}
                            className={`example-file-item json-example ${fileName === file.name && !activeFile ? 'active' : ''}`}
                            onClick={() => handleDummyFileSelect(file)}
                        >
                            <span className="icon-small">📊</span>
                            <span className="file-name">{file.name}</span>
                            <span className="file-type-badge">JSON</span>
                        </div>
                    ))}
                </div>
            </>
        );
    };

    // 나머지 기존 함수들 (useEffect, 언어 관련, 에디터 관련 등)은 그대로 유지
    // ... (기존 코드 유지)

    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.body.classList.contains('dark-mode');
    });

    const [selectedLanguage, setSelectedLanguage] = useState('python');
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

    const supportedLanguages = [
        { id: 'python', name: 'Python', extension: '.py', template: '# 여기에 Python 코드를 입력하세요', color: '#3572A5' },
        { id: 'java', name: 'Java', extension: '.java', template: '// 여기에 Java 코드를 입력하세요\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}', color: '#B07219' },
        { id: 'cpp', name: 'C++', extension: '.cpp', template: '// 여기에 C++ 코드를 입력하세요\n#include <iostream>\n\nint main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}', color: '#f34b7d' },
        { id: 'c', name: 'C', extension: '.c', template: '// 여기에 C 코드를 입력하세요\n#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}', color: '#555555' },
        { id: 'javascript', name: 'JavaScript', extension: '.js', template: '// 여기에 JavaScript 코드를 입력하세요\nconsole.log("Hello World");', color: '#f1e05a' },
    ];

    const editorRef = useRef(null);

    // 기존 useEffect들과 다른 함수들 유지
    useEffect(() => {
        applyResizeObserverFix();
        const updateAllEditorLayouts = () => {
            if (editorRef.current) {
                window.requestAnimationFrame(() => {
                    try {
                        editorRef.current.layout();
                    } catch (e) {
                        console.warn('에디터 레이아웃 업데이트 중 오류:', e);
                    }
                });
            }
        };
        window.addEventListener('resize', updateAllEditorLayouts);
        const initialLayoutTimeout = setTimeout(() => {
            updateAllEditorLayouts();
        }, 500);
        return () => {
            window.removeEventListener('resize', updateAllEditorLayouts);
            clearTimeout(initialLayoutTimeout);
        };
    }, []);

    // 기존의 다른 유지 함수들
    const getLanguageFromExtension = (extension) => {
        const extensionMap = {
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'js': 'javascript'
        };
        return extensionMap[extension] || 'python';
    };

    const getLanguageFromFileName = (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        const languageMap = {
            'py': 'python',
            'js': 'javascript',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'cs': 'csharp',
            'php': 'php',
            'rb': 'ruby',
            'ts': 'typescript'
        };
        return languageMap[extension] || 'plaintext';
    };

    const mapLanguageToAPI = (langId) => {
        switch (langId) {
            case 'cpp':
                return 'c';
            case 'javascript':
                return 'javascript';
            default:
                return langId;
        }
    };

    const handleEditorChange = (value) => {
        setCode(value);
        setIsSaved(false);
    };

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        const editorOptions = {
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            renderLineHighlight: 'line',
            renderWhitespace: 'none',
            automaticLayout: false,
            wordWrap: "bounded",
            wordWrapColumn: 120,
            scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
            }
        };
        editor.updateOptions(editorOptions);

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function() {
            handleSave();
        });

        monaco.editor.defineTheme('custom-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.lineHighlightBackground': '#7e57c233',
                'editor.lineHighlightBorder': '#7e57c244'
            }
        });

        monaco.editor.defineTheme('custom-light', {
            base: 'vs',
            inherit: true,
            rules: [],
            colors: {
                'editor.lineHighlightBackground': '#6a47b811',
                'editor.lineHighlightBorder': '#6a47b822'
            }
        });

        const updateEditorTheme = (monaco) => {
            if (!monaco && !editorRef.current) return;
            const m = monaco || window.monaco;
            if (m) {
                m.editor.setTheme(isDarkMode ? 'custom-dark' : 'custom-light');
            }
        };

        updateEditorTheme(monaco);

        setTimeout(() => {
            try {
                editor.layout();
            } catch (e) {
                console.warn('에디터 초기 레이아웃 설정 중 오류:', e);
            }
        }, 100);
    };

    const handleSave = () => {
        if (!isLoggedIn) {
            alert("로그인 후 이용 가능한 기능입니다.");
            return;
        }

        try {
            const currentCode = editorRef.current.getValue();
            const existingFileIndex = savedFiles.findIndex((file) => file.name === fileName);

            if (existingFileIndex >= 0) {
                const updatedFiles = [...savedFiles];
                updatedFiles[existingFileIndex] = {
                    name: fileName,
                    code: currentCode,
                    type: getFileType(fileName)
                };
                setSavedFiles(updatedFiles);
            } else {
                setSavedFiles([...savedFiles, {
                    name: fileName,
                    code: currentCode,
                    type: getFileType(fileName)
                }]);
            }

            setIsSaved(true);
            setCode(currentCode);
            toast("파일이 저장되었습니다.");
        } catch (error) {
            console.error('파일 저장 중 오류:', error);
            toast("저장 중 오류가 발생했습니다.");
        }
    };

    const handleRun = async () => {
        // JSON 파일은 실행할 수 없음
        if (currentFileType === 'json') {
            alert('JSON 파일은 실행할 수 없습니다. 시각화 버튼을 사용해주세요.');
            return;
        }

        setIsRunning(true);
        setOutput("실행 중...");

        try {
            const currentCode = editorRef.current.getValue();
            const requestBody = {
                code: currentCode,
                input: input,
                lang: mapLanguageToAPI(selectedLanguage)
            };

            const response = await fetch(config.API_ENDPOINTS.RUN_CODE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const stdout = result.stdout || result.Stdout || result.STDOUT ||
                result.output || result.Output || result.OUTPUT;

            if (stdout !== undefined) {
                setOutput(stdout || "실행 완료 (출력 없음)");
            } else {
                const errorMsg = result.stderr || result.error || result.message;
                if (errorMsg) {
                    setOutput(`오류: ${errorMsg}`);
                } else {
                    setOutput("실행 완료되었지만 출력이 없습니다.");
                }
            }

        } catch (error) {
            console.error('코드 실행 중 오류:', error);
            setOutput(`오류 발생: ${error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const toggleLanguageMenu = () => {
        setIsLanguageMenuOpen(!isLanguageMenuOpen);
    };

    const selectLanguage = (langId) => {
        const newLanguage = supportedLanguages.find(lang => lang.id === langId);

        if (newLanguage) {
            if (!isSaved) {
                const shouldChange = window.confirm('저장되지 않은 변경사항이 있습니다. 언어를 변경하시겠습니까?');
                if (!shouldChange) {
                    setIsLanguageMenuOpen(false);
                    return;
                }
            }

            const baseName = fileName.split('.')[0];
            const newFileName = `${baseName}${newLanguage.extension}`;

            setSelectedLanguage(langId);
            setFileName(newFileName);
            setCode(newLanguage.template);
            setIsSaved(false);
            setIsLanguageMenuOpen(false);

            if (isLoggedIn) {
                setActiveFile(newFileName);
                const newFile = { name: newFileName, code: newLanguage.template, type: 'code' };
                setSavedFiles(prev => {
                    const exists = prev.find(f => f.name === newFileName);
                    if (!exists) {
                        return [...prev, newFile];
                    }
                    return prev;
                });
            }
        }
    };

    const toast = (message) => {
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            document.getElementById('toast-container')?.removeChild(toast);
        });

        const toastElement = document.createElement('div');
        toastElement.className = 'toast toast-success';
        toastElement.textContent = message;

        const container = document.getElementById('toast-container');
        if (!container) {
            const newContainer = document.createElement('div');
            newContainer.id = 'toast-container';
            document.body.appendChild(newContainer);
            newContainer.appendChild(toastElement);
        } else {
            container.appendChild(toastElement);
        }

        setTimeout(() => {
            toastElement.classList.add('show');
        }, 10);

        setTimeout(() => {
            toastElement.classList.remove('show');
            setTimeout(() => {
                const container = document.getElementById('toast-container');
                if (container && container.contains(toastElement)) {
                    container.removeChild(toastElement);
                }
            }, 300);
        }, 3000);
    };

    // 로그인 체크, URL 처리 등 기존 useEffect들 (간소화)
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const storedUsername = localStorage.getItem('username');
            const newIsLoggedIn = !!(token && storedUsername);
            const newUsername = storedUsername || '';

            if (newIsLoggedIn !== isLoggedIn) {
                setIsLoggedIn(newIsLoggedIn);
            }
            if (newUsername !== username) {
                setUsername(newUsername);
            }
        };

        checkAuth();
        const interval = setInterval(checkAuth, 500);
        return () => clearInterval(interval);
    }, [isLoggedIn, username]);

    return (
        <div className="ide-container">
            <div className={`sidebar ${isLeftPanelCollapsed ? 'collapsed' : ''}`}>
                {isLoggedIn ? (
                    <>
                        {/* 내 파일 섹션 - 타입별로 분리 */}
                        <div className="my-files-section">
                            <div className="sidebar-header">
                                <div className="file-list-header">
                                    <span className="icon-small">📁</span>
                                    <span>내 파일</span>
                                    <button className="icon-button" onClick={handleNewFile}>
                                        <span className="icon-small">+</span>
                                    </button>
                                </div>
                            </div>
                            {renderFilesByType()}
                        </div>

                        {/* 예제 파일 섹션 - 타입별로 분리 */}
                        <div className="example-files-section">
                            <div className="example-files-header">
                                <span className="icon-small">📚</span>
                                <span>예제 파일</span>
                            </div>
                            <div className="example-files-list">
                                {renderExampleFilesByType()}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="auth-sidebar">
                        <div className="auth-header">
                            <div className="auth-title">
                                <span className="icon-small">🔐</span>
                                <span>계정 접속</span>
                            </div>
                        </div>
                        <div className="auth-content">
                            <div className="auth-message">
                                <p>아직 계정이 없으신가요?</p>
                            </div>
                            <div className="auth-buttons">
                                <Link to="/login" className="login-button auth-button">
                                    <span className="icon-small">🔑</span>
                                    로그인
                                </Link>
                                <Link to="/signup" className="signup-button auth-button">
                                    <span className="icon-small">✏️</span>
                                    회원가입
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 메인 콘텐츠 */}
            <div className={`main-content ${!isLoggedIn ? 'guest-mode' : ''}`}>
                {/* 상단 헤더 */}
                <div className="main-header">
                    <div className="header-left">
                        <button
                            onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                            className="sidebar-toggle-button"
                        >
                            <div className="hamburger-icon">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </button>

                        <div className="language-selector">
                            <button
                                className={`language-button lang-${selectedLanguage}`}
                                onClick={toggleLanguageMenu}
                            >
                                {supportedLanguages.find(lang => lang.id === selectedLanguage)?.name || 'Python'}
                                <span className="dropdown-arrow">{isLanguageMenuOpen ? '▲' : '▼'}</span>
                            </button>

                            {isLanguageMenuOpen && (
                                <div className="language-dropdown">
                                    {supportedLanguages.map(lang => (
                                        <div
                                            key={lang.id}
                                            className={`language-item ${selectedLanguage === lang.id ? 'active' : ''} lang-border-${lang.id}`}
                                            onClick={() => selectLanguage(lang.id)}
                                        >
                                            {lang.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 🆕 현재 파일 타입 표시 */}
                        <div className="file-type-indicator">
                            <span className={`file-type-badge ${currentFileType === 'json' ? 'json-type' : 'code-type'}`}>
                                {currentFileType === 'json' ? '📊 JSON' : '💻 코드'}
                            </span>
                        </div>
                    </div>

                    <div className="header-right">
                        <div className="login-status-container">
                            <span className={`login-status ${isLoggedIn ? 'logged-in' : 'guest'}`}>
                                {isLoggedIn ? `${username} 님` : '비회원 모드'}
                            </span>
                        </div>

                        {isLoggedIn ? (
                            <>
                                <input
                                    type="text"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    className="filename-input"
                                    placeholder="파일명.확장자"
                                />
                                <button className="save-button" onClick={handleSave}>
                                    저장
                                </button>
                                <span className={`save-indicator ${isSaved ? 'saved' : ''}`}>
                                    {isSaved && '✓'}
                                </span>
                            </>
                        ) : (
                            <div className="guest-controls">
                                <span className="guest-mode-text">제한된 기능으로 실행 중입니다</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 코드 에디터와 출력 영역 */}
                <div className="content-layout">
                    <div className="editor-section">
                        <div className="monaco-editor-wrapper">
                            <Editor
                                height="100%"
                                defaultLanguage={currentFileType === 'json' ? 'json' : selectedLanguage}
                                defaultValue={code}
                                language={currentFileType === 'json' ? 'json' : selectedLanguage}
                                value={code}
                                onChange={handleEditorChange}
                                onMount={handleEditorDidMount}
                                theme={isDarkMode ? "vs-dark" : "vs-light"}
                                options={{
                                    fontSize: 14,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    automaticLayout: false,
                                    tabSize: 4,
                                    insertSpaces: true,
                                    cursorBlinking: "solid",
                                    folding: true,
                                    lineNumbersMinChars: 3,
                                    wordWrap: "on",
                                    renderWhitespace: "none",
                                    renderLineHighlight: "line",
                                    renderLineHighlightOnlyWhenFocus: false,
                                    scrollbar: {
                                        useShadows: false,
                                        vertical: 'auto',
                                        horizontal: 'auto',
                                        verticalScrollbarSize: 10,
                                        horizontalScrollbarSize: 10
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="right-panel">
                        <div className="action-buttons">
                            <button
                                className="run-code-button"
                                onClick={handleRun}
                                disabled={isRunning || currentFileType === 'json'}
                                title={currentFileType === 'json' ? 'JSON 파일은 실행할 수 없습니다' : '코드 실행'}
                            >
                                <span className="button-icon">▶</span>
                                {currentFileType === 'json' ? '실행 불가' : '실행 코드'}
                            </button>
                            <button
                                className="visualization-button"
                                onClick={handleVisualizationClick}
                                title={currentFileType === 'json' ? 'JSON 데이터 시각화' : 'API를 통한 코드 시각화'}
                            >
                                <span className="button-icon">📊</span>
                                {currentFileType === 'json' ? 'JSON 시각화' : '코드 시각화'}
                            </button>
                        </div>

                        <div className="input-section">
                            <div className="section-header">
                                {currentFileType === 'json' ? 'JSON 데이터 (읽기 전용)' : '프로그램 입력'}
                            </div>
                            <textarea
                                className="program-input"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={currentFileType === 'json' ?
                                    'JSON 파일에서는 입력값이 사용되지 않습니다' :
                                    '프로그램 실행 시 필요한 입력값을 여기에 작성하세요'
                                }
                                disabled={currentFileType === 'json'}
                            ></textarea>
                        </div>

                        <div className="output-section">
                            <div className="section-header">
                                {currentFileType === 'json' ? 'JSON 정보' : '프로그램 출력'}
                            </div>
                            <pre className="program-output">
                                {currentFileType === 'json' ?
                                    'JSON 파일에서는 시각화 버튼을 사용하여 데이터를 확인하세요.' :
                                    (isRunning ? "실행 중..." : (output || "코드를 실행하면 결과가 여기에 표시됩니다."))
                                }
                            </pre>
                        </div>
                    </div>
                </div>
            </div>

            {/* 시각화 모달 */}
            <VisualizationModal
                isOpen={isVisualizationModalOpen}
                onClose={() => setIsVisualizationModalOpen(false)}
                code={code}
                language={selectedLanguage}
                input={input}
                preloadedJsonData={isExampleFile ? selectedJsonData : null}
                isJsonFile={currentFileType === 'json'}
            />

            <div id="toast-container"></div>
        </div>
    );
};

export default IDE;