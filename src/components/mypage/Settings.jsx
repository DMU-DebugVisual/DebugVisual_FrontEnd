import React from 'react';
import './Settings.css';
import { FaRegEye, FaLock, FaBell, FaMoon } from 'react-icons/fa';

const preferenceToggles = [
    { key: 'live-alert', label: '라이브 방송 알림', description: '팔로잉 중인 호스트가 방송을 시작하면 알려드릴게요.' },
    { key: 'comment-reply', label: '댓글 답글 알림', description: '내 게시물에 새로운 댓글이나 답글이 달리면 Push 알림을 보냅니다.' },
    { key: 'weekly-digest', label: '주간 다이제스트', description: '추천 프로젝트와 커뮤니티 소식을 주 1회 이메일로 받아보세요.' },
];

const Settings = ({ nickname }) => {
    return (
        <main className="mypage-content settings-page">
            <header className="mypage-page-header">
                <div>
                    <h1>설정</h1>
                    <p>프로필 정보와 계정 환경 설정을 관리하세요. 모든 변경 사항은 저장 버튼을 눌러야 적용됩니다.</p>
                </div>
                <div className="settings-header-actions">
                    <button type="button" className="ghost-button compact">
                        <FaRegEye aria-hidden="true" /> 공개 프로필 보기
                    </button>
                    <button type="button" className="primary-button">
                        변경사항 저장
                    </button>
                </div>
            </header>

            <section className="section-card settings-panel">
                <nav className="settings-tabs" role="tablist" aria-label="설정 영역 선택">
                    <button type="button" className="settings-tab is-active">
                        <FaRegEye aria-hidden="true" /> 프로필
                    </button>
                    <button type="button" className="settings-tab">
                        <FaLock aria-hidden="true" /> 계정 보안
                    </button>
                    <button type="button" className="settings-tab">
                        <FaMoon aria-hidden="true" /> 테마 & 화면
                    </button>
                    <button type="button" className="settings-tab">
                        <FaBell aria-hidden="true" /> 알림
                    </button>
                </nav>

                <div className="settings-content">
                    <aside className="settings-profile-card">
                        <div className="profile-avatar-large" aria-hidden="true">{nickname?.[0] || 'U'}</div>
                        <button type="button" className="secondary-button">이미지 업로드</button>
                        <button type="button" className="secondary-button ghost">현재 이미지 삭제</button>
                        <p className="upload-note">JPG, PNG, GIF 파일 (최대 2MB)</p>
                        <div className="settings-tip">
                            <strong>프로필 팁</strong>
                            <span>300×300 픽셀 이상의 정사각형 이미지를 사용하면 가장 깔끔하게 보여요.</span>
                        </div>
                    </aside>

                    <form className="settings-form" aria-label="프로필 정보 편집">
                        <div className="form-group half">
                            <label htmlFor="profile-name">이름</label>
                            <input id="profile-name" type="text" defaultValue={nickname} />
                        </div>
                        <div className="form-group half">
                            <label htmlFor="profile-username">사용자 이름</label>
                            <input id="profile-username" type="text" defaultValue="kimcoding" />
                            <p className="small-text">debugvisual.io/@kimcoding</p>
                        </div>

                        <div className="form-group">
                            <label htmlFor="profile-bio">자기소개</label>
                            <textarea
                                id="profile-bio"
                                rows={4}
                                defaultValue="알고리즘과 데이터 구조에 관심이 많은 개발자입니다. 코드 시각화를 통해 복잡한 개념을 쉽게 이해하고 공유하는 것을 좋아합니다."
                            />
                        </div>

                        <div className="form-group">
                            <label>기술 스택</label>
                            <div className="tech-stack">
                                {["Python", "JavaScript", "React", "Node.js", "알고리즘"].map((tech) => (
                                    <span className="tech-tag" key={tech}>
                                        {tech}
                                        <button type="button" className="remove-tag" aria-label={`${tech} 제거`}>
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                            <div className="tech-input-row">
                                <input type="text" placeholder="새 기술 추가" />
                                <button type="button" className="secondary-button">추가</button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>소셜 링크</label>
                            <div className="social-links">
                                <input type="url" defaultValue="https://github.com" aria-label="GitHub 링크" />
                                <input type="url" defaultValue="https://twitter.com" aria-label="Twitter 링크" />
                            </div>
                        </div>
                    </form>
                </div>
            </section>

            <section className="section-card settings-preferences">
                <h2>알림 & 구독</h2>
                <p>학습과 협업에 필요한 알림만 골라서 받아보세요.</p>
                <ul className="preferences-list">
                    {preferenceToggles.map(({ key, label, description }) => (
                        <li className="preference-item" key={key}>
                            <div>
                                <strong>{label}</strong>
                                <span>{description}</span>
                            </div>
                            <label className="switch">
                                <input type="checkbox" defaultChecked />
                                <span className="slider" />
                            </label>
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    );
};

export default Settings;
