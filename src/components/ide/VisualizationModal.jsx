import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import AnimationFactory from './AnimationFactory';
// 🆕 JSON 매니저 import
import { ApiService } from './services/ApiService';

// 애니메이션 컨트롤 훅 (기존과 동일)
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

    // 자동 재생 로직
    useEffect(() => {
        let intervalId = null;

        if (isPlaying && totalSteps > 0) {
            const interval = 1000 / speed;

            intervalId = setInterval(() => {
                setCurrentStep(prevStep => {
                    const nextStep = prevStep + 1;

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

// 컨트롤 버튼 컴포넌트 (기존과 동일)
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

// 시각화 컨트롤 컴포넌트 (기존과 동일)
const VisualizationControls = ({
                                   isPlaying, currentStep, totalSteps, speed,
                                   onPlay, onPause, onStepBack, onStepForward, onReset, onSpeedChange, onStepChange
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

// 로딩 컴포넌트 (기존과 동일)
const LoadingAnimation = ({ message = "JSON 데이터 로딩 중...", code, language }) => (
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
        <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>JSON 파일에서 데이터를 불러오고 있습니다</p>
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
    </div>
);

// 에러 컴포넌트 (기존과 동일)
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
        <h3 style={{ margin: 0, color: '#1e293b', fontSize: '18px', fontWeight: '600' }}>JSON 데이터 로드 실패</h3>
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

// 🔥 핵심: JSON 기반 애니메이션 컴포넌트
const AnimationDisplay = ({ data, currentStep, totalSteps, animationType, isPlaying }) => {
    console.log('🎬 AnimationDisplay 렌더링:', {
        animationType,
        currentStep,
        totalSteps,
        hasData: !!data,
        isPlaying
    });

    const getAnimationInfo = (type) => {
        const typeMap = {
            'bubble-sort': { icon: '🔄', name: '버블 정렬' },
            'fibonacci-recursion': { icon: '🌳', name: '피보나치 재귀' },
            'linked-list': { icon: '🔗', name: '링크드 리스트' },
            'binary-tree': { icon: '🌲', name: '이진 트리' },
            'heap': { icon: '⛰️', name: '힙' },
            'graph': { icon: '🕸️', name: '그래프' },
            'variables': { icon: '📝', name: '변수 추적' }
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
                    }}>✅ JSON 로드됨</span>}
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

            {/* 🔥 메인 애니메이션 영역 */}
            <div style={{
                flex: 1,
                padding: '24px',
                background: '#fafbfc',
                minHeight: '400px',
                overflowY: 'auto',
                overflowX: 'hidden',
                maxHeight: 'calc(100vh - 280px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: animationComponent ? 'flex-start' : 'center'
            }}>
                {animationComponent ? (
                    <div style={{
                        width: '100%',
                        height: '100%',
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
                    </div>
                )}
            </div>
        </div>
    );
};

// 정보 패널 컴포넌트 (수정됨)
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
            overflowX: 'hidden',
            maxHeight: 'calc(100vh - 160px)',
            paddingRight: '8px'
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

            {/* JSON 데이터 정보 */}
            <InfoCard title="JSON 데이터 정보" icon="📊">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                        { label: '알고리즘', value: data?.algorithm || 'Unknown' },
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
                                    {Array.isArray(variable.currentValue)
                                        ? `[${variable.currentValue.join(', ')}]`
                                        : (variable.currentValue ?? 'null')
                                    }
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
                                    : {JSON.stringify(change.before)} → {JSON.stringify(change.after)}
                                </span>
                            </div>
                        ))}
                    </div>
                </InfoCard>
            )}
        </div>
    );
};

// 🔥 메인 모달 컴포넌트 - JSON 기반으로 수정
const VisualizationModal = ({ isOpen, onClose, code, language, input }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [animationType, setAnimationType] = useState('variables');
    const [totalSteps, setTotalSteps] = useState(0);

    const [apiMode, setApiMode] = useState(true); // API 모드 토글
    const animationControls = useAnimationControls(totalSteps);

    // 🔥 JSON 기반 데이터 가져오기 함수
    const fetchVisualizationData = async () => {
        if (!code?.trim()) {
            setError('코드가 비어있습니다.');
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            console.log('🚀 하이브리드 시각화 데이터 요청 시작');

            // 🌐 API 서비스 사용 (하이브리드 모드)
            const visualizationData = await ApiService.requestVisualization(code, language, input);

            setData(visualizationData);
            const steps = visualizationData.steps?.length || 0;
            setTotalSteps(steps);
            animationControls.reset();

            // 애니메이션 타입 자동 감지
            const detectedType = visualizationData.algorithm || ApiService.detectAlgorithmType(code);
            setAnimationType(detectedType);

            console.log('✅ 하이브리드 시각화 데이터 로드 완료:', {
                algorithm: detectedType,
                steps,
                variables: visualizationData.variables?.length || 0,
                dataSource: visualizationData._dataSource || 'unknown'
            });

        } catch (err) {
            console.error('❌ 하이브리드 시각화 데이터 로드 실패:', err);
            setError(err.message || '시각화 데이터를 생성할 수 없습니다.');
        } finally {
            setIsLoading(false);
        }
    };
    const toggleApiMode = () => {
        const newMode = !apiMode;
        setApiMode(newMode);
        ApiService.setApiMode(newMode);

        console.log(`🎛️ API 모드 변경: ${newMode ? 'Hybrid' : 'JSON Only'}`);

        // 데이터 새로고침
        if (data) {
            fetchVisualizationData();
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

    // CSS 스타일을 위한 스타일 엘리먼트 생성
    const styles = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-10px) scale(1.05); }
        }
        
        .visualization-modal-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .visualization-modal-scrollbar::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 4px;
        }
        .visualization-modal-scrollbar::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 4px;
            transition: background 0.2s;
        }
        .visualization-modal-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }
    `;

    // 포털을 사용하여 body에 직접 렌더링
    return ReactDOM.createPortal(
        <>
            <style>{styles}</style>
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
                            <span style={{fontSize: '24px'}}>🌐</span>
                            <h2 style={{margin: 0, fontSize: '20px', fontWeight: '600'}}>API 연동 코드 시각화</h2>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500'
                            }}>
                                {language}
                            </div>
                            {/* 🆕 JSON 상태 표시 */}
                            {data && (
                                <div style={{
                                    background: apiMode
                                        ? 'rgba(16, 185, 129, 0.3)'
                                        : 'rgba(245, 158, 11, 0.3)',
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    border: apiMode
                                        ? '1px solid rgba(16, 185, 129, 0.5)'
                                        : '1px solid rgba(245, 158, 11, 0.5)'
                                }}>
                                    {apiMode ? '🌐 API+JSON' : '🗂️ JSON'}
                                </div>
                            )}
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            {/* 🎮 애니메이션 컨트롤 버튼들 */}
                            {data && !isLoading && (
                                <>
                                    <button
                                        onClick={toggleApiMode}
                                        style={{
                                            background: apiMode
                                                ? 'linear-gradient(135deg, #10b981, #059669)'
                                                : 'linear-gradient(135deg, #f59e0b, #d97706)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            padding: '8px 12px',
                                            fontSize: '12px',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            transition: 'all 0.2s'
                                        }}
                                        title={apiMode ? 'API + JSON 하이브리드 모드' : 'JSON Mock 전용 모드'}
                                    >
                                        {apiMode ? '🌐' : '🗂️'} {apiMode ? 'API' : 'JSON'}
                                    </button>
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
                                        title="JSON 데이터 새로고침"
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
                        gridTemplateColumns: '280px 1fr',
                        gap: '0',
                        overflow: 'hidden',
                        maxHeight: 'calc(100vh - 140px)'
                    }}>
                        {/* 📋 왼쪽: 정보 패널 */}
                        <div className="visualization-modal-scrollbar" style={{
                            background: '#ffffff',
                            borderRight: '1px solid #e2e8f0',
                            padding: '20px',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            maxHeight: 'calc(100vh - 140px)',
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
                                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🗂️</div>
                                        <p>JSON 데이터 로딩 중...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 🎬 오른쪽: 메인 애니메이션 영역 */}
                        <div className="visualization-modal-scrollbar" style={{
                            background: '#ffffff',
                            padding: '20px',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            maxHeight: 'calc(100vh - 140px)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {isLoading ? (
                                <LoadingAnimation message="JSON 데이터 로딩 중..." code={code} language={language} />
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
                                    <div style={{ fontSize: '64px' }}>🗂️</div>
                                    <h3 style={{ margin: 0, color: '#1e293b' }}>JSON 기반 시각화 준비 중...</h3>
                                    <p style={{ margin: 0, color: '#64748b' }}>패턴 매칭 및 데이터 로딩 중</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

export default VisualizationModal;