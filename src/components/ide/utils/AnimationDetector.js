/**
 * 🔍 AnimationDetector - JSON 데이터 분석해서 적절한 애니메이션 타입 감지
 * 임시 개발 버전 - 기본적인 패턴 감지만 구현
 */
export class AnimationDetector {

    /**
     * 🎯 메인 감지 함수 - JSON 데이터를 분석해서 애니메이션 타입 반환
     * @param {Object} data - API에서 받은 JSON 데이터
     * @returns {string} 감지된 애니메이션 타입
     */
    static detectAnimationType(data) {
        console.log('🔍 애니메이션 타입 감지 시작:', data);

        try {
            // 1. 📊 데이터 구조 타입 기반 감지
            const dataStructureType = this.detectByDataStructure(data);
            if (dataStructureType) {
                console.log('✅ 데이터 구조로 감지됨:', dataStructureType);
                return dataStructureType;
            }

            // 2. 🔧 함수명 기반 감지
            const functionType = this.detectByFunctionName(data);
            if (functionType) {
                console.log('✅ 함수명으로 감지됨:', functionType);
                return functionType;
            }

            // 3. 📝 코드 패턴 기반 감지
            const codePatternType = this.detectByCodePattern(data);
            if (codePatternType) {
                console.log('✅ 코드 패턴으로 감지됨:', codePatternType);
                return codePatternType;
            }

            // 4. 📋 변수 패턴 기반 감지
            const variableType = this.detectByVariables(data);
            if (variableType) {
                console.log('✅ 변수 패턴으로 감지됨:', variableType);
                return variableType;
            }

            // 5. 🎯 기본값: 변수 추적 애니메이션
            console.log('⚠️ 특정 패턴을 감지하지 못함, 기본 변수 추적 사용');
            return 'variables';

        } catch (error) {
            console.error('❌ 애니메이션 타입 감지 중 오류:', error);
            return 'variables';
        }
    }

    /**
     * 📊 데이터 구조 타입으로 애니메이션 감지
     * @param {Object} data - JSON 데이터
     * @returns {string|null} 감지된 타입 또는 null
     */
    static detectByDataStructure(data) {
        const dataStructure = data?.dataStructure || data?.steps?.find(step => step.dataStructure)?.dataStructure;

        if (!dataStructure) return null;

        const type = dataStructure.type?.toLowerCase();

        switch (type) {
            case 'recursiontree':
            case 'recursion_tree':
            case 'recursion-tree':
                // 재귀 트리인 경우 함수명으로 세부 타입 결정
                const functionName = data?.functions?.[0]?.name?.toLowerCase();
                if (functionName?.includes('fibo')) return 'fibonacci-recursion';
                if (functionName?.includes('factorial')) return 'factorial-recursion';
                if (functionName?.includes('hanoi')) return 'hanoi-tower';
                return 'recursion-tree';

            case 'array':
            case 'list':
                return 'array';

            case 'stack':
                return 'stack';

            case 'queue':
                return 'queue';

            case 'tree':
            case 'binarytree':
            case 'binary_tree':
            case 'binary-tree':
                return 'tree';

            case 'linkedlist':
            case 'linked_list':
            case 'linked-list':
                return 'linked-list';

            default:
                return null;
        }
    }

    /**
     * 🔧 함수명으로 애니메이션 감지
     * @param {Object} data - JSON 데이터
     * @returns {string|null} 감지된 타입 또는 null
     */
    static detectByFunctionName(data) {
        const functions = data?.functions || [];
        if (functions.length === 0) return null;

        const functionName = functions[0]?.name?.toLowerCase();
        if (!functionName) return null;

        // 재귀 함수들
        if (functionName.includes('fibo')) return 'fibonacci-recursion';
        if (functionName.includes('factorial')) return 'factorial-recursion';
        if (functionName.includes('hanoi')) return 'hanoi-tower';

        // 정렬 함수들
        if (functionName.includes('bubble')) return 'bubble-sort';
        if (functionName.includes('quick')) return 'quick-sort';
        if (functionName.includes('merge')) return 'merge-sort';
        if (functionName.includes('insertion')) return 'insertion-sort';
        if (functionName.includes('selection')) return 'selection-sort';
        if (functionName.includes('heap')) return 'heap-sort';
        if (functionName.includes('sort')) return 'bubble-sort'; // 기본 정렬

        // 탐색 함수들
        if (functionName.includes('binary_search') || functionName.includes('binarysearch')) return 'binary-search';
        if (functionName.includes('linear_search') || functionName.includes('linearsearch')) return 'linear-search';
        if (functionName.includes('bfs') || functionName.includes('breadth')) return 'bfs';
        if (functionName.includes('dfs') || functionName.includes('depth')) return 'dfs';

        return null;
    }

    /**
     * 📝 코드 패턴으로 애니메이션 감지
     * @param {Object} data - JSON 데이터
     * @returns {string|null} 감지된 타입 또는 null
     */
    static detectByCodePattern(data) {
        const code = data?.code?.toLowerCase() || '';
        if (!code) return null;

        // 재귀 패턴 감지
        if (code.includes('fibo') && code.includes('return') && code.includes('fibo(')) {
            return 'fibonacci-recursion';
        }

        if (code.includes('factorial') && code.includes('return') && code.includes('factorial(')) {
            return 'factorial-recursion';
        }

        // 정렬 패턴 감지
        if (code.includes('bubble') || (code.includes('for') && code.includes('swap') && code.includes('temp'))) {
            return 'bubble-sort';
        }

        if (code.includes('quicksort') || code.includes('quick_sort')) {
            return 'quick-sort';
        }

        if (code.includes('mergesort') || code.includes('merge_sort')) {
            return 'merge-sort';
        }

        // 탐색 패턴 감지
        if (code.includes('binary_search') || code.includes('binarysearch')) {
            return 'binary-search';
        }

        if (code.includes('linear_search') || code.includes('linearsearch')) {
            return 'linear-search';
        }

        return null;
    }

    /**
     * 📋 변수 패턴으로 애니메이션 감지
     * @param {Object} data - JSON 데이터
     * @returns {string|null} 감지된 타입 또는 null
     */
    static detectByVariables(data) {
        const variables = data?.variables || [];
        if (variables.length === 0) return null;

        const variableNames = variables.map(v => v.name?.toLowerCase()).filter(Boolean);

        // 배열 관련 변수들
        if (variableNames.some(name => ['list', 'arr', 'array', 'nums', 'data'].includes(name))) {
            // 정렬 관련 변수가 있는지 확인
            if (variableNames.some(name => ['temp', 'i', 'j'].includes(name))) {
                return 'bubble-sort'; // 기본 정렬 애니메이션
            }
            return 'array';
        }

        // 일반적인 반복문 변수들 (i, j, k 등)
        if (variableNames.some(name => ['i', 'j', 'k'].includes(name))) {
            return 'variables';
        }

        return null;
    }

    /**
     * 🎯 단계별 세부 정보 분석
     * @param {Object} data - JSON 데이터
     * @returns {Object} 분석 결과
     */
    static analyzeSteps(data) {
        const steps = data?.steps || [];

        return {
            totalSteps: steps.length,
            hasLoops: steps.some(step => step.loop),
            hasConditions: steps.some(step => step.condition),
            hasRecursion: steps.some(step => step.stack && step.stack.length > 0),
            hasArrayOperations: steps.some(step =>
                step.changes?.some(change =>
                    change.variable?.toLowerCase().includes('list') ||
                    change.variable?.toLowerCase().includes('array')
                )
            ),
            complexityLevel: this.calculateComplexity(steps)
        };
    }

    /**
     * 📊 복잡도 계산
     * @param {Array} steps - 실행 단계 배열
     * @returns {string} 복잡도 레벨
     */
    static calculateComplexity(steps) {
        if (steps.length === 0) return 'unknown';
        if (steps.length < 5) return 'simple';
        if (steps.length < 20) return 'medium';
        if (steps.length < 50) return 'complex';
        return 'very-complex';
    }

    /**
     * 🔍 감지 결과 상세 정보
     * @param {Object} data - JSON 데이터
     * @returns {Object} 상세 분석 결과
     */
    static getDetectionDetails(data) {
        const detectedType = this.detectAnimationType(data);
        const stepsAnalysis = this.analyzeSteps(data);

        return {
            detectedType,
            confidence: this.calculateConfidence(data, detectedType),
            stepsAnalysis,
            dataStructure: data?.dataStructure,
            functions: data?.functions || [],
            variables: data?.variables || [],
            recommendations: this.getRecommendations(detectedType, stepsAnalysis)
        };
    }

    /**
     * 📈 감지 신뢰도 계산
     * @param {Object} data - JSON 데이터
     * @param {string} detectedType - 감지된 타입
     * @returns {number} 신뢰도 (0-100)
     */
    static calculateConfidence(data, detectedType) {
        let confidence = 50; // 기본값

        // 데이터 구조가 명확하면 +30
        if (data?.dataStructure?.type) confidence += 30;

        // 함수명이 명확하면 +20
        if (data?.functions?.[0]?.name) confidence += 20;

        // 코드가 있으면 +10
        if (data?.code) confidence += 10;

        // 단계가 충분하면 +10
        if (data?.steps?.length > 5) confidence += 10;

        return Math.min(100, confidence);
    }

    /**
     * 💡 개선 권장사항
     * @param {string} detectedType - 감지된 타입
     * @param {Object} stepsAnalysis - 단계 분석 결과
     * @returns {Array} 권장사항 배열
     */
    static getRecommendations(detectedType, stepsAnalysis) {
        const recommendations = [];

        if (stepsAnalysis.complexityLevel === 'very-complex') {
            recommendations.push('복잡도가 높습니다. 단계를 나누어 보는 것을 권장합니다.');
        }

        if (!stepsAnalysis.hasLoops && !stepsAnalysis.hasRecursion) {
            recommendations.push('반복문이나 재귀가 없는 단순한 알고리즘입니다.');
        }

        if (detectedType === 'variables') {
            recommendations.push('기본 변수 추적 애니메이션이 적용됩니다.');
        }

        return recommendations;
    }
}

// 편의 함수들
export const detectAnimationType = (data) =>
    AnimationDetector.detectAnimationType(data);

export const getDetectionDetails = (data) =>
    AnimationDetector.getDetectionDetails(data);

// 기본 export
export default AnimationDetector;

// 개발 상태 로그
console.log('🔍 AnimationDetector (개발 중) 로드됨');