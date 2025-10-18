import React, { useState } from 'react';
import {FaCopy, FaPen} from 'react-icons/fa';
import './CodecastHeader.css';

export default function CodecastHeader({
                                           roomTitle,
                                           onLeave,
                                           isFocusMode = false,
                                           onToggleFocus,
                                           onTitleChange, // ✅ 제목 변경 핸들러 (부모에서 받음)
                                           inviteCode,        // ⬅️
                                       }) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempTitle, setTempTitle] = useState(roomTitle);

    const handleSave = () => {
        setIsEditing(false);
        if (tempTitle.trim() && tempTitle !== roomTitle) {
            onTitleChange?.(tempTitle);
        }
    };

    const handleCopy = async () => {
        if (!inviteCode) return;
        try {
            await navigator.clipboard.writeText(inviteCode);
            alert('초대 코드가 복사되었습니다!');
        } catch {
            alert(inviteCode); // 클립보드 복사가 안 되는 브라우저 대비
        }
    };


    return (
        <header className="broadcastlive-header">
            <div className="header-left">
                {isEditing ? (
                    <input
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        autoFocus
                        className="title-input"
                    />
                ) : (
                    <>
                        <h1 className="broadcast-title">{roomTitle}</h1>
                        <button
                            className="edit-title-btn"
                            onClick={() => setIsEditing(true)}
                            aria-label="제목 수정"
                        >
                            <FaPen />
                        </button>
                    </>
                )}

                {/* ⬇️ 초대 코드 뱃지 (roomId) */}
                {inviteCode && (
                    <div className="invite-badge" title="클릭해 복사">
                        <span className="invite-label">초대코드 :</span>
                        <span className="invite-code">{inviteCode}</span>
                        <button className="icon-btn" onClick={handleCopy} aria-label="초대코드 복사">
                            <FaCopy />
                        </button>
                    </div>
                )}
            </div>



            <div className="header-right">
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
