import React, { useState } from "react";
import "../styles/Main.css";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import slide from "../assets/slide.png";

const Main = () => {
    const [isOpen, setIsOpen] = useState(false); // 슬라이드 화면 상태

    return (
        <div className="container">
            <Header />
            <Sidebar />
            <div className="main-content">
                {/* 버튼 클릭 시 슬라이드 화면 열기 */}
                <button className="image-button" onClick={() => setIsOpen(true)}>
                    <img src={slide} alt="슬라이드 버튼" />
                </button>
                {/* 슬라이드 화면 */}
                <div className={`slide-panel ${isOpen ? "open" : ""}`}>
                    <button className="close-button" onClick={() => setIsOpen(false)}>✖</button>
                    <h2>슬라이드 화면</h2>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default Main;
