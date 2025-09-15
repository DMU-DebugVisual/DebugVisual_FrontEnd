import React, { useEffect } from "react";
import Intro from "./intro/Intro";
import Features from "./features/Features";
import DemoView from "./demoview/DemoView";
import StartNow from "./startnow/StartNow";
import Indicator from "./indicator/indicator";
import Footer from "../footer/Footer";
import "./Main.css";

const Main = () => {
    useEffect(() => {
        document.body.style.overflow = "auto";
    }, []);

    return (
        <div id="fullpage" className="fullpage-container">
            <section id="intro"><Intro /></section>
            <section id="feature"><Features /></section>
            <section id="demo"><DemoView /></section>

            {/* ✅ StartNow + Footer 묶어서 마지막 섹션 */}
            <section id="start">
                <div className="last-section">
                    <StartNow />
                    <Footer />
                </div>
            </section>

            <Indicator containerId="fullpage" />
        </div>
    );
};

export default Main;
