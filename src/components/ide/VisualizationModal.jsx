import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import AnimationFactory from './AnimationFactory';

// 애니메이션 컨트롤 훅
// VisualizationModal.jsx에서 useAnimationControls 훅 수정
const useAnimationControls = (totalSteps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [speed, setSpeed] = useState(1);

    const play = useCallback(() => setIsPlaying(true), []);
    const pause = useCallback(() => setIsPlaying(false), []);
    const stepBack = useCallback(() => setCurrentStep(prev => Math.max(0, prev - 1)), []);
    const stepForward = useCallback(() => setCurrentStep(prev => Math.min(totalSteps - 1, prev + 1)), [totalSteps]);
    const reset = useCallback(() => {
        setCurrentStep(0);
        setIsPlaying(false);
    }, []);
    const goToStep = useCallback((step) => setCurrentStep(Math.max(0, Math.min(totalSteps - 1, step))), [totalSteps]);

    // 🔥 자동 재생 로직 추가
    useEffect(() => {
        let intervalId = null;

        if (isPlaying && totalSteps > 0) {
            const interval = 1000 / speed; // 속도에 따른 간격 조정

            intervalId = setInterval(() => {
                setCurrentStep(prevStep => {
                    const nextStep = prevStep + 1;

                    // 마지막 단계에 도달하면 자동 정지
                    if (nextStep >= totalSteps - 1) {
                        setIsPlaying(false);
                        return totalSteps - 1;
                    }

                    return nextStep;
                });
            }, interval);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [isPlaying, speed, totalSteps]);

    return {
        isPlaying,
        currentStep,
        speed,
        play,
        pause,
        stepBack,
        stepForward,
        reset,
        goToStep,
        setSpeed
    };
};

// 컨트롤 버튼 컴포넌트
const ControlButton = ({ onClick, disabled, variant = 'default', children, title }) => {
    const getButtonStyle = () => {
        const baseStyle = {
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '500',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: disabled ? 0.5 : 1,
            minWidth: '70px',
            height: '36px',
            justifyContent: 'center'
        };

        switch (variant) {
            case 'play':
                return { ...baseStyle, background: '#10b981', color: 'white' };
            case 'playing':
                return { ...baseStyle, background: '#f59e0b', color: 'white' };
            default:
                return { ...baseStyle, background: 'rgba(255, 255, 255, 0.9)', color: '#374151' };
        }
    };

    return (
        <button
            style={getButtonStyle()}
            onClick={onClick}
            disabled={disabled}
            title={title}
        >
            {children}
        </button>
    );
};

// 시각화 컨트롤 컴포넌트
const VisualizationControls = ({
                                   isPlaying,
                                   currentStep,
                                   totalSteps,
                                   speed,
                                   onPlay,
                                   onPause,
                                   onStepBack,
                                   onStepForward,
                                   onReset,
                                   onSpeedChange,
                                   onStepChange
                               }) => {
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
        }}>
            <ControlButton
                onClick={isPlaying ? onPause : onPlay}
                disabled={totalSteps === 0}
                variant={isPlaying ? 'playing' : 'play'}
                title={isPlaying ? '일시정지' : '재생'}
            >
                {isPlaying ? '⏸' : '▶'} {isPlaying ? '일시' : '시작'}
            </ControlButton>

            <ControlButton
                onClick={onStepBack}
                disabled={currentStep === 0 || totalSteps === 0}
                title="이전 단계"
            >
                ⏪ 이전
            </ControlButton>

            <ControlButton
                onClick={onStepForward}
                disabled={currentStep >= totalSteps - 1 || totalSteps === 0}
                title="다음 단계"
            >
                ⏩ 다음
            </ControlButton>

            <ControlButton
                onClick={onReset}
                disabled={totalSteps === 0}
                title="처음으로"
            >
                ⏮ 처음
            </ControlButton>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '8px 12px',
                borderRadius: '8px',
                height: '36px'
            }}>
                <input
                    type="number"
                    value={currentStep + 1}
                    onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value >= 1 && value <= totalSteps) {
                            onStepChange(value - 1);
                        }
                    }}
                    min="1"
                    max={totalSteps}
                    disabled={totalSteps === 0}
                    style={{
                        width: '50px',
                        border: 'none',
                        background: 'transparent',
                        textAlign: 'center',
                        fontSize: '12px',
                        fontWeight: '600',
                        outline: 'none'
                    }}
                />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>/ {totalSteps}</span>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '6px 10px',
                borderRadius: '8px',
                height: '36px'
            }}>
                <span style={{ fontSize: '11px', color: '#6b7280', marginRight: '4px' }}>속도:</span>
                {[0.5, 1, 1.5, 2].map(speedValue => (
                    <button
                        key={speedValue}
                        onClick={() => onSpeedChange(speedValue)}
                        style={{
                            padding: '4px 8px',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            background: speed === speedValue ? '#8b5cf6' : 'transparent',
                            color: speed === speedValue ? 'white' : '#6b7280',
                            minWidth: '32px',
                            height: '24px',
                            transition: 'all 0.2s'
                        }}
                    >
                        {speedValue}x
                    </button>
                ))}
            </div>
        </div>
    );
};

// 로딩 컴포넌트
const LoadingAnimation = ({ message = "시각화 생성 중...", code, language }) => (
    <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
        minHeight: '400px',
        padding: '40px'
    }}>
        <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #e2e8f0',
            borderTop: '3px solid #8b5cf6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }} />
        <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px', fontWeight: '600' }}>{message}</h3>
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>코드를 분석하고 있습니다</p>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
      <span style={{
          fontSize: '12px',
          padding: '4px 8px',
          background: '#f1f5f9',
          borderRadius: '6px',
          color: '#64748b',
          border: '1px solid #e2e8f0'
      }}>
        언어: {language}
      </span>
            <span style={{
                fontSize: '12px',
                padding: '4px 8px',
                background: '#f1f5f9',
                borderRadius: '6px',
                color: '#64748b',
                border: '1px solid #e2e8f0'
            }}>
        코드 길이: {code?.length || 0}자
      </span>
        </div>
        <style jsx>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

// 에러 컴포넌트
const ErrorDisplay = ({ error, onRetry }) => (
    <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '20px',
        minHeight: '400px',
        padding: '40px'
    }}>
        <div style={{ fontSize: '64px' }}>❌</div>
        <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px', fontWeight: '600' }}>시각화 생성 실패</h3>
        <p style={{
            margin: 0,
            color: '#64748b',
            textAlign: 'center',
            maxWidth: '500px',
            fontSize: '14px',
            lineHeight: '1.5'
        }}>
            {error}
        </p>
        <button
            onClick={onRetry}
            style={{
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#ef4444'}
        >
            🔄 다시 시도
        </button>
    </div>
);

// 🔥 핵심: 실제 AnimationFactory를 사용하는 애니메이션 컴포넌트
// 🔥 핵심: 실제 AnimationFactory를 사용하는 애니메이션 컴포넌트 (이중 박스 제거)
const AnimationDisplay = ({ data, currentStep, totalSteps, animationType, isPlaying }) => {
    console.log('🎬 AnimationDisplay 렌더링:', {
        animationType,
        currentStep,
        totalSteps,
        hasData: !!data,
        isPlaying
    });

    // 애니메이션 타입별 아이콘 및 이름 설정
    const getAnimationInfo = (type) => {
        const typeMap = {
            'bubble-sort': { icon: '🔄', name: '버블 정렬' },
            'fibonacci-recursion': { icon: '🌳', name: '피보나치 재귀' },
            'linked-list': { icon: '🔗', name: '링크드 리스트' },
            'binary-tree': { icon: '🌲', name: '이진 트리' },
            'heap': { icon: '⛰️', name: '힙' },
            'variables': { icon: '📝', name: '변수 추적' },
            'array': { icon: '📋', name: '배열 조작' }
        };
        return typeMap[type] || { icon: '🎬', name: '알고리즘 시각화' };
    };

    const { icon, name } = getAnimationInfo(animationType);
    const isImplemented = AnimationFactory.isImplemented(animationType);

    console.log(`🔍 Animation 정보:`, {
        type: animationType,
        name,
        isImplemented,
        factoryInfo: AnimationFactory.getFactoryInfo()
    });

    // 🎯 핵심: AnimationFactory 사용하여 컴포넌트 생성
    let animationComponent = null;

    try {
        console.log('🏭 AnimationFactory.createAnimation 호출 중...');
        animationComponent = AnimationFactory.createAnimation(animationType, {
            data,
            currentStep,
            totalSteps,
            isPlaying,
            zoomLevel: 1
        });
        console.log('✅ 애니메이션 컴포넌트 생성됨:', animationComponent);
    } catch (error) {
        console.error('❌ 애니메이션 컴포넌트 생성 실패:', error);
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '500px',
            background: '#ffffff',
            borderRadius: '12px',
            border: isImplemented ? '2px solid #10b981' : '2px solid #f59e0b',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* 애니메이션 헤더 */}
            <div style={{
                padding: '20px 24px',
                background: isImplemented
                    ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                    : 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
                borderBottom: '1px solid #e2e8f0',
                flexShrink: 0
            }}>
                <h3 style={{
                    margin: '0 0 8px 0',
                    color: '#1e293b',
                    fontSize: '18px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    {icon} {name} 시각화
                    {isImplemented && <span style={{
                        background: '#10b981',
                        color: 'white',
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '12px'
                    }}>✅ 구현됨</span>}
                    {!isImplemented && <span style={{
                        background: '#f59e0b',
                        color: 'white',
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '12px'
                    }}>🚧 개발중</span>}
                </h3>
                <p style={{
                    margin: 0,
                    color: '#64748b',
                    fontSize: '14px'
                }}>
                    현재 {currentStep + 1}단계 / 총 {totalSteps}단계
                </p>
            </div>

            {/* 🔥 메인 애니메이션 영역 - 이중 박스 제거됨 */}
            <div style={{
                flex: 1,
                padding: '24px',
                background: '#fafbfc',
                minHeight: '400px',

                // 🔥 스크롤 설정
                overflowY: 'auto',
                overflowX: 'hidden',
                maxHeight: 'calc(100vh - 280px)',

                // 🔥 이중 박스 제거: 바깥쪽에서 직접 처리
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: animationComponent ? 'flex-start' : 'center'
            }}>
                {/* 🎬 실제 애니메이션 컴포넌트 렌더링 - 이중 박스 제거 */}
                {animationComponent ? (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        // 🗑️ 이중 박스 제거: border, borderRadius, background 제거
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {animationComponent}
                    </div>
                ) : (
                    <div style={{
                        textAlign: 'center',
                        color: '#ef4444',
                        padding: '40px',
                        // 🗑️ 이중 박스 제거: border 제거 (바깥쪽에서 처리)
                        borderRadius: '8px',
                        background: '#fef2f2',
                        minHeight: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        maxWidth: '500px'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px' }}>애니메이션 생성 실패</h3>
                        <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
                            AnimationFactory에서 컴포넌트를 생성할 수 없습니다.
                        </p>
                        <div style={{
                            fontSize: '12px',
                            marginTop: '16px',
                            padding: '12px',
                            background: '#ffffff',
                            borderRadius: '6px',
                            textAlign: 'left',
                            maxWidth: '100%',
                            overflow: 'auto',
                            border: '1px solid #fecaca'
                        }}>
                            <strong>디버그 정보:</strong><br/>
                            <div style={{ marginTop: '8px', fontFamily: 'monospace', fontSize: '11px' }}>
                                Type: {animationType}<br/>
                                Implemented: {isImplemented ? 'Yes' : 'No'}<br/>
                                Factory: {AnimationFactory ? 'Loaded' : 'Not loaded'}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 🔥 디버그 정보 (스크롤 가능) */}
            <div style={{
                padding: '16px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                fontSize: '12px',
                color: '#64748b',
                flexShrink: 0,
                maxHeight: '200px',
                overflowY: 'auto'
            }}>
                <details>
                    <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                        🔧 디버그 정보 (클릭하여 펼치기)
                    </summary>
                    <pre style={{
                        marginTop: '8px',
                        padding: '12px',
                        background: '#ffffff',
                        borderRadius: '6px',
                        fontSize: '11px',
                        overflow: 'auto',
                        maxHeight: '120px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        border: '1px solid #e2e8f0',
                        lineHeight: '1.4'
                    }}>
{JSON.stringify({
    animationType,
    isImplemented,
    currentStep,
    totalSteps,
    hasData: !!data,
    isPlaying,
    factoryInfo: AnimationFactory?.getFactoryInfo ? AnimationFactory.getFactoryInfo() : 'Not available',
    componentCreated: !!animationComponent,
    timestamp: new Date().toLocaleTimeString()
}, null, 2)}
                    </pre>
                </details>
            </div>
        </div>
    );
};

// 정보 패널 컴포넌트 (왼쪽 영역)
const InfoPanel = ({ data, currentStep, totalSteps, animationType }) => {
    const InfoCard = ({ title, icon, children }) => (
        <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
            <h4 style={{
                fontSize: '15px',
                margin: '0 0 12px 0',
                color: '#1e293b',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                {icon} {title}
            </h4>
            {children}
        </div>
    );

    const currentStepData = data?.steps?.[currentStep];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: '100%',
            overflowY: 'auto',
            overflowX: 'hidden', // 🔥 추가
            maxHeight: 'calc(100vh - 160px)', // 🔥 추가
            paddingRight: '8px' // 🔥 추가: 스크롤바 공간 확보
        }}>
            {/* 현재 단계 정보 */}
            <InfoCard title="현재 단계" icon="🎯">
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px'
                }}>
          <span style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#8b5cf6'
          }}>
            {currentStep + 1}
          </span>
                    <span style={{ color: '#64748b' }}>/ {totalSteps}</span>
                </div>

                {currentStepData?.description && (
                    <div style={{
                        padding: '12px',
                        background: '#f1f5f9',
                        borderRadius: '8px',
                        borderLeft: '4px solid #8b5cf6',
                        fontSize: '13px',
                        color: '#64748b',
                        marginBottom: '8px',
                        lineHeight: '1.4'
                    }}>
                        {currentStepData.description}
                    </div>
                )}

                {currentStepData?.line && (
                    <div style={{
                        fontSize: '12px',
                        color: '#8b5cf6',
                        background: 'rgba(139, 92, 246, 0.1)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        fontWeight: '500'
                    }}>
                        📍 라인 {currentStepData.line}
                    </div>
                )}
            </InfoCard>

            {/* 프로그램 정보 */}
            <InfoCard title="프로그램 정보" icon="📊">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                        { label: '언어', value: data?.lang || 'Unknown' },
                        { label: '입력값', value: data?.input || '없음' },
                        { label: '변수 개수', value: `${data?.variables?.length || 0}개` },
                        { label: '실행 단계', value: `${totalSteps}단계` },
                        { label: '애니메이션', value: animationType }
                    ].map((item, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            background: '#f8fafc',
                            borderRadius: '6px',
                            fontSize: '12px'
                        }}>
                            <span style={{ color: '#64748b' }}>{item.label}:</span>
                            <span style={{ fontWeight: '600', color: '#1e293b' }}>{item.value}</span>
                        </div>
                    ))}
                </div>
            </InfoCard>

            {/* 변수 상태 */}
            {data?.variables && data.variables.length > 0 && (
                <InfoCard title="변수 상태" icon="📝">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {data.variables.map((variable, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 10px',
                                background: '#f8fafc',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0'
                            }}>
                                <div>
                  <span style={{
                      fontWeight: '600',
                      color: '#8b5cf6',
                      fontSize: '13px'
                  }}>
                    {variable.name}
                  </span>
                                    <span style={{
                                        fontSize: '11px',
                                        color: '#64748b',
                                        marginLeft: '6px'
                                    }}>
                    ({variable.type})
                  </span>
                                </div>
                                <span style={{
                                    fontWeight: '600',
                                    padding: '2px 6px',
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    color: '#8b5cf6'
                                }}>
                  {variable.currentValue ?? 'null'}
                </span>
                            </div>
                        ))}
                    </div>
                </InfoCard>
            )}

            {/* 변수 변화 */}
            {currentStepData?.changes && currentStepData.changes.length > 0 && (
                <InfoCard title="변수 변화" icon="🔄">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {currentStepData.changes.map((change, index) => (
                            <div key={index} style={{
                                padding: '8px 10px',
                                background: '#fef3c7',
                                borderRadius: '6px',
                                borderLeft: '3px solid #f59e0b',
                                fontSize: '12px'
                            }}>
                <span style={{ fontWeight: '600', color: '#92400e' }}>
                  {change.variable}
                </span>
                                <span style={{ color: '#78716c', marginLeft: '6px' }}>
                  : {change.before} → {change.after}
                </span>
                            </div>
                        ))}
                    </div>
                </InfoCard>
            )}
        </div>
    );
};

// Mock 데이터 생성 함수 (버블정렬 포함)
const getMockDataByCodePattern = (code, language, input) => {
    const codeContent = code?.toLowerCase() || '';

    // 🔄 버블정렬 Mock 데이터
    // 🔄 버블정렬 - 원본 VisualizerBubble.jsx의 fullJson 데이터 사용
    if (codeContent.includes('bubble')) {
        return {
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
        };
    }
    // 🔄 연결리스트 Mock 데이터
    if (codeContent.includes('linked')) {
        return {
            "lang": "c",
            "input": ["3", "5", "7", "0"],
            "variables": [
                { "name": "head", "type": "Node*", "initialValue": "NULL", "currentValue": "0x01" },
                { "name": "tail", "type": "Node*", "initialValue": "NULL", "currentValue": "0x03" },
                { "name": "cur", "type": "Node*", "initialValue": "NULL", "currentValue": "0x03" },
                { "name": "newNode", "type": "Node*", "initialValue": "NULL", "currentValue": "0x03" },
                { "name": "readData", "type": "int", "initialValue": null, "currentValue": 0 },
                { "name": "delNode", "type": "Node*", "initialValue": null, "currentValue": "0x03" },
                { "name": "delNextNode", "type": "Node*", "initialValue": null, "currentValue": null }
            ],
            "functions": [],
            "steps": [
                { "line": 15, "description": "scanf로 readData 입력받음", "changes": [ { "variable": "readData", "before": null, "after": 3 } ] },
                { "line": 19, "description": "readData>=1, malloc으로 새 노드 생성 및 초기화", "changes": [ { "variable": "newNode", "before": "NULL", "after": "0x01" } ], "dataStructure": { "type": "linkedList", "nodes": [ { "id": "0x01", "value": 3, "links": [] } ] } },
                { "line": 23, "description": "head == NULL, head와 tail을 newNode로 지정", "changes": [ { "variable": "head", "before": "NULL", "after": "0x01" }, { "variable": "tail", "before": "NULL", "after": "0x01" } ], "dataStructure": { "type": "linkedList", "nodes": [ { "id": "0x01", "value": 3, "links": [] } ] } },
                { "line": 15, "description": "scanf로 readData 입력받음", "changes": [ { "variable": "readData", "before": 3, "after": 5 } ] },
                { "line": 19, "description": "readData>=1, malloc으로 새 노드 생성 및 초기화", "changes": [ { "variable": "newNode", "before": "0x01", "after": "0x02" } ], "dataStructure": { "type": "linkedList", "nodes": [ { "id": "0x01", "value": 3, "links": ["0x02"] }, { "id": "0x02", "value": 5, "links": [] } ] } },
                { "line": 25, "description": "head != NULL, tail->next에 newNode 연결 후 tail 갱신", "changes": [ { "variable": "tail", "before": "0x01", "after": "0x02" } ], "dataStructure": { "type": "linkedList", "nodes": [ { "id": "0x01", "value": 3, "links": ["0x02"] }, { "id": "0x02", "value": 5, "links": [] } ] } },
                { "line": 15, "description": "scanf로 readData 입력받음", "changes": [ { "variable": "readData", "before": 5, "after": 7 } ] },
                { "line": 19, "description": "readData>=1, malloc으로 새 노드 생성 및 초기화", "changes": [ { "variable": "newNode", "before": "0x02", "after": "0x03" } ], "dataStructure": { "type": "linkedList", "nodes": [ { "id": "0x01", "value": 3, "links": ["0x02"] }, { "id": "0x02", "value": 5, "links": ["0x03"] }, { "id": "0x03", "value": 7, "links": [] } ] } },
                { "line": 25, "description": "head != NULL, tail->next에 newNode 연결 후 tail 갱신", "changes": [ { "variable": "tail", "before": "0x02", "after": "0x03" } ], "dataStructure": { "type": "linkedList", "nodes": [ { "id": "0x01", "value": 3, "links": ["0x02"] }, { "id": "0x02", "value": 5, "links": ["0x03"] }, { "id": "0x03", "value": 7, "links": [] } ] } },
                { "line": 15, "description": "scanf로 readData 입력받음", "changes": [ { "variable": "readData", "before": 7, "after": 0 } ] },
                { "line": 17, "description": "readData<1, while문 탈출" },
                { "line": 31, "description": "head != NULL, cur을 head로 지정", "changes": [ { "variable": "cur", "before": "NULL", "after": "0x01" } ] },
                { "line": 32, "description": "첫 번째 노드 출력: 3" },
                { "line": 34, "description": "cur->next != NULL, cur을 다음 노드로 이동", "changes": [ { "variable": "cur", "before": "0x01", "after": "0x02" } ] },
                { "line": 35, "description": "데이터 출력: 5" },
                { "line": 34, "description": "cur->next != NULL, cur을 다음 노드로 이동", "changes": [ { "variable": "cur", "before": "0x02", "after": "0x03" } ] },
                { "line": 35, "description": "데이터 출력: 7" },
                { "line": 34, "description": "cur->next == NULL, 출력 종료" },
                { "line": 42, "description": "head != NULL, 삭제 단계 진입. delNode=head, delNextNode=head->next 지정", "changes": [ { "variable": "delNode", "before": null, "after": "0x01" }, { "variable": "delNextNode", "before": null, "after": "0x02" } ] },
                { "line": 45, "description": "첫 번째 노드(3) 삭제", "dataStructure": { "type": "linkedList", "nodes": [ { "id": "0x02", "value": 5, "links": ["0x03"] }, { "id": "0x03", "value": 7, "links": [] } ] } },
                { "line": 47, "description": "두 번째 노드 존재, 삭제 준비. delNode=delNextNode, delNextNode=delNextNode->next", "changes": [ { "variable": "delNode", "before": "0x01", "after": "0x02" }, { "variable": "delNextNode", "before": "0x02", "after": "0x03" } ] },
                { "line": 50, "description": "두 번째 노드(5) 삭제", "dataStructure": { "type": "linkedList", "nodes": [ { "id": "0x03", "value": 7, "links": [] } ] } },
                { "line": 47, "description": "세 번째 노드 존재, 삭제 준비. delNode=delNextNode, delNextNode=delNextNode->next", "changes": [ { "variable": "delNode", "before": "0x02", "after": "0x03" }, { "variable": "delNextNode", "before": "0x03", "after": null } ] },
                { "line": 50, "description": "세 번째 노드(7) 삭제", "dataStructure": { "type": "linkedList", "nodes": [] } },
                { "line": 54, "description": "프로그램 종료" }
            ]
        };
    }
    // 🔄 이진탐색트리 Mock 데이터
    if (codeContent.includes('binary')) {
        return {
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
                { "line": 29, "description": "main 시작, root 초기화", "changes": [ { "variable": "root", "before": "NULL", "after": "NULL" } ] },
                { "line": 30, "description": "insert(root, 50) 호출", "stack": [ { "function": "insert", "params": ["NULL", 50] } ] },
                { "line": 17, "description": "root == NULL, createNode(50) 호출", "stack": [ { "function": "createNode", "params": [50] } ] },
                { "line": 11, "description": "newNode 생성 및 초기화", "changes": [ { "variable": "newNode", "before": null, "after": "0x01" } ], "dataStructure": { "type": "bst", "nodes": [ { "id": "0x01", "value": 50, "links": [] } ] } },
                { "line": 13, "description": "createNode 반환", "stack": [ { "function": "insert", "params": ["NULL", 50] } ] },
                { "line": 18, "description": "insert 반환, root=0x01", "changes": [ { "variable": "root", "before": "NULL", "after": "0x01" } ] },
                { "line": 31, "description": "insert(root, 30) 호출", "stack": [ { "function": "insert", "params": ["0x01", 30] } ] },
                { "line": 19, "description": "30 < 50, insert(root->left, 30) 재귀호출", "stack": [ { "function": "insert", "params": ["NULL", 30] } ] },
                { "line": 17, "description": "root==NULL, createNode(30) 호출", "stack": [ { "function": "createNode", "params": [30] } ] },
                { "line": 11, "description": "newNode 생성 및 초기화", "changes": [ { "variable": "newNode", "before": "0x01", "after": "0x02" } ], "dataStructure": { "type": "bst", "nodes": [ { "id": "0x01", "value": 50, "links": ["0x02"] }, { "id": "0x02", "value": 30, "links": [] } ] } },
                { "line": 13, "description": "createNode 반환", "stack": [ { "function": "insert", "params": ["NULL", 30] } ] },
                { "line": 18, "description": "재귀 insert 반환, root->left=0x02", "stack": [ { "function": "insert", "params": ["0x01", 30] } ] },
                { "line": 22, "description": "insert 반환" },
                { "line": 32, "description": "insert(root, 70) 호출", "stack": [ { "function": "insert", "params": ["0x01", 70] } ] },
                { "line": 20, "description": "70 > 50, insert(root->right, 70) 재귀호출", "stack": [ { "function": "insert", "params": ["NULL", 70] } ] },
                { "line": 17, "description": "root==NULL, createNode(70) 호출", "stack": [ { "function": "createNode", "params": [70] } ] },
                { "line": 11, "description": "newNode 생성 및 초기화", "changes": [ { "variable": "newNode", "before": "0x02", "after": "0x03" } ], "dataStructure": { "type": "bst", "nodes": [ { "id": "0x01", "value": 50, "links": ["0x02", "0x03"] }, { "id": "0x02", "value": 30, "links": [] }, { "id": "0x03", "value": 70, "links": [] } ] } },
                { "line": 13, "description": "createNode 반환", "stack": [ { "function": "insert", "params": ["NULL", 70] } ] },
                { "line": 18, "description": "재귀 insert 반환, root->right=0x03", "stack": [ { "function": "insert", "params": ["0x01", 70] } ] },
                { "line": 22, "description": "insert 반환" },
                { "line": 33, "description": "insert(root, 20) 호출", "stack": [ { "function": "insert", "params": ["0x01", 20] } ] },
                { "line": 19, "description": "20 < 50, insert(root->left, 20) 재귀호출", "stack": [ { "function": "insert", "params": ["0x02", 20] } ] },
                { "line": 19, "description": "20 < 30, insert(root->left, 20) 재귀호출", "stack": [ { "function": "insert", "params": ["NULL", 20] } ] },
                { "line": 17, "description": "root==NULL, createNode(20) 호출", "stack": [ { "function": "createNode", "params": [20] } ] },
                { "line": 11, "description": "newNode 생성 및 초기화", "changes": [ { "variable": "newNode", "before": "0x03", "after": "0x04" } ], "dataStructure": { "type": "bst", "nodes": [ { "id": "0x01", "value": 50, "links": ["0x02", "0x03"] }, { "id": "0x02", "value": 30, "links": ["0x04"] }, { "id": "0x03", "value": 70, "links": [] }, { "id": "0x04", "value": 20, "links": [] } ] } },
                { "line": 13, "description": "createNode 반환" },
                { "line": 18, "description": "재귀 insert 반환, root->left=0x04" },
                { "line": 18, "description": "재귀 insert 반환, root->left=0x02" },
                { "line": 22, "description": "insert 반환" },
                { "line": 34, "description": "insert(root, 40) 호출", "stack": [ { "function": "insert", "params": ["0x01", 40] } ] },
                { "line": 19, "description": "40 < 50, insert(root->left, 40) 재귀호출", "stack": [ { "function": "insert", "params": ["0x02", 40] } ] },
                { "line": 20, "description": "40 > 30, insert(root->right, 40) 재귀호출", "stack": [ { "function": "insert", "params": ["NULL", 40] } ] },
                { "line": 17, "description": "root==NULL, createNode(40) 호출", "stack": [ { "function": "createNode", "params": [40] } ] },
                { "line": 11, "description": "newNode 생성 및 초기화", "changes": [ { "variable": "newNode", "before": "0x04", "after": "0x05" } ], "dataStructure": { "type": "bst", "nodes": [ { "id": "0x01", "value": 50, "links": ["0x02", "0x03"] }, { "id": "0x02", "value": 30, "links": ["0x04", "0x05"] }, { "id": "0x03", "value": 70, "links": [] }, { "id": "0x04", "value": 20, "links": [] }, { "id": "0x05", "value": 40, "links": [] } ] } },
                { "line": 13, "description": "createNode 반환" },
                { "line": 18, "description": "재귀 insert 반환, root->right=0x05" },
                { "line": 18, "description": "재귀 insert 반환, root->left=0x02" },
                { "line": 22, "description": "insert 반환" },
                { "line": 36, "description": "printf(\"Inorder Traversal\")" },
                { "line": 37, "description": "inorder(root) 호출", "stack": [ { "function": "inorder", "params": ["0x01"] } ] },
                { "line": 25, "description": "inorder(root->left) 호출", "stack": [ { "function": "inorder", "params": ["0x02"] } ] },
                { "line": 25, "description": "inorder(root->left) 호출", "stack": [ { "function": "inorder", "params": ["0x04"] } ] },
                { "line": 25, "description": "inorder(root->left=NULL), 반환" },
                { "line": 27, "description": "출력: 20" },
                { "line": 28, "description": "inorder(root->right=NULL), 반환" },
                { "line": 27, "description": "출력: 30" },
                { "line": 28, "description": "inorder(root->right) 호출", "stack": [ { "function": "inorder", "params": ["0x05"] } ] },
                { "line": 25, "description": "inorder(root->left=NULL), 반환" },
                { "line": 27, "description": "출력: 40" },
                { "line": 28, "description": "inorder(root->right=NULL), 반환" },
                { "line": 27, "description": "출력: 50" },
                { "line": 28, "description": "inorder(root->right) 호출", "stack": [ { "function": "inorder", "params": ["0x03"] } ] },
                { "line": 25, "description": "inorder(root->left=NULL), 반환" },
                { "line": 27, "description": "출력: 70" },
                { "line": 28, "description": "inorder(root->right=NULL), 반환" },
                { "line": 39, "description": "main 종료" }
            ]
        };
    }
    // 🔄 힙 Mock 데이터
    if (codeContent.includes('heap')) {
        return {
            "lang": "c",
            "code": "#include <stdio.h>\n#include <stdlib.h>\n#define MAX_ELEMENT 200\ntypedef struct{\n  int key;\n} element;\ntypedef struct{\n  element heap[MAX_ELEMENT];\n  int heap_size;\n} HeapType;\n\nHeapType* create()\n{\n  return (HeapType*)malloc(sizeof(HeapType));\n}\n\nvoid init(HeapType* h)\n{\n  h->heap_size=0;\n}\n\nvoid insert_max_heap(HeapType *h,element item)\n{\n  int i;\n  i=++(h->heap_size);\n  \n  while((i!=1)&&(item.key>h->heap[i/2].key)){\n     h->heap[i]=h->heap[i/2];\n     i/=2;\n  }\n  h->heap[i]=item;\n}\n\nelement delete_max_heap(HeapType* h)\n{\n  int parent, child;\n  element item, temp;\n  \n  item=h->heap[1];\n  temp=h->heap[(h->heap_size)--];\n  parent=1;\n  child=2;\n  while(child<=h->heap_size){\n    if((child<h->heap_size)&&\n       (h->heap[child].key)<h->heap[child+1].key)\n       child++;\n    if(temp.key >= h->heap[child].key) break;\n    \n    h->heap[parent]=h->heap[child];\n    parent=child;\n    child*=2;\n  }\n  h->heap[parent]=temp;\n  return item;\n}\n\nint main(void)\n{ \n  element e1={10},e2={5},e3={30};\n  element e4,e5,e6;\n  \n  HeapType* heap;\n  \n  heap=create();\n  init(heap);\n  \n  insert_max_heap(heap,e1);\n  insert_max_heap(heap,e2);\n  insert_max_heap(heap,e3);\n  \n  e4=delete_max_heap(heap);\n  printf(\"<%d>\",e4.key);\n  e5=delete_max_heap(heap);\n  printf(\"<%d>\",e5.key);  \n  e6=delete_max_heap(heap);\n  printf(\"<%d>\",e6.key);\n}",
            "input": "",
            "variables": [
                { "name": "heap", "type": "heap", "initialValue": "empty", "currentValue": "empty" },
                { "name": "e1", "type": "element", "initialValue": "{10}", "currentValue": "{10}" },
                { "name": "e2", "type": "element", "initialValue": "{5}", "currentValue": "{5}" },
                { "name": "e3", "type": "element", "initialValue": "{30}", "currentValue": "{30}" },
                { "name": "e4", "type": "element", "initialValue": "undefined", "currentValue": "{30}" },
                { "name": "e5", "type": "element", "initialValue": "undefined", "currentValue": "{10}" },
                { "name": "e6", "type": "element", "initialValue": "undefined", "currentValue": "{5}" }
            ],
            "functions": [
                { "name": "create", "params": [], "called": 1 },
                { "name": "init", "params": ["h"], "called": 1 },
                { "name": "insert_max_heap", "params": ["h", "item"], "called": 3 },
                { "name": "delete_max_heap", "params": ["h"], "called": 3 }
            ],
            "steps": [
                {
                    "line": 41,
                    "description": "힙 생성 및 초기화",
                    "changes": [
                        { "variable": "heap", "before": "empty", "after": "heap_size=0" }
                    ],
                    "dataStructure": {
                        "type": "heap",
                        "nodes": []
                    }
                },
                {
                    "line": 44,
                    "description": "10 삽입 (루트에 삽입)",
                    "changes": [
                        { "variable": "heap", "before": "heap_size=0", "after": "heap_size=1" }
                    ],
                    "dataStructure": {
                        "type": "heap",
                        "nodes": [
                            { "id": "1", "value": 10, "links": [] }
                        ]
                    }
                },
                {
                    "line": 45,
                    "description": "5 삽입 (부모 10보다 작아 그대로 삽입)",
                    "changes": [
                        { "variable": "heap", "before": "heap_size=1", "after": "heap_size=2" }
                    ],
                    "dataStructure": {
                        "type": "heap",
                        "nodes": [
                            { "id": "1", "value": 10, "links": ["2"] },
                            { "id": "2", "value": 5, "links": [] }
                        ]
                    }
                },
                {
                    "line": 46,
                    "description": "30 삽입 (부모 10보다 커서 루트로 승격)",
                    "changes": [
                        { "variable": "heap", "before": "heap_size=2", "after": "heap_size=3" }
                    ],
                    "dataStructure": {
                        "type": "heap",
                        "nodes": [
                            { "id": "1", "value": 30, "links": ["2", "3"] },
                            { "id": "2", "value": 5, "links": [] },
                            { "id": "3", "value": 10, "links": [] }
                        ]
                    }
                },
                {
                    "line": 48,
                    "description": "첫 번째 삭제 (루트 30 삭제, 마지막 노드 10이 루트로 이동 후 재정렬)",
                    "changes": [
                        { "variable": "e4", "before": "undefined", "after": "{30}" },
                        { "variable": "heap", "before": "heap_size=3", "after": "heap_size=2" }
                    ],
                    "dataStructure": {
                        "type": "heap",
                        "nodes": [
                            { "id": "1", "value": 10, "links": ["2"] },
                            { "id": "2", "value": 5, "links": [] }
                        ]
                    }
                },
                {
                    "line": 49,
                    "description": "두 번째 삭제 (루트 10 삭제, 마지막 노드 5가 루트로 이동)",
                    "changes": [
                        { "variable": "e5", "before": "undefined", "after": "{10}" },
                        { "variable": "heap", "before": "heap_size=2", "after": "heap_size=1" }
                    ],
                    "dataStructure": {
                        "type": "heap",
                        "nodes": [
                            { "id": "1", "value": 5, "links": [] }
                        ]
                    }
                },
                {
                    "line": 50,
                    "description": "세 번째 삭제 (루트 5 삭제, 힙 비움)",
                    "changes": [
                        { "variable": "e6", "before": "undefined", "after": "{5}" },
                        { "variable": "heap", "before": "heap_size=1", "after": "heap_size=0" }
                    ],
                    "dataStructure": {
                        "type": "heap",
                        "nodes": []
                    }
                }
            ]
        };
    }
    // 🔄 인접행렬 Mock 데이터
    if (codeContent.includes('graph')) {
        return {
            "lang": "c",
            "code": "#include <stdio.h>\n#include <stdlib.h>\n\n#define MAX_VERTICES 50\n\ntypedef struct GraphType{\n    int n;\n    int adj_mat[MAX_VERTICES][MAX_VERTICES];\n} GraphType;\n\nvoid init(GraphType* g){\n    int r,c;\n    g->n=0;\n    for(r=0;r<MAX_VERTICES;r++)\n        for(c=0;c<MAX_VERTICES;c++)\n           g->adj_mat[r][c]=0;\n}\n\nvoid insert_vertex(GraphType* g,int v){\n    if (((g->n)+1)>MAX_VERTICES){\n        fprintf(stderr,\"overflow\");\n        return;\n    }\n    g->n++;\n}\n\nvoid insert_edge(GraphType* g,int start,int end){\n    if(start>=g->n||end>=g->n){\n        fprintf(stderr,\"vertex key error\");\n        return;\n    }\n    g->adj_mat[start][end]=1;\n    g->adj_mat[end][start]=1;\n}\n\nvoid print_adj_mat(GraphType* g){\n    for(int i=0;i<g->n;i++){\n        for(int j=0;j<g->n;j++){\n            printf(\"%2d\",g->adj_mat[i][j]);\n        }\n        printf(\"\\n\");\n    }\n}\n\nvoid main()\n{\n    GraphType *g;\n    g=(GraphType *)malloc(sizeof(GraphType));\n    init(g);\n    for(int i=0;i<4;i++)\n       insert_vertex(g,i);\n    insert_edge(g,0,1);\n    insert_edge(g,0,2);\n    insert_edge(g,0,3);\n    insert_edge(g,1,2);\n    insert_edge(g,2,3);\n    print_adj_mat(g);\n    \n    free(g);\n}",
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
        };
    }
    // 🔄 피보나치 재귀 Mock 데이터
    if (codeContent.includes('fibo')) {
        return {
            "lang": "c",
            "code": "#include <stdio.h>\n\nint fibo(int n);\n\nint main() {\n    int n;\n    scanf(\"%d\", &n);\n    printf(\"%d\", fibo(n));\n}\n\nint fibo(int n)\n{\n    if (n==0){\n        return 0;\n    }\n    else if (n==1){\n        return 1;\n    }\n    else {\n        return fibo(n-2) + fibo(n-1);\n    }\n}",
            "input": "7",
            "variables": [
                { "name": "n", "type": "int", "initialValue": null, "currentValue": 7 }
            ],
            "functions": [
                { "name": "fibo", "params": ["n"], "called": 25 }
            ],
            "steps": [
                {
                    "line": 5,
                    "description": "입력값 n을 사용자로부터 입력받음",
                    "changes": [
                        { "variable": "n", "before": null, "after": 7 }
                    ]
                },
                {
                    "line": 6,
                    "description": "fibo(7) 호출",
                    "changes": [],
                    "stack": [
                        { "function": "fibo", "params": [7] }
                    ],
                    "dataStructure": {
                        "type": "recursionTree",
                        "root": {
                            "id": "fibo(7)",
                            "value": 13,
                            "children": [
                                {
                                    "id": "fibo(5)",
                                    "value": 5,
                                    "children": [
                                        {
                                            "id": "fibo(3)",
                                            "value": 2,
                                            "children": [
                                                {
                                                    "id": "fibo(1)",
                                                    "value": 1,
                                                    "children": []
                                                },
                                                {
                                                    "id": "fibo(2)",
                                                    "value": 1,
                                                    "children": [
                                                        {
                                                            "id": "fibo(0)",
                                                            "value": 0,
                                                            "children": []
                                                        },
                                                        {
                                                            "id": "fibo(1)",
                                                            "value": 1,
                                                            "children": []
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": "fibo(4)",
                                            "value": 3,
                                            "children": [
                                                {
                                                    "id": "fibo(2)",
                                                    "value": 1,
                                                    "children": [
                                                        {
                                                            "id": "fibo(0)",
                                                            "value": 0,
                                                            "children": []
                                                        },
                                                        {
                                                            "id": "fibo(1)",
                                                            "value": 1,
                                                            "children": []
                                                        }
                                                    ]
                                                },
                                                {
                                                    "id": "fibo(3)",
                                                    "value": 2,
                                                    "children": [
                                                        {
                                                            "id": "fibo(1)",
                                                            "value": 1,
                                                            "children": []
                                                        },
                                                        {
                                                            "id": "fibo(2)",
                                                            "value": 1,
                                                            "children": [
                                                                {
                                                                    "id": "fibo(0)",
                                                                    "value": 0,
                                                                    "children": []
                                                                },
                                                                {
                                                                    "id": "fibo(1)",
                                                                    "value": 1,
                                                                    "children": []
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    "id": "fibo(6)",
                                    "value": 8,
                                    "children": [
                                        {
                                            "id": "fibo(4)",
                                            "value": 3,
                                            "children": [
                                                {
                                                    "id": "fibo(2)",
                                                    "value": 1,
                                                    "children": [
                                                        {
                                                            "id": "fibo(0)",
                                                            "value": 0,
                                                            "children": []
                                                        },
                                                        {
                                                            "id": "fibo(1)",
                                                            "value": 1,
                                                            "children": []
                                                        }
                                                    ]
                                                },
                                                {
                                                    "id": "fibo(3)",
                                                    "value": 2,
                                                    "children": [
                                                        {
                                                            "id": "fibo(1)",
                                                            "value": 1,
                                                            "children": []
                                                        },
                                                        {
                                                            "id": "fibo(2)",
                                                            "value": 1,
                                                            "children": [
                                                                {
                                                                    "id": "fibo(0)",
                                                                    "value": 0,
                                                                    "children": []
                                                                },
                                                                {
                                                                    "id": "fibo(1)",
                                                                    "value": 1,
                                                                    "children": []
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        {
                                            "id": "fibo(5)",
                                            "value": 5,
                                            "children": [
                                                {
                                                    "id": "fibo(3)",
                                                    "value": 2,
                                                    "children": [
                                                        {
                                                            "id": "fibo(1)",
                                                            "value": 1,
                                                            "children": []
                                                        },
                                                        {
                                                            "id": "fibo(2)",
                                                            "value": 1,
                                                            "children": [
                                                                {
                                                                    "id": "fibo(0)",
                                                                    "value": 0,
                                                                    "children": []
                                                                },
                                                                {
                                                                    "id": "fibo(1)",
                                                                    "value": 1,
                                                                    "children": []
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                },
                                                {
                                                    "id": "fibo(4)",
                                                    "value": 3,
                                                    "children": [
                                                        {
                                                            "id": "fibo(2)",
                                                            "value": 1,
                                                            "children": [
                                                                {
                                                                    "id": "fibo(0)",
                                                                    "value": 0,
                                                                    "children": []
                                                                },
                                                                {
                                                                    "id": "fibo(1)",
                                                                    "value": 1,
                                                                    "children": []
                                                                }
                                                            ]
                                                        },
                                                        {
                                                            "id": "fibo(3)",
                                                            "value": 2,
                                                            "children": [
                                                                {
                                                                    "id": "fibo(1)",
                                                                    "value": 1,
                                                                    "children": []
                                                                },
                                                                {
                                                                    "id": "fibo(2)",
                                                                    "value": 1,
                                                                    "children": [
                                                                        {
                                                                            "id": "fibo(0)",
                                                                            "value": 0,
                                                                            "children": []
                                                                        },
                                                                        {
                                                                            "id": "fibo(1)",
                                                                            "value": 1,
                                                                            "children": []
                                                                        }
                                                                    ]
                                                                }
                                                            ]
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                },
                {
                    "line": 6,
                    "description": "fibo(7)의 결과를 출력",
                    "changes": [],
                    "stack": []
                }
            ]
        };
    }

    if (codeContent.includes('fibo') && codeContent.includes('return')) {
        return {
            lang: language,
            code: code,
            input: input || "7",
            variables: [
                { name: "n", type: "int", initialValue: null, currentValue: parseInt(input) || 7 }
            ],
            functions: [
                { name: "fibo", params: ["n"], called: 25 }
            ],
            steps: [
                {
                    line: 5,
                    description: "입력값 n을 사용자로부터 입력받음",
                    changes: [
                        { variable: "n", before: null, after: parseInt(input) || 7 }
                    ]
                },
                {
                    line: 6,
                    description: `fibo(${parseInt(input) || 7}) 호출`,
                    changes: []
                },
                {
                    line: 6,
                    description: `fibo(${parseInt(input) || 7})의 결과를 출력`,
                    changes: []
                }
            ]
        };
    }

    // 기본 변수 추적
    return {
        lang: language,
        input: input || "5",
        variables: [
            { name: "n", type: "int", initialValue: null, currentValue: parseInt(input) || 5 },
            { name: "i", type: "int", initialValue: null, currentValue: 1 },
            { name: "j", type: "int", initialValue: null, currentValue: 0 }
        ],
        steps: [
            { line: 3, description: "변수 n 선언" },
            { line: 4, description: "n 입력 받음", changes: [{ variable: "n", before: null, after: parseInt(input) || 5 }] },
            { line: 6, description: "i=1부터 n까지 for문 시작" },
            { line: 8, description: "공백 출력" },
            { line: 10, description: "* 출력" },
            { line: 11, description: "줄바꿈 출력" },
            { line: 6, description: "프로그램 완료" }
        ]
    };
};

// 메인 모달 컴포넌트
const VisualizationModal = ({ isOpen, onClose, code, language, input }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [animationType, setAnimationType] = useState('variables');
    const [totalSteps, setTotalSteps] = useState(0);

    const animationControls = useAnimationControls(totalSteps);

    // 데이터 가져오기 함수
    const fetchVisualizationData = async () => {
        if (!code?.trim()) {
            setError('코드가 비어있습니다.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 1500));

            const mockData = getMockDataByCodePattern(code, language, input);
            setData(mockData);
            const steps = mockData.steps?.length || 0;
            setTotalSteps(steps);
            animationControls.reset();

            // 애니메이션 타입 설정
            const codeContent = code.toLowerCase();
            if (codeContent.includes('fibo')) {
                setAnimationType('fibonacci-recursion');
            } else if (codeContent.includes('bubble')) {
                setAnimationType('bubble-sort');
            } else if (codeContent.includes('linked')) {
                setAnimationType('linked-list');
            } else if (codeContent.includes('binary')) {
                setAnimationType('binary-tree');
            } else if (codeContent.includes('heap')) {
                setAnimationType('heap');
            } else if (codeContent.includes('graph')) {
                setAnimationType('graph');
            } else {
                setAnimationType('variables');
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 모달 초기화
    const resetModal = () => {
        setData(null);
        setError(null);
        setTotalSteps(0);
        animationControls.reset();
    };

    // 모달이 열릴 때 자동으로 시각화 생성
    useEffect(() => {
        if (isOpen && !data && !isLoading) {
            fetchVisualizationData();
        }
    }, [isOpen]);

    // 모달이 닫힐 때 상태 초기화
    useEffect(() => {
        if (!isOpen) {
            resetModal();
        }
    }, [isOpen]);

    // ESC 키로 모달 닫기
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // 모달이 열려있지 않으면 렌더링하지 않음
    if (!isOpen) return null;

    // 포털을 사용하여 body에 직접 렌더링
    return ReactDOM.createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                    width: '95vw',
                    height: '92vh',
                    maxWidth: '1600px',
                    maxHeight: '1000px',
                    minHeight: '700px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* 🎯 모달 헤더 */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px 24px',
                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                    color: 'white',
                    borderRadius: '16px 16px 0 0',
                    flexShrink: 0
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                    }}>
                        <span style={{ fontSize: '24px' }}>📊</span>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>코드 시각화</h2>
                        <div style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            padding: '4px 12px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: '500'
                        }}>
                            {language}
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px'
                    }}>
                        {/* 🎮 애니메이션 컨트롤 버튼들 */}
                        {data && !isLoading && (
                            <>
                                <VisualizationControls
                                    isPlaying={animationControls.isPlaying}
                                    currentStep={animationControls.currentStep}
                                    totalSteps={totalSteps}
                                    speed={animationControls.speed}
                                    onPlay={animationControls.play}
                                    onPause={animationControls.pause}
                                    onStepBack={animationControls.stepBack}
                                    onStepForward={animationControls.stepForward}
                                    onReset={animationControls.reset}
                                    onSpeedChange={animationControls.setSpeed}
                                    onStepChange={animationControls.goToStep}
                                />

                                <button
                                    onClick={fetchVisualizationData}
                                    disabled={isLoading}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.2)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        color: 'white',
                                        fontSize: '16px',
                                        opacity: isLoading ? 0.5 : 1
                                    }}
                                    title="다시 생성"
                                >
                                    🔄
                                </button>
                            </>
                        )}

                        <button
                            onClick={onClose}
                            style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                borderRadius: '8px',
                                width: '36px',
                                height: '36px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                color: 'white',
                                fontSize: '16px'
                            }}
                            title="모달 닫기"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* 🔥 핵심: 2열 레이아웃 - 왼쪽 정보패널 + 오른쪽 애니메이션 */}
                {/* 🔥 핵심: 2열 레이아웃 - 왼쪽 정보패널 + 오른쪽 애니메이션 */}
                <div style={{
                    flex: 1,
                    background: '#f1f5f9',
                    display: 'grid',
                    gridTemplateColumns: '280px 1fr',
                    gap: '0',
                    overflow: 'hidden',
                    maxHeight: 'calc(100vh - 140px)' // 🔥 추가: 최대 높이 제한
                }}>
                    {/* 📋 왼쪽: 정보 패널 */}
                    {/* 📋 왼쪽: 정보 패널 */}
                    <div style={{
                        background: '#ffffff',
                        borderRight: '1px solid #e2e8f0',
                        padding: '20px',
                        overflowY: 'auto',
                        overflowX: 'hidden', // 🔥 추가
                        maxHeight: 'calc(100vh - 140px)', // 🔥 추가
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {data ? (
                            <InfoPanel
                                data={data}
                                currentStep={animationControls.currentStep}
                                totalSteps={totalSteps}
                                animationType={animationType}
                            />
                        ) : (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                textAlign: 'center',
                                color: '#64748b'
                            }}>
                                <div>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                                    <p>데이터 로딩 중...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 🎬 오른쪽: 메인 애니메이션 영역 */}
                    <div style={{
                        background: '#ffffff',
                        padding: '20px',
                        overflowY: 'auto', // 🔥 수정: overflow → overflowY
                        overflowX: 'hidden', // 🔥 추가
                        maxHeight: 'calc(100vh - 140px)', // 🔥 추가
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        {isLoading ? (
                            <LoadingAnimation message="시각화 생성 중..." code={code} language={language} />
                        ) : error ? (
                            <ErrorDisplay error={error} onRetry={fetchVisualizationData} />
                        ) : data ? (
                            <AnimationDisplay
                                data={data}
                                currentStep={animationControls.currentStep}
                                totalSteps={totalSteps}
                                animationType={animationType}
                                isPlaying={animationControls.isPlaying}
                            />
                        ) : (
                            <div style={{
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                                gap: '20px',
                                minHeight: '400px'
                            }}>
                                <div style={{ fontSize: '64px' }}>🚀</div>
                                <h3 style={{ margin: 0, color: '#1e293b' }}>시각화 준비 중...</h3>
                                <p style={{ margin: 0, color: '#64748b' }}>잠시만 기다려주세요</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CSS 애니메이션 스타일 */}
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px) scale(1); }
                    50% { transform: translateY(-10px) scale(1.05); }
                }
            `}</style>
        </div>,
        document.body
    );
};

{/* CSS 애니메이션 스타일 */}
<style jsx>{`
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    @keyframes float {
        0%, 100% { transform: translateY(0px) scale(1); }
        50% { transform: translateY(-10px) scale(1.05); }
    }

    /* 🔥 스크롤바 스타일 추가 */
    .main-animation-area::-webkit-scrollbar {
        width: 8px;
    }
    .main-animation-area::-webkit-scrollbar-track {
        background: #f1f5f9;
        border-radius: 4px;
    }
    .main-animation-area::-webkit-scrollbar-thumb {
        background: #cbd5e1;
        border-radius: 4px;
        transition: background 0.2s;
    }
    .main-animation-area::-webkit-scrollbar-thumb:hover {
        background: #94a3b8;
    }
`}</style>

export default VisualizationModal;

