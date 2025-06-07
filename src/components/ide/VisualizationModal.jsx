import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';

// 애니메이션 컨트롤 훅
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

// 🔥 핵심: 오른쪽 영역에 표시될 애니메이션 컴포넌트
const AnimationDisplay = ({ data, currentStep, totalSteps, animationType }) => {
    // 애니메이션 타입별 아이콘 및 이름 설정
    const getAnimationInfo = (type) => {
        const typeMap = {
            'fibonacci-recursion': { icon: '🌳', name: '피보나치 재귀' },
            'bubble-sort': { icon: '📊', name: '버블 정렬' },
            'variables': { icon: '📝', name: '변수 추적' },
            'array': { icon: '📋', name: '배열 조작' },
            'recursion-tree': { icon: '🌲', name: '재귀 트리' }
        };
        return typeMap[type] || { icon: '🎬', name: '알고리즘 시각화' };
    };

    const { icon, name } = getAnimationInfo(animationType);

    // 🎯 실제 애니메이션이 여기에 렌더링됩니다
    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '500px',
            background: '#ffffff',
            borderRadius: '12px',
            border: '2px solid #ef4444', // 🔴 디버깅용 빨간 테두리 (확인 후 제거 가능)
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* 애니메이션 헤더 */}
            <div style={{
                padding: '20px 24px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderBottom: '1px solid #e2e8f0'
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
                </h3>
                <p style={{
                    margin: 0,
                    color: '#64748b',
                    fontSize: '14px'
                }}>
                    현재 {currentStep + 1}단계 / 총 {totalSteps}단계
                </p>
            </div>

            {/* 메인 애니메이션 영역 */}
            <div style={{
                flex: 1,
                padding: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fafbfc'
            }}>
                {/* 🎬 여기가 실제 애니메이션이 표시될 영역입니다 */}
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    border: '2px dashed #d1d5db',
                    borderRadius: '12px',
                    padding: '40px',
                    background: '#ffffff'
                }}>
                    {/* 현재는 플레이스홀더, 실제 애니메이션 컴포넌트로 교체 예정 */}
                    <div style={{
                        fontSize: '64px',
                        marginBottom: '20px',
                        animation: 'float 3s ease-in-out infinite'
                    }}>
                        {icon}
                    </div>

                    <h4 style={{
                        margin: '0 0 16px 0',
                        color: '#1e293b',
                        fontSize: '24px',
                        fontWeight: '700'
                    }}>
                        {name} 애니메이션
                    </h4>

                    <p style={{
                        margin: '0 0 24px 0',
                        color: '#64748b',
                        fontSize: '16px',
                        maxWidth: '400px',
                        lineHeight: '1.6'
                    }}>
                        이 영역에 {name} 과정이 실시간으로 시각화됩니다.
                    </p>

                    {/* 현재 단계 정보 */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '12px',
                        width: '100%',
                        maxWidth: '500px',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            background: '#f1f5f9',
                            padding: '12px',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                현재 단계
                            </div>
                            <div style={{ fontSize: '18px', color: '#8b5cf6', fontWeight: '700' }}>
                                {currentStep + 1}
                            </div>
                        </div>

                        <div style={{
                            background: '#f1f5f9',
                            padding: '12px',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                총 단계
                            </div>
                            <div style={{ fontSize: '18px', color: '#8b5cf6', fontWeight: '700' }}>
                                {totalSteps}
                            </div>
                        </div>

                        {data?.variables && (
                            <div style={{
                                background: '#f1f5f9',
                                padding: '12px',
                                borderRadius: '8px',
                                textAlign: 'center'
                            }}>
                                <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
                                    변수 개수
                                </div>
                                <div style={{ fontSize: '18px', color: '#8b5cf6', fontWeight: '700' }}>
                                    {data.variables.length}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 현재 단계 설명 */}
                    {data?.steps?.[currentStep] && (
                        <div style={{
                            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                            border: '1px solid #bfdbfe',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            maxWidth: '600px',
                            width: '100%'
                        }}>
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: '#1e40af',
                                marginBottom: '8px'
                            }}>
                                📍 현재 실행 중인 단계:
                            </div>
                            <div style={{
                                fontSize: '15px',
                                color: '#1e293b',
                                lineHeight: '1.5'
                            }}>
                                {data.steps[currentStep].description || '단계를 실행하고 있습니다...'}
                            </div>
                            {data.steps[currentStep].line && (
                                <div style={{
                                    fontSize: '12px',
                                    color: '#7c3aed',
                                    marginTop: '8px',
                                    fontWeight: '500'
                                }}>
                                    📝 코드 라인: {data.steps[currentStep].line}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-10px) scale(1.05); }
        }
      `}</style>
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
            overflowY: 'auto'
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

// 메인 모달 컴포넌트
const VisualizationModal = ({ isOpen, onClose, code, language, input }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [animationType, setAnimationType] = useState('variables');
    const [totalSteps, setTotalSteps] = useState(0);

    const animationControls = useAnimationControls(totalSteps);

    // Mock 데이터 생성 함수
    const getMockDataByCodePattern = (code, language, input) => {
        const codeContent = code?.toLowerCase() || '';

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
                <div style={{
                    flex: 1,
                    background: '#f1f5f9',
                    display: 'grid',
                    gridTemplateColumns: '280px 1fr', // 왼쪽 280px, 오른쪽 나머지
                    gap: '0',
                    overflow: 'hidden'
                }}>
                    {/* 📋 왼쪽: 정보 패널 */}
                    <div style={{
                        background: '#ffffff',
                        borderRight: '1px solid #e2e8f0',
                        padding: '20px',
                        overflowY: 'auto',
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
                        overflow: 'auto',
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

export default VisualizationModal;