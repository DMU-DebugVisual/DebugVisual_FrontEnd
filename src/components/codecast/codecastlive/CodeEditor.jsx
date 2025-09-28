import React, { useEffect, useMemo, useState } from 'react';
import Editor from '@monaco-editor/react';
import { FaPlay } from 'react-icons/fa';
import './CodeEditor.css';

/**
 * Props
 * - file?: { name, language, content }
 * - readOnly?: boolean
 * - onChange?: (next: string) => void
 * - currentUser?: { name: string, role: 'host'|'edit'|'view', code?: string } // ✅ 뱃지 표시용
 */
export default function CodeEditor({ file, readOnly = false, onChange, currentUser, isDark }) {
    const initialValue = useMemo(() => file?.content ?? '', [file?.content]);
    const [code, setCode] = useState(initialValue);

    useEffect(() => setCode(initialValue), [initialValue]);

    const language = useMemo(() => file?.language || 'python', [file?.language]);

    const handleRun = () => alert('코드 실행 기능은 아직 미구현입니다.');

    const roleIcon = (role) => {
        if (role === 'host') return '👑';
        if (role === 'edit') return '✏️';
        if (role === 'view') return '👁️';
        return '';
    };

    // const theme = document.body.classList.contains('dark-mode') ? 'vs-light' : 'vs-dark';
    const theme = isDark ? 'vs-dark' : 'vs-light';   // ✅ props 우선
    return (
        <section className="code-editor">
            <div className="editor-header">
                {/* ✅ 사용자 뱃지 복원, 권한 뱃지 제거 */}
                {currentUser?.name && (
                    <div className="current-user-badge">
                        {roleIcon(currentUser.role)} {currentUser.name}
                    </div>
                )}

                <button className="run-button" onClick={handleRun}>
                    <FaPlay /> 실행
                </button>
            </div>

            {/* 필요 시 height=100%로 바꿔도 됩니다 (부모 컨테이너가 flex:1이면) */}
            <Editor
                height="90%"
                language={language}
                theme={theme}
                value={code}
                onChange={(v) => {
                    const next = v ?? '';
                    setCode(next);
                    onChange && onChange(next);
                }}
                options={{
                    readOnly,
                    fontSize: 14,
                    minimap: { enabled: false },
                    padding: { top: 10 },
                    scrollBeyondLastLine: false,
                    smoothScrolling: true,
                }}
            />
        </section>
    );
}
