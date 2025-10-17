import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';

const SortAnimation = ({ data, currentStep, totalSteps, isPlaying }) => {
    const svgRef = useRef(null);

    const frames = data?.frames || [];
    const frame = frames[currentStep] || null;
    const previousFrame = frames[currentStep - 1] || null;

    const list = useMemo(
        () => frame?.list ?? previousFrame?.list ?? [],
        [frame, previousFrame]
    );

    const highlight = useMemo(
        () => frame?.highlight ?? previousFrame?.highlight ?? {},
        [frame, previousFrame]
    );

    const pointers = useMemo(
        () => frame?.pointers ?? previousFrame?.pointers ?? {},
        [frame, previousFrame]
    );

    const compareIndices = useMemo(
        () => highlight?.compare ?? [],
        [highlight]
    );

    const swapIndices = useMemo(
        () => highlight?.swap ?? [],
        [highlight]
    );
    const algorithmLabel = data?.meta?.algorithmName || 'Bubble Sort';

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        if (!list || list.length === 0) {
            return;
        }

        const width = 600;
        const barWidth = 50;
        const gap = 12;
        const totalWidth = list.length * (barWidth + gap) - gap;
        const offsetX = (width - totalWidth) / 2;

        const group = svg.append('g').attr('transform', `translate(${offsetX}, 40)`);

        list.forEach((value, index) => {
            let fill = '#e2e8f0';
            if (swapIndices.includes(index)) fill = '#845ef7';
            else if (compareIndices.includes(index)) fill = '#facc15';

            group.append('rect')
                .attr('x', index * (barWidth + gap))
                .attr('y', 0)
                .attr('width', barWidth)
                .attr('height', 80)
                .attr('rx', 10)
                .attr('fill', fill)
                .attr('stroke', '#94a3b8')
                .attr('stroke-width', 1.5);

            group.append('text')
                .attr('x', index * (barWidth + gap) + barWidth / 2)
                .attr('y', 36)
                .attr('text-anchor', 'middle')
                .attr('font-size', 18)
                .attr('fill', '#1e293b')
                .attr('font-weight', '700')
                .text(value);

            group.append('text')
                .attr('x', index * (barWidth + gap) + barWidth / 2)
                .attr('y', -12)
                .attr('text-anchor', 'middle')
                .attr('font-size', 12)
                .attr('fill', '#64748b')
                .text(`[${index}]`);

            if (pointers.j === index) {
                group.append('text')
                    .attr('x', index * (barWidth + gap) + barWidth / 2)
                    .attr('y', -30)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', 12)
                    .attr('fill', '#2563eb')
                    .attr('font-weight', '600')
                    .text('j');
            }

            if (pointers.i === index) {
                group.append('text')
                    .attr('x', index * (barWidth + gap) + barWidth / 2)
                    .attr('y', 98)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', 12)
                    .attr('fill', '#d97706')
                    .attr('font-weight', '600')
                    .text('i');
            }
        });
    }, [frame, list, compareIndices, swapIndices, pointers]);

    return (
        <div style={{
            width: '100%',
            height: '100%',
            maxHeight: '600px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            fontFamily: '"Segoe UI", sans-serif',
            overflow: 'auto'
        }}>
            {frame && (
                <div style={{
                    padding: '12px',
                    background: '#f0f9ff',
                    borderRadius: '8px',
                    borderLeft: '4px solid #6366f1',
                    fontSize: '14px',
                    color: '#1e293b',
                    fontStyle: 'italic'
                }}>
                    <strong>Step {currentStep + 1} / {totalSteps} ({algorithmLabel}):</strong> {frame.description}
                </div>
            )}

            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                minHeight: '220px',
                padding: '16px'
            }}>
                <svg
                    ref={svgRef}
                    width="600"
                    height="220"
                    style={{
                        overflow: 'visible',
                        background: '#f8fafc',
                        borderRadius: '6px'
                    }}
                />
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '8px'
            }}>
                <div style={{
                    padding: '10px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '12px',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ color: '#6b7280', marginBottom: '4px' }}>재생 상태</div>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                        {isPlaying ? '▶️ 재생중' : '⏸️ 정지'}
                    </div>
                </div>

                <div style={{
                    padding: '10px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '12px',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ color: '#6b7280', marginBottom: '4px' }}>배열 크기</div>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                        {list.length} 개
                    </div>
                </div>

                {pointers.i !== undefined && pointers.i !== null && (
                    <div style={{
                        padding: '10px',
                        background: '#fef3c7',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '12px',
                        border: '1px solid #fcd34d'
                    }}>
                        <div style={{ color: '#92400e', marginBottom: '4px' }}>외부 루프 (i)</div>
                        <div style={{ fontWeight: 'bold', color: '#92400e' }}>{pointers.i}</div>
                    </div>
                )}

                {pointers.j !== undefined && pointers.j !== null && (
                    <div style={{
                        padding: '10px',
                        background: '#dbeafe',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontSize: '12px',
                        border: '1px solid #93c5fd'
                    }}>
                        <div style={{ color: '#1d4ed8', marginBottom: '4px' }}>내부 루프 (j)</div>
                        <div style={{ fontWeight: 'bold', color: '#1d4ed8' }}>{pointers.j}</div>
                    </div>
                )}
            </div>

            <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                fontSize: '11px',
                padding: '10px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '16px', height: '16px', background: '#facc15', borderRadius: '4px' }}></div>
                    <span>비교 중</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '16px', height: '16px', background: '#845ef7', borderRadius: '4px' }}></div>
                    <span>교환</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '16px', height: '16px', background: '#e2e8f0', borderRadius: '4px' }}></div>
                    <span>기본</span>
                </div>
            </div>
        </div>
    );
};

export default SortAnimation;
