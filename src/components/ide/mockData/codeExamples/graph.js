const graphExample = `#include <stdio.h>
#include <stdlib.h>

#define MAX_VERTICES 100

struct Graph {
    int vertices;
    int adjMatrix[MAX_VERTICES][MAX_VERTICES];
};

void initGraph(struct Graph* graph, int vertices) {
    graph->vertices = vertices;
    for (int i = 0; i < vertices; i++) {
        for (int j = 0; j < vertices; j++) {
            graph->adjMatrix[i][j] = 0;
        }
    }
}

void addEdge(struct Graph* graph, int src, int dest) {
    graph->adjMatrix[src][dest] = 1;
    graph->adjMatrix[dest][src] = 1;
}

void printGraph(struct Graph* graph) {
    printf("인접 행렬:\\n");
    for (int i = 0; i < graph->vertices; i++) {
        for (int j = 0; j < graph->vertices; j++) {
            printf("%d ", graph->adjMatrix[i][j]);
        }
        printf("\\n");
    }
}

int main() {
    struct Graph graph;
    initGraph(&graph, 5);

    addEdge(&graph, 0, 1);
    addEdge(&graph, 0, 4);
    addEdge(&graph, 1, 2);
    addEdge(&graph, 1, 3);
    addEdge(&graph, 1, 4);
    addEdge(&graph, 2, 3);
    addEdge(&graph, 3, 4);

    printGraph(&graph);

    return 0;
}`;

export default graphExample;
