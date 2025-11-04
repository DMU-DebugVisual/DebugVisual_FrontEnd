import React, { useMemo } from 'react';
import { NavLink, Link } from 'react-router-dom';
import './Sidebar.css';
import {
    FaTachometerAlt,
    FaFolderOpen,
    FaComments,
    FaShareAlt,
    FaCog,
    FaPen,
    FaExternalLinkAlt,
    FaBell
} from 'react-icons/fa';

const menuItems = [
    { label: '대시보드', path: '/mypage', icon: <FaTachometerAlt /> },
    { label: '알림', path: '/mypage/notifications', icon: <FaBell /> },
    { label: '프로젝트', path: '/mypage/project', icon: <FaFolderOpen /> },
    { label: '커뮤니티', path: '/mypage/community', icon: <FaComments /> },
    { label: '공유됨', path: '/mypage/shared', icon: <FaShareAlt /> },
    { label: '설정', path: '/mypage/setting', icon: <FaCog /> },
];

const Sidebar = ({ nickname = '' }) => {
    const storedHandle = useMemo(() => {
        if (typeof window === 'undefined') return '';
        try {
            const handle = window.localStorage.getItem('username') || '';
            return handle.replace(/^@/, '');
        } catch (err) {
            console.error('Failed to read username from storage', err);
            return '';
        }
    }, []);

    const displayName = nickname || storedHandle || 'Guest';
    const profileHandle = storedHandle ? `@${storedHandle}` : '@kimcoding';
    const initials = useMemo(() => (displayName || '').trim().charAt(0).toUpperCase() || 'Z', [displayName]);

    return (
        <aside className="mypage-sidebar" aria-label="마이페이지 사이드바">
            <div className="mypage-sidebar__profile">
                <div className="mypage-sidebar__avatar" aria-hidden="true">
                    {initials}
                </div>
                <div className="mypage-sidebar__meta">
                    <span className="mypage-sidebar__name">{displayName}</span>
                    <span className="mypage-sidebar__handle">{profileHandle}</span>
                    <Link to="/mypage/setting" className="mypage-sidebar__edit">
                        <FaPen /> 프로필 수정
                    </Link>
                </div>
            </div>

            <nav className="mypage-sidebar__nav" aria-label="마이페이지 메뉴">
                <ul>
                    {menuItems.map(({ label, path, icon }) => (
                        <li key={path}>
                            <NavLink
                                to={path}
                                end={path === '/mypage'}
                                className={({ isActive }) =>
                                    `mypage-sidebar__link${isActive ? ' is-active' : ''}`
                                }
                            >
                                <span className="mypage-sidebar__icon" aria-hidden="true">{icon}</span>
                                <span className="mypage-sidebar__label">{label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            <div className="mypage-sidebar__cta">
                <p>
                    커뮤니티 활동을 이어가고 싶다면,<br /> 지금 바로 최신 글을 확인해보세요.
                </p>
                <Link to="/community" className="mypage-sidebar__cta-button">
                    <FaExternalLinkAlt aria-hidden="true" /> 커뮤니티 바로가기
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;
