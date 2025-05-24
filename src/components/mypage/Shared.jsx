import React from 'react';
import './Shared.css';

const Shared = () => {
    return (
        <div className="shared-projects-container">
            <h2 className="page-title">공유된 프로젝트</h2>
            <input type="text" placeholder="  프로젝트 검색..." className="search-input"/>

            <div className="tab-buttons">
                <button className="tab active">나와 공유됨</button>
                <button className="tab">내가 공유함</button>
            </div>

            <div className="cards-wrapper">
                <ProjectCard
                    title="정렬 알고리즘 비교"
                    tag="편집"
                    language="JavaScript"
                    date="2023. 5. 10."
                    description="다양한 정렬 알고리즘의 성능 비교 및 시각화"
                    collaborators="2"
                />
                <ProjectCard
                    title="이진 탐색 트리 구현"
                    tag="보기"
                    language="Python"
                    date="2023. 5. 5."
                    description="이진 탐색 트리의 구현 및 시각화"
                    collaborators="1"
                />
                <ProjectCard
                    title="그래프 알고리즘 시각화"
                    tag="댓글"
                    language="TypeScript"
                    date="2023. 4. 28."
                    description="다양한 그래프 알고리즘의 시각화 및 성능 비교"
                    collaborators="3"
                />
            </div>
        </div>

    );
};
const tagClassMap = {
    '편집': 'edit',
    '보기': 'view',
    '댓글': 'comment'
};

const ProjectCard = ({title, tag, language, date, description, collaborators}) => (
    <div className="project-card">
        <h3 className="card-title">{title}</h3>
        <span className={`tag tag-${tagClassMap[tag]}`}>{tag}</span>
        <p className="description">{description}</p>

        <div className="card-bottom">
            <div className="card-meta">
                <span className={`language ${language.toLowerCase()}`}>{language}</span>
                <span className="date">{date}</span>
            </div>
            <span className="collaborators">👥 {collaborators}</span>
            <button className="open-button">열기</button>
        </div>
    </div>
);

export default Shared;
