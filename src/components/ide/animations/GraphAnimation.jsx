import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const GraphAnimation = ({ data, currentStep }) => {
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

    const drawGraph = (nodes, edges) => {
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 600;
        const height = 280;

        const nodeObjs = nodes.map(id => ({ id }));
        const nodeMap = Object.fromEntries(nodeObjs.map(n => [n.id, n]));

        const linkObjs = edges.map(([source, target]) => ({
            source: nodeMap[source],
            target: nodeMap[target]
        }));

        const simulation = d3.forceSimulation(nodeObjs)
            .force("link", d3.forceLink(linkObjs).id(d => d.id).distance(100))
            .force("charge", d3.forceManyBody().strength(-300))
            .force("center", d3.forceCenter(width / 2, height / 2));

        const g = svg.append("g");

        const link = g.selectAll("line")
            .data(linkObjs)
            .enter()
            .append("line")
            .attr("stroke", "#aaa")
            .attr("stroke-width", 2);

        const node = g.selectAll("circle")
            .data(nodeObjs)
            .enter()
            .append("circle")
            .attr("r", 20)
            .attr("fill", "#90caf9");

        const label = g.selectAll("text")
            .data(nodeObjs)
            .enter()
            .append("text")
            .text(d => d.id)
            .attr("text-anchor", "middle")
            .attr("dy", 5);

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x ?? 0)
                .attr("y1", d => d.source.y ?? 0)
                .attr("x2", d => d.target.x ?? 0)
                .attr("y2", d => d.target.y ?? 0);

            node
                .attr("cx", d => d.x ?? 0)
                .attr("cy", d => d.y ?? 0);

            label
                .attr("x", d => d.x ?? 0)
                .attr("y", d => d.y ?? 0);
        });
    };

    const drawStep = (stepIndex) => {
        const step = data.steps?.[stepIndex];
        const structure = step?.dataStructure;
        if (structure?.type === "graph") {
            const nodes = structure.nodes;
            const edges = structure.edges || [];
            drawGraph(nodes, edges);
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
                     style={{background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd'}}></svg>
            </div>
        </div>
    );
};

export default GraphAnimation;
