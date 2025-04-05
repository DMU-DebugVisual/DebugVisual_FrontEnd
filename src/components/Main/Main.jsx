import React, { useEffect } from 'react';
import mainStyle from './Main.style';
import slideIcon from '../../img/slide.png';

const Main = ({ darkMode, onRunCode, toggleLeftSidebar, toggleRightSidebar }) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = event.target.tagName.toLowerCase();
      // 입력 요소가 포커스 되어 있으면 단축키 동작 무시
      if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') return;

      if (event.code === 'KeyM') {
        toggleLeftSidebar();
      }
      if (event.code === 'KeyL') {
        toggleRightSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleLeftSidebar, toggleRightSidebar]);

  return (
    <main className={`main-editor ${darkMode ? 'dark' : ''}`}>
      <div className="editor-header">
        <button 
          className="menu-button" 
          onClick={toggleLeftSidebar}
          title="왼쪽 사이드바 열기/닫기 (단축키: M)"
        >
          ☰
        </button>
        <h2 className="editor-title">IDE</h2>
        <button 
          className="right-sidebar-toggle"
          onClick={toggleRightSidebar}
          title="오른쪽 사이드바 열기/닫기 (단축키: L)"
        >
          <img src={slideIcon} alt="Toggle Right Sidebar" />
        </button>
      </div>
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
      {mainStyle}
    </main>
  );
};

export default Main;
