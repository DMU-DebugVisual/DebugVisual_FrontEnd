import React, { useState, useEffect } from 'react';
import './IDE.css';

const IDE = () => {
    // 회원 상태 토글을 위한 상태
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // 기존 상태들
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

    // 로그인 상태 토글 함수
    const toggleLoginStatus = () => {
        setIsLoggedIn(!isLoggedIn);
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

    // API를 통한 코드 실행
    const handleRun = () => {
        setIsRunning(true);
        setIsOutputVisible(true);

        // 실제 API 호출 대신 임시 시뮬레이션
        setTimeout(() => {
            // 파이썬 코드 실행 시뮬레이션
            if (fileName.endsWith('.py')) {
                if (code.includes('print')) {
                    const match = code.match(/print\(['"](.*)['"]\)/);
                    if (match) {
                        setOutput(match[1]);
                    } else {
                        setOutput("Hello, World! (시뮬레이션된 출력)");
                    }
                } else {
                    setOutput("코드가 성공적으로 실행되었습니다. (시뮬레이션)");
                }
            } else {
                setOutput("코드가 성공적으로 실행되었습니다. (시뮬레이션)");
            }

            setIsRunning(false);
        }, 500);
    };

    // 파일 저장 함수
    const handleSave = () => {
        // 비회원은 로그인 유도
        if (!isLoggedIn) {
            alert("로그인 후 이용 가능한 기능입니다.");
            return;
        }

        // 로컬 상태 업데이트
        const existingFileIndex = savedFiles.findIndex((file) => file.name === fileName);

        if (existingFileIndex >= 0) {
            // 기존 파일 업데이트
            const updatedFiles = [...savedFiles];
            updatedFiles[existingFileIndex] = { name: fileName, code };
            setSavedFiles(updatedFiles);
        } else {
            // 새 파일 추가
            setSavedFiles([...savedFiles, { name: fileName, code }]);
        }

        setIsSaved(true);

        // 토스트 메시지
        toast("파일이 저장되었습니다.");
    };

    // 파일 목록 불러오기
    const fetchFileList = () => {
        // 비회원이면 API 호출 안함
        if (!isLoggedIn) return;

        // API 호출 시뮬레이션
        console.log("파일 목록을 가져오는 중...");
        // 실제 구현 시 여기에 API 호출 코드 추가
    };

    // 회원 상태가 변경될 때 파일 목록 갱신
    useEffect(() => {
        if (isLoggedIn) {
            fetchFileList();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isLoggedIn]);

    // 파일 선택 함수
    const handleFileSelect = (name) => {
        // 현재 파일에 변경사항이 있으면 저장
        if (!isSaved) {
            const shouldSave = window.confirm('변경 사항을 저장하시겠습니까?');
            if (shouldSave) {
                handleSave();
            }
        }

        // 로컬 상태에서 파일 찾기
        const selectedFile = savedFiles.find((file) => file.name === name);
        if (selectedFile) {
            setFileName(selectedFile.name);
            setCode(selectedFile.code);
            setActiveFile(selectedFile.name);
            setIsSaved(true);
        }
    };

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

    // 간단한 토스트 메시지 표시 함수
    const toast = (message) => {
        console.log("토스트 메시지:", message);
        // 실제 구현 시 여기에 토스트 알림 표시 코드 추가
    };

    return (
        <div className="ide-container">
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
                        <span className="header-title">IDE</span>
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
                                    onChange={toggleLoginStatus}
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
                    {/* 코드 에디터 - Monaco 에디터 대신 일시적으로 textarea 사용 */}
                    <div className="monaco-editor-wrapper">
            <textarea
                className="code-editor"
                value={code}
                onChange={(e) => handleEditorChange(e.target.value)}
                style={{
                    width: '100%',
                    height: '100%',
                    padding: '16px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    border: 'none',
                    outline: 'none',
                    resize: 'none'
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