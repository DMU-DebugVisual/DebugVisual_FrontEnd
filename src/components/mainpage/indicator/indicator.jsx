import React, { useEffect, useState } from "react";
import { Link as ScrollLink } from "react-scroll";
import "./indicator.css";

/**
 * props:
 * - containerId: 내부 스크롤 컨테이너의 id (예: "fullpage")
 */
const sections = [
    { id: "intro",   label: "Intro" },
    { id: "feature", label: "Features" },
    { id: "demo",    label: "Demo" },
    { id: "start",   label: "Start" },
];

export default function Indicator({ containerId = "fullpage" }) {
    const [active, setActive] = useState("intro");

    useEffect(() => {
        const container = document.getElementById(containerId);
        if (!container) return;

        const handleScroll = () => {
            let current = active;
            for (const s of sections) {
                const el = document.getElementById(s.id);
                if (!el) continue;
                const rect = el.getBoundingClientRect();
                const cRect = container.getBoundingClientRect();
                // 컨테이너의 중앙 기준으로 현재 섹션 판정
                const middle = cRect.top + cRect.height / 2;
                if (rect.top <= middle && rect.bottom >= middle) {
                    current = s.id;
                    break;
                }
            }
            setActive(current);
        };

        // 컨테이너 스크롤만 관찰 (윈도우 스크롤 아님!)
        container.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => container.removeEventListener("scroll", handleScroll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [containerId]);

    return (
        <div className="indicator">
            {sections.map((sec) => (
                <ScrollLink
                    key={sec.id}
                    to={sec.id}
                    containerId={containerId}   // ✅ 이게 핵심! 윈도우가 아니라 컨테이너를 스크롤
                    smooth={true}
                    duration={500}
                    offset={0}
                    className={`dot ${active === sec.id ? "active" : ""}`}
                >
                    <span className="tooltip">{sec.label}</span>
                </ScrollLink>
            ))}
        </div>
    );
}
