import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    FaThumbsUp,
    FaComment,
    FaSearch,
    FaClipboardList,
    FaExternalLinkAlt,
    FaSync
} from 'react-icons/fa';
import './MyCommunity.css';
import config from '../../config';

const TABS = [
    { key: 'posts', label: '내 게시물', icon: <FaClipboardList aria-hidden="true" /> },
    { key: 'comments', label: '내 댓글', icon: <FaComment aria-hidden="true" /> },
];

const stripHtml = (value = '') => value.replace(/<[^>]+>/g, '');

const truncate = (value = '', length = 140) => {
    const plain = stripHtml(value).trim();
    if (plain.length <= length) return plain;
    return `${plain.slice(0, length - 1)}…`;
};

const formatDateTime = (value) => {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};

const normalizeComparable = (value) => {
    if (!value) return '';
    return value.toString().replace(/^@/, '').trim().toLowerCase();
};

const extractWriter = (item = {}) => (
    item.writer ??
    item.writerNickname ??
    item.nickname ??
    item.author ??
    item.userName ??
    item.username ??
    item.memberName ??
    ''
);

const mapPost = (item = {}) => {
    const id = item.id ?? item.postId ?? item.boardId ?? item.communityPostId;
    const title = item.title ?? item.postTitle ?? '제목이 없는 게시글';
    return {
        id,
        title,
        summary: truncate(item.summary ?? item.preview ?? item.content ?? ''),
        tags: item.tags ?? item.tagList ?? [],
        likeCount: item.likeCount ?? item.likes ?? 0,
        commentCount: item.commentCount ?? item.comments ?? 0,
        status: item.status ?? item.postStatus ?? '',
        createdAt: formatDateTime(item.createdAt ?? item.createdDate ?? item.regDate ?? item.updatedAt),
        link: id ? `/community/post/${id}` : null,
        writer: extractWriter(item),
        rawTitle: title,
    };
};

const mapComment = (item = {}, post = {}) => {
    const postId = post.id ?? item.postId ?? item.communityPostId ?? item.boardId;
    return {
        id: item.id ?? item.commentId ?? `${postId}-${item.createdAt ?? Math.random()}`,
        postId,
        postTitle: post.rawTitle ?? post.title ?? item.postTitle ?? item.parentTitle ?? '게시글',
        snippet: truncate(item.content ?? item.comment ?? ''),
        createdAt: formatDateTime(item.createdAt ?? item.createdDate ?? item.regDate ?? item.updatedAt),
        link: postId ? `/community/post/${postId}` : null,
        likeCount: item.likeCount ?? item.likes ?? 0,
        writer: extractWriter(item),
    };
};

const MyCommunity = ({ nickname = '' }) => {
    const [activeTab, setActiveTab] = useState('posts');
    const [searchInput, setSearchInput] = useState('');
    const [keyword, setKeyword] = useState('');
    const [loadingPosts, setLoadingPosts] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [error, setError] = useState('');
    const [userPosts, setUserPosts] = useState([]);
    const [userComments, setUserComments] = useState([]);
    const [commentsLoaded, setCommentsLoaded] = useState(false);

    const storedUsername = useMemo(() => {
        if (nickname) return nickname;
        if (typeof window === 'undefined') return '';
        try {
            return window.localStorage.getItem('username') || '';
        } catch (err) {
            console.warn('Failed to read username from storage', err);
            return '';
        }
    }, [nickname]);

    const currentUser = storedUsername.toString().trim();
    const normalizedUser = normalizeComparable(currentUser);

    const keywordLower = keyword.trim().toLowerCase();
    const handleSearchSubmit = useCallback((event) => {
        event.preventDefault();
        setKeyword(searchInput.trim());
    }, [searchInput]);

    const handleReset = useCallback(() => {
        setSearchInput('');
        setKeyword('');
    }, []);

    useEffect(() => {
        if (!keyword) setSearchInput('');
    }, [keyword]);

    const fetchPosts = useCallback(async (signal) => {
        if (!normalizedUser) {
            if (!signal.aborted) {
                setUserPosts([]);
                setUserComments([]);
                setCommentsLoaded(false);
                setError('로그인 정보가 없어 게시글을 불러올 수 없습니다.');
            }
            return;
        }

        setLoadingPosts(true);
        setError('');

        let token = '';
        if (typeof window !== 'undefined') {
            try {
                token = window.localStorage.getItem('token') || '';
            } catch (err) {
                console.warn('Failed to read auth token from storage', err);
            }
        }

        const headers = { Accept: 'application/json' };
        if (token) headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

        try {
            const res = await fetch(`${config.API_BASE_URL}/api/posts`, {
                method: 'GET',
                headers,
                credentials: 'include',
                signal,
            });

            if (!res.ok) {
                const message = await res.text();
                throw new Error(message || `게시글을 불러오지 못했습니다. (HTTP ${res.status})`);
            }

            if (res.status === 204) {
                if (!signal.aborted) {
                    setUserPosts([]);
                    setCommentsLoaded(false);
                    setUserComments([]);
                }
                return;
            }

            const raw = await res.text();
            if (!raw) {
                if (!signal.aborted) {
                    setUserPosts([]);
                    setCommentsLoaded(false);
                    setUserComments([]);
                }
                return;
            }

            let data;
            try {
                data = JSON.parse(raw);
            } catch (err) {
                console.error('Unexpected posts payload', err);
                if (!signal.aborted) {
                    setUserPosts([]);
                    setCommentsLoaded(false);
                    setUserComments([]);
                }
                return;
            }

            const list = Array.isArray(data)
                ? data
                : Array.isArray(data?.content)
                    ? data.content
                    : Array.isArray(data?.data)
                        ? data.data
                        : [];

            const mapped = list.map(mapPost);
            const mine = mapped.filter((post) => normalizeComparable(post.writer) === normalizedUser);
            if (!signal.aborted) {
                setUserPosts(mine);
                setCommentsLoaded(false);
                setUserComments([]);
            }
        } catch (err) {
            if (!signal.aborted) {
                console.error('Failed to fetch posts', err);
                setError(err.message || '게시글을 불러오는 중 오류가 발생했습니다.');
                setUserPosts([]);
                setCommentsLoaded(false);
                setUserComments([]);
            }
        } finally {
            if (!signal.aborted) setLoadingPosts(false);
        }
    }, [normalizedUser]);

    const fetchCommentsForPosts = useCallback(async (posts, signal) => {
        if (!posts.length) {
            if (!signal.aborted) {
                setUserComments([]);
                setCommentsLoaded(true);
            }
            return;
        }

        setLoadingComments(true);
        setError('');

        let token = '';
        if (typeof window !== 'undefined') {
            try {
                token = window.localStorage.getItem('token') || '';
            } catch (err) {
                console.warn('Failed to read auth token from storage', err);
            }
        }

        const headers = { Accept: 'application/json' };
        if (token) headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;

        const requests = posts.map((post) => (async () => {
            try {
                const res = await fetch(`${config.API_BASE_URL}/api/comments/${post.id}`, {
                    method: 'GET',
                    headers,
                    credentials: 'include',
                    signal,
                });

                if (!res.ok) {
                    const message = await res.text();
                    throw new Error(message || `댓글을 불러오지 못했습니다. (HTTP ${res.status})`);
                }

                if (res.status === 204) return [];

                const raw = await res.text();
                if (!raw) return [];

                let data;
                try {
                    data = JSON.parse(raw);
                } catch (err) {
                    console.error('Unexpected comments payload', err);
                    return [];
                }

                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.content)
                        ? data.content
                        : Array.isArray(data?.data)
                            ? data.data
                            : [];

                return list
                    .map((comment) => mapComment(comment, post))
                    .filter((comment) => normalizeComparable(comment.writer) === normalizedUser);
            } catch (err) {
                if (!signal.aborted) {
                    console.error(`Failed to fetch comments for post ${post.id}`, err);
                }
                return [];
            }
        })());

        try {
            const results = await Promise.all(requests);
            if (signal.aborted) return;
            const aggregated = results.flat();
            setUserComments(aggregated);
            setCommentsLoaded(true);
        } catch (err) {
            if (!signal.aborted) {
                console.error('Failed to aggregate comments', err);
                setError(err.message || '댓글을 불러오는 중 오류가 발생했습니다.');
                setUserComments([]);
            }
        } finally {
            if (!signal.aborted) setLoadingComments(false);
        }
    }, [normalizedUser]);

    useEffect(() => {
        const controller = new AbortController();
        fetchPosts(controller.signal);
        return () => controller.abort();
    }, [fetchPosts]);

    useEffect(() => {
        if (commentsLoaded) return;
        if (!userPosts.length) {
            setUserComments([]);
            setCommentsLoaded(true);
            return;
        }

        const controller = new AbortController();
        fetchCommentsForPosts(userPosts, controller.signal);
        return () => controller.abort();
    }, [commentsLoaded, fetchCommentsForPosts, userPosts]);

    const filteredPosts = useMemo(() => {
        if (!keywordLower) return userPosts;
        return userPosts.filter((post) => {
            const haystack = [post.title, post.summary, (post.tags || []).join(' ')].join(' ').toLowerCase();
            return haystack.includes(keywordLower);
        });
    }, [keywordLower, userPosts]);

    const filteredComments = useMemo(() => {
        if (!keywordLower) return userComments;
        return userComments.filter((comment) => {
            const haystack = [comment.postTitle, comment.snippet].join(' ').toLowerCase();
            return haystack.includes(keywordLower);
        });
    }, [keywordLower, userComments]);

    const currentList = activeTab === 'posts' ? filteredPosts : filteredComments;
    const counts = useMemo(() => ({
        posts: filteredPosts.length,
        comments: filteredComments.length,
    }), [filteredComments.length, filteredPosts.length]);

    const loading = loadingPosts || loadingComments;

    return (
        <main className="mypage-content mycommunity-page">
            <header className="mycommunity-header">
                <div>
                    <h1>커뮤니티 활동</h1>
                    <p>내가 작성한 게시물과 댓글을 한 곳에서 확인하고 관리하세요.</p>
                </div>
                <Link to="/community" className="mycommunity-header__link">
                    <FaExternalLinkAlt aria-hidden="true" />
                    커뮤니티 바로가기
                </Link>
            </header>

            <section className="mycommunity-controls section-card">
                <form className="mycommunity-search" onSubmit={handleSearchSubmit}>
                    <div className="mycommunity-search__input">
                        <FaSearch aria-hidden="true" />
                        <input
                            type="search"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="제목, 내용, 태그로 검색"
                            aria-label="내 게시물과 댓글 검색"
                        />
                    </div>
                    <div className="mycommunity-search__actions">
                        <button type="submit" className="search-button">검색</button>
                        {(keyword || searchInput) && (
                            <button type="button" className="reset-button" onClick={handleReset}>
                                초기화
                            </button>
                        )}
                    </div>
                </form>

                <div className="mycommunity-tabs" role="tablist" aria-label="내 커뮤니티 데이터 종류 선택">
                    {TABS.map(({ key, label, icon }) => (
                        <button
                            key={key}
                            type="button"
                            role="tab"
                            aria-selected={activeTab === key}
                            className={`mycommunity-tab${activeTab === key ? ' is-active' : ''}`}
                            onClick={() => setActiveTab(key)}
                        >
                            <span className="tab-icon">{icon}</span>
                            <span>{label}</span>
                            <span className="tab-count">{counts[key]}</span>
                        </button>
                    ))}
                </div>
            </section>

            <section className="mycommunity-list">
                {loading && (
                    <div className="mycommunity-state">
                        <FaSync className="spin" aria-hidden="true" /> 데이터를 불러오는 중입니다…
                    </div>
                )}

                {!loading && error && (
                    <div className="mycommunity-state error">
                        {error}
                    </div>
                )}

                {!loading && !error && currentList.length === 0 && (
                    <div className="mycommunity-state empty">
                        아직 {activeTab === 'posts' ? '작성한 게시물이' : '남긴 댓글이'} 없습니다.
                    </div>
                )}

                {!loading && currentList.length > 0 && (
                    <div className="mycommunity-cards">
                        {activeTab === 'posts'
                            ? currentList.map((post) => (
                                <article className="mycommunity-card section-card" key={post.id}>
                                    <div className="card-header">
                                        <div className="card-header-left">
                                            {post.status && (
                                                <span className={`badge ${post.status === '해결됨' ? 'badge--solved' : ''}`}>
                                                    {post.status}
                                                </span>
                                            )}
                                            <span className="card-date">{post.createdAt}</span>
                                        </div>
                                        {post.link && (
                                            <Link to={post.link} className="card-link">
                                                자세히 보기
                                            </Link>
                                        )}
                                    </div>
                                    <h3 className="card-title">
                                        {post.link ? (
                                            <Link to={post.link}>{post.title}</Link>
                                        ) : (
                                            post.title
                                        )}
                                    </h3>
                                    <p className="card-summary">{post.summary}</p>
                                    {!!post.tags?.length && (
                                        <div className="card-tags">
                                            {post.tags.map((tag) => (
                                                <span key={tag} className="tag">#{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className="card-footer">
                                        <span><FaThumbsUp aria-hidden="true" /> {post.likeCount}</span>
                                        <span><FaComment aria-hidden="true" /> {post.commentCount}</span>
                                    </div>
                                </article>
                            ))
                            : currentList.map((comment) => (
                                <article className="mycommunity-card section-card" key={comment.id}>
                                    <div className="card-header">
                                        <div className="card-header-left">
                                            <span className="badge badge--ghost">내 댓글</span>
                                            <span className="card-date">{comment.createdAt}</span>
                                        </div>
                                        {comment.link && (
                                            <Link to={comment.link} className="card-link">
                                                게시글 보기
                                            </Link>
                                        )}
                                    </div>
                                    <h3 className="card-title">
                                        {comment.link ? (
                                            <Link to={comment.link}>{comment.postTitle}</Link>
                                        ) : (
                                            comment.postTitle
                                        )}
                                    </h3>
                                    <p className="card-summary">{comment.snippet}</p>
                                    <div className="card-footer">
                                        <span><FaThumbsUp aria-hidden="true" /> {comment.likeCount}</span>
                                    </div>
                                </article>
                            ))}
                    </div>
                )}
            </section>
        </main>
    );
};

export default MyCommunity;
