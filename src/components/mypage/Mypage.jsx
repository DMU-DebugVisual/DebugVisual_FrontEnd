import React from 'react';
import './Mypage.css';
import {
    FaExchangeAlt,
    FaUser,
    FaStar,
    FaArrowUp,
    FaArrowDown,
    FaRegClock,
    FaPen,
    FaExternalLinkAlt
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const MyPage = ({ nickname }) => {
    const statCards = [
        {
            label: '총 프로젝트',
            value: '12',
            helper: '이번 달 3개 추가',
            trend: 'up',
            icon: <FaExchangeAlt />,
        },
        {
            label: '팔로워',
            value: '48',
            helper: '이번 주 4명 증가',
            trend: 'up',
            icon: <FaUser />,
        },
        {
            label: '즐겨찾기',
            value: '7',
            helper: '최근 1개 취소',
            trend: 'down',
            icon: <FaStar />,
        },
        {
            label: '평균 시청 시간',
            value: '42분',
            helper: '지난 달 대비 +6분',
            trend: 'up',
            icon: <FaRegClock />,
        },
    ];

    const highlights = [
        '알고리즘 스터디 실시간 방송 진행 중',
        '코드 리팩터링 가이드 게시글이 인기 게시물로 선정',
        '팀 프로젝트 “Graph Explorer”에 2명의 신규 기여자 합류',
    ];

    const recentProjects = [
        {
            title: '버블 정렬 시각화',
            stack: 'JavaScript',
            summary: '단계별 애니메이션과 성능 비교 데이터를 함께 제공하는 인터랙티브 툴',
            thumbnail: null,
        },
        {
            title: '이진 트리 구현',
            stack: 'Python',
            summary: '삽입·탐색 과정을 즉시 확인할 수 있는 실습용 코드 샌드박스',
            thumbnail: null,
        },
        {
            title: '다익스트라 알고리즘',
            stack: 'TypeScript',
            summary: '그래프 경로 탐색 과정을 스텝별로 시각화하는 교육용 자료',
            thumbnail: null,
        },
    ];

    const activities = [
        {
            title: '“그래프 탐색 기초” 라이브 세션 예약이 오픈되었습니다.',
            time: '3시간 전',
        },
        {
            title: '커뮤니티 질문 “DFS와 BFS의 차이점”에 답변을 남겼습니다.',
            time: '어제',
        },
        {
            title: '“Recursion Patterns” 프로젝트에 새로운 모듈을 추가했습니다.',
            time: '지난주',
        },
    ];

    return (
        <main className="mypage-content">
            <header className="mypage-header">
                <div className="page-heading">
                    <h1 className="page-title">마이페이지</h1>
                    <p className="page-subtitle">
                        최근 활동과 프로젝트 현황을 한눈에 확인하고, 커뮤니티와의 연결을 이어가 보세요.
                    </p>
                </div>
                <div className="header-actions">
                    <Link to="/mypage/setting" className="ghost-button">
                        <FaPen /> 프로필 편집
                    </Link>
                    <Link to="/mypage/project" className="primary-button">
                        <FaExternalLinkAlt /> 프로젝트 관리
                    </Link>
                </div>
            </header>

            <section className="profile-card section-card">
                <div className="profile-avatar" aria-hidden="true" />
                <div className="profile-meta">
                    <div className="profile-title">
                        <h2>{nickname}</h2>
                        <span className="profile-handle">@kimcoding</span>
                    </div>
                    <p className="profile-bio">
                        알고리즘과 데이터 구조에 관심이 많은 개발자입니다. 코드를 시각화하며 복잡한 개념을 쉽게 이해하고 공유하는 것을 좋아합니다.
                    </p>
                    <div className="profile-tags">
                        <span>Python</span>
                        <span>JavaScript</span>
                        <span>알고리즘</span>
                        <span>데이터 시각화</span>
                        <span>웹 개발</span>
                    </div>
                </div>
                <div className="profile-highlight">
                    <h3>주요 소식</h3>
                    <ul>
                        {highlights.map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </div>
            </section>

            <section className="stats-grid">
                {statCards.map(({ label, value, helper, trend, icon }) => (
                    <article className={`stat-card section-card ${trend}`} key={label}>
                        <div className="stat-icon" aria-hidden="true">{icon}</div>
                        <div className="stat-body">
                            <span className="stat-label">{label}</span>
                            <strong className="stat-value">{value}</strong>
                            <span className={`stat-trend ${trend}`}>
                                {trend === 'up' ? <FaArrowUp /> : <FaArrowDown />}
                                {helper}
                            </span>
                        </div>
                    </article>
                ))}
            </section>

            <section className="section-two-column">
                <article className="recent-projects section-card">
                    <div className="section-header">
                        <div>
                            <h3>최근 프로젝트</h3>
                            <p>마지막으로 업데이트된 프로젝트를 빠르게 다시 살펴보세요.</p>
                        </div>
                        <Link to="/mypage/project" className="quiet-link">
                            모두 보기
                        </Link>
                    </div>
                    <div className="project-grid">
                        {recentProjects.map(({ title, stack, summary, thumbnail }) => (
                            <div className="project-card" key={title}>
                                <div className="project-thumbnail" role="img" aria-label={`${title} 썸네일`}>
                                    {thumbnail ? (
                                        <img src={thumbnail} alt="" loading="lazy" />
                                    ) : (
                                        <div className="project-thumbnail-fallback">{stack}</div>
                                    )}
                                </div>
                                <div className="project-meta">
                                    <span className="project-stack">{stack}</span>
                                    <h4>{title}</h4>
                                    <p>{summary}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </article>

                <article className="activity-feed section-card">
                    <div className="section-header">
                        <div>
                            <h3>최근 활동</h3>
                            <p>라이브, 커뮤니티, 프로젝트에서의 움직임을 모아봤어요.</p>
                        </div>
                        <Link to="/community" className="quiet-link">
                            커뮤니티 가기
                        </Link>
                    </div>
                    <ul className="activity-list">
                        {activities.map(({ title, time }) => (
                            <li key={title}>
                                <span className="activity-title">{title}</span>
                                <span className="activity-time">{time}</span>
                            </li>
                        ))}
                    </ul>
                </article>
            </section>
        </main>
    );
};

export default MyPage;
