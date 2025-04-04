import React from 'react';
import '../styles//RightSidebar.css';
// 나중에 알고리즘 시각화 컴포넌트를 여기서 불러올 수 있습니다
// import AlgorithmVisualizer from './AlgorithmVisualizer';

const RightSidebar = ({ visible, darkMode, onClose }) => {
    return (
        <aside className={`right-sidebar ${visible ? 'visible' : ''} ${darkMode ? 'dark' : ''}`}>
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

            {/* 여기에 알고리즘 시각화 내용이 들어갑니다 */}
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
                {/* 
                나중에 실제 알고리즘 시각화 컴포넌트로 대체:
                <AlgorithmVisualizer />
                */}
            </div>
        </aside>
    );
};

export default RightSidebar;