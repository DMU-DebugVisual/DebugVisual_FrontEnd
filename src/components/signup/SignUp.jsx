import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config';
import '../login/Login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import googleIcon from '../../assets/google.png';
import githubIcon from '../../assets/github.png';

function SignUp() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        name: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await axios.post(`${config.API_BASE_URL}/api/users/signup`, {
                userId: formData.email,
                email: formData.email,
                password: formData.password,
                name: formData.email,
            });

            alert('회원가입이 완료되었습니다!');
        } catch (error) {
            console.error('회원가입 오류:', error.response?.data || error.message);
            alert(error.response?.data?.message || '회원가입에 실패했습니다.');
        }
    };

    const isPasswordValid = formData.password.length >= 8;

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

                <label htmlFor="password">비밀번호 *</label>
                <div className="password-input-wrapper">
                    <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                    <button
                        type="button"
                        className="toggle-password-btn"
                        onClick={() => setShowPassword(prev => !prev)}
                        aria-label="비밀번호 보기 토글"
                    >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                </div>

                {formData.password.length === 0 ? (
                    <div className="password-guide neutral">
                        비밀번호는 8자 이상이어야 합니다.
                    </div>
                ) : (
                    <div className={`password-guide ${isPasswordValid ? 'valid' : 'invalid'}`}>
                        {isPasswordValid
                            ? '✔️ 비밀번호는 8자 이상이어야 합니다.'
                            : '❌ 비밀번호는 8자 이상이어야 합니다.'}
                    </div>
                )}

                <div className="signup-check">
                    <input type="checkbox" id="terms" required />
                    <div>
                        <label htmlFor="terms">
                            <strong>이용약관, 개인정보 처리방침에 동의합니다.</strong><br />
                            이용약관, 개인정보 처리방침을 확인 후 동의합니다.
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    className="signup-button"
                    disabled={!isPasswordValid}
                >
                    가입하기
                </button>
            </form>

            <div className="divider">간편 회원가입</div>

            <div className="social-buttons">
                <button type="button" className="social-button google">
                    <img src={googleIcon} alt="Google 로그인" />
                </button>
                <button type="button" className="social-button github">
                    <img src={githubIcon} alt="Github 로그인" />
                </button>
            </div>
        </div>
    );
}

export default SignUp;
