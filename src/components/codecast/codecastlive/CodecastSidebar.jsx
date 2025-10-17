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

/**
 * Props
 * - participants: {id, name, role, avatar?}[]
 * - currentUser: {id, name, role}
 * - sessionId?: string | null  // ✅ 세션 없으면 edit/view 토글 비활성화
 * - onChangeRole?: (name, nextRole) => void
 * - onKick?: (name) => void
 * - onOpenChat?: () => void
 */
export default function CodecastSidebar({
                                            participants,
                                            currentUser,
                                            sessionId,
                                            onChangeRole,
                                            onKick,
                                            onOpenChat,
                                        }) {
    const [menuFor, setMenuFor] = useState(null); // 메뉴가 열린 사용자명

    const closeMenu = () => setMenuFor(null);
    const menuRef = useClickOutside(closeMenu);

    return (
        <aside className="codecast-sidebar">
            <div className="sidebar-headline">
                <h2 className="codecast-sidebar-title">
                    참여자 <span className="count">({participants.length})</span>
                </h2>
                <button
                    className="chat-open-btn"
                    onClick={onOpenChat}
                    aria-label="채팅 열기"
                    title="채팅 열기"
                >
                    <FaComments />
                </button>
            </div>

            <ul className="participant-list">
                {participants.map((p) => {
                    const isActive = p.name === currentUser.name;
                    const isMenuOpen = menuFor === p.name;

                    return (
                        <li
                            key={p.name}
                            className={`participant-item ${isActive ? 'active-user' : ''}`}
                        >
                            {/* 프로필 이미지 or 회색 원 */}
                            {p.avatar ? (
                                <img src={p.avatar} alt={p.name} className="avatar" />
                            ) : (
                                <div className="avatar placeholder">
                                    <FaUser className="default-user-icon" />
                                </div>
                            )}

                            {/* 이름 */}
                            <span className="name">{p.name}</span>

                            {/* 권한 아이콘 */}
                            <RoleIcon role={p.role} />

                            {/* 더보기 버튼 */}
                            <button
                                className="more-btn"
                                aria-label={`${p.name} 더보기`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setMenuFor(isMenuOpen ? null : p.name);
                                }}
                            >
                                <FaEllipsisV />
                            </button>

                            {/* 팝오버 메뉴 */}
                            {isMenuOpen && (
                                <div className="more-menu" ref={menuRef} onClick={(e) => e.stopPropagation()}>
                                    <div className="menu-group">
                                        <div className="menu-label">권한 설정</div>

                                        {/* host 버튼은 표시만 하고 비활성화(서버 미지원) */}
                                        <button
                                            className="menu-item"
                                            onClick={() => {}}
                                            disabled
                                            title="방장 권한 변경은 지원하지 않습니다."
                                        >
                                            {p.role === 'host' && <FaCheck className="check" />}
                                            모든 권한(Host)
                                        </button>

                                        {/* edit / view 토글 */}
                                        {['edit', 'view'].map((role) => {
                                            const isSame = p.role === role;
                                            const disabledByRole = currentUser.role !== 'host' && p.name !== currentUser.name; // 타인 변경은 방장만
                                            const disabledBySession = !sessionId; // 세션 없으면 편집권한 토글 불가
                                            const disabled = isSame || disabledByRole || disabledBySession;

                                            return (
                                                <button
                                                    key={role}
                                                    className="menu-item"
                                                    onClick={() => {
                                                        if (!disabled) onChangeRole?.(p.name, role);
                                                        closeMenu();
                                                    }}
                                                    disabled={disabled}
                                                    title={
                                                        isSame
                                                            ? '현재 권한'
                                                            : disabledBySession
                                                                ? '세션 시작 후에만 변경 가능합니다.'
                                                                : disabledByRole
                                                                    ? '방장만 다른 사람 권한을 변경할 수 있습니다.'
                                                                    : '권한 변경'
                                                    }
                                                >
                                                    {isSame && <FaCheck className="check" />}
                                                    {role === 'edit' ? '편집(Editing)' : '보기(Read Only)'}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    <div className="menu-divider" />

                                    <button
                                        className="menu-item danger"
                                        onClick={() => {
                                            onKick?.(p.name);
                                            closeMenu();
                                        }}
                                        disabled={currentUser.role !== 'host' || (p.name === currentUser.name && p.role === 'host')}
                                        title={
                                            currentUser.role !== 'host'
                                                ? '방장만 강퇴 가능'
                                                : p.name === currentUser.name && p.role === 'host'
                                                    ? '방장은 자기 자신을 강퇴할 수 없음'
                                                    : '강퇴하기'
                                        }
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
