import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const LinkedListAnimation = ({ data, currentStep }) => {
    const svgRef = useRef(null);

    const getVariableStateAt = (index, steps, variables) => {
        const vars = {};
        variables?.forEach(v => vars[v.name] = v.initialValue);

        for (let i = 0; i <= index; i++) {
            const changes = steps[i]?.changes;
            if (changes) {
                for (const change of changes) {
                    vars[change.variable] = change.after;
                }
            }
        }
        return vars;
    };

    const drawLinkedList = (nodesData) => {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const group = svg.append("g").attr("transform", "translate(20, 100)");
        const nodeSpacing = 120;

        nodesData.forEach((node, index) => {
            const x = index * nodeSpacing;
            group.append("rect")
                .attr("x", x)
                .attr("y", 0)
                .attr("width", 60)
                .attr("height", 60)
                .attr("rx", 8)
                .attr("fill", "#85c1e9");

            group.append("text")
                .attr("x", x + 30)
                .attr("y", 35)
                .attr("text-anchor", "middle")
                .attr("font-size", 18)
                .attr("fill", "#000")
                .text(node.value);

            if (node.links && node.links.length > 0) {
                group.append("line")
                    .attr("x1", x + 60)
                    .attr("y1", 30)
                    .attr("x2", x + nodeSpacing)
                    .attr("y2", 30)
                    .attr("stroke", "black")
                    .attr("marker-end", "url(#arrow)");
            }
        });

        svg.append("defs").append("marker")
            .attr("id", "arrow")
            .attr("viewBox", "0 0 10 10")
            .attr("refX", 10)
            .attr("refY", 5)
            .attr("markerWidth", 6)
            .attr("markerHeight", 6)
            .attr("orient", "auto-start-reverse")
            .append("path")
            .attr("d", "M 0 0 L 10 5 L 0 10 z")
            .attr("fill", "black");
    };

    const drawStep = (stepIndex) => {
        const step = data.steps?.[stepIndex];
        const structure = step?.dataStructure;

        if (structure?.type === "linkedList") {
            drawLinkedList(structure.nodes);
        }
    };

    useEffect(() => {
        if (!data?.steps || !Array.isArray(data.steps)) return;
        if (currentStep < 0 || currentStep >= data.steps.length) return;
        drawStep(currentStep);
    }, [currentStep, data]);

    const steps = data?.steps || [];
    const variables = data?.variables || [];
    const currentVariables = getVariableStateAt(currentStep, steps, variables);
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
                <svg ref={svgRef}
                     width="600"
                     height="280"
                     style={{background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd'}}></svg>
            </div>
        </div>
    );
};

export default LinkedListAnimation;
