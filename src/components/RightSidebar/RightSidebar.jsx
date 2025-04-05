import React from 'react';
import rightSidebarStyle from './RightSidebar.style';
import slideIcon from '../../img/slide.png';

const RightSidebar = ({ visible, darkMode, onClose }) => {
    return (
        <aside className={`right-sidebar ${visible ? 'visible' : ''} ${darkMode ? 'dark' : ''}`}>
            {/* 왼쪽 끝에 배치된 토글 버튼 */}
            <button
                className="toggle-button-left"
                onClick={onClose}
                aria-label="시각화 패널 닫기"
            >
                <img
                    src={slideIcon}
                    alt="Toggle Right Sidebar"
                    style={{ transform: 'rotate(180deg)' }}
                />
            </button>

            <div className="right-sidebar-header">
                <div className="right-sidebar-title">
                    <span className="right-sidebar-icon">📊</span> 알고리즘 시각화
                </div>
                <button
                    className="close-button"
                    onClick={onClose}
                    aria-label="시각화 패널 닫기"
                >
                    ✕
                </button>
            </div>

            <div className="right-sidebar-content">
                <div className="placeholder-content">
                    <p>여기에 코드 실행 결과와 시각화가 표시됩니다.</p>
                    <div className="visualization-placeholder">
                        <div className="placeholder-bar" style={{ height: '30%' }}></div>
                        <div className="placeholder-bar" style={{ height: '50%' }}></div>
                        <div className="placeholder-bar" style={{ height: '70%' }}></div>
                        <div className="placeholder-bar" style={{ height: '90%' }}></div>
                        <div className="placeholder-bar" style={{ height: '60%' }}></div>
                    </div>
                </div>
            </div>
            {rightSidebarStyle}
        </aside>
    );
};

export default RightSidebar;
