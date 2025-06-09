import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const BinaryTreeAnimation = ({ data, currentStep }) => {
    const svgRef = useRef(null);
    const lastValidTreeRef = useRef(null);  // 🔥 마지막 유효한 트리 저장

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

    const buildTreeData = (nodes) => {
        const nodeMap = {};
        nodes.forEach(n => nodeMap[n.id] = { ...n, children: [] });

        nodes.forEach(n => {
            if (n.links?.length) {
                n.links.forEach(link => {
                    if (nodeMap[link]) {
                        nodeMap[n.id].children.push(nodeMap[link]);
                    }
                });
            }
        });

        return nodeMap[nodes[0]?.id] || null;
    };

    const drawBinaryTree = (nodes) => {
        // 🔁 유효한 노드 확인 및 캐싱
        if (!nodes || nodes.length === 0) {
            nodes = lastValidTreeRef.current;
            if (!nodes) return;  // 최초 상태에서는 그릴 게 없음
        } else {
            lastValidTreeRef.current = nodes;
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const width = 600;
        const height = 400;

        const treeData = buildTreeData(nodes);
        if (!treeData) return;

        const root = d3.hierarchy(treeData);
        const treeLayout = d3.tree().size([width - 40, height - 100]);
        treeLayout(root);

        const group = svg.append("g").attr("transform", "translate(20, 50)");

        root.links().forEach(link => {
            group.append("line")
                .attr("x1", link.source.x)
                .attr("y1", link.source.y)
                .attr("x2", link.target.x)
                .attr("y2", link.target.y)
                .attr("stroke", "#999");
        });

        root.descendants().forEach(d => {
            group.append("circle")
                .attr("cx", d.x)
                .attr("cy", d.y)
                .attr("r", 20)
                .attr("fill", "#a2d5f2");

            group.append("text")
                .attr("x", d.x)
                .attr("y", d.y + 5)
                .attr("text-anchor", "middle")
                .attr("font-size", 14)
                .text(d.data.value);
        });
    };

    /*const drawStep = (stepIndex) => {
        const step = data.steps?.[stepIndex];
        const structure = step?.dataStructure;
        if (structure?.type === "bst") {
            drawBinaryTree(structure.nodes);
        } else {
            drawBinaryTree(null); // 🔁 없을 경우 이전 유효 트리 유지
        }
    };*/
    const drawStep = (stepIndex) => {
        const step = data.steps?.[stepIndex];
        const structure = step?.dataStructure;

        if (structure?.type === "bst" && structure.nodes && structure.nodes.length > 0) {
            drawBinaryTree(structure.nodes);
        } else {
            drawBinaryTree(null);  // 🔥 명시적으로 null 전달
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
                maxHeight: '280px',
                padding: '16px'
            }}>
                <svg ref={svgRef}
                     width="600"
                     height="280"
                     style={{background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd'}} />
            </div>
        </div>
    );
};

export default BinaryTreeAnimation;
