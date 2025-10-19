// BinaryTreeAnimation.jsx - Zoom 상태 유지 + 빈 캔버스 초기 상태
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

const BinaryTreeAnimation = ({ data, currentStep, theme }) => {
    const svgRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(100);
    const zoomBehaviorRef = useRef(null);
    const currentTransformRef = useRef(d3.zoomIdentity);

    console.log('🌳 BinaryTreeAnimation 렌더링:', { currentStep, hasData: !!data });

    const treeState = useMemo(() => {
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
        }

        if (event.kind === 'compare') {
            const nodeRef = event.read?.[1]?.ref;
            if (nodeRef?.includes('->data')) {
                const compareValue = event.read?.[1]?.value;
                const foundNode = treeState.nodes.find(n => n.value === compareValue);
                return { nodeId: foundNode?.id, type: 'compare' };
            }
        }

        return { nodeId: null, type: null };
    }, [data, currentStep, treeState]);

    const treeLayout = useMemo(() => {
        if (treeState.nodes.length === 0) return { nodes: [], links: [] };

        const nodeMap = new Map();
        treeState.nodes.forEach(node => {
            nodeMap.set(node.id, { ...node });
        });

        const rootNode = treeState.nodes[0];
        if (!rootNode) return { nodes: [], links: [] };

        const layoutNodes = [];
        const links = [];

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

        const maxDepth = Math.max(...treeState.nodes.map((_, idx) => Math.floor(Math.log2(idx + 1))));
        const initialSpace = Math.pow(2, maxDepth) * 50;

        layoutTree(rootNode.id, 400, 80, 0, initialSpace);

        return { nodes: layoutNodes, links };
    }, [treeState]);

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        if (treeLayout.nodes.length === 0) return;

        const svgElement = svgRef.current;
        const width = svgElement?.clientWidth || 800;
        const height = svgElement?.clientHeight || 600;

        const g = svg.append('g');

        const zoom = d3.zoom()
            .scaleExtent([0.3, 2])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                currentTransformRef.current = event.transform;
                setZoomLevel(Math.round(event.transform.k * 100));
            });

        zoomBehaviorRef.current = zoom;
        svg.call(zoom);
        svg.call(zoom.transform, currentTransformRef.current);

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

        const nodes = g.selectAll('g.node')
            .data(treeLayout.nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x}, ${d.y})`);

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

        nodes.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .attr('font-size', 16)
            .attr('font-weight', '700')
            .attr('fill', 'white')
            .text(d => d.value);

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
        if (!data?.events || currentStep >= data.events.length) {
            return '이진 탐색 트리 초기 상태';
        }

        const event = data.events[currentStep];

        switch (event.kind) {
            case 'ds_op':
                if (event.op === 'insert') return `노드 삽입: 값 ${event.args?.[1] ?? '?'}`;
                return `트리 연산: ${event.op}`;
            case 'compare': return `값 비교: ${event.expr}`;
            case 'call':
                if (event.fn === 'insert') return `삽입 함수 호출: ${event.args?.find(a => a.name === 'data')?.value}`;
                if (event.fn === 'createNode') return `노드 생성: ${event.args?.[0]?.value}`;
                return `함수 호출: ${event.fn}()`;
            case 'io': return `출력: ${event.data}`;
            case 'note': return event.text;
            default: return `이벤트: ${event.kind}`;
        }
    };

    const description = getDescription();

    // 초기 빈 상태
    if (!data?.events || treeState.nodes.length === 0) {
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

            {/* 현재 단계 */}
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

            {/* 사용법 안내 */}
            <div style={{
                position: 'absolute', bottom: '20px', left: '20px',
                background: 'rgba(255, 255, 255, 0.9)',
                padding: '8px 12px', borderRadius: '6px', fontSize: '11px',
                color: '#64748b', border: '1px solid #e2e8f0', zIndex: 10
            }}>
                💡 <strong>마우스 휠</strong>로 확대/축소, <strong>드래그</strong>로 이동
            </div>

            {/* 트리 정보 */}
            <div style={{
                position: 'absolute', bottom: '20px', right: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '12px 16px', borderRadius: '8px', fontSize: '12px',
                border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 10
            }}>
                <div style={{ marginBottom: '6px' }}>
                    <strong>노드 수:</strong> {treeState.nodes.length}
                </div>
                <div>
                    <strong>루트:</strong> {treeState.nodes[0]?.value || 'NULL'}
                </div>
            </div>
        </div>
    );
};

export default BinaryTreeAnimation;