// HeapAnimation.jsx - Zoom 상태 유지 + 빈 캔버스 초기 상태
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';

const HeapAnimation = ({ data, currentStep, theme }) => {
    const svgRef = useRef(null);
    const gRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(100);
    const zoomBehaviorRef = useRef(null);
    const currentTransformRef = useRef(d3.zoomIdentity);

    console.log('📺 HeapAnimation 렌더링:', { currentStep, hasData: !!data });

    const heapState = useMemo(() => {
        if (!data?.events) return { nodes: [], size: 0 };

        let latestNodes = [];
        let heapSize = 0;

        for (let i = 0; i <= currentStep && i < data.events.length; i++) {
            const event = data.events[i];

            if (event.viz?.nodes) {
                latestNodes = event.viz.nodes;
            }

            if (event.kind === 'assign' && event.var === 'heap.size') {
                heapSize = event.after;
            }
        }

        return { nodes: latestNodes, size: heapSize };
    }, [data, currentStep]);

    const highlightInfo = useMemo(() => {
        if (!data?.events || currentStep >= data.events.length) {
            return { nodeId: null, type: null };
        }

        const event = data.events[currentStep];

        if (event.kind === 'ds_op' && event.target === 'heap') {
            if (event.op === 'insert') {
                return { nodeId: event.args?.[0]?.toString(), type: 'insert' };
            }
            if (event.op === 'delete_max') {
                return { nodeId: '1', type: 'delete' };
            }
        }

        if (event.kind === 'swap' && event.target === 'heap') {
            return {
                nodeId: event.indices?.[0]?.toString(),
                type: 'swap',
                secondId: event.indices?.[1]?.toString()
            };
        }

        return { nodeId: null, type: null };
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

        if (heapState.nodes.length === 0) return;

        const width = svgElement?.clientWidth || 800;
        const height = svgElement?.clientHeight || 600;

        const treeData = buildHeapTree(heapState.nodes);
        const root = d3.hierarchy(treeData);

        const treeLayout = d3.tree()
            .size([width - 100, height - 150])
            .separation((a, b) => (a.parent === b.parent ? 1.5 : 2));

        treeLayout(root);

        const allX = root.descendants().map(d => d.x);
        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);
        const offsetX = (width - (maxX - minX)) / 2 - minX;

        g.selectAll('path')
            .data(root.links())
            .enter()
            .append('path')
            .attr('d', d3.linkVertical()
                .x(d => d.x + offsetX)
                .y(d => d.y + 50)
            )
            .attr('fill', 'none')
            .attr('stroke', theme?.colors?.border || '#94a3b8')
            .attr('stroke-width', 2);

        const node = g.selectAll('g.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x + offsetX},${d.y + 50})`);

        node.append('circle')
            .attr('r', 25)
            .attr('fill', d => {
                const isHighlighted = d.data.id === highlightInfo.nodeId;
                const isSecondHighlight = d.data.id === highlightInfo.secondId;

                if (isHighlighted) {
                    if (highlightInfo.type === 'insert') return '#22c55e';
                    if (highlightInfo.type === 'delete') return '#ef4444';
                    if (highlightInfo.type === 'swap') return '#f59e0b';
                }
                if (isSecondHighlight && highlightInfo.type === 'swap') {
                    return '#f59e0b';
                }

                return theme?.colors?.primary || '#8b5cf6';
            })
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 2)
            .style('transition', 'all 0.3s ease');

        node.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', 5)
            .attr('font-size', 16)
            .attr('font-weight', '700')
            .attr('fill', 'white')
            .text(d => d.data.value);

        node.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', -35)
            .attr('font-size', 11)
            .attr('fill', theme?.colors?.textLight || '#64748b')
            .text(d => `[${d.data.id}]`);

    }, [heapState, highlightInfo, theme]);

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
        if (!data?.events || currentStep >= data.events.length) {
            return '힙 초기 상태';
        }

        const event = data.events[currentStep];

        switch (event.kind) {
            case 'ds_op':
                if (event.op === 'insert') return `힙에 삽입: ${event.args?.[1] ?? '?'}`;
                if (event.op === 'delete_max') return '최댓값 삭제 (루트 제거)';
                return '힙 연산';
            case 'swap': return `노드 교환: [${event.indices?.join(' ↔ ')}]`;
            case 'compare': return `값 비교: ${event.expr}`;
            case 'assign':
                if (event.var === 'heap.size') return `힙 크기 업데이트: ${event.after}`;
                return `변수 할당: ${event.var}`;
            case 'call': return `함수 호출: ${event.fn}()`;
            case 'return': return `함수 반환: ${event.fn}()`;
            default: return `이벤트: ${event.kind}`;
        }
    };

    const description = getDescription();

    // 초기 빈 상태 - Sort/Graph처럼 빈 캔버스
    if (!data?.events || heapState.nodes.length === 0) {
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
                        background: theme?.colors?.cardSecondary || '#f1f5f9',
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
                        background: '#8b5cf6', color: 'white', cursor: 'not-allowed',
                        fontSize: '18px', fontWeight: 'bold'
                    }}>+</button>
                    <div style={{
                        fontSize: '11px', fontWeight: '600', color: '#64748b',
                        textAlign: 'center', padding: '4px 0'
                    }}>100%</div>
                    <button disabled style={{
                        width: '32px', height: '32px', border: 'none', borderRadius: '6px',
                        background: '#8b5cf6', color: 'white', cursor: 'not-allowed',
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
                    background: theme?.colors?.cardSecondary || '#f1f5f9',
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
                    background: '#8b5cf6', color: 'white', cursor: 'pointer',
                    fontSize: '18px', fontWeight: 'bold'
                }}>+</button>
                <div style={{
                    fontSize: '11px', fontWeight: '600', color: '#64748b',
                    textAlign: 'center', padding: '4px 0'
                }}>{zoomLevel}%</div>
                <button onClick={handleZoomOut} style={{
                    width: '32px', height: '32px', border: 'none', borderRadius: '6px',
                    background: '#8b5cf6', color: 'white', cursor: 'pointer',
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
                border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 10
            }}>
                <strong>Step {currentStep + 1} / {data?.events?.length || 0}:</strong>
                <div style={{ marginTop: '4px', fontSize: '12px' }}>이벤트: {description}</div>
            </div>

            {/* 힙 정보 */}
            <div style={{
                position: 'absolute', bottom: '20px', right: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '12px 16px', borderRadius: '8px', fontSize: '12px',
                border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 10
            }}>
                <div style={{ marginBottom: '6px' }}>
                    <strong>힙 크기:</strong> {heapState.size}
                </div>
                <div>
                    <strong>노드 개수:</strong> {heapState.nodes.length}
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

function buildHeapTree(nodes) {
    if (nodes.length === 0) return null;

    const nodeMap = new Map();
    nodes.forEach(node => {
        nodeMap.set(node.id, {
            id: node.id,
            value: node.value,
            children: []
        });
    });

    nodes.forEach(node => {
        const current = nodeMap.get(node.id);
        if (node.children && Array.isArray(node.children)) {
            node.children.forEach(childId => {
                const child = nodeMap.get(childId.toString());
                if (child) {
                    current.children.push(child);
                }
            });
        }
    });

    return nodeMap.get("1") || nodeMap.values().next().value;
}

export default HeapAnimation;