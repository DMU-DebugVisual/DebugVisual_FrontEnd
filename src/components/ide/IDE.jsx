import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import CodeVisualizer from './VisualizationModal';
import VisualizationModal from './VisualizationModal'; // 새로 추가
import './IDE.css';
//npm install @monaco-editor/react
import ideConfig from '../../ideconfig';


// ResizeObserver 패치 함수 정의
const applyResizeObserverFix = () => {
    // 이미 패치된 경우 중복 실행 방지
    if (window._isResizeObserverPatched) return;

    // 기존 ResizeObserver 저장
    const originalResizeObserver = window.ResizeObserver;

    // 스로틀링과 오류 처리를 적용한 사용자 정의 ResizeObserver 클래스
    class PatchedResizeObserver extends originalResizeObserver {
        constructor(callback) {
            // 스로틀링 적용된 콜백 함수
            const throttledCallback = (entries, observer) => {
                // ResizeObserver 루프 제한 오류 발생 가능성 감소
                if (this._rafId) {
                    cancelAnimationFrame(this._rafId);
                }

                this._rafId = requestAnimationFrame(() => {
                    this._rafId = null;
                    try {
                        callback(entries, observer);
                    } catch (e) {
                        console.warn('ResizeObserver 콜백 오류:', e);
                    }
                });
            };

            super(throttledCallback);
            this._rafId = null;
        }

        disconnect() {
            if (this._rafId) {
                cancelAnimationFrame(this._rafId);
                this._rafId = null;
            }
            super.disconnect();
        }
    }

    // 오류 이벤트 방지 핸들러
    window.addEventListener('error', (e) => {
        if (e && e.message && (
            e.message.includes('ResizeObserver loop') ||
            e.message.includes('ResizeObserver undelivered notifications')
        )) {
            e.stopImmediatePropagation();
            e.preventDefault();
            return false;
        }
    }, true);

    // 콘솔 오류 무시 설정
    const originalConsoleError = console.error;
    console.error = (...args) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver')) {
            return; // ResizeObserver 관련 콘솔 오류 숨김
        }
        originalConsoleError.apply(console, args);
    };

    // 전역 ResizeObserver 교체
    try {
        window.ResizeObserver = PatchedResizeObserver;
        window._isResizeObserverPatched = true;
    } catch (e) {
        console.warn('ResizeObserver를 패치할 수 없습니다:', e);
    }
};

const IDE = () => {
    // 컴포넌트 마운트 시 ResizeObserver 패치 적용

    const [isVisualizationModalOpen, setIsVisualizationModalOpen] = useState(false);
    const handleVisualizationClick = () => {
        if (!code.trim()) {
            alert('시각화할 코드를 먼저 작성해주세요.');
            return;
        }
        setIsVisualizationModalOpen(true);
    };
    const handleVisualizationClose = () => {
        setIsVisualizationModalOpen(false);
    };


    useEffect(() => {
        applyResizeObserverFix();

        // Monaco Editor 레이아웃 업데이트 헬퍼 함수
        const updateAllEditorLayouts = () => {
            if (editorRef.current) {
                // RAF로 싱크 맞추기
                window.requestAnimationFrame(() => {
                    try {
                        editorRef.current.layout();
                    } catch (e) {
                        console.warn('에디터 레이아웃 업데이트 중 오류:', e);
                    }
                });
            }
        };

        // 윈도우 크기 변경 이벤트 리스너 추가
        window.addEventListener('resize', updateAllEditorLayouts);

        // DOM이 완전히 로드된 후 레이아웃 강제 조정
        const initialLayoutTimeout = setTimeout(() => {
            updateAllEditorLayouts();
        }, 500);

        return () => {
            window.removeEventListener('resize', updateAllEditorLayouts);
            clearTimeout(initialLayoutTimeout);
        };
    }, []);

    // 기본 상태 및 라우팅
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const params = useParams();

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

    // 컴포넌트 마운트 시 로그인 상태 확인
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username');

        if (token && storedUsername) {
            setIsLoggedIn(true);
            setUsername(storedUsername);
            fetchFileList(); // 로그인 되어 있으면 파일 목록 불러오기
        } else {
            setIsLoggedIn(false);
            setUsername('');
        }
    }, []);

    // URL 업데이트 함수
    const updateURL = (param1, param2 = null) => {
        let newPath;
        if (param2) {
            // 회원 모드: /ide/언어/파일명
            newPath = `/ide/${param1}/${param2}`;
        } else {
            // 비회원 모드: /ide/언어
            newPath = `/ide/${param1}`;
        }

        // 현재 경로와 다를 때만 업데이트
        if (location.pathname !== newPath) {
            navigate(newPath, { replace: true });
        }
    };

    // 확장자에서 언어 추출 함수
    const getLanguageFromExtension = (extension) => {
        const extensionMap = {
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'js': 'javascript'
        };
        return extensionMap[extension] || 'python';
    };

    // URL에서 언어 설정
    const handleLanguageFromURL = (langParam) => {
        const language = supportedLanguages.find(lang =>
            lang.id === langParam ||
            lang.name.toLowerCase() === langParam.toLowerCase()
        );

        if (language && language.id !== selectedLanguage) {
            setSelectedLanguage(language.id);

            if (!isLoggedIn) {
                // 비회원일 때는 템플릿 코드로 변경
                setCode(language.template);
                const baseName = fileName.split('.')[0];
                const newFileName = `${baseName}${language.extension}`;
                setFileName(newFileName);
            }
        }
    };

    // URL에서 언어와 파일 설정
    const handleLanguageAndFileFromURL = (langParam, fileParam) => {
        // 언어 설정
        const language = supportedLanguages.find(lang =>
            lang.id === langParam ||
            lang.name.toLowerCase() === langParam.toLowerCase()
        );

        if (language) {
            setSelectedLanguage(language.id);
        }

        // 파일 설정
        if (isLoggedIn) {
            const file = savedFiles.find(f => f.name === fileParam);
            if (file) {
                setFileName(file.name);
                setCode(file.code);
                setActiveFile(file.name);
                setIsSaved(true);
            } else {
                // 파일이 없으면 새 파일 생성
                const newFile = {
                    name: fileParam,
                    code: language ? language.template : '# 여기에 코드를 입력하세요'
                };
                setSavedFiles(prev => [...prev, newFile]);
                setFileName(fileParam);
                setCode(newFile.code);
                setActiveFile(fileParam);
                setIsSaved(true);
            }
        }
    };

    // URL에서 파라미터 처리
    useEffect(() => {
        const { param, language, filename } = params;

        // /ide/:language/:filename 형태 (회원 모드)
        if (language && filename) {
            if (isLoggedIn) {
                handleLanguageAndFileFromURL(language, filename);
            } else {
                // 비회원이 회원 URL에 접속한 경우 언어만 적용
                handleLanguageFromURL(language);
            }
        }
        // /ide/:param 형태 (비회원 모드 또는 단일 파라미터)
        else if (param) {
            if (param.includes('.')) {
                // 파일명인 경우 (확장자 포함)
                if (isLoggedIn) {
                    const fileExtension = param.split('.').pop().toLowerCase();
                    const languageFromFile = getLanguageFromExtension(fileExtension);
                    handleLanguageAndFileFromURL(languageFromFile, param);
                } else {
                    // 비회원이 파일 URL에 접속한 경우 언어만 적용
                    const fileExtension = param.split('.').pop().toLowerCase();
                    const languageFromFile = getLanguageFromExtension(fileExtension);
                    if (languageFromFile) {
                        handleLanguageFromURL(languageFromFile);
                    }
                }
            } else {
                // 언어명인 경우
                handleLanguageFromURL(param);
            }
        }
        // /ide 기본 경로
        else {
            // 기본값으로 URL 업데이트
            if (isLoggedIn && activeFile) {
                updateURL(selectedLanguage, activeFile);
            } else {
                updateURL(selectedLanguage);
            }
        }
    }, [params, isLoggedIn, savedFiles]);

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

    // 언어 변경 시 URL 업데이트
    useEffect(() => {
        if (isLoggedIn && activeFile) {
            // 회원: 언어/파일명 형태
            updateURL(selectedLanguage, activeFile);
        } else if (!isLoggedIn) {
            // 비회원: 언어만
            updateURL(selectedLanguage);
        }
    }, [selectedLanguage, activeFile, isLoggedIn]);

    // 로그인 상태 변경 시 URL 업데이트
    useEffect(() => {
        if (isLoggedIn && activeFile) {
            // 로그인 시: 언어/파일명 형태로 변경
            updateURL(selectedLanguage, activeFile);
        } else if (!isLoggedIn) {
            // 로그아웃 시: 언어만 남김
            updateURL(selectedLanguage);
        }
    }, [isLoggedIn]);

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

            // 회원의 경우 새 파일명으로 activeFile도 업데이트
            if (isLoggedIn) {
                setActiveFile(newFileName);
                // 새 파일을 savedFiles에 추가
                const newFile = { name: newFileName, code: newLanguage.template };
                setSavedFiles(prev => {
                    const exists = prev.find(f => f.name === newFileName);
                    if (!exists) {
                        return [...prev, newFile];
                    }
                    return prev;
                });
            }
        }
    };

    // 에디터 마운트 핸들러 - 성능 개선을 위한 수정
    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;

        // 성능 최적화 옵션
        const editorOptions = {
            // 가볍게 설정
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            renderLineHighlight: 'line',
            renderWhitespace: 'none',
            automaticLayout: false,
            wordWrap: "bounded",
            wordWrapColumn: 120,
            scrollbar: {
                vertical: 'auto',
                horizontal: 'auto',
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10
            }
        };

        // 성능 관련 옵션 적용
        editor.updateOptions(editorOptions);

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

        // 에디터 초기 레이아웃 강제 설정
        setTimeout(() => {
            try {
                editor.layout();
            } catch (e) {
                console.warn('에디터 초기 레이아웃 설정 중 오류:', e);
            }
        }, 100);
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

    // 레이아웃 변경 시 에디터 크기 동기화
    useEffect(() => {
        // 사이드바 토글, 시각화 패널 토글 시 에디터 크기 업데이트
        const updateTimer = setTimeout(() => {
            if (editorRef.current) {
                try {
                    editorRef.current.layout();
                } catch (e) {
                    console.warn('레이아웃 변경 후 에디터 크기 조정 중 오류:', e);
                }
            }
        }, 300); // 애니메이션 완료 후 업데이트

        return () => clearTimeout(updateTimer);
    }, [isLeftPanelCollapsed, isVisualizationVisible]);

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
        const languageFromExtension = getLanguageFromExtension(fileExtension);
        if (languageFromExtension !== selectedLanguage) {
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

    const apiUrl = `${ideConfig.API_BASE_URL}/code/run`;

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

            // API 요청 본문 생성
            const requestBody = {
                code: currentCode,
                input: input,
                lang: mapLanguageToAPI(selectedLanguage)
            };

            console.log('API 요청 데이터:', JSON.stringify(requestBody));


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

            // 🔥 수정된 부분: JSON 응답 파싱 후 stdout 추출
            const result = await response.json(); // text() 대신 json() 사용

            console.log('API 응답 데이터:', result); // 디버깅용 로그

            // stdout 값만 추출해서 출력
            if (result && typeof result === 'object') {
                // stdout, Stdout, STDOUT 등 다양한 케이스 대응
                const stdout = result.stdout || result.Stdout || result.STDOUT ||
                    result.output || result.Output || result.OUTPUT;

                if (stdout !== undefined) {
                    setOutput(stdout || "실행 완료 (출력 없음)");
                } else {
                    // stdout이 없는 경우 전체 응답을 보여주되, 에러 정보 우선
                    const errorMsg = result.stderr || result.error || result.message;
                    if (errorMsg) {
                        setOutput(`오류: ${errorMsg}`);
                    } else {
                        setOutput("실행 완료되었지만 출력이 없습니다.");
                    }
                }
            } else {
                // 응답이 객체가 아닌 경우 (문자열 등)
                setOutput(result || "실행 결과가 없습니다.");
            }

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
            if (langId && langId !== selectedLanguage) {
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
                    // 비회원용 사이드바 - 로그인/회원가입 버튼
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
                                <Link to="/login" className="login-button auth-button">
                                    <span className="icon-small">🔑</span>
                                    로그인
                                </Link>
                                <Link to="/signup" className="signup-button auth-button">
                                    <span className="icon-small">✏️</span>
                                    회원가입
                                </Link>
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
                        {/* 로그인 상태 표시 (로그아웃 버튼 없음) */}
                        <div className="login-status-container">
                            <span className={`login-status ${isLoggedIn ? 'logged-in' : 'guest'}`}>
                                {isLoggedIn ? `${username} 님` : '비회원 모드'}
                            </span>
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
                                    minimap: { enabled: false }, // 성능 향상을 위해 미니맵 비활성화
                                    scrollBeyondLastLine: false,
                                    automaticLayout: false, // 자동 레이아웃 비활성화(성능 향상)
                                    tabSize: 4,
                                    insertSpaces: true,
                                    cursorBlinking: "solid", // 깜빡임을 줄여 성능 향상
                                    folding: true,
                                    lineNumbersMinChars: 3,
                                    wordWrap: "on",
                                    renderWhitespace: "none", // 성능 향상을 위해 공백 렌더링 비활성화
                                    renderLineHighlight: "line",
                                    renderLineHighlightOnlyWhenFocus: false,
                                    scrollbar: {
                                        useShadows: false, // 그림자 효과 제거
                                        vertical: 'auto',
                                        horizontal: 'auto',
                                        verticalScrollbarSize: 10,
                                        horizontalScrollbarSize: 10
                                    }
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
                                className="visualization-button"
                                onClick={handleVisualizationClick}
                                title="코드 시각화 모달 열기"
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
                </div>
            </div>

            {/* 🎬 시각화 모달 */}
            <VisualizationModal
                isOpen={isVisualizationModalOpen}
                onClose={handleVisualizationClose}
                code={code}
                language={selectedLanguage}
                input={input}
            />

            {/* 토스트 메시지 컨테이너 */}
            <div id="toast-container"></div>
        </div>
    );
};

export default IDE;