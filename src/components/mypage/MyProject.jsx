import React from "react";
import { FaPlus, FaSearch, FaSlidersH, FaStar, FaCopy } from "react-icons/fa";
import "./MyProject.css";

const sampleProjects = [
    {
        id: "bubble-visualizer",
        title: "버블 정렬 시각화",
        description: "단계별 애니메이션과 속도 조절을 지원하는 인터랙티브 학습 툴",
        stack: "JavaScript",
        updatedAt: "2025. 09. 21",
        status: "진행 중",
        progress: 72,
        collaborators: 3,
        starred: true,
    },
    {
        id: "bst-lab",
        title: "이진 탐색 트리 실험실",
        description: "삽입·삭제 연산 결과를 즉시 확인하는 데이터 구조 실험 프로젝트",
        stack: "Python",
        updatedAt: "2025. 09. 16",
        status: "리뷰 대기",
        progress: 48,
        collaborators: 2,
        starred: false,
    },
    {
        id: "graph-explorer",
        title: "Graph Explorer",
        description: "다익스트라·A* 등 경로 탐색 알고리즘을 비교 시각화하는 대시보드",
        stack: "TypeScript",
        updatedAt: "2025. 08. 30",
        status: "배포됨",
        progress: 100,
        collaborators: 5,
        starred: true,
    },
    {
        id: "dp-playbook",
        title: "Dynamic Programming Playbook",
        description: "대표 DP 문제 풀이와 시각화 자료를 한곳에 정리한 컬렉션",
        stack: "Kotlin",
        updatedAt: "2025. 08. 18",
        status: "초안",
        progress: 28,
        collaborators: 1,
        starred: false,
    },
];

const languageTone = {
    JavaScript: "lang-yellow",
    Python: "lang-green",
    TypeScript: "lang-indigo",
    Kotlin: "lang-purple",
};

const statusTone = {
    "진행 중": "status-active",
    "리뷰 대기": "status-review",
    "배포됨": "status-live",
    "초안": "status-draft",
};

const MyProject = () => {
    return (
        <main className="mypage-content mypage-projects">
            <header className="mypage-page-header">
                <div>
                    <h1>내 프로젝트</h1>
                    <p>협업 중인 작업과 개인 실험실을 한 곳에서 관리하세요.</p>
                </div>
                <div className="projects-header-actions">
                    <button type="button" className="ghost-button compact">
                        <FaCopy aria-hidden="true" /> 템플릿 갤러리
                    </button>
                    <button type="button" className="primary-button new-project-btn">
                        <FaPlus aria-hidden="true" /> 새 프로젝트
                    </button>
                </div>
            </header>

            <section className="section-card project-collection">
                <div className="project-collection__toolbar">
                    <div className="project-search">
                        <FaSearch aria-hidden="true" />
                        <input type="search" placeholder="프로젝트, 태그, 참여자 검색" />
                    </div>
                    <div className="project-toolbar-actions">
                        <button type="button" className="toolbar-chip is-active">전체</button>
                        <button type="button" className="toolbar-chip">즐겨찾기</button>
                        <button type="button" className="toolbar-chip">공유됨</button>
                        <button type="button" className="toolbar-chip">
                            <FaSlidersH aria-hidden="true" /> 필터
                        </button>
                    </div>
                </div>

                <div className="project-collection__grid">
                    {sampleProjects.map((project) => (
                        <article className="project-collection__card" key={project.id}>
                            <header className="project-collection__card-header">
                                <span
                                    className={`project-collection__stack ${languageTone[project.stack] || "lang-default"}`}
                                >
                                    {project.stack}
                                </span>
                                <span className={`project-status ${statusTone[project.status] || "status-draft"}`}>
                                    {project.status}
                                </span>
                            </header>

                            <h3>{project.title}</h3>
                            <p>{project.description}</p>

                            <div className="project-collection__meta">
                                <span className="project-updated">업데이트 {project.updatedAt}</span>
                                <span className="project-collab">👥 {project.collaborators}명 참여</span>
                                {project.starred && (
                                    <span className="project-favorite" aria-label="즐겨찾기 프로젝트">
                                        <FaStar aria-hidden="true" /> 즐겨찾기
                                    </span>
                                )}
                            </div>

                            <div className="project-progress">
                                <div className="project-progress__bar" style={{ width: `${project.progress}%` }} />
                                <span className="project-progress__label">진행률 {project.progress}%</span>
                            </div>

                            <footer className="project-card-footer">
                                <button type="button" className="secondary-button">열기</button>
                                <button type="button" className="secondary-button ghost">공유 관리</button>
                            </footer>
                        </article>
                    ))}
                </div>
            </section>
        </main>
    );
};

export default MyProject;
