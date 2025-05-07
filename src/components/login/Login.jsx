// src/components/Login.jsx
import React from 'react';
import './Login.css'; // CSS 파일 import

function Login() {
    return (
        <div className="login-container">
            <div className="login-box">
                <h1 className="login-title">로그인</h1>
                <p className="login-subtitle">계정에 로그인하여 CodeViz를 시작하세요</p>
                <form className="login-form">
                    <label htmlFor="username">아이디</label>
                    <input
                        id="username"
                        type="text"
                        placeholder="사용자 아이디 입력"
                        required
                    />
                    <div className="password-container">
                        <label htmlFor="password">비밀번호</label>
                        <a href="/forgot-password">비밀번호 찾기</a>
                    </div>
                    <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        required
                    />
                    <div className="remember-me">
                        <input type="checkbox" id="remember" />
                        <label htmlFor="remember">로그인 상태 유지</label>
                    </div>
                    <button type="submit">로그인</button>
                </form>
                <div className="divider">또는 소셜 계정으로 로그인</div>
                <div className="social-buttons">
                    <button disabled>Google</button>
                    <button disabled>Github</button>
                </div>
                <p className="signup-link">
                    계정이 없으신가요? <a href="/signup">회원가입</a>
                </p>
            </div>
        </div>
    );
}

export default Login;
