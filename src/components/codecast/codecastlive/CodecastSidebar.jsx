import React, { useEffect, useRef, useState } from 'react';
import './CodecastSidebar.css';
import { FaCrown, FaPenFancy, FaEye, FaUser, FaEllipsisV, FaCheck, FaComments } from 'react-icons/fa';

const RoleIcon = ({ role }) => {
    if (role === 'host') return <FaCrown className="role-icon host" />;
    if (role === 'edit') return <FaPenFancy className="role-icon edit" />;
    return <FaEye className="role-icon view" />;
};

function useClickOutside(onClose) {
    const ref = useRef(null);
    useEffect(() => {
        const handler = (e) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target)) onClose?.();
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

    const resolveRole = (participant) => {
        if (participant.role === 'host') return 'host';
        if (participant.role === 'edit') return 'edit';
        if (activeSession?.permissions?.[participant.id] === 'edit') return 'edit';
        if (participant.role) return participant.role;
        return participant.id === roomOwnerId ? 'host' : 'view';
    };

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
                    const role = resolveRole(participant);
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
                            onClick={() => onSelectParticipant?.(participant.id)}
                        >
                            {participant.avatar ? (
                                <img src={participant.avatar} alt={participant.name} className="avatar" />
                            ) : (
                                <div className="avatar placeholder">
                                    <FaUser className="default-user-icon" />
                                </div>
                            )}

                            <div className="participant-main">
                                <span className="name">
                                    {participant.name}
                                    {isSelf && <span className="self-badge">나</span>}
                                </span>
                                <span className={`stage ${stage}`}>{stageLabel}</span>
                            </div>

                            <RoleIcon role={role} />

                            <button
                                className="more-btn"
                                type="button"
                                aria-label={`${participant.name} 더보기`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuFor(isMenuOpen ? null : participant.id);
                                }}
                            >
                                <FaEllipsisV />
                            </button>

                            {isMenuOpen && (
                                <div className="more-menu" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                                    <div className="menu-group">
                                        <div className="menu-label">세션 권한</div>

                                        <button
                                            className="menu-item"
                                            type="button"
                                            onClick={() => {}}
                                            disabled
                                        >
                                            {role === 'host' && <FaCheck className="check" />}
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
                                                            onChangePermission?.(activeSession.sessionId, participant.id, nextRole);
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
