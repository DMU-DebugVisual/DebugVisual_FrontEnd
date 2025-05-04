import React from "react";
import "./Footer.css";
// import logoImage from "../assets/logo.png";
import { FaGithub, FaTwitter, FaFacebook, FaInstagram } from "react-icons/fa"; // 아이콘용

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-content">
                {/* 왼쪽 로고 + 소개 */}
                <div className="footer-section about">
                    <div className="footer-logo">
                        {/*<img src={logoImage} alt="Logo" />*/}
                        <span className="site-name">Zivorp</span>
                    </div>
                    <p>인터랙티브한 코드 시각화 웹 IDE 플랫폼으로 코딩을<br />더 쉽고 재미있게 배워보세요.</p>
                    <div className="social-icons">
                        <FaGithub />
                        <FaTwitter />
                        <FaFacebook />
                        <FaInstagram />
                    </div>
                </div>

                {/* 각 섹션 */}
                <div className="footer-section">
                    <h4>제품</h4>
                    <ul>
                        <li><a href="#">기능</a></li>
                        <li><a href="#">가격</a></li>
                        <li><a href="#">로드맵</a></li>
                        <li><a href="#">릴리즈 노트</a></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>리소스</h4>
                    <ul>
                        <li><a href="#">문서</a></li>
                        <li><a href="#">튜토리얼</a></li>
                        <li><a href="#">블로그</a></li>
                        <li><a href="#">커뮤니티</a></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>회사</h4>
                    <ul>
                        <li><a href="#">소개</a></li>
                        <li><a href="#">채용</a></li>
                        <li><a href="#">연락처</a></li>
                        <li><a href="#">개인정보 처리방침</a></li>
                    </ul>
                </div>
            </div>

            <div className="footer-bottom">
                © 2025 CodeViz. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;