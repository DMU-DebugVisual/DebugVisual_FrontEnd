import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config';
import './Login.css';
import { useNavigate, useLocation } from 'react-router-dom';

function Login() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const navigate = useNavigate();
    const location = useLocation(); // ✅ 로그인 전 위치 정보 접근
    const from = location.state?.from || '/'; // 없으면 홈으로 fallback

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${config.API_BASE_URL}/api/users/login`, {
                userId: formData.username,
                password: formData.password,
            });

            const { token, name, role, userId } = response.data;

            // localStorage 저장
            localStorage.setItem('token', token);
            localStorage.setItem('username', name);
            localStorage.setItem('userId', userId);
            localStorage.setItem('role', role);

            // ✅ 로그인 성공 후 이전 페이지로 이동
            navigate(from, { replace: true });
            window.location.reload(); // 상태 갱신 위해 새로고침
        } catch (error) {
            console.error('❌ 로그인 실패:', error.response?.data || error.message);
            alert(error.response?.data?.message || '로그인에 실패했습니다.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1 className="login-title">로그인</h1>
                <p className="login-subtitle">계정에 로그인하여 CodeViz를 시작하세요</p>

                <form className="login-form" onSubmit={handleSubmit}>
                    <label htmlFor="username">아이디</label>
                    <input
                        id="username"
                        type="text"
                        placeholder="사용자 아이디 입력"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="password">비밀번호</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <div className="forgot-password-link">
                        <a href="/forgot-password">비밀번호 찾기</a>
                    </div>


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
