import React from "react";
import { useParams } from "react-router-dom";
import "./PostDetail.css";

export default function PostDetail() {
    const { id } = useParams();

    const post = {
        title: "버블 정렬 시각화 프로젝트 공유합니다",
        content: `버블 정렬 알고리즘을 시각적으로 이해하기 쉽게 구현해보았습니다. 피드백 부탁드려요!`,
        author: "김코딩",
        date: "2025. 07. 25. 01:17",
        views: 1,
        likes: 0,
        dislikes: 0,
        tags: ["python", "코딩-테스트", "알고리즘"]
    };

    return (
        <div className="post-detail-container">
            <div className="post-detail-left">
                <div className="post-top-divider" />
                <h1 className="post-title">{post.title}</h1>
                <div className="post-subinfo">
                    <span>{post.date} 작성</span>
                    <span>👁 {post.views}</span>
                </div>

                <div className="post-content">
                    {post.content.split("\n").map((line, i) => (
                        <p key={i}>{line}</p>
                    ))}
                </div>

                <div className="post-actions">
                    <button>👍 {post.likes}</button>
                    <button>👎 {post.dislikes}</button>
                </div>

                <div className="post-tags">
                    {post.tags.map((tag, i) => (
                        <span key={i} className="tag">#{tag}</span>
                    ))}
                </div>

                <div className="post-util-buttons">
                    <button className="save-btn">📌 저장</button>
                    <button className="link-btn">🔗</button>
                </div>
                <div className="section-divider" />
                <div className="answer-form">
                    <input type="text" placeholder="답변을 작성해보세요." />
                </div>

                <div className="empty-comment">
                    <img src="/empty-comment.png" alt="답변 없음" />
                    <p className="comment-title">답변을 기다리고 있는 질문이에요</p>
                    <p className="comment-sub">첫번째 답변을 남겨보세요!</p>
                </div>
            </div>

            <aside className="post-detail-right">
                <div className="author-box">
                    <div className="profile-image"></div>
                    <div className="author-info">
                        <div className="author-name">{post.author}</div>
                        <div className="author-activity">작성한 질문수 5</div>
                    </div>
                </div>


                <div className="related-qna">
                    <div className="related-qna-header">
                        <h4>이 글과 비슷한 Q&A</h4>
                        <button className="view-all-btn">전체 Q&A</button>
                    </div>
                    <ul>
                        <li>
                            <div className="related-item">
                                <span className="related-title">노션 공유</span>
                                <div className="related-meta">
                                    <span className="date">25.07.19. 20:29</span>
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
                                <span className="related-title">노션 공유 부탁드립니다</span>
                                <div className="related-meta">
                                    <span className="date">25.07.01. 16:29</span>
                                    <div className="reactions">
                                        <span>👍 0</span>
                                        <span>💬 2</span>
                                    </div>
                                </div>
                            </div>
                        </li>
                    </ul>
                    <div className="related-pagination">
                        <button className="page-btn nav-btn">‹</button>  {/* 이전 */}
                        <button className="page-btn active">1</button>
                        <button className="page-btn">2</button>
                        <button className="page-btn">3</button>
                        <button className="page-btn">4</button>
                        <button className="page-btn">5</button>
                        <button className="page-btn nav-btn">›</button>  {/* 다음 */}
                    </div>

                </div>


                <button className="ask-btn">질문하기</button>
            </aside>
        </div>
    );
}
