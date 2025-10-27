// src/pages/PostDetail.jsx
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
    const location = useLocation();

    const [authState, setAuthState] = useState(() => ({
        token: localStorage.getItem("token"),
        userId: localStorage.getItem("userId"),
        username: localStorage.getItem("username"),
        role: localStorage.getItem("role"),
    }));

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

    // 작성자/연관 데이터
    const [authorStats, setAuthorStats] = useState(null);
    const [relatedPosts, setRelatedPosts] = useState([]);
    const [loadingRelations, setLoadingRelations] = useState(false);

    // 토큰 및 인증 헤더 (백틱 사용 수정 반영)
    const authHeader = useMemo(() => {
        const token = authState.token;
        if (!token) return null;
        return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }, [authState.token]);

    const currentUserId = useMemo(() => authState.userId || "", [authState.userId]);
    const currentUsername = useMemo(() => authState.username || "", [authState.username]);
    const currentRole = useMemo(() => (authState.role || "").toUpperCase(), [authState.role]);
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

    useEffect(() => {
        const syncAuth = () => {
            setAuthState((prev) => {
                const next = {
                    token: localStorage.getItem("token"),
                    userId: localStorage.getItem("userId"),
                    username: localStorage.getItem("username"),
                    role: localStorage.getItem("role"),
                };
                if (
                    prev.token === next.token &&
                    prev.userId === next.userId &&
                    prev.username === next.username &&
                    prev.role === next.role
                ) {
                    return prev;
                }
                return next;
            });
        };

        window.addEventListener("storage", syncAuth);
        window.addEventListener("dv:auth-updated", syncAuth);

        return () => {
            window.removeEventListener("storage", syncAuth);
            window.removeEventListener("dv:auth-updated", syncAuth);
        };
    }, []);

    const redirectPath = useMemo(() => `${location.pathname}${location.search || ""}`, [location.pathname, location.search]);
    const requestLogin = useCallback(() => {
        promptLogin(undefined, { redirectTo: redirectPath });
    }, [redirectPath]);

    const formatDateTimeShort = useCallback((value) => {
        if (!value) return "";
        const date = value instanceof Date ? value : new Date(value);
        if (Number.isNaN(date.getTime())) return "";
        return new Intl.DateTimeFormat("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    }, []);

    const refreshLikeCount = useCallback(async () => {
        try {
            const res = await fetch(`${config.API_BASE_URL}/api/posts/${id}/like`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    ...(authHeader ? { Authorization: authHeader } : {}),
                    "Cache-Control": "no-cache",
                },
                cache: "no-store",
            });

            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || `좋아요 수 조회 실패 (${res.status})`);
            }

            const payload = await res.json();
            let nextCount = typeof payload === "number" ? payload : null;
            if (nextCount === null && payload && typeof payload === "object") {
                nextCount = parseIntSafe(payload.likeCount);
            }
            if (Number.isFinite(nextCount)) {
                setLikeCount(nextCount);
                prevLikeRef.current = nextCount;
                return nextCount;
            }
        } catch (err) {
            console.error("좋아요 수를 불러오지 못했습니다.", err);
        }
        return null;
    }, [authHeader, id]);

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
                    createdAtRaw: data.createdAt ?? null,
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

    useEffect(() => {
        if (!post) {
            setAuthorStats(null);
            setRelatedPosts([]);
            return;
        }

        let ignore = false;
        const controller = new AbortController();

        (async () => {
            try {
                setLoadingRelations(true);
                const headers = { Accept: "application/json" };
                if (authHeader) headers.Authorization = authHeader;

                const res = await fetch(`${config.API_BASE_URL}/api/posts`, {
                    method: "GET",
                    headers,
                    signal: controller.signal,
                    credentials: "include",
                });

                if (!res.ok) {
                    const text = await res.text();
                    throw new Error(text || `연관 게시글 조회 실패 (${res.status})`);
                }

                const raw = await res.json();
                if (ignore) return;

                const list = Array.isArray(raw)
                    ? raw
                    : Array.isArray(raw?.content)
                        ? raw.content
                        : Array.isArray(raw?.data)
                            ? raw.data
                            : [];

                const normalized = list.map((item) => ({
                    id: item.id,
                    title: item.title || "제목 없는 글",
                    tags: Array.isArray(item.tags) ? item.tags : [],
                    likeCount: item.likeCount ?? 0,
                    commentCount: item.commentCount ?? 0,
                    createdAt: item.createdAt || item.updatedAt || null,
                    author: item.writer || item.author || "익명",
                }));

                const authorName = post.author;
                const authored = authorName
                    ? normalized.filter((entry) => entry.author === authorName)
                    : [];
                const includesCurrent = authored.some((entry) => entry.id === post.id);
                const authorPostCount = authored.length + (!includesCurrent && authorName ? 1 : 0);
                const authorLikeSum = authored.reduce((sum, entry) => sum + (entry.likeCount ?? 0), 0) + (!includesCurrent ? likeCount : 0);
                const latestEntry = [...authored]
                    .sort((a, b) => {
                        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                        return bTime - aTime;
                    })[0];

                const fallbackCreatedAt = post.createdAtRaw;
                const latestPost = latestEntry || {
                    id: post.id,
                    title: post.title,
                    createdAt: fallbackCreatedAt,
                };

                const currentPostLikes = includesCurrent
                    ? (authored.find((entry) => entry.id === post.id)?.likeCount ?? likeCount)
                    : likeCount;

                setAuthorStats({
                    totalPosts: authorPostCount,
                    totalLikes: authorLikeSum,
                    latestTitle: latestPost?.title || "",
                    latestDate: formatDateTimeShort(latestPost?.createdAt || fallbackCreatedAt),
                    latestId: latestPost?.id || post.id,
                    currentPostLikes,
                });

                const tagSet = new Set((post.tags || []).map((tag) => String(tag).toLowerCase()));
                const relatedPool = normalized.filter((entry) => {
                    if (entry.id === post.id) return false;
                    if (!tagSet.size) return true;
                    return (entry.tags || []).some((tag) => tagSet.has(String(tag).toLowerCase()));
                });

                relatedPool.sort((a, b) => {
                    const likeDiff = (b.likeCount ?? 0) - (a.likeCount ?? 0);
                    if (likeDiff !== 0) return likeDiff;
                    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return bTime - aTime;
                });

                setRelatedPosts(relatedPool.slice(0, 3).map((entry) => ({
                    ...entry,
                    formattedDate: formatDateTimeShort(entry.createdAt),
                })));
            } catch (e) {
                if (!ignore) {
                    console.error("연관 게시글 정보를 불러오지 못했습니다.", e);
                }
            } finally {
                if (!ignore) setLoadingRelations(false);
            }
        })();

        return () => {
            ignore = true;
            controller.abort();
        };
    }, [post, authHeader, formatDateTimeShort, likeCount]);

    useEffect(() => {
        setAuthorStats((prev) => {
            if (!prev) return prev;
            const diff = likeCount - (prev.currentPostLikes ?? 0);
            if (diff === 0) return prev;
            return {
                ...prev,
                totalLikes: Math.max(0, (prev.totalLikes ?? 0) + diff),
                currentPostLikes: likeCount,
            };
        });
    }, [likeCount]);

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
            requestLogin();
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

            try {
                const body = await res.json();
                if (typeof body === "boolean") {
                    setLikedByMe(body);
                }
            } catch (_) {
                // ignore body parse issues; fallback to optimistic state
            }

            await refreshLikeCount();

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
            requestLogin();
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
            requestLogin();
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
            requestLogin();
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
            requestLogin();
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
                            <span className="comment-hint">⌘+Enter 또는 Ctrl+Enter로 빠르게 등록할 수 있어요.</span>
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
                            <div className="empty-comment" role="status">
                                <div className="empty-icon" aria-hidden="true">💬</div>
                                <p className="comment-title">아직 답변이 없어요.</p>
                                <p className="comment-sub">첫 번째 답변을 남겨주세요!</p>
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
                                {authorStats ? (
                                    <ul className="author-stats-list">
                                        <li>
                                            <span>등록한 질문</span>
                                            <strong>{authorStats.totalPosts ?? 0}개</strong>
                                        </li>
                                        <li>
                                            <span>총 받은 좋아요</span>
                                            <strong>{authorStats.totalLikes ?? 0}개</strong>
                                        </li>
                                        {authorStats.latestTitle && (
                                            <li className="author-recent">
                                                <span>최근 작성</span>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/community/post/${authorStats.latestId}`)}
                                                >
                                                    {authorStats.latestTitle}
                                                </button>
                                                {authorStats.latestDate && <time>{authorStats.latestDate}</time>}
                                            </li>
                                        )}
                                    </ul>
                                ) : (
                                    <div className="author-activity">작성자 정보를 불러오는 중이에요…</div>
                                )}
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
                            {loadingRelations && (
                                <li className="related-empty">비슷한 질문을 불러오는 중이에요…</li>
                            )}
                            {!loadingRelations && relatedPosts.length === 0 && (
                                <li className="related-empty">아직 비슷한 질문이 없어요.</li>
                            )}
                            {!loadingRelations && relatedPosts.map((item) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        className="related-item"
                                        onClick={() => navigate(`/community/post/${item.id}`)}
                                    >
                                        <span className="related-title">{item.title}</span>
                                        <div className="related-meta">
                                            <span className="date">{item.formattedDate || "최근"}</span>
                                            <div className="reactions">
                                                <span>👍 {item.likeCount ?? 0}</span>
                                                <span>💬 {item.commentCount ?? 0}</span>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
}