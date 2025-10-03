// src/components/mainpage/startnow/StartNow.jsx

import React from "react";
import "./StartNow.css";
import {Link} from "react-router-dom";
import Footer from "../../footer/Footer"; // 👈 Footer 컴포넌트 임포트 (경로 가정)

const StartNow = () => {
    return (
        // StartNow 섹션은 Main.jsx에 의해 이미 <section>으로 감싸져 있습니다.
        <div className="start-footer-integration-wrapper">

            {/* 실제 StartNow 콘텐츠 */}
            <div className="start-content-container">
                <h2 className="start-title">지금 바로 시작하세요</h2>
                <p className="start-description">
                    코드 시각화 플랫폼으로 알고리즘과 데이터 구조를 더 쉽게 이해하고 학습하세요.<br/>
                    지금 바로 무료로 시작할 수 있습니다.
                </p>
                <Link to="/ide" className="start-button">무료로 시작하기</Link>
            </div>

            {/* 통합된 푸터 */}
            <Footer />
        </div>
    );
};

export default StartNow;