import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar = () => {
    const [activeTab, setActiveTab] = useState('대시보드');

    const menuItems = [
        { label: '📊 대시보드', key: '대시보드' },
        { label: '🗂️ 프로젝트', key: '프로젝트' },
        { label: '💬 커뮤니티', key: '커뮤니티' },
        { label: '🌐 네트워크', key: '네트워크' },
        { label: '📁 공유됨', key: '공유됨' },
        { label: '⚙️ 설정', key: '설정' }
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
                    <li
                        key={item.key}
                        className={activeTab === item.key ? 'active' : ''}
                        onClick={() => setActiveTab(item.key)}
                    >
                        {item.label}
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default Sidebar;
