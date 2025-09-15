import React from "react";
import "./Features.css";
import { FaRegFileAlt, FaUsers, FaVideo } from "react-icons/fa";

const Features = ({ id }) => {
    return (
        <section id={id} className="features-section">
            <h2 className="features-title">주요 기능</h2>
            <p className="features-subtitle">
                코드 시각화 플랫폼의 강력한 기능들을 살펴보세요
            </p>

            <div className="features-cards">
                <div className="feature-card">
                    <div className="feature-icon"><FaRegFileAlt /></div>
                    <h3 className="feature-name">코드 시각화</h3>
                    <p className="feature-desc">
                        알고리즘과 데이터 구조의 동작 과정을 단계별로<br />
                        시각화하여 직관적으로 이해할 수 있습니다.
                    </p>
                </div>

                <div className="feature-card">
                    <div className="feature-icon"><FaVideo /></div>
                    <h3 className="feature-name">실시간 코드 방송</h3>
                    <p className="feature-desc">
                        코드 작성 과정을 실시간으로 방송하고 공유하여<br />
                        효과적인 학습과 협업이 가능합니다.
                    </p>
                </div>

                <div className="feature-card">
                    <div className="feature-icon"><FaUsers /></div>
                    <h3 className="feature-name">커뮤니티 공유</h3>
                    <p className="feature-desc">
                        다양한 알고리즘과 데이터 구조 구현을<br />
                        커뮤니티와 공유하고 피드백을 받을 수 있습니다.
                    </p>
                </div>
            </div>
        </section>
    );
};

export default Features;
