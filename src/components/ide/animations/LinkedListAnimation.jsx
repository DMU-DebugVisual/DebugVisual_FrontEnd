// LinkedListAnimation.jsx - DV-Flow v1.3 완전 대응 (viz 기반)
import React, { useMemo } from 'react';

const LinkedListAnimation = ({ data, currentStep, theme }) => {
    console.log('🔗 LinkedListAnimation 렌더링:', { currentStep, hasData: !!data });

    // 📊 현재까지의 링크드 리스트 상태 구축
    const listState = useMemo(() => {
        if (!data?.events) return { nodes: [] };

        // currentStep까지 순회하며 최신 viz 찾기
        let latestNodes = [];

        for (let i = 0; i <= currentStep && i < data.events.length; i++) {
            const event = data.events[i];

            // viz.nodes가 있으면 그걸로 업데이트
            if (event.viz?.nodes) {
                latestNodes = event.viz.nodes;
            }
        }

        return { nodes: latestNodes };
    }, [data, currentStep]);

    // 🎯 현재 이벤트에서 하이라이트할 노드
    const highlightInfo = useMemo(() => {
        if (!data?.events || currentStep >= data.events.length) return { nodeId: null, type: null };

        const event = data.events[currentStep];

        // ds_op 이벤트
        if (event.kind === 'ds_op') {
            if (event.op === 'insert') {
                // 삽입된 노드 ID (args[0])
                return { nodeId: event.args?.[0], type: 'insert' };
            }
            if (event.op === 'delete') {
                // 삭제될 노드 ID
                return { nodeId: event.args?.[0], type: 'delete' };
            }
        }

        // assign 이벤트 (cur 포인터 이동)
        if (event.kind === 'assign' && event.var === 'cur') {
            return { nodeId: event.after, type: 'traverse' };
        }

        return { nodeId: null, type: null };
    }, [data, currentStep]);

    // 📝 현재 이벤트 설명
    const getDescription = () => {
        if (!data?.events || currentStep >= data.events.length) {
            return '링크드 리스트 초기 상태';
        }

        const event = data.events[currentStep];

        switch (event.kind) {
            case 'ds_op':
                if (event.op === 'insert') {
                    return `노드 삽입: 값 ${event.args?.[1] ?? '?'}`;
                }
                if (event.op === 'delete') {
                    return `노드 삭제: ${event.args?.[0]}`;
                }
                return `리스트 연산: ${event.op}`;
            case 'assign':
                if (event.var === 'cur') {
                    return `포인터 이동: ${event.after || 'NULL'}`;
                }
                if (event.var === 'head') {
                    return `HEAD 설정: ${event.after}`;
                }
                if (event.var === 'tail') {
                    return `TAIL 업데이트`;
                }
                return `변수 할당: ${event.var}`;
            case 'compare':
                return `조건 비교: ${event.expr}`;
            case 'call':
                return `함수 호출: ${event.fn}()`;
            case 'io':
                if (event.dir === 'in') {
                    return `입력 읽기: ${event.data}`;
                }
                return `출력: ${event.data}`;
            default:
                return `이벤트: ${event.kind}`;
        }
    };

    const description = getDescription();

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px',
            position: 'relative'
        }}>
            {/* 현재 단계 표시 */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                color: theme?.colors?.text || '#1e293b',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 10
            }}>
                <strong>Step {currentStep + 1} / {data?.events?.length || 0}:</strong> {description}
            </div>

            {/* 링크드 리스트 시각화 */}
            {listState.nodes.length > 0 ? (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    maxWidth: '90%'
                }}>
                    {/* HEAD 라벨 */}
                    <div style={{
                        padding: '8px 16px',
                        background: theme?.colors?.primary || '#8b5cf6',
                        color: 'white',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '700'
                    }}>
                        HEAD
                    </div>

                    {/* 노드들 */}
                    {listState.nodes.map((node, index) => {
                        const isHighlighted = node.id === highlightInfo.nodeId;
                        const isLast = index === listState.nodes.length - 1;

                        // 하이라이트 색상 결정
                        let highlightColor = '#f97316'; // 기본 주황색
                        let bgColor = '#fff7ed';
                        if (isHighlighted) {
                            if (highlightInfo.type === 'insert') {
                                highlightColor = '#22c55e'; // 녹색
                                bgColor = '#f0fdf4';
                            } else if (highlightInfo.type === 'delete') {
                                highlightColor = '#ef4444'; // 빨간색
                                bgColor = '#fef2f2';
                            } else if (highlightInfo.type === 'traverse') {
                                highlightColor = '#3b82f6'; // 파란색
                                bgColor = '#eff6ff';
                            }
                        }

                        return (
                            <React.Fragment key={node.id}>
                                {/* 노드 */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    {/* 노드 박스 */}
                                    <div style={{
                                        display: 'flex',
                                        border: isHighlighted ? `3px solid ${highlightColor}` : '2px solid #64748b',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        background: isHighlighted ? bgColor : 'white',
                                        boxShadow: isHighlighted
                                            ? `0 4px 12px ${highlightColor}40`
                                            : '0 2px 8px rgba(0,0,0,0.1)',
                                        transition: 'all 0.3s ease',
                                        transform: isHighlighted ? 'scale(1.1)' : 'scale(1)'
                                    }}>
                                        {/* Data */}
                                        <div style={{
                                            padding: '20px 24px',
                                            background: isHighlighted ? bgColor : '#f1f5f9',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            minWidth: '80px'
                                        }}>
                                            <div style={{
                                                fontSize: '10px',
                                                color: '#64748b',
                                                marginBottom: '4px',
                                                fontWeight: '600'
                                            }}>
                                                DATA
                                            </div>
                                            <div style={{
                                                fontSize: '20px',
                                                fontWeight: '700',
                                                color: isHighlighted ? highlightColor : '#0f172a'
                                            }}>
                                                {node.value}
                                            </div>
                                        </div>

                                        {/* Next */}
                                        <div style={{
                                            padding: '20px 16px',
                                            background: 'white',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            minWidth: '60px',
                                            borderLeft: '1px solid #e2e8f0'
                                        }}>
                                            <div style={{
                                                fontSize: '10px',
                                                color: '#64748b',
                                                marginBottom: '4px',
                                                fontWeight: '600'
                                            }}>
                                                NEXT
                                            </div>
                                            <div style={{
                                                fontSize: '16px',
                                                fontWeight: '700',
                                                color: node.next === null ? '#ef4444' : '#3b82f6'
                                            }}>
                                                {node.next === null ? '∅' : '→'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 노드 ID */}
                                    <div style={{
                                        fontSize: '11px',
                                        color: '#64748b',
                                        fontWeight: '600'
                                    }}>
                                        {node.id}
                                    </div>
                                </div>

                                {/* 화살표 (마지막이 아닌 경우) */}
                                {!isLast && (
                                    <div style={{
                                        fontSize: '24px',
                                        color: '#94a3b8',
                                        fontWeight: '700'
                                    }}>
                                        ➜
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })}

                    {/* NULL 표시 */}
                    <div style={{
                        padding: '8px 16px',
                        background: '#fee2e2',
                        color: '#991b1b',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '700',
                        border: '2px solid #ef4444'
                    }}>
                        NULL
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔗</div>
                    <p>링크드 리스트가 비어있습니다</p>
                </div>
            )}

            {/* 정보 패널 */}
            {listState.nodes.length > 0 && (
                <div style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '20px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    zIndex: 10
                }}>
                    <div style={{ marginBottom: '6px' }}>
                        <strong>노드 개수:</strong> {listState.nodes.length}
                    </div>
                    <div>
                        <strong>HEAD:</strong> {listState.nodes[0]?.id || 'NULL'}
                    </div>
                </div>
            )}

            {/* 범례 */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '11px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
            }}>
                <div style={{ fontWeight: '700', marginBottom: '4px' }}>범례:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', background: '#22c55e', borderRadius: '4px' }}></div>
                    <span>삽입</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', background: '#ef4444', borderRadius: '4px' }}></div>
                    <span>삭제</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '16px', height: '16px', background: '#3b82f6', borderRadius: '4px' }}></div>
                    <span>탐색</span>
                </div>
            </div>
        </div>
    );
};

export default LinkedListAnimation;