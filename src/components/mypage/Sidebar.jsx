import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    const menuItems = [
        { label: '📊 대시보드', path: '/mypage' },
        { label: '🗂️ 프로젝트', path: '/mypage/project' },
        { label: '💬 커뮤니티', path: '/mypage/community' },
        { label: '🌐 네트워크', path: '/mypage/network' },
        { label: '📁 공유됨', path: '/mypage/shared' },
        { label: '⚙️ 설정', path: '/mypage/setting' }
    ];

    return (
        <aside className="sidebar">
            <div className="username">
                <div className="avatar-small" />
                <div className="user-info">
                    <span className="name">김코딩</span>
                    <span className="email">@kimcoidng</span>
                </div>
            </div>

            <ul>
                {menuItems.map(item => (
                    <li key={item.path}>
                        <NavLink
                            to={item.path}
                            end={item.path === "/mypage"} // ✅ 대시보드일 때만 end 속성 적용
                            className={({ isActive }) => (isActive ? 'active' : '')}
                        >
                            {item.label}
                        </NavLink>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default Sidebar;
