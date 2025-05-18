import React from "react";
import {Element} from "react-scroll";
import Intro from "./intro/Intro";
import Features from "./features/Features";
import DemoView from "./demoview/DemoView";
import StartNow from "./startnow/StartNow";

const Main = () => {
    return (
        <div>
            <main>
                <Intro />
                <Element name="feature">
                    <Features />
                </Element>
                <DemoView />
                <StartNow />
            </main>
        </div>
    );
};

export default Main;
