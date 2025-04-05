import React, { useState } from 'react';
import './App.css';
import Header from './components/Header/Header';
import Main from './components/Main/Main';
import RightSidebar from './components/RightSidebar/RightSidebar';
import Sidebar from './components/Sidebar/Sidebar';

function App() {
  const [activeMenuItem, setActiveMenuItem] = useState('home');
  const [darkMode, setDarkMode] = useState(false);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(false);
  const [leftSidebarVisible, setLeftSidebarVisible] = useState(true);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // 오른쪽 사이드바 토글
  const toggleRightSidebar = () => {
    setRightSidebarVisible(!rightSidebarVisible);
  };

  // 왼쪽 사이드바 토글
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
            isLoggedIn={0}
          />
        </div>

        {/* 메인 영역 */}
        <div
          className="main-area"
          style={{
            marginLeft: leftSidebarVisible ? '250px' : '0',
            width: leftSidebarVisible ? 'calc(100% - 250px)' : '100%',
          }}
        >
          <Main
            darkMode={darkMode}
            onRunCode={() => setRightSidebarVisible(true)} // 예: 코드 실행 시 자동으로 열 수도 있음
            toggleLeftSidebar={toggleLeftSidebar}
            toggleRightSidebar={toggleRightSidebar} // 오른쪽 사이드바 열기/닫기
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
