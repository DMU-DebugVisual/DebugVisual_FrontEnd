// RecursionAnimation.jsx - Zoom 상태 유지 + 초기 빈 상태
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';

function formatArgs(args) {
    if (!args || args.length === 0) return '';
    return args.map(arg => (typeof arg === 'object' && arg.value !== undefined) ? arg.value : arg).join(', ');
}

function formatCallLabel(callOrEvent) {
    const fn = callOrEvent.fn || '?';
    const args = callOrEvent.args || [];
    const argValues = formatArgs(args);
    return `${fn}(${argValues})`;
}

function buildRecursionTree(events) {
    if (!events || events.length === 0) return { root: null, allNodes: new Map() };

    const allNodes = new Map();
    const callStack = [];
    let root = null;

    for (let i = 0; i < events.length; i++) {
        const event = events[i];

        if (event.kind === 'call') {
            const nodeId = i;
            const node = {
                id: nodeId,
                fn: event.fn,
                args: event.args,
                label: formatCallLabel(event),
                eventIndexCall: i,
                children: [],
                value: '?',
                eventIndexReturn: -1,
            };

            allNodes.set(nodeId, node);

            if (callStack.length > 0) {
                const parent = callStack[callStack.length - 1];
                parent.children.push(node);
            } else {
                root = node;
            }
            callStack.push(node);
        } else if (event.kind === 'return' && callStack.length > 0) {
            const node = callStack.pop();
            if (node) {
                node.eventIndexReturn = i;
                node.value = event.value;
            }
        }
    }
    return { root, allNodes };
}

const RecursionAnimation = ({ data, currentStep, theme }) => {
    const svgRef = useRef(null);
    const [zoomLevel, setZoomLevel] = useState(100);
    const zoomBehaviorRef = useRef(null); // Zoom 동작 저장
    const currentTransformRef = useRef(d3.zoomIdentity); // 현재 Transform 저장

    const memoizedTreeData = useMemo(() => {
        return buildRecursionTree(data?.events);
    }, [data]);

    const currentExecutionState = useMemo(() => {
        const activeStack = [];
        const completedSet = new Set();

        if (!data?.events) return { activeStack, completedSet };

        for (let i = 0; i <= currentStep; i++) {
            const event = data.events[i];
            if (event.kind === 'call') {
                activeStack.push(i);
            } else if (event.kind === 'return' && activeStack.length > 0) {
                const poppedId = activeStack.pop();
                if (poppedId !== undefined) {
                    completedSet.add(poppedId);
                }
            }
        }
        return { activeStack, completedSet };
    }, [data, currentStep]);

    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const { root } = memoizedTreeData;
        const { activeStack, completedSet } = currentExecutionState;

        if (!root) {
            return;
        }

        const width = svgRef.current?.clientWidth || 800;
        const height = svgRef.current?.clientHeight || 600;

        const g = svg.append('g');

        // Zoom behavior 설정
        const zoom = d3.zoom()
            .scaleExtent([0.3, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                currentTransformRef.current = event.transform; // Transform 저장
                setZoomLevel(Math.round(event.transform.k * 100));
            });

        zoomBehaviorRef.current = zoom;

        svg.call(zoom);

        // 저장된 Transform 복원
        svg.call(zoom.transform, currentTransformRef.current);

        const hierarchy = d3.hierarchy(root, d => d.children);
        const treeLayout = d3.tree().size([width - 150, height - 200]);
        treeLayout(hierarchy);

        const allX = hierarchy.descendants().map(d => d.x);
        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);
        const offsetX = (width - (maxX - minX)) / 2 - minX;
        const offsetY = 120;

        const activeNodeId = activeStack.length > 0 ? activeStack[activeStack.length - 1] : null;

        const visibleNodes = hierarchy.descendants().filter(d =>
            activeStack.includes(d.data.id) || completedSet.has(d.data.id)
        );
        const visibleNodeIds = new Set(visibleNodes.map(d => d.data.id));
        const visibleLinks = hierarchy.links().filter(l =>
            visibleNodeIds.has(l.source.data.id) && visibleNodeIds.has(l.target.data.id)
        );

        g.selectAll('path.link')
            .data(visibleLinks, l => `${l.source.data.id}-${l.target.data.id}`)
            .enter()
            .append('path')
            .attr('class', 'link')
            .attr('d', d3.linkVertical()
                .x(d => d.x + offsetX)
                .y(d => d.y + offsetY)
            )
            .attr('fill', 'none')
            .attr('stroke', theme?.colors?.border || '#cbd5e1')
            .attr('stroke-width', 2);

        const nodeEnter = g.selectAll('g.node')
            .data(visibleNodes, d => d.data.id)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x + offsetX},${d.y + offsetY})`);

        nodeEnter.append('circle').attr('r', 35);

        nodeEnter.append('text')
            .attr('class', 'label')
            .attr('text-anchor', 'middle')
            .attr('dy', 5)
            .attr('font-size', 13)
            .attr('font-weight', '700')
            .text(d => d.data.label);

        nodeEnter.append('text')
            .attr('class', 'value')
            .attr('text-anchor', 'middle')
            .attr('dy', 5)
            .attr('font-size', 14)
            .attr('font-weight', '700');

        const nodes = g.selectAll('g.node');

        nodes.select('circle')
            .transition().duration(200)
            .attr('fill', d => {
                if (d.data.id === activeNodeId) return '#f59e0b';
                if (activeStack.includes(d.data.id)) return theme?.colors?.primary || '#8b5cf6';
                if (completedSet.has(d.data.id)) return '#10b981';
                return '#e2e8f0';
            })
            .attr('stroke', d => (d.data.id === activeNodeId) ? '#d97706' : 'white')
            .attr('stroke-width', 3);

        nodes.select('text.label')
            .attr('fill', d => (activeStack.includes(d.data.id)) ? 'white' : '#334155')
            .style('display', d => completedSet.has(d.data.id) ? 'none' : 'block');

        nodes.select('text.value')
            .text(d => d.data.value)
            .attr('fill', 'white')
            .style('display', d => completedSet.has(d.data.id) ? 'block' : 'none');

    }, [memoizedTreeData, currentExecutionState, theme]);

    const handleZoom = (scale) => {
        const svg = d3.select(svgRef.current);
        svg.transition().call(zoomBehaviorRef.current.scaleBy, scale);
    };

    const handleZoomReset = () => {
        const svg = d3.select(svgRef.current);
        svg.transition().call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
        currentTransformRef.current = d3.zoomIdentity;
        setZoomLevel(100);
    };

    const getDescription = () => {
        if (!data?.events || currentStep >= data.events.length) return '재귀 초기 상태';
        const event = data.events[currentStep];
        switch (event.kind) {
            case 'call': return `함수 호출: ${formatCallLabel(event)} (depth: ${event.viz?.recursionDepth ?? '?'})`;
            case 'return': return `함수 반환: ${event.fn}() → ${event.value}`;
            case 'compare': return `조건 비교: ${event.expr} = ${event.result}`;
            case 'branch': return `분기: ${event.expr} = ${event.result}`;
            case 'note': return event.text;
            default: return `이벤트: ${event.kind}`;
        }
    };

    const description = getDescription();
    const maxDepth = memoizedTreeData.root ? d3.hierarchy(memoizedTreeData.root).height : 0;

    // 🎯 초기 빈 상태 (데이터 없을 때)
    if (!data?.events || data.events.length === 0) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '600px',
                color: theme?.colors?.textLight || '#64748b',
                padding: '40px',
                textAlign: 'center'
            }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>🌳</div>
                <h3 style={{ margin: '0 0 8px 0', color: theme?.colors?.text }}>재귀 호출 대기 중</h3>
                <p style={{ margin: 0 }}>재귀 함수 실행을 시작하세요</p>
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
                <button onClick={() => handleZoom(1.3)} style={{
                    width: '32px', height: '32px', border: 'none', borderRadius: '6px',
                    background: '#8b5cf6', color: 'white', cursor: 'pointer',
                    fontSize: '18px', fontWeight: 'bold'
                }}>+</button>
                <div style={{
                    fontSize: '11px', fontWeight: '600', color: '#64748b',
                    textAlign: 'center', padding: '4px 0'
                }}>{zoomLevel}%</div>
                <button onClick={() => handleZoom(0.7)} style={{
                    width: '32px', height: '32px', border: 'none', borderRadius: '6px',
                    background: '#8b5cf6', color: 'white', cursor: 'pointer',
                    fontSize: '18px', fontWeight: 'bold'
                }}>−</button>
                <button onClick={handleZoomReset} style={{
                    width: '32px', height: '32px', border: 'none', borderRadius: '6px',
                    background: '#64748b', color: 'white', cursor: 'pointer', fontSize: '14px'
                }}>⟲</button>
            </div>

            {/* 현재 단계 표시 */}
            <div style={{
                position: 'absolute', top: '20px', left: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '10px 16px', borderRadius: '8px', fontSize: '13px',
                border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 10
            }}>
                <strong>Step {currentStep + 1} / {data?.events?.length || 0}:</strong>
                <div style={{ marginTop: '4px', fontSize: '12px' }}>{description}</div>
            </div>

            {/* 재귀 정보 */}
            <div style={{
                position: 'absolute', bottom: '20px', right: '20px',
                background: 'rgba(255, 255, 255, 0.95)',
                padding: '12px 16px', borderRadius: '8px', fontSize: '12px',
                border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', zIndex: 10
            }}>
                <div style={{ marginBottom: '6px' }}>
                    <strong>현재 스택 깊이:</strong> {currentExecutionState.activeStack.length}
                </div>
                <div><strong>최대 깊이:</strong> {maxDepth}</div>
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

export default RecursionAnimation;