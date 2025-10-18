// StartCodecast.jsx
import React, { useState } from "react";
import { FaArrowRight } from "react-icons/fa";
import "./Codecast.css";
import { useNavigate } from "react-router-dom";
import { createRoom } from "./api/collab";

const StartCodecast = () => {
    const navigate = useNavigate();
    const [roomName, setRoomName] = useState("");
    const [roomCode, setRoomCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [errMsg, setErrMsg] = useState("");

    const handleCreate = async () => {
        setErrMsg("");

        const token = localStorage.getItem("token");
        const username = localStorage.getItem("username");
        if (!token || !username) {
            setErrMsg("로그인이 필요합니다. 먼저 로그인해주세요.");
            return;
        }
        if (!roomName.trim()) {
            setErrMsg("방 이름을 입력해주세요.");
            return;
        }

        try {
            setLoading(true);
            const data = await createRoom({
                token,
                name: roomName.trim(),
                // code: roomCode.trim() || undefined,
            });

            const roomId = data.roomId;
            // ✅ 쿼리스트링 rid로 입장 + state로 보조 정보 전달
            navigate(`/broadcast/live?rid=${encodeURIComponent(roomId)}`, {
                state: {
                    roomId,
                    title: data.roomName || roomName.trim(),
                    defaultSessionId: data.defaultSessionId || null,
                    ownerId: data.ownerId,
                    accessCode: roomCode.trim() || null,
                },
            });
        } catch (err) {
            console.error(err);
            setErrMsg(
                err.status === 401
                    ? "로그인이 만료되었습니다. 다시 로그인해주세요."
                    : err.message || "방 생성 중 오류가 발생했습니다."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
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
                            value={roomName}
                            onChange={(e) => setRoomName(e.target.value)}
                        />
                    </div>

                    <div className="start-input-group">
                        <label>방송 코드 (선택)</label>
                        <input
                            type="text"
                            id="roomCode"
                            placeholder="방송 코드를 입력하세요 (선택사항)"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value)}
                        />
                        <p className="help-text">방송 코드는 다른 사용자가 방송에 참여할 때 사용됩니다.</p>
                    </div>

                    {errMsg && <p className="error-text">{errMsg}</p>}

                    <button className="start-btn" onClick={handleCreate} disabled={loading}>
                        {loading ? "생성 중..." : <>방송 시작하기 <FaArrowRight /></>}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default StartCodecast;
