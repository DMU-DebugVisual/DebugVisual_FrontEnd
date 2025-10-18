// RecursionAnimation.jsx - "동적 트리 뷰"로 개선된 버전
import React, { useEffect, useRef, useMemo, useState } from 'react';
import * as d3 from 'd3';

// 헬퍼: args 배열을 문자열로 변환
function formatArgs(args) {
    if (!args || args.length === 0) return '';
    return args.map(arg => (typeof arg === 'object' && arg.value !== undefined) ? arg.value : arg).join(', ');
}

// 헬퍼: 함수 호출을 보기 좋은 라벨로 포맷
function formatCallLabel(callOrEvent) {
    const fn = callOrEvent.fn || '?';
    const args = callOrEvent.args || [];
    const argValues = formatArgs(args);
    return `${fn}(${argValues})`;
}

// 헬퍼: 전체 이벤트에서 정적 트리 구조를 한 번만 파싱
function buildRecursionTree(events) {
    if (!events || events.length === 0) return { root: null, allNodes: new Map() };

    const allNodes = new Map();
    const callStack = [];
    let root = null;

    for (let i = 0; i < events.length; i++) {
        const event = events[i];

        if (event.kind === 'call') {
            const nodeId = i; // 이벤트 인덱스를 고유 ID로 사용
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
                root = node; // 첫 번째 호출이 루트
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
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    // 1. [정적] 전체 이벤트에서 재귀 트리 구조를 미리 파싱 (한 번만)
    const memoizedTreeData = useMemo(() => {
        console.log('🌳 1. buildRecursionTree 실행 (최초 1회)');
        return buildRecursionTree(data?.events);
    }, [data]);

    // 2. [동적] currentStep에 따라 현재 실행 상태(스택, 완료 목록) 계산
    const currentExecutionState = useMemo(() => {
        const activeStack = []; // 현재 콜 스택에 있는 노드 ID(eventIndexCall)
        const completedSet = new Set(); // 반환이 완료된 노드 ID

        if (!data?.events) return { activeStack, completedSet };

        for (let i = 0; i <= currentStep; i++) {
            const event = data.events[i];
            if (event.kind === 'call') {
                activeStack.push(i); // 'call' 이벤트의 인덱스(i)가 노드 ID
            } else if (event.kind === 'return' && activeStack.length > 0) {
                const poppedId = activeStack.pop();
                if (poppedId !== undefined) {
                    completedSet.add(poppedId);
                }
            }
        }
        return { activeStack, completedSet };
    }, [data, currentStep]);

    // 3. [렌더링] D3.js로 시각화
    useEffect(() => {
        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear SVG

        const { root } = memoizedTreeData;
        const { activeStack, completedSet } = currentExecutionState;

        if (!root) {
            svg.append('text').attr('x', '50%').attr('y', '50%').attr('text-anchor', 'middle').text('재귀 호출 데이터가 없습니다.');
            return;
        }

        const width = svgRef.current?.clientWidth || 800;
        const height = svgRef.current?.clientHeight || 600;
        setDimensions({ width, height });

        const g = svg.append('g'); // Zoom/Pan 그룹

        const hierarchy = d3.hierarchy(root, d => d.children);
        const treeLayout = d3.tree().size([width - 150, height - 200]);
        treeLayout(hierarchy);

        // 중앙 정렬
        const allX = hierarchy.descendants().map(d => d.x);
        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);
        const offsetX = (width - (maxX - minX)) / 2 - minX;
        const offsetY = 120; // 상단 여백

        // 현재 활성화된 노드 ID (스택의 최상단)
        const activeNodeId = activeStack.length > 0 ? activeStack[activeStack.length - 1] : null;

        // 렌더링할 노드/링크 필터링 (호출되었거나 완료된 것만)
        const visibleNodes = hierarchy.descendants().filter(d =>
            activeStack.includes(d.data.id) || completedSet.has(d.data.id)
        );
        const visibleNodeIds = new Set(visibleNodes.map(d => d.data.id));
        const visibleLinks = hierarchy.links().filter(l =>
            visibleNodeIds.has(l.source.data.id) && visibleNodeIds.has(l.target.data.id)
        );

        // --- 링크 그리기 ---
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

        // --- 노드 그룹 그리기 ---
        const nodeEnter = g.selectAll('g.node')
            .data(visibleNodes, d => d.data.id)
            .enter()
            .append('g')
            .attr('class', 'node')
            .attr('transform', d => `translate(${d.x + offsetX},${d.y + offsetY})`);

        // 노드 원
        nodeEnter.append('circle')
            .attr('r', 35);

        // 노드 라벨 (예: "fibo(5)")
        nodeEnter.append('text')
            .attr('class', 'label')
            .attr('text-anchor', 'middle')
            .attr('dy', 5)
            .attr('font-size', 13)
            .attr('font-weight', '700')
            .text(d => d.data.label);

        // 반환값 텍스트 (예: "5")
        nodeEnter.append('text')
            .attr('class', 'value')
            .attr('text-anchor', 'middle')
            .attr('dy', 5)
            .attr('font-size', 14)
            .attr('font-weight', '700');

        // --- 상태에 따른 스타일 업데이트 ---
        const nodes = g.selectAll('g.node');

        nodes.select('circle')
            .transition().duration(200)
            .attr('fill', d => {
                if (d.data.id === activeNodeId) return '#f59e0b'; // 1. 활성 (스택 Top)
                if (activeStack.includes(d.data.id)) return theme?.colors?.primary || '#8b5cf6'; // 2. 대기 (스택 내)
                if (completedSet.has(d.data.id)) return '#10b981'; // 3. 완료 (반환됨)
                return '#e2e8f0'; // 4. (보이지 않아야 함)
            })
            .attr('stroke', d => (d.data.id === activeNodeId) ? '#d97706' : 'white')
            .attr('stroke-width', 3);

        nodes.select('text.label')
            .attr('fill', d => (activeStack.includes(d.data.id)) ? 'white' : '#334155')
            .style('display', d => completedSet.has(d.data.id) ? 'none' : 'block'); // 완료되면 라벨 숨김

        nodes.select('text.value')
            .text(d => d.data.value)
            .attr('fill', 'white')
            .style('display', d => completedSet.has(d.data.id) ? 'block' : 'none'); // 완료되면 값 표시

        // Zoom 설정
        const zoom = d3.zoom()
            .scaleExtent([0.3, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                setZoomLevel(Math.round(event.transform.k * 100));
            });

        svg.call(zoom);
        // D3가 초기 줌 레벨을 1로 설정하도록 강제
        svg.call(zoom.transform, d3.zoomIdentity);

    }, [memoizedTreeData, currentExecutionState, theme]);

    // 🔍 Zoom 컨트롤
    const handleZoom = (scale) => {
        d3.select(svgRef.current).transition().call(d3.zoom().scaleBy, scale);
    };
    const handleZoomReset = () => {
        d3.select(svgRef.current).transition().call(d3.zoom().transform, d3.zoomIdentity);
        setZoomLevel(100);
    };

    // 📝 현재 이벤트 설명
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

            {/* 뷰 토글 제거됨 */}

            {/* Zoom 컨트롤 */}
            <div style={controlsContainerStyle}>
                <button onClick={() => handleZoom(1.3)} style={zoomButtonStyle}>+</button>
                <div style={zoomLevelStyle}>{zoomLevel}%</div>
                <button onClick={() => handleZoom(0.7)} style={zoomButtonStyle}>−</button>
                <button onClick={handleZoomReset} style={{...zoomButtonStyle, background: '#64748b'}}>⟲</button>
            </div>

            {/* 현재 단계 표시 */}
            <div style={infoBoxStyle(20, 20)}>
                <strong>Step {currentStep + 1} / {data?.events?.length || 0}:</strong>
                <div style={{ marginTop: '4px', fontSize: '12px' }}>{description}</div>
            </div>

            {/* 재귀 정보 */}
            <div style={infoBoxStyle(null, 20, 20)}>
                <div style={{ marginBottom: '6px' }}>
                    <strong>현재 스택 깊이:</strong> {currentExecutionState.activeStack.length}
                </div>
                <div>
                    <strong>최대 깊이:</strong> {maxDepth}
                </div>
                <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid #e2e8f0' }}>
                    <strong>뷰:</strong> 🌳 동적 트리 뷰
                </div>
            </div>

            {/* 사용법 안내 */}
            <div style={infoBoxStyle(null, null, 20, 20, '11px', 'rgba(255, 255, 255, 0.9)')}>
                💡 <strong>마우스 휠</strong>로 확대/축소, <strong>드래그</strong>로 이동
            </div>
        </div>
    );
};

// 💅 스타일
const zoomButtonStyle = {
    width: '32px', height: '32px', border: 'none', borderRadius: '6px',
    background: '#8b5cf6', color: 'white', cursor: 'pointer',
    fontSize: '18px', fontWeight: 'bold'
};

const zoomLevelStyle = {
    fontSize: '11px', fontWeight: '600', color: '#64748b',
    textAlign: 'center', padding: '4px 0'
};

const controlsContainerStyle = {
    position: 'absolute', top: '20px', right: '20px',
    display: 'flex', flexDirection: 'column', gap: '8px',
    background: 'white', padding: '8px', borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0', zIndex: 10
};

const infoBoxStyle = (top, left, bottom, right, fontSize = '13px', bg = 'rgba(255, 255, 255, 0.95)') => ({
    position: 'absolute',
    top: top ? `${top}px` : 'auto',
    left: left ? `${left}px` : 'auto',
    bottom: bottom ? `${bottom}px` : 'auto',
    right: right ? `${right}px` : 'auto',
    background: bg,
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: fontSize,
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    zIndex: 10,
    maxWidth: '400px',
    color: '#334155'
});

export default RecursionAnimation;