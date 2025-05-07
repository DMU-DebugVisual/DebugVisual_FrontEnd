import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import './IDE.css';

const IDE = () => {
    // 기존 상태 유지
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [code, setCode] = useState('# 여기에 코드를 입력하세요');
    const [fileName, setFileName] = useState("untitled.py");
    const [isSaved, setIsSaved] = useState(true);
    const [activeFile, setActiveFile] = useState("untitled.py");
    const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState("");
    const [isOutputVisible, setIsOutputVisible] = useState(false);
    const [savedFiles, setSavedFiles] = useState([
        { name: "untitled.py", code: '# 여기에 코드를 입력하세요' }
    ]);

    // 다크모드/라이트모드 토글을 위한 상태 추가
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Monaco 에디터 참조 추가
    const editorRef = useRef(null);

    // 테마 전환 함수
    const toggleTheme = () => {
        setIsDarkMode(!isDarkMode);
        // body 요소에 다크모드 클래스 추가/제거
        if (!isDarkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    };

    // 에디터 마운트 핸들러
    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        // 단축키 등록
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function() {
            handleSave();
        });

        editor.addCommand(monaco.KeyCode.F5, function() {
            handleRun();
        });
    };

    // 파일 확장자에 따른 언어 결정
    const getLanguageFromFileName = (filename) => {
        const extension = filename.split('.').pop().toLowerCase();

        const languageMap = {
            'py': 'python',
            'js': 'javascript',
            'html': 'html',
            'css': 'css',
            'json': 'json',
            'java': 'java',
            'c': 'c',
            'cpp': 'cpp',
            'cs': 'csharp',
            'php': 'php',
            'rb': 'ruby',
            'ts': 'typescript'
        };

        return languageMap[extension] || 'plaintext';
    };

    // 코드 변경 감지 함수
    const handleEditorChange = (value) => {
        setCode(value);
        setIsSaved(false);
    };

    // 파일 목록 불러오기
    const fetchFileList = async () => {
        // 비회원이면 API 호출 안함
        if (!isLoggedIn) return;

        try {
            const response = await fetch('/api/files');

            if (!response.ok) {
                throw new Error('파일 목록 불러오기 실패');
            }

            const files = await response.json();
            setSavedFiles(files);
        } catch (error) {
            console.error('파일 목록 불러오기 오류:', error);
            // 오류 시 기본 파일 목록 유지
        }
    };

    // 회원 상태가 변경될 때 파일 목록 갱신
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (isLoggedIn) {
            fetchFileList();
        }
    }, [isLoggedIn]);

    // 새 파일 생성
    const handleNewFile = () => {
        const defaultName = `untitled${savedFiles.length + 1}.py`;
        const newFileName = prompt('새 파일 이름을 입력하세요:', defaultName);

        if (!newFileName) return;

        // 중복 파일 이름 확인
        if (savedFiles.some(file => file.name === newFileName)) {
            alert('이미 존재하는 파일 이름입니다.');
            return;
        }

        // 새 파일 추가
        const newFile = { name: newFileName, code: '# 새 파일' };
        setSavedFiles([...savedFiles, newFile]);

        // 새 파일 선택
        setFileName(newFileName);
        setCode('# 새 파일');
        setActiveFile(newFileName);
        setIsSaved(true);
    };

    // 출력 패널 토글
    const toggleOutputPanel = () => {
        setIsOutputVisible(!isOutputVisible);
    };

    const handleRun = async () => {
        setIsRunning(true);
        setIsOutputVisible(true);

        try {
            // 현재 에디터의 값을 가져옴
            const currentCode = editorRef.current.getValue();

            // API 호출
            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: currentCode,
                    language: getLanguageFromFileName(fileName),
                    fileName: fileName
                }),
            });

            if (!response.ok) {
                throw new Error('API 호출 실패');
            }

            const result = await response.json();
            setOutput(result.output || "실행 결과가 없습니다.");
        } catch (error) {
            console.error('코드 실행 중 오류:', error);

            // API 오류 시 폴백으로 간단한 시뮬레이션
            const currentCode = editorRef.current.getValue();
            if (fileName.endsWith('.py')) {
                if (currentCode.includes('print')) {
                    const match = currentCode.match(/print\(['"](.*)['"]\)/);
                    if (match) {
                        setOutput(match[1]);
                    } else {
                        setOutput("Hello, World! (시뮬레이션된 출력)");
                    }
                } else {
                    setOutput("코드가 성공적으로 실행되었습니다. (API 연결 실패로 실제 실행은 되지 않았습니다)");
                }
            } else {
                setOutput(`오류: ${error.message} (API 연결에 실패했습니다)`);
            }
        } finally {
            setIsRunning(false);
        }
    };

    // 파일 저장 함수
    const handleSave = async () => {
        // 비회원은 로그인 유도
        if (!isLoggedIn) {
            alert("로그인 후 이용 가능한 기능입니다.");
            return;
        }

        try {
            // 현재 에디터의 값을 가져옴
            const currentCode = editorRef.current.getValue();

            // API 호출
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: currentCode,
                    fileName: fileName
                }),
            });

            if (!response.ok) {
                throw new Error('파일 저장 실패');
            }

            // 저장 성공
            setIsSaved(true);
            setCode(currentCode);

            // 로컬 상태 업데이트
            const existingFileIndex = savedFiles.findIndex((file) => file.name === fileName);

            if (existingFileIndex >= 0) {
                // 기존 파일 업데이트
                const updatedFiles = [...savedFiles];
                updatedFiles[existingFileIndex] = { name: fileName, code: currentCode };
                setSavedFiles(updatedFiles);
            } else {
                // 새 파일 추가
                setSavedFiles([...savedFiles, { name: fileName, code: currentCode }]);
            }

            toast("파일이 저장되었습니다.");
        } catch (error) {
            console.error('파일 저장 중 오류:', error);

            // API 오류 시 로컬만 업데이트
            const currentCode = editorRef.current.getValue();
            const existingFileIndex = savedFiles.findIndex((file) => file.name === fileName);

            if (existingFileIndex >= 0) {
                // 기존 파일 업데이트
                const updatedFiles = [...savedFiles];
                updatedFiles[existingFileIndex] = { name: fileName, code: currentCode };
                setSavedFiles(updatedFiles);
            } else {
                // 새 파일 추가
                setSavedFiles([...savedFiles, { name: fileName, code: currentCode }]);
            }

            setIsSaved(true);
            setCode(currentCode);
            toast("API 연결 실패. 임시로 저장되었습니다.");
        }
    };

    // 파일 선택 함수
    const handleFileSelect = async (name) => {
        // 현재 파일에 변경사항이 있으면 저장
        if (!isSaved) {
            const shouldSave = window.confirm('변경 사항을 저장하시겠습니까?');
            if (shouldSave) {
                await handleSave();
            }
        }

        try {
            // API에서 파일 내용 불러오기
            const response = await fetch(`/api/files/${name}`);

            if (!response.ok) {
                throw new Error('파일 불러오기 실패');
            }

            const fileData = await response.json();
            setFileName(fileData.name);
            setCode(fileData.code);
            setActiveFile(fileData.name);
            setIsSaved(true);
        } catch (error) {
            console.error('파일 불러오기 오류:', error);

            // API 호출 실패 시 로컬 상태에서 불러오기 시도
            const selectedFile = savedFiles.find((file) => file.name === name);
            if (selectedFile) {
                setFileName(selectedFile.name);
                setCode(selectedFile.code);
                setActiveFile(selectedFile.name);
                setIsSaved(true);
            }
        }
    };

    // 토스트 메시지 표시 함수
    const toast = (message) => {
        // 기존 토스트 메시지가 있으면 모두 제거
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            document.getElementById('toast-container')?.removeChild(toast);
        });

        // 새 토스트 메시지 생성
        const toastElement = document.createElement('div');
        toastElement.className = 'toast toast-success';
        toastElement.textContent = message;

        // 토스트 컨테이너에 추가
        const container = document.getElementById('toast-container');
        if (!container) {
            const newContainer = document.createElement('div');
            newContainer.id = 'toast-container';
            document.body.appendChild(newContainer);
            newContainer.appendChild(toastElement);
        } else {
            container.appendChild(toastElement);
        }

        // 토스트 표시 애니메이션
        setTimeout(() => {
            toastElement.classList.add('show');
        }, 10);

        // 자동 제거
        setTimeout(() => {
            toastElement.classList.remove('show');
            setTimeout(() => {
                const container = document.getElementById('toast-container');
                if (container && container.contains(toastElement)) {
                    container.removeChild(toastElement);
                }
            }, 300);
        }, 3000);
    };

    return (
        <div className={`ide-container ${!isDarkMode ? 'light-mode' : 'dark-mode'}`}>
            {/* 왼쪽 사이드바 - 회원만 표시 */}
            {isLoggedIn && (
                <div className={`sidebar ${isLeftPanelCollapsed ? 'collapsed' : ''}`}>
                    <div className="sidebar-header">
                        <div className="file-list-header">
                            <span className="icon-small">📁</span>
                            <span>파일 목록</span>
                            <button className="icon-button" onClick={handleNewFile}>
                                <span className="icon-small">+</span>
                            </button>
                        </div>
                    </div>

                    {/* 파일 목록 */}
                    <div className="file-list">
                        {savedFiles.map((file) => (
                            <div
                                key={file.name}
                                className={`file-item ${activeFile === file.name ? 'active' : ''}`}
                                onClick={() => handleFileSelect(file.name)}
                            >
                                <span className="icon-small">📄</span>
                                <span>{file.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 사이드바 토글 버튼 - 회원만 표시 */}
            {isLoggedIn && (
                <button
                    className={`sidebar-toggle ${isLeftPanelCollapsed ? 'collapsed' : ''}`}
                    onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                >
                    {isLeftPanelCollapsed ? '›' : '‹'}
                </button>
            )}

            {/* 메인 콘텐츠 */}
            <div className={`main-content ${!isLoggedIn ? 'guest-mode' : ''}`}>
                {/* 상단 헤더 */}
                <div className="main-header">
                    <div className="header-left">
                        {/* IDE 버튼으로 만들고 클릭 시 테마 전환 */}
                        <button
                            onClick={toggleTheme}
                            className="theme-toggle-button"
                        >
                            <span className="header-title">IDE</span>
                        </button>
                        <span className="header-badge">{getLanguageFromFileName(fileName).toUpperCase()}</span>
                    </div>

                    <div className="header-right">
                        {/* 로그인 토글 헤더에 통합 */}
                        <div className="login-toggle">
                            <span className={`login-status ${isLoggedIn ? 'logged-in' : 'guest'}`}>
                                {isLoggedIn ? '회원 모드' : '비회원 모드'}
                            </span>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={isLoggedIn}
                                    onChange={() => setIsLoggedIn(!isLoggedIn)}
                                />
                                <span className="slider round"></span>
                            </label>
                        </div>

                        {isLoggedIn ? (
                            // 회원용 헤더 컨트롤
                            <>
                                <input
                                    type="text"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    className="filename-input"
                                    placeholder="파일명.확장자"
                                />
                                <button
                                    className="save-button"
                                    onClick={handleSave}
                                >
                                    저장
                                </button>
                                <span className={`save-indicator ${isSaved ? 'saved' : ''}`}>
                                    {isSaved && '✓'}
                                </span>
                            </>
                        ) : (
                            // 비회원용 헤더 컨트롤
                            <div className="guest-controls">
                                <span className="guest-mode-text">제한된 기능으로 실행 중입니다</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 코드 에디터와 출력 영역 */}
                <div className={`editor-container ${isOutputVisible ? 'output-visible' : ''}`}>
                    {/* Monaco 에디터 적용 */}
                    <div className="monaco-editor-wrapper">
                        <Editor
                            height="100%"
                            defaultLanguage={getLanguageFromFileName(fileName)}
                            defaultValue={code}
                            language={getLanguageFromFileName(fileName)}
                            value={code}
                            onChange={handleEditorChange}
                            onMount={handleEditorDidMount}
                            theme={isDarkMode ? "vs-dark" : "vs-light"}
                            options={{
                                fontSize: 14,
                                minimap: { enabled: true },
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                                tabSize: 4,
                                insertSpaces: true,
                                cursorBlinking: "smooth",
                                folding: true,
                                lineNumbersMinChars: 3,
                                wordWrap: "on",
                                renderWhitespace: "selection",
                                // 추가 옵션: https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.IStandaloneEditorConstructionOptions.html
                            }}
                        />

                        {/* 실행 버튼 */}
                        <button
                            className="run-button"
                            onClick={handleRun}
                            disabled={isRunning}
                            title="코드 실행 (F5)"
                        >
                            {isRunning ? '⌛' : '▶'}
                        </button>
                    </div>

                    {/* 출력 패널 */}
                    {isOutputVisible ? (
                        <div className="visualization-panel">
                            {/* 토글 버튼 - 패널이 열렸을 때 패널 왼쪽에 표시 */}
                            <button
                                className="visualization-toggle-open"
                                onClick={toggleOutputPanel}
                                title="출력 패널 닫기"
                            >
                                ›
                            </button>

                            {/* 탭 헤더 */}
                            <div className="tab-header">
                                <div className="tab-buttons">
                                    <button className="tab-button active">
                                        실행 결과
                                    </button>
                                </div>
                                <button
                                    className="close-button"
                                    onClick={() => setIsOutputVisible(false)}
                                    title="패널 닫기"
                                >
                                    ✕
                                </button>
                            </div>

                            {/* 탭 콘텐츠 */}
                            <div className="tab-content">
                                {/* 실행 결과 탭 */}
                                <div className="output-content">
                                    <h3>실행 결과</h3>
                                    <pre className="output-block">
                                        {isRunning ? "실행 중..." : (output || "코드를 실행하면 결과가 여기에 표시됩니다.")}
                                    </pre>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* 패널이 닫혔을 때 기본 토글 버튼 표시 */
                        <button
                            className="visualization-toggle-closed"
                            onClick={toggleOutputPanel}
                            title="출력 패널 열기"
                        >
                            ‹
                        </button>
                    )}
                </div>
            </div>

            {/* 토스트 메시지 컨테이너 */}
            <div id="toast-container"></div>
        </div>
    );
};

export default IDE;