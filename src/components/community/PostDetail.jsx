// src/pages/PostDetail.jsx
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PostDetail.css";
import config from "../../config";
import { promptLogin } from "../../utils/auth";

const parseIntSafe = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
};

const deriveCommentCount = (resp, data) => {
    try {
        const fromHeader = resp?.headers?.get?.("X-Total-Count");
        const n = parseIntSafe(fromHeader);
        if (n !== null) return n;
    } catch (_) {}

    if (Array.isArray(data)) return data.length;
    if (data && typeof data === "object") {
        if (typeof data.totalElements === "number") return data.totalElements;
        if (typeof data.total === "number") return data.total;
        if (Array.isArray(data.content)) return data.content.length;
    }
    return 0;
};

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
    const [likedByMe, setLikedByMe] = useState(false); // ✅ 추가: 내가 좋아요를 눌렀는지 여부
    const [liking, setLiking] = useState(false);
    const prevLikeRef = useRef(0);

    // 댓글 수 상태
    const [commentCount, setCommentCount] = useState(0);

    // 댓글 작성 상태
    const [newComment, setNewComment] = useState("");
    const [posting, setPosting] = useState(false);
    const [deletingPost, setDeletingPost] = useState(false);
    const [deletingCommentId, setDeletingCommentId] = useState(null);

    // 대댓글 작성 상태
    const [replyTarget, setReplyTarget] = useState(null); // 대댓글을 달 댓글 ID
    const [replyContent, setReplyContent] = useState("");

    // 토큰 및 인증 헤더 (백틱 사용 수정 반영)
    const tokenRaw = useMemo(() => localStorage.getItem("token"), []);
    const authHeader = tokenRaw
        ? tokenRaw.startsWith("Bearer ") ? tokenRaw : `Bearer ${tokenRaw}`
        : null;
    const currentUserId = useMemo(() => localStorage.getItem("userId") || "", []);
    const currentUsername = useMemo(() => localStorage.getItem("username") || "", []);
    const currentRole = useMemo(() => (localStorage.getItem("role") || "").toUpperCase(), []);
    const hasManageRole = useMemo(() => ["ADMIN", "MANAGER", "ROLE_ADMIN", "ROLE_MANAGER"].includes(currentRole), [currentRole]);
    const matchesCurrentUser = useCallback((writerName, writerId) => {
        if (writerId && currentUserId) return String(writerId) === String(currentUserId);
        if (writerName && currentUsername) return writerName === currentUsername;
        return false;
    }, [currentUserId, currentUsername]);
    const canManageRecord = useCallback((writerName, writerId) => {
        if (hasManageRole) return true;
        return matchesCurrentUser(writerName, writerId);
    }, [hasManageRole, matchesCurrentUser]);

    // 좋아요 수 및 내 상태 재조회
    const refreshLikeStatus = async () => {
        try {
            const bust = Date.now();
            // ✅ config.API_BASE_URL 적용, like/status 경로 유지
            const res = await fetch(`${config.API_BASE_URL}/api/posts/${id}/like/status?t=${bust}`, {
                method: "GET",
                headers: { Accept: "application/json", Authorization: authHeader, "Cache-Control": "no-cache" },
                cache: "no-store",
            });
            if (!res.ok) return null;
            const data = await res.json();

            const count = data.likeCount ?? 0;
            const liked = data.likedByMe ?? false;

            setLikeCount(count);
            setLikedByMe(liked);
            prevLikeRef.current = count;
            return { count, liked };
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

                // ✅ config.API_BASE_URL 적용
                const res = await fetch(`${config.API_BASE_URL}/api/posts/${id}`, {
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
                    author: data.writer || data.author || "익명",
                    authorId: data.writerId ?? data.authorId ?? data.userId ?? null,
                    date: data.createdAt ? new Date(data.createdAt).toLocaleString() : "",
                    tags: Array.isArray(data.tags) ? data.tags : [],
                });

                const initialLike = data.likeCount ?? 0;
                setLikeCount(initialLike);
                prevLikeRef.current = initialLike;
                // ✅ 서버 응답에 likedByMe 필드가 있다면 사용, 없다면 기본값 false
                setLikedByMe(data.likedByMe ?? false);

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
    }, [id, authHeader]); // ✅ navigate 제거

    // 공통: 댓글 목록 다시 불러오기
    const fetchComments = useCallback(async () => {
        try {
            setLoadingComments(true);
            const bust = Date.now();
            // ✅ config.API_BASE_URL 적용
            const res = await fetch(`${config.API_BASE_URL}/api/comments/${id}?t=${bust}`, {
                headers: { Accept: "application/json", Authorization: authHeader },
                cache: "no-store",
            });

            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setComments(data);
                } else if (data && typeof data === "object" && Array.isArray(data.content)) {
                    setComments(data.content);
                } else {
                    setComments([]);
                }
                const total = deriveCommentCount(res, data);
                setCommentCount(total);
            }
        } catch (e) {
            console.error("댓글 새로고침 실패:", e);
        } finally {
            setLoadingComments(false);
        }
    }, [authHeader, id]);

    useEffect(() => {
        // authHeader가 있거나 없더라도 댓글은 로드 시도
        if (!id) return;
        fetchComments();
    }, [id, authHeader, fetchComments]);

    const canDeletePost = useMemo(() => {
        if (hasManageRole) return true;
        if (!post) return false;
        return matchesCurrentUser(post.author, post.authorId);
    }, [hasManageRole, post, matchesCurrentUser]);

    const canDeleteComment = useCallback((comment) => {
        if (!comment) return false;
        const writerName = comment.writer ?? comment.author ?? comment.nickname;
        const writerId = comment.writerId ?? comment.authorId ?? comment.userId;
        return canManageRecord(writerName, writerId);
    }, [canManageRecord]);


    // 좋아요 토글
    const handleToggleLike = async () => {
        if (!authHeader) {
            promptLogin();
            return;
        }
        if (liking) return;

        const before = likeCount;
        const wasLiked = likedByMe;
        const willLike = !wasLiked;

        try {
            setLiking(true);
            // 낙관적 업데이트
            setLikedByMe(willLike);
            setLikeCount((c) => Math.max(0, c + (willLike ? 1 : -1)));

            // 2) 서버 토글 호출
            // ✅ config.API_BASE_URL 적용
            const res = await fetch(`${config.API_BASE_URL}/api/posts/${id}/like`, {
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
                // 실패 시 롤백
                setLikedByMe(wasLiked);
                setLikeCount(before);
                const text = await res.text();
                throw new Error(text || `좋아요 처리 실패 (${res.status})`);
            }

            // 성공 시 상태 업데이트 확인
            const afterStatus = await refreshLikeStatus();
            if (afterStatus != null) {
                // 서버로부터 받은 정확한 값으로 최종 업데이트
                prevLikeRef.current = afterStatus.count;
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
            promptLogin();
            return;
        }

        try {
            setPosting(true);
            const res = await fetch(`${config.API_BASE_URL}/api/comments`, {
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
            await fetchComments(); // 성공 후 목록 새로고침
        } catch (e) {
            alert(e.message || "댓글 작성에 실패했습니다.");
        } finally {
            setPosting(false);
        }
    };

    // 대댓글 작성
    const handleCreateReply = async (parentId) => {
        if (!replyContent.trim()) return;
        if (!authHeader) {
            promptLogin();
            return;
        }

        try {
            // 별도의 로딩 상태 없이 바로 처리
            // ✅ config.API_BASE_URL 적용
            const res = await fetch(`${config.API_BASE_URL}/api/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authHeader,
                },
                body: JSON.stringify({
                    postId: Number(id),
                    parentId,
                    content: replyContent,
                }),
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `대댓글 작성 실패 (${res.status})`);
            }

            setReplyContent("");
            setReplyTarget(null); // 입력창 닫기
            await fetchComments(); // 성공 후 목록 새로고침
        } catch (e) {
            alert(e.message || "대댓글 작성에 실패했습니다.");
        }
    };

    const handleDeletePost = async () => {
        if (!authHeader) {
            promptLogin();
            return;
        }
        if (deletingPost) return;
        if (!window.confirm("게시글을 삭제하시겠습니까?")) return;

        try {
            setDeletingPost(true);
            const res = await fetch(`${config.API_BASE_URL}/api/posts/${id}`, {
                method: "DELETE",
                headers: { Authorization: authHeader, Accept: "application/json" },
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `게시글 삭제 실패 (${res.status})`);
            }

            alert("게시글이 삭제되었습니다.");
            navigate("/community");
        } catch (e) {
            alert(e.message || "게시글 삭제에 실패했습니다.");
        } finally {
            setDeletingPost(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!authHeader) {
            promptLogin();
            return;
        }
        if (!commentId || deletingCommentId === commentId) return;
        if (!window.confirm("삭제하시겠습니까?")) return;

        try {
            setDeletingCommentId(commentId);
            const res = await fetch(`${config.API_BASE_URL}/api/comments/${commentId}`, {
                method: "DELETE",
                headers: { Authorization: authHeader, Accept: "application/json" },
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `댓글 삭제 실패 (${res.status})`);
            }

            if (replyTarget === commentId) {
                setReplyTarget(null);
                setReplyContent("");
            }
            await fetchComments();
        } catch (e) {
            alert(e.message || "댓글 삭제에 실패했습니다.");
        } finally {
            setDeletingCommentId(null);
        }
    };

    const handleCopyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            alert("링크가 복사되었습니다.");
        } catch (err) {
            console.error("링크 복사 실패", err);
            alert("링크를 복사하지 못했습니다. 브라우저 설정을 확인해주세요.");
        }
    }, []);

    const handleBookmark = useCallback(() => {
        alert("즐겨찾기 기능을 준비 중입니다.");
    }, []);

    const handleCommentKeyDown = (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            handleCreateComment();
        }
    };

    if (loadingPost) {
        return (
            <div className="post-detail-shell">
                <div className="post-detail-container">
                    <div className="post-detail-left">
                        <article className="post-surface">
                            <p>게시글을 불러오는 중입니다…</p>
                        </article>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="post-detail-shell">
                <div className="post-detail-container">
                    <div className="post-detail-left">
                        <article className="post-surface">
                            <p className="error">{error}</p>
                        </article>
                    </div>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="post-detail-shell">
                <div className="post-detail-container">
                    <div className="post-detail-left">
                        <article className="post-surface">
                            <p>게시글이 없습니다.</p>
                        </article>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="post-detail-shell">
            <div className="post-detail-container">
                <div className="post-detail-left">
                    <article className="post-surface">
                        <header className="post-header">
                            <div className="post-header-top">
                                <span className="post-breadcrumb">커뮤니티 · 질문</span>
                                <div className="post-header-actions">
                                    <button
                                        type="button"
                                        className="ghost-icon-btn"
                                        onClick={handleBookmark}
                                        title="게시글 저장"
                                        aria-label="게시글 저장"
                                    >
                                        📌
                                    </button>
                                    <button
                                        type="button"
                                        className="ghost-icon-btn"
                                        onClick={handleCopyLink}
                                        title="링크 복사"
                                        aria-label="링크 복사"
                                    >
                                        🔗
                                    </button>
                                    {canDeletePost && (
                                        <button
                                            type="button"
                                            className="ghost-icon-btn danger"
                                            onClick={handleDeletePost}
                                            disabled={deletingPost}
                                            title="게시글 삭제"
                                            aria-label="게시글 삭제"
                                        >
                                            {deletingPost ? "…" : "🗑"}
                                        </button>
                                    )}
                                </div>
                            </div>
                            <h1 className="post-title">{post.title}</h1>
                            <div className="post-meta-row">
                                <span className="meta-chip"><strong>{post.author}</strong> 작성</span>
                                {post.date && <span className="meta-chip">{post.date}</span>}
                                <span className="meta-chip">👍 {likeCount}</span>
                                <span className="meta-chip">💬 {commentCount}</span>
                            </div>
                        </header>

                        <section className="post-body">
                            {/<[a-z][\s\S]*>/i.test(post.content) ? (
                                <div dangerouslySetInnerHTML={{ __html: post.content }} />
                            ) : (
                                post.content.split("\n").map((line, i) => <p key={i}>{line}</p>)
                            )}
                        </section>

                        <div className="post-reaction-bar">
                            <button
                                type="button"
                                className={`reaction-like ${likedByMe ? "active" : ""}`}
                                onClick={handleToggleLike}
                                disabled={liking}
                            >
                                <span aria-hidden="true">{likedByMe ? "❤️" : "👍"}</span>
                                <span>{likedByMe ? "좋아요 취소" : "좋아요"}</span>
                                <span>{likeCount}</span>
                            </button>
                            <span className="reaction-stat">💬 {commentCount}개의 답변</span>
                        </div>

                        {post.tags.length > 0 && (
                            <div className="post-tag-group">
                                {post.tags.map((tag, i) => (
                                    <span key={i} className="tag-chip">#{tag}</span>
                                ))}
                            </div>
                        )}
                    </article>

                    <section className="comment-card">
                        <div className="comment-card-header">
                            <h3>답변</h3>
                            <span className="comment-count-badge">{commentCount}</span>
                        </div>

                        <div className="comment-editor">
                            <textarea
                                placeholder="답변을 작성해보세요."
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={handleCommentKeyDown}
                            />
                            <p className="comment-tip">⌘+Enter 또는 Ctrl+Enter로 빠르게 등록할 수 있어요.</p>
                        </div>
                        <div className="comment-editor-actions">
                            <button type="button" className="btn-secondary" onClick={() => setNewComment("")}>
                                취소
                            </button>
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={handleCreateComment}
                                disabled={posting || !newComment.trim()}
                            >
                                {posting ? "등록 중…" : "등록"}
                            </button>
                        </div>

                        {loadingComments && comments.length === 0 && (
                            <div className="empty-comment"><p>댓글을 불러오는 중…</p></div>
                        )}

                        {!loadingComments && comments.length === 0 && (
                            <div className="empty-comment">
                                <img src="/empty-comment.png" alt="답변 없음" />
                                <p className="comment-title">답변을 기다리고 있는 질문이에요</p>
                                <p className="comment-sub">첫번째 답변을 남겨보세요!</p>
                            </div>
                        )}

                        {!loadingComments && comments.length > 0 && (
                            <ul className="comment-list">
                                {comments.map((c) => (
                                    <li key={c.id} className="comment-item">
                                        <div className="comment-meta">
                                            <b className="comment-writer">{c.writer || "익명"}</b>{" "}
                                            · {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                                        </div>
                                        <div className="comment-content">
                                            {c.content}
                                        </div>

                                        <div className="comment-action-row">
                                            <button
                                                className="reply-toggle-btn"
                                                type="button"
                                                onClick={() => setReplyTarget(c.id === replyTarget ? null : c.id)}
                                            >
                                                답글
                                            </button>
                                            {canDeleteComment(c) && (
                                                <button
                                                    type="button"
                                                    className="comment-delete-btn"
                                                    onClick={() => handleDeleteComment(c.id)}
                                                    disabled={deletingCommentId === c.id}
                                                >
                                                    {deletingCommentId === c.id ? "삭제 중…" : "삭제"}
                                                </button>
                                            )}
                                        </div>

                                        {replyTarget === c.id && (
                                            <div className="reply-form">
                                                <input
                                                    type="text"
                                                    value={replyContent}
                                                    onChange={(e) => setReplyContent(e.target.value)}
                                                    onKeyDown={(e) => { if (e.key === "Enter") handleCreateReply(c.id); }}
                                                    placeholder={`@${c.writer || "익명"}에게 답글을 입력하세요`}
                                                />
                                                <div className="reply-form-buttons">
                                                    <button
                                                        type="button"
                                                        className="reply-submit-btn"
                                                        onClick={() => handleCreateReply(c.id)}
                                                        disabled={!replyContent.trim()}
                                                    >
                                                        등록
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="reply-cancel-btn"
                                                        onClick={() => { setReplyTarget(null); setReplyContent(""); }}
                                                    >
                                                        취소
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {Array.isArray(c.replies) && c.replies.length > 0 && (
                                            <ul className="reply-list">
                                                {c.replies.map((r) => (
                                                    <li key={r.id} className="reply-item">
                                                        <div className="reply-meta">
                                                            <b>{r.writer || "익명"}</b> · {r.createdAt ? new Date(r.createdAt).toLocaleString() : ""}
                                                        </div>
                                                        <div>{r.content}</div>
                                                        {canDeleteComment(r) && (
                                                            <button
                                                                type="button"
                                                                className="reply-delete-btn"
                                                                onClick={() => handleDeleteComment(r.id)}
                                                                disabled={deletingCommentId === r.id}
                                                            >
                                                                {deletingCommentId === r.id ? "삭제 중…" : "삭제"}
                                                            </button>
                                                        )}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                </div>

                <aside className="post-detail-right">
                    <div className="support-card author-card">
                        <div className="author-box">
                            <div className="profile-image">{post.author?.[0] || "U"}</div>
                            <div className="author-info">
                                <div className="author-name">{post.author}</div>
                                <div className="author-activity">작성한 질문수 5</div>
                            </div>
                        </div>
                    </div>

                    <div className="support-card related-qna">
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
                    </div>
                </aside>
            </div>
        </div>
    );
}