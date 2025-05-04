import React from "react";
import "./DemoView.css";

const DemoView = () => {
    return (
        <section className="demo-section">
            <h2 className="demo-title">코드 시각화 데모</h2>
            <p className="demo-subtitle">
                알고리즘과 데이터 구조의 동작 과정을 시각적으로 이해해보세요
            </p>

            <div className="demo-content">
                <div className="demo-box placeholder-box">
                    <strong>코드 에디터 영역</strong>
                </div>

                <div className="demo-box placeholder-box">
                    <strong>시각화 결과 영역</strong>
                </div>
            </div>
        </section>
    );
};

export default DemoView;
