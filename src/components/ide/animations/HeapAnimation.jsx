// HeapAnimation.jsx - DV-Flow v1.3 완전 대응 (SVG + D3 Zoom)
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';

const HeapAnimation = ({ data, currentStep, theme }) => {
    const svgRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(100);

    console.log('🔺 HeapAnimation 렌더링:', { currentStep, hasData: !!data });

    // 📊 현재까지의 힙 상태 구축 (DV-Flow v1.3)
    const heapState = useMemo(() => {
        if (!data?.events) return { nodes: [], size: 0 };

        let latestNodes = [];
        let heapSize = 0;

        console.log('🔍 힙 상태 구축 시작, 총 이벤트:', data.events.length);

        // currentStep까지 순회하며 최신 viz.nodes 찾기
        for (let i = 0; i <= currentStep && i < data.events.length; i++) {
            const event = data.events[i];

            // viz.nodes가 있으면 업데이트
            if (event.viz?.nodes) {
                latestNodes = event.viz.nodes;
                console.log(`✅ viz.nodes 발견 (event ${i}):`, latestNodes.length, '개 노드');
            }

            // heap.size 추적
            if (event.kind === 'assign' && event.var === 'heap.size') {
                heapSize = event.after;
            }
        }

        return { nodes: latestNodes, size: heapSize };
    }, [data, currentStep]);

    // 🎯 현재 이벤트에서 하이라이트할 노드
    const highlightInfo = useMemo(() => {
        if (!data?.events || currentStep >= data.events.length) {
            return { nodeId: null, type: null };
        }

        const event = data.events[currentStep];

        // ds_op 이벤트
        if (event.kind === 'ds_op' && event.target === 'heap') {
            if (event.op === 'insert') {
                // 삽입된 노드 (args[0]이 index, args[1]이 value)
                return { nodeId: event.args?.[0]?.toString(), type: 'insert' };
            }
            if (event.op === 'delete_max') {
                // 삭제 - 루트 노드
                return { nodeId: '1', type: 'delete' };
            }
        }

        // swap 이벤트
        if (event.kind === 'swap' && event.target === 'heap') {
            return {
                nodeId: event.indices?.[0]?.toString(),
                type: 'swap',
                secondId: event.indices?.[1]?.toString()
            };
        }

        // compare 이벤트
        if (event.kind === 'compare') {
            // "30 > parent(10)" 같은 비교
            return { nodeId: null, type: 'compare' };
        }

        return { nodeId: null, type: null };
    }, [data, currentStep]);

    // 🎨 D3 힙 트리 렌더링 + Zoom 기능
    useEffect(() => {
        if (heapState.nodes.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const width = svgRef.current?.clientWidth || 800;
        const height = svgRef.current?.clientHeight || 600;

        // Zoom 가능한 그룹
        const g = svg.append('g');

        // Zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.5, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                setZoomLevel(Math.round(event.transform.k * 100));
            });

        svg.call(zoom);

        // 힙을 트리 구조로 변환
        const treeData = buildHeapTree(heapState.nodes);

        // D3 계층 구조 생성
        const root = d3.hierarchy(treeData);

        // 트리 레이아웃 (폭 넓게)
        const treeLayout = d3.tree()
            .size([width - 100, height - 150])
            .separation((a, b) => (a.parent === b.parent ? 1.5 : 2));

        treeLayout(root);

        // 중앙 정렬을 위한 offset 계산
        const allX = root.descendants().map(d => d.x);
        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);
        const offsetX = (width - (maxX - minX)) / 2 - minX;

        // 링크 (엣지) 그리기
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

        // 노드 그룹
        const node = g.selectAll('g.node')
            .data(root.descendants())
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x + offsetX},${d.y + 50})`);

        // 노드 원
        node.append('circle')
            .attr('r', 25)
            .attr('fill', d => {
                const isHighlighted = d.data.id === highlightInfo.nodeId;
                const isSecondHighlight = d.data.id === highlightInfo.secondId;

                if (isHighlighted) {
                    if (highlightInfo.type === 'insert') return '#22c55e'; // 녹색
                    if (highlightInfo.type === 'delete') return '#ef4444'; // 빨간색
                    if (highlightInfo.type === 'swap') return '#f59e0b'; // 주황색
                }
                if (isSecondHighlight && highlightInfo.type === 'swap') {
                    return '#f59e0b'; // 주황색
                }

                return theme?.colors?.primary || '#8b5cf6'; // 기본 보라색
            })
            .attr('stroke', '#0f172a')
            .attr('stroke-width', 2)
            .style('transition', 'all 0.3s ease');

        // 노드 값 텍스트
        node.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', 5)
            .attr('font-size', 16)
            .attr('font-weight', '700')
            .attr('fill', 'white')
            .text(d => d.data.value);

        // 노드 ID 텍스트 (아래)
        node.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', -35)
            .attr('font-size', 11)
            .attr('fill', theme?.colors?.textLight || '#64748b')
            .text(d => `[${d.data.id}]`);

    }, [heapState, highlightInfo, theme]);

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
            return '힙 초기 상태';
        }

        const event = data.events[currentStep];

        switch (event.kind) {
            case 'ds_op':
                if (event.op === 'insert') {
                    return `힙에 삽입: ${event.args?.[1] ?? '?'}`;
                }
                if (event.op === 'delete_max') {
                    return '최대값 삭제 (루트 제거)';
                }
                return '힙 연산';
            case 'swap':
                return `노드 교환: [${event.indices?.join(' ↔ ')}]`;
            case 'compare':
                return `값 비교: ${event.expr}`;
            case 'assign':
                if (event.var === 'heap.size') {
                    return `힙 크기 업데이트: ${event.after}`;
                }
                return `변수 할당: ${event.var}`;
            case 'call':
                return `함수 호출: ${event.fn}()`;
            case 'return':
                return `함수 반환: ${event.fn}()`;
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
            position: 'relative',
            minHeight: '600px'
        }}>
            {heapState.nodes.length > 0 ? (
                <>
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
                                background: '#8b5cf6',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: 'bold'
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
                                background: '#8b5cf6',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '18px',
                                fontWeight: 'bold'
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
                                fontSize: '14px'
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
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        zIndex: 10
                    }}>
                        <strong>Step {currentStep + 1} / {data?.events?.length || 0}:</strong> {description}
                    </div>

                    {/* 힙 정보 */}
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '20px',
                        background: 'rgba(255, 255, 255, 0.95)',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        zIndex: 10
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
                        position: 'absolute',
                        bottom: '20px',
                        right: '20px',
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
                </>
            ) : (
                <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔺</div>
                    <p>힙이 비어있습니다</p>
                </div>
            )}
        </div>
    );
};

// 🛠️ 헬퍼 함수: 힙 배열을 트리 구조로 변환
function buildHeapTree(nodes) {
    if (nodes.length === 0) return null;

    // heap.json 구조:
    // {"id": "1", "value": 30, "children": [2, 3]}

    const nodeMap = new Map();
    nodes.forEach(node => {
        nodeMap.set(node.id, {
            id: node.id,
            value: node.value,
            children: []
        });
    });

    // children 연결
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

    // 루트 노드 반환 (id가 "1"인 노드)
    return nodeMap.get("1") || nodeMap.values().next().value;
}

export default HeapAnimation;