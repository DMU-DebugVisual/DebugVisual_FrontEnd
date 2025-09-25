import React from "react";
import "./Intro.css";
import introImage from "./intro.png";
import { Link } from "react-router-dom";
import { Link as ScrollLink } from "react-scroll";

const Intro = () => {
    return (
        <section className="intro-section">
            <div className="intro-left">
                <h1>
                    코드를 시각적으로 이해하는<br />
                    새로운 방법
                </h1>
                <p>
                    알고리즘과 데이터 구조를 시각화하여 더 쉽게 이해하고 학습하세요.<br />
                    코드 방송 기능을 통해 실시간으로 지식을 공유할 수 있습니다.
                </p>
                <div className="intro-buttons">
                    <Link to="/ide" className="btn primary">
                        시작하기
                    </Link>
                    <ScrollLink
                        to="feature"        // 👈 Features.jsx 의 id="feature" 로 이동
                        smooth={true}
                        duration={500}
                        offset={-64}
                        className="btn secondary"
                    >
                        기능 살펴보기
                    </ScrollLink>
                </div>
            </div>

            <div className="intro-right">
                <img src={introImage} alt="Intro Visual" />
            </div>
        </section>
    );
};

export default Intro;
