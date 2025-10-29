// ==============================================
// 📄 src/components/ide/mockData/index.js
// ==============================================

/**
 * 🗂️ JSON 기반 Mock 데이터 매니저
 */

// 코드 예제 문자열 import
import bubbleSortCode from './codeExamples/bubbleSort';
import selectionSortCode from './codeExamples/selectionSort';
import insertionSortCode from './codeExamples/insertionSort';  // ✨ 추가
import linkedListCode from './codeExamples/linkedList';
import fibonacciCode from './codeExamples/fibonacci';
import factorialCode from './codeExamples/factorial';  // ✨ 추가
import binaryTreeCode from './codeExamples/binaryTree';
import heapCode from './codeExamples/heap';
import graphCode from './codeExamples/graph';
import stackCode from './codeExamples/stack';  // ✨ 추가
import queueCode from './codeExamples/queue';  // ✨ 추가

// JSON 파일들 직접 import (DV-Flow v1.3 스키마)
import binaryTreeJson from './jsonExamples/binaryTree.json';
import bubbleSortJson from './jsonExamples/bubbleSort.json';
import selectionSortJson from './jsonExamples/selectionSort.json';
import insertionSortJson from './jsonExamples/insertionSort.json';  // ✨ 추가
import fibonacciJson from './jsonExamples/fibonacci.json';
import factorialJson from './jsonExamples/factorial.json';  // ✨ 추가
import graphJson from './jsonExamples/graph.json';
import heapJson from './jsonExamples/heap.json';
import linkedListJson from './jsonExamples/linkedList.json';
import stackJson from './jsonExamples/stack.json';  // ✨ 추가
import queueJson from './jsonExamples/queue.json';  // ✨ 추가

// 코드 예제 파일들을 객체 형태로 export
export const codeExamples = [
    {
        name: 'bubble_sort.c',
        type: 'code',
        code: bubbleSortCode
    },
    {
        name: 'selection_sort.c',
        type: 'code',
        code: selectionSortCode
    },
    {
        name: 'insertion_sort.c',  // ✨ 추가
        type: 'code',
        code: insertionSortCode
    },
    {
        name: 'linked_list.c',
        type: 'code',
        code: linkedListCode
    },
    {
        name: 'fibonacci.c',
        type: 'code',
        code: fibonacciCode
    },
    {
        name: 'factorial.c',  // ✨ 추가
        type: 'code',
        code: factorialCode
    },
    {
        name: 'binary_tree.c',
        type: 'code',
        code: binaryTreeCode
    },
    {
        name: 'heap.c',
        type: 'code',
        code: heapCode
    },
    {
        name: 'graph.c',
        type: 'code',
        code: graphCode
    },
    {
        name: 'stack_demo.c',  // ✨ 추가
        type: 'code',
        code: stackCode
    },
    {
        name: 'queue_demo.c',  // ✨ 추가
        type: 'code',
        code: queueCode
    }
];

// JSON 예제 파일들을 객체 형태로 export
export const jsonExamples = [
    {
        name: 'binaryTree.json',
        type: 'json',
        code: JSON.stringify(binaryTreeJson, null, 2)
    },
    {
        name: 'bubbleSort.json',
        type: 'json',
        code: JSON.stringify(bubbleSortJson, null, 2)
    },
    {
        name: 'selectionSort.json',
        type: 'json',
        code: JSON.stringify(selectionSortJson, null, 2)
    },
    {
        name: 'insertionSort.json',  // ✨ 추가
        type: 'json',
        code: JSON.stringify(insertionSortJson, null, 2)
    },
    {
        name: 'fibonacci.json',
        type: 'json',
        code: JSON.stringify(fibonacciJson, null, 2)
    },
    {
        name: 'factorial.json',  // ✨ 추가
        type: 'json',
        code: JSON.stringify(factorialJson, null, 2)
    },
    {
        name: 'graph.json',
        type: 'json',
        code: JSON.stringify(graphJson, null, 2)
    },
    {
        name: 'heap.json',
        type: 'json',
        code: JSON.stringify(heapJson, null, 2)
    },
    {
        name: 'linkedList.json',
        type: 'json',
        code: JSON.stringify(linkedListJson, null, 2)
    },
    {
        name: 'stack.json',  // ✨ 추가
        type: 'json',
        code: JSON.stringify(stackJson, null, 2)
    },
    {
        name: 'queue.json',  // ✨ 추가
        type: 'json',
        code: JSON.stringify(queueJson, null, 2)
    }
];

// JSON 데이터 객체 매핑 (파일명 -> 원본 JSON 데이터)
const jsonDataMap = {
    binaryTree: binaryTreeJson,
    bubbleSort: bubbleSortJson,
    selectionSort: selectionSortJson,
    insertionSort: insertionSortJson,  // ✨ 추가
    fibonacci: fibonacciJson,
    factorial: factorialJson,  // ✨ 추가
    graph: graphJson,
    heap: heapJson,
    linkedList: linkedListJson,
    stack: stackJson,  // ✨ 추가
    queue: queueJson  // ✨ 추가
};

// JSON 파일들을 동적으로 import하는 함수 (호환성 유지)
const importJsonFile = async (filename) => {
    try {
        // 캐시된 데이터에서 찾기
        const jsonData = jsonDataMap[filename];
        if (jsonData) {
            return jsonData;
        }
        console.warn(`⚠️ JSON 파일을 찾을 수 없습니다: ${filename}.json`);
        return null;
    } catch (error) {
        console.warn(`⚠️ JSON 파일 로드 실패: ${filename}.json`, error);
        return null;
    }
};

export class JsonVisualizationManager {
    // 📋 현재 사용 가능한 JSON 파일들 (확장자 제외)
    static availableJsonFiles = [
        'binaryTree',
        'bubbleSort',
        'selectionSort',
        'insertionSort',  // ✨ 추가
        'fibonacci',
        'factorial',  // ✨ 추가
        'graph',
        'heap',
        'linkedList',
        'stack',  // ✨ 추가
        'queue'  // ✨ 추가
    ];

    // 🗄️ 로드된 JSON 데이터 캐시
    static jsonCache = new Map();

    /**
     * 🔍 코드 패턴으로 적절한 JSON 데이터 찾기
     * @param {string} code - 분석할 코드
     * @param {string} language - 프로그래밍 언어
     * @param {string} input - 입력값
     * @returns {Promise<object|null>} JSON 시각화 데이터
     */
    static async getJsonDataByPattern(code, language, input) {
        if (!code?.trim()) {
            console.warn('⚠️ 빈 코드 입력');
            return null;
        }

        const codeContent = code.toLowerCase();

        // 🔍 패턴 매칭으로 적절한 JSON 파일 찾기
        const patterns = {
            bubbleSort: ['bubble', '버블'],
            selectionSort: ['selection', '선택'],
            insertionSort: ['insertion', '삽입'],  // ✨ 추가
            fibonacci: ['fibonacci', '피보나치', 'fibo', 'fib'],  // ✨ 추가
            factorial: ['factorial', '팩토리얼', 'fact'],  // ✨ 추가
            graph: ['graph', '그래프', 'adj', 'adjacency'],
            stack: ['stack', '스택'],  // ✨ 추가
            queue: ['queue', '큐']  // ✨ 추가
        };

        // 패턴 매칭 시도
        for (const [jsonFile, keywords] of Object.entries(patterns)) {
            const isMatched = keywords.some(keyword =>
                codeContent.includes(keyword.toLowerCase())
            );

            if (isMatched) {
                console.log(`✅ 패턴 매칭 성공: ${jsonFile} (키워드: ${keywords.join(', ')})`);
                return await this.loadJsonData(jsonFile, input);
            }
        }

        // 🔄 매칭되는 패턴이 없으면 기본 데이터 반환
        console.log('🔄 기본 변수 추적 모드');
        return this.createDefaultData(code, language, input);
    }

    /**
     * 📂 특정 JSON 파일 직접 로드
     * @param {string} jsonFileName - JSON 파일명 (확장자 제외)
     * @param {string} input - 입력값 (옵션)
     * @returns {Promise<object|null>} JSON 데이터
     */
    static async loadJsonData(jsonFileName, input = null) {
        // 🗄️ 캐시 확인
        if (this.jsonCache.has(jsonFileName)) {
            console.log(`🗄️ 캐시에서 JSON 로드: ${jsonFileName}`);
            const cachedData = this.jsonCache.get(jsonFileName);
            return this.updateDataWithInput(cachedData, input);
        }

        try {
            // 📂 JSON 파일 동적 import
            console.log(`📂 JSON 파일 로딩: ${jsonFileName}.json`);
            const jsonData = await importJsonFile(jsonFileName);

            if (!jsonData) {
                throw new Error(`JSON 파일을 찾을 수 없습니다: ${jsonFileName}.json`);
            }

            // 🗄️ 캐시에 저장
            this.jsonCache.set(jsonFileName, jsonData);

            console.log(`✅ JSON 로드 완료: ${jsonFileName}`, {
                eventsCount: jsonData.events?.length,
                lang: jsonData.lang
            });

            // 입력값으로 데이터 업데이트
            return this.updateDataWithInput(jsonData, input);

        } catch (error) {
            console.error(`❌ JSON 로드 실패: ${jsonFileName}`, error);
            return null;
        }
    }

    /**
     * 🔧 입력값으로 JSON 데이터 업데이트
     * @param {object} jsonData - 원본 JSON 데이터
     * @param {string} input - 입력값
     * @returns {object} 업데이트된 데이터
     */
    static updateDataWithInput(jsonData, input) {
        if (!input || !jsonData) return jsonData;

        // 깊은 복사로 원본 데이터 보호
        const updatedData = JSON.parse(JSON.stringify(jsonData));

        // DV-Flow 스키마에서는 input 문자열만 갱신
        updatedData.input = input;

        return updatedData;
    }

    /**
     * 📝 기본 데이터 생성 (패턴 매칭 실패 시)
     */
    static createDefaultData(code, language, input) {
        // DV-Flow 스키마에 맞춘 최소 예제
        return {
            lang: language || 'c',
            input: input || '',
            analysis: {
                timeComplexity: 'O(1)',
                spaceComplexity: 'O(1)'
            },
            events: [
                {
                    t: 1,
                    kind: 'note',
                    loc: { line: 1 },
                    text: '프로그램 시작'
                },
                {
                    t: 2,
                    kind: 'io',
                    loc: { line: 2 },
                    dir: 'out',
                    channel: 'stdout',
                    data: input ? `입력: ${input}\n` : '입력 없음\n'
                },
                {
                    t: 3,
                    kind: 'note',
                    loc: { line: 3 },
                    text: '프로그램 종료'
                }
            ]
        };
    }

    /**
     * 📋 사용 가능한 JSON 파일 목록
     */
    static getAvailableJsonFiles() {
        return [...this.availableJsonFiles];
    }

    /**
     * 🗄️ 캐시 상태 확인
     */
    static getCacheInfo() {
        return {
            cacheSize: this.jsonCache.size,
            cachedFiles: Array.from(this.jsonCache.keys()),
            availableFiles: this.availableJsonFiles
        };
    }

    /**
     * 🧹 캐시 초기화
     */
    static clearCache() {
        this.jsonCache.clear();
        console.log('🧹 JSON 캐시 초기화됨');
    }
}

// ==============================================
// 🔧 편의 함수들 export
// ==============================================

export const getJsonVisualizationData = (code, language, input) =>
    JsonVisualizationManager.getJsonDataByPattern(code, language, input);

export const loadSpecificJsonData = (jsonFileName, input) =>
    JsonVisualizationManager.loadJsonData(jsonFileName, input);

export const getAvailableJsonFiles = () =>
    JsonVisualizationManager.getAvailableJsonFiles();

export const getJsonCacheInfo = () =>
    JsonVisualizationManager.getCacheInfo();

export const clearJsonCache = () =>
    JsonVisualizationManager.clearCache();

// 기본 export
export default JsonVisualizationManager;

// 🚀 초기화 로그
console.log('🗂️ JSON 시각화 매니저 로드 완료');
console.log('📋 사용 가능한 JSON 파일들:', JsonVisualizationManager.getAvailableJsonFiles());