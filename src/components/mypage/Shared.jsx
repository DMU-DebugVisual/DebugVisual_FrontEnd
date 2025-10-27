import React from 'react';
import './Shared.css';
import { FaUserPlus, FaUsers, FaShareAlt } from 'react-icons/fa';

const sharedProjects = [
    {
        id: 'sorting-playground',
        title: '정렬 알고리즘 비교',
        role: '편집 가능',
        language: 'JavaScript',
        description: '팀원과 함께 주요 정렬 알고리즘 로직을 다듬고 있습니다.',
        updatedAt: '2025. 09. 22',
        collaborators: 4,
        owner: 'jihye.kim',
    },
    {
        id: 'bst-visualizer',
        title: '이진 탐색 트리 구현',
        role: '보기 전용',
        language: 'Python',
        description: '자료구조 스터디 팀이 참고할 수 있도록 공유된 리소스입니다.',
        updatedAt: '2025. 09. 18',
        collaborators: 2,
        owner: 'team-algo',
    },
    {
        id: 'graph-lab',
        title: '그래프 알고리즘 시각화',
        role: '댓글 권한',
        language: 'TypeScript',
        description: '경로 탐색 모듈을 리뷰받기 위해 커뮤니티에 공개했습니다.',
        updatedAt: '2025. 09. 12',
        collaborators: 6,
        owner: 'jaewon.park',
    },
];

const roleTone = {
    '편집 가능': 'role-edit',
    '보기 전용': 'role-view',
    '댓글 권한': 'role-comment',
};

const languageBadge = {
    JavaScript: 'lang-yellow',
    Python: 'lang-green',
    TypeScript: 'lang-indigo',
};

const Shared = () => {
    return (
        <main className="mypage-content shared-page">
            <header className="mypage-page-header">
                <div>
                    <h1>공유된 프로젝트</h1>
                    <p>협업 권한과 소유자를 한눈에 확인하고 필요한 작업을 바로 진행하세요.</p>
                </div>
                <button type="button" className="primary-button">
                    <FaUserPlus aria-hidden="true" /> 새 협업 초대
                </button>
            </header>

            <section className="section-card shared-controls">
                <div className="shared-tabs" role="tablist" aria-label="공유 범위 필터">
                    <button type="button" className="shared-tab is-active">나와 공유됨</button>
                    <button type="button" className="shared-tab">내가 공유함</button>
                    <button type="button" className="shared-tab">즐겨찾기</button>
                </div>
                <div className="shared-stats">
                    <div className="shared-stat">
                        <span className="shared-stat__icon"><FaUsers aria-hidden="true" /></span>
                        <div>
                            <strong>15명</strong>
                            <span>함께 작업 중</span>
                        </div>
                    </div>
                    <div className="shared-stat">
                        <span className="shared-stat__icon"><FaShareAlt aria-hidden="true" /></span>
                        <div>
                            <strong>8건</strong>
                            <span>최근 공유</span>
                        </div>
                    </div>
                </div>
            </section>

            <section className="shared-grid">
                {sharedProjects.map((project) => (
                    <article className="shared-card" key={project.id}>
                        <header className="shared-card__header">
                            <span className={`shared-role ${roleTone[project.role] || 'role-view'}`}>{project.role}</span>
                            <span className={`shared-language ${languageBadge[project.language] || 'lang-default'}`}>
                                {project.language}
                            </span>
                        </header>
                        <h3>{project.title}</h3>
                        <p>{project.description}</p>
                        <dl className="shared-card__meta">
                            <div>
                                <dt>소유자</dt>
                                <dd>@{project.owner}</dd>
                            </div>
                            <div>
                                <dt>업데이트</dt>
                                <dd>{project.updatedAt}</dd>
                            </div>
                        </dl>
                        <footer className="shared-card__footer">
                            <span className="shared-collab">👥 {project.collaborators}명 참여</span>
                            <div className="shared-actions">
                                <button type="button" className="secondary-button">열어보기</button>
                                <button type="button" className="secondary-button ghost">권한 관리</button>
                            </div>
                        </footer>
                    </article>
                ))}
            </section>
        </main>
    );
};

export default Shared;
