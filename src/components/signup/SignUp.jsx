// src/components/SignUp.jsx
import React from 'react';
import '../login/Login.css'; // 로그인과 같은 스타일 사용

function SignUp() {
    return (
        <div className="login-container">
            <div className="login-box">
                <h1 className="login-title">회원가입</h1>
                <p className="login-subtitle">CodeViz 계정을 만들고 코드 시각화를 시작하세요</p>

                <form className="login-form">
                    <label htmlFor="username">아이디 *</label>
                    <input id="username" type="text" placeholder="사용할 아이디 입력" required />

                    <label htmlFor="email">이메일 *</label>
                    <input id="email" type="email" placeholder="name@example.com" required />
                    <small>인증번호를 받을 이메일 주소를 입력해주세요.</small>

                    <label htmlFor="password">비밀번호 *</label>
                    <input id="password" type="password" required />
                    <small>비밀번호는 8자 이상이어야 합니다.</small>

                    <label htmlFor="confirm-password">비밀번호 확인 *</label>
                    <input id="confirm-password" type="password" required />

                    <label htmlFor="name">이름 *</label>
                    <input id="name" type="text" placeholder="홍길동" required />

                    <div className="remember-me">
                        <input type="checkbox" id="terms" required />
                        <label htmlFor="terms"><strong>이용약관에 동의합니다.</strong><br />이용약관을 읽고 동의합니다.</label>
                    </div>

                    <div className="remember-me">
                        <input type="checkbox" id="privacy" required />
                        <label htmlFor="privacy"><strong>개인정보 처리방침에 동의합니다.</strong><br />개인정보 처리방침을 확인 후 동의합니다.</label>
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
