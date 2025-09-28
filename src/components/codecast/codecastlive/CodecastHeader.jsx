import React from 'react';
import './CodecastHeader.css';

/**
 * Props
 * - roomTitle: string
 * - onLeave: () => void
 * - isFocusMode?: boolean          // 포커스 모드 여부
 * - onToggleFocus?: () => void     // 포커스 모드 토글
 */
export default function CodecastHeader({
                                           roomTitle,
                                           onLeave,
                                           isFocusMode = false,
                                           onToggleFocus,
                                       }) {
    return (
        <header className="broadcastlive-header">
            <div className="header-left">
                <h1 className="broadcast-title">{roomTitle}</h1>
                {/* 파일명/언어/공유시작 제거 */}
            </div>

            <div className="header-right">
                {/* 포커스 모드 버튼 */}
                {onToggleFocus && (
                    <button
                        className={`focus-button ${isFocusMode ? 'active' : ''}`}
                        aria-pressed={isFocusMode}
                        onClick={onToggleFocus}
                    >
                        {isFocusMode ? '포커스 해제' : '포커스 모드'}
                    </button>
                )}
                <button className="exit-button" onClick={onLeave}>
                    나가기
                </button>
            </div>
        </header>
    );
}
