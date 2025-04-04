import React, { useState } from 'react';
import "../styles/Sidebar.css";

const Sidebar = ({ darkMode, onClose }) => {
    const [activeFile, setActiveFile] = useState(1);
    const [fileHover, setFileHover] = useState(null);

    // 샘플 파일 목록
    const files = [
        { id: 1, name: '자료구조_for문 실습', type: 'file' },
        { id: 2, name: '알고리즘_정렬', type: 'file' },
        { id: 3, name: '프로젝트_메모', type: 'file' }
    ];

    const handleFileClick = (id) => {
        setActiveFile(id);
    };

    return (
        <aside className={`sidebar ${darkMode ? 'dark' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-title">
                    <span className="sidebar-icon">📁</span> Files
                </div>
            </div>

            <div className="sidebar-content">
                <ul className="files-list">
                    {files.map(file => (
                        <li
                            key={file.id}
                            className={`file-item ${activeFile === file.id ? 'active' : ''} ${fileHover === file.id ? 'hover' : ''}`}
                            onClick={() => handleFileClick(file.id)}
                            onMouseEnter={() => setFileHover(file.id)}
                            onMouseLeave={() => setFileHover(null)}
                        >
                            <span className="file-icon">📄</span> {file.name}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="sidebar-footer">
                <button className="auth-button login">로그인</button>
                <button className="auth-button signup">회원가입</button>
            </div>

            {/* 닫기 버튼 (모바일 화면용) */}
            <button
                className="close-button"
                onClick={onClose}
                aria-label="사이드바 닫기"
            >
                ✕
            </button>
        </aside>
    );
};

export default Sidebar;