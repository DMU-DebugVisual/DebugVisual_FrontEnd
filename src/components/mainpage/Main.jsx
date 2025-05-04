import React from "react";

import Header from "../header/Header";
import Footer from "../footer/Footer";
import Intro from "./intro/Intro";
import Features from "./features/Features";
import DemoView from "./demoview/DemoView";
import StartNow from "./startnow/StartNow";

const Main = () => {
    return (
        <div>
            <Header />
            <main>
                <Intro />
                <Features />
                <DemoView />
                <StartNow />
            </main>
            <Footer />
        </div>
    );
};

export default Main;
