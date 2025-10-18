// ./animations/SortAnimation.jsx - DV-Flow v1.3 완전 대응

import React, { useMemo } from 'react';
import './SortAnimation.css';

/**
 * 🎨 DV-Flow v1.3 이벤트 기반 정렬 애니메이션
 */
const SortAnimation = ({ data, currentStep, totalSteps, theme }) => {
    console.log('🎬 SortAnimation 렌더링:', { currentStep, totalSteps, hasData: !!data });

    // 📊 현재 이벤트
    const currentEvent = useMemo(() => {
        if (!data?.events || currentStep >= data.events.length) {
            return null;
        }
        return data.events[currentStep];
    }, [data, currentStep]);

    // 📈 현재 배열 상태 추출
    const currentList = useMemo(() => {
        if (!data?.events) return null;

        // 1️⃣ 초기 배열 찾기 (call 이벤트)
        let initialList = null;
        const callEvent = data.events.find(e => e.kind === 'call' && e.args);
        if (callEvent?.args) {
            const listArg = callEvent.args.find(arg => arg.name === 'list');
            if (listArg?.value) {
                initialList = listArg.value;
            }
        }

        // 2️⃣ 현재까지 viz.list 찾기
        for (let i = currentStep; i >= 0; i--) {
            const event = data.events[i];
            if (event?.viz?.list) {
                console.log(`📊 viz.list 발견:`, event.viz.list);
                return event.viz.list;
            }
        }

        console.log(`📊 초기 배열 사용:`, initialList);
        return initialList;
    }, [data, currentStep]);

    // 🎯 하이라이트할 인덱스
    const highlightIndices = useMemo(() => {
        if (!currentEvent) return [];

        switch (currentEvent.kind) {
            case 'compare':
                if (currentEvent.read) {
                    return currentEvent.read.map(item => {
                        const match = item.ref.match(/\[(\d+)\]/);
                        return match ? parseInt(match[1]) : -1;
                    }).filter(idx => idx >= 0);
                }
                break;

            case 'swap':
                if (currentEvent.indices) {
                    return currentEvent.indices;
                }
                break;

            default:
                return [];
        }

        return [];
    }, [currentEvent]);

    // 🚫 데이터 없을 때
    if (!data?.events || !currentList) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                color: theme?.colors?.textLight || '#64748b',
                padding: '40px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
                <p>정렬 데이터를 불러오는 중...</p>
            </div>
        );
    }

    const maxValue = Math.max(...currentList);
    console.log('📊 현재 배열:', currentList, '최댓값:', maxValue);

    // 🎨 메시지
    const getMessage = () => {
        if (!currentEvent) return '시작 대기 중...';

        switch (currentEvent.kind) {
            case 'compare':
                return `🔍 값 비교: ${currentEvent.read?.[0]?.value} vs ${currentEvent.read?.[1]?.value}`;
            case 'swap':
                return `🔄 값 교환: [${currentEvent.before?.join(', ')}] → [${currentEvent.after?.join(', ')}]`;
            case 'loopIter':
                const loopInfo = currentEvent.loop;
                return `🔁 반복 ${loopInfo?.iter + 1}/${loopInfo?.total || '?'}`;
            case 'call':
                return `📞 함수 호출: ${currentEvent.fn}()`;
            case 'return':
                return `✅ 함수 종료: ${currentEvent.fn}()`;
            default:
                return `📌 ${currentEvent.kind}`;
        }
    };

    return (
        <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 0',
            gap: '20px'
        }}>
            {/* 📢 상태 메시지 */}
            <h3 style={{
                color: theme?.colors?.text || '#1e293b',
                marginBottom: '20px',
                fontWeight: '500'
            }}>
                {getMessage()}
            </h3>

            {/* 📊 막대 그래프 */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                height: '400px',
                width: '100%',
                maxWidth: '900px',
                gap: '8px',
                border: '2px solid #e2e8f0',
                padding: '20px',
                borderRadius: '12px',
                background: '#ffffff'
            }}>
                {currentList.map((value, index) => {
                    const isHighlighted = highlightIndices.includes(index);
                    const barHeight = (value / maxValue) * 100;

                    // 하이라이트 색상
                    let barColor = 'linear-gradient(180deg, #8b5cf6, #a78bfa)'; // 기본 보라색
                    if (isHighlighted) {
                        if (currentEvent?.kind === 'swap') {
                            barColor = 'linear-gradient(180deg, #22c55e, #10b981)'; // 초록색
                        } else if (currentEvent?.kind === 'compare') {
                            barColor = 'linear-gradient(180deg, #fbbf24, #f59e0b)'; // 주황색
                        }
                    }

                    console.log(`막대 ${index}: 값=${value}, 높이=${barHeight}%, 하이라이트=${isHighlighted}`);

                    return (
                        <div key={`bar-${index}-${value}`} style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            flex: 1,
                            maxWidth: '60px'
                        }}>
                            {/* 값 표시 (막대 위) */}
                            <span style={{
                                fontSize: '12px',
                                color: '#1e293b',
                                fontWeight: '600',
                                marginBottom: '4px'
                            }}>
                                {value}
                            </span>

                            {/* 막대 */}
                            <div style={{
                                width: '100%',
                                height: `${barHeight}%`,
                                minHeight: '20px',
                                background: barColor,
                                borderRadius: '6px 6px 0 0',
                                display: 'flex',
                                alignItems: 'flex-start',
                                justifyContent: 'center',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                transition: 'all 0.3s ease-in-out',
                                position: 'relative',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                transform: isHighlighted ? 'scale(1.05)' : 'scale(1)',
                                animation: (isHighlighted && currentEvent?.kind === 'swap')
                                    ? 'swap-pulse 0.5s ease-in-out'
                                    : 'none'
                            }} />

                            {/* 인덱스 표시 (막대 아래) */}
                            <span style={{
                                fontSize: '11px',
                                color: '#64748b',
                                marginTop: '4px'
                            }}>
                                {index}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* 📈 진행 상황 */}
            <div style={{
                marginTop: '20px',
                padding: '16px',
                background: theme?.colors?.cardSecondary || '#f8fafc',
                borderRadius: '8px',
                fontSize: '13px',
                color: theme?.colors?.textLight || '#64748b',
                width: '100%',
                maxWidth: '900px',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ marginBottom: '6px' }}>
                    <strong>진행률:</strong> {currentStep + 1} / {totalSteps} 단계
                </div>
                <div>
                    <strong>현재 배열:</strong> [{currentList.join(', ')}]
                </div>
                {currentEvent?.kind && (
                    <div style={{ marginTop: '6px' }}>
                        <strong>이벤트 종류:</strong> {currentEvent.kind}
                    </div>
                )}
            </div>

            {/* CSS 애니메이션 */}
            <style>{`
                @keyframes swap-pulse {
                    0%, 100% { transform: translateY(0) scale(1.05); }
                    50% { transform: translateY(-10px) scale(1.05); }
                }
            `}</style>
        </div>
    );
};

export default SortAnimation;