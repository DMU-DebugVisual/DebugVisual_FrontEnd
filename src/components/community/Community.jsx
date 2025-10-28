import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Community.css";
import config from "../../config";

const ALLOWED_TAGS = [
    "JAVA", "C", "CPP", "JPA", "JAVASCRIPT", "PYTHON", "OOP", "BIGDATA", "SPRING", "TYPESCRIPT", "ML"
];

const SEARCH_SCOPE_OPTIONS = [
    { value: "all", label: "전체" },
    { value: "author", label: "작성자" },
    { value: "title", label: "제목" },
    { value: "content", label: "내용" },
    { value: "tag", label: "태그" },
];

const SEARCH_OPERATOR_OPTIONS = [
    { value: "or", label: "또는" },
    { value: "and", label: "그리고" },
];

const DEFAULT_SCOPE = "all";
const DEFAULT_OPERATOR = "or";

const SIDEBAR_CHANNELS = [
    { label: "질문 & 답변", active: true },
    { label: "고민있어요", disabled: true },
    { label: "스터디", disabled: true },
    { label: "팀 프로젝트", disabled: true },
    { label: "블로그", disabled: true },
];

const COMMUNITY_TABS = [
    { label: "전체", disabled: false },
    { label: "미해결", disabled: true },
    { label: "해결됨", disabled: true },
];

export default function Community() {
    const navigate = useNavigate();
    const filters = ["최신순", "오래된순", "좋아요순"];

    // ✅ 서버 데이터 상태
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [keyword, setKeyword] = useState("");
    const [tagKeyword, setTagKeyword] = useState([]);
    const [selectedTagFilters, setSelectedTagFilters] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastKnownPage, setLastKnownPage] = useState(1);
    const [searchScope, setSearchScope] = useState(DEFAULT_SCOPE);
    const [searchOperator, setSearchOperator] = useState(DEFAULT_OPERATOR);

    const PAGE_SIZE = 10;
    const selectedTagCount = selectedTagFilters.length;
    const reachedTagFilterLimit = selectedTagCount >= 10;

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
                const mapped = sorted.map((p) => {
                    let createdAtMs = null;
                    if (p.createdAt) {
                        const parsed = new Date(p.createdAt).getTime();
                        createdAtMs = Number.isFinite(parsed) ? parsed : null;
                    }

                    const plainContent = (p.content || "")
                        .replace(/<[^>]+>/g, " ")
                        .replace(/\s+/g, " ")
                        .trim();

                    return {
                        id: p.id,
                        status: p.status || "",
                        title: p.title,
                        summary: plainContent.slice(0, 120),
                        contentText: plainContent,
                        tags: p.tags || [],
                        author: p.writer || "익명",
                        date: p.createdAt ? new Date(p.createdAt).toLocaleString() : "",
                        createdAtMs,
                        likes: p.likeCount ?? 0,
                        comments: p.commentCount ?? 0,
                    };
                });

                setPosts(mapped);
                setKeyword("");
                setTagKeyword([]);
                setSelectedTagFilters([]);
                setSearchInput("");
                setSearchScope(DEFAULT_SCOPE);
                setSearchOperator(DEFAULT_OPERATOR);
                setCurrentPage(1);
                setLastKnownPage(1);
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

    const filteredPosts = useMemo(() => {
        const tokens = keyword
            ? keyword
                .split(/\s+/)
                .map((token) => token.trim())
                .filter(Boolean)
                .map((token) => token.toLowerCase())
            : [];

        const matchTokens = (post) => {
            if (!tokens.length) return true;

            const haystacks = (() => {
                switch (searchScope) {
                    case "author":
                        return [post.author];
                    case "title":
                        return [post.title];
                    case "content":
                        return [post.contentText ?? post.summary ?? ""];
                    case "tag":
                        return (post.tags || []).map((tag) => String(tag || ""));
                    case "all":
                    default:
                        return [
                            post.title,
                            post.summary,
                            post.contentText,
                            post.author,
                            ...(post.tags || []),
                        ];
                }
            })();

            const normalizedHaystacks = haystacks
                .flatMap((value) => (Array.isArray(value) ? value : [value]))
                .map((value) => String(value || "").toLowerCase())
                .filter(Boolean);

            if (!normalizedHaystacks.length) return false;

            const containsToken = (token) =>
                normalizedHaystacks.some((haystack) => haystack.includes(token));

            return searchOperator === "and"
                ? tokens.every(containsToken)
                : tokens.some(containsToken);
        };

        return posts.filter((post) => {
            if (!matchTokens(post)) return false;

            if (!tagKeyword.length) return true;

            return tagKeyword.every((token) =>
                (post.tags || []).some((tag) =>
                    String(tag || "").toLowerCase().includes(token),
                ),
            );
        });
    }, [keyword, tagKeyword, posts, searchScope, searchOperator]);

    const [activeFilter, setActiveFilter] = useState(filters[0]);

    const sortedPosts = useMemo(() => {
        const sorted = [...filteredPosts];
        const ensureNumber = (value, fallback = null) => (Number.isFinite(value) ? value : fallback);

        const latest = (a, b) => {
            const aTime = ensureNumber(a.createdAtMs, null);
            const bTime = ensureNumber(b.createdAtMs, null);
            if (aTime !== null && bTime !== null && aTime !== bTime) return bTime - aTime;
            if (bTime !== null) return 1;
            if (aTime !== null) return -1;
            return (b.id ?? 0) - (a.id ?? 0);
        };

        const oldest = (a, b) => {
            const aTime = ensureNumber(a.createdAtMs, null);
            const bTime = ensureNumber(b.createdAtMs, null);
            if (aTime !== null && bTime !== null && aTime !== bTime) return aTime - bTime;
            if (aTime !== null) return -1;
            if (bTime !== null) return 1;
            return (a.id ?? 0) - (b.id ?? 0);
        };
        const byLikes = (a, b) => (b.likes ?? 0) - (a.likes ?? 0);

        switch (activeFilter) {
            case "오래된순":
                sorted.sort(oldest);
                break;
            case "좋아요순":
                sorted.sort(byLikes);
                break;
            case "최신순":
            default:
                sorted.sort(latest);
                break;
        }
        return sorted;
    }, [filteredPosts, activeFilter]);

    const handleSearchSubmit = (event) => {
        event?.preventDefault?.();
        const trimmedKeyword = searchInput.trim();

        setKeyword(trimmedKeyword);
        setTagKeyword(selectedTagFilters.map((tag) => tag.toLowerCase()));
        setCurrentPage(1);
        setLastKnownPage(1);
    };

    const handleReset = () => {
        setSearchInput("");
        setKeyword("");
        setSelectedTagFilters([]);
        setTagKeyword([]);
        setSearchScope(DEFAULT_SCOPE);
        setSearchOperator(DEFAULT_OPERATOR);
        setCurrentPage(1);
        setLastKnownPage(1);
    };

    const toggleTagFilter = (tag, { resetSearch = false } = {}) => {
        setSelectedTagFilters((prev) => {
            if (prev.includes(tag)) {
                const next = prev.filter((item) => item !== tag);
                setTagKeyword(next.map((item) => item.toLowerCase()));
                return next;
            }
            if (prev.length >= 10) {
                return prev;
            }
            const next = [...prev, tag];
            setTagKeyword(next.map((item) => item.toLowerCase()));
            return next;
        });
        if (resetSearch) {
            setSearchInput("");
            setKeyword("");
        }
        setCurrentPage(1);
        setLastKnownPage(1);
    };

    const handleTopWriterSelect = useCallback((writerName) => {
        const trimmed = (writerName || "").trim();
        if (!trimmed) return;

        const trimmedLower = trimmed.toLowerCase();
        const currentKeywordLower = (keyword || "").toLowerCase();
        const currentInputLower = searchInput.trim().toLowerCase();

        const isActive =
            searchScope === "author" &&
            searchOperator === DEFAULT_OPERATOR &&
            selectedTagFilters.length === 0 &&
            currentKeywordLower === trimmedLower &&
            currentInputLower === trimmedLower;

        if (isActive) {
            setSearchScope(DEFAULT_SCOPE);
            setSearchOperator(DEFAULT_OPERATOR);
            setSearchInput("");
            setKeyword("");
        } else {
            setSearchScope("author");
            setSearchOperator(DEFAULT_OPERATOR);
            setSearchInput(trimmed);
            setKeyword(trimmed);
        }

        setSelectedTagFilters([]);
        setTagKeyword([]);
        setCurrentPage(1);
        setLastKnownPage(1);
    }, [keyword, searchInput, searchScope, searchOperator, selectedTagFilters]);

    const handlePopularTagSelect = (tag) => {
        const normalized = tag.toUpperCase();
        const isActive =
            searchScope === "tag" &&
            searchOperator === DEFAULT_OPERATOR &&
            selectedTagFilters.length === 1 &&
            selectedTagFilters[0] === normalized;

        setSearchInput("");
        setKeyword("");

        if (isActive) {
            setSearchScope(DEFAULT_SCOPE);
            setSearchOperator(DEFAULT_OPERATOR);
            setSelectedTagFilters([]);
            setTagKeyword([]);
        } else {
            setSearchScope("tag");
            setSearchOperator(DEFAULT_OPERATOR);
            setSelectedTagFilters([normalized]);
            setTagKeyword([normalized.toLowerCase()]);
        }

        setCurrentPage(1);
        setLastKnownPage(1);
    };

    const totalPages = useMemo(() => {
        const count = Math.ceil(filteredPosts.length / PAGE_SIZE);
        return count > 0 ? count : 1;
    }, [filteredPosts.length]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
            setLastKnownPage(totalPages);
            return;
        }
        setLastKnownPage(currentPage);
    }, [currentPage, totalPages]);

    const pageNumbers = useMemo(() => (
        Array.from({ length: totalPages }, (_, index) => index + 1)
    ), [totalPages]);

    const paginatedPosts = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE;
        const end = start + PAGE_SIZE;
        return sortedPosts.slice(start, end);
    }, [sortedPosts, currentPage]);

    const topWriters = useMemo(() => {
        if (!posts.length) return [];

        const counts = posts.reduce((acc, post) => {
            const author = (post.author || "익명").trim();
            if (!author) return acc;
            acc[author] = (acc[author] ?? 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts)
            .sort((a, b) => {
                const countDiff = b[1] - a[1];
                if (countDiff !== 0) return countDiff;
                return a[0].localeCompare(b[0]);
            })
            .slice(0, 7)
            .map(([name, count]) => ({ name, count }));
    }, [posts]);

    const weeklyPopular = useMemo(() => {
        if (!posts.length) return [];

        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const withinWeek = posts.filter((post) =>
            Number.isFinite(post.createdAtMs) && post.createdAtMs >= oneWeekAgo
        );

        const source = withinWeek.length ? withinWeek : posts;

        return [...source]
            .sort((a, b) => {
                const likeDiff = (b.likes ?? 0) - (a.likes ?? 0);
                if (likeDiff !== 0) return likeDiff;
                const commentDiff = (b.comments ?? 0) - (a.comments ?? 0);
                if (commentDiff !== 0) return commentDiff;
                const timeA = Number.isFinite(a.createdAtMs) ? a.createdAtMs : 0;
                const timeB = Number.isFinite(b.createdAtMs) ? b.createdAtMs : 0;
                if (timeA !== timeB) return timeB - timeA;
                return (b.id ?? 0) - (a.id ?? 0);
            })
            .slice(0, 3)
            .map((post) => ({
                id: post.id,
                title: post.title,
                author: post.author,
                likes: post.likes ?? 0,
                createdAt: post.date,
            }));
    }, [posts]);

    const popularTags = useMemo(() => {
        if (!posts.length) return [];

        const counts = posts.reduce((acc, post) => {
            (post.tags || []).forEach((tag) => {
                const normalized = String(tag || "").trim();
                if (!normalized) return;
                const printable = normalized.replace(/^#/, "");
                if (!printable) return;
                const key = printable.toLowerCase();

                if (!acc[key]) {
                    acc[key] = { label: printable, count: 0 };
                }
                acc[key].count += 1;
            });
            return acc;
        }, {});

        return Object.values(counts)
            .sort((a, b) => {
                const countDiff = b.count - a.count;
                if (countDiff !== 0) return countDiff;
                return a.label.localeCompare(b.label);
            })
            .slice(0, 5);
    }, [posts]);

    const jumpBy = 5;
    const goToPage = (page) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const handleChunkMove = (direction) => {
        const target = currentPage + direction * jumpBy;
        if (target < 1) {
            setCurrentPage(1);
        } else if (target > totalPages) {
            setCurrentPage(totalPages);
        } else {
            setCurrentPage(target);
        }
    };

    return (
        <div className="community-wrapper">
            <div className="community-page">
                <aside className="sidebar-left">
                    <h3>함께 공부해요.</h3>
                    <ul>
                        {SIDEBAR_CHANNELS.map((channel) => (
                            <li
                                key={channel.label}
                                className={[
                                    channel.active ? "active" : "",
                                    channel.disabled ? "is-disabled" : "",
                                ].filter(Boolean).join(" ")}
                            >
                                {channel.label}
                            </li>
                        ))}
                    </ul>
                    <div className="top-writers">
                        <h4>Zivorp TOP Writers</h4>
                        {topWriters.length ? (
                            <ol>
                                {topWriters.map(({ name, count }) => {
                                    const trimmed = (name || "").trim();
                                    const trimmedLower = trimmed.toLowerCase();
                                    const currentKeywordLower = (keyword || "").toLowerCase();
                                    const currentInputLower = searchInput.trim().toLowerCase();

                                    const isActive =
                                        Boolean(trimmed) &&
                                        searchScope === "author" &&
                                        searchOperator === DEFAULT_OPERATOR &&
                                        selectedTagFilters.length === 0 &&
                                        currentKeywordLower === trimmedLower &&
                                        currentInputLower === trimmedLower;

                                    return (
                                        <li key={name}>
                                            <button
                                                type="button"
                                                className={[
                                                    "top-writer-item",
                                                    isActive ? "is-active" : "",
                                                ].filter(Boolean).join(" ")}
                                                onClick={() => handleTopWriterSelect(trimmed)}
                                                aria-pressed={isActive}
                                            >
                                                <span className="writer-name">{name}</span>
                                                <span className="writer-count">{count}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        ) : (
                            <p className="top-writers-empty">아직 활동 기록이 없어요.</p>
                        )}
                    </div>
                </aside>

                <main className="community-main">
                    <div className="tabs">
                        {COMMUNITY_TABS.map((tab) => (
                            <button
                                key={tab.label}
                                type="button"
                                className={[
                                    tab.disabled ? "tab-disabled" : "",
                                    !tab.disabled ? "active-tab" : "",
                                ].filter(Boolean).join(" ")}
                                disabled={tab.disabled}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="search-bar">
                        <form className="search-row" onSubmit={handleSearchSubmit}>
                            <input
                                type="search"
                                placeholder="궁금한 질문을 검색해보세요!"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                aria-label="게시글 검색"
                            />
                            <button type="submit" className="search-btn">검색</button>
                        </form>
                        <div className="search-options">
                            <div className="search-option">
                                <label htmlFor="community-search-scope">검색 대상</label>
                                <select
                                    id="community-search-scope"
                                    value={searchScope}
                                    onChange={(event) => {
                                        setSearchScope(event.target.value);
                                        setCurrentPage(1);
                                        setLastKnownPage(1);
                                    }}
                                >
                                    {SEARCH_SCOPE_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="search-option">
                                <label htmlFor="community-search-operator">조건</label>
                                <select
                                    id="community-search-operator"
                                    value={searchOperator}
                                    onChange={(event) => {
                                        setSearchOperator(event.target.value);
                                        setCurrentPage(1);
                                        setLastKnownPage(1);
                                    }}
                                >
                                    {SEARCH_OPERATOR_OPTIONS.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="search-row tag-search-row" role="presentation">
                            <div
                                className="tag-search-selector"
                                role="group"
                                aria-label="태그 검색"
                            >
                                {ALLOWED_TAGS.map((tag) => {
                                    const isActive = selectedTagFilters.includes(tag);
                                    const isDisabled = !isActive && reachedTagFilterLimit;
                                    const printable = `#${tag.toLowerCase()}`;
                                    const buttonLabel = isActive
                                        ? `${printable} 태그 필터 제거`
                                        : isDisabled
                                            ? "태그 필터는 최대 10개까지 선택할 수 있어요"
                                            : `${printable} 태그 필터 추가`;
                                    return (
                                        <button
                                            key={tag}
                                            type="button"
                                            className={`tag-search-option ${isActive ? "is-active" : ""}`.trim()}
                                            onClick={() => toggleTagFilter(tag)}
                                            aria-pressed={isActive}
                                            disabled={isDisabled}
                                            title={buttonLabel}
                                        >
                                            {printable}
                                        </button>
                                    );
                                })}
                            </div>
                            <button type="button" className="reset-btn" onClick={handleReset}>초기화</button>
                        </div>
                        <p className="tag-search-helper" aria-live="polite">
                            태그는 클릭해서 추가하거나 제거할 수 있어요. 선택 {selectedTagCount}개
                            {reachedTagFilterLimit ? " (최대 10개 선택됨)" : ""}
                        </p>
                    </div>

                    <div className="filter-area">
                        <div className="filter-bar">
                            {filters.map((filter) => (
                                <button
                                    key={filter}
                                    type="button"
                                    className={`filter-chip${filter === activeFilter ? " active" : ""}`}
                                    onClick={() => {
                                        setActiveFilter(filter);
                                        setCurrentPage((prev) => {
                                            const next = lastKnownPage;
                                            if (prev !== next) return next;
                                            return prev;
                                        });
                                    }}
                                >
                                    {filter}
                                </button>
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

                    {!loading && !error && posts.length > 0 && filteredPosts.length === 0 && (
                        <div className="post-list"><p>검색 결과가 없습니다.</p></div>
                    )}

                    {!loading && !error && filteredPosts.length > 0 && (
                        <div className="post-list">
                            {paginatedPosts.map((post) => (
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

                    {filteredPosts.length > 0 && (
                        <div className="pagination-wrapper">
                            <div className="page-numbers">
                                <button
                                    type="button"
                                    className="page-button"
                                    onClick={() => goToPage(1)}
                                    disabled={currentPage === 1}
                                >
                                    처음
                                </button>
                                <button
                                    type="button"
                                    className="page-button"
                                    onClick={() => handleChunkMove(-1)}
                                    disabled={currentPage === 1}
                                >
                                    -5쪽
                                </button>
                                {pageNumbers.map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        className={`page-button${page === currentPage ? " active" : ""}`}
                                        onClick={() => goToPage(page)}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    className="page-button"
                                    onClick={() => handleChunkMove(1)}
                                    disabled={currentPage === totalPages}
                                >
                                    +5쪽
                                </button>
                                <button
                                    type="button"
                                    className="page-button"
                                    onClick={() => goToPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                >
                                    마지막
                                </button>
                            </div>
                        </div>
                    )}
                </main>

                <aside className="sidebar-right">
                    <div className="popular-posts">
                        <h4>주간 인기글</h4>
                        {weeklyPopular.length ? (
                            <ul>
                                {weeklyPopular.map((post) => (
                                    <li key={post.id}>
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/community/post/${post.id}`)}
                                        >
                                            <div className="post-title">{post.title}</div>
                                            <div className="post-author">{post.author || "익명"}</div>
                                            {typeof post.likes === "number" && (
                                                <div className="post-likes">좋아요 {post.likes}</div>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="popular-posts-empty">인기 게시글을 불러오는 중입니다.</p>
                        )}
                    </div>
                    <div className="popular-tags">
                        <h4>인기 태그</h4>
                        {popularTags.length ? (
                            <ol className="tag-list">
                                {popularTags.map((tag) => {
                                    const normalizedTag = tag.label.toUpperCase();
                                    const isActive =
                                        searchScope === "tag" &&
                                        searchOperator === DEFAULT_OPERATOR &&
                                        selectedTagFilters.length === 1 &&
                                        selectedTagFilters[0] === normalizedTag;

                                    return (
                                        <li key={tag.label}>
                                            <button
                                                type="button"
                                                className={["tag-item-button", isActive ? "is-active" : ""].filter(Boolean).join(" ")}
                                                onClick={() => handlePopularTagSelect(normalizedTag)}
                                                aria-pressed={isActive}
                                                title={isActive ? `#${normalizedTag} 태그 필터 제거` : `#${normalizedTag} 태그 필터 추가`}
                                            >
                                                <span className="tag-name">#{normalizedTag}</span>
                                                <span className="tag-count">{tag.count}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ol>
                        ) : (
                            <p className="popular-tags-empty">인기 태그 데이터를 불러오는 중입니다.</p>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    );
}
