import React, {useEffect, useState} from 'react';
import Editor from '@monaco-editor/react';
import { FaPlay } from 'react-icons/fa';
import './CodeEditor.css';

const CodeEditor = ({ currentUser }) => {
    const [code, setCode] = useState(currentUser.code);

    // ✅ currentUser가 바뀔 때마다 코드 상태를 새로 설정
    useEffect(() => {
        setCode(currentUser.code);
    }, [currentUser]);

    const handleRun = () => {
        alert("코드 실행 기능은 아직 미구현입니다.");
    };

    const getIcon = (role) => {
        switch (role) {
            case 'host':
                return '👑';
            case 'editing':
                return '✍️';
            default:
                return '';
        }
    };

    return (
        <section className="code-editor">
            <div className="editor-header">
                <div className="current-user-badge">
                    {getIcon(currentUser.role)} {currentUser.name}
                </div>
                <button className="run-button" onClick={handleRun}>
                    <FaPlay /> 실행
                </button>
            </div>

            <Editor
                height="calc(100vh - 160px)" // 헤더와 버튼 고려
                defaultLanguage="python"
                theme="vs-dark"
                value={code}
                onChange={(newValue) => setCode(newValue)}
                options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    padding: { top: 10 },
                }}
            />
        </section>
    );
};

export default CodeEditor;
