// BinaryTreeAnimation.jsx - DV-Flow v1.3 (SVG + D3 Zoom)
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

const BinaryTreeAnimation = ({ data, currentStep, theme }) => {
    const svgRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(100);

    console.log('🌳 BinaryTreeAnimation 렌더링:', { currentStep, hasData: !!data });

    // 📊 현재까지의 트리 상태 구축
    const treeState = useMemo(() => {
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
                return { nodeId: event.args?.[0], type: 'insert' };
            }
        }

        // compare 이벤트 (탐색 중)
        if (event.kind === 'compare') {
            const nodeRef = event.read?.[1]?.ref; // root->data
            if (nodeRef?.includes('->data')) {
                // 현재 비교 중인 노드 찾기 (값으로 추정)
                const compareValue = event.read?.[1]?.value;
                const foundNode = treeState.nodes.find(n => n.value === compareValue);
                return { nodeId: foundNode?.id, type: 'compare' };
            }
        }

        return { nodeId: null, type: null };
    }, [data, currentStep, treeState]);

    // 🌳 트리 레이아웃 계산
    const treeLayout = useMemo(() => {
        if (treeState.nodes.length === 0) return { nodes: [], links: [] };

        // 노드 맵 생성
        const nodeMap = new Map();
        treeState.nodes.forEach(node => {
            nodeMap.set(node.id, { ...node });
        });

        // 루트 찾기
        const rootNode = treeState.nodes[0];
        if (!rootNode) return { nodes: [], links: [] };

        // 트리 구조를 계층적으로 배치
        const layoutNodes = [];
        const links = [];

        const nodeWidth = 80;
        const nodeHeight = 60;
        const levelHeight = 120;

        function layoutTree(nodeId, x, y, level, horizontalSpace) {
            const node = nodeMap.get(nodeId);
            if (!node) return;

            layoutNodes.push({
                ...node,
                x,
                y,
                level
            });

            const childSpace = horizontalSpace / 2;

            if (node.left) {
                links.push({
                    source: { x, y },
                    target: { x: x - horizontalSpace / 2, y: y + levelHeight }
                });
                layoutTree(node.left, x - horizontalSpace / 2, y + levelHeight, level + 1, childSpace);
            }

            if (node.right) {
                links.push({
                    source: { x, y },
                    target: { x: x + horizontalSpace / 2, y: y + levelHeight }
                });
                layoutTree(node.right, x + horizontalSpace / 2, y + levelHeight, level + 1, childSpace);
            }
        }

        // 트리 깊이 계산
        const maxDepth = Math.max(...treeState.nodes.map((_, idx) => Math.floor(Math.log2(idx + 1))));
        const initialSpace = Math.pow(2, maxDepth) * 50;

        layoutTree(rootNode.id, 400, 80, 0, initialSpace);

        return { nodes: layoutNodes, links };
    }, [treeState]);

    // 🎨 D3 트리 렌더링 + Zoom
    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        if (treeLayout.nodes.length === 0) return;

        const svgElement = svgRef.current;
        const width = svgElement?.clientWidth || 800;
        const height = svgElement?.clientHeight || 600;

        // 줌 가능한 그룹
        const g = svg.append('g');

        // Zoom behavior 설정
        const zoom = d3.zoom()
            .scaleExtent([0.3, 2])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                setZoomLevel(Math.round(event.transform.k * 100));
            });

        svg.call(zoom);

        // 간선 (링크)
        g.selectAll('line')
            .data(treeLayout.links)
            .enter()
            .append('line')
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y)
            .attr('stroke', '#94a3b8')
            .attr('stroke-width', 2);

        // 노드
        const nodes = g.selectAll('g.node')
            .data(treeLayout.nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`);

        // 노드 원
        nodes.append('circle')
            .attr('r', 30)
            .attr('fill', d => {
                if (d.id === highlightInfo.nodeId) {
                    if (highlightInfo.type === 'insert') return '#22c55e';
                    if (highlightInfo.type === 'compare') return '#f59e0b';
                }
                return '#60a5fa';
            })
            .attr('stroke', d => d.id === highlightInfo.nodeId ? '#0f172a' : '#1e40af')
            .attr('stroke-width', d => d.id === highlightInfo.nodeId ? 3 : 2)
            .style('transition', 'all 0.3s');

        // 노드 값
        nodes.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('font-size', 16)
            .attr('font-weight', '700')
            .attr('fill', 'white')
            .text(d => d.value);

        // NULL 포인터 표시 (선택적)
        nodes.each(function(d) {
            const node = d3.select(this);

            if (!d.left) {
                node.append('text')
                    .attr('x', -40)
                    .attr('y', 50)
                    .attr('font-size', 10)
                    .attr('fill', '#94a3b8')
                    .text('∅');
            }

            if (!d.right) {
                node.append('text')
                    .attr('x', 40)
                    .attr('y', 50)
                    .attr('font-size', 10)
                    .attr('fill', '#94a3b8')
                    .text('∅');
            }
        });

    }, [treeLayout, highlightInfo]);

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
            return '이진 탐색 트리 초기 상태';
        }

        const event = data.events[currentStep];

        switch (event.kind) {
            case 'ds_op':
                if (event.op === 'insert') {
                    return `노드 삽입: 값 ${event.args?.[1] ?? '?'}`;
                }
                return `트리 연산: ${event.op}`;
            case 'compare':
                return `값 비교: ${event.expr}`;
            case 'call':
                if (event.fn === 'insert') {
                    return `삽입 함수 호출: ${event.args?.find(a => a.name === 'data')?.value}`;
                }
                if (event.fn === 'createNode') {
                    return `노드 생성: ${event.args?.[0]?.value}`;
                }
                return `함수 호출: ${event.fn}()`;
            case 'io':
                return `출력: ${event.data}`;
            case 'note':
                return event.text;
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
            {treeState.nodes.length > 0 ? (
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

                    {/* 트리 정보 */}
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
                        zIndex: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        <div style={{ fontWeight: '700', marginBottom: '4px' }}>트리 정보:</div>
                        <div>
                            <strong>노드 수:</strong> {treeState.nodes.length}
                        </div>
                        <div>
                            <strong>루트:</strong> {treeState.nodes[0]?.value || 'NULL'}
                        </div>
                        {highlightInfo.nodeId && (
                            <div style={{
                                marginTop: '6px',
                                padding: '6px',
                                background: highlightInfo.type === 'insert' ? '#f0fdf4' : '#fef3c7',
                                borderRadius: '4px',
                                border: `1px solid ${highlightInfo.type === 'insert' ? '#22c55e' : '#f59e0b'}`
                            }}>
                                <strong>{highlightInfo.type === 'insert' ? '🟢 삽입' : '🟡 비교'}</strong>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>🌳</div>
                    <p>트리가 비어있습니다</p>
                </div>
            )}
        </div>
    );
};

export default BinaryTreeAnimation;