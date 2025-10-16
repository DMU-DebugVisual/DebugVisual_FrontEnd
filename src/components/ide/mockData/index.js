// ==============================================
// 📄 src/components/ide/mockData/index.js
// ==============================================

/**
 * 🗂️ JSON 기반 Mock 데이터 매니저
 */

// JSON 파일들 직접 import
import binaryTreeJson from './binaryTree.json';
import bubbleSortJson from './bubbleSort.json';
import fibonacciJson from './fibonacci.json';
import graphJson from './graph.json';
import heapJson from './heap.json';
import linkedListJson from './linkedList.json';

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
        name: 'fibonacci.json',
        type: 'json',
        code: JSON.stringify(fibonacciJson, null, 2)
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
    }
];

// JSON 데이터 객체 매핑 (파일명 -> 원본 JSON 데이터)
const jsonDataMap = {
    'binaryTree': binaryTreeJson,
    'bubbleSort': bubbleSortJson,
    'fibonacci': fibonacciJson,
    'graph': graphJson,
    'heap': heapJson,
    'linkedList': linkedListJson
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
        'bubbleSort',
        'fibonacci',
        'linkedList',
        'binaryTree',
        'heap',
        'graph'
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
            'bubbleSort': ['bubble', '버블', 'sort'],
            'fibonacci': ['fibo', '피보나치', 'recursion'],
            'linkedList': ['linked', 'list', '연결', '노드', 'node'],
            'binaryTree': ['binary', 'tree', '이진', '트리', 'bst'],
            'heap': ['heap', '힙', 'priority'],
            'graph': ['graph', '그래프', 'adj', 'adjacency']
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
                algorithm: jsonData.algorithm,
                stepsCount: jsonData.steps?.length,
                variablesCount: jsonData.variables?.length
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

        // 입력값 업데이트
        updatedData.input = input;

        // 입력값에 따른 변수 업데이트 (기본적인 처리)
        const inputNumber = parseInt(input);
        if (!isNaN(inputNumber)) {
            updatedData.variables?.forEach(variable => {
                if (variable.name === 'n' && variable.type === 'int') {
                    variable.currentValue = inputNumber;
                }
            });
        }

        return updatedData;
    }

    /**
     * 📝 기본 데이터 생성 (패턴 매칭 실패 시)
     */
    static createDefaultData(code, language, input) {
        return {
            algorithm: 'variables',
            lang: language || 'c',
            input: input || '',
            variables: [
                { name: "n", type: "int", initialValue: null, currentValue: parseInt(input) || 5 },
                { name: "i", type: "int", initialValue: null, currentValue: 1 },
                { name: "result", type: "int", initialValue: null, currentValue: 0 }
            ],
            functions: [],
            steps: [
                { line: 1, description: "프로그램 시작" },
                { line: 2, description: "변수 선언 및 초기화" },
                { line: 3, description: "계산 수행" },
                { line: 4, description: "결과 출력" },
                { line: 5, description: "프로그램 종료" }
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