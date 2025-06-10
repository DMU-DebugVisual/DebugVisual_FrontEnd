// ==============================================
// 📄 src/components/ide/services/ApiService.js
// ==============================================
import config from '../../../config'; // 정확한 상대경로 사용


/**
 * 🌐 API 서비스 클래스 - 실제 API와 JSON Mock 하이브리드
 */
export class ApiService {
    static API_BASE_URL = `${config.API_BASE_URL}/api/code`;
    static USE_REAL_API = true; // 🎛️ true로 설정하면 실제 API 먼저 시도

    /**
     * 🚀 코드 시각화 데이터 요청 (하이브리드 방식)
     * @param {string} code - 소스 코드
     * @param {string} language - 프로그래밍 언어
     * @param {string} input - 입력값
     * @returns {Promise<object>} 시각화 데이터
     */
    static async requestVisualization(code, language, input) {
        console.log('🌐 시각화 데이터 요청 시작:', {
            useRealApi: this.USE_REAL_API,
            codeLength: code?.length,
            language,
            input
        });

        try {
            if (this.USE_REAL_API) {
                // 🔴 실제 API 먼저 시도
                try {
                    console.log('🔴 실제 API 호출 시도...');
                    const apiResult = await this.callRealApi(code, language, input);

                    // API 응답이 완전한 시각화 데이터를 포함하면 그대로 사용
                    if (this.isCompleteVisualizationData(apiResult)) {
                        console.log('✅ 실제 API에서 완전한 데이터 받음');
                        return apiResult;
                    }

                    // API 응답이 간단한 출력만 있으면 JSON과 병합
                    console.log('🔄 API 응답이 간단함, JSON과 병합 시도...');
                    const mergedResult = await this.mergeWithJsonData(apiResult, code, language, input);
                    return mergedResult;

                } catch (apiError) {
                    console.warn('⚠️ 실제 API 호출 실패, JSON 폴백:', apiError.message);
                    // API 실패 시 JSON 데이터로 폴백
                    return await this.callJsonApi(code, language, input);
                }
            } else {
                // 🟡 JSON Mock 데이터 사용
                console.log('🟡 JSON Mock 모드');
                return await this.callJsonApi(code, language, input);
            }
        } catch (error) {
            console.error('❌ 모든 시각화 데이터 요청 실패:', error);
            throw new Error(`시각화 데이터를 가져올 수 없습니다: ${error.message}`);
        }
    }

    /**
     * 🔴 실제 API 호출
     */
    static async callRealApi(code, language, input) {
        const startTime = Date.now();

        const response = await fetch(`${this.API_BASE_URL}/visualize`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                input: input || "",
                lang: language
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API 호출 실패 (${response.status}): ${errorText}`);
        }

        const result = await response.json();
        const duration = Date.now() - startTime;

        console.log(`✅ 실제 API 응답 (${duration}ms):`, result);
        return result;
    }

    /**
     * 🟡 JSON Mock API 호출
     */
    static async callJsonApi(code, language, input) {
        console.log('🟡 JSON Mock API 모드');

        // 실제 API 호출하는 것처럼 딜레이 추가
        await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

        // JSON 매니저 동적 import
        const { getJsonVisualizationData } = await import('../mockData');
        const jsonData = await getJsonVisualizationData(code, language, input);

        if (!jsonData) {
            throw new Error('해당 코드 패턴에 대한 JSON Mock 데이터를 찾을 수 없습니다.');
        }

        console.log('✅ JSON Mock 데이터 반환:', {
            algorithm: jsonData.algorithm,
            stepsCount: jsonData.steps?.length,
            variablesCount: jsonData.variables?.length
        });

        return jsonData;
    }

    /**
     * 🔧 API 응답이 완전한 시각화 데이터인지 확인
     */
    static isCompleteVisualizationData(apiResponse) {
        return !!(
            apiResponse &&
            apiResponse.variables &&
            apiResponse.steps &&
            Array.isArray(apiResponse.steps) &&
            apiResponse.steps.length > 0
        );
    }

    /**
     * 🔗 API 응답과 JSON 데이터 병합
     */
    static async mergeWithJsonData(apiResponse, code, language, input) {
        try {
            // JSON 데이터 가져오기
            const { getJsonVisualizationData } = await import('../mockData');
            const jsonData = await getJsonVisualizationData(code, language, input);

            if (!jsonData) {
                // JSON 데이터도 없으면 API 응답을 기본 형식으로 변환
                return this.convertSimpleApiResponse(apiResponse, code, language, input);
            }

            // API 응답과 JSON 데이터 병합
            const mergedData = {
                ...jsonData,
                // API에서 온 실제 출력값들로 덮어쓰기
                stdout: apiResponse.stdout,
                stderr: apiResponse.stderr,
                exitCode: apiResponse.exitCode,
                success: apiResponse.success,
                // 원본 API 응답도 보존
                _originalApiResponse: apiResponse,
                _dataSource: 'api+json'
            };

            console.log('🔗 API + JSON 병합 완료:', {
                hasApiOutput: !!apiResponse.stdout,
                hasJsonSteps: !!jsonData.steps?.length,
                dataSource: 'hybrid'
            });

            return mergedData;

        } catch (error) {
            console.warn('⚠️ JSON 병합 실패, API 응답만 사용:', error);
            return this.convertSimpleApiResponse(apiResponse, code, language, input);
        }
    }

    /**
     * 🔄 간단한 API 응답을 기본 시각화 형식으로 변환
     */
    static convertSimpleApiResponse(apiResponse, code, language, input) {
        const algorithmType = this.detectAlgorithmType(code);

        return {
            algorithm: algorithmType,
            lang: language || 'unknown',
            input: input || '',
            code: code,
            variables: [],
            functions: [],
            steps: [
                {
                    line: 1,
                    description: "프로그램 시작",
                    changes: []
                },
                {
                    line: 2,
                    description: `프로그램 실행 완료`,
                    changes: [],
                    output: apiResponse.stdout || '출력 없음'
                },
                {
                    line: 3,
                    description: "프로그램 종료",
                    changes: []
                }
            ],
            // API 응답 정보
            stdout: apiResponse.stdout,
            stderr: apiResponse.stderr,
            exitCode: apiResponse.exitCode,
            success: apiResponse.success,
            _dataSource: 'api-only'
        };
    }

    /**
     * 🔍 코드에서 알고리즘 타입 감지
     */
    static detectAlgorithmType(code) {
        const codeContent = code.toLowerCase();

        const patterns = {
            'bubble-sort': ['bubble', '버블', 'sort'],
            'fibonacci-recursion': ['fibo', '피보나치'],
            'linked-list': ['linked', 'list', '연결', '노드'],
            'binary-tree': ['binary', 'tree', '이진', '트리'],
            'heap': ['heap', '힙'],
            'graph': ['graph', '그래프', 'adj']
        };

        for (const [algorithm, keywords] of Object.entries(patterns)) {
            if (keywords.some(keyword => codeContent.includes(keyword))) {
                return algorithm;
            }
        }

        return 'variables';
    }

    /**
     * ⚙️ API 모드 변경
     * @param {boolean} useRealApi - 실제 API 사용 여부
     */
    static setApiMode(useRealApi) {
        this.USE_REAL_API = useRealApi;
        console.log(`🎛️ API 모드 변경: ${useRealApi ? '실제 API' : 'JSON Mock'}`);
    }

    /**
     * 🔍 API 상태 확인
     */
    static async checkApiHealth() {
        try {
            const response = await fetch(`${this.API_BASE_URL}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000) // 5초 타임아웃
            });

            return {
                status: response.ok ? 'healthy' : 'error',
                statusCode: response.status,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unreachable',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * 📊 서비스 정보
     */
    static getServiceInfo() {
        return {
            apiBaseUrl: this.API_BASE_URL,
            useRealApi: this.USE_REAL_API,
            mode: this.USE_REAL_API ? 'hybrid' : 'json-only',
            version: '1.0.0'
        };
    }
}

// 편의 함수들 export
export const requestVisualization = (code, language, input) =>
    ApiService.requestVisualization(code, language, input);

export const setApiMode = (useRealApi) =>
    ApiService.setApiMode(useRealApi);

export const checkApiHealth = () =>
    ApiService.checkApiHealth();

export const getServiceInfo = () =>
    ApiService.getServiceInfo();

// 기본 export
export default ApiService;

// 🚀 초기화 로그
console.log('🌐 API 서비스 로드 완료:', ApiService.getServiceInfo());