import React from "react";
import headerStyle from "./Header.style";

const Header = ({ activeMenuItem, setActiveMenuItem, darkMode, toggleDarkMode }) => {
    const handleMenuClick = (menuItem) => {
        setActiveMenuItem(menuItem);
    };

    return (
        <>
            <header className={`header ${darkMode ? 'dark' : ''}`}>
                <div className="logo">이름로고</div>
                <nav className="main-nav">
                    <ul className="menu-list">
                        {['home', 'share', 'community', 'setting'].map(item => {
                        const isActive = activeMenuItem === item;
                        return (
                            <li key={item} className="menu-item">
                            <button
                                className={`menu-button ${isActive ? 'active' : ''}`}
                                onClick={() => handleMenuClick(item)}
                                aria-current={isActive ? "page" : undefined}
                                aria-pressed={isActive}
                            >
                                {item.charAt(0).toUpperCase() + item.slice(1)}
                                {isActive && <span className="active-indicator" aria-hidden="true"></span>}
                            </button>
                            </li>
                        );
                        })}
                    </ul>
                </nav>

                <div className="user-profile">
                    <button
                        className="profile-button"
                        onClick={toggleDarkMode}
                    >
                        {darkMode ? '☀️' : '🌙'} hong 님
                    </button>
                </div>
                {headerStyle}
            </header>
            {/* 헤더 높이(60px)만큼 빈 공간을 추가 */}
            <div className="header-placeholder" />
        </>
    );
};

export default Header;
