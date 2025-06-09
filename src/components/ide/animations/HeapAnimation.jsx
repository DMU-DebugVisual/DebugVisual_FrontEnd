import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const HeapAnimation = ({ data, currentStep }) => {
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

    const drawHeap = (nodes) => {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 600;
        const height = 280;
        const levelHeight = 80;

        const group = svg.append("g").attr("transform", "translate(30, 50)");

        nodes.forEach((node, idx) => {
            const depth = Math.floor(Math.log2(idx + 1));
            const posInLevel = idx - (2 ** depth - 1);
            const maxNodesInLevel = 2 ** depth;

            const x = ((width - 100) / maxNodesInLevel) * posInLevel + 40;
            const y = depth * levelHeight;

            group.append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 20)
                .attr("fill", "#ffeaa7");

            group.append("text")
                .attr("x", x)
                .attr("y", y + 5)
                .attr("text-anchor", "middle")
                .attr("font-size", 14)
                .text(node.value);

            if (node.links?.length) {
                node.links.forEach(linkId => {
                    const childIndex = nodes.findIndex(n => n.id === linkId);
                    if (childIndex !== -1) {
                        const childDepth = Math.floor(Math.log2(childIndex + 1));
                        const childPos = childIndex - (2 ** childDepth - 1);
                        const childX = ((width - 100) / (2 ** childDepth)) * childPos + 40;
                        const childY = childDepth * levelHeight;

                        group.append("line")
                            .attr("x1", x)
                            .attr("y1", y)
                            .attr("x2", childX)
                            .attr("y2", childY)
                            .attr("stroke", "#636e72");
                    }
                });
            }
        });
    };

    const drawStep = (stepIndex) => {
        const step = data.steps?.[stepIndex];
        const structure = step?.dataStructure;

        if (structure?.type === "heap") {
            drawHeap(structure.nodes);
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

export default HeapAnimation;
