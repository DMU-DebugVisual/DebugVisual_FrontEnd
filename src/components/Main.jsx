import React, { useState } from 'react';
import "../styles/Main.css";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

const Main = ({ darkMode, onRunCode }) => {
    return (
        <main className={`main-editor ${darkMode ? 'dark' : ''}`}>
            <h2 className="editor-title">IDE</h2>
            <div className="editor-container">
                <textarea
                    className="code-editor"
                    placeholder="코드를 입력하세요..."
                ></textarea>

                <button
                    className="run-button"
                    onClick={onRunCode}
                    title="코드 실행"
                >
                    ▶️
                </button>
            </div>
        </main>
    );
};


export default Main;