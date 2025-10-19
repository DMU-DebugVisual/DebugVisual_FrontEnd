// LinkedListAnimation.jsx - Zoom 상태 유지 + 빈 캔버스 초기 상태
import React, { useMemo, useRef, useState, useEffect } from 'react';
import * as d3 from 'd3';

const LinkedListAnimation = ({ data, currentStep, theme }) => {
    const containerRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(100);
    const zoomBehaviorRef = useRef(null);
    const currentTransformRef = useRef(d3.zoomIdentity);

    console.log('🔗 LinkedListAnimation 렌더링:', { currentStep, hasData: !!data });

    const listState = useMemo(() => {
        if (!data?.events) return { nodes: [] };

        let latestNodes = [];

        for (let i = 0; i <= currentStep && i < data.events.length; i++) {
            const event = data.events[i];
            if (event.viz?.nodes) {
                latestNodes = event.viz.nodes;
            }
        }

        return { nodes: latestNodes };
    }, [data, currentStep]);

    const highlightInfo = useMemo(() => {
        if (!data?.events || currentStep >= data.events.length) return { nodeId: null, type: null };

        const event = data.events[currentStep];

        if (event.kind === 'ds_op') {
            if (event.op === 'insert') {
                return { nodeId: event.args?.[0], type: 'insert' };
            }
            if (event.op === 'delete') {
                return { nodeId: event.args?.[0], type: 'delete' };
            }
        }

        if (event.kind === 'assign' && event.var === 'cur') {
            return { nodeId: event.after, type: 'traverse' };
        }

        return { nodeId: null, type: null };
    }, [data, currentStep]);

    // D3 Zoom 설정
    useEffect(() => {
        if (!containerRef.current || listState.nodes.length === 0) return;

        const container = d3.select(containerRef.current);

        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', (event) => {
                container.select('.zoom-group').attr('transform', event.transform);
                currentTransformRef.current = event.transform;
                setZoomLevel(Math.round(event.transform.k * 100));
            });

        zoomBehaviorRef.current = zoom;
        container.call(zoom);
        container.call(zoom.transform, currentTransformRef.current);

    }, [listState.nodes.length]);

    const handleZoomIn = () => {
        if (!containerRef.current) return;
        const container = d3.select(containerRef.current);
        container.transition().call(zoomBehaviorRef.current.scaleBy, 1.3);
    };

    const handleZoomOut = () => {
        if (!containerRef.current) return;
        const container = d3.select(containerRef.current);
        container.transition().call(zoomBehaviorRef.current.scaleBy, 0.7);
    };

    const handleZoomReset = () => {
        if (!containerRef.current) return;
        const container = d3.select(containerRef.current);
        container.transition().call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
        currentTransformRef.current = d3.zoomIdentity;
        setZoomLevel(100);
    };

    const getDescription = () => {
        if (!data?.events || currentStep >= data.events.length) {
            return '링크드 리스트 초기 상태';
        }

        const event = data.events[currentStep];

        switch (event.kind) {
            case 'ds_op':
                if (event.op === 'insert') return `노드 삽입: 값 ${event.args?.[1] ?? '?'}`;
                if (event.op === 'delete') return `노드 삭제: ${event.args?.[0]}`;
                return `리스트 연산: ${event.op}`;
            case 'assign':
                if (event.var === 'cur') return `포인터 이동: ${event.after || 'NULL'}`;
                if (event.var === 'head') return `HEAD 설정: ${event.after}`;
                if (event.var === 'tail') return `TAIL 업데이트`;
                return `변수 할당: ${event.var}`;
            case 'compare': return `조건 비교: ${event.expr}`;
            case 'call': return `함수 호출: ${event.fn}()`;
            case 'io':
                if (event.dir === 'in') return `입력 읽기: ${event.data}`;
                return `출력: ${event.data}`;
            default: return `이벤트: ${event.kind}`;
        }
    };

    const description = getDescription();

    // 초기 빈 상태
    if (!data?.events || listState.nodes.length === 0) {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                minHeight: '600px',
                background: theme?.colors?.cardSecondary || '#f1f5f9'
            }}>
                <svg
                    width="100%"
                    height="100%"
                    style={{ cursor: 'grab', minHeight: '600px' }}
                />

                {/* Zoom 컨트롤 (비활성화) */}
                <div style={{
                    position: 'absolute', top: '20px', right: '20px',
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    background: 'white', padding: '8px', borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0', zIndex: 10, opacity: 0.5
                }}>
                    <button disabled style={{
                        width: '32px', height: '32px', border: 'none', borderRadius: '6px',
                        background: '#3b82f6', color: 'white', cursor: 'not-allowed',
                        fontSize: '18px', fontWeight: 'bold'
                    }}>+</button>
                    <div style={{
                        fontSize: '11px', fontWeight: '600', color: '#64748b',
                        textAlign: 'center', padding: '4px 0'
                    }}>100%</div>
                    <button disabled style={{
                        width: '32px', height: '32px', border: 'none', borderRadius: '6px',
                        background: '#3b82f6', color: 'white', cursor: 'not-allowed',
                        fontSize: '18px', fontWeight: 'bold'
                    }}>−</button>
                    <button disabled style={{
                        width: '32px', height: '32px', border: 'none', borderRadius: '6px',
                        background: '#64748b', color: 'white', cursor: 'not-allowed', fontSize: '14px'
                    }}>⟲</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            minHeight: '600px',
            background: theme?.colors?.cardSecondary || '#f1f5f9'
        }}>
            {/* SVG with D3 Zoom */}
            <svg
                ref={containerRef}
                width="100%"
                height="100%"
                style={{
                    cursor: 'grab',
                    minHeight: '600px',
                    overflow: 'visible'
                }}
            >
                <g className="zoom-group">
                    <foreignObject x="50" y="250" width="100%" height="200">
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            padding: '20px'
                        }}>
                            {/* HEAD 라벨 */}
                            <div style={{
                                padding: '8px 16px',
                                background: theme?.colors?.primary || '#8b5cf6',
                                color: 'white',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '700',
                                flexShrink: 0
                            }}>
                                HEAD
                            </div>

                            {/* 노드들 */}
                            {listState.nodes.map((node, index) => {
                                const isHighlighted = node.id === highlightInfo.nodeId;
                                const isLast = index === listState.nodes.length - 1;

                                let highlightColor = '#f97316';
                                let bgColor = '#fff7ed';
                                if (isHighlighted) {
                                    if (highlightInfo.type === 'insert') {
                                        highlightColor = '#22c55e';
                                        bgColor = '#f0fdf4';
                                    } else if (highlightInfo.type === 'delete') {
                                        highlightColor = '#ef4444';
                                        bgColor = '#fef2f2';
                                    } else if (highlightInfo.type === 'traverse') {
                                        highlightColor = '#3b82f6';
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
                                            gap: '8px',
                                            flexShrink: 0
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
                                                transform: isHighlighted ? 'scale(1.05)' : 'scale(1)'
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

                                        {/* 화살표 */}
                                        {!isLast && (
                                            <div style={{
                                                fontSize: '24px',
                                                color: '#94a3b8',
                                                fontWeight: '700',
                                                flexShrink: 0
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
                                border: '2px solid #ef4444',
                                flexShrink: 0
                            }}>
                                NULL
                            </div>
                        </div>
                    </foreignObject>
                </g>
            </svg>

            {/* Zoom 컨트롤 */}
            <div style={{
                position: 'absolute', top: '20px', right: '20px',
                display: 'flex', flexDirection: 'column', gap: '8px',
                background: 'white', padding: '8px', borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0', zIndex: 10
            }}>
                <button onClick={handleZoomIn} style={{
                    width: '32px', height: '32px', border: 'none', borderRadius: '6px',
                    background: '#3b82f6', color: 'white', cursor: 'pointer',
                    fontSize: '18px', fontWeight: 'bold'
                }}>+</button>
                <div style={{
                    fontSize: '11px', fontWeight: '600', color: '#64748b',
                    textAlign: 'center', padding: '4px 0'
                }}>{zoomLevel}%</div>
                <button onClick={handleZoomOut} style={{
                    width: '32px', height: '32px', border: 'none', borderRadius: '6px',
                    background: '#3b82f6', color: 'white', cursor: 'pointer',
                    fontSize: '18px', fontWeight: 'bold'
                }}>−</button>
                <button onClick={handleZoomReset} style={{
                    width: '32px', height: '32px', border: 'none', borderRadius: '6px',
                    background: '#64748b', color: 'white', cursor: 'pointer', fontSize: '14px'
                }}>⟲</button>
            </div>

            {/* 현재 단계 표시 */}
            <div style={{
                position: 'absolute', top: '20px', left: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '10px 16px', borderRadius: '8px', fontSize: '13px',
                color: theme?.colors?.text || '#1e293b',
                border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 10
            }}>
                <strong>Step {currentStep + 1} / {data?.events?.length || 0}:</strong>
                <div style={{ marginTop: '4px', fontSize: '12px' }}>이벤트: {description}</div>
            </div>

            {/* 정보 패널 */}
            <div style={{
                position: 'absolute', bottom: '20px', right: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '12px 16px', borderRadius: '8px', fontSize: '12px',
                border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 10
            }}>
                <div style={{ marginBottom: '6px' }}>
                    <strong>노드 개수:</strong> {listState.nodes.length}
                </div>
                <div>
                    <strong>HEAD:</strong> {listState.nodes[0]?.id || 'NULL'}
                </div>
            </div>

            {/* 사용법 안내 */}
            <div style={{
                position: 'absolute', bottom: '20px', left: '20px',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '8px 12px', borderRadius: '6px', fontSize: '11px',
                color: '#64748b', border: '1px solid #e2e8f0', zIndex: 10
            }}>
                💡 <strong>마우스 휠</strong>로 확대/축소, <strong>드래그</strong>로 이동
            </div>
        </div>
    );
};

export default LinkedListAnimation;