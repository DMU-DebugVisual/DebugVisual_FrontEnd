import React from 'react';
import Files from '../Files/Files';
import AuthPanel from '../AuthPanel/AuthPanel';
import sidebarStyle from './Sidebar.style';

const Sidebar = ({ darkMode, onClose, isLoggedIn }) => {
  return (
    <aside className={`sidebar ${darkMode ? 'dark' : ''}`}>
      {/* 사이드바 최상단에 파일 제목 헤더 */}
      <div className="sidebar-header">
        <div className="sidebar-title">
          <span className="sidebar-icon">📁</span> Files
        </div>
      </div>
      
      {isLoggedIn ? <Files /> : <AuthPanel />}
      
      {/* 모바일 화면용 닫기 버튼 */}
      <button
        className="close-button"
        onClick={onClose}
        aria-label="사이드바 닫기"
      >
        ✕
      </button>
      {sidebarStyle}
    </aside>
  );
};

export default Sidebar;
