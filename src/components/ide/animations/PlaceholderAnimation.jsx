// animations/PlaceholderAnimation.jsx - 개발 중 애니메이션 표시 컴포넌트
import React from 'react';
import './PlaceholderAnimation.css';

const PlaceholderAnimation = ({
                                  type = 'unknown',
                                  data = null,
                                  currentStep = 0,
                                  totalSteps = 0,
                                  animationType = 'unknown'
                              }) => {
    // 애니메이션 타입별 아이콘 선택
    const getAnimationIcon = (type) => {
        if (type.includes('fibonacci') || type.includes('recursion')) return '🌳';
        if (type.includes('bubble') || type.includes('sort')) return '📊';
        if (type.includes('search') || type.includes('binary') || type.includes('linear')) return '🔍';
        if (type.includes('array')) return '📋';
        if (type.includes('tree')) return '🌲';
        if (type.includes('stack')) return '📚';
        if (type.includes('queue')) return '🚇';
        if (type.includes('linked')) return '🔗';
        if (type.includes('variables')) return '📝';
        return '🎬';
    };

    // 애니메이션 타입별 한국어 이름
    const getAnimationName = (type) => {
        const names = {
            'fibonacci-recursion': '피보나치 재귀',
            'factorial-recursion': '팩토리얼 재귀',
            'hanoi-tower': '하노이 탑',
            'recursion-tree': '재귀 트리',
            'bubble-sort': '버블 정렬',
            'quick-sort': '퀵 정렬',
            'merge-sort': '병합 정렬',
            'insertion-sort': '삽입 정렬',
            'selection-sort': '선택 정렬',
            'heap-sort': '힙 정렬',
            'array': '배열 조작',
            'array-manipulation': '배열 조작',
            'linked-list': '연결 리스트',
            'stack': '스택',
            'queue': '큐',
            'tree': '트리',
            'binary-tree': '이진 트리',
            'bst': '이진 탐색 트리',
            'binary-search': '이진 탐색',
            'linear-search': '선형 탐색',
            'breadth-first-search': '너비 우선 탐색',
            'depth-first-search': '깊이 우선 탐색',
            'bfs': '너비 우선 탐색',
            'dfs': '깊이 우선 탐색',
            'variables': '변수 추적',
            'variable-tracking': '변수 추적',
            'basic-algorithm': '기본 알고리즘'
        };
        return names[type] || '알 수 없는 알고리즘';
    };

    // 애니메이션 타입별 예상 기능
    const getExpectedFeatures = (type) => {
        if (type.includes('fibonacci')) {
            return [
                '재귀 호출 트리 시각화',
                '함수 호출 스택 표시',
                '중복 계산 하이라이트',
                '메모이제이션 효과 비교',
                '시간 복잡도 분석'
            ];
        }

        if (type.includes('bubble') || type.includes('sort')) {
            return [
                '배열 요소 비교 애니메이션',
                '스왑 과정 시각화',
                '정렬 진행도 표시',
                '비교 횟수 카운터',
                '색상으로 상태 구분'
            ];
        }

        if (type.includes('variables') || type.includes('basic')) {
            return [
                '변수 값 변화 추적',
                '메모리 상태 표시',
                '실행 흐름 시각화',
                '조건문 분기 표시',
                '반복문 진행도'
            ];
        }

        if (type.includes('search')) {
            return [
                '탐색 영역 시각화',
                '현재 탐색 위치 표시',
                '비교 과정 애니메이션',
                '탐색 경로 추적',
                '성능 분석'
            ];
        }

        return [
            '알고리즘 단계별 시각화',
            '데이터 구조 상태 표시',
            '실행 과정 애니메이션',
            '성능 지표 표시',
            '상호작용 기능'
        ];
    };

    const icon = getAnimationIcon(type);
    const name = getAnimationName(type);
    const features = getExpectedFeatures(type);

    return (
        <div className="placeholder-animation">
            {/* 헤더 */}
            <div className="placeholder-header">
                <h3>
                    {icon} {name} 애니메이션 개발 중
                </h3>
                <p>이 애니메이션은 곧 완성될 예정입니다!</p>
            </div>

            {/* 메인 콘텐츠 */}
            <div className="placeholder-content">
                <div className="placeholder-box">
                    {/* 메인 아이콘 */}
                    <div className="placeholder-icon">
                        {icon}
                    </div>

                    {/* 제목 */}
                    <h4>{name} 시각화</h4>
                    <p>여기에 {name} 과정이 단계별로 시각화됩니다.</p>

                    {/* 현재 상태 정보 */}
                    <div className="placeholder-stats">
                        <div className="stat-item">
                            <span className="stat-label">현재 단계</span>
                            <span className="stat-value">{currentStep + 1} / {totalSteps}</span>
                        </div>

                        {data?.dataStructure?.type && (
                            <div className="stat-item">
                                <span className="stat-label">데이터 구조</span>
                                <span className="stat-value">{data.dataStructure.type}</span>
                            </div>
                        )}

                        {data?.functions?.[0]?.name && (
                            <div className="stat-item">
                                <span className="stat-label">함수</span>
                                <span className="stat-value">{data.functions[0].name}</span>
                            </div>
                        )}

                        {data?.variables?.length && (
                            <div className="stat-item">
                                <span className="stat-label">변수 개수</span>
                                <span className="stat-value">{data.variables.length}개</span>
                            </div>
                        )}

                        <div className="stat-item">
                            <span className="stat-label">애니메이션 타입</span>
                            <span className="stat-value">{animationType}</span>
                        </div>

                        <div className="stat-item">
                            <span className="stat-label">개발 상태</span>
                            <span className="stat-value">🚧 개발 중</span>
                        </div>
                    </div>

                    {/* 예상 기능 목록 */}
                    <div className="coming-soon">
                        <p>🎯 구현 예정 기능:</p>
                        <ul>
                            {features.map((feature, index) => (
                                <li key={index}>{feature}</li>
                            ))}
                        </ul>
                    </div>

                    {/* 개발 진행도 */}
                    <div className="development-progress">
                        <h5>📈 개발 진행도</h5>
                        <div className="progress-bar">
                            <div className="progress-fill" style={{ width: '25%' }}></div>
                        </div>
                        <div className="progress-text">
                            <span>UI 설계 완료</span>
                            <span>25%</span>
                        </div>
                        <div className="progress-steps">
                            <div className="step completed">✅ 기본 구조</div>
                            <div className="step current">🔄 애니메이션 로직</div>
                            <div className="step pending">⏳ 인터랙션</div>
                            <div className="step pending">⏳ 최적화</div>
                        </div>
                    </div>

                    {/* 데이터 미리보기 */}
                    {data && (
                        <div className="data-preview">
                            <details>
                                <summary>📄 전달받은 데이터 미리보기</summary>
                                <pre className="json-preview">
                  {JSON.stringify(data, null, 2).substring(0, 800)}
                                    {JSON.stringify(data, null, 2).length > 800 && '\n...'}
                </pre>
                            </details>
                        </div>
                    )}

                    {/* 도움말 */}
                    <div className="help-section">
                        <p>💡 <strong>개발자 노트:</strong></p>
                        <p>이 애니메이션은 현재 개발 중입니다. 완성되면 실시간으로 알고리즘 실행 과정을 시각적으로 볼 수 있습니다.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlaceholderAnimation;