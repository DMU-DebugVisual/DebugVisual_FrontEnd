import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    FaBold, FaItalic, FaStrikethrough, FaLink, FaPalette, FaCode, FaQuoteRight,
    FaImage, FaHeading, FaListUl, FaListOl, FaMinus
} from "react-icons/fa";
import "./CommunityWrite.css";

const API_BASE = "http://52.79.145.160:8080";

// ✅ 백엔드 ENUM과 일치하는 허용 태그
const ALLOWED_TAGS = [
    "JAVA","C","CPP","JPA","JAVASCRIPT","PYTHON","OOP","BIGDATA","SPRING","TYPESCRIPT","ML"
];

// ✅ 흔한 표기 → ENUM 매핑(한국어/소문자/동의어 흡수)
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
    if (TAG_SYNONYM[keyLC]) return TAG_SYNONYM[keyLC]; // 동의어 우선
    const upper = k.toUpperCase();
    return ALLOWED_TAGS.includes(upper) ? upper : null;
}

// 입력 문자열 → ENUM 배열(중복 제거, 최대 10개)
function parseTagsInput(input) {
    const list = input
        .split(/[#,，,\s]+/) // 쉼표/공백/# 구분
        .map(normalizeToEnumTag)
        .filter(Boolean);
    return Array.from(new Set(list)).slice(0, 10);
}

export default function CommunityWrite() {
    const navigate = useNavigate();
    const location = useLocation();

    const defaultGuide = `- 학습 관련 질문을 남겨주세요. 상세히 작성하면 더 좋아요!
- 마크다운, 단축키를 이용해서 편리하게 글을 작성할 수 있어요.
- 먼저 유사한 질문이 있었는지 검색해보세요.
- 서로를 배려하며 기본 존중하는 문화를 만들어가요.`;

    const [title, setTitle] = useState("");
    const [tags, setTags] = useState("");
    const [content, setContent] = useState(defaultGuide);
    const [submitting, setSubmitting] = useState(false);

    // 비회원 접근 차단(알림은 로그인 페이지에서 처리)
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/", { replace: true, state: { reason: "auth-required", from: location.pathname } });
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
            navigate("/login", { replace: true, state: { reason: "auth-required", from: location.pathname } });
            return;
        }

        const t = title.trim();
        const c = content === defaultGuide ? "" : content.trim();
        if (!t || !c) {
            alert("제목과 내용을 작성해주세요!");
            return;
        }

        // ✅ 태그 정규화/검증 → ENUM 배열
        const tagArray = parseTagsInput(tags);

        // 사용자가 뭔가 입력했는데 결과가 0개면 허용값 아님
        if (tags.trim() && tagArray.length === 0) {
            alert(`지원하는 태그만 사용할 수 있어요.\n허용값: ${ALLOWED_TAGS.join(", ")}`);
            return;
        }

        const payload = tagArray.length > 0
            ? { title: t, content: c, tags: tagArray }
            : { title: t, content: c };

        try {
            setSubmitting(true);
            const res = await fetch(`${API_BASE}/api/posts`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
                credentials: "include",
                body: JSON.stringify(payload),
            });

            if (res.status === 401 || res.status === 403) {
                navigate("/login", { replace: true, state: { reason: "auth-required", from: location.pathname } });
                return;
            }
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
                placeholder="태그(쉼표/공백/해시 구분, 예: java, oop, 빅데이터)"
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
                <button className="cancel-btn" onClick={() => navigate(-1)}>취소</button>
                <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "등록 중..." : "등록"}
                </button>
            </div>
        </div>
    );
}
