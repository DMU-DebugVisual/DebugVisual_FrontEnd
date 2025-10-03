import React, { useState } from 'react';
import './FilePickerModal.css';

export default function FilePickerModal({ files, onSelect, onClose }) {
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

    const handleCreate = () => {
        const raw = title.trim();
        if (!raw) return;
        const filename = ensureExtension(raw, language);
        onSelect({
            id: `new-${Date.now()}`,
            name: filename,
            language,
            content: '',
        });
    };

    return (
        <div className="fpm-backdrop" onClick={onClose}>
            <div className="fpm-modal" onClick={(e) => e.stopPropagation()}>
                <h3>공유할 파일 선택</h3>

                {!isNewFile ? (
                    <>
                        <ul className="fpm-list">
                            <li
                                className="fpm-item new-file"
                                onClick={() => setIsNewFile(true)}
                                title="새 파일 작성하기"
                            >
                                <span className="fpm-name">＋ 새 파일 작성하기</span>
                                <span className="fpm-lang">제목 & 언어 선택</span>
                            </li>

                            {files.map((f) => (
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

                        <button className="fpm-close" onClick={onClose}>닫기</button>
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
                                <button className="fpm-secondary" onClick={() => setIsNewFile(false)}>
                                    ← 목록으로
                                </button>
                                <button className="fpm-primary" onClick={handleCreate} disabled={!title.trim()}>
                                    생성
                                </button>
                            </div>
                        </div>

                        <button className="fpm-close" onClick={onClose}>닫기</button>
                    </>
                )}
            </div>
        </div>
    );
}
