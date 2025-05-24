import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";
import { FaMoon, FaSun, FaUserCircle } from "react-icons/fa"; // ✅ FaUserCircle 가져옴
import "./Header.css";

const Header = ({ isDark, setIsDark, isLoggedIn, nickname }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate("/");
        window.location.reload();
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const goToMyPage = () => {
        navigate("/mypage");
        setIsMenuOpen(false);
    };

    return (
        <header className="custom-header">
            <div className="header-left">
                <Link to="/" className="site-name">Zivorp</Link>
            </div>

            <nav className="header-nav">
                <NavLink to="/" end>홈</NavLink>
                <ScrollLink to="feature" smooth duration={500} offset={-64} spy={true} activeClass="active" />
                <NavLink to="/ide">IDE</NavLink>
                <NavLink to="/community">커뮤니티</NavLink>
                <NavLink to="/broadcast">코드 방송</NavLink>
            </nav>

            <div className="header-right">
                <button
                    onClick={() => setIsDark(!isDark)}
                    className="theme-toggle-btn"
                    aria-label="Toggle theme"
                >
                    {isDark ? <FaSun /> : <FaMoon />}
                </button>

                {isLoggedIn ? (
                    <div className="user-menu-container">
                        <span className="user-nickname" onClick={toggleMenu}>
                            <FaUserCircle
                                size={24}
                                className={"user-icon"}
                            />
                            {nickname} 님 ▾
                        </span>
                        {isMenuOpen && (
                            <div className="user-dropdown">
                                <button onClick={goToMyPage}>마이페이지</button>
                                <button onClick={handleLogout}>로그아웃</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <Link to="/login" className="btn btn-outline">로그인</Link>
                        <Link to="/signup" className="btn btn-filled">회원가입</Link>
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;
