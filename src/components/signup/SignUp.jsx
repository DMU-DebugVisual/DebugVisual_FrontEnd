import React, { useState } from 'react';
import axios from 'axios';
import config from '../../config';
import '../login/Login.css';
import { FaEye, FaEyeSlash, FaCheck } from 'react-icons/fa';
import googleIcon from '../../assets/google.png';
import githubIcon from '../../assets/github.png';
import { useNavigate } from 'react-router-dom';
import logoImage from '../../assets/logo3.png';

function SignUp() {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [emailTouched, setEmailTouched] = useState(false);
    const navigate = useNavigate();

    const isLengthValid = formData.password.length >= 8 && formData.password.length <= 32;
    const hasTwoTypes = [/[a-zA-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((r) => r.test(formData.password)).length >= 2;
    const noRepeatThree = !/(.)\1\1/.test(formData.password);
    const isPasswordMatch = formData.password === formData.confirmPassword;
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        if (id === 'email') setEmailTouched(true);
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
            navigate('/');
        } catch (error) {
            console.error('회원가입 오류:', error.response?.data || error.message);
            alert(error.response?.data?.message || '회원가입에 실패했습니다.');
        }
    };

    return (
        <div className="signup-container">
            <div className="logo-wrapper">
                <img src={logoImage} alt="Zivorp Logo" className="signup-logo" />
            </div>

            <h1 className="signup-title">회원가입</h1>
            <p className="signup-subtitle">계정을 만들고 코드 시각화를 시작하세요</p>
            <form className="signup-form" onSubmit={handleSubmit}>
                <label htmlFor="email">이메일</label>
                <input id="email" type="email" placeholder="name@example.com" value={formData.email} onChange={handleChange} required />
                {emailTouched && !isEmailValid && (
                    <div className="email-guide invalid">❌ 이메일 형식이 올바르지 않습니다.</div>
                )}

                <label htmlFor="password">비밀번호</label>

                <div className="password-input-wrapper">
                    <input id="password" type={showPassword ? 'text' : 'password'} placeholder="********" value={formData.password} onChange={handleChange} required />
                    <button type="button" className="toggle-password-btn" onClick={() => setShowPassword(prev => !prev)}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
                </div>

                <ul className="password-rules">
                    <li className={formData.password === '' ? 'neutral' : isLengthValid ? 'valid' : 'invalid'}>
                        {formData.password === '' ? <FaCheck color="#aaa" /> : isLengthValid ? '✔️' : '❌'} 8자 이상 32자 이하 입력(공백제외)
                    </li>
                    <li className={formData.password === '' ? 'neutral' : hasTwoTypes ? 'valid' : 'invalid'}>
                        {formData.password === '' ? <FaCheck color="#aaa" /> : hasTwoTypes ? '✔️' : '❌'} 영문/숫자/특수문자 중 2가지 이상 포함
                    </li>
                    <li className={formData.password === '' ? 'neutral' : noRepeatThree ? 'valid' : 'invalid'}>
                        {formData.password === '' ? <FaCheck color="#aaa" /> : noRepeatThree ? '✔️' : '❌'} 연속 3자 이상 동일한 문자/숫자 제외
                    </li>
                </ul>

                <label htmlFor="confirmPassword">비밀번호 확인</label>
                <div className="password-input-wrapper">
                    <input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="********" value={formData.confirmPassword} onChange={handleChange} required />
                    <button type="button" className="toggle-password-btn" onClick={() => setShowConfirmPassword(prev => !prev)}>{showConfirmPassword ? <FaEyeSlash /> : <FaEye />}</button>
                </div>
                {formData.confirmPassword && !isPasswordMatch && (
                    <div className="confirm-password invalid">❌ 비밀번호가 일치하지 않습니다.</div>
                )}

                <button type="submit" className="signup-button" disabled={!(isLengthValid && hasTwoTypes && noRepeatThree && isPasswordMatch && isEmailValid)}>
                    가입하기
                </button>

                <div className="signup-check">
                    <label htmlFor="terms" className="terms-label">
                        가입 시, 통합 계정 및 서비스 이용약관, 개인정보 처리방침에 동의하는 것으로 간주합니다.
                    </label>
                </div>
                <div className="signup-benefit">
                    <input type="checkbox" id="benefits" defaultChecked />
                    <label htmlFor="benefits" className="benefits-label">
                        통합회원 할인 혜택 및 유용한 채용 소식을 받아볼래요.
                    </label>
                </div>

            </form>

            <div className="divider">간편 회원가입</div>
            <div className="social-buttons">
                <button type="button" className="social-button google"><img src={googleIcon} alt="Google 로그인" /><span>Google</span></button>
                <button type="button" className="social-button github"><img src={githubIcon} alt="Github 로그인" /><span>Github</span></button>
            </div>
        </div>
    );
}

export default SignUp;
