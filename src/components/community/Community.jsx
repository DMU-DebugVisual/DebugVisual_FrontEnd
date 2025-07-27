import React from "react";
import { useNavigate } from "react-router-dom";
import "./Community.css";

export default function Community() {
    const navigate = useNavigate();
    const tabs = ["전체", "미해결", "해결됨"];
    const filters = ["최신순", "정확도순", "답변많은순", "좋아요순"];

    const posts = [
        {
            status: "해결됨",
            title: "버블 정렬 시각화 프로젝트 공유합니다",
            summary: "버블 정렬 알고리즘을 시각적으로 이해하기 쉽게 구현해보았습니다. 피드백 부탁드려요!",
            tags: ["알고리즘", "정렬", "시각화"],
            author: "김코딩",
            date: "2023. 5. 15",
            likes: 24,
            comments: 8
        },
        {
            status: "해결됨",
            title: "그래프 탐색 알고리즘 비교: BFS vs DFS",
            summary: "그래프 탐색 알고리즘의 차이점을 비교하고 어떤 상황에서 더 적합한지 정리했습니다.",
            tags: ["그래프", "BFS", "DFS"],
            author: "이알고",
            date: "2023. 5. 17",
            likes: 32,
            comments: 12
        },
        {
            status: "해결됨",
            title: "동적 프로그래밍 문제 해결 가이드",
            summary: "DP 문제를 효율적으로 푸는 전략과 예제를 모아 정리해봤습니다.",
            tags: ["DP", "문제풀이", "코딩테스트"],
            author: "박코딩",
            date: "2023. 5. 18",
            likes: 40,
            comments: 15
        },
        {
            status: "해결됨",
            title: "수강 중 문의드립니다!",
            summary: "안녕하세요! 수업 강의 잘 듣고 있습니다! 궁금한 게 있어서 문의 남깁니다! numeric_only=True는 이번에 시험환경이 엄...",
            tags: ["python", "머신러닝", "빅데이터", "pandas", "빅데이터분석기사"],
            author: "lettig0555",
            date: "2시간 전",
            likes: 6,
            comments: 13
        },
        {
            status: "해결됨",
            title: "rmse 값 구하기",
            summary: "랜덤포레스트 후 rmse 값을 구할 때 이렇게 구해도 상관없을까요?? from sklearn.ensemble import RandomForest...",
            tags: ["python", "머신러닝", "빅데이터", "pandas", "빅데이터분석기사"],
            author: "민우",
            date: "6분 전",
            likes: 0,
            comments: 2
        },
        {
            status: "미해결",
            title: "2025년 1회 구조체와 연결리스트 문제누락",
            summary: "5페이지 구조체와 연결리스트 해설 누락된 것 같습니다.",
            tags: ["python", "java", "c", "정보처리기사"],
            author: "hyungjun jo",
            date: "7시간 전",
            likes: 0,
            comments: 3
        },
        {
            status: "해결됨",
            title: "작업형2, 작업형3 pd.get_dummies 시 drop_first 유무",
            summary: "작업형2 할때는 pd.get_dummies(df) 할때 drop_first가 들어가 있지 않았는데 작업형3 강의에서는 다중공선성 피해...",
            tags: ["python", "머신러닝", "빅데이터", "pandas", "빅데이터분석기사"],
            author: "섭식",
            date: "9시간 전",
            likes: 6,
            comments: 3
        },
        {
            status: "미해결",
            title: "궁금한게 있습니다!",
            summary: "학습 관련 질문을 남겨주세요. 상세히 작성하면 더 좋아요! 질문글과 관련된 영상 위치를 알려주면 더 빠르게 답변드릴 수 있어요!",
            tags: ["python", "머신러닝", "빅데이터", "pandas", "빅데이터분석기사"],
            author: "eovnffppa",
            date: "9시간 전",
            likes: 0,
            comments: 15
        },
        {
            status: "해결됨",
            title: "안녕하세요 주말코딩님 질문드립니다",
            summary: "안녕하세요 주말코딩님. 저는 완전 문과 노베이스고 지금은 대기업 하청 전산실 OP로 일하면서 정보처리기사 실기 시험을...",
            tags: ["python", "정보처리기사"],
            author: "김재호",
            date: "10시간 전",
            likes: 0,
            comments: 10
        }
    ];

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
                        <button className="write-btn">✏️ 글쓰기</button>
                    </div>

                    <div className="post-list">
                        {posts.map((post, i) => (
                            <div
                                key={i}
                                className="post-card"
                                onClick={() => navigate(`/community/post/${i}`)}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="post-meta">
                                    <div className="title-row">
                                        <span className={`badge ${post.status === "해결됨" ? "badge-solved" : ""}`}>
                                            {post.status}
                                        </span>
                                        <h3 className="post-title">{post.title}</h3>
                                    </div>
                                    <p className="post-summary">{post.summary}</p>
                                </div>
                                <div className="post-tags">
                                    {post.tags.map((tag, j) => (
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
                            <li>
                                <div className="post-title">버블 정렬 시각화 프로젝트 공유합니다</div>
                                <div className="post-author">김코딩</div>
                            </li>
                            <li>
                                <div className="post-title">그래프 탐색 알고리즘 비교: BFS vs DFS</div>
                                <div className="post-author">이알고</div>
                            </li>
                            <li>
                                <div className="post-title">동적 프로그래밍 문제 해결 가이드</div>
                                <div className="post-author">박코딩</div>
                            </li>
                            <li>
                                <div className="post-title">백엔드 신입 CS 스터디 3기 모집</div>
                                <div className="post-author">김지훈</div>
                            </li>
                            <li>
                                <div className="post-title">AI 실전 활용을 위한 4주 집중 스터디, 애사모!</div>
                                <div className="post-author">Edun</div>
                            </li>
                        </ul>
                    </div>
                </aside>
            </div>
        </div>
    );
}
