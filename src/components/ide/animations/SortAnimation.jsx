import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const SortAnimation = ({
                           data,
                           currentStep,
                           totalSteps,
                           isPlaying,
                           zoomLevel = 1
                       }) => {
    const svgRef = useRef(null);
    const [intervalId, setIntervalId] = useState(null);

    // 🎯 함수 이름에서 알고리즘 매핑
    const getAlgorithmFromFunction = (functions) => {
        if (!functions || !functions[0]?.name) return 'unknown';
        const functionName = functions[0].name.toLowerCase();
        const algorithmMap = {
            'bubble_sort': 'bubble',
            'selection_sort': 'selection',
            'insertion_sort': 'insertion',
            'merge_sort': 'merge',
            'quick_sort': 'quick',
            'heap_sort': 'heap'
        };
        return algorithmMap[functionName] || 'unknown';
    };

    const algorithm = getAlgorithmFromFunction(data?.functions);

    console.log('🔄 SortAnimation 렌더링:', {
        functionName: data?.functions?.[0]?.name || 'none',
        algorithm,
        currentStep,
        totalSteps,
        hasData: !!data,
        isPlaying
    });

    // 🎯 Generic step conversion function
    const convertSteps = (rawSteps) => {
        const result = [];
        let currentList = [];

        for (let i = 0; i < rawSteps.length; i++) {
            const step = rawSteps[i];
            const next = rawSteps[i + 1];
            const newStep = { ...step };

            const change = step.changes?.find(c => c.variable === 'list');
            if (change?.after) currentList = change.after;

            // 기본적으로 JSON의 description 사용
            let description = step.description || '단계 처리 중';

            if (step.condition) {
                const match = step.condition.expression?.match(/list\[(\d+)\](?:.*list\[(\d+)\])?/) || [];
                const indices = match ? [parseInt(match[1]), parseInt(match[2])].filter(i => !isNaN(i)) : [];

                if (algorithm === 'bubble' || algorithm === 'selection' || algorithm === 'insertion') {
                    const resultStr = step.condition.result ? 'true' : 'false';
                    const isSwap = next?.changes?.some(c => c.variable === 'list') ?? false;
                    const action = isSwap ? '→ 교환' : '→ 교환 없음';
                    if (indices.length === 2) {
                        description = `${description} (list[${indices[0]}]=${currentList[indices[0]]}, list[${indices[1]}]=${currentList[indices[1]]} 비교 → ${resultStr} ${action})`;
                    } else if (indices.length === 1) {
                        description = `${description} (list[${indices[0]}]=${currentList[indices[0]]} 처리 → ${resultStr} ${action})`;
                    }
                } else if (algorithm === 'quick') {
                    const quickDesc = step.condition?.expression?.includes('pivot')
                        ? `피벗 list[${indices[0]}]=${currentList[indices[0]]} 처리`
                        : indices.length > 0
                            ? `list[${indices.join(', ')}] 파티션 처리`
                            : '파티션 처리 중';
                    description = `${description} (${quickDesc})`;
                } else if (algorithm === 'merge') {
                    const mergeDesc = step.condition?.expression?.includes('merge') || step.description?.includes('merge')
                        ? `구간 [${indices.join(', ')}] 병합`
                        : indices.length > 0
                            ? `list[${indices.join(', ')}] 분할`
                            : '분할/병합 중';
                    description = `${description} (${mergeDesc})`;
                } else if (indices.length > 0) {
                    description = `${description} (list[${indices.join(', ')}] 처리)`;
                }
            } else if (step.description?.includes('정렬된 배열 출력')) {
                description = '정렬 완료: 최종 배열 출력';
            }

            newStep.description = description;
            result.push(newStep);
        }

        return result;
    };

    const getVariableStateAt = (index, steps) => {
        const vars = { n: null, i: null, j: null, temp: null, list: [] };

        if (data?.variables) {
            data.variables.forEach(v => {
                vars[v.name] = v.currentValue ?? v.initialValue;
            });
        }

        for (let i = 0; i <= index; i++) {
            const changes = steps[i]?.changes;
            if (changes) {
                for (const change of changes) {
                    if (change.variable === 'list') {
                        vars.list = change.after;
                    } else {
                        vars[change.variable] = change.after;
                    }
                }
            }
        }
        return vars;
    };

    const getChangedIndices = (prev, current) => {
        if (!prev || !current) return [];
        return current.map((v, i) => (v !== prev[i] ? i : -1)).filter(i => i !== -1);
    };

    const drawStep = (stepIndex) => {
        if (!data?.steps) return;

        const steps = convertSteps(data.steps);
        const step = steps[stepIndex];
        if (!step) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove();

        const list = getVariableStateAt(stepIndex, steps).list;
        const prevList = getVariableStateAt(stepIndex - 1, steps).list;
        const changedIndices = getChangedIndices(prevList, list);

        const expression = step.condition?.expression || '';
        const match = expression.match(/list\[(\d+)\](?:.*list\[(\d+)\])?/) || [];
        const comparingIndices = match ? [parseInt(match[1]), parseInt(match[2])].filter(i => !isNaN(i)) : [];
        const isFinalStep = step.description?.includes('정렬 완료');

        const pivotIndex = step.condition?.expression?.includes('pivot') && comparingIndices.length > 0
            ? comparingIndices[0]
            : null;

        if (!list || list.length === 0) return;

        const totalWidth = list.length * 60;
        const offsetX = (600 - totalWidth) / 2;
        const group = svg.append('g').attr('transform', `translate(${offsetX}, 50)`);

        list.forEach((val, i) => {
            let fill = '#ddd';
            if (isFinalStep) fill = '#2ecc71';
            else if (changedIndices.includes(i)) fill = '#845ef7';
            else if (comparingIndices.includes(i)) fill = '#f1c40f';
            else if (i === pivotIndex) fill = '#e74c3c';

            const rect = group
                .append('rect')
                .attr('x', i * 60)
                .attr('y', 0)
                .attr('width', 50)
                .attr('height', 50)
                .attr('rx', 8)
                .attr('fill', '#ddd')
                .attr('stroke', '#999')
                .attr('stroke-width', 1);

            rect.transition()
                .duration(500)
                .attr('fill', fill);

            group
                .append('text')
                .attr('x', i * 60 + 25)
                .attr('y', 30)
                .attr('text-anchor', 'middle')
                .attr('font-size', 18)
                .attr('fill', '#000')
                .attr('font-weight', 'bold')
                .text(val);

            group
                .append('text')
                .attr('x', i * 60 + 25)
                .attr('y', -8)
                .attr('text-anchor', 'middle')
                .attr('font-size', 12)
                .attr('fill', '#666')
                .text(`[${i}]`);
        });

        if (comparingIndices.length >= 1) {
            const arrowY = 70;
            if (comparingIndices.length === 2) {
                const [left, right] = comparingIndices;
                group
                    .append('line')
                    .attr('x1', left * 60 + 25)
                    .attr('y1', arrowY)
                    .attr('x2', right * 60 + 25)
                    .attr('y2', arrowY)
                    .attr('stroke', '#f1c40f')
                    .attr('stroke-width', 3)
                    .attr('marker-end', 'url(#arrowhead)');

                group
                    .append('text')
                    .attr('x', (left * 60 + right * 60) / 2 + 25)
                    .attr('y', arrowY + 20)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', 12)
                    .attr('fill', '#f1c40f')
                    .attr('font-weight', 'bold')
                    .text('비교 중');
            } else if (comparingIndices.length === 1) {
                const [index] = comparingIndices;
                group
                    .append('circle')
                    .attr('cx', index * 60 + 25)
                    .attr('cy', arrowY)
                    .attr('r', 5)
                    .attr('fill', algorithm === 'quick' ? '#e74c3c' : '#f1c40f');

                group
                    .append('text')
                    .attr('x', index * 60 + 25)
                    .attr('y', arrowY + 20)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', 12)
                    .attr('fill', algorithm === 'quick' ? '#e74c3c' : '#f1c40f')
                    .attr('font-weight', 'bold')
                    .text(algorithm === 'quick' ? '피벗' : '처리 중');
            }

            if (!svg.select('#arrowhead').node()) {
                svg.append('defs').append('marker')
                    .attr('id', 'arrowhead')
                    .attr('viewBox', '0 0 10 10')
                    .attr('refX', 10)
                    .attr('refY', 5)
                    .attr('markerWidth', 6)
                    .attr('markerHeight', 6)
                    .attr('orient', 'auto')
                    .append('path')
                    .attr('d', 'M 0 0 L 10 5 L 0 10 z')
                    .attr('fill', '#f1c40f');
            }
        }

        if (algorithm === 'merge' && step.condition?.expression?.includes('merge')) {
            const match = step.condition.expression.match(/\[(\d+):(\d+)\]/);
            if (match) {
                const [start, end] = [parseInt(match[1]), parseInt(match[2])];
                group.append('rect')
                    .attr('x', start * 60)
                    .attr('y', -20)
                    .attr('width', (end - start + 1) * 60)
                    .attr('height', 5)
                    .attr('fill', '#3498db')
                    .attr('opacity', 0.3);
                group.append('text')
                    .attr('x', (start * 60 + end * 60) / 2 + 25)
                    .attr('y', -10)
                    .attr('text-anchor', 'middle')
                    .attr('font-size', 12)
                    .attr('fill', '#3498db')
                    .text('병합 구간');
            }
        }
    };

    useEffect(() => {
        if (data?.steps && currentStep >= 0 && currentStep < data.steps.length) {
            drawStep(currentStep);
        }
    }, [currentStep, data]);

    useEffect(() => {
        if (intervalId) clearInterval(intervalId);

        if (isPlaying && currentStep < totalSteps - 1) {
            const id = setInterval(() => {
                console.log('자동 재생 진행 중...');
            }, 1000);
            setIntervalId(id);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isPlaying, currentStep, totalSteps]);

    const steps = data?.steps ? convertSteps(data.steps) : [];
    const currentVariables = data?.steps ? getVariableStateAt(currentStep, steps) : {};
    const stepData = steps[currentStep];

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
            {stepData?.description && (
                <div style={{
                    padding: '12px',
                    background: '#f0f9ff',
                    borderRadius: '8px',
                    borderLeft: '4px solid #6a5acd',
                    fontSize: '14px',
                    color: '#1e293b',
                    fontStyle: 'italic'
                }}>
                    <strong>Step {currentStep + 1} ({algorithm}):</strong> {stepData.description}
                </div>
            )}

            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                border: '1px solid #eee',
                borderRadius: '8px',
                minHeight: '200px',
                maxHeight: '280px',
                padding: '16px'
            }}>
                <svg
                    ref={svgRef}
                    width="600"
                    height="200"
                    style={{
                        overflow: 'visible',
                        background: '#fafafa',
                        borderRadius: '4px'
                    }}
                />
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '8px'
            }}>
                <div style={{
                    padding: '8px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '12px',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ color: '#6b7280', marginBottom: '2px' }}>재생 상태</div>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                        {isPlaying ? '▶️ 재생중' : '⏸️ 정지'}
                    </div>
                </div>

                <div style={{
                    padding: '8px',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '12px',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ color: '#6b7280', marginBottom: '2px' }}>배열 크기</div>
                    <div style={{ fontWeight: 'bold', color: '#1e293b' }}>
                        {currentVariables.list?.length || 0} 개
                    </div>
                </div>

                {currentVariables.i !== null && (
                    <div style={{
                        padding: '8px',
                        background: '#fef3c7',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontSize: '12px',
                        border: '1px solid #fcd34d'
                    }}>
                        <div style={{ color: '#92400e', marginBottom: '2px' }}>
                            {algorithm === 'merge' ? '분할 단계' : algorithm === 'quick' ? '파티션 인덱스' : '외부 루프 (i)'}
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#92400e' }}>
                            {currentVariables.i}
                        </div>
                    </div>
                )}

                {currentVariables.j !== null && (
                    <div style={{
                        padding: '8px',
                        background: '#dbeafe',
                        borderRadius: '6px',
                        textAlign: 'center',
                        fontSize: '12px',
                        border: '1px solid #93c5fd'
                    }}>
                        <div style={{ color: '#1d4ed8', marginBottom: '2px' }}>
                            {algorithm === 'merge' ? '병합 단계' : algorithm === 'quick' ? '비교 인덱스' : '내부 루프 (j)'}
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#1d4ed8' }}>
                            {currentVariables.j}
                        </div>
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
                    <div style={{ width: '16px', height: '16px', background: '#f1c40f', borderRadius: '4px' }}></div>
                    <span>비교/처리 중</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '16px', height: '16px', background: '#845ef7', borderRadius: '4px' }}></div>
                    <span>변경됨</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '16px', height: '16px', background: '#2ecc71', borderRadius: '4px' }}></div>
                    <span>정렬 완료</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '16px', height: '16px', background: '#ddd', borderRadius: '4px' }}></div>
                    <span>기본</span>
                </div>
                {algorithm === 'quick' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '16px', height: '16px', background: '#e74c3c', borderRadius: '4px' }}></div>
                        <span>피벗</span>
                    </div>
                )}
                {algorithm === 'merge' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '16px', height: '16px', background: '#3498db', borderRadius: '4px' }}></div>
                        <span>병합 구간</span>
                    </div>
                )}
            </div>

            <details style={{ fontSize: '12px', color: '#6b7280' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    🔧 디버그 정보
                </summary>
                <pre style={{
                    background: '#f3f4f6',
                    padding: '8px',
                    borderRadius: '4px',
                    marginTop: '8px',
                    overflow: 'auto',
                    maxHeight: '150px'
                }}>
                    {JSON.stringify({
                        functionName: data?.functions?.[0]?.name || 'none',
                        algorithm,
                        currentStep,
                        totalSteps,
                        currentVariables,
                        stepDescription: stepData?.description
                    }, null, 2)}
                </pre>
            </details>
        </div>
    );
};

export default SortAnimation;