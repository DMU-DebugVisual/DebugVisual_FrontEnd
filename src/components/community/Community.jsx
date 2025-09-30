import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Community.css";
import config from "../../config";

export default function Community() {
    const navigate = useNavigate();
    const tabs = ["전체", "미해결", "해결됨"];
    const filters = ["최신순", "정확도순", "답변많은순", "좋아요순"];

    // ✅ 서버 데이터 상태
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let ignore = false;
        const controller = new AbortController();

        (async () => {
            try {
                setLoading(true);
                setError("");

                const token = localStorage.getItem("token");

                // ✅ 토큰이 있으면 Authorization 헤더 추가
                const headers = {
                    Accept: "application/json",
                };
                if (token) {
                    headers.Authorization = `Bearer ${token}`;
                }

                const res = await fetch(`${config.API_BASE_URL}/api/posts`, {
                    method: "GET",
                    headers,
                    signal: controller.signal,
                    credentials: "include",
                });

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || `목록 조회 실패 (${res.status})`);
                }

                const data = await res.json(); // ← 배열 형태 가정
                if (ignore) return;

                // ✅ createdAt(또는 id) 기준으로 최신 글이 먼저 오도록 정렬
                const getTime = (x) => (x ? Date.parse(x) || 0 : 0);
                const sorted = (Array.isArray(data) ? data : [])
                    .slice()
                    .sort((a, b) => {
                        const diff = getTime(b.createdAt) - getTime(a.createdAt);
                        if (diff !== 0) return diff;
                        return (b.id ?? 0) - (a.id ?? 0);
                    });

                // 🔄 정렬된 목록을 UI 필드로 매핑
                const mapped = sorted.map((p) => ({
                    id: p.id,
                    status: p.status || "",
                    title: p.title,
                    summary: (p.content || "").replace(/<[^>]+>/g, "").slice(0, 120),
                    tags: p.tags || [],
                    author: p.writer || "익명",
                    date: p.createdAt ? new Date(p.createdAt).toLocaleString() : "",
                    likes: p.likeCount ?? 0,
                    comments: p.commentCount ?? 0,
                }));

                setPosts(mapped);
            } catch (e) {
                if (!ignore) setError(e.message || "알 수 없는 오류");
            } finally {
                if (!ignore) setLoading(false);
            }
        })();

        return () => {
            ignore = true;
            controller.abort();
        };
    }, []);

    return (
        <div className="community-wrapper">
            <div className="community-page">
                <aside className="sidebar-left">
                    <h3>함께 공부해요.</h3>
                    <ul>
                        <li className="active">질문 & 답변</li>
                        <li>고민있어요</li>
                        <li>스터디</li>
                        <li>팀 프로젝트</li>
                        <li>블로그</li>
                    </ul>
                    <div className="top-writers">
                        <h4>Zivorp TOP Writers</h4>
                        <ol>
                            <li><span>y2gcoder</span><span>10</span></li>
                            <li><span>durams</span><span>8</span></li>
                            <li><span>David</span><span>7</span></li>
                            <li><span>식빵</span><span>10</span></li>
                            <li><span>이선희</span><span>10</span></li>
                            <li><span>찹찹이</span><span>10</span></li>
                            <li><span>Rio song</span><span>10</span></li>
                        </ol>
                    </div>
                </aside>

                <main className="community-main">
                    <div className="tabs">
                        {tabs.map((tab, i) => (
                            <button key={i} className={i === 0 ? "active-tab" : ""}>{tab}</button>
                        ))}
                    </div>

                    <div className="search-bar">
                        <div className="search-row">
                            <input type="text" placeholder="궁금한 질문을 검색해보세요!" />
                            <button className="search-btn">검색</button>
                        </div>
                        <div className="search-row">
                            <input type="text" placeholder="# 태그로 검색해보세요!" />
                            <button className="reset-btn">초기화</button>
                        </div>
                    </div>

                    <div className="filter-area">
                        <div className="filter-bar">
                            {filters.map((filter, i) => (
                                <button key={i} className={i === 0 ? "active" : ""}>{filter}</button>
                            ))}
                        </div>
                        <button className="write-btn" onClick={() => navigate("/community/write")}>
                            ✏️ 글쓰기
                        </button>
                    </div>

                    {/* ✅ 로딩/에러/빈 상태 */}
                    {loading && <div className="post-list"><p>불러오는 중…</p></div>}
                    {!loading && error && <div className="post-list"><p className="error">{error}</p></div>}
                    {!loading && !error && posts.length === 0 && (
                        <div className="post-list"><p>게시글이 없습니다.</p></div>
                    )}

                    {!loading && !error && posts.length > 0 && (
                        <div className="post-list">
                            {posts.map((post) => (
                                <div
                                    key={post.id}
                                    className="post-card"
                                    onClick={() => navigate(`/community/post/${post.id}`)}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="post-meta">
                                        <div className="title-row">
                                            {post.status ? (
                                                <span className={`badge ${post.status === "해결됨" ? "badge-solved" : ""}`}>
                                                    {post.status}
                                                </span>
                                            ) : null}
                                            <h3 className="post-title">{post.title}</h3>
                                        </div>
                                        <p className="post-summary">{post.summary}</p>
                                    </div>
                                    <div className="post-tags">
                                        {(post.tags || []).map((tag, j) => (
                                            <span key={j} className="tag">{tag}</span>
                                        ))}
                                    </div>
                                    <div className="post-footer">
                                        <div className="post-footer-left">
                                            <span>{post.author}</span>
                                            <span>{post.date}</span>
                                        </div>
                                        <div className="post-footer-right">
                                            <span>👍 {post.likes}</span>
                                            <span>💬 {post.comments}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pagination-wrapper">
                        <div className="page-numbers">
                            <button className="page-button active">1</button>
                            <button className="page-button">2</button>
                            <button className="page-button">3</button>
                            <button className="page-button">4</button>
                            <button className="page-button">5</button>
                        </div>
                        <button className="next-page">다음 페이지</button>
                    </div>
                </main>

                <aside className="sidebar-right">
                    <div className="popular-tags">
                        <h4>인기 태그</h4>
                        <div className="tag-list">
                            <span>Java</span><span>C</span><span>C++</span><span>jpa</span>
                            <span>JavaScript</span><span>Python</span><span>객체지향</span>
                            <span>빅데이터</span><span>spring</span><span>TypeScript</span><span>머신러닝</span>
                        </div>
                    </div>
                    <div className="popular-posts">
                        <h4>주간 인기글</h4>
                        <ul>
                            <li><div className="post-title">버블 정렬 시각화 프로젝트 공유합니다</div><div className="post-author">김코딩</div></li>
                            <li><div className="post-title">그래프 탐색 알고리즘 비교: BFS vs DFS</div><div className="post-author">이알고</div></li>
                            <li><div className="post-title">동적 프로그래밍 문제 해결 가이드</div><div className="post-author">박코딩</div></li>
                            <li><div className="post-title">백엔드 신입 CS 스터디 3기 모집</div><div className="post-author">김지훈</div></li>
                            <li><div className="post-title">AI 실전 활용을 위한 4주 집중 스터디, 애사모!</div><div className="post-author">Edun</div></li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
}
