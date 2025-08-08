import React from 'react';
import './CodecastHeader.css';

const CodecastHeader = () => {
    const handleExit = () => {
        // 실제 방송 종료 처리 로직이 들어갈 수 있음
        alert('방송을 종료하고 나갑니다.');
    };

    return (
        <header className="broadcastlive-header">
            <div className="header-left">
                <h1 className="broadcast-title">정렬 알고리즘 라이브 코딩</h1>
            </div>

            <div className="header-right">
                <span className="language-tag">Python</span>
                <button className="exit-button" onClick={handleExit}>
                    나가기
                </button>
            </div>
        </header>
    );
};

export default CodecastHeader;
