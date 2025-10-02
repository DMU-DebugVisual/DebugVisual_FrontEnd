import React, { useEffect, useRef, useState } from 'react';
import './CodecastSidebar.css';
import { FaCrown, FaPenFancy, FaEye, FaUser, FaEllipsisV, FaCheck } from 'react-icons/fa';

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
 * - participants: {name, role, avatar?}[]
 * - currentUser: {name, role}
 * - onChangeRole?: (name, nextRole) => void
 * - onKick?: (name) => void
 */
export default function CodecastSidebar({
                                            participants,
                                            currentUser,
                                            onChangeRole,
                                            onKick,
                                        }) {
    const [menuFor, setMenuFor] = useState(null); // 메뉴가 열린 사용자명

    const closeMenu = () => setMenuFor(null);
    const menuRef = useClickOutside(closeMenu);

    return (
        <aside className="codecast-sidebar">
            <h2 className="codecast-sidebar-title">
                참여자 <span className="count">({participants.length})</span>
            </h2>

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
                                        {['host', 'edit', 'view'].map((role) => (
                                            <button
                                                key={role}
                                                className="menu-item"
                                                onClick={() => {
                                                    onChangeRole && onChangeRole(p.name, role);
                                                    closeMenu();
                                                }}
                                                disabled={p.role === role}
                                                title={p.role === role ? '현재 권한' : '권한 변경'}
                                            >
                                                {p.role === role && <FaCheck className="check" />}
                                                {role === 'host' ? '모든 권한(Host)' : role === 'edit' ? '편집(Editing)' : '보기(Read Only)'}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="menu-divider" />

                                    <button
                                        className="menu-item danger"
                                        onClick={() => {
                                            onKick && onKick(p.name);
                                            closeMenu();
                                        }}
                                        disabled={p.name === currentUser.name && p.role === 'host'} // 예: 자기 자신(방장) 강퇴 방지
                                        title={p.name === currentUser.name && p.role === 'host' ? '방장은 강퇴 불가' : '강퇴하기'}
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
