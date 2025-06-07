import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config';
import '../login/Login.css';

function SignUp() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
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

        try {
            await axios.post(`${config.API_BASE_URL}/api/users/signup`, {
                userId: formData.username,
                email: formData.email,
                password: formData.password,
                name: formData.name,
            });

            alert('회원가입이 완료되었습니다!');
        } catch (error) {
            console.error('회원가입 오류:', error.response?.data || error.message);
            alert(error.response?.data?.message || '회원가입에 실패했습니다.');
        }
    };

    return (
        <div className="signup-container">
            <h1 className="signup-title">회원가입</h1>
            <p className="signup-subtitle">계정을 만들고 코드 시각화를 시작하세요</p>

            <form className="signup-form" onSubmit={handleSubmit}>
                <label htmlFor="email">이메일 *</label>
                <input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="username">아이디 *</label>
                <input
                    id="username"
                    type="text"
                    placeholder="사용할 아이디 입력"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />

                <label htmlFor="password">비밀번호 *</label>
                <input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                <small className="form-guide">비밀번호는 8자 이상이어야 합니다.</small>

                <label htmlFor="name">이름 *</label>
                <input
                    id="name"
                    type="text"
                    placeholder="홍길동"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />

                <div className="signup-check">
                    <input type="checkbox" id="terms" required />
                    <div>
                        <label htmlFor="terms">
                            <strong>이용약관, 개인정보 처리방침에 동의합니다.</strong><br />
                            이용약관, 개인정보 처리방침을 확인 후 동의합니다.
                        </label>
                    </div>
                </div>

                <button type="submit" className="signup-button">가입하기</button>
            </form>

            <div className="divider">간편 회원가입</div>

            <div className="social-buttons">
                <button disabled>Google</button>
                <button disabled>Github</button>
            </div>
        </div>
    );
}

export default SignUp;
