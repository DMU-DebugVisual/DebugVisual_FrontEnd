import React, { useState } from "react";
import "./CommunityWrite.css";
import { useNavigate } from "react-router-dom";

const CommunityWrite = () => {
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [tags, setTags] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();

        // 임시 처리: 콘솔에 출력
        console.log("제목:", title);
        console.log("내용:", content);
        console.log("태그:", tags.split(',').map(tag => tag.trim()));

        // 추후 API로 전송하거나, 목록에 추가
        alert("작성 완료!");
        navigate("/community");
    };

    return (
        <div className="write-container">
            <h2>📌 새 게시물 작성</h2>
            <form className="write-form" onSubmit={handleSubmit}>
                <label>
                    제목
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </label>
                <label>
                    내용
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows="10"
                        required
                    />
                </label>
                <label>
                    태그 (쉼표로 구분)
                    <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                    />
                </label>
                <button type="submit" className="submit-button">작성하기</button>
            </form>
        </div>
    );
};

export default CommunityWrite;
