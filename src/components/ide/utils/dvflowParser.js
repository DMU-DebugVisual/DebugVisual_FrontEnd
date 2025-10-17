// ==============================================
// 📄 src/components/ide/utils/dvflowParser.js
// ==============================================
// DV-Flow v1.3 이벤트 스트림을 IDE 시각화 레이어에서 사용하기 위한
// 1차 파서 및 타임라인 생성기. 기존 steps/variables 구조 대신 events 기반으로
// 상태를 계산한다.

const ALGORITHM_LABELS = {
    'bubble-sort': 'Bubble Sort',
    'graph': 'Adjacency Graph',
    'variables': 'Program Trace'
};

const cloneArray = (arr) => Array.isArray(arr) ? [...arr] : arr;
const deepCloneMatrix = (matrix) => matrix.map(row => [...row]);

const normalizeOutput = (data) => typeof data === 'string' ? data : String(data ?? '');

const detectByEvents = (events = []) => {
    if (!Array.isArray(events) || events.length === 0) {
        return 'variables';
    }

    const hasBubble = events.some(evt => evt.kind === 'call' && typeof evt.fn === 'string' && evt.fn.toLowerCase().includes('bubble'));
    if (hasBubble) return 'bubble-sort';

    const hasGraphAdj = events.some(evt => evt.kind === 'ds_op' && typeof evt.target === 'string' && evt.target.includes('adj_mat'));
    if (hasGraphAdj) return 'graph';

    return 'variables';
};

const parseIndexFromRef = (ref) => {
    if (typeof ref !== 'string') return null;
    const matched = ref.match(/\[(\d+)\]/);
    return matched ? Number(matched[1]) : null;
};

const buildBubbleSortFrames = (events = []) => {
    let listState = [];
    let pointers = { i: null, j: null };
    const outputs = [];
    const frames = [];

    events.forEach((event, idx) => {
        const frame = {
            index: idx,
            event,
            description: '',
            list: cloneArray(listState),
            pointers: { ...pointers },
            highlight: {},
            details: {}
        };

        switch (event.kind) {
            case 'call': {
                if (event.fn?.toLowerCase().includes('bubble')) {
                    const listArg = event.args?.find(arg => arg.name === 'list' || arg.name === 'arr');
                    if (listArg && Array.isArray(listArg.value)) {
                        listState = [...listArg.value];
                        frame.list = cloneArray(listState);
                    }
                    frame.description = 'bubble_sort 함수를 호출합니다.';
                } else {
                    frame.description = `${event.fn || '함수'} 호출`;
                }
                break;
            }
            case 'loopIter': {
                const iter = event.loop?.iter;
                const total = event.loop?.total;
                const viz = event.viz || {};

                if (typeof viz.i === 'number') pointers.i = viz.i;
                if (typeof viz.j === 'number') pointers.j = viz.j;
                if (Array.isArray(viz.list)) listState = [...viz.list];

                frame.pointers = { ...pointers };
                frame.list = cloneArray(listState);
                frame.description = `for 루프 반복 (${iter ?? '?'}/${(total ?? '?')})`;
                frame.details.loop = { iter, total };
                break;
            }
            case 'compare': {
                const indices = (event.read || [])
                    .map(read => parseIndexFromRef(read.ref))
                    .filter(i => typeof i === 'number');
                frame.highlight.compare = indices;
                frame.details.compareValues = event.read?.map(read => ({
                    ref: read.ref,
                    value: read.value
                }));
                frame.description = `${event.expr || '비교'} → ${event.result ? '참' : '거짓'}`;
                break;
            }
            case 'swap': {
                const [a, b] = event.indices || [];
                frame.highlight.swap = [a, b];
                if (Array.isArray(event.viz?.list)) {
                    listState = [...event.viz.list];
                } else if (typeof a === 'number' && typeof b === 'number') {
                    // 이벤트에 viz 정보가 없으면 기존 리스트를 스왑으로 갱신
                    const nextList = [...listState];
                    const temp = nextList[a];
                    nextList[a] = nextList[b];
                    nextList[b] = temp;
                    listState = nextList;
                }
                frame.list = cloneArray(listState);
                frame.description = `인덱스 ${a}와 ${b} 값 교환`;
                break;
            }
            case 'io': {
                const output = normalizeOutput(event.data).trimEnd();
                outputs.push(output);
                frame.description = `출력: ${output}`;
                frame.details.output = output;
                break;
            }
            case 'note': {
                frame.description = event.text || '설명 이벤트';
                break;
            }
            case 'assign': {
                const varName = event.var || '변수';
                frame.description = `${varName} = ${JSON.stringify(event.after)}`;
                break;
            }
            default: {
                frame.description = `${event.kind || '이벤트'} 처리`;
            }
        }

        // 프레임에 최신 상태 반영
        frame.list = cloneArray(listState);
        frame.pointers = { ...pointers };

        frames.push(frame);
    });

    return { frames, outputs };
};

const ensureMatrixSize = (matrix, size) => {
    if (size <= matrix.length) return matrix;
    const newMatrix = matrix.map(row => [...row, ...Array(size - row.length).fill(0)]);
    while (newMatrix.length < size) {
        newMatrix.push(Array(size).fill(0));
    }
    return newMatrix;
};

const collectEdgesFromMatrix = (matrix) => {
    const edges = [];
    for (let i = 0; i < matrix.length; i++) {
        for (let j = i + 1; j < matrix[i].length; j++) {
            if (matrix[i][j]) edges.push([i, j]);
        }
    }
    return edges;
};

const buildGraphFrames = (events = []) => {
    let vertexCount = 0;
    let adjacency = [];
    const outputs = [];
    const frames = [];

    const updateVertexCount = (count) => {
        if (typeof count === 'number' && count > vertexCount) {
            vertexCount = count;
            adjacency = ensureMatrixSize(adjacency, vertexCount);
        }
    };

    events.forEach((event, idx) => {
        const frame = {
            index: idx,
            event,
            description: '',
            vertexCount,
            adjacency: deepCloneMatrix(adjacency),
            edges: collectEdgesFromMatrix(adjacency),
            highlight: {},
            details: {}
        };

        switch (event.kind) {
            case 'assign': {
                if (typeof event.var === 'string' && event.var.includes('g->n')) {
                    updateVertexCount(Number(event.after));
                    frame.vertexCount = vertexCount;
                    frame.adjacency = deepCloneMatrix(adjacency);
                    frame.description = `그래프 정점 수 갱신: ${vertexCount}`;
                } else {
                    frame.description = `${event.var || '변수'} = ${JSON.stringify(event.after)}`;
                }
                break;
            }
            case 'call': {
                if (event.fn?.includes('insert_vertex')) {
                    const vertexArg = event.args?.find(arg => arg.name === 'v');
                    if (vertexArg && typeof vertexArg.value === 'number') {
                        updateVertexCount(vertexArg.value + 1);
                        frame.vertexCount = vertexCount;
                        frame.adjacency = deepCloneMatrix(adjacency);
                        frame.description = `정점 ${vertexArg.value} 추가`;
                    } else {
                        frame.description = '정점 추가 호출';
                    }
                } else if (event.fn?.includes('insert_edge')) {
                    const start = event.args?.find(arg => arg.name === 'start')?.value;
                    const end = event.args?.find(arg => arg.name === 'end')?.value;
                    if (typeof start === 'number' && typeof end === 'number') {
                        frame.highlight.edge = [start, end];
                        frame.description = `간선 (${start}, ${end}) 추가 준비`;
                    } else {
                        frame.description = '간선 추가 호출';
                    }
                } else {
                    frame.description = `${event.fn || '함수'} 호출`;
                }
                break;
            }
            case 'ds_op': {
                if (event.target?.includes('adj_mat') && event.op === 'set') {
                    const [start, end, value] = event.args || [];
                    updateVertexCount(Math.max(start, end) + 1);
                    adjacency = ensureMatrixSize(adjacency, vertexCount);
                    if (typeof start === 'number' && typeof end === 'number') {
                        adjacency[start][end] = value ? 1 : 0;
                        frame.highlight.edge = [start, end];
                        if (start !== end) adjacency[end][start] = value ? 1 : 0;
                        frame.description = `인접 행렬 업데이트: (${start}, ${end}) = ${value}`;
                    }
                    frame.adjacency = deepCloneMatrix(adjacency);
                    frame.edges = collectEdgesFromMatrix(adjacency);
                }
                break;
            }
            case 'io': {
                const line = normalizeOutput(event.data).trimEnd();
                outputs.push(line);
                frame.description = `출력: ${line}`;
                frame.details = { output: line };
                break;
            }
            case 'note': {
                frame.description = event.text || '그래프 설명';
                break;
            }
            default: {
                frame.description = `${event.kind || '이벤트'} 처리`;
            }
        }

        frame.vertexCount = vertexCount;
        frame.adjacency = deepCloneMatrix(adjacency);
        frame.edges = collectEdgesFromMatrix(adjacency);
        frames.push(frame);
    });

    return { frames, outputs };
};

const buildGenericFrames = (events = []) => {
    const outputs = [];
    const frames = events.map((event, idx) => {
        const frame = {
            index: idx,
            event,
            description: '',
            details: {}
        };

        switch (event.kind) {
            case 'note':
                frame.description = event.text || '설명';
                break;
            case 'io': {
                const output = normalizeOutput(event.data).trimEnd();
                outputs.push(output);
                frame.description = `출력: ${output}`;
                frame.details.output = output;
                break;
            }
            default:
                frame.description = `${event.kind || '이벤트'} 처리`;
        }

        return frame;
    });

    return { frames, outputs };
};

export const normalizeDVFlowData = (rawData = {}) => {
    const events = Array.isArray(rawData.events) ? rawData.events : [];
    const hasLegacySteps = (!events.length) && Array.isArray(rawData.steps);
    const detectedType = detectByEvents(events);

    let frames = [];
    let outputs = [];

    if (hasLegacySteps) {
        frames = rawData.steps.map((step, idx) => ({
            index: idx,
            event: null,
            description: step.description || `단계 ${idx + 1}`,
            details: { step }
        }));
        outputs = [];
    } else if (detectedType === 'bubble-sort') {
        ({ frames, outputs } = buildBubbleSortFrames(events));
    } else if (detectedType === 'graph') {
        ({ frames, outputs } = buildGraphFrames(events));
    } else {
        ({ frames, outputs } = buildGenericFrames(events));
    }

    const timeComplexity = rawData.analysis?.timeComplexity || rawData.TimeComplexity || '알 수 없음';
    const spaceComplexity = rawData.analysis?.spaceComplexity || rawData.SpaceComplexity || '알 수 없음';

    return {
        data: {
            ...rawData,
            analysis: {
                timeComplexity,
                spaceComplexity,
                opCounts: rawData.analysis?.opCounts || null
            },
            events,
            frames,
            outputs,
            meta: {
                type: detectedType,
                algorithmName: ALGORITHM_LABELS[detectedType] || 'Visualization',
                eventCount: events.length
            }
        },
        animationType: detectedType,
        totalSteps: frames.length
    };
};

export default normalizeDVFlowData;
