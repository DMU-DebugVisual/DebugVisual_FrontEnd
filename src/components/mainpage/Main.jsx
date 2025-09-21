import React, { useEffect, useRef, useState } from "react";
import Intro from "./intro/Intro";
import Features from "./features/Features";
import DemoView from "./demoview/DemoView";
import StartNow from "./startnow/StartNow";
import Indicator from "./indicator/indicator";
import "./Main.css";

const sections = ["intro", "feature", "demo", "start"];

const Main = () => {
    const sectionRefs = useRef([]);
    const [current, setCurrent] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);

    useEffect(() => {
        const handleWheel = (e) => {
            if (isScrolling) return;

            if (e.deltaY > 0 && current < sections.length - 1) {
                setCurrent((prev) => prev + 1);
                setIsScrolling(true);
            } else if (e.deltaY < 0 && current > 0) {
                setCurrent((prev) => prev - 1);
                setIsScrolling(true);
            }
        };

        window.addEventListener("wheel", handleWheel, { passive: true });
        return () => window.removeEventListener("wheel", handleWheel);
    }, [current, isScrolling]);

    useEffect(() => {
        sectionRefs.current[current]?.scrollIntoView({ behavior: "smooth" });
        const timer = setTimeout(() => setIsScrolling(false), 800);
        return () => clearTimeout(timer);
    }, [current]);

    return (
        <div className="fullpage-container">
            <section
                id="intro"
                ref={(el) => (sectionRefs.current[0] = el)}
                className="page-section"
            >
                <Intro />
            </section>

            <section
                id="feature"
                ref={(el) => (sectionRefs.current[1] = el)}
                className="page-section"
            >
                <Features />
            </section>

            <section
                id="demo"
                ref={(el) => (sectionRefs.current[2] = el)}
                className="page-section"
            >
                <DemoView />
            </section>

            <section
                id="start"
                ref={(el) => (sectionRefs.current[3] = el)}
                className="page-section last-section"
            >
                <StartNow />
            </section>

            <Indicator active={sections[current]} onNavigate={setCurrent} />
        </div>
    );
};

export default Main;
