import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import './IDE.css';
//npm install @monaco-editor/react
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
    const [isVisualizationVisible, setIsVisualizationVisible] = useState(false);
    const [input, setInput] = useState("");
    const [savedFiles, setSavedFiles] = useState([
        { name: "untitled.py", code: '# 여기에 코드를 입력하세요' }
    ]);

    // 다크 모드 상태 - document.body의 클래스를 감지
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // body 태그에 dark-mode 클래스가 있는지 확인
        return document.body.classList.contains('dark-mode');
    });

    // body의 dark-mode 클래스 변화 감지
    useEffect(() => {
        // MutationObserver를 사용하여 body 클래스 변경 감지
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (
                    mutation.attributeName === 'class' &&
                    mutation.target === document.body
                ) {
                    const hasClass = document.body.classList.contains('dark-mode');
                    setIsDarkMode(hasClass);
                }
            });
        });

        // 관찰 시작
        observer.observe(document.body, { attributes: true });

        // 초기 상태 설정
        setIsDarkMode(document.body.classList.contains('dark-mode'));

        // 클린업 함수
        return () => {
            observer.disconnect();
        };
    }, []);

    // 언어 선택을 위한 상태 추가
    const [selectedLanguage, setSelectedLanguage] = useState('python');
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

    // 지원하는 언어 목록
    const supportedLanguages = [
        { id: 'python', name: 'Python', extension: '.py', template: '# 여기에 Python 코드를 입력하세요', color: '#3572A5' },
        { id: 'java', name: 'Java', extension: '.java', template: '// 여기에 Java 코드를 입력하세요\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}', color: '#B07219' },
        { id: 'cpp', name: 'C++', extension: '.cpp', template: '// 여기에 C++ 코드를 입력하세요\n#include <iostream>\n\nint main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}', color: '#f34b7d' },
        { id: 'c', name: 'C', extension: '.c', template: '// 여기에 C 코드를 입력하세요\n#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}', color: '#555555' },
        { id: 'javascript', name: 'JavaScript', extension: '.js', template: '// 여기에 JavaScript 코드를 입력하세요\nconsole.log("Hello World");', color: '#f1e05a' },
    ];

    // Monaco 에디터 참조 추가
    const editorRef = useRef(null);

    // 언어 메뉴 토글 함수
    const toggleLanguageMenu = () => {
        setIsLanguageMenuOpen(!isLanguageMenuOpen);
    };

    // 시각화 패널 토글
    const toggleVisualization = () => {
        setIsVisualizationVisible(!isVisualizationVisible);
    };

    // 현재 선택된 언어의 색상 클래스 가져오기
    const getCurrentLanguageColorClass = () => {
        const langId = selectedLanguage || 'python';
        return `lang-${langId}`;
    };

    // 언어 선택 함수
    const selectLanguage = (langId) => {
        const newLanguage = supportedLanguages.find(lang => lang.id === langId);

        if (newLanguage) {
            // 저장되지 않은 변경사항이 있는지 확인
            if (!isSaved) {
                const shouldChange = window.confirm('저장되지 않은 변경사항이 있습니다. 언어를 변경하시겠습니까?');
                if (!shouldChange) {
                    setIsLanguageMenuOpen(false);
                    return;
                }
            }

            // 새 언어에 맞게 파일명 변경
            const baseName = fileName.split('.')[0];
            const newFileName = `${baseName}${newLanguage.extension}`;

            setSelectedLanguage(langId);
            setFileName(newFileName);
            setCode(newLanguage.template);
            setIsSaved(false);
            setIsLanguageMenuOpen(false);
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

        // 현재 줄 하이라이트 색상 테마 설정
        monaco.editor.defineTheme('custom-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                // 라인 하이라이트 배경색 (연보라색)
                'editor.lineHighlightBackground': '#7e57c233',
                // 라인 하이라이트 테두리 색상 (약간 더 진한 연보라색)
                'editor.lineHighlightBorder': '#7e57c244'
            }
        });

        // 라이트 모드 테마 정의
        monaco.editor.defineTheme('custom-light', {
            base: 'vs',
            inherit: true,
            rules: [],
            colors: {
                'editor.lineHighlightBackground': '#6a47b811',
                'editor.lineHighlightBorder': '#6a47b822'
            }
        });

        // 현재 모드에 맞는 테마 적용
        updateEditorTheme(monaco);
    };

    // 다크모드 변경 시 에디터 테마 업데이트
    const updateEditorTheme = (monaco) => {
        if (!monaco && !editorRef.current) return;

        const m = monaco || window.monaco;
        if (m) {
            m.editor.setTheme(isDarkMode ? 'custom-dark' : 'custom-light');
        }
    };

    // 다크모드 변경 감지 시 에디터 테마 업데이트
    useEffect(() => {
        updateEditorTheme();
    }, [isDarkMode]);

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

        // 임시 로컬 파일 목록 사용
        const localFiles = [
            { name: "untitled.py", code: '# 여기에 코드를 입력하세요' },
            { name: "example.py", code: 'print("Hello, World!")' },
            { name: "test.js", code: 'console.log("Testing JavaScript");' }
        ];

        setSavedFiles(localFiles);
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
        // 현재 선택된 언어의 확장자와 템플릿 가져오기
        const currentLang = supportedLanguages.find(lang => lang.id === selectedLanguage) || supportedLanguages[0];

        const defaultName = `untitled${savedFiles.length + 1}${currentLang.extension}`;
        const newFileName = prompt('새 파일 이름을 입력하세요:', defaultName);

        if (!newFileName) return;

        // 중복 파일 이름 확인
        if (savedFiles.some(file => file.name === newFileName)) {
            alert('이미 존재하는 파일 이름입니다.');
            return;
        }

        // 새 파일 추가
        const newFile = { name: newFileName, code: currentLang.template };
        setSavedFiles([...savedFiles, newFile]);

        // 새 파일 선택
        setFileName(newFileName);
        setCode(currentLang.template);
        setActiveFile(newFileName);
        setIsSaved(true);

        // 확장자에 맞게 언어 업데이트
        const fileExtension = newFileName.split('.').pop().toLowerCase();
        const languageFromExtension = Object.entries(getLanguageMap()).find(([_, ext]) => ext === fileExtension)?.[0];
        if (languageFromExtension) {
            setSelectedLanguage(languageFromExtension);
        }
    };

    // 확장자와 언어 ID 매핑 함수
    const getLanguageMap = () => {
        const map = {};
        supportedLanguages.forEach(lang => {
            map[lang.id] = lang.extension.replace('.', '');
        });
        return map;
    };

    // API 엔드포인트 URL 설정 (스웨거 API로 변경)
    const API_URL = 'http://3.38.244.234:8080/api/code/run';

    // 스웨거 API에 맞게 언어 매핑 함수
    const mapLanguageToAPI = (langId) => {
        // 스웨거 API에서는 'python', 'java', 'c'만 지원
        switch (langId) {
            case 'cpp':
                return 'c'; // C++는 C로 처리
            case 'javascript':
                return 'javascript'; // 스웨거 문서에 없지만, 지원할 수도 있음
            default:
                return langId; // python, java, c는 그대로 사용
        }
    };

    const handleRun = async () => {
        setIsRunning(true);
        setIsOutputVisible(true);
        setOutput("실행 중...");

        try {
            // 현재 에디터의 값을 가져옴
            const currentCode = editorRef.current.getValue();

            // API 요청 본문 생성 (성공한 형식과 동일하게)
            const requestBody = {
                code: currentCode,
                input: input,
                lang: mapLanguageToAPI(selectedLanguage)
            };

            console.log('API 요청 데이터:', JSON.stringify(requestBody));

            // CORS 우회를 위한 프록시 서버 사용 (개발 환경에서)
            const apiUrl = process.env.NODE_ENV === 'development'
                ? '/api/code/run'  // 개발 환경에서는 프록시 사용
                : 'http://3.38.244.234:8080/api/code/run'; // 프로덕션 환경에서는 직접 호출

            // API 호출
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
            }

            // 응답이 텍스트 형식일 것으로 예상
            const result = await response.text();
            setOutput(result || "실행 결과가 없습니다.");

        } catch (error) {
            console.error('코드 실행 중 오류:', error);
            setOutput(`오류 발생: ${error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    // 파일 저장 함수
    const handleSave = () => {
        // 비회원은 로그인 유도
        if (!isLoggedIn) {
            alert("로그인 후 이용 가능한 기능입니다.");
            return;
        }

        try {
            // 현재 에디터의 값을 가져옴
            const currentCode = editorRef.current.getValue();

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

            setIsSaved(true);
            setCode(currentCode);
            toast("파일이 저장되었습니다.");
        } catch (error) {
            console.error('파일 저장 중 오류:', error);
            toast("저장 중 오류가 발생했습니다.");
        }
    };

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

            // 파일 확장자에 맞는 언어 설정
            const langId = getLanguageFromFileName(selectedFile.name);
            if (langId) {
                setSelectedLanguage(langId);
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
        <div className="ide-container">
            {/* 왼쪽 사이드바 - 회원/비회원 표시 */}
            <div className={`sidebar ${isLeftPanelCollapsed ? 'collapsed' : ''}`}>
                {isLoggedIn ? (
                    // 회원용 사이드바 - 파일 목록
                    <>
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
                    </>
                ) : (
                    // 비회원용 사이드바 - 로그인/회원가입 버튼 (수정된 부분)
                    <div className="auth-sidebar">
                        <div className="auth-header">
                            <div className="auth-title">
                                <span className="icon-small">🔐</span>
                                <span>계정 접속</span>
                            </div>
                        </div>
                        <div className="auth-content">
                            <div className="auth-message">
                                <p>아직 계정이 없으신가요?</p>
                            </div>
                            <div className="auth-buttons">
                                <button className="login-button auth-button">
                                    <span className="icon-small">🔑</span>
                                    로그인
                                </button>
                                <button className="signup-button auth-button">
                                    <span className="icon-small">✏️</span>
                                    회원가입
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 메인 콘텐츠 */}
            <div className={`main-content ${!isLoggedIn ? 'guest-mode' : ''}`}>
                {/* 상단 헤더 */}
                <div className="main-header">
                    <div className="header-left">
                        {/* 햄버거 메뉴 버튼 */}
                        <button
                            onClick={() => setIsLeftPanelCollapsed(!isLeftPanelCollapsed)}
                            className="sidebar-toggle-button"
                        >
                            <div className="hamburger-icon">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </button>

                        {/* 언어 선택 드롭다운 */}
                        <div className="language-selector">
                            <button
                                className={`language-button lang-${selectedLanguage}`}
                                onClick={toggleLanguageMenu}
                            >
                                {supportedLanguages.find(lang => lang.id === selectedLanguage)?.name || 'Python'}
                                <span className="dropdown-arrow">{isLanguageMenuOpen ? '▲' : '▼'}</span>
                            </button>

                            {isLanguageMenuOpen && (
                                <div className="language-dropdown">
                                    {supportedLanguages.map(lang => (
                                        <div
                                            key={lang.id}
                                            className={`language-item ${selectedLanguage === lang.id ? 'active' : ''} lang-border-${lang.id}`}
                                            onClick={() => selectLanguage(lang.id)}
                                        >
                                            {lang.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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

                {/* 코드 에디터와 출력 영역 레이아웃 변경 */}
                <div className="content-layout">
                    {/* 좌측 에디터 영역 */}
                    <div className="editor-section">
                        <div className="monaco-editor-wrapper">
                            <Editor
                                height="100%"
                                defaultLanguage={selectedLanguage}
                                defaultValue={code}
                                language={selectedLanguage}
                                value={code}
                                onChange={handleEditorChange}
                                onMount={handleEditorDidMount}
                                theme={isDarkMode ? "vs-dark" : "vs-light"} // 다크모드에 따라 테마 변경
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
                                    renderLineHighlight: "all",
                                    renderLineHighlightOnlyWhenFocus: false,
                                }}
                            />
                        </div>
                    </div>

                    {/* 우측 입력/출력/버튼 영역 */}
                    <div className="right-panel">
                        {/* 실행 및 시각화 버튼 */}
                        <div className="action-buttons">
                            <button
                                className="run-code-button"
                                onClick={handleRun}
                                disabled={isRunning}
                            >
                                <span className="button-icon">▶</span>
                                실행 코드
                            </button>
                            <button
                                className={`visualization-button ${isVisualizationVisible ? 'active' : ''}`}
                                onClick={toggleVisualization}
                            >
                                <span className="button-icon">📊</span>
                                코드 시각화
                            </button>
                        </div>

                        {/* 입력 영역 */}
                        <div className="input-section">
                            <div className="section-header">프로그램 입력</div>
                            <textarea
                                className="program-input"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="프로그램 실행 시 필요한 입력값을 여기에 작성하세요"
                            ></textarea>
                        </div>

                        {/* 출력 영역 */}
                        <div className="output-section">
                            <div className="section-header">프로그램 출력</div>
                            <pre className="program-output">
                                {isRunning ? "실행 중..." : (output || "코드를 실행하면 결과가 여기에 표시됩니다.")}
                            </pre>
                        </div>
                    </div>

                    {/* 시각화 패널 (코드 시각화 버튼 클릭 시 표시) */}
                    {isVisualizationVisible && (
                        <div className="visualization-sidebar">
                            <div className="visualization-header">
                                <h3>코드 시각화</h3>
                                <button
                                    className="close-button"
                                    onClick={toggleVisualization}
                                    title="시각화 패널 닫기"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="visualization-content">
                                <div className="visualization-placeholder">
                                    <p>코드 실행 결과의 시각화가 이곳에 표시됩니다.</p>
                                    <p>현재 개발 중인 기능입니다.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 토스트 메시지 컨테이너 */}
            <div id="toast-container"></div>
        </div>
    );
};

export default IDE;