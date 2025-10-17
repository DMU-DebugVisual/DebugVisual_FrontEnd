import React, { useEffect, useMemo, useRef } from 'react';
import * as d3 from 'd3';

const GraphAnimation = ({ data, currentStep }) => {
    const svgRef = useRef(null);
    const frames = data?.frames || [];
    const frame = frames[currentStep] || null;
    const previousFrame = frames[currentStep - 1] || null;
    const vertexCount = useMemo(
        () => frame?.vertexCount ?? previousFrame?.vertexCount ?? 0,
        [frame, previousFrame]
    );

    const edges = useMemo(
        () => frame?.edges ?? previousFrame?.edges ?? [],
        [frame, previousFrame]
    );

    const adjacency = useMemo(
        () => frame?.adjacency ?? previousFrame?.adjacency ?? [],
        [frame, previousFrame]
    );

    const highlightedEdge = useMemo(
        () => frame?.highlight?.edge ?? previousFrame?.highlight?.edge ?? null,
        [frame, previousFrame]
    );

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        if (!frame && !previousFrame) {
            return;
        }

        const width = 600;
        const height = 280;

        const nodes = Array.from({ length: vertexCount }, (_, id) => ({ id }));
        const links = edges.map(([source, target]) => ({
            source,
            target,
            highlighted: highlightedEdge && (
                (highlightedEdge[0] === source && highlightedEdge[1] === target) ||
                (highlightedEdge[0] === target && highlightedEdge[1] === source)
            )
        }));

        const simulation = d3.forceSimulation(nodes)
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('link', d3.forceLink(links).id(d => d.id).distance(120))
            .force('collision', d3.forceCollide().radius(40));

        const g = svg.append('g');

        const link = g.selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('stroke', d => d.highlighted ? '#f97316' : '#94a3b8')
            .attr('stroke-width', d => d.highlighted ? 4 : 2);

        const node = g.selectAll('circle')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('r', 22)
            .attr('fill', '#60a5fa')
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 1.5);

        const label = g.selectAll('text')
            .data(nodes)
            .enter()
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('font-size', 14)
            .attr('font-weight', '600')
            .attr('fill', '#0f172a')
            .text(d => d.id);

        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x ?? 0)
                .attr('y1', d => d.source.y ?? 0)
                .attr('x2', d => d.target.x ?? 0)
                .attr('y2', d => d.target.y ?? 0);

            node
                .attr('cx', d => d.x ?? 0)
                .attr('cy', d => d.y ?? 0);

            label
                .attr('x', d => d.x ?? 0)
                .attr('y', d => (d.y ?? 0) + 5);
        });

        return () => simulation.stop();
    }, [frame, previousFrame, vertexCount, edges, highlightedEdge]);

    const description = frame?.description || '그래프 상태를 추적합니다.';

    return (
        <div style={{
            width: '100%',
            height: '100%',
            maxHeight: '640px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            fontFamily: '"Segoe UI", sans-serif',
            overflow: 'auto'
        }}>
            <div style={{
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '8px',
                borderLeft: '4px solid #2563eb',
                fontSize: '14px',
                color: '#1e293b'
            }}>
                <strong>Step {currentStep + 1} / {frames.length}:</strong> {description}
            </div>

            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                minHeight: '260px',
                padding: '16px'
            }}>
                <svg
                    ref={svgRef}
                    width="600"
                    height="280"
                    style={{ background: '#f1f5f9', borderRadius: '8px' }}
                />
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px'
            }}>
                <div style={{
                    padding: '10px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                    fontSize: '12px'
                }}>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>정점 수</div>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{vertexCount}</div>
                </div>

                <div style={{
                    padding: '10px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center',
                    fontSize: '12px'
                }}>
                    <div style={{ color: '#64748b', marginBottom: '4px' }}>간선 수</div>
                    <div style={{ fontWeight: '700', color: '#0f172a' }}>{edges.length}</div>
                </div>

                {highlightedEdge && (
                    <div style={{
                        padding: '10px',
                        background: '#fff7ed',
                        borderRadius: '8px',
                        border: '1px solid #fdba74',
                        textAlign: 'center',
                        fontSize: '12px',
                        color: '#c2410c'
                    }}>
                        <div style={{ marginBottom: '4px' }}>강조 간선</div>
                        <div style={{ fontWeight: '700' }}>({highlightedEdge[0]}, {highlightedEdge[1]})</div>
                    </div>
                )}
            </div>

            <div style={{
                background: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                padding: '12px'
            }}>
                <div style={{
                    fontSize: '12px',
                    color: '#475569',
                    fontWeight: '600',
                    marginBottom: '8px'
                }}>
                    인접 행렬 (현재 상태)
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${vertexCount || 1}, minmax(24px, 1fr))`,
                    gap: '6px'
                }}>
                    {(adjacency || []).slice(0, vertexCount).map((row, rowIndex) => (
                        row.slice(0, vertexCount).map((cell, colIndex) => {
                            const isHighlighted = highlightedEdge && (
                                (highlightedEdge[0] === rowIndex && highlightedEdge[1] === colIndex) ||
                                (highlightedEdge[1] === rowIndex && highlightedEdge[0] === colIndex)
                            );
                            return (
                                <div
                                    key={`${rowIndex}-${colIndex}`}
                                    style={{
                                        padding: '6px 4px',
                                        textAlign: 'center',
                                        background: isHighlighted ? '#fde68a' : '#f1f5f9',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: '#0f172a'
                                    }}
                                >
                                    {cell}
                                </div>
                            );
                        })
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GraphAnimation;
