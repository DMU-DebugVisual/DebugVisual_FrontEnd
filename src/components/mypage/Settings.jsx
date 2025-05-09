import React from 'react';
import './Settings.css';
import Sidebar from './Sidebar';

const Settings = () => {
    return (
        <div className="mypage">
            <Sidebar />
            <div className="settings-container">
                <h1 className="settings-title">설정</h1>

                <div className="settings-tabs">
                    <button className="tab active">프로필</button>
                    <button className="tab">계정</button>
                    <button className="tab">테마</button>
                    <button className="tab">알림</button>
                </div>

                <div className="settings-card">
                    <h2 className="section-title">프로필 정보</h2>
                    <p className="section-desc">프로필 정보를 수정하여 다른 사용자에게 나를 소개하세요.</p>

                    <div className="profile-image-section">
                        <div className="profile-image" />
                        <div>
                            <button className="upload-btn">이미지 업로드</button>
                            <button className="delete-btn">삭제</button>
                            <p className="upload-note">JPG, PNG 또는 GIF 파일. 최대 2MB.</p>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group half">
                            <label>이름</label>
                            <input type="text" defaultValue="김코딩" />
                        </div>

                        <div className="form-group half">
                            <label>사용자 이름</label>
                            <input type="text" defaultValue="kimcoding" />
                            <p className="small-text">codeviz.com/@kimcoding</p>
                        </div>
                    </div>


                    <div className="form-group large-gap">
                        <label>자기소개</label>
                        <textarea defaultValue="알고리즘과 데이터 구조에 관심이 많은 개발자입니다. 코드 시각화를 통해 복잡한 개념을 쉽게 이해하고 공유하는 것을 좋아합니다." />
                    </div>

                    <div className="form-group large-gap">
                        <label>기술 스택</label>
                        <div className="tech-stack">
                            {["Python", "JavaScript", "React", "Node.js", "알고리즘"].map((tech) => (
                                <span className="tag" key={tech}>
                                    {tech}
                                    <span className="remove-x">×</span>
                                </span>
                            ))}
                        </div>

                        <div className="tech-input-row">
                            <input type="text" placeholder="새 기술 추가" />
                            <button className="add-btn">+</button>
                        </div>
                    </div>


                    <div className="form-group">
                        <label>소셜 링크</label>
                        <div className="social-links">
                            <input type="text" defaultValue="https://github.com" />
                            <input type="text" defaultValue="https://twitter.com" />

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
