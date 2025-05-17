import React from "react";
import "./StartNow.css";
import {Link} from "react-router-dom";

const StartNow = () => {
    return (
        <section className="start-section">
            <h2 className="start-title">지금 바로 시작하세요</h2>
            <p className="start-description">
                코드 시각화 플랫폼으로 알고리즘과 데이터 구조를 더 쉽게 이해하고 학습하세요.<br/>
                지금 바로 무료로 시작할 수 있습니다.
            </p>
            <Link to="/ide" className="start-button">무료로 시작하기</Link>
        </section>
    );
};

export default StartNow;