// src/components/mainpage/Main.jsx

import React, { useEffect, useRef, useState, useMemo } from "react";
import Intro from "./intro/Intro";
import Features from "./features/Features";
import DemoView from "./demoview/DemoView";
import StartNow from "./startnow/StartNow";
import Indicator from "./indicator/indicator";
import "./Main.css";

const sections = ["intro", "feature", "demo", "start"];
const componentMap = [Intro, Features, DemoView, StartNow]; // 컴포넌트 배열

const Main = () => {
    const sectionRefs = useRef([]);
    const [current, setCurrent] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);

    useEffect(() => {
        const handleWheel = (e) => {
            // 스크롤 중일 때 이벤트 무시
            if (isScrolling) return;

            if (e.deltaY > 0 && current < sections.length - 1) {
                // 아래로 스크롤
                setCurrent((prev) => prev + 1);
                setIsScrolling(true);
            } else if (e.deltaY < 0 && current > 0) {
                // 위로 스크롤
                setCurrent((prev) => prev - 1);
                setIsScrolling(true);
            }
        };

        // passive: true 유지 (성능 이점), 풀페이지 전용으로 스크롤 막으려면 false 및 e.preventDefault() 필요
        window.addEventListener("wheel", handleWheel, { passive: true });
        return () => window.removeEventListener("wheel", handleWheel);
    }, [current, isScrolling]);

    useEffect(() => {
        // 섹션 이동
        sectionRefs.current[current]?.scrollIntoView({ behavior: "smooth" });
        // 스크롤 잠금 해제 타이머 (애니메이션 시간 고려)
        const timer = setTimeout(() => setIsScrolling(false), 800);
        return () => clearTimeout(timer);
    }, [current]);

    return (
        <div className="fullpage-container">
            {sections.map((id, index) => {
                const Component = componentMap[index];
                return (
                    <section
                        key={id}
                        id={id}
                        ref={(el) => (sectionRefs.current[index] = el)}
                        // 마지막 섹션에만 'last-section' 클래스 적용
                        className={`page-section ${index === sections.length - 1 ? 'last-section' : ''}`}
                    >
                        <Component />
                    </section>
                );
            })}

            <Indicator active={sections[current]} onNavigate={setCurrent} />
        </div>
    );
};

export default Main;