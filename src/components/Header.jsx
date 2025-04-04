import React from "react";
import "../styles/Header.css";

const Header = ({ activeMenuItem, setActiveMenuItem, darkMode, toggleDarkMode }) => {
    const handleMenuClick = (menuItem) => {
        setActiveMenuItem(menuItem);
    };

    return (
        <header className={`header ${darkMode ? 'dark' : ''}`}>
            <div className="logo">이름로고</div>
            <nav className="main-nav">
                <ul className="menu-list">
                    {['home', 'share', 'community', 'setting'].map(item => (
                        <li key={item} className="menu-item">
                            <button
                                className={`menu-button ${activeMenuItem === item ? 'active' : ''}`}
                                onClick={() => handleMenuClick(item)}
                            >
                                {item}
                                {activeMenuItem === item && (
                                    <div className="active-indicator"></div>
                                )}
                            </button>
                        </li>
                    ))}
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
        </header>
    );
};
export default Header;
