import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config';
import './Login.css';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';


function Login() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const navigate = useNavigate();

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

            console.log('✅ 로그인 성공:', response.data);

            // 사용자 정보 저장
            localStorage.setItem('token', token);
            localStorage.setItem('username', name);  // ✅ 이름 저장
            localStorage.setItem('userId', userId);
            localStorage.setItem('role', role);

            // 메인 페이지 이동 및 상태 반영 위해 새로고침
            navigate('/', { replace: true });
            window.location.reload();
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

                    <div className="password-container">
                        <label htmlFor="password">비밀번호</label>
                    </div>
                    <input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <div className="forgot-password-link">
                        <a href="#" onClick={(e) => e.preventDefault()}>비밀번호 찾기</a>
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
                    계정이 없으신가요? <Link to="/signup">회원가입</Link>
                </p>

            </div>
        </div>
    );
}

export default Login;
