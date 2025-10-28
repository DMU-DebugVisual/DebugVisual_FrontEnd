// Codecast.jsx
import React, { useState } from "react";
import { FaPlus, FaArrowRight, FaDesktop } from "react-icons/fa";
import "./Codecast.css";
import { Link, useNavigate } from "react-router-dom";
import { promptLogin } from "../../utils/auth";

const Codecast = () => {
    const navigate = useNavigate();
    const [inviteCode, setInviteCode] = useState("");
    const [errorText, setErrorText] = useState("");

    const handleJoin = () => {
        setErrorText("");
        const code = inviteCode.trim();
        if (!code) {
            setErrorText("방송 코드를 입력하세요.");
            return;
        }

        const token = localStorage.getItem("token");
        const username = localStorage.getItem("username");
        if (!token || !username) {
            setErrorText("로그인이 필요합니다. 먼저 로그인해주세요.");
            promptLogin("방송에 참여하려면 로그인이 필요합니다.", { redirectTo: "/broadcast" });
            return;
        }
        // ✅ rid 쿼리로 전달
        navigate(`/broadcast/live?rid=${encodeURIComponent(code)}`);
    };

    return (
        <section className="broadcast-container">
            <div className="broadcast-header">
                <FaDesktop className="broadcast-icon" />
                <h2>코드 방송</h2>
                <p>실시간으로 코드를 공유하고 함께 학습하세요.</p>
            </div>

            <div className="broadcast-card">
                <div className="broadcast-join">
                    <h3>방송 참여하기</h3>
                    <p>방송 코드를 입력하여 진행 중인 방송에 참여하세요.</p>
                    <div className="input-group">
                        <input
                            type="text"
                            placeholder="방송 코드 입력"
                            value={inviteCode}
                            onChange={(e) => setInviteCode(e.target.value)}
                        />
                        <button onClick={handleJoin}>
                            <FaArrowRight />
                            참여하기
                        </button>
                    </div>
                    {errorText && <p className="error-text">{errorText}</p>}
                </div>

                <div className="hr-with-text"><span>또는</span></div>

                <div className="broadcast-start">
                    <h3>새 방송 시작하기</h3>
                    <Link to="/startbroadcast" className="start-btn">
                        <FaPlus /> 새 방송 시작
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Codecast;
