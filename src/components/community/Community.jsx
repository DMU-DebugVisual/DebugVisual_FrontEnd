import React from "react";
import { useNavigate } from "react-router-dom"; // ✅ navigate import 추가
import "./Community.css";

export default function Community() {
    const navigate = useNavigate(); // ✅ navigate 선언

    const posts = [
        {
            title: "버블 정렬 시각화 프로젝트 공유합니다",
            summary: "버블 정렬 알고리즘을 시각적으로 이해하기 쉽게 구현해보았습니다. 피드백 부탁드려요!",
            tags: ["알고리즘", "정렬", "시각화"],
            author: "김코딩",
            date: "2023. 5. 15",
            likes: 24,
            comments: 8,
            thumbnail: "https://unsplash.com/photos/KrYbarbAx5s/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTZ8fCVFQiU5NCU5NCVFQiVCMiU4NCVFQSVCOSU4NXxrb3wwfHx8fDE3NDgyNDc1NDh8MA&force=true"
        },
        {
            title: "그래프 탐색 알고리즘 비교: BFS vs DFS",
            summary: "그래프 탐색 알고리즘의 차이점을 비교하고 어떤 상황에서 더 적합한지 정리했습니다.",
            tags: ["그래프", "BFS", "DFS"],
            author: "이알고",
            date: "2023. 5. 17",
            likes: 32,
            comments: 12,
            thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=300&h=180"
        },
        {
            title: "동적 프로그래밍 문제 해결 가이드",
            summary: "DP 문제를 효율적으로 푸는 전략과 예제를 모아 정리해봤습니다.",
            tags: ["DP", "문제풀이", "코딩테스트"],
            author: "박코딩",
            date: "2023. 5. 18",
            likes: 40,
            comments: 15,
            thumbnail:  "https://unsplash.com/photos/ZS67i1HLllo/download?ixid=M3wxMjA3fDB8MXxzZWFyY2h8MTV8fCVFQiU4RiU5OSVFQyVBMCU4MSUyMCVFRCU5NCU4NCVFQiVBMSU5QyVFQSVCNyVCOCVFQiU5RSU5OCVFQiVCMCU4RCUyMCVFRCU5NSVCNCVFQSVCMiVCMCUyMCVFQSVCMCU4MCVFQyU5RCVCNCVFQiU5MyU5Q3xrb3wwfHx8fDE3NDgyNDc3NjB8MA&force=true"
        }
    ];


    return (
        <div className="community-container">
            <div className="community-header">
                <h1>커뮤니티</h1>
                <button
                    className="new-post-button"
                    onClick={() => navigate("/community/write")}
                >
                    + 새 게시물
                </button>
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
                                <img src="https://cdn-icons-png.flaticon.com/512/847/847969.png" alt="작성자" width="32" height="32" />
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
