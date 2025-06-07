import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config';
import { useNavigate } from 'react-router-dom';
import logoImage from '../../assets/logo3.png';
import googleIcon from '../../assets/google.png';
import githubIcon from '../../assets/github.png';

function Login({ onClose, onLoginSuccess }) {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`${config.API_BASE_URL}/api/users/login`, {
                userId: formData.username,
                password: formData.password,
            });

            const { token, name, role, userId } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('username', name);
            localStorage.setItem('userId', userId);
            localStorage.setItem('role', role);

            onLoginSuccess();
            onClose();
        } catch (error) {
            console.error('❌ 로그인 실패:', error.response?.data || error.message);
            alert(error.response?.data?.message || '로그인에 실패했습니다.');
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <button className="modal-close" onClick={onClose}>×</button>
                <div className="logo-wrapper">
                    <img src={logoImage} alt="Zivorp Logo" className="login-logo" />
                </div>

                <form className="login-form" onSubmit={handleSubmit}>
                    <input
                        id="username"
                        type="text"
                        placeholder="아이디"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />

                    <div className="password-input-wrapper">
                        <input
                            id="password"
                            type="password"
                            placeholder="비밀번호"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit">로그인</button>
                </form>

                <div className="auth-links">
                    <a href="/forgot-password">비밀번호 찾기</a>
                    <span className="separator">|</span>
                    <span
                        className="signup-action"
                        onClick={() => {
                            onClose();
                            navigate('/signup');
                        }}
                    >
                        회원가입
                    </span>
                    <span className="separator">|</span>
                    <a href="/forgot-password">아이디 찾기</a>
                </div>

                <div className="divider">간편 로그인</div>

                <div className="social-buttons">
                    <button type="button" className="social-button google">
                        <img src={googleIcon} alt="Google 로그인" />
                    </button>
                    <button type="button" className="social-button github">
                        <img src={githubIcon} alt="Github 로그인" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;
