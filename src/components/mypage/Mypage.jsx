import React from 'react';
import './Mypage.css';
import { FaExchangeAlt, FaUser, FaStar } from 'react-icons/fa';

const MyPage = () => {
    return (
        <div className="mypage">
            <aside className="sidebar">
                <div className="username">
                    <div className="avatar-small" />
                    <div className="user-info">
                        <span className="name">김코딩</span>
                        <span className="email">@kimcoidng</span>
                    </div>
                </div>


                <ul>
                    <li className="active">📊 대시보드</li>
                    <li>🗂️ 프로젝트</li>
                    <li>💬 커뮤니티</li>
                    <li>🌐 네트워크</li>
                    <li>📁 공유함</li>
                    <li>⚙️ 설정</li>
                </ul>
            </aside>

            <main className="content">
                <h1 className="page-title">마이페이지</h1>

                <section className="profile">
                    <div className="profile-header">
                        <div className="avatar" />
                        <div className="info">
                            <h2>김코딩</h2>
                            <p>@kimcoding</p>
                            <p className="bio">
                                알고리즘과 데이터 구조에 관심이 많은 개발자입니다. 코드를 시각화하며 복잡한 개념을 쉽게 이해하고 공유하는 것을 좋아합니다.
                            </p>
                            <div className="tags">
                                <span>Python</span>
                                <span>JavaScript</span>
                                <span>알고리즘</span>
                                <span>데이터 시각화</span>
                                <span>웹 개발</span>
                            </div>
                        </div>
                        <button className="edit-btn">프로필 편집</button>
                    </div>
                </section>

                <section className="stats">
                    <div className="stat-box">
                        <h3>총 프로젝트 <FaExchangeAlt className="icon" /></h3>
                        <div className="count">12</div>
                        <div className="change up">↑ 20% 지난 달 대비</div>
                    </div>

                    <div className="stat-box">
                        <h3>팔로워 <FaUser className="icon" /></h3>
                        <div className="count">48</div>
                        <div className="change up">↑ 5% 지난 달 대비</div>
                    </div>

                    <div className="stat-box">
                        <h3>즐겨찾기 <FaStar className="icon" /></h3>
                        <div className="count">7</div>
                        <div className="change down">↓ 2% 지난 달 대비</div>
                    </div>
                </section>

                <section className="recent-projects">
                    <div className="section-title">
                        <span>최근 프로젝트</span>
                        <a href="/projects" className="view-all-btn">모든 프로젝트 보기 →</a>
                    </div>
                    <div className="project-list">
                        <div className="project-card">
                            <img src="/path/to/thumbnail1.jpg" alt="썸네일" className="thumbnail" />
                            <h4>버블 정렬 시각화</h4>
                            <span className="tag">JavaScript</span>
                            <p>버블 정렬 알고리즘의 단계별 시각화 및 성능 분석</p>
                        </div>



                        <div className="project-card">
                            <img src="/path/to/thumbnail1.jpg" alt="썸네일" className="thumbnail" />
                            <h4>이진 트리 구현</h4>
                            <span className="tag">Python</span>
                            <p>이진 트리 데이터 구조의 구현 및 시각화</p>
                        </div>


                        <div className="project-card">
                            <img src="/path/to/thumbnail1.jpg" alt="썸네일" className="thumbnail" />
                            <h4>다익스트라 알고리즘</h4>
                            <span className="tag">TypeScript</span>
                            <p>최단 경로 찾기 알고리즘 시각화</p>
                        </div>


                    </div>
                </section>
            </main>
        </div>
    );
};

export default MyPage;
