import React, { useState } from 'react';
import './FilePickerModal.css';

export default function FilePickerModal({ files = [], loading = false, error = '', onRefresh, onSelect, onClose }) {
    const [isNewFile, setIsNewFile] = useState(false);
    const [title, setTitle] = useState('');
    const [language, setLanguage] = useState('python');

    // 언어 → 확장자 매핑
    const extensions = {
        python: 'py',
        java: 'java',
        c: 'c',
        'c++': 'cpp',
        javascript: 'js',
    };

    const ensureExtension = (baseName, lang) => {
        const ext = extensions[lang] || '';
        const dotExt = `.${ext}`;
        // 사용자가 이미 같은 확장자를 쓴 경우 중복 방지
        if (baseName.toLowerCase().endsWith(dotExt)) return baseName;
        // 사용자가 다른 확장자를 쓴 경우는 그대로 두고 뒤에 선택한 확장자를 붙임
        return `${baseName}${dotExt}`;
    };

    const handleClose = () => {
        setIsNewFile(false);
        setTitle('');
        setLanguage('python');
        onClose();
    };

    const handleCreate = () => {
        const raw = title.trim();
        if (!raw) return;
        const filename = ensureExtension(raw, language);
        onSelect({
            id: `new-${Date.now()}`,
            name: filename,
            language,
            content: '',
            __new: true,          // ← 이 플래그로 분기
        });
    };

    const handleRefreshClick = () => {
        if (onRefresh) onRefresh();
    };

    const visibleFiles = Array.isArray(files) ? files : [];

    return (
        <div className="fpm-backdrop" onClick={handleClose}>
            <div className="fpm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="fpm-header">
                    <h3>공유할 파일 선택</h3>
                    {onRefresh && (
                        <button
                            type="button"
                            className="fpm-refresh"
                            onClick={handleRefreshClick}
                            disabled={loading}
                        >
                            {loading ? '불러오는 중...' : '새로고침'}
                        </button>
                    )}
                </div>

                {error && <div className="fpm-error">{error}</div>}

                {!isNewFile ? (
                    <>
                        <ul className="fpm-list">
                            <li
                                className="fpm-item new-file"
                                onClick={() => {
                                    setIsNewFile(true);
                                    setTitle('');
                                    setLanguage('python');
                                }}
                                title="새 파일 작성하기"
                            >
                                <span className="fpm-name">＋ 새 파일 작성하기</span>
                                <span className="fpm-lang">제목 & 언어 선택</span>
                            </li>

                            {loading && (
                                <li className="fpm-item disabled">
                                    <span className="fpm-name">파일 목록을 불러오는 중입니다...</span>
                                    <span className="fpm-lang" />
                                </li>
                            )}

                            {!loading && !error && visibleFiles.length === 0 && (
                                <li className="fpm-item disabled">
                                    <span className="fpm-name">저장된 파일이 없습니다.</span>
                                    <span className="fpm-lang">IDE에서 파일을 저장하면 여기에서 선택할 수 있습니다.</span>
                                </li>
                            )}

                            {!loading && visibleFiles.map((f) => (
                                <li
                                    key={f.id}
                                    className="fpm-item"
                                    onClick={() => onSelect(f)}
                                >
                                    <span className="fpm-name">{f.name}</span>
                                    <span className="fpm-lang">{f.language}</span>
                                </li>
                            ))}
                        </ul>

                        <button className="fpm-close" onClick={handleClose}>닫기</button>
                    </>
                ) : (
                    <>
                        <div className="fpm-newfile">
                            <div className="fpm-row">
                                <input
                                    className="fpm-input"
                                    type="text"
                                    placeholder="파일 제목을 입력하세요 (예: BubbleSort)"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
                                    autoFocus
                                />
                                <select
                                    className="fpm-select"
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                >
                                    <option value="python">Python (.py)</option>
                                    <option value="java">Java (.java)</option>
                                    <option value="c">C (.c)</option>
                                    <option value="c++">C++ (.cpp)</option>
                                    <option value="javascript">JavaScript (.js)</option>
                                </select>
                            </div>

                            <div className="fpm-hint">
                                최종 파일명 미리보기:&nbsp;
                                <strong className="fpm-preview">
                                    {title ? ensureExtension(title, language) : '(제목을 입력하세요)'}
                                </strong>
                            </div>

                            <div className="fpm-actions">
                                <button
                                    className="fpm-secondary"
                                    onClick={() => {
                                        setIsNewFile(false);
                                        setTitle('');
                                        setLanguage('python');
                                    }}
                                >
                                    ← 목록으로
                                </button>
                                <button className="fpm-primary" onClick={handleCreate} disabled={!title.trim()}>
                                    생성
                                </button>
                            </div>
                        </div>

                        <button className="fpm-close" onClick={handleClose}>닫기</button>
                    </>
                )}
            </div>
        </div>
    );
}
