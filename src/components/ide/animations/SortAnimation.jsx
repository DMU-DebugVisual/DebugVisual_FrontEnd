// SortAnimation.jsx - SVG + D3 기반 (RecursionAnimation 방식)
import React, { useMemo, useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const SortAnimation = ({ data, currentStep, totalSteps, theme }) => {
    const svgRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(100);
    const zoomBehaviorRef = useRef(null);
    const currentTransformRef = useRef(d3.zoomIdentity);

    console.log('🎬 SortAnimation 렌더링:', { currentStep, totalSteps, hasData: !!data });

    const currentEvent = useMemo(() => {
        if (!data?.events || currentStep >= data.events.length) {
            return null;
        }
        return data.events[currentStep];
    }, [data, currentStep]);

    const currentList = useMemo(() => {
        if (!data?.events) return null;

        let initialList = null;
        const callEvent = data.events.find(e => e.kind === 'call' && e.args);
        if (callEvent?.args) {
            const listArg = callEvent.args.find(arg => arg.name === 'list');
            if (listArg?.value) {
                initialList = listArg.value;
            }
        }

        for (let i = currentStep; i >= 0; i--) {
            const event = data.events[i];
            if (event?.viz?.list) {
                return event.viz.list;
            }
        }

        return initialList;
    }, [data, currentStep]);

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

    // SVG + D3 렌더링
    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        if (!currentList || currentList.length === 0) return;

        const width = svgRef.current?.clientWidth || 800;
        const height = svgRef.current?.clientHeight || 600;

        const g = svg.append('g');

        // Zoom behavior 설정
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                currentTransformRef.current = event.transform; // Transform 저장
                setZoomLevel(Math.round(event.transform.k * 100));
            });

        zoomBehaviorRef.current = zoom;

        svg.call(zoom);

        // 저장된 Transform 복원
        svg.call(zoom.transform, currentTransformRef.current);

        // 막대 그래프 그리기
        const maxValue = Math.max(...currentList);
        const barWidth = 60;
        const barGap = 10;
        const totalWidth = currentList.length * (barWidth + barGap);
        const startX = (width - totalWidth) / 2;
        const chartHeight = 400;
        const chartY = (height - chartHeight) / 2;

        currentList.forEach((value, index) => {
            const isHighlighted = highlightIndices.includes(index);
            const barHeight = (value / maxValue) * chartHeight * 0.8;
            const x = startX + index * (barWidth + barGap);
            const y = chartY + chartHeight - barHeight;

            // 막대 색상
            let barColor = '#8b5cf6'; // 기본 보라색
            if (isHighlighted) {
                if (currentEvent?.kind === 'swap') {
                    barColor = '#22c55e'; // 초록색 (교환)
                } else if (currentEvent?.kind === 'compare') {
                    barColor = '#fbbf24'; // 주황색 (비교)
                }
            }

            // 막대
            const barGroup = g.append('g');

            barGroup.append('rect')
                .attr('x', x)
                .attr('y', y)
                .attr('width', barWidth)
                .attr('height', barHeight)
                .attr('fill', barColor)
                .attr('rx', 6)
                .attr('stroke', '#0f172a')
                .attr('stroke-width', 2)
                .style('transition', 'all 0.3s ease');

            // 값 표시 (막대 위)
            barGroup.append('text')
                .attr('x', x + barWidth / 2)
                .attr('y', y - 8)
                .attr('text-anchor', 'middle')
                .attr('font-size', 14)
                .attr('font-weight', '700')
                .attr('fill', '#1e293b')
                .text(value);

            // 인덱스 표시 (막대 아래)
            barGroup.append('text')
                .attr('x', x + barWidth / 2)
                .attr('y', chartY + chartHeight + 20)
                .attr('text-anchor', 'middle')
                .attr('font-size', 12)
                .attr('fill', '#64748b')
                .text(index);
        });

    }, [currentList, highlightIndices, currentEvent]); // 의존성 배열

    const handleZoomIn = () => {
        const svg = d3.select(svgRef.current);
        svg.transition().call(zoomBehaviorRef.current.scaleBy, 1.3);
    };

    const handleZoomOut = () => {
        const svg = d3.select(svgRef.current);
        svg.transition().call(zoomBehaviorRef.current.scaleBy, 0.7);
    };

    const handleZoomReset = () => {
        const svg = d3.select(svgRef.current);
        svg.transition().call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
        currentTransformRef.current = d3.zoomIdentity;
        setZoomLevel(100);
    };

    const getDescription = () => {
        if (!currentEvent) return '정렬 초기 상태';

        switch (currentEvent.kind) {
            case 'compare':
                return `값 비교: ${currentEvent.read?.[0]?.value} vs ${currentEvent.read?.[1]?.value}`;
            case 'swap':
                return `값 교환`;
            case 'loopIter':
                return `반복 ${currentEvent.loop?.iter + 1}/${currentEvent.loop?.total || '?'}`;
            case 'call':
                return `함수 호출: ${currentEvent.fn}()`;
            case 'return':
                return `함수 종료`;
            case 'io':
                return 'io';
            default:
                return currentEvent.kind;
        }
    };

    const description = getDescription();

    // 초기 빈 상태 - RecursionAnimation처럼 빈 캔버스 표시
    if (!data?.events || !currentList) {
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
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    style={{ cursor: 'grab', minHeight: '600px' }}
                />

                {/* Zoom 컨트롤 (비활성화 상태) */}
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
                    zIndex: 10,
                    opacity: 0.5
                }}>
                    <button disabled style={{
                        width: '32px',
                        height: '32px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#8b5cf6',
                        color: 'white',
                        cursor: 'not-allowed',
                        fontSize: '18px',
                        fontWeight: 'bold'
                    }}>+</button>

                    <div style={{
                        fontSize: '11px',
                        fontWeight: '600',
                        color: '#64748b',
                        textAlign: 'center',
                        padding: '4px 0'
                    }}>
                        100%
                    </div>

                    <button disabled style={{
                        width: '32px',
                        height: '32px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#8b5cf6',
                        color: 'white',
                        cursor: 'not-allowed',
                        fontSize: '18px',
                        fontWeight: 'bold'
                    }}>−</button>

                    <button disabled style={{
                        width: '32px',
                        height: '32px',
                        border: 'none',
                        borderRadius: '6px',
                        background: '#64748b',
                        color: 'white',
                        cursor: 'not-allowed',
                        fontSize: '14px'
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
            <svg
                ref={svgRef}
                width="100%"
                height="100%"
                style={{ cursor: 'grab', minHeight: '600px' }}
            />

            {/* 현재 단계 표시 */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 10
            }}>
                <strong>Step {currentStep + 1} / {totalSteps}:</strong>
                <div style={{ marginTop: '4px', fontSize: '12px' }}>이벤트: {description}</div>
            </div>

            {/* 사용법 안내 */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '11px',
                color: '#64748b',
                border: '1px solid #e2e8f0',
                zIndex: 10
            }}>
                💡 <strong>마우스 휠</strong>로 확대/축소, <strong>드래그</strong>로 이동
            </div>

            {/* 정렬 정보 */}
            <div style={{
                position: 'absolute',
                bottom: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 10
            }}>
                <div style={{ marginBottom: '6px' }}>
                    <strong>배열 크기:</strong> {currentList.length}
                </div>
                <div>
                    <strong>최댓값:</strong> {Math.max(...currentList)}
                </div>
            </div>

            {/* Zoom 컨트롤 */}
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
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#8b5cf6',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold'
                }}>+</button>

                <div style={{
                    fontSize: '11px',
                    fontWeight: '600',
                    color: '#64748b',
                    textAlign: 'center',
                    padding: '4px 0'
                }}>
                    {zoomLevel}%
                </div>

                <button onClick={handleZoomOut} style={{
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#8b5cf6',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '18px',
                    fontWeight: 'bold'
                }}>−</button>

                <button onClick={handleZoomReset} style={{
                    width: '32px',
                    height: '32px',
                    border: 'none',
                    borderRadius: '6px',
                    background: '#64748b',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px'
                }}>⟲</button>
            </div>
        </div>
    );
};

export default SortAnimation;