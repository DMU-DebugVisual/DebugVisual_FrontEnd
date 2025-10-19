// VisualizationModal.jsx - 개선 버전 (DV-Flow v1.3 완전 대응)
import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import AnimationFactory from './AnimationFactory';
import { ApiService } from './services/ApiService';

// 🎨 테마
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
    }
});

// 🎮 애니메이션 컨트롤 훅
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
            if (intervalId) clearInterval(intervalId);
        };
    }, [isPlaying, speed, totalSteps]);

    return { isPlaying, currentStep, speed, play, pause, stepBack, stepForward, reset, goToStep, setSpeed };
};

// 🔍 확대/축소 훅
const useZoomControls = () => {
    const [zoom, setZoom] = useState(100);
    const MIN_ZOOM = 50;
    const MAX_ZOOM = 200;
    const ZOOM_STEP = 25;

    const zoomIn = useCallback(() => {
        setZoom(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
    }, []);

    const zoomOut = useCallback(() => {
        setZoom(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
    }, []);

    const resetZoom = useCallback(() => {
        setZoom(100);
    }, []);

    return { zoom, zoomIn, zoomOut, resetZoom, MIN_ZOOM, MAX_ZOOM };
};

// 🎛️ 컨트롤 버튼
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
            case 'zoom':
                return { ...baseStyle, background: theme.colors.info, color: 'white', minWidth: '40px' };
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
        <button style={getButtonStyle()} onClick={onClick} disabled={disabled} title={title}>
            {children}
        </button>
    );
};

// 🎮 시각화 컨트롤
const VisualizationControls = ({
                                   isPlaying, currentStep, totalSteps, speed, zoom,
                                   onPlay, onPause, onStepBack, onStepForward, onReset, onSpeedChange, onStepChange,
                                   onZoomIn, onZoomOut, onZoomReset,
                                   theme
                               }) => {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* 재생 컨트롤 */}
            <ControlButton
                onClick={isPlaying ? onPause : onPlay}
                disabled={totalSteps === 0}
                variant={isPlaying ? 'playing' : 'play'}
                title={isPlaying ? '일시정지' : '재생'}
                theme={theme}
            >
                {isPlaying ? '⏸' : '▶'} {isPlaying ? '일시' : '시작'}
            </ControlButton>

            <ControlButton onClick={onStepBack} disabled={currentStep === 0 || totalSteps === 0} title="이전 단계" theme={theme}>
                ⏪ 이전
            </ControlButton>

            <ControlButton onClick={onStepForward} disabled={currentStep >= totalSteps - 1 || totalSteps === 0} title="다음 단계" theme={theme}>
                ⏩ 다음
            </ControlButton>

            <ControlButton onClick={onReset} disabled={totalSteps === 0} title="처음으로" theme={theme}>
                ⏮ 처음
            </ControlButton>

            {/* 단계 표시 */}
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

            {/* 속도 컨트롤 */}
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

            {/* 🔍 확대/축소 컨트롤 */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: theme.colors.card,
                border: `2px solid ${theme.colors.info}`,
                padding: '6px 10px',
                borderRadius: '8px',
                height: '36px',
                boxShadow: `0 2px 4px ${theme.colors.info}40`
            }}>
                <ControlButton
                    onClick={onZoomOut}
                    disabled={zoom <= 50}
                    variant="zoom"
                    title="축소 (Ctrl + 휠 아래)"
                    theme={theme}
                >
                    🔍-
                </ControlButton>

                <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: theme.colors.info,
                    minWidth: '50px',
                    textAlign: 'center'
                }}>
                    {zoom}%
                </span>

                <ControlButton
                    onClick={onZoomIn}
                    disabled={zoom >= 200}
                    variant="zoom"
                    title="확대 (Ctrl + 휠 위)"
                    theme={theme}
                >
                    🔍+
                </ControlButton>

                <button
                    onClick={onZoomReset}
                    style={{
                        padding: '4px 8px',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        background: zoom === 100 ? theme.colors.info : 'transparent',
                        color: zoom === 100 ? 'white' : theme.colors.textLight,
                        minWidth: '32px',
                        height: '24px',
                        transition: 'all 0.2s'
                    }}
                    title="100%로 리셋"
                >
                    100%
                </button>
            </div>
        </div>
    );
};

// 📊 정보 패널
const InfoPanel = ({ data, currentStep, totalSteps, theme }) => {
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

    const currentEvent = data?.events?.[currentStep];
    const analysis = data?.analysis ?? null;
    const complexityItems = [
        { label: '시간 복잡도', value: analysis?.timeComplexity || '-' },
        { label: '공간 복잡도', value: analysis?.spaceComplexity || '-' }
    ];
    const hasComplexityData = complexityItems.some(item => item.value && item.value !== '-');

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            height: '100%',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 160px)',
            paddingRight: '8px'
        }}>
            <InfoCard title="현재 단계" icon="🎯">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: theme.colors.primary }}>
                        {currentStep + 1}
                    </span>
                    <span style={{ color: theme.colors.textLight }}>/ {totalSteps}</span>
                </div>

                {currentEvent && (
                    <div style={{
                        padding: '12px',
                        background: theme.colors.cardSecondary,
                        borderRadius: '8px',
                        borderLeft: `4px solid ${theme.colors.primary}`,
                        fontSize: '13px',
                        color: theme.colors.textLight,
                        lineHeight: '1.4'
                    }}>
                        <strong>이벤트:</strong> {currentEvent.kind}
                    </div>
                )}
            </InfoCard>

            <InfoCard title="시각화 정보" icon="📊">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {[
                        { label: '이벤트 수', value: `${data?.events?.length || 0}개` },
                        { label: '현재 이벤트', value: currentEvent?.kind || '-' }
                    ].map((item, index) => (
                        <div key={index} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            background: theme.colors.cardSecondary,
                            borderRadius: '6px',
                            fontSize: '12px'
                        }}>
                            <span style={{ color: theme.colors.textLight }}>{item.label}:</span>
                            <span style={{ fontWeight: '600', color: theme.colors.text }}>{item.value}</span>
                        </div>
                    ))}
                </div>
            </InfoCard>

            {hasComplexityData && (
                <InfoCard title="알고리즘 복잡도" icon="🧠">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {complexityItems.map((item, index) => (
                            <div key={index} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '6px 8px',
                                background: theme.colors.cardSecondary,
                                borderRadius: '6px',
                                fontSize: '12px'
                            }}>
                                <span style={{ color: theme.colors.textLight }}>{item.label}:</span>
                                <span style={{ fontWeight: '600', color: theme.colors.text }}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </InfoCard>
            )}
        </div>
    );
};

// 🎬 애니메이션 디스플레이
const AnimationDisplay = ({ data, currentStep, totalSteps, zoom, animationType, isPlaying, theme }) => {
    const containerRef = useRef(null);

    console.log('🎬 AnimationDisplay 렌더링:', {
        animationType,
        currentStep,
        totalSteps,
        hasData: !!data,
        eventsCount: data?.events?.length || 0,
        zoom
    });

    const getAnimationInfo = (type) => {
        const typeMap = {
            'bubble-sort': { icon: '📊', name: '버블 정렬' },
            'graph': { icon: '🕸️', name: '그래프' },
            'linked-list': { icon: '🔗', name: '링크드 리스트' },
            'binary-tree': { icon: '🌲', name: '이진 트리' },
            'heap': { icon: '🔺', name: '힙' },
            'recursion': { icon: '🌳', name: '재귀' }
        };
        return typeMap[type] || { icon: '🎬', name: '알고리즘 시각화' };
    };

    const { icon, name } = getAnimationInfo(animationType);
    const isImplemented = AnimationFactory?.isImplemented ? AnimationFactory.isImplemented(animationType) : false;

    let animationComponent = null;

    try {
        if (AnimationFactory?.createAnimation) {
            console.log('� AnimationFactory.createAnimation 호출...');
            animationComponent = AnimationFactory.createAnimation(animationType, {
                data,
                currentStep,
                totalSteps,
                isPlaying,
                theme
            });
            console.log('✅ 애니메이션 컴포넌트 생성됨');
        }
    } catch (error) {
        console.error('❌ 애니메이션 생성 실패:', error);
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* 메인 영역 (스크롤 가능) */}
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    overflowY: 'auto',
                    overflowX: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: animationComponent ? 'flex-start' : 'center',
                    minHeight: 0,
                    width: '100%'
                }}
                className="visualization-scrollbar"
            >
                {/* 확대/축소 적용 래퍼 */}
                <div style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top left',
                    transition: 'transform 0.3s ease-out',
                    minWidth: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    {animationComponent ? (
                        <div style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}>
                            {animationComponent}
                        </div>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            padding: '40px',
                            borderRadius: '8px',
                            background: `${theme.colors.warning}10`,
                            border: `1px solid ${theme.colors.warning}30`
                        }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚙️</div>
                            <h3 style={{ margin: '0 0 12px 0', color: theme.colors.text }}>애니메이션 준비 중</h3>
                            <p style={{ margin: 0, color: theme.colors.textLight }}>
                                {isImplemented ? 'AnimationFactory에서 컴포넌트 로딩 중...' : '이 알고리즘은 아직 개발 중입니다.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// 🔍 개선된 알고리즘 감지 로직
const detectAlgorithmFromEvents = (events) => {
    if (!events || events.length === 0) return 'variables';

    console.log('🔍 알고리즘 감지 시작, 이벤트 수:', events.length);

    // 🎯 1순위: viz.type 직접 확인 (가장 신뢰도 높음!)
    for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if (event.viz?.type) {
            const vizType = event.viz.type.toLowerCase();

            console.log(`✅ viz.type 발견: "${vizType}" (event ${i})`);

            // viz.type 매핑
            if (vizType === 'heap') return 'heap';
            if (vizType === 'bst' || vizType === 'tree') return 'binary-tree';
            if (vizType === 'graph') return 'graph';
            if (vizType === 'list' || vizType === 'linkedlist') return 'linked-list';
        }
    }

    // 🎯 2순위: target 기반 감지 (우선순위 중요!)

    // 2-1. Heap 먼저 체크 (tree보다 우선!)
    const heapEvent = events.find(e =>
        e.kind === 'ds_op' &&
        e.target?.toLowerCase().includes('heap')
    );
    if (heapEvent) {
        console.log('✅ Heap target 감지:', heapEvent.target);
        return 'heap';
    }

    // 2-2. 링크드 리스트
    const listEvent = events.find(e =>
        e.kind === 'ds_op' &&
        e.target &&
        (e.target.toLowerCase().includes('list') ||
            e.target.toLowerCase().includes('linkedlist') ||
            e.target.toLowerCase().includes('node'))
    );
    if (listEvent) {
        console.log('✅ LinkedList target 감지:', listEvent.target);
        return 'linked-list';
    }

    // 2-3. 그래프
    const graphEvent = events.find(e =>
        e.kind === 'ds_op' &&
        e.target &&
        (e.target.toLowerCase().includes('graph') ||
            e.target.toLowerCase().includes('adj'))
    );
    if (graphEvent) {
        console.log('✅ Graph target 감지:', graphEvent.target);
        return 'graph';
    }

    // 2-4. 트리 (heap 체크 이후!)
    const treeEvent = events.find(e =>
        e.kind === 'ds_op' &&
        e.target &&
        (e.target.toLowerCase().includes('tree') ||
            e.target.toLowerCase().includes('bst'))
    );
    if (treeEvent) {
        console.log('✅ BinaryTree target 감지:', treeEvent.target);
        return 'binary-tree';
    }

    // 🎯 3순위: 재귀 감지 (엄격하게)
    const recursionEvents = events.filter(e =>
        e.kind === 'call' && e.viz?.recursionDepth !== undefined
    );
    if (recursionEvents.length > 0) {
        console.log('✅ 재귀 패턴 감지 (recursionDepth):', recursionEvents.length);
        return 'recursion';
    }

    // 보조: 함수명 기반 재귀 감지
    const recursiveFunctions = ['fib', 'fibonacci', 'factorial', 'hanoi', 'tower'];
    const recursiveCallEvents = events.filter(e =>
        e.kind === 'call' &&
        recursiveFunctions.some(fn => e.fn?.toLowerCase().includes(fn))
    );
    if (recursiveCallEvents.length > 3) {
        console.log('✅ 재귀 패턴 감지 (함수명):', recursiveCallEvents[0].fn);
        return 'recursion';
    }

    // 🎯 4순위: 정렬 감지
    const hasCompare = events.some(e => e.kind === 'compare');
    const hasSwap = events.some(e => e.kind === 'swap');

    if (hasCompare && hasSwap) {
        console.log('✅ 정렬 패턴 감지 (compare + swap)');

        // 정렬 알고리즘 세부 구분 시도
        const hasPivot = events.some(e => e.viz?.pivot !== undefined);
        if (hasPivot) {
            console.log('  → Quick Sort 감지');
            return 'quick-sort';
        }

        const hasMerge = events.some(e => e.kind === 'merge');
        if (hasMerge) {
            console.log('  → Merge Sort 감지');
            return 'merge-sort';
        }

        return 'bubble-sort'; // 기본 정렬
    }

    // 🎯 기본값
    console.log('⚠️ 특정 알고리즘 패턴 감지 실패 → variables');
    return 'variables';
};

// 📦 메인 모달
const VisualizationModal = ({
                                isOpen,
                                onClose,
                                code,
                                language,
                                input,
                                preloadedJsonData = null,
                                isJsonFile = false,
                                isDark = false
                            }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [animationType, setAnimationType] = useState('bubble-sort');
    const [totalSteps, setTotalSteps] = useState(0);

    const theme = getTheme(isDark);
    const animationControls = useAnimationControls(totalSteps);
    const zoomControls = useZoomControls();
    const animationRef = useRef(null);

    // 📄 데이터 가져오기
    const fetchVisualizationData = async () => {
        console.log('🌐 시각화 데이터 요청:', { hasPreloaded: !!preloadedJsonData, isJsonFile });

        if (!code?.trim() && !preloadedJsonData) {
            setError('코드가 비어있습니다.');
            return;
        }

        // JSON 데이터가 미리 로드된 경우
        if (preloadedJsonData) {
            console.log('🗂️ 미리 로드된 JSON 사용');
            setIsLoading(true);
            setError(null);

            try {
                await new Promise(resolve => setTimeout(resolve, 200));

                setData({ ...preloadedJsonData, _dataSource: 'preloaded-json' });
                const steps = preloadedJsonData.events?.length || 0;
                setTotalSteps(steps);
                animationControls.reset();

                const detectedType = detectAlgorithmFromEvents(preloadedJsonData.events);
                setAnimationType(detectedType);

                console.log('✅ JSON 로드 완료:', { steps, detectedType });
            } catch (err) {
                console.error('❌ JSON 처리 실패:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // JSON 파일인 경우 파싱
        if (isJsonFile) {
            console.log('📄 JSON 파일 파싱');
            setIsLoading(true);
            setError(null);

            try {
                await new Promise(resolve => setTimeout(resolve, 200));
                const parsedJson = JSON.parse(code);

                setData({ ...parsedJson, _dataSource: 'editor-json' });
                const steps = parsedJson.events?.length || 0;
                setTotalSteps(steps);
                animationControls.reset();

                const detectedType = detectAlgorithmFromEvents(parsedJson.events);
                setAnimationType(detectedType);

                console.log('✅ JSON 파싱 완료:', { steps, detectedType });
            } catch (err) {
                console.error('❌ JSON 파싱 실패:', err);
                setError(`JSON 파싱 오류: ${err.message}`);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // 일반 코드 - API 호출
        console.log('🌐 API 호출');
        setIsLoading(true);
        setError(null);

        try {
            const visualizationData = await ApiService.requestVisualization(code, language, input);

            setData(visualizationData);
            const steps = visualizationData.events?.length || 0;
            setTotalSteps(steps);
            animationControls.reset();

            const detectedType = detectAlgorithmFromEvents(visualizationData.events);
            setAnimationType(detectedType);

            console.log('✅ API 데이터 로드 완료:', { steps, detectedType });
        } catch (err) {
            console.error('❌ API 호출 실패:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // 모달 초기화
    useEffect(() => {
        if (isOpen && !data && !isLoading) {
            fetchVisualizationData();
        }
    }, [isOpen, preloadedJsonData]);

    useEffect(() => {
        if (!isOpen) {
            setData(null);
            setError(null);
            setTotalSteps(0);
            animationControls.reset();
        }
    }, [isOpen]);

    // Ctrl + 휠로 확대/축소
    useEffect(() => {
        const handleWheel = (e) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                if (e.deltaY < 0) {
                    zoomControls.zoomIn();
                } else {
                    zoomControls.zoomOut();
                }
            }
        };

        const element = animationRef.current;
        if (element) {
            element.addEventListener('wheel', handleWheel, { passive: false });
            return () => element.removeEventListener('wheel', handleWheel);
        }
    }, [zoomControls]);

    // ESC 키
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const styles = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .visualization-scrollbar::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        .visualization-scrollbar::-webkit-scrollbar-track {
            background: ${theme.colors.cardSecondary};
            border-radius: 4px;
        }
        .visualization-scrollbar::-webkit-scrollbar-thumb {
            background: ${theme.colors.border};
            border-radius: 4px;
            transition: background 0.2s;
        }
        .visualization-scrollbar::-webkit-scrollbar-thumb:hover {
            background: ${theme.colors.textLight};
        }
    `;

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
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        border: `1px solid ${theme.colors.border}`
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* 헤더 */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px 24px',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white',
                        flexShrink: 0
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '24px' }}>🎬</span>
                            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
                                DV-Flow v1.3 시각화
                            </h2>
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.2)',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '12px'
                            }}>
                                {language}
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            {data && !isLoading && (
                                <VisualizationControls
                                    isPlaying={animationControls.isPlaying}
                                    currentStep={animationControls.currentStep}
                                    totalSteps={totalSteps}
                                    speed={animationControls.speed}
                                    zoom={zoomControls.zoom}
                                    onPlay={animationControls.play}
                                    onPause={animationControls.pause}
                                    onStepBack={animationControls.stepBack}
                                    onStepForward={animationControls.stepForward}
                                    onReset={animationControls.reset}
                                    onSpeedChange={animationControls.setSpeed}
                                    onStepChange={animationControls.goToStep}
                                    onZoomIn={zoomControls.zoomIn}
                                    onZoomOut={zoomControls.zoomOut}
                                    onZoomReset={zoomControls.resetZoom}
                                    theme={theme}
                                />
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
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* 2열 레이아웃 */}
                    <div style={{
                        flex: 1,
                        background: theme.colors.bg,
                        display: 'grid',
                        gridTemplateColumns: '280px 1fr',
                        gap: '0',
                        overflow: 'hidden'
                    }}>
                        {/* 왼쪽: 정보 패널 */}
                        <div style={{
                            background: theme.colors.card,
                            borderRight: `1px solid ${theme.colors.border}`,
                            padding: '20px',
                            overflowY: 'auto',
                            minHeight: 0
                        }}
                             className="visualization-scrollbar">
                            {data && <InfoPanel data={data} currentStep={animationControls.currentStep} totalSteps={totalSteps} theme={theme} />}
                        </div>

                        {/* 오른쪽: 애니메이션만 */}
                        <div
                            ref={animationRef}
                            style={{
                                background: theme.colors.card,
                                overflowY: 'auto',
                                overflowX: 'auto',
                                display: 'flex',
                                flexDirection: 'column',
                                minHeight: 0
                            }}
                            className="visualization-scrollbar"
                        >
                            {isLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '20px' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        border: `3px solid ${theme.colors.border}`,
                                        borderTop: `3px solid ${theme.colors.primary}`,
                                        borderRadius: '50%',
                                        animation: 'spin 1s linear infinite'
                                    }} />
                                    <p style={{ color: theme.colors.text }}>데이터 로딩 중...</p>
                                </div>
                            ) : error ? (
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', gap: '20px' }}>
                                    <div style={{ fontSize: '64px' }}>❌</div>
                                    <h3 style={{ color: theme.colors.text }}>오류 발생</h3>
                                    <p style={{ color: theme.colors.textLight }}>{error}</p>
                                    <button onClick={fetchVisualizationData} style={{
                                        background: theme.colors.danger,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '12px 24px',
                                        cursor: 'pointer'
                                    }}>
                                        다시 시도
                                    </button>
                                </div>
                            ) : data ? (
                                <AnimationDisplay
                                    data={data}
                                    currentStep={animationControls.currentStep}
                                    totalSteps={totalSteps}
                                    zoom={zoomControls.zoom}
                                    animationType={animationType}
                                    isPlaying={animationControls.isPlaying}
                                    theme={theme}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

export default VisualizationModal;