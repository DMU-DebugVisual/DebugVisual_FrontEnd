import React, { useState } from "react";
import {
    FaBold, FaItalic, FaStrikethrough, FaLink, FaPalette, FaCode, FaQuoteRight,
    FaImage, FaHeading, FaListUl, FaListOl, FaMinus
} from "react-icons/fa";
import "./CommunityWrite.css";

export default function CommunityWrite() {
    const defaultGuide = `- 학습 관련 질문을 남겨주세요. 상세히 작성하면 더 좋아요!
- 마크다운, 단축키를 이용해서 편리하게 글을 작성할 수 있어요.
- 먼저 유사한 질문이 있었는지 검색해보세요.
- 서로를 배려하며 기본 존중하는 문화를 만들어가요.`;

    const [title, setTitle] = useState("");
    const [tags, setTags] = useState("");
    const [content, setContent] = useState(defaultGuide);

    const handleFocus = () => {
        if (content === defaultGuide) setContent("");
    };

    const handleBlur = () => {
        if (content.trim() === "") setContent(defaultGuide);
    };

    const handleSubmit = () => {
        if (!title || content === defaultGuide || content.trim() === "") {
            alert("제목과 내용을 작성해주세요!");
            return;
        }

        console.log("제목:", title);
        console.log("태그:", tags);
        console.log("내용:", content);
    };

    return (
        <div className="community-write-page">
            <div className="top-nav">
                <span>질문</span>
                <span>고민있어요</span>
                <span>스터디</span>
                <span>팀 프로젝트</span>
            </div>

            <input
                type="text"
                className="title-input"
                placeholder="제목에 핵심 내용을 요약해보세요."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
            />

            <input
                type="text"
                className="tag-input"
                placeholder="태그를 설정하세요 (최대 10개)"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
            />

            <div className="markdown-toolbar">
                <button><FaBold /></button>
                <button><FaItalic /></button>
                <button><FaStrikethrough /></button>
                <button><FaLink /></button>
                <button><FaPalette /></button>
                <button><FaCode /></button>
                <button><FaQuoteRight /></button>
                <button><FaImage /></button>
                <button><FaHeading /></button>
                <button><FaListUl /></button>
                <button><FaListOl /></button>
                <button><FaMinus /></button>
            </div>

            <textarea
                className={`content-textarea ${content === defaultGuide ? "placeholder-style" : ""}`}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
            />

            <div className="write-actions">
                <button className="cancel-btn">취소</button>
                <button className="submit-btn" onClick={handleSubmit}>등록</button>
            </div>
        </div>
    );
}
