import React from "react";
import { Link } from "react-router-dom";
import { FaPlus, FaSearch } from "react-icons/fa";
import "./MyProject.css";
import Sidebar from "./Sidebar";

const MyProject = () => {
    return (
        <div className="mypage-wrapper">
            <div className="myproject-wrapper">
                <Sidebar/>
                <section className="projects-container">
                    <div className="projects-header">
                        <h2>내 프로젝트</h2>
                        <button className="new-project-btn">
                            <FaPlus/>
                            새 프로젝트
                        </button>
                    </div>

                    <div className="projects-toolbar">
                        <div className="search-wrapper">
                            <FaSearch className="search-icon"/>
                            <input
                                type="text"
                                placeholder="프로젝트 검색..."
                                className="project-search-input"
                            />
                        </div>
                        <select className="filter-select" defaultValue="all">
                            <option value="all">모든 언어</option>
                            <option value="c">C</option>
                            <option value="python">Python</option>
                            <option value="java">Java</option>
                        </select>
                        <select className="filter-select" defaultValue="latest">
                            <option value="latest">최신순</option>
                            <option value="oldest">오래된 순</option>
                        </select>
                    </div>

                    <div className="projects-tabs">
                        <button className="tabs active">전체</button>
                        <button className="tabs">즐겨찾기</button>
                        <button className="tabs">공유됨</button>
                    </div>

                    <div className="projects-grid">
                        {/* 프로젝트 카드 전체를 Link로 감싸기 */}
                        <Link to="" className="project-card-link">
                            <div className="project-card">
                                <div className="card-header">
                                    <div className="card-thumbnail"></div>
                                    <button className="favorite-btn">★</button>
                                </div>
                                <div className="card-body">
                                    <h3>버블 정렬 시각화</h3>
                                    <span className="language-tag javascript">JavaScript</span>
                                    <p>버블 정렬 알고리즘의 단계별 시각화 및 성능 분석</p>
                                    <div className="card-meta">
                                        <span>2023. 5. 15.</span>
                                        <button className="menu-btn">⋯</button>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default MyProject;
