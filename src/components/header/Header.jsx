import React, { useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { FaMoon, FaSun, FaUserCircle } from "react-icons/fa";
import "./Header.css";

const Header = ({ isDark, setIsDark, isLoggedIn, nickname, onLoginModalOpen }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation(); // ✅ 현재 경로 확인

    const handleLogout = () => {
        localStorage.clear();

        if (location.pathname.startsWith("/mypage")) {
            navigate("/"); // ✅ 마이페이지일 때만 홈으로 이동
        } else {
            navigate(location.pathname); // 그대로 현재 페이지 유지
        }

        window.location.reload(); // 상태 강제 반영
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
                            <FaUserCircle size={24} className="user-icon" />
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
                        <button onClick={onLoginModalOpen} className="btn btn-outline">
                            로그인
                        </button>
                        <Link to="/signup" className="btn btn-filled">
                            회원가입
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;
