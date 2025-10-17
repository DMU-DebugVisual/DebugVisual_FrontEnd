import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import AnimationFactory from './AnimationFactory';
// 🆕 API 서비스 import
import { ApiService } from './services/ApiService';
import normalizeDVFlowData from './utils/dvflowParser';

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

// 🎨 다크모드/라이트모드 테마 객체
const getTheme = (isDark) => ({
    colors: {
        primary: isDark ? '#a78bfa' : '#8b5cf6',
        primaryHover: isDark ? '#8b5cf6' : '#7c3aed',
        bg: isDark ? '#0f172a' : '#f1f5f9',
        card: isDark ? '#1e293b' : '#ffffff',
        cardSecondary: isDark ? '#334155' : '#f8fafc',
        border: isDark ? '#475569' : '#e2e8f0',
        text: isDark ? '#f1f5f9' : '#1e293b',
        textLight: isDark ? '#94a3b8' : '#64748b',
        success: isDark ? '#22c55e' : '#10b981',
        warning: isDark ? '#fbbf24' : '#f59e0b',
        danger: isDark ? '#f87171' : '#ef4444',
        info: isDark ? '#60a5fa' : '#3b82f6'
    },
    gradients: {
        primary: isDark
            ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
            : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
        header: isDark
            ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        success: isDark
            ? 'linear-gradient(135deg, #065f46 0%, #047857 100%)'
            : 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
        warning: isDark
            ? 'linear-gradient(135deg, #92400e 0%, #b45309 100%)'
            : 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
        info: isDark
            ? 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)'
            : 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)'
    }
});

// 컨트롤 버튼 컴포넌트
const ControlButton = ({ onClick, disabled, variant = 'default', children, title, theme }) => {
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
                return { ...baseStyle, background: theme.colors.success, color: 'white' };
            case 'playing':
                return { ...baseStyle, background: theme.colors.warning, color: 'white' };
            default:
                return {
                    ...baseStyle,
                    background: theme.colors.card,
                    color: theme.colors.text,
                    border: `1px solid ${theme.colors.border}`,
                    boxShadow: `0 2px 4px ${theme.colors.border}40`
                };
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
                                   isPlaying, currentStep, totalSteps, speed,
                                   onPlay, onPause, onStepBack, onStepForward, onReset, onSpeedChange, onStepChange,
                                   theme
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
                theme={theme}
            >
                {isPlaying ? '⏸' : '▶'} {isPlaying ? '일시' : '시작'}
            </ControlButton>

            <ControlButton
                onClick={onStepBack}
                disabled={currentStep === 0 || totalSteps === 0}
                title="이전 단계"
                theme={theme}
            >
                ⏪ 이전
            </ControlButton>

            <ControlButton
                onClick={onStepForward}
                disabled={currentStep >= totalSteps - 1 || totalSteps === 0}
                title="다음 단계"
                theme={theme}
            >
                ⏩ 다음
            </ControlButton>

            <ControlButton
                onClick={onReset}
                disabled={totalSteps === 0}
                title="처음으로"
                theme={theme}
            >
                ⏮ 처음
            </ControlButton>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
                padding: '8px 12px',
                borderRadius: '8px',
                height: '36px',
                boxShadow: `0 2px 4px ${theme.colors.border}40`
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
                        outline: 'none',
                        color: theme.colors.primary
                    }}
                />
                <span style={{ fontSize: '12px', color: theme.colors.textLight }}>/ {totalSteps}</span>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: theme.colors.card,
                border: `1px solid ${theme.colors.border}`,
                padding: '6px 10px',
                borderRadius: '8px',
                height: '36px',
                boxShadow: `0 2px 4px ${theme.colors.border}40`
            }}>
                <span style={{ fontSize: '11px', color: theme.colors.textLight, marginRight: '4px' }}>속도:</span>
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
                            background: speed === speedValue ? theme.colors.primary : 'transparent',
                            color: speed === speedValue ? 'white' : theme.colors.textLight,
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
const LoadingAnimation = ({ message = "시각화 데이터 로딩 중...", code, language, theme }) => (
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
            border: `3px solid ${theme.colors.border}`,
            borderTop: `3px solid ${theme.colors.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
        }} />
        <h3 style={{ margin: 0, color: theme.colors.text, fontSize: '18px', fontWeight: '600' }}>{message}</h3>
        <p style={{ margin: 0, color: theme.colors.textLight, fontSize: '14px' }}>데이터 처리 중입니다</p>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
            <span style={{
                fontSize: '12px',
                padding: '4px 8px',
                background: theme.colors.cardSecondary,
                borderRadius: '6px',
                color: theme.colors.textLight,
                border: `1px solid ${theme.colors.border}`
            }}>
                언어: {language}
            </span>
            <span style={{
                fontSize: '12px',
                padding: '4px 8px',
                background: theme.colors.cardSecondary,
                borderRadius: '6px',
                color: theme.colors.textLight,
                border: `1px solid ${theme.colors.border}`
            }}>
                코드 길이: {code?.length || 0}자
            </span>
        </div>
    </div>
);

// 에러 컴포넌트
const ErrorDisplay = ({ error, onRetry, theme }) => (
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
        <h3 style={{ margin: 0, color: theme.colors.text, fontSize: '18px', fontWeight: '600' }}>시각화 데이터 로드 실패</h3>
        <p style={{
            margin: 0,
            color: theme.colors.textLight,
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
                backgroundColor: theme.colors.danger,
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 24px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = theme.colors.danger + '88'}
            onMouseOut={(e) => e.target.style.backgroundColor = theme.colors.danger}
        >
            🔄 다시 시도
        </button>
    </div>
);

// 애니메이션 디스플레이 컴포넌트
const AnimationDisplay = ({ data, currentStep, totalSteps, animationType, isPlaying, theme }) => {
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
    const isImplemented = AnimationFactory?.isImplemented ? AnimationFactory.isImplemented(animationType) : false;

    // 데이터 소스 표시
    const getDataSourceBadge = () => {
        const dataSource = data?._dataSource || 'unknown';
        const badges = {
            'api': { color: theme.colors.success, text: '🌐 API', bg: `${theme.colors.success}20` },
            'json': { color: theme.colors.warning, text: '🗂️ JSON', bg: `${theme.colors.warning}20` },
            'api+json': { color: theme.colors.primary, text: '🔗 하이브리드', bg: `${theme.colors.primary}20` },
            'api-only': { color: theme.colors.info, text: '🌐 API만', bg: `${theme.colors.info}20` },
            'preloaded-json': { color: theme.colors.success, text: '🗂️ 예제', bg: `${theme.colors.success}20` },
            'unknown': { color: theme.colors.textLight, text: '❓ 미확인', bg: `${theme.colors.textLight}20` }
        };

        const badge = badges[dataSource] || badges['unknown'];

        return (
            <span style={{
                background: badge.bg,
                color: badge.color,
                fontSize: '12px',
                padding: '2px 8px',
                borderRadius: '12px',
                border: `1px solid ${badge.color}30`
            }}>
                {badge.text}
            </span>
        );
    };

    // 애니메이션 컴포넌트 생성
    let animationComponent = null;

    try {
        if (AnimationFactory?.createAnimation) {
            console.log('🏭 AnimationFactory.createAnimation 호출 중...');
            animationComponent = AnimationFactory.createAnimation(animationType, {
                data,
                currentStep,
                totalSteps,
                isPlaying,
                zoomLevel: 1,
                theme // 테마 전달
            });
            console.log('✅ 애니메이션 컴포넌트 생성됨:', animationComponent);
        } else {
            console.warn('⚠️ AnimationFactory가 없거나 createAnimation 메서드가 없습니다');
        }
    } catch (error) {
        console.error('❌ 애니메이션 컴포넌트 생성 실패:', error);
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '500px',
            background: theme.colors.card,
            borderRadius: '12px',
            border: isImplemented
                ? `2px solid ${theme.colors.success}`
                : `2px solid ${theme.colors.warning}`,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* 애니메이션 헤더 */}
            <div style={{
                padding: '20px 24px',
                background: isImplemented ? theme.gradients.success : theme.gradients.warning,
                borderBottom: `1px solid ${theme.colors.border}`,
                flexShrink: 0
            }}>
                <h3 style={{
                    margin: '0 0 8px 0',
                    color: theme.colors.text,
                    fontSize: '18px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    {icon} {name} 시각화
                    {getDataSourceBadge()}
                    {isImplemented && <span style={{
                        background: theme.colors.success,
                        color: 'white',
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '12px'
                    }}>✅ 활성화</span>}
                    {!isImplemented && <span style={{
                        background: theme.colors.warning,
                        color: 'white',
                        fontSize: '12px',
                        padding: '2px 8px',
                        borderRadius: '12px'
                    }}>🚧 개발중</span>}
                </h3>
                <p style={{
                    margin: 0,
                    color: theme.colors.textLight,
                    fontSize: '14px'
                }}>
                    현재 {currentStep + 1}단계 / 총 {totalSteps}단계
                </p>
            </div>

            {/* 메인 애니메이션 영역 */}
            <div style={{
                flex: 1,
                padding: '24px',
                background: theme.colors.bg,
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
                        color: theme.colors.danger,
                        padding: '40px',
                        borderRadius: '8px',
                        background: `${theme.colors.danger}10`,
                        border: `1px solid ${theme.colors.danger}30`,
                        minHeight: '300px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        maxWidth: '500px'
                    }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
                        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', color: theme.colors.text }}>애니메이션 준비 중</h3>
                        <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: theme.colors.textLight }}>
                            {isImplemented ?
                                'AnimationFactory에서 컴포넌트를 로딩 중입니다.' :
                                '이 알고리즘 타입은 아직 개발 중입니다.'
                            }
                        </p>
                        {data?._dataSource && (
                            <div style={{ marginTop: '12px' }}>
                                <span style={{ fontSize: '12px', color: theme.colors.textLight }}>데이터 소스: </span>
                                {getDataSourceBadge()}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// 정보 패널 컴포넌트
const InfoPanel = ({ data, currentStep, totalSteps, animationType, theme }) => {
    const InfoCard = ({ title, icon, children }) => (
        <div style={{
            background: theme.colors.card,
            borderRadius: '12px',
            border: `1px solid ${theme.colors.border}`,
            padding: '16px',
            boxShadow: `0 2px 8px ${theme.colors.border}40`
        }}>
            <h4 style={{
                fontSize: '15px',
                margin: '0 0 12px 0',
                color: theme.colors.text,
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

    const frames = data?.frames || [];
    const currentFrame = frames[currentStep] || null;
    const event = currentFrame?.event || null;
    const outputs = data?.outputs || [];
    const analysis = data?.analysis || {};
    const opCounts = analysis.opCounts || null;

    const renderArrayChip = (label, arr) => (
        <div style={{
            padding: '6px 8px',
            background: theme.colors.cardSecondary,
            borderRadius: '6px',
            fontSize: '12px',
            color: theme.colors.text,
            border: `1px solid ${theme.colors.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            gap: '8px'
        }}>
            <span style={{ color: theme.colors.textLight }}>{label}</span>
            <span style={{ fontFamily: 'monospace' }}>[{arr.join(', ')}]</span>
        </div>
    );

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
                        color: theme.colors.primary
                    }}>
                        {totalSteps === 0 ? 0 : currentStep + 1}
                    </span>
                    <span style={{ color: theme.colors.textLight }}>/ {totalSteps}</span>
                </div>

                {currentFrame ? (
                    <>
                        {currentFrame.description && (
                            <div style={{
                                padding: '12px',
                                background: theme.colors.cardSecondary,
                                borderRadius: '8px',
                                borderLeft: `4px solid ${theme.colors.primary}`,
                                fontSize: '13px',
                                color: theme.colors.textLight,
                                marginBottom: '8px',
                                lineHeight: '1.4'
                            }}>
                                {currentFrame.description}
                            </div>
                        )}

                        <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            fontSize: '11px'
                        }}>
                            {event?.kind && (
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '999px',
                                    background: `${theme.colors.primary}20`,
                                    color: theme.colors.primary,
                                    fontWeight: '600'
                                }}>
                                    이벤트: {event.kind}
                                </span>
                            )}
                            {event?.loc?.line && (
                                <span style={{
                                    padding: '4px 8px',
                                    borderRadius: '999px',
                                    background: `${theme.colors.info}20`,
                                    color: theme.colors.info,
                                    fontWeight: '600'
                                }}>
                                    � 라인 {event.loc.line}
                                </span>
                            )}
                        </div>

                        {currentFrame.list && currentFrame.list.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                                {renderArrayChip('배열 상태', currentFrame.list)}
                            </div>
                        )}

                        {currentFrame.pointers && Object.keys(currentFrame.pointers).length > 0 && (
                            <div style={{
                                marginTop: '12px',
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'wrap'
                            }}>
                                {Object.entries(currentFrame.pointers)
                                    .filter(([, value]) => value !== null && value !== undefined)
                                    .map(([name, value]) => (
                                        <div key={name} style={{
                                            padding: '6px 10px',
                                            background: `${theme.colors.warning}20`,
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            color: theme.colors.warning,
                                            fontWeight: '600'
                                        }}>
                                            {name.toUpperCase()}: {value}
                                        </div>
                                    ))}
                            </div>
                        )}

                        {currentFrame.highlight?.compare && currentFrame.highlight.compare.length > 0 && (
                            <div style={{
                                marginTop: '12px',
                                padding: '6px 8px',
                                background: `${theme.colors.info}20`,
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: theme.colors.info
                            }}>
                                비교 인덱스: {currentFrame.highlight.compare.join(', ')}
                            </div>
                        )}

                        {currentFrame.highlight?.swap && currentFrame.highlight.swap.length > 0 && (
                            <div style={{
                                marginTop: '6px',
                                padding: '6px 8px',
                                background: `${theme.colors.success}20`,
                                borderRadius: '6px',
                                fontSize: '12px',
                                color: theme.colors.success
                            }}>
                                교환: {currentFrame.highlight.swap.join(' ↔ ')}
                            </div>
                        )}

                        {currentFrame.details?.output && (
                            <div style={{
                                marginTop: '12px',
                                padding: '8px 10px',
                                background: `${theme.colors.info}15`,
                                borderRadius: '6px',
                                border: `1px solid ${theme.colors.info}30`,
                                fontSize: '12px',
                                color: theme.colors.info,
                                whiteSpace: 'pre-wrap'
                            }}>
                                출력: {currentFrame.details.output}
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{
                        padding: '12px',
                        background: `${theme.colors.cardSecondary}`,
                        borderRadius: '8px',
                        color: theme.colors.textLight,
                        fontSize: '13px'
                    }}>
                        표시할 단계가 없습니다.
                    </div>
                )}
            </InfoCard>

            <InfoCard title="시각화 데이터" icon="📊">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                        { label: '알고리즘', value: data?.meta?.algorithmName || 'Unknown' },
                        { label: '애니메이션 타입', value: animationType },
                        { label: '언어', value: data?.lang || 'Unknown' },
                        { label: '입력값', value: data?.input || '없음' },
                        { label: '이벤트 수', value: `${data?.events?.length || 0} 개` },
                        { label: '데이터 소스', value: data?._dataSource || 'unknown' }
                    ].map((item, idx) => (
                        <div key={idx} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            background: theme.colors.cardSecondary,
                            borderRadius: '6px',
                            fontSize: '12px'
                        }}>
                            <span style={{ color: theme.colors.textLight }}>{item.label}</span>
                            <span style={{ fontWeight: '600', color: theme.colors.text }}>{item.value}</span>
                        </div>
                    ))}

                    <div style={{
                        display: 'flex',
                        gap: '8px'
                    }}>
                        <div style={{
                            flex: 1,
                            padding: '6px 8px',
                            background: `${theme.colors.warning}20`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            border: `1px solid ${theme.colors.warning}40`
                        }}>
                            ⏰ 시간복잡도
                            <div style={{
                                fontFamily: 'monospace',
                                fontWeight: '600',
                                marginTop: '2px',
                                color: theme.colors.warning
                            }}>
                                {analysis.timeComplexity || '알 수 없음'}
                            </div>
                        </div>
                        <div style={{
                            flex: 1,
                            padding: '6px 8px',
                            background: `${theme.colors.info}20`,
                            borderRadius: '6px',
                            fontSize: '12px',
                            border: `1px solid ${theme.colors.info}40`
                        }}>
                            💾 공간복잡도
                            <div style={{
                                fontFamily: 'monospace',
                                fontWeight: '600',
                                marginTop: '2px',
                                color: theme.colors.info
                            }}>
                                {analysis.spaceComplexity || '알 수 없음'}
                            </div>
                        </div>
                    </div>

                    {opCounts && (
                        <div style={{
                            marginTop: '8px',
                            padding: '8px',
                            background: `${theme.colors.cardSecondary}`,
                            borderRadius: '6px',
                            border: `1px dashed ${theme.colors.border}`,
                            fontSize: '12px',
                            color: theme.colors.text
                        }}>
                            <div style={{ fontWeight: '600', marginBottom: '6px' }}>연산 카운트</div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                                gap: '6px'
                            }}>
                                {Object.entries(opCounts).map(([key, value]) => (
                                    <div key={key} style={{
                                        padding: '6px',
                                        background: theme.colors.card,
                                        borderRadius: '6px',
                                        border: `1px solid ${theme.colors.border}`,
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ color: theme.colors.textLight }}>{key}</div>
                                        <div style={{ fontWeight: '600' }}>{value}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </InfoCard>

            {outputs.length > 0 && (
                <InfoCard title="출력 로그" icon="�">
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        {outputs.map((line, idx) => (
                            <div key={idx} style={{
                                padding: '8px',
                                background: `${theme.colors.info}15`,
                                borderRadius: '6px',
                                border: `1px solid ${theme.colors.info}30`,
                                color: theme.colors.info,
                                fontSize: '12px',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {line}
                            </div>
                        ))}
                    </div>
                </InfoCard>
            )}
        </div>
    );
};

// 🆕 메인 모달 컴포넌트 - isDark prop 추가
const VisualizationModal = ({
                                isOpen,
                                onClose,
                                code,
                                language,
                                input,
                                preloadedJsonData = null,
                                isJsonFile = false,
                                isDark = false // 🎨 다크모드 상태 받기
                            }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [animationType, setAnimationType] = useState('variables');
    const [totalSteps, setTotalSteps] = useState(0);

    const [apiMode, setApiMode] = useState(true); // API 모드 토글
    const animationControls = useAnimationControls(totalSteps);

    // 🎨 테마 가져오기
    const theme = getTheme(isDark);

    // 🆕 시각화 데이터 가져오기 함수 - JSON 직접 지원
    const fetchVisualizationData = async () => {
        if (!code?.trim()) {
            setError('코드가 비어있습니다.');
            return;
        }

        // 🗂️ JSON 데이터가 미리 로드된 경우 (예제 파일) - API 호출 없이 즉시 처리
        if (preloadedJsonData) {
            console.log('🗂️ 미리 로드된 JSON 데이터 사용 (API 호출 안함):', preloadedJsonData);

            setIsLoading(true);
            setError(null);

            try {
                // 약간의 딜레이로 로딩 효과만 제공 (API 호출은 하지 않음)
                await new Promise(resolve => setTimeout(resolve, 200));

                const jsonDataWithSource = {
                    ...preloadedJsonData,
                    _dataSource: 'preloaded-json'
                };

                const { data: normalizedData, animationType: detectedType, totalSteps: framesCount } = normalizeDVFlowData(jsonDataWithSource);

                setData(normalizedData);
                setTotalSteps(framesCount);
                animationControls.reset();
                setAnimationType(detectedType);

                console.log('✅ JSON 직접 로드 완료 (API 미사용):', {
                    algorithm: detectedType,
                    frames: framesCount,
                    events: normalizedData.events?.length || 0,
                    dataSource: 'preloaded-json'
                });

            } catch (err) {
                console.error('❌ JSON 데이터 처리 실패:', err);
                setError(err.message || 'JSON 데이터를 처리할 수 없습니다.');
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // 📄 JSON 파일인 경우 에디터에서 JSON 파싱해서 사용
        if (isJsonFile && !preloadedJsonData) {
            console.log('📄 JSON 파일 - 에디터 내용 파싱 시작');

            setIsLoading(true);
            setError(null);

            try {
                // 약간의 딜레이로 로딩 효과 제공
                await new Promise(resolve => setTimeout(resolve, 200));

                // 에디터의 JSON 텍스트 파싱
                const parsedJson = JSON.parse(code);

                const jsonDataWithSource = {
                    ...parsedJson,
                    _dataSource: 'editor-json'
                };

                const { data: normalizedData, animationType: detectedType, totalSteps: framesCount } = normalizeDVFlowData(jsonDataWithSource);

                setData(normalizedData);
                setTotalSteps(framesCount);
                animationControls.reset();
                setAnimationType(detectedType);

                console.log('✅ 에디터 JSON 파싱 완료:', {
                    algorithm: detectedType,
                    frames: framesCount,
                    events: normalizedData.events?.length || 0,
                    dataSource: 'editor-json'
                });

            } catch (err) {
                console.error('❌ JSON 파싱 실패:', err);
                setError(`JSON 파싱 오류: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // 🌐 일반 코드인 경우만 API 호출
        console.log('🌐 일반 코드 - API 호출 시작');
        setIsLoading(true);
        setError(null);

        try {
            console.log('🚀 API를 통한 시각화 데이터 요청 시작');

            // API 서비스 사용 (하이브리드 모드)
            const visualizationData = await ApiService.requestVisualization(code, language, input);

            const { data: normalizedData, animationType: detectedType, totalSteps: framesCount } = normalizeDVFlowData(visualizationData);

            setData(normalizedData);
            setTotalSteps(framesCount);
            animationControls.reset();

            const finalType = detectedType || ApiService.detectAlgorithmType(code);
            setAnimationType(finalType);

            console.log('✅ API 시각화 데이터 로드 완료:', {
                algorithm: finalType,
                frames: framesCount,
                events: normalizedData.events?.length || 0,
                dataSource: normalizedData._dataSource || visualizationData._dataSource || 'api'
            });

        } catch (err) {
            console.error('❌ API 시각화 데이터 로드 실패:', err);
            setError(err.message || '시각화 데이터를 생성할 수 없습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleApiMode = () => {
        // JSON 데이터가 미리 로드된 경우 API 모드 변경 불가
        if (preloadedJsonData) {
            alert('예제 파일은 JSON 데이터를 직접 사용하므로 API 모드를 변경할 수 없습니다.');
            return;
        }

        const newMode = !apiMode;
        setApiMode(newMode);

        // ApiService 모드 변경
        if (typeof ApiService.setApiMode === 'function') {
            ApiService.setApiMode(newMode);
        }

        console.log(`🎛️ API 모드 변경: ${newMode ? 'API 우선 (하이브리드)' : 'JSON 전용'}`);

        // 즉시 데이터 새로고침 - 새로운 모드로 다시 요청
        if (data) {
            // 현재 상태 초기화
            setData(null);
            setError(null);
            setTotalSteps(0);
            animationControls.reset();

            // 새 모드로 데이터 요청
            setTimeout(() => {
                fetchVisualizationData();
            }, 100);
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
    }, [isOpen, preloadedJsonData]); // preloadedJsonData 의존성 추가

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

    // 🎨 데이터 소스에 따른 UI 표시
    const getDataSourceInfo = () => {
        if (preloadedJsonData) {
            return {
                icon: '🗂️',
                text: 'JSON 직접',
                color: theme.colors.success,
                bg: `${theme.colors.success}20`,
                description: '미리 준비된 예제 데이터'
            };
        }

        const dataSource = data?._dataSource || 'unknown';
        const sourceMap = {
            'api': { icon: '🌐', text: 'API', color: theme.colors.success, bg: `${theme.colors.success}20`, description: '실시간 API 응답' },
            'json': { icon: '🗂️', text: 'JSON Mock', color: theme.colors.warning, bg: `${theme.colors.warning}20`, description: 'Mock 데이터' },
            'api+json': { icon: '🔗', text: '하이브리드', color: theme.colors.primary, bg: `${theme.colors.primary}20`, description: 'API + JSON 병합' },
            'api-only': { icon: '🌐', text: 'API만', color: theme.colors.info, bg: `${theme.colors.info}20`, description: 'API 응답만' },
            'unknown': { icon: '❓', text: '미확인', color: theme.colors.textLight, bg: `${theme.colors.textLight}20`, description: '알 수 없음' }
        };

        return sourceMap[dataSource] || sourceMap['unknown'];
    };

    const dataSourceInfo = getDataSourceInfo();

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
            background: ${theme.colors.cardSecondary};
            border-radius: 4px;
        }
        .visualization-modal-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme.colors.border};
            border-radius: 4px;
            transition: background 0.2s;
        }
        .visualization-modal-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme.colors.textLight};
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
                        background: theme.colors.card,
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
                        border: `1px solid ${theme.colors.border}`
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 모달 헤더 */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px 24px',
                        background: theme.gradients.primary,
                        color: 'white',
                        borderRadius: '16px 16px 0 0',
                        flexShrink: 0
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <span style={{fontSize: '24px'}}>{dataSourceInfo.icon}</span>
                            <h2 style={{margin: 0, fontSize: '20px', fontWeight: '600'}}>
                                {preloadedJsonData ? 'JSON 예제 시각화' : 'API 연동 코드 시각화'}
                            </h2>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '500'
                            }}>
                                {language}
                            </div>
                            {/* 데이터 소스 상태 표시 */}
                            {data && (
                                <div style={{
                                    background: dataSourceInfo.bg,
                                    color: dataSourceInfo.color,
                                    padding: '4px 12px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    border: `1px solid ${dataSourceInfo.color}30`
                                }} title={dataSourceInfo.description}>
                                    {dataSourceInfo.text}
                                </div>
                            )}
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px'
                        }}>
                            {/* 애니메이션 컨트롤 버튼들 */}
                            {data && !isLoading && (
                                <>
                                    {/* API 모드 토글 (예제가 아닌 경우에만 표시) */}
                                    {!preloadedJsonData && (
                                        <button
                                            onClick={toggleApiMode}
                                            style={{
                                                background: apiMode
                                                    ? `linear-gradient(135deg, ${theme.colors.success}, ${theme.colors.success}88)`
                                                    : `linear-gradient(135deg, ${theme.colors.warning}, ${theme.colors.warning}88)`,
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
                                    )}

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
                                        theme={theme}
                                    />

                                    {/* 새로고침 버튼 (예제가 아닌 경우에만 표시) */}
                                    {!preloadedJsonData && (
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
                                                opacity: isLoading ? 0.5 : 1,
                                                transition: 'all 0.2s'
                                            }}
                                            title="데이터 새로고침"
                                        >
                                            🔄
                                        </button>
                                    )}
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
                                    fontSize: '16px',
                                    transition: 'all 0.2s'
                                }}
                                title="모달 닫기"
                                onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                                onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.2)'}
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* 2열 레이아웃 - 왼쪽 정보패널 + 오른쪽 애니메이션 */}
                    <div style={{
                        flex: 1,
                        background: theme.colors.bg,
                        display: 'grid',
                        gridTemplateColumns: '280px 1fr',
                        gap: '0',
                        overflow: 'hidden',
                        maxHeight: 'calc(100vh - 140px)'
                    }}>
                        {/* 왼쪽: 정보 패널 */}
                        <div className="visualization-modal-scrollbar" style={{
                            background: theme.colors.card,
                            borderRight: `1px solid ${theme.colors.border}`,
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
                                    theme={theme}
                                />
                            ) : (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    height: '100%',
                                    textAlign: 'center',
                                    color: theme.colors.textLight
                                }}>
                                    <div>
                                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                                            {preloadedJsonData ? '🗂️' : '🌐'}
                                        </div>
                                        <p>{preloadedJsonData ? 'JSON 데이터 로딩 중...' : 'API 데이터 로딩 중...'}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 오른쪽: 메인 애니메이션 영역 */}
                        <div className="visualization-modal-scrollbar" style={{
                            background: theme.colors.card,
                            padding: '20px',
                            overflowY: 'auto',
                            overflowX: 'hidden',
                            maxHeight: 'calc(100vh - 140px)',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            {isLoading ? (
                                <LoadingAnimation
                                    message={preloadedJsonData ? "JSON 예제 데이터 로딩 중..." : "API 시각화 데이터 로딩 중..."}
                                    code={code}
                                    language={language}
                                    theme={theme}
                                />
                            ) : error ? (
                                <ErrorDisplay error={error} onRetry={fetchVisualizationData} theme={theme} />
                            ) : data ? (
                                <AnimationDisplay
                                    data={data}
                                    currentStep={animationControls.currentStep}
                                    totalSteps={totalSteps}
                                    animationType={animationType}
                                    isPlaying={animationControls.isPlaying}
                                    theme={theme}
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
                                    <div style={{ fontSize: '64px' }}>{dataSourceInfo.icon}</div>
                                    <h3 style={{ margin: 0, color: theme.colors.text }}>
                                        {preloadedJsonData ? 'JSON 예제 시각화 준비 중...' : '하이브리드 시각화 준비 중...'}
                                    </h3>
                                    <p style={{ margin: 0, color: theme.colors.textLight }}>
                                        {preloadedJsonData ? 'JSON 데이터 처리 중' : 'API 연동 및 데이터 처리 중'}
                                    </p>
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