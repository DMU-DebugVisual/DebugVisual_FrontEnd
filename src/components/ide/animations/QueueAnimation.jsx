// QueueAnimation.jsx - 큐 시각화 (줌 상태 유지)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

const parseSnapshot = (line) => {
    if (typeof line !== 'string') return null;
    const match = line.match(/\[(.*)\]/);
    if (!match) return null;
    const raw = match[1].trim();
    if (!raw) return [];
    return raw.split(',').map(item => item.trim()).filter(Boolean);
};

const normalizeValue = (value) => {
    if (value === null || value === undefined) return '-';
    return String(value);
};

const QueueAnimation = ({ data, currentStep, theme }) => {
    const svgRef = useRef(null);
    const zoomBehaviorRef = useRef(null);
    const currentTransformRef = useRef(d3.zoomIdentity);
    const [zoomLevel, setZoomLevel] = useState(100);

    const { items, lastOp } = useMemo(() => {
        if (!Array.isArray(data?.events)) {
            return { items: [], lastOp: null };
        }

        let snapshot = [];
        let workingOp = null;
        let lastOperation = null;

        const commit = () => {
            if (workingOp) {
                lastOperation = { ...workingOp };
            }
        };

        for (let i = 0; i <= currentStep && i < data.events.length; i++) {
            const event = data.events[i];

            if (event.kind === 'ds_op' && /queue|q\b/i.test(event.target || '')) {
                workingOp = {
                    op: event.op,
                    value: event.args?.length ? event.args[0] : null,
                    status: 'pending',
                    stepIndex: i
                };
                commit();
                continue;
            }

            if (!workingOp) {
                if (event.kind === 'io' && typeof event.data === 'string' && event.data.includes('Queue(')) {
                    const parsed = parseSnapshot(event.data);
                    if (parsed) snapshot = parsed;
                }
                continue;
            }

            if (event.kind === 'branch' && typeof event.result === 'boolean') {
                if (typeof workingOp.status === 'string' && workingOp.status !== 'fail') {
                    workingOp.status = event.result ? 'success' : 'fail';
                } else {
                    workingOp.status = event.result ? 'success' : 'fail';
                }
                commit();
                continue;
            }

            if (event.kind === 'io' && typeof event.data === 'string') {
                const lower = event.data.toLowerCase();

                if (event.data.includes('Queue(')) {
                    const parsed = parseSnapshot(event.data);
                    if (parsed) snapshot = parsed;

                    if (lower.includes('실패')) {
                        workingOp.status = 'fail';
                    } else if (workingOp.status !== 'fail') {
                        workingOp.status = 'success';
                    }

                    if (workingOp.op === 'enqueue' && (workingOp.value === null || workingOp.value === undefined)) {
                        const match = event.data.match(/enq\s+(-?\d+)/i);
                        if (match) {
                            workingOp.value = match[1];
                        }
                    }

                    if (workingOp.op === 'dequeue') {
                        const match = event.data.match(/deq\s+(-?\d+)/i);
                        if (match) {
                            workingOp.value = match[1];
                        }
                    }
                } else if (lower.includes('실패')) {
                    workingOp.status = 'fail';
                } else if (workingOp.op === 'peek' && lower.includes('peek')) {
                    const match = event.data.match(/peek\s*->\s*(-?\d+)/i);
                    if (match) {
                        workingOp.value = match[1];
                        workingOp.status = 'success';
                    }
                }

                commit();
                continue;
            }
        }

        return {
            items: snapshot,
            lastOp: lastOperation
        };
    }, [data, currentStep]);

    useEffect(() => {
        const svgElement = svgRef.current;
        if (!svgElement) return;

        const svg = d3.select(svgElement);

        if (!zoomBehaviorRef.current) {
            const zoom = d3.zoom()
                .scaleExtent([0.5, 3])
                .on('zoom', (event) => {
                    svg.select('.zoom-group').attr('transform', event.transform);
                    currentTransformRef.current = event.transform;
                    setZoomLevel(Math.round(event.transform.k * 100));
                });

            zoomBehaviorRef.current = zoom;
            svg.call(zoom);
        }

        svg.select('.zoom-group').attr('transform', currentTransformRef.current);
        svg.call(zoomBehaviorRef.current.transform, currentTransformRef.current);
    }, [items.length]);

    useEffect(() => () => {
        if (!svgRef.current) return;
        const svg = d3.select(svgRef.current);
        svg.on('.zoom', null);
        zoomBehaviorRef.current = null;
        currentTransformRef.current = d3.zoomIdentity;
    }, []);

    const handleZoomIn = () => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        d3.select(svgRef.current).transition().call(zoomBehaviorRef.current.scaleBy, 1.3);
    };

    const handleZoomOut = () => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        d3.select(svgRef.current).transition().call(zoomBehaviorRef.current.scaleBy, 0.7);
    };

    const handleZoomReset = () => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        d3.select(svgRef.current).transition().call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
        currentTransformRef.current = d3.zoomIdentity;
        setZoomLevel(100);
    };

    const currentEvent = data?.events?.[currentStep];

    const description = useMemo(() => {
        if (!currentEvent) return '큐 상태를 로드하는 중입니다.';

        if (currentEvent.kind === 'ds_op' && /queue|q\b/i.test(currentEvent.target || '')) {
            if (currentEvent.op === 'enqueue') {
                return `enqueue 연산: 값 ${normalizeValue(currentEvent.args?.[0])} 추가 시도`;
            }
            if (currentEvent.op === 'dequeue') {
                return 'dequeue 연산: front 요소 제거 시도';
            }
            if (currentEvent.op === 'peek') {
                return 'peek 연산: front 요소 확인';
            }
            return `큐 연산: ${currentEvent.op}`;
        }

        if (currentEvent.kind === 'io' && typeof currentEvent.data === 'string') {
            return currentEvent.data.replace(/\n/g, '');
        }

        if (currentEvent.kind === 'branch') {
            return `조건 평가 (${currentEvent.result ? '성공' : '실패'})`;
        }

        return `이벤트: ${currentEvent.kind}`;
    }, [currentEvent]);

    const highlightIndex = useMemo(() => {
        if (!items.length) return -1;
        if (!lastOp) return -1;
        if (lastOp.status === 'fail') return -1;

        if (lastOp.op === 'enqueue') {
            return items.length - 1;
        }

        if (lastOp.op === 'dequeue' || lastOp.op === 'peek') {
            return 0;
        }

        return -1;
    }, [items, lastOp]);

    const statusColors = {
        success: theme?.colors?.success || '#10b981',
        fail: theme?.colors?.danger || '#ef4444',
        pending: theme?.colors?.info || '#3b82f6'
    };

    const opLabel = lastOp ? lastOp.op?.toUpperCase() : 'N/A';
    const opValue = normalizeValue(lastOp?.value);
    const opStatus = lastOp?.status || 'pending';

    return (
        <div style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '600px',
            background: theme?.colors?.cardSecondary || '#f8fafc'
        }}>
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                style={{ cursor: 'grab', minHeight: '600px', overflow: 'visible' }}
            >
                <g className="zoom-group">
                    <foreignObject x="0" y="0" width="100%" height="100%">
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '24px',
                            padding: '60px 40px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}>
                                <div style={{
                                    padding: '10px 18px',
                                    borderRadius: '999px',
                                    background: '#1e293b',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                }}>
                                    FRONT
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    gap: '12px'
                                }}>
                                    {items.length === 0 && (
                                        <div style={{
                                            padding: '24px 36px',
                                            borderRadius: '12px',
                                            border: '2px dashed #cbd5f5',
                                            background: '#f8fafc',
                                            color: '#64748b',
                                            fontWeight: 600,
                                            fontSize: '14px'
                                        }}>
                                            큐가 비었습니다
                                        </div>
                                    )}

                                    {items.map((value, index) => {
                                        const isHighlighted = index === highlightIndex;
                                        const bg = isHighlighted ? '#ecfeff' : 'white';
                                        const borderColor = isHighlighted ? (theme?.colors?.info || '#06b6d4') : '#cbd5f5';

                                        return (
                                            <div
                                                key={`${index}-${value}`}
                                                style={{
                                                    width: '160px',
                                                    padding: '18px 16px',
                                                    borderRadius: '16px',
                                                    border: `3px solid ${borderColor}`,
                                                    background: bg,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    boxShadow: isHighlighted
                                                        ? `${borderColor}40 0px 8px 24px`
                                                        : '0 4px 12px rgba(15, 23, 42, 0.08)',
                                                    transition: 'all 0.2s ease',
                                                    transform: isHighlighted ? 'translateY(-6px)' : 'translateY(0)'
                                                }}
                                            >
                                                <div style={{
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    color: '#64748b',
                                                    letterSpacing: '0.08em'
                                                }}>
                                                    POSITION {index + 1}
                                                </div>
                                                <div style={{
                                                    fontSize: '24px',
                                                    fontWeight: 700,
                                                    color: '#0f172a'
                                                }}>
                                                    {value}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div style={{
                                    padding: '10px 18px',
                                    borderRadius: '999px',
                                    background: theme?.colors?.primary || '#8b5cf6',
                                    color: 'white',
                                    fontWeight: 700,
                                    fontSize: '14px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                }}>
                                    REAR
                                </div>
                            </div>

                            <div style={{
                                width: '100%',
                                height: '14px',
                                borderRadius: '7px',
                                background: '#1e293b',
                                boxShadow: '0 6px 16px rgba(15,23,42,0.35)'
                            }} />
                        </div>
                    </foreignObject>
                </g>
            </svg>

            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                background: 'white',
                padding: '8px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                zIndex: 10
            }}>
                <button onClick={handleZoomIn} style={{
                    width: '32px', height: '32px', border: 'none', borderRadius: '6px',
                    background: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold'
                }}>+</button>
                <div style={{
                    fontSize: '11px', fontWeight: '600', color: '#64748b',
                    textAlign: 'center', padding: '4px 0'
                }}>{zoomLevel}%</div>
                <button onClick={handleZoomOut} style={{
                    width: '32px', height: '32px', border: 'none', borderRadius: '6px',
                    background: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold'
                }}>−</button>
                <button onClick={handleZoomReset} style={{
                    width: '32px', height: '32px', border: 'none', borderRadius: '6px',
                    background: '#64748b', color: 'white', cursor: 'pointer', fontSize: '14px'
                }}>⟲</button>
            </div>

            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                padding: '14px 18px',
                background: 'rgba(255,255,255,0.95)',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 12px rgba(15,23,42,0.12)',
                width: '260px',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                zIndex: 10
            }}>
                <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: theme?.colors?.text || '#1e293b'
                }}>현재 설명</div>
                <div style={{
                    fontSize: '12px',
                    color: theme?.colors?.textLight || '#64748b',
                    lineHeight: 1.5
                }}>{description}</div>
            </div>

            {lastOp && (
                <div style={{
                    position: 'absolute',
                    bottom: '24px',
                    left: '20px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: `1px solid ${statusColors[opStatus] || '#94a3b8'}`,
                    background: 'rgba(255,255,255,0.92)',
                    boxShadow: '0 4px 12px rgba(15,23,42,0.12)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    minWidth: '220px'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: statusColors[opStatus] || '#0f172a'
                    }}>
                        <span>최근 연산</span>
                        <span>{opLabel}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '12px',
                        color: '#475569',
                        fontWeight: 600
                    }}>
                        <span>값</span>
                        <span>{opValue}</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        color: '#475569'
                    }}>
                        <span>결과</span>
                        <span>{opStatus.toUpperCase()}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QueueAnimation;
