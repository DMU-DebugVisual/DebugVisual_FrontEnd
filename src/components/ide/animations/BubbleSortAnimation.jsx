// animations/BubbleSortAnimation.jsx - D3 기반 완전 재구현
import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';

const BubbleSortAnimation = ({
                                 data,
                                 currentStep,
                                 totalSteps,
                                 isPlaying,
                                 zoomLevel = 1
                             }) => {
    const svgRef = useRef(null);
    const [intervalId, setIntervalId] = useState(null);

    console.log('🔄 D3 BubbleSortAnimation 렌더링:', {
        currentStep,
        totalSteps,
        hasData: !!data,
        isPlaying
    });

    // 🎯 원본과 동일한 단계 변환 함수
    const convertBubbleSteps = (rawSteps) => {
        const result = [];
        let currentList = [];

        for (let i = 0; i < rawSteps.length; i++) {
            const step = rawSteps[i];
            const next = rawSteps[i + 1];
            const newStep = { ...step };

            const change = step.changes?.find(c => c.variable === "list");
            if (change?.after) currentList = change.after;

            if (step.condition) {
                const match = step.condition.expression.match(/list\[(\d+)\].*list\[(\d+)\]/);
                const [left, right] = match ? [parseInt(match[1]), parseInt(match[2])] : [null, null];
                const resultStr = step.condition.result ? "true" : "false";
                const isSwap = next?.description?.includes("list") ?? false;
                const action = isSwap ? "→ 교환" : "→ 교환 없음";
                newStep.description = `list[${left}]=${currentList[left]}, list[${right}]=${currentList[right]} 비교 → ${resultStr} ${action}`;
            }

            result.push(newStep);
        }

        return result;
    };

    // 🎯 원본과 동일한 변수 상태 계산
    const getVariableStateAt = (index, steps) => {
        const vars = { n: null, i: null, j: null, temp: null, list: [] };

        // 초기값 설정
        if (data?.variables) {
            data.variables.forEach(v => {
                vars[v.name] = v.initialValue;
            });
        }

        for (let i = 0; i <= index; i++) {
            const changes = steps[i]?.changes;
            if (changes) {
                for (const change of changes) {
                    if (change.variable === "list") {
                        vars.list = change.after;
                    } else {
                        vars[change.variable] = change.after;
                    }
                }
            }
        }
        return vars;
    };

    // 🎯 원본과 동일한 변경 인덱스 감지
    const getChangedIndices = (prev, current) => {
        if (!prev || !current) return [];
        return current.map((v, i) => (v !== prev[i] ? i : -1)).filter(i => i !== -1);
    };

    // 🎯 원본과 동일한 D3 그리기 함수
    const drawStep = (stepIndex) => {
        if (!data?.steps) return;

        const steps = convertBubbleSteps(data.steps);
        const step = steps[stepIndex];
        if (!step) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const list = getVariableStateAt(stepIndex, steps).list;
        const prevList = getVariableStateAt(stepIndex - 1, steps).list;
        const changedIndices = getChangedIndices(prevList, list);

        const expression = step.condition?.expression || "";
        const match = expression.match(/list\[(\d+)\].*list\[(\d+)\]/);
        const comparingIndices = match ? [parseInt(match[1]), parseInt(match[2])] : [];
        const isFinalStep = step.description?.includes("정렬된 배열 출력");

        if (!list || list.length === 0) return;

        const totalWidth = list.length * 60;
        const offsetX = (600 - totalWidth) / 2; // SVG 너비 600에 맞춤
        const group = svg.append("g").attr("transform", `translate(${offsetX}, 50)`);

        list.forEach((val, i) => {
            // 🎨 원본과 동일한 색상 로직
            let fill = "#ddd";
            if (isFinalStep) fill = "#2ecc71";
            else if (changedIndices.includes(i)) fill = "#845ef7";
            else if (comparingIndices.includes(i)) fill = "#f1c40f";

            // 🎯 원본의 D3 애니메이션 방식
            const rect = group
                .append("rect")
                .attr("x", i * 60)
                .attr("y", 0)
                .attr("width", 50)
                .attr("height", 50)
                .attr("rx", 8)
                .attr("fill", "#ddd")
                .attr("stroke", "#999")
                .attr("stroke-width", 1);

            // 🎯 원본의 D3 transition 효과
            rect.transition()
                .duration(500)
                .attr("fill", fill);

            // 텍스트 추가
            group
                .append("text")
                .attr("x", i * 60 + 25)
                .attr("y", 30)
                .attr("text-anchor", "middle")
                .attr("font-size", 18)
                .attr("fill", "#000")
                .attr("font-weight", "bold")
                .text(val);

            // 인덱스 표시 추가
            group
                .append("text")
                .attr("x", i * 60 + 25)
                .attr("y", -8)
                .attr("text-anchor", "middle")
                .attr("font-size", 12)
                .attr("fill", "#666")
                .text(`[${i}]`);
        });

        // 비교 중인 요소에 화살표 표시
        if (comparingIndices.length === 2) {
            const [left, right] = comparingIndices;
            const arrowY = 70;

            group
                .append("line")
                .attr("x1", left * 60 + 25)
                .attr("y1", arrowY)
                .attr("x2", right * 60 + 25)
                .attr("y2", arrowY)
                .attr("stroke", "#f1c40f")
                .attr("stroke-width", 3)
                .attr("marker-end", "url(#arrowhead)");

            // 화살표 마커 정의
            if (!svg.select("#arrowhead").node()) {
                svg.append("defs").append("marker")
                    .attr("id", "arrowhead")
                    .attr("viewBox", "0 0 10 10")
                    .attr("refX", 10)
                    .attr("refY", 5)
                    .attr("markerWidth", 6)
                    .attr("markerHeight", 6)
                    .attr("orient", "auto")
                    .append("path")
                    .attr("d", "M 0 0 L 10 5 L 0 10 z")
                    .attr("fill", "#f1c40f");
            }

            // 비교 텍스트
            group
                .append("text")
                .attr("x", (left * 60 + right * 60) / 2 + 25)
                .attr("y", arrowY + 20)
                .attr("text-anchor", "middle")
                .attr("font-size", 12)
                .attr("fill", "#f1c40f")
                .attr("font-weight", "bold")
                .text("비교 중");
        }
    };

    // 🎯 단계 변경 시 D3 애니메이션 실행
    useEffect(() => {
        if (data?.steps && currentStep >= 0 && currentStep < data.steps.length) {
            drawStep(currentStep);
        }
    }, [currentStep, data]);

    // 자동 재생 효과
    useEffect(() => {
        if (intervalId) clearInterval(intervalId);

        if (isPlaying && currentStep < totalSteps - 1) {
            const id = setInterval(() => {
                console.log('자동 재생 진행 중...');
                // 실제 단계 진행은 부모 컴포넌트에서 처리
            }, 1000);
            setIntervalId(id);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isPlaying, currentStep, totalSteps]);

    // 현재 단계 데이터 계산
    const steps = data?.steps ? convertBubbleSteps(data.steps) : [];
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
            {/* 현재 단계 설명 */}
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
                    <strong>Step {currentStep + 1}:</strong> {stepData.description}
                </div>
            )}

            {/* 🎯 D3 SVG 시각화 영역 (원본과 동일) */}
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

            {/* 상태 정보 카드들 */}
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
                        <div style={{ color: '#92400e', marginBottom: '2px' }}>외부 루프 (i)</div>
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
                        <div style={{ color: '#1d4ed8', marginBottom: '2px' }}>내부 루프 (j)</div>
                        <div style={{ fontWeight: 'bold', color: '#1d4ed8' }}>
                            {currentVariables.j}
                        </div>
                    </div>
                )}
            </div>

            {/* 범례 */}
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
                    <span>비교 중</span>
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
            </div>

            {/* 디버그 정보 (개발용) */}
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

export default BubbleSortAnimation;