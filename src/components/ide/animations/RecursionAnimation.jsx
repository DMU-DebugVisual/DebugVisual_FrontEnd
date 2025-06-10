import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const RecursionAnimation = ({ data, currentStep }) => {
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

    const drawRecursionTree = (rootNode, svg, baseWidth, baseHeight) => {
        svg.selectAll("*").remove();

        const root = d3.hierarchy(rootNode);
        const treeLayout = d3.tree().size([baseWidth * 2, baseHeight - 100]);
        treeLayout.separation((a, b) => (a.parent === b.parent ? 2 : 3));
        treeLayout(root);

        const allX = root.descendants().map(d => d.x);
        const minX = Math.min(...allX);
        const maxX = Math.max(...allX);
        const fullWidth = maxX - minX + 100;
        const scale = Math.min(1, baseWidth / fullWidth);

        svg
            .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        const group = svg.append("g")
            .attr("transform", `translate(${baseWidth / 2}, 50) scale(${scale}) translate(${-(minX + maxX) / 2}, 0)`);

        root.links().forEach(link => {
            group.append("line")
                .attr("x1", link.source.x)
                .attr("y1", link.source.y)
                .attr("x2", link.target.x)
                .attr("y2", link.target.y)
                .attr("stroke", "#999");
        });

        root.descendants().forEach(d => {
            const nodeLabel = d.data.id ? `${d.data.id}=${d.data.value}` : d.data.value || "호출";
            group.append("circle")
                .attr("cx", d.x)
                .attr("cy", d.y)
                .attr("r", 20)
                .attr("fill", d.data.isActive ? "#f1c40f" : "#f7c242");

            group.append("text")
                .attr("x", d.x)
                .attr("y", d.data.isActive ? d.y - 30 : d.y + 5)
                .attr("text-anchor", "middle")
                .attr("font-size", 12)
                .attr("fill", d.data.isActive ? "#f1c40f" : "#000")
                .text(nodeLabel);
        });
    };

    const drawCallStack = (stack, svg, baseWidth, baseHeight) => {
        svg.selectAll("*").remove();

        const stackHeight = 40;
        const stackWidth = baseWidth - 100;
        const offsetX = 50;
        const offsetY = 50;

        stack.forEach((frame, i) => {
            const yPos = offsetY + i * stackHeight;
            const isActive = frame.isActive || false;

            // Draw stack frame
            svg.append("rect")
                .attr("x", offsetX)
                .attr("y", yPos)
                .attr("width", stackWidth)
                .attr("height", stackHeight - 5)
                .attr("rx", 8)
                .attr("fill", isActive ? "#f1c40f" : "#f7c242")
                .attr("stroke", "#999")
                .attr("stroke-width", 1);

            // Draw frame label
            const label = frame.functionName
                ? `${frame.functionName}(${frame.params || ''})`
                : `Frame ${i + 1}`;
            svg.append("text")
                .attr("x", offsetX + stackWidth / 2)
                .attr("y", yPos + stackHeight / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", 14)
                .attr("fill", isActive ? "#fff" : "#000")
                .text(label);
        });
    };

    const drawStep = (stepIndex) => {
        const step = data?.steps?.[stepIndex];
        const structure = step?.dataStructure;
        const baseWidth = 600;
        const baseHeight = 280;
        const svg = d3.select(svgRef.current);

        if (!structure) return;

        if (structure.type === "recursionTree") {
            drawRecursionTree(structure.root, svg, baseWidth, baseHeight);
        } else if (structure.type === "callStack") {
            drawCallStack(structure.stack, svg, baseWidth, baseHeight);
        } else {
            // Fallback: draw a simple message
            svg.selectAll("*").remove();
            svg.append("text")
                .attr("x", baseWidth / 2)
                .attr("y", baseHeight / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", 16)
                .attr("fill", "#666")
                .text("지원되지 않는 데이터 구조입니다");
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

            {/* 🎯 D3 SVG 시각화 영역 */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                border: '1px solid #eee',
                borderRadius: '8px',
                minHeight: '200px',
                maxHeight: '400px',
                padding: '16px'
            }}>
                <svg ref={svgRef}
                     width="600"
                     height="280"
                     style={{ background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}></svg>
            </div>
        </div>
    );
};

export default RecursionAnimation;