// GraphAnimation.jsx - 정적 원형 레이아웃 (Force Simulation 제거)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

const GraphAnimation = ({ data, currentStep, theme }) => {
    const svgRef = useRef(null);
    const gRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(100);
    const zoomBehaviorRef = useRef(null);
    const currentTransformRef = useRef(d3.zoomIdentity);

    const graphState = useMemo(() => {
        if (!data?.events) return { vertexCount: 0, edges: [], adjacency: [] };

        let vertexCount = 0;
        const edges = [];
        const adjacencyMap = new Map();

        for (let i = 0; i <= currentStep && i < data.events.length; i++) {
            const event = data.events[i];

            if (event.kind === 'assign' && event.var === 'g->n') {
                vertexCount = event.after;
            }

            if (event.kind === 'ds_op' && event.target === 'g->adj_mat' && event.op === 'set') {
                const [from, to, value] = event.args;
                if (value === 1) {
                    const edgeKey = `${Math.min(from, to)}-${Math.max(from, to)}`;
                    if (!adjacencyMap.has(edgeKey)) {
                        edges.push([from, to]);
                        adjacencyMap.set(edgeKey, true);
                    }
                }
            }
        }

        const adjacency = Array(vertexCount).fill(0).map(() => Array(vertexCount).fill(0));
        edges.forEach(([from, to]) => {
            adjacency[from][to] = 1;
            adjacency[to][from] = 1;
        });

        return { vertexCount, edges, adjacency };
    }, [data, currentStep]);

    const highlightedEdge = useMemo(() => {
        if (!data?.events || currentStep >= data.events.length) return null;
        const event = data.events[currentStep];
        if (event.kind === 'ds_op' && event.target === 'g->adj_mat' && event.op === 'set') {
            const [from, to, value] = event.args;
            if (value === 1) return [from, to];
        }
        return null;
    }, [data, currentStep]);

    useEffect(() => {
        const svgElement = svgRef.current;
        if (!svgElement) return;

        const svg = d3.select(svgElement);

        if (!gRef.current) {
            gRef.current = svg.append('g');
        }

        const g = gRef.current;

        if (!zoomBehaviorRef.current) {
            const zoom = d3.zoom()
                .scaleExtent([0.5, 3])
                .on('zoom', (event) => {
                    g.attr('transform', event.transform);
                    currentTransformRef.current = event.transform;
                    setZoomLevel(Math.round(event.transform.k * 100));
                });

            zoomBehaviorRef.current = zoom;
            svg.call(zoom);
        }

        g.attr('transform', currentTransformRef.current);
        g.selectAll('*').remove();

        if (zoomBehaviorRef.current) {
            svg.call(zoomBehaviorRef.current.transform, currentTransformRef.current);
        }

        if (graphState.vertexCount === 0) return;

        const svgElementRef = svgRef.current;
        const width = svgElementRef?.clientWidth || 800;
        const height = svgElementRef?.clientHeight || 600;

        // 정적 원형 레이아웃 계산
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.35;

        const nodes = Array.from({ length: graphState.vertexCount }, (_, id) => {
            const angle = (id / graphState.vertexCount) * 2 * Math.PI - Math.PI / 2;
            return {
                id,
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        });

        const links = graphState.edges.map(([source, target]) => ({
            source: nodes[source],
            target: nodes[target],
            highlighted: highlightedEdge && (
                (highlightedEdge[0] === source && highlightedEdge[1] === target) ||
                (highlightedEdge[0] === target && highlightedEdge[1] === source)
            )
        }));

        // 간선 그리기
        g.selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y)
            .attr('stroke', d => d.highlighted ? '#f97316' : '#94a3b8')
            .attr('stroke-width', d => d.highlighted ? 4 : 2)
            .style('transition', 'stroke 0.3s, stroke-width 0.3s');

        // 노드 그리기
        const nodeGroups = g.selectAll('g.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`);

        nodeGroups.append('circle')
            .attr('r', 30)
            .attr('fill', '#60a5fa')
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer');

        nodeGroups.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('font-size', 18)
            .attr('font-weight', '600')
            .attr('fill', '#0f172a')
            .text(d => d.id);

    }, [graphState, highlightedEdge]);

    useEffect(() => () => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();
        gRef.current = null;
        zoomBehaviorRef.current = null;
        currentTransformRef.current = d3.zoomIdentity;
    }, []);

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
        if (!data?.events || currentStep >= data.events.length) return '그래프 초기 상태';
        const event = data.events[currentStep];
        switch (event.kind) {
            case 'call': return `함수 호출: ${event.fn}()`;
            case 'assign':
                if (event.var === 'g->n') return `정점 추가 완료 (총 ${event.after}개)`;
                return `변수 할당: ${event.var}`;
            case 'ds_op':
                if (event.target === 'g->adj_mat' && event.op === 'set') {
                    const [from, to, value] = event.args;
                    if (value === 1) return `간선 추가: ${from} ↔ ${to}`;
                }
                return '그래프 연산';
            case 'compare': return `조건 비교: ${event.expr}`;
            case 'loopIter': return `반복 ${event.loop.iter + 1}/${event.loop.total}`;
            case 'io': return '출력 중...';
            default: return `이벤트: ${event.kind}`;
        }
    };

    const description = getDescription();

    // 초기 빈 상태
    if (!data?.events || graphState.vertexCount === 0) {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                minHeight: '600px'
            }}>
                <svg
                    ref={svgRef}
                    width="100%"
                    height="100%"
                    style={{
                        background: '#f1f5f9',
                        cursor: 'grab',
                        minHeight: '600px'
                    }}
                />

                {/* Zoom 컨트롤 (비활성화) */}
                <div style={{
                    position: 'absolute', top: '20px', right: '20px',
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    background: 'white', padding: '8px', borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0', zIndex: 10, opacity: 0.5
                }}>
                    <button disabled style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', background: '#3b82f6', color: 'white', cursor: 'not-allowed', fontSize: '18px', fontWeight: 'bold' }}>+</button>
                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textAlign: 'center', padding: '4px 0' }}>100%</div>
                    <button disabled style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', background: '#3b82f6', color: 'white', cursor: 'not-allowed', fontSize: '18px', fontWeight: 'bold' }}>−</button>
                    <button disabled style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', background: '#64748b', color: 'white', cursor: 'not-allowed', fontSize: '14px' }}>⟲</button>
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
            minHeight: '600px'
        }}>
            <svg ref={svgRef} width="100%" height="100%" style={{ background: '#f1f5f9', cursor: 'grab', minHeight: '600px' }} />

            {/* Zoom 컨트롤 */}
            <div style={{
                position: 'absolute', top: '20px', right: '20px',
                display: 'flex', flexDirection: 'column', gap: '8px',
                background: 'white', padding: '8px', borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', zIndex: 10
            }}>
                <button onClick={handleZoomIn} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', background: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>+</button>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', textAlign: 'center', padding: '4px 0' }}>{zoomLevel}%</div>
                <button onClick={handleZoomOut} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', background: '#3b82f6', color: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>−</button>
                <button onClick={handleZoomReset} style={{ width: '32px', height: '32px', border: 'none', borderRadius: '6px', background: '#64748b', color: 'white', cursor: 'pointer', fontSize: '14px' }}>⟲</button>
            </div>

            {/* 현재 단계 */}
            <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255, 255, 255, 0.95)', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', color: theme?.colors?.text || '#1e293b', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 10 }}>
                <strong>Step {currentStep + 1} / {data?.events?.length || 0}:</strong>
                <div style={{ marginTop: '4px', fontSize: '12px' }}>이벤트: {description}</div>
            </div>

            {/* 사용법 안내 */}
            <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(255, 255, 255, 0.9)', padding: '8px 12px', borderRadius: '6px', fontSize: '11px', color: '#64748b', border: '1px solid #e2e8f0', zIndex: 10 }}>
                💡 <strong>마우스 휠</strong>로 확대/축소, <strong>드래그</strong>로 이동
            </div>

            {/* 그래프 정보 */}
            <div style={{ position: 'absolute', bottom: '20px', right: '20px', background: 'rgba(255, 255, 255, 0.95)', padding: '12px 16px', borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 10 }}>
                <div style={{ marginBottom: '6px' }}>
                    <strong>정점 수:</strong> {graphState.vertexCount}
                </div>
                <div>
                    <strong>간선 수:</strong> {graphState.edges.length}
                </div>
            </div>
        </div>
    );
};

export default GraphAnimation;