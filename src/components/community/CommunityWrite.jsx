import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    FaBold, FaItalic, FaStrikethrough, FaLink, FaPalette, FaCode, FaQuoteRight,
    FaImage, FaHeading, FaListUl, FaListOl, FaMinus
} from "react-icons/fa";
import "./CommunityWrite.css";
import config from "../../config";
import { promptLogin } from "../../utils/auth";

// ✅ 백엔드 ENUM과 일치하는 허용 태그
const ALLOWED_TAGS = [
    "JAVA","C","CPP","JPA","JAVASCRIPT","PYTHON","OOP","BIGDATA","SPRING","TYPESCRIPT","ML"
];

// ✅ 흔한 표기 → ENUM 매핑
const TAG_SYNONYM = {
    js: "JAVASCRIPT", javascript: "JAVASCRIPT", 자바스크립트: "JAVASCRIPT",
    java: "JAVA", 자바: "JAVA",
    "c++": "CPP", cpp: "CPP", c: "C",
    typescript: "TYPESCRIPT", ts: "TYPESCRIPT", 타이프스크립트: "TYPESCRIPT",
    spring: "SPRING",
    python: "PYTHON", 파이썬: "PYTHON",
    jpa: "JPA",
    oop: "OOP", 객체지향: "OOP",
    bigdata: "BIGDATA", 빅데이터: "BIGDATA",
    ml: "ML", 머신러닝: "ML",
};

function normalizeToEnumTag(raw) {
    if (!raw) return null;
    const k = raw.replace(/^#/, "").trim();
    const keyLC = k.toLowerCase();
    if (TAG_SYNONYM[keyLC]) return TAG_SYNONYM[keyLC];
    const upper = k.toUpperCase();
    return ALLOWED_TAGS.includes(upper) ? upper : null;
}

// 입력 문자열 → ENUM 배열(중복 제거, 최대 10개)
function parseTagsInput(input) {
    const list = input
        .split(/[#,，,\s]+/)
        .map(normalizeToEnumTag)
        .filter(Boolean);
    return Array.from(new Set(list)).slice(0, 10);
}

export default function CommunityWrite() {
    const navigate = useNavigate();
    const location = useLocation();
    const loginPromptedRef = useRef(false);

    const defaultGuide = `- 학습 관련 질문을 남겨주세요. 상세히 작성하면 더 좋아요!
- 마크다운, 단축키를 이용해서 편리하게 글을 작성할 수 있어요.
- 먼저 유사한 질문이 있었는지 검색해보세요.
- 서로를 배려하며 기본 존중하는 문화를 만들어가요.`;

    const [title, setTitle] = useState("");
    const [tags, setTags] = useState("");
    const [content, setContent] = useState(defaultGuide);
    const [submitting, setSubmitting] = useState(false);
    const guideItems = defaultGuide
        .split("\n")
        .map((line) => line.replace(/^-\s*/, "").trim())
        .filter(Boolean);
    const categories = ["질문", "고민있어요", "스터디", "팀 프로젝트"];
    const toolbarButtons = [
        { Icon: FaBold, label: "굵게" },
        { Icon: FaItalic, label: "기울임" },
        { Icon: FaStrikethrough, label: "취소선" },
        { Icon: FaLink, label: "링크" },
        { Icon: FaPalette, label: "하이라이트" },
        { Icon: FaCode, label: "코드" },
        { Icon: FaQuoteRight, label: "인용" },
        { Icon: FaImage, label: "이미지" },
        { Icon: FaHeading, label: "제목" },
        { Icon: FaListUl, label: "목록" },
        { Icon: FaListOl, label: "번호 목록" },
        { Icon: FaMinus, label: "구분선" },
    ];
    const titleInputId = "community-write-title";
    const tagInputId = "community-write-tag";
    const contentInputId = "community-write-content";

    // ✅ 비회원 접근 차단: 알림 + 커뮤니티 페이지로 이동
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token && !loginPromptedRef.current) {
            loginPromptedRef.current = true;
            promptLogin();
            navigate("/community", { replace: true, state: { from: location.pathname } });
        }
    }, [navigate, location.pathname]);

    const handleFocus = () => {
        if (content === defaultGuide) setContent("");
    };
    const handleBlur = () => {
        if (content.trim() === "") setContent(defaultGuide);
    };

    const handleSubmit = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            promptLogin();
            return;
        }

        const t = title.trim();
        const c = content === defaultGuide ? "" : content.trim();
        if (!t || !c) {
            alert("제목과 내용을 작성해주세요!");
            return;
        }

        const tagArray = parseTagsInput(tags);

        if (tags.trim() && tagArray.length === 0) {
            alert(`지원하는 태그만 사용할 수 있어요.\n허용값: ${ALLOWED_TAGS.join(", ")}`);
            return;
        }

        const payload = tagArray.length > 0
            ? { title: t, content: c, tags: tagArray }
            : { title: t, content: c };

        try {
            setSubmitting(true);
            const res = await fetch(`${config.API_BASE_URL}/api/posts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const ct = res.headers.get("content-type") || "";
                const msg = ct.includes("application/json") ? (await res.json()).message : await res.text();
                throw new Error(msg || `등록 실패 (${res.status})`);
            }

            const created = await res.json().catch(() => null);
            alert("등록되었습니다.");
            if (created?.id) navigate(`/community/post/${created.id}`);
            else navigate("/community");
        } catch (e) {
            alert(e.message || "등록 중 오류가 발생했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="community-write-shell">
            <div className="community-write-layout">
                <section className="write-main-card">
                    <header className="write-header">
                        <span className="write-header-pill">Community</span>
                        <div className="write-header-text">
                            <h1>새 글 작성</h1>
                            <p>배운 것과 궁금한 것을 공유해보세요.</p>
                        </div>
                    </header>

                    <nav className="top-nav" aria-label="글쓰기 카테고리">
                        {categories.map((category, index) => (
                            <button
                                key={category}
                                type="button"
                                className={`top-nav-button ${index === 0 ? "active" : ""}`}
                            >
                                {category}
                            </button>
                        ))}
                    </nav>

                    <div className="field">
                        <label htmlFor={titleInputId}>제목</label>
                        <input
                            id={titleInputId}
                            type="text"
                            className="title-input"
                            placeholder="제목에 핵심 내용을 요약해보세요."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="field">
                        <label htmlFor={tagInputId}>태그</label>
                        <input
                            id={tagInputId}
                            type="text"
                            className="tag-input"
                            placeholder="태그(쉼표/공백/해시 구분, 예: java, oop, 빅데이터)"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                        />
                        <p className="field-helper">최대 10개까지 선택할 수 있어요.</p>
                    </div>

                    <div className="editor-field">
                        <div className="editor-header">
                            <span className="editor-title">본문</span>
                            <span className="editor-subtitle">Markdown · 단축키 지원</span>
                        </div>
                        <div className="editor-surface">
                            <div className="markdown-toolbar" role="toolbar" aria-label="마크다운 작성 도구">
                                {toolbarButtons.map(({ Icon, label }) => (
                                    <button type="button" key={label} title={label} aria-label={label}>
                                        <Icon />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                id={contentInputId}
                                className={`content-textarea ${content === defaultGuide ? "placeholder-style" : ""}`}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                aria-label="게시글 본문"
                            />
                        </div>
                    </div>

                    <div className="write-actions">
                        <button type="button" className="cancel-btn" onClick={() => navigate(-1)}>취소</button>
                        <button type="button" className="submit-btn" onClick={handleSubmit} disabled={submitting}>
                            {submitting ? "등록 중..." : "등록"}
                        </button>
                    </div>
                </section>

                <aside className="write-side-panel" aria-label="작성 가이드">
                    <div className="side-card">
                        <h3>작성 가이드</h3>
                        <ul>
                            {guideItems.map((item, index) => (
                                <li key={index}>{item}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="side-card">
                        <h3>태그 규칙</h3>
                        <p>아래 항목 중에서 선택할 수 있어요.</p>
                        <div className="tag-chip-group">
                            {ALLOWED_TAGS.map((tag) => (
                                <span key={tag} className="tag-chip">#{tag.toLowerCase()}</span>
                            ))}
                        </div>
                    </div>
                    <div className="side-card side-reminder">
                        <h3>Tip</h3>
                        <p>등록 버튼을 누르기 전까진 임시 저장되지 않아요. 중요한 내용은 별도로 백업해두세요.</p>
                    </div>
                </aside>
            </div>
        </div>
    );
}
