import React from "react";
import { FaArrowRight } from "react-icons/fa";
import "./Codecast.css";
import Header from "../header/Header";

const StartCodecast = () => {
    return (
        <div>
            <Header />
            <section className="broadcast-container">
                <div className="broadcast-header">
                    <h2>새 방송 시작하기</h2>
                    <p>새로운 코드 방송을 시작하여 다른 사용자들과 실시간으로 코드를 공유하세요.</p>
                </div>

                <div className="broadcast-card">
                    <div className="start-input-group">
                        <label>
                            방 이름 <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="roomName"
                            placeholder="방 이름을 입력하세요"
                        />
                    </div>

                    <div className="start-input-group">
                        <label>방송 코드</label>
                        <input
                            type="text"
                            id="roomCode"
                            placeholder="방송 코드를 입력하세요 (선택사항)"
                        />
                        <p className="help-text">
                            방송 코드는 다른 사용자가 방송에 참여할 때 사용됩니다.
                        </p>
                    </div>

                    <button className="start-btn">
                        방송 시작하기 <FaArrowRight />
                    </button>
                </div>
            </section>
        </div>
    );
};

export default StartCodecast;
