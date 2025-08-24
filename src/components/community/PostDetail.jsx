// src/pages/PostDetail.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PostDetail.css";

const API_BASE = "http://52.79.145.160:8080";

export default function PostDetail() {
    const { id } = useParams(); // /community/post/:id
    const navigate = useNavigate();

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [loadingPost, setLoadingPost] = useState(true);
    const [loadingComments, setLoadingComments] = useState(true);
    const [error, setError] = useState("");

    // 좋아요 상태
    const [likeCount, setLikeCount] = useState(0);
    const [likedByMe, setLikedByMe] = useState(false); // 서버가 안 주므로 증감으로 추정
    const [liking, setLiking] = useState(false);
    const prevLikeRef = useRef(0);

    // 🆕 댓글 수 상태
    const [commentCount, setCommentCount] = useState(0);

    // 댓글 작성 상태
    const [newComment, setNewComment] = useState("");
    const [posting, setPosting] = useState(false);

    const tokenRaw = useMemo(() => localStorage.getItem("token"), []);
    const authHeader = tokenRaw
        ? tokenRaw.startsWith("Bearer ") ? tokenRaw : `Bearer ${tokenRaw}`
        : null;

    // ===== helpers =====
    const parseIntSafe = (v) => {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    };

    // 댓글 응답으로부터 안전하게 총 개수 계산 (배열/페이지객체/헤더 지원)
    const deriveCommentCount = (resp, data) => {
        // 1) 헤더 우선
        try {
            const fromHeader = resp?.headers?.get?.("X-Total-Count");
            const n = parseIntSafe(fromHeader);
            if (n !== null) return n;
        } catch (_) {}

        // 2) JSON 본문
        if (Array.isArray(data)) return data.length;
        if (data && typeof data === "object") {
            if (typeof data.totalElements === "number") return data.totalElements;
            if (typeof data.total === "number") return data.total;
            if (Array.isArray(data.content)) return data.content.length;
        }
        return 0;
    };

    // 서버 기준 좋아요 수 재조회 (캐시 무력화)
    const refreshLikeCount = async () => {
        try {
            const bust = Date.now();
            const res = await fetch(`${API_BASE}/api/posts/${id}/like?t=${bust}`, {
                method: "GET",
                headers: { Accept: "*/*", "Cache-Control": "no-cache", Pragma: "no-cache" },
                cache: "no-store",
            });
            if (!res.ok) return null;
            const text = await res.text();
            const n = parseIntSafe(text);
            if (n !== null) {
                setLikeCount(n);
                return n;
            }
            return null;
        } catch {
            return null;
        }
    };

    // ===== effects =====
    useEffect(() => {
        let ignore = false;
        const controller = new AbortController();

        (async () => {
            try {
                setLoadingPost(true);
                setError("");

                if (!authHeader) {
                    alert("로그인이 필요합니다.");
                    navigate("/");
                    return;
                }

                // ✅ 게시글 상세
                const res = await fetch(`${API_BASE}/api/posts/${id}`, {
                    method: "GET",
                    headers: { Accept: "application/json", Authorization: authHeader },
                    signal: controller.signal,
                });

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || `게시글 조회 실패 (${res.status})`);
                }

                const data = await res.json();
                if (ignore) return;

                setPost({
                    id: data.id,
                    title: data.title,
                    content: data.content || "",
                    author: data.writer || "익명",
                    date: data.createdAt ? new Date(data.createdAt).toLocaleString() : "",
                    tags: Array.isArray(data.tags) ? data.tags : [],
                });

                // 좋아요 초기화
                const initialLike = data.likeCount ?? 0;
                setLikeCount(initialLike);
                prevLikeRef.current = initialLike;

                // 만약 상세 응답에 commentCount가 있다면 바로 사용 (없으면 댓글 로딩에서 계산)
                if (typeof data.commentCount === "number") {
                    setCommentCount(data.commentCount);
                }
            } catch (e) {
                if (!ignore) setError(e.message || "게시글을 불러오지 못했습니다.");
            } finally {
                if (!ignore) setLoadingPost(false);
            }
        })();

        return () => {
            ignore = true;
            controller.abort();
        };
    }, [id, authHeader, navigate]);

    useEffect(() => {
        if (!authHeader) return;
        let ignore = false;
        const controller = new AbortController();

        (async () => {
            try {
                setLoadingComments(true);

                // ✅ 댓글 목록 (배열/페이지객체 모두 대응)
                const res = await fetch(`${API_BASE}/api/comments/${id}`, {
                    method: "GET",
                    headers: { Accept: "application/json", Authorization: authHeader },
                    signal: controller.signal,
                });

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || `댓글 조회 실패 (${res.status})`);
                }

                const data = await res.json();
                if (ignore) return;

                // 본문 형태별로 comments 상태 세팅
                if (Array.isArray(data)) {
                    setComments(data);
                } else if (data && typeof data === "object" && Array.isArray(data.content)) {
                    setComments(data.content);
                } else {
                    setComments([]);
                }

                // 🆕 총 개수 계산
                const total = deriveCommentCount(res, data);
                setCommentCount(total);
            } catch (e) {
                if (!ignore) console.error(e);
            } finally {
                if (!ignore) setLoadingComments(false);
            }
        })();

        return () => {
            ignore = true;
            controller.abort();
        };
    }, [id, authHeader]);

    // 좋아요 토글 (낙관적 업데이트 + 서버 동기화 + 캐시 무력화)
    const handleToggleLike = async () => {
        if (!authHeader) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }
        if (liking) return;

        const before = likeCount;
        const willLike = !likedByMe;

        try {
            setLiking(true);

            // 1) 낙관적 업데이트
            setLikedByMe(willLike);
            setLikeCount((c) => Math.max(0, c + (willLike ? 1 : -1)));

            // 2) 서버 토글 호출
            const res = await fetch(`${API_BASE}/api/posts/${id}/like`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    Authorization: authHeader,
                    "Cache-Control": "no-cache",
                    Pragma: "no-cache",
                },
                cache: "no-store",
            });

            if (!res.ok) {
                // 실패하면 롤백
                setLikedByMe(!willLike);
                setLikeCount(before);
                const text = await res.text();
                throw new Error(text || `좋아요 처리 실패 (${res.status})`);
            }

            // 3) 최종 서버값으로 재동기화
            const after = await refreshLikeCount();
            if (after != null) {
                if (after > before) setLikedByMe(true);
                else if (after < before) setLikedByMe(false);
                prevLikeRef.current = after;
            }
        } catch (e) {
            alert(e.message || "좋아요 처리 실패");
        } finally {
            setLiking(false);
        }
    };

    // 댓글 작성
    const handleCreateComment = async () => {
        if (!newComment.trim()) return;
        if (!authHeader) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        try {
            setPosting(true);
            const res = await fetch(`${API_BASE}/api/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authHeader,
                },
                body: JSON.stringify({
                    postId: Number(id),
                    parentId: 0,
                    content: newComment,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `댓글 작성 실패 (${res.status})`);
            }

            setNewComment("");

            // 🔄 작성 후 최신 목록/개수 재조회
            const bust = Date.now();
            const refresh = await fetch(`${API_BASE}/api/comments/${id}?t=${bust}`, {
                headers: { Accept: "application/json", Authorization: authHeader, "Cache-Control": "no-cache", Pragma: "no-cache" },
                cache: "no-store",
            });

            if (refresh.ok) {
                const data = await refresh.json();
                if (Array.isArray(data)) {
                    setComments(data);
                } else if (data && typeof data === "object" && Array.isArray(data.content)) {
                    setComments(data.content);
                } else {
                    setComments([]);
                }
                const total = deriveCommentCount(refresh, data);
                setCommentCount(total);
            }
        } catch (e) {
            alert(e.message || "댓글 작성에 실패했습니다.");
        } finally {
            setPosting(false);
        }
    };

    if (loadingPost) {
        return (
            <div className="post-detail-container">
                <div className="post-detail-left"><p>불러오는 중…</p></div>
            </div>
        );
    }
    if (error) {
        return (
            <div className="post-detail-container">
                <div className="post-detail-left"><p className="error">{error}</p></div>
            </div>
        );
    }
    if (!post) {
        return (
            <div className="post-detail-container">
                <div className="post-detail-left"><p>게시글이 없습니다.</p></div>
            </div>
        );
    }

    return (
        <div className="post-detail-container">
            {/* 왼쪽 질문 본문 */}
            <div className="post-detail-left">
                <div className="post-top-divider" />
                <h1 className="post-title">{post.title}</h1>
                <div className="post-subinfo">
                    <span>{post.date} 작성</span>
                    <span>작성자 {post.author}</span>
                    <span>👍 {likeCount}</span>
                    <span>💬 {commentCount}</span> {/* 🆕 댓글 수 표시 */}
                </div>

                <div className="post-content">
                    {/* 서버가 HTML을 줄 수도 있으니 둘 다 대응 */}
                    {/<[a-z][\s\S]*>/i.test(post.content) ? (
                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                    ) : (
                        post.content.split("\n").map((line, i) => <p key={i}>{line}</p>)
                    )}
                </div>

                <div className="post-actions">
                    {/* 좋아요 토글 */}
                    <button title="좋아요" onClick={handleToggleLike} disabled={liking}>
                        {likedByMe ? "👍 " : "👍 "} {likeCount}
                    </button>
                    <button title="싫어요" disabled>👎 0</button>
                </div>

                <div className="post-tags">
                    {post.tags.map((tag, i) => (
                        <span key={i} className="tag">#{tag}</span>
                    ))}
                </div>

                <div className="post-util-buttons">
                    <button className="save-btn">📌 저장</button>
                    <button
                        className="link-btn"
                        onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            alert("링크가 복사되었습니다.");
                        }}
                    >
                        🔗
                    </button>
                </div>

                <div className="section-divider" />

                {/* 답변(댓글) 영역 */}
                <div className="answer-section">
                    <h3 className="answer-title">답변</h3>

                    <div className="answer-form">
                        <input
                            type="text"
                            placeholder="답변을 작성해보세요."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") handleCreateComment(); }}
                        />
                        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                            <button
                                className="post-util-button"
                                onClick={handleCreateComment}
                                disabled={posting}
                                style={{
                                    background: "#6a1b9a",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 6,
                                    padding: "8px 12px",
                                    cursor: posting ? "not-allowed" : "pointer",
                                }}
                            >
                                {posting ? "작성 중…" : "등록"}
                            </button>
                            <button
                                className="post-util-button"
                                onClick={() => setNewComment("")}
                                style={{
                                    background: "#fff",
                                    border: "1px solid #ccc",
                                    borderRadius: 6,
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                }}
                            >
                                취소
                            </button>
                        </div>
                    </div>

                    {/* 댓글 리스트 */}
                    {!loadingComments && comments.length === 0 && (
                        <div className="empty-comment">
                            <img src="/empty-comment.png" alt="답변 없음" />
                            <p className="comment-title">답변을 기다리고 있는 질문이에요</p>
                            <p className="comment-sub">첫번째 답변을 남겨보세요!</p>
                        </div>
                    )}

                    {!loadingComments && comments.length > 0 && (
                        <ul style={{ listStyle: "none", padding: 0, marginTop: 20 }}>
                            {comments.map((c) => (
                                <li key={c.id} style={{ padding: "14px 0", borderBottom: "1px solid #eee" }}>
                                    <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>
                                        <b style={{ color: "#333" }}>{c.writer || "익명"}</b>{" "}
                                        · {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                                    </div>
                                    <div style={{ fontSize: 15, color: "#333", whiteSpace: "pre-wrap" }}>
                                        {c.content}
                                    </div>

                                    {Array.isArray(c.replies) && c.replies.length > 0 && (
                                        <ul style={{ listStyle: "disc", margin: "10px 0 0 18px", color: "#555" }}>
                                            {c.replies.map((r, i) => (
                                                <li key={i} style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>
                                                    {r}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* 오른쪽 사이드 */}
            <aside className="post-detail-right">
                <div className="author-box">
                    <div className="profile-image" />
                    <div className="author-info">
                        <div className="author-name">{post.author}</div>
                        <div className="author-activity">작성한 질문수 5</div>
                    </div>
                </div>

                <div className="related-qna">
                    <div className="related-qna-header">
                        <h4>이 글과 비슷한 Q&amp;A</h4>
                        <button className="view-all-btn" onClick={() => navigate("/community")}>
                            전체 Q&amp;A
                        </button>
                    </div>

                    <ul>
                        <li>
                            <div className="related-item">
                                <span className="related-title">시간복잡도 질문</span>
                                <div className="related-meta">
                                    <span className="date">25.07.02. 13:42</span>
                                    <div className="reactions">
                                        <span>👍 1</span>
                                        <span>💬 2</span>
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li>
                            <div className="related-item">
                                <span className="related-title">11강 질문</span>
                                <div className="related-meta">
                                    <span className="date">25.07.11. 15:38</span>
                                    <div className="reactions">
                                        <span>👍 2</span>
                                        <span>💬 3</span>
                                    </div>
                                </div>
                            </div>
                        </li>
                    </ul>

                    <div className="related-pagination">
                        <button className="page-btn nav-btn">‹</button>
                        <button className="page-btn active">1</button>
                        <button className="page-btn">2</button>
                        <button className="page-btn">3</button>
                        <button className="page-btn nav-btn">›</button>
                    </div>
                </div>

                <button className="ask-btn" onClick={() => navigate("/community/write")}>
                    질문하기
                </button>
            </aside>
        </div>
    );
}
