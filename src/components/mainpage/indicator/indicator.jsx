import React from "react";
import "./indicator.css";

const sections = [
    { id: "intro", label: "Intro" },
    { id: "feature", label: "Features" },
    { id: "demo", label: "Demo" },
    { id: "start", label: "Start" },
];

export default function Indicator({ active, onNavigate }) {
    return (
        <div className="indicator">
            {sections.map((sec, index) => (
                <div
                    key={sec.id}
                    className={`dot ${active === sec.id ? "active" : ""}`}
                    onClick={() => onNavigate(index)}
                >
                    <span className="tooltip">{sec.label}</span>
                </div>
            ))}
        </div>
    );
}
