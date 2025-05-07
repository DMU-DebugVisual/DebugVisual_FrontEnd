import React from "react";
import "./Community.css";

export default function Community() {
    const posts = [
        {
            title: "버블 정렬 시각화 프로젝트 공유합니다",
            summary: "버블 정렬 알고리즘을 시각적으로 이해하기 쉽게 구현해보았습니다. 피드백 부탁드려요!",
            tags: ["알고리즘", "정렬", "시각화"],
            author: "김코딩",
            date: "2023. 5. 15",
            likes: 24,
            comments: 8,
            thumbnail: "https://via.placeholder.com/300x180"
        },
        {
            title: "그래프 탐색 알고리즘 비교: BFS vs DFS",
            summary: "그래프 탐색 알고리즘의 차이점을 비교하고 어떤 상황에서 더 적합한지 정리했습니다.",
            tags: ["그래프", "BFS", "DFS"],
            author: "이알고",
            date: "2023. 5. 17",
            likes: 32,
            comments: 12,
            thumbnail: "https://via.placeholder.com/300x180"
        },
        {
            title: "동적 프로그래밍 문제 해결 가이드",
            summary: "DP 문제를 효율적으로 푸는 전략과 예제를 모아 정리해봤습니다.",
            tags: ["DP", "문제풀이", "코딩테스트"],
            author: "박코딩",
            date: "2023. 5. 18",
            likes: 40,
            comments: 15,
            thumbnail: "https://via.placeholder.com/300x180"
        }
    ];

    return (
        <div className="community-container">
            <div className="community-header">
                <h1>커뮤니티</h1>
                <button className="new-post-button">+  새 게시물</button>
            </div>

            <div className="popular-posts-wrapper">
                <h2 className="section-title">🔥 인기 게시물</h2>
                <div className="popular-posts">
                    {posts.slice(0, 3).map((post, idx) => (
                        <div className="popular-post-card" key={idx}>
                            <img src={post.thumbnail} alt="썸네일" />
                            <div className="post-text">
                                <h3>{post.title}</h3>
                                <p>{post.summary}</p>
                            </div>
                            <div className="post-meta">
                                <span>{post.author}</span>
                                <span>좋아요 {post.likes}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="search-filter">
                <input type="text" placeholder="게시물 검색..." />
                <div className="filter-buttons">
                    <button>최신순</button>
                    <button>인기순</button>
                    <button>팔로잉</button>
                    <button>북마크</button>
                </div>
            </div>

            {posts.map((post, idx) => (
                <div className="post-card" key={idx}>
                    <div className="thumbnail-box">
                        <img src={post.thumbnail} alt="썸네일" />
                    </div>
                    <div className="post-content">
                        <div className="tags">
                            {post.tags.map((tag, i) => (
                                <span key={i} className="tag">{tag}</span>
                            ))}
                        </div>
                        <h3>{post.title}</h3>
                        <p>{post.summary}</p>
                        <div className="post-footer">
                            <div className="author-info">
                                <img src="https://via.placeholder.com/32" alt="작성자" />
                                <div>
                                    <p>{post.author}</p>
                                    <p className="date">{post.date}</p>
                                </div>
                            </div>
                            <div className="buttons">
                                <button>좋아요 {post.likes}</button>
                                <button>댓글 {post.comments}</button>
                                <button>공유</button>
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            <div className="pagination">
                <button>◀</button>
                <button className="active">1</button>
                <button>2</button>
                <button>▶</button>
            </div>
        </div>
    );
}
