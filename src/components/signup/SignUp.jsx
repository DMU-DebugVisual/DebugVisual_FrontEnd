import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config';

import '../login/Login.css';

function SignUp() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        try {
            const response = await axios.post(`${config.API_BASE_URL}/api/users/signup`, {
                userId: formData.username,
                email: formData.email,
                password: formData.password,
                name: formData.name,
            });

            console.log('회원가입 성공:', response.data);
            alert('회원가입이 완료되었습니다!');
        } catch (error) {
            console.error('회원가입 오류:', error.response?.data || error.message);
            alert(error.response?.data?.message || '회원가입에 실패했습니다.');
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h1 className="login-title">회원가입</h1>
                <p className="login-subtitle">CodeViz 계정을 만들고 코드 시각화를 시작하세요</p>

                <form className="login-form" onSubmit={handleSubmit}>
                    <label htmlFor="username">아이디 *</label>
                    <input
                        id="username"
                        type="text"
                        placeholder="사용할 아이디 입력"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="email">이메일 *</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="name@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                    <small>인증번호를 받을 이메일 주소를 입력해주세요.</small>

                    <label htmlFor="password">비밀번호 *</label>
                    <input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <small>비밀번호는 8자 이상이어야 합니다.</small>

                    <label htmlFor="confirmPassword">비밀번호 확인 *</label>
                    <input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />

                    <label htmlFor="name">이름 *</label>
                    <input
                        id="name"
                        type="text"
                        placeholder="홍길동"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />

                    <div className="remember-me">
                        <input type="checkbox" id="terms" required />
                        <label htmlFor="terms">
                            <strong>이용약관에 동의합니다.</strong><br />
                            이용약관을 읽고 동의합니다.
                        </label>
                    </div>

                    <div className="remember-me">
                        <input type="checkbox" id="privacy" required />
                        <label htmlFor="privacy">
                            <strong>개인정보 처리방침에 동의합니다.</strong><br />
                            개인정보 처리방침을 확인 후 동의합니다.
                        </label>
                    </div>

                    <button type="submit">회원가입 완료</button>
                </form>

                <div className="divider">또는 소셜 계정으로 가입</div>

                <div className="social-buttons">
                    <button disabled>Google</button>
                    <button disabled>Github</button>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
