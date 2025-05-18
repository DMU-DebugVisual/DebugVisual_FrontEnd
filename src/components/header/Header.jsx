import React, { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";
import { FaMoon, FaSun } from "react-icons/fa";
import "./Header.css";

const Header = ({ isLoggedIn, nickname }) => {
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        document.body.classList.toggle("dark-mode", isDark);
    }, [isDark]);

    return (
        <header className="custom-header">
            <div className="header-left">
                <span className="site-name">Zivorp</span>
            </div>

            <nav className="header-nav">
                <NavLink to="/" end>홈</NavLink>
                {/*<NavLink to="/features">기능</NavLink>*/}
                <ScrollLink
                    to="feature"
                    smooth
                    duration={500}
                    offset={-64}
                    spy={true}
                    activeClass="active"
                >
                    기능
                </ScrollLink>
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
                    <span className="user-nickname">👤 {nickname}</span>
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
