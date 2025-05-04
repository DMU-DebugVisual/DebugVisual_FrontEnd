import React from "react";
import "./Header.css"; // CSS 파일 연결
// import logoImage from "../assets/logo.png";

const Header = () => {
    return (
        <header className="custom-header">
            <div className="header-left">
                {/*<img src={logoImage} alt="Logo" className="logo" />*/}
                <span className="site-name">Zivorp</span>
            </div>

            <nav className="header-nav">
                <a href="/">홈</a>
                <a href="/features">기능</a>
                <a href="/ide">IDE</a>
                <a href="/community">커뮤니티</a>
                <a href="/broadcast">코드 방송</a>
            </nav>

            <div className="header-right">
                <a href="/login" className="btn btn-outline">로그인</a>
                <a href="/signup" className="btn btn-filled">회원가입</a>
            </div>
        </header>
    );
};

export default Header;