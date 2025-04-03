import React from "react";
import "../styles/Main.css";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const Main = () => {
    return (
        <div className="container">
            <Header />
            <div className="main-content">
                <Sidebar />
            </div>

        </div>
    );
};

export default Main;
