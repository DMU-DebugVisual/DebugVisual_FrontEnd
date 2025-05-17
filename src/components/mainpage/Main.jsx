import React from "react";

import Intro from "./intro/Intro";
import Features from "./features/Features";
import DemoView from "./demoview/DemoView";
import StartNow from "./startnow/StartNow";

const Main = () => {
    return (
        <div>
            <main>
                <Intro />
                <Features />
                <DemoView />
                <StartNow />
            </main>
        </div>
    );
};

export default Main;
