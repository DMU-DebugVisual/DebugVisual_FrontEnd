import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

// 아이콘 import
import { FaTachometerAlt, FaFolderOpen, FaComments, FaGlobe, FaShareAlt, FaCog } from 'react-icons/fa';

const Sidebar = () => {
    const menuItems = [
        { label: '대시보드', path: '/mypage', icon: <FaTachometerAlt /> },
        { label: '프로젝트', path: '/mypage/project', icon: <FaFolderOpen /> },
        { label: '커뮤니티', path: '/mypage/community', icon: <FaComments /> },
        { label: '네트워크', path: '/mypage/network', icon: <FaGlobe /> },
        { label: '공유됨', path: '/mypage/shared', icon: <FaShareAlt /> },
        { label: '설정', path: '/mypage/setting', icon: <FaCog /> },
    ];

    return (
        <aside
            className="sidebar"
            onMouseLeave={() => document.body.classList.remove("body-scroll")}
        >
            <div className="username">
                <div className="avatar-small"/>
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
                            end={item.path === "/mypage"}
                            className={({isActive}) => (isActive ? 'active' : '')}
                        >
                            <span className="icon">{item.icon}</span>
                            <span className="label">{item.label}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default Sidebar;
