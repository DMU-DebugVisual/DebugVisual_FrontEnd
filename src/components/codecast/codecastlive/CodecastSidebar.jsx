import React, { useEffect, useRef, useState } from 'react';
import './CodecastSidebar.css';
import { FaUser, FaEllipsisV, FaCheck, FaComments } from 'react-icons/fa';

const RoleBadge = ({ role }) => {
    const labelMap = {
        owner: '세션 소유자',
        edit: '편집',
        view: '읽기',
    };
    const label = labelMap[role] ?? '';

    return (
        <span className={`role-badge ${role || 'blank'}`}>
            {label || '\u00A0'}
        </span>
    );
};

function useClickOutside(onClose) {
    const ref = useRef(null);

    useEffect(() => {
        const handler = (event) => {
            if (!ref.current) return;
            if (!ref.current.contains(event.target)) {
                onClose?.();
            }
        };

        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return ref;
}

export default function CodecastSidebar({
    participants,
    currentUserId,
    roomOwnerId,
    activeSession,
    focusedParticipantId,
    onSelectParticipant,
    onChangePermission,
    onKick,
    onOpenChat,
}) {
    const [menuFor, setMenuFor] = useState(null);
    const closeMenu = () => setMenuFor(null);
    const menuRef = useClickOutside(closeMenu);

    const canManagePermissions =
        !!activeSession && (activeSession.ownerId === currentUserId || roomOwnerId === currentUserId);
    const canKick = currentUserId === roomOwnerId;

    return (
        <aside className="codecast-sidebar">
            <div className="sidebar-headline">
                <h2 className="codecast-sidebar-title">
                    참여자 <span className="count">({participants.length})</span>
                </h2>
                <button
                    className="chat-open-btn"
                    type="button"
                    onClick={onOpenChat}
                    aria-label="채팅 열기"
                    title="채팅 열기"
                >
                    <FaComments />
                </button>
            </div>

            <ul className="participant-list">
                {participants.map((participant) => {
                    const role = participant.sessionRole || 'view';
                    const displayName = (() => {
                        const candidates = [
                            participant.displayName,
                            participant.name,
                            participant.userName,
                            participant.username,
                            participant.email,
                            participant.userEmail,
                            participant.ownerName,
                            participant.id != null ? String(participant.id) : ''
                        ];
                        return candidates.find((text) => typeof text === 'string' && text.trim())?.trim() || '익명 사용자';
                    })();
                    const isSessionOwnerRole = role === 'owner';
                    const isFocused = participant.id === focusedParticipantId;
                    const isMenuOpen = menuFor === participant.id;
                    const isSelf = participant.id === currentUserId;
                    const stage = participant.stage || 'ready';
                    const stageLabelMap = {
                        editing: '공유 중',
                        ready: '대기',
                        watching: '시청 중',
                        idle: '대기',
                        disconnected: '오프라인',
                    };
                    const stageLabel = stageLabelMap[stage] || '대기';
                    const canChangeTargetPermission =
                        !!activeSession &&
                        canManagePermissions &&
                        activeSession.ownerId !== participant.id;

                    return (
                        <li
                            key={participant.id}
                            className={`participant-item ${isFocused ? 'active-user' : ''}`}
                            onClick={() => {
                                closeMenu();
                                onSelectParticipant?.(participant.id);
                            }}
                        >
                            {participant.avatar ? (
                                <img src={participant.avatar} alt={displayName} className="avatar" />
                            ) : (
                                <div className="avatar placeholder">
                                    <FaUser className="default-user-icon" />
                                </div>
                            )}

                            <div className="participant-main">
                                <span className="name">
                                    {displayName}
                                    {isSelf && <span className="self-badge">나</span>}
                                </span>
                                <span className={`stage ${stage}`}>{stageLabel}</span>
                            </div>

                            <div className="permission-chip">
                                <RoleBadge role={role} />
                            </div>

                            <button
                                className="more-btn"
                                type="button"
                                aria-label={`${displayName} 더보기`}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    setMenuFor(isMenuOpen ? null : participant.id);
                                }}
                            >
                                <FaEllipsisV />
                            </button>

                            {isMenuOpen && (
                                <div className="more-menu" ref={menuRef} onClick={(event) => event.stopPropagation()}>
                                    <div className="menu-group">
                                        <div className="menu-label">세션 권한</div>

                                        <button className="menu-item" type="button" onClick={() => {}} disabled>
                                            {isSessionOwnerRole && <FaCheck className="check" />}
                                            세션 소유자
                                        </button>

                                        {['edit', 'view'].map((nextRole) => {
                                            const isSelected = role === nextRole;
                                            const disabled = !canChangeTargetPermission || isSelected;

                                            return (
                                                <button
                                                    key={nextRole}
                                                    className="menu-item"
                                                    type="button"
                                                    onClick={() => {
                                                        if (!disabled) {
                                                            onChangePermission?.(
                                                                activeSession.sessionId,
                                                                participant.id,
                                                                nextRole
                                                            );
                                                        }
                                                        closeMenu();
                                                    }}
                                                    disabled={disabled}
                                                >
                                                    {isSelected && <FaCheck className="check" />}
                                                    {nextRole === 'edit' ? '편집 허용' : '읽기 전용'}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="menu-divider" />

                                    <button
                                        className="menu-item danger"
                                        type="button"
                                        onClick={() => {
                                            if (!canKick || isSelf) return;
                                            onKick?.(participant.id);
                                            closeMenu();
                                        }}
                                        disabled={!canKick || isSelf}
                                    >
                                        강퇴하기
                                    </button>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </aside>
    );
}
