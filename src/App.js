import React, { useState } from 'react';
import './App.css';
import Header from './components/Header';
import Main from './components/Main';
import RightSidebar from './components/RightSidebar';
import Sidebar from './components/Sidebar';
// 나중에 추가할 다른 컴포넌트들
// import Footer from './components/Footer';

function App() {
    const [activeMenuItem, setActiveMenuItem] = useState('home');
    const [darkMode, setDarkMode] = useState(false);
    const [rightSidebarVisible, setRightSidebarVisible] = useState(false);
    const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const toggleRightSidebar = () => {
        setRightSidebarVisible(!rightSidebarVisible);
    };

    const toggleLeftSidebar = () => {
        setLeftSidebarVisible(!leftSidebarVisible);
    };

    return (
        <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
            <Header
                activeMenuItem={activeMenuItem}
                setActiveMenuItem={setActiveMenuItem}
                darkMode={darkMode}
                toggleDarkMode={toggleDarkMode}
            />

            <div className="app-body">
                {/* 왼쪽 사이드바 */}
                <div className={`left-sidebar-container ${leftSidebarVisible ? 'visible' : 'hidden'}`}>
                    <Sidebar
                        darkMode={darkMode}
                        onClose={() => setLeftSidebarVisible(false)}
                    />
                </div>

                {/* 왼쪽 사이드바 토글 버튼 */}
                <button
                    className="left-sidebar-toggle"
                    onClick={toggleLeftSidebar}
                    style={{
                        left: leftSidebarVisible ? '250px' : '0'
                    }}
                >
                    {leftSidebarVisible ? '◀' : '▶'}
                </button>

                {/* 메인 영역 */}
                <div className="main-area" style={{
                    marginLeft: leftSidebarVisible ? '250px' : '0',
                    width: leftSidebarVisible ? 'calc(100% - 250px)' : '100%'
                }}>
                    <Main
                        darkMode={darkMode}
                        onRunCode={() => setRightSidebarVisible(true)}
                    />
                </div>

                {/* 오른쪽 사이드바 */}
                <RightSidebar
                    visible={rightSidebarVisible}
                    darkMode={darkMode}
                    onClose={() => setRightSidebarVisible(false)}
                />
            </div>
        </div>
    );
}
export default App;
