// GraphAnimation.jsx - DV-Flow v1.3 + SVG Zoom 기능
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

const GraphAnimation = ({ data, currentStep, theme }) => {
    const svgRef = useRef(null);
    const gRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(1);

    console.log('🕸️ GraphAnimation 렌더링:', { currentStep, hasData: !!data });

    // 📊 현재까지의 그래프 상태 구축
    const graphState = useMemo(() => {
        if (!data?.events) return { vertexCount: 0, edges: [], adjacency: [] };

        let vertexCount = 0;
        const edges = [];
        const adjacencyMap = new Map();

        console.log('🔍 그래프 상태 구축 시작, 총 이벤트:', data.events.length);

        // currentStep까지의 이벤트를 순회하며 그래프 상태 구축
        for (let i = 0; i <= currentStep && i < data.events.length; i++) {
            const event = data.events[i];

            // 정점 추가 (insert_vertex)
            if (event.kind === 'assign' && event.var === 'g->n') {
                vertexCount = event.after;
                console.log(`✅ 정점 개수 업데이트: ${vertexCount}`);
            }

            // 간선 추가 (ds_op with target 'g->adj_mat')
            if (event.kind === 'ds_op' && event.target === 'g->adj_mat' && event.op === 'set') {
                const [from, to, value] = event.args;
                if (value === 1) {
                    // 간선 추가 (중복 방지)
                    const edgeKey = `${Math.min(from, to)}-${Math.max(from, to)}`;
                    if (!adjacencyMap.has(edgeKey)) {
                        edges.push([from, to]);
                        adjacencyMap.set(edgeKey, true);
                        console.log(`✅ 간선 추가: ${from} - ${to}`);
                    }
                }
            }
        }

        console.log('📊 최종 그래프 상태:', { vertexCount, edgeCount: edges.length });

        // 인접 행렬 생성
        const adjacency = Array(vertexCount).fill(0).map(() => Array(vertexCount).fill(0));
        edges.forEach(([from, to]) => {
            adjacency[from][to] = 1;
            adjacency[to][from] = 1; // 무방향 그래프
        });

        return { vertexCount, edges, adjacency };
    }, [data, currentStep]);

    // 🎯 현재 이벤트에서 하이라이트할 간선
    const highlightedEdge = useMemo(() => {
        if (!data?.events || currentStep >= data.events.length) return null;

        const event = data.events[currentStep];

        // ds_op 이벤트에서 간선 추가 중인 경우
        if (event.kind === 'ds_op' && event.target === 'g->adj_mat' && event.op === 'set') {
            const [from, to, value] = event.args;
            if (value === 1) {
                return [from, to];
            }
        }

        return null;
    }, [data, currentStep]);

    // 🎨 D3 그래프 렌더링 + Zoom 기능
    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        if (graphState.vertexCount === 0) {
            return;
        }

        // SVG 크기를 동적으로 가져오기
        const svgElement = svgRef.current;
        const width = svgElement?.clientWidth || 800;
        const height = svgElement?.clientHeight || 600;

        // 줌 가능한 그룹 (먼저 생성)
        const g = svg.append('g');
        gRef.current = g.node();

        // Zoom behavior 설정 (g를 생성한 후)
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3]) // 50% ~ 300% 확대
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                setZoomLevel(Math.round(event.transform.k * 100));
            });

        svg.call(zoom);

        const nodes = Array.from({ length: graphState.vertexCount }, (_, id) => ({ id }));
        const links = graphState.edges.map(([source, target]) => ({
            source,
            target,
            highlighted: highlightedEdge && (
                (highlightedEdge[0] === source && highlightedEdge[1] === target) ||
                (highlightedEdge[0] === target && highlightedEdge[1] === source)
            )
        }));

        const simulation = d3.forceSimulation(nodes)
            .force('charge', d3.forceManyBody().strength(-500))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('link', d3.forceLink(links).id(d => d.id).distance(150))
            .force('collision', d3.forceCollide().radius(50));

        // 간선
        const link = g.selectAll('line')
            .data(links)
            .enter()
            .append('line')
            .attr('stroke', d => d.highlighted ? '#f97316' : '#94a3b8')
            .attr('stroke-width', d => d.highlighted ? 4 : 2);

        // 노드
        const node = g.selectAll('circle')
            .data(nodes)
            .enter()
            .append('circle')
            .attr('r', 30)
            .attr('fill', '#60a5fa')
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 2)
            .style('cursor', 'pointer')
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        // 레이블
        const label = g.selectAll('text')
            .data(nodes)
            .enter()
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('font-size', 18)
            .attr('font-weight', '600')
            .attr('fill', '#0f172a')
            .attr('pointer-events', 'none')
            .text(d => d.id);

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

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
                .attr('y', d => (d.y ?? 0) + 6);
        });

        return () => simulation.stop();
    }, [graphState, highlightedEdge]);

    // 🔍 Zoom 컨트롤 함수
    const handleZoomIn = () => {
        const svg = d3.select(svgRef.current);
        svg.transition().call(d3.zoom().scaleBy, 1.3);
    };

    const handleZoomOut = () => {
        const svg = d3.select(svgRef.current);
        svg.transition().call(d3.zoom().scaleBy, 0.7);
    };

    const handleZoomReset = () => {
        const svg = d3.select(svgRef.current);
        svg.transition().call(d3.zoom().transform, d3.zoomIdentity);
        setZoomLevel(100);
    };

    // 📝 현재 이벤트 설명
    const getDescription = () => {
        if (!data?.events || currentStep >= data.events.length) {
            return '그래프 초기 상태';
        }

        const event = data.events[currentStep];

        switch (event.kind) {
            case 'call':
                return `함수 호출: ${event.fn}()`;
            case 'assign':
                if (event.var === 'g->n') {
                    return `정점 추가 완료 (총 ${event.after}개)`;
                }
                return `변수 할당: ${event.var}`;
            case 'ds_op':
                if (event.target === 'g->adj_mat' && event.op === 'set') {
                    const [from, to, value] = event.args;
                    if (value === 1) {
                        return `간선 추가: ${from} ↔ ${to}`;
                    }
                }
                return '그래프 연산';
            case 'compare':
                return `조건 비교: ${event.expr}`;
            case 'loopIter':
                return `반복 ${event.loop.iter + 1}/${event.loop.total}`;
            case 'io':
                return '출력 중...';
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
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
        }}>
            {graphState.vertexCount > 0 ? (
                <>
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

                    {/* Zoom 컨트롤 버튼 */}
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
                        <button
                            onClick={handleZoomIn}
                            style={{
                                width: '32px',
                                height: '32px',
                                border: 'none',
                                borderRadius: '6px',
                                background: '#3b82f6',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="확대"
                        >
                            +
                        </button>

                        <div style={{
                            fontSize: '11px',
                            fontWeight: '600',
                            color: '#64748b',
                            textAlign: 'center',
                            padding: '4px 0'
                        }}>
                            {zoomLevel}%
                        </div>

                        <button
                            onClick={handleZoomOut}
                            style={{
                                width: '32px',
                                height: '32px',
                                border: 'none',
                                borderRadius: '6px',
                                background: '#3b82f6',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="축소"
                        >
                            −
                        </button>

                        <button
                            onClick={handleZoomReset}
                            style={{
                                width: '32px',
                                height: '32px',
                                border: 'none',
                                borderRadius: '6px',
                                background: '#64748b',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="리셋"
                        >
                            ⟲
                        </button>
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
                </>
            ) : (
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>📊</div>
                    <p>그래프 초기화 중...</p>
                </div>
            )}
        </div>
    );
};

export default GraphAnimation;