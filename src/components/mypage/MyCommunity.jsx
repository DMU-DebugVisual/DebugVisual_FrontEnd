import React from "react";
import "./MyCommunity.css";
import Header from "../header/Header";
import Sidebar from "./Sidebar";

const MyCommunity = () => {
    return (
        <div className="mycommunity-wrapper">
            <Sidebar />
            <section className="community-container">
                <h2 className="community-title">내 활동</h2>
                <input type="text" className="community-search" placeholder="검색..."/>
                <div className="community-tabs">
                    <button className="commu-tab active">내 게시물</button>
                    <button className="commu-tab">내 댓글</button>
                </div>

                <div className="post-card">
                    <div className="post-thumbnail"/>
                    <div className="post-content">
                        <div className="post-tags">
                            <span className="tag">알고리즘</span>
                            <span className="tag">정렬</span>
                            <span className="tag">시각화</span>
                        </div>
                        <h3 className="post-title">버블 정렬 시각화 프로젝트 공유합니다</h3>
                        <p className="post-summary">버블 정렬 알고리즘을 시각적으로 이해하기 쉽게 구현해보았습니다. 피드백 부탁드려요!</p>
                        <div className="post-meta">
                            <span>📅 2023. 5. 15.</span>
                            <span>👍 24</span>
                            <span>💬 8</span>
                        </div>
                        <div className="post-actions">
                            <button className="edit-btn">✏ 수정</button>
                            <button className="delete-btn">🗑 삭제</button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default MyCommunity;
