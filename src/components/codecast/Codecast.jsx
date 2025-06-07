import React from "react";
import { FaPlus, FaArrowRight, FaDesktop } from "react-icons/fa";
import "./Codecast.css";
import {Link} from "react-router-dom";

const Codecast = () => {
    return (
        <div>

            <section className="broadcast-container">
                <div className="broadcast-header">
                    <FaDesktop className="broadcast-icon" />
                    <h2>코드 방송</h2>
                    <p>
                        실시간으로 코드를 공유하고 함께 학습하세요.<br/>
                        방송 코드를 입력하거나 직접 방송을 시작해보세요.
                    </p>
                </div>

                <div className="broadcast-card">
                    <div className="broadcast-join">
                        <h3>방송 참여하기</h3>
                        <p>방송 코드를 입력하여 진행 중인 방송에 참여하세요.</p>
                        <div className="input-group">
                            <input type="text" placeholder="방송 코드 입력"/>
                            <button>
                                <FaArrowRight/>
                                참여하기
                            </button>
                        </div>
                    </div>

                    <div className="hr-with-text"><span>또는</span></div>

                    <div className="broadcast-start">
                        <h3>새 방송 시작하기</h3>
                        <p>새로운 코드 방송을 시작하여 다른 사용자들과 실시간으로 코드를 공유하세요.</p>
                        <Link to="/startbroadcast" className="start-btn">
                            <FaPlus/>
                            새 방송 시작
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Codecast;
