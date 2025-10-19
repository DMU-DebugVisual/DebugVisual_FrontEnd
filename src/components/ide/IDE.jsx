// IDE.jsx - 서버 파일 관리 기능 및 레이아웃 충돌 최종 회피 버전

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import VisualizationModal from './VisualizationModal';
import './IDE.css';
import config from '../../config';
import { jsonExamples } from './mockData';

// 🎨 Feather Icons CDN 로드 (원본 유지)
if (!document.querySelector('script[src*="feather"]')) {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/feather-icons/4.29.0/feather.min.js';
    script.onload = () => {
        if (window.feather) {
            window.feather.replace();
        }
    };
    document.head.appendChild(script);
}

// ⛔ Script error 방지를 위해 applyResizeObserverFix 함수 정의 전체를 제거했습니다.

const IDE = () => {
    // 🆕 더미 파일 데이터 (내용 축약)
    const [dummyFiles] = useState([
        { name: "bubble_sort.c", type: "code", code: `#include <stdio.h>\n\nvoid bubbleSort(int arr[], int n) { /* ... */ }` },
        { name: "linked_list.c", type: "code", code: `#include <stdio.h>\n#include <stdlib.h>\n\nstruct Node { /* ... */ }` },
        { name: "fibonacci.c", type: "code", code: `#include <stdio.h>\n\nint fibonacci(int n) { /* ... */ }` },
        { name: "binary_tree.c", type: "code", code: `#include <stdio.h>\n#include <stdlib.h>\n\nstruct Node { /* ... */ }` },
        { name: "heap.c", type: "code", code: `#include <stdio.h>\n\nvoid heapify(int arr[], int n, int i) { /* ... */ }` },
        { name: "graph.c", type: "code", code: `#include <stdio.h>\n#include <stdlib.h>\n\n#define MAX_VERTICES 100\n\nstruct Graph { /* ... */ }` },
        ...jsonExamples
    ]);

    // 🆕 사이드바 섹션 상태 관리 (원본 유지)
    const [sidebarSections, setSidebarSections] = useState({
        myFiles: true,
        codeExamples: true,
        jsonExamples: false
    });

    // 파일 타입 구분을 위한 상태 (원본 유지)
    const [isVisualizationModalOpen, setIsVisualizationModalOpen] = useState(false);
    const [selectedJsonData, setSelectedJsonData] = useState(null);
    const [isExampleFile, setIsExampleFile] = useState(false);
    const [currentFileType, setCurrentFileType] = useState('code');

    // 기본 상태들
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [code, setCode] = useState('# 여기에 코드를 입력하세요');
    const [fileName, setFileName] = useState("untitled.py");
    const [isSaved, setIsSaved] = useState(true);
    const [activeFileUUID, setActiveFileUUID] = useState(null);
    const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [output, setOutput] = useState("");
    const [input, setInput] = useState("");
    const [isLoadingContent, setIsLoadingContent] = useState(false);

    // 🔑 파일 목록 상태: fileUUID, isServerFile 필드 추가
    const [savedFiles, setSavedFiles] = useState([
        { name: "untitled.py", code: '# 여기에 코드를 입력하세요', type: 'code', fileUUID: null, isServerFile: false }
    ]);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.body.classList.contains('dark-mode');
    });

    const [selectedLanguage, setSelectedLanguage] = useState('python');
    const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

    const supportedLanguages = [
        { id: 'python', name: 'Python', extension: '.py', template: '# 여기에 Python 코드를 입력하세요', color: '#3572A5' },
        { id: 'java', name: 'Java', extension: '.java', template: '// 여기에 Java 코드를 입력하세요\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}', color: '#B07219' },
        { id: 'cpp', name: 'C++', extension: '.cpp', template: '// 여기에 C++ 코드를 입력하세요\n#include <iostream>\n\nint main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}', color: '#f34b7d' },
        { id: 'c', name: 'C', extension: '.c', template: '// 여기에 C 코드를 입력하세요\n#include <stdio.h>\n\nint main() {\n    printf("Hello World\\n");\n    return 0;\n}', color: '#555555' },
        { id: 'javascript', name: 'JavaScript', extension: '.js', template: '// 여기에 JavaScript 코드를 입력하세요\nconsole.log("Hello World");', color: '#f1e05a' },
    ];

    const editorRef = useRef(null);
    const monacoRef = useRef(null);

    // 유틸리티 함수 (원본 유지)
    const getFileType = (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        return extension === 'json' ? 'json' : 'code';
    };

    const getLanguageFromExtension = (extension) => {
        const extensionMap = {
            'py': 'python', 'java': 'java', 'cpp': 'cpp', 'c': 'c', 'js': 'javascript', 'json': 'json'
        };
        return extensionMap[extension] || 'plaintext';
    };

    const getLanguageFromFileName = (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        return getLanguageFromExtension(extension);
    };

    const mapLanguageToAPI = (langId) => {
        switch (langId) {
            case 'cpp': return 'c';
            case 'javascript': return 'javascript';
            default: return langId;
        }
    };

    const toast = useCallback((message, type = 'toast-success') => {
        const containerId = 'toast-container';

        document
            .querySelectorAll('.toast')
            .forEach(existing => {
                document.getElementById(containerId)?.removeChild(existing);
            });

        const toastElement = document.createElement('div');
        toastElement.className = `toast ${type}`;
        toastElement.textContent = message;

        let container = document.getElementById(containerId);
        if (!container) {
            container = document.createElement('div');
            container.id = containerId;
            document.body.appendChild(container);
        }

        container.appendChild(toastElement);

        setTimeout(() => {
            toastElement.classList.add('show');
        }, 10);

        setTimeout(() => {
            toastElement.classList.remove('show');
            setTimeout(() => {
                const holder = document.getElementById(containerId);
                if (holder && holder.contains(toastElement)) {
                    holder.removeChild(toastElement);
                }
            }, 300);
        }, 3000);
    }, []);

    // 🆕 파일 아이콘 생성 함수 (원본 유지)
    const getFileIcon = (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        switch (extension) {
            case 'py': return (<div className="file-icon python-icon">Py</div>);
            case 'c': return (<div className="file-icon c-icon">C</div>);
            case 'cpp': return (<div className="file-icon cpp-icon">C++</div>);
            case 'java': return (<div className="file-icon java-icon">Java</div>);
            case 'js': return (<div className="file-icon js-icon">JS</div>);
            case 'json': return (<div className="file-icon json-icon">JSON</div>);
            default: return (<div className="file-icon default-icon">📄</div>);
        }
    };

    // 🆕 사이드바 섹션 토글 함수 (원본 유지)
    const toggleSidebarSection = (section) => {
        setSidebarSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // 🔑 파일 내용 조회 API 호출 (useCallback으로 래핑하여 안정성 확보)
    const fetchFileContent = useCallback(async (fileUUID, name) => {
        const token = localStorage.getItem('token');
        if (!token || !fileUUID) {
            toast('파일 내용을 로드할 수 없습니다: 로그인 상태 또는 UUID 확인', 'toast-error');
            return null;
        }

        setIsLoadingContent(true);

        try {
            const response = await fetch(`${config.API_BASE_URL}/api/file/${fileUUID}/content`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                let errorMsg = `파일 내용 조회 실패: ${response.statusText}`;
                if (response.status === 404) errorMsg = "파일을 찾을 수 없습니다.";
                if (response.status === 403) errorMsg = "접근 권한이 없습니다.";
                throw new Error(errorMsg);
            }

            const textResult = await response.text();
            let content;
            let originalFileName = name;

            try {
                const jsonResult = JSON.parse(textResult);
                content = jsonResult.content;
                originalFileName = jsonResult.originalFileName || name;
            } catch (e) {
                content = textResult;
            }

            if (content === undefined) {
                throw new Error("서버 응답에서 'content' 필드를 찾을 수 없습니다.");
            }

            return { content, originalFileName };

        } catch (error) {
            console.error('❌ 파일 내용 로드 실패:', error);
            toast(`파일 로드 실패: ${error.message}`, 'toast-error');
            return null;
        } finally {
            setIsLoadingContent(false);
        }
    }, [toast]);

    // 🔑 개선된 파일 선택 핸들러
    const handleFileSelect = async (identifier, isServerFile = false) => {
        if (!isSaved) {
            const shouldSave = window.confirm('변경 사항을 저장하시겠습니까?');
            if (shouldSave) {
                await handleSave();
            }
        }

        const selectedFile = savedFiles.find((file) =>
            isServerFile ? file.fileUUID === identifier : file.name === identifier && !file.isServerFile
        );

        if (!selectedFile) {
            console.error('파일을 찾을 수 없습니다:', identifier);
            return;
        }

        // 상태 초기 설정
        setFileName(selectedFile.name);
        setActiveFileUUID(selectedFile.fileUUID);
        setIsSaved(true);
        setCurrentFileType(getFileType(selectedFile.name));
        setSelectedJsonData(null);
        setIsExampleFile(false);

        let fileContent = selectedFile.code;

        // 서버 파일이고, 내용이 '로딩 중...'일 경우만 API 호출
        if (selectedFile.fileUUID && selectedFile.isServerFile && selectedFile.code === '로딩 중...') {
            const result = await fetchFileContent(selectedFile.fileUUID, selectedFile.name);

            if (result) {
                fileContent = result.content;
                const newName = result.originalFileName;

                // savedFiles 목록 업데이트: 파일 이름 및 내용
                setSavedFiles(prev => prev.map(f => {
                    if (f.fileUUID === selectedFile.fileUUID) {
                        return {...f, name: newName, code: fileContent};
                    }
                    return f;
                }));

                // 현재 파일 이름 업데이트
                setFileName(newName);
            } else {
                fileContent = `파일 내용을 로드할 수 없습니다. (UUID: ${selectedFile.fileUUID})`;
            }
        }

        setCode(fileContent);

        // 언어 설정
        const langId = getLanguageFromFileName(selectedFile.name);
        if (langId && langId !== selectedLanguage) {
            setSelectedLanguage(langId);
        }
    };

    // 🆕 더미 파일 선택 핸들러 (원본 유지)
    const handleDummyFileSelect = (file) => {
        if (!isSaved) {
            const shouldContinue = window.confirm('현재 파일에 저장되지 않은 변경사항이 있습니다. 예제 파일을 불러오시겠습니까?');
            if (!shouldContinue) return;
        }

        setCode(file.code);
        setFileName(file.name);
        setActiveFileUUID(null); // 예제 파일이므로 UUID 없음
        setCurrentFileType(getFileType(file.name));

        if (file.type === 'json') {
            try {
                const jsonData = JSON.parse(file.code);
                setSelectedJsonData(jsonData);
                setIsExampleFile(true);
                toast(`JSON 예제 파일 "${file.name}"을 불러왔습니다.`);
            } catch (error) {
                setSelectedJsonData(null);
                setIsExampleFile(false);
            }
        } else {
            setSelectedJsonData(null);
            setIsExampleFile(false);
            toast(`코드 예제 파일 "${file.name}"을 불러왔습니다.`);
        }

        const extension = file.name.split('.').pop().toLowerCase();
        const languageFromExtension = getLanguageFromExtension(extension);
        if (languageFromExtension && languageFromExtension !== selectedLanguage) {
            setSelectedLanguage(languageFromExtension);
        }

        setIsSaved(false);
    };

    // 🆕 현재 파일과 매칭되는 JSON 파일명 생성 (원본 유지)
    const getMatchingJsonFileName = (codeFileName) => {
        const baseName = codeFileName.split('.')[0];
        return `${baseName}.json`;
    };

    // 🆕 JSON 파일 생성/업데이트 함수 (문자열 그대로 저장) (로컬 상태만 업데이트)
    const createOrUpdateJsonFileRaw = async (jsonFileName, content) => {
        try {
            const existingFile = savedFiles.find(f => f.name === jsonFileName);

            const fileToUpdate = {
                name: jsonFileName,
                code: content,
                type: 'json',
                fileUUID: existingFile ? existingFile.fileUUID : null,
                isServerFile: existingFile ? existingFile.isServerFile : false
            };

            if (existingFile) {
                setSavedFiles(prev => prev.map(f => f.name === jsonFileName ? fileToUpdate : f));
            } else {
                setSavedFiles(prev => [...prev, fileToUpdate]);
            }

            return content;
        } catch (error) {
            throw error;
        }
    };

    // 🆕 개선된 시각화 클릭 핸들러 (원본 유지)
    const handleVisualizationClick = async () => {
        if (!code.trim()) {
            alert('시각화할 코드를 먼저 작성해주세요.');
            return;
        }

        const fileType = getFileType(fileName);
        setCurrentFileType(fileType);

        if (fileType === 'json') {
            try {
                const jsonData = JSON.parse(code);
                setSelectedJsonData(jsonData);
                setIsExampleFile(false);
                setIsVisualizationModalOpen(true);
            } catch (error) {
                alert(`JSON 형식이 올바르지 않습니다: ${error.message}`);
                return;
            }
        } else {
            try {
                const requestBody = { code: code, input: input, lang: mapLanguageToAPI(selectedLanguage) };

                const response = await fetch(`${config.API_BASE_URL}/api/code/visualize`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
                }

                const apiResponse = await response.json();
                let visualizationData = apiResponse.ast || "AST 데이터가 없습니다.";

                if (typeof visualizationData === 'string') {
                    if (visualizationData.startsWith('```json\n')) { visualizationData = visualizationData.slice(7); }
                    if (visualizationData.endsWith('\n```')) { visualizationData = visualizationData.slice(0, -4); }
                }

                const jsonFileName = getMatchingJsonFileName(fileName);
                await createOrUpdateJsonFileRaw(jsonFileName, visualizationData);

                setSelectedJsonData(visualizationData);
                setIsExampleFile(false);
                setIsVisualizationModalOpen(true);

                toast(`시각화 완료! ${jsonFileName} 파일이 생성/업데이트되었습니다.`);

            } catch (error) {
                console.error('❌ 시각화 실패:', error);
                alert(`시각화 실패: ${error.message}`);
            }
        }
    };

    // 🆕 파일 생성
    const handleNewFile = () => {
        const currentLang = supportedLanguages.find(lang => lang.id === selectedLanguage) || supportedLanguages[0];
        const defaultName = `untitled${savedFiles.filter(f => !f.fileUUID).length + 1}${currentLang.extension}`;
        const newFileName = prompt('새 파일 이름을 입력하세요:', defaultName);

        if (!newFileName) return;

        if (savedFiles.some(file => file.name === newFileName && !file.fileUUID)) {
            alert('이미 존재하는 로컬 파일 이름입니다.');
        }

        const fileType = getFileType(newFileName);
        const newFile = {
            name: newFileName,
            code: fileType === 'json' ? '{}' : currentLang.template,
            type: fileType,
            fileUUID: null,
            isServerFile: false,
        };

        setSavedFiles([...savedFiles, newFile]);
        setFileName(newFileName);
        setCode(newFile.code);
        setActiveFileUUID(null);
        setIsSaved(true);
        setCurrentFileType(fileType);

        setSelectedJsonData(null);
        setIsExampleFile(false);

        if (fileType !== 'json') {
            const fileExtension = newFileName.split('.').pop().toLowerCase();
            const languageFromExtension = getLanguageFromExtension(fileExtension);
            if (languageFromExtension !== selectedLanguage) {
                setSelectedLanguage(languageFromExtension);
            }
        }
    };

    // 나머지 기본 함수들 (원본 유지)
    const handleEditorChange = (value) => {
        setCode(value);
        setIsSaved(false);
    };

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        const editorOptions = {
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            renderLineHighlight: 'line',
            renderWhitespace: 'none',
            automaticLayout: false, // 💡 충돌 회피를 위해 비활성화
            wordWrap: "bounded",
            wordWrapColumn: 120,
            scrollbar: { vertical: 'auto', horizontal: 'auto', verticalScrollbarSize: 10, horizontalScrollbarSize: 10 }
        };
        editor.updateOptions(editorOptions);

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function() {
            handleSave();
        });

        monaco.editor.defineTheme('custom-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: '', foreground: 'D4D4D4', background: '1E1E1E' },
                { token: 'comment', foreground: '6A9955' },
                { token: 'string', foreground: 'CE9178' },
                { token: 'keyword', foreground: '569CD6' },
                { token: 'number', foreground: 'B5CEA8' }
            ],
            colors: {
                'editor.background': '#1E1E1E',
                'editorLineNumber.foreground': '#858585',
                'editorCursor.foreground': '#AEAFAD',
                'editor.selectionBackground': '#264F78',
                'editor.lineHighlightBackground': '#2A2D2E'
            }
        });

        monaco.editor.defineTheme('custom-light', {
            base: 'vs',
            inherit: true,
            rules: [
                { token: '', foreground: '2D2D2D', background: 'FFFFFF' },
                { token: 'comment', foreground: '008000' },
                { token: 'string', foreground: 'A31515' },
                { token: 'keyword', foreground: '0000FF' },
                { token: 'number', foreground: '098658' }
            ],
            colors: {
                'editor.background': '#FFFFFF',
                'editorLineNumber.foreground': '#237893',
                'editorCursor.foreground': '#000000',
                'editor.selectionBackground': '#ADD6FF',
                'editor.lineHighlightBackground': '#F5F5F5'
            }
        });

        const updateEditorTheme = (monaco) => {
            if (!monaco && !editorRef.current) return;
            const m = monaco || window.monaco;
            if (m) { m.editor.setTheme(isDarkMode ? 'custom-dark' : 'custom-light'); }
        };

        updateEditorTheme(monaco);

        setTimeout(() => {
            try { editorRef.current.layout(); } catch (e) { console.warn('에디터 초기 레이아웃 설정 중 오류:', e); }
        }, 100);
    };

    // 🔑 파일 저장/수정 API 통합 (FormData 사용)
    const handleSave = async () => {
        if (!isLoggedIn) {
            alert("로그인 후 이용 가능한 기능입니다.");
            return;
        }

        const currentCode = editorRef.current.getValue();
        const currentFileName = fileName;
        const token = localStorage.getItem('token');
        const fileUUIDToUse = activeFileUUID;

        if (!token) {
            toast("인증 토큰이 없습니다. 다시 로그인해 주세요.", 'toast-error');
            return;
        }

        try {
            // 1. FormData 생성 (multipart/form-data)
            const fileBlob = new Blob([currentCode], { type: 'text/plain' });
            const formData = new FormData();
            formData.append('file', new File([fileBlob], currentFileName));

            // 2. API URL 및 쿼리 파라미터 설정
            let apiUrl = `${config.API_BASE_URL}/api/file/upload`;
            if (fileUUIDToUse) {
                apiUrl += `?fileUUID=${fileUUIDToUse}`;
            }

            // 3. API 호출
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                let errorMsg = `파일 저장/수정 실패: ${response.statusText}`;
                if (response.status === 401) errorMsg = "인증 실패: 다시 로그인해 주세요.";
                if (response.status === 404 && fileUUIDToUse) errorMsg = "파일을 찾을 수 없어 덮어쓰기 실패했습니다.";
                throw new Error(errorMsg);
            }

            const result = await response.json();
            const newFileUUID = result.fileUUID;

            // 4. 로컬 상태 업데이트
            const updatedFile = {
                name: currentFileName,
                code: currentCode,
                type: getFileType(currentFileName),
                fileUUID: newFileUUID,
                isServerFile: true
            };

            setSavedFiles(prev => {
                const existingIndex = prev.findIndex(f => f.fileUUID === fileUUIDToUse);
                if (existingIndex !== -1) {
                    const newFiles = [...prev];
                    newFiles[existingIndex] = updatedFile;
                    return newFiles;
                }

                const localFileIndex = prev.findIndex(f => f.name === currentFileName && !f.fileUUID);
                if (localFileIndex !== -1) {
                    const newFiles = [...prev];
                    newFiles[localFileIndex] = updatedFile;
                    return newFiles;
                }

                return [...prev, updatedFile];
            });

            // 현재 활성 파일 상태 업데이트
            setActiveFileUUID(newFileUUID);
            setIsSaved(true);
            setCode(currentCode);
            toast(`파일이 성공적으로 저장/수정되었습니다!`);

        } catch (error) {
            console.error('❌ 파일 저장 중 오류:', error);
            toast(`저장 중 오류가 발생했습니다: ${error.message}`, 'toast-error');
        }
    };

    const handleRun = async () => {
        // ... (코드 실행 로직, 원본 유지) ...
        if (currentFileType === 'json') {
            alert('JSON 파일은 실행할 수 없습니다. 시각화 버튼을 사용해주세요.');
            return;
        }

        setIsRunning(true);
        setOutput("실행 중...");

        try {
            const currentCode = editorRef.current.getValue();
            const requestBody = {
                code: currentCode, input: input, lang: mapLanguageToAPI(selectedLanguage)
            };

            const response = await fetch(config.API_ENDPOINTS.RUN_CODE, {
                method: 'POST', headers: { 'Content-Type': 'application/json', },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
            }

            const result = await response.json();
            const stdout = result.stdout || result.Stdout || result.STDOUT ||
                result.output || result.Output || result.OUTPUT;

            if (stdout !== undefined) {
                setOutput(stdout || "실행 완료 (출력 없음)");
            } else {
                const errorMsg = result.stderr || result.error || result.message;
                if (errorMsg) {
                    setOutput(`오류: ${errorMsg}`);
                } else {
                    setOutput("실행 완료되었지만 출력이 없습니다.");
                }
            }

        } catch (error) {
            console.error('코드 실행 중 오류:', error);
            setOutput(`오류 발생: ${error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const toggleLanguageMenu = () => {
        setIsLanguageMenuOpen(!isLanguageMenuOpen);
    };

    const selectLanguage = (langId) => {
        const newLanguage = supportedLanguages.find(lang => lang.id === langId);

        if (newLanguage) {
            if (!isSaved) {
                const shouldChange = window.confirm('저장되지 않은 변경사항이 있습니다. 언어를 변경하시겠습니까?');
                if (!shouldChange) {
                    setIsLanguageMenuOpen(false);
                    return;
                }
            }

            const baseName = fileName.split('.')[0];
            const newFileName = `${baseName}${newLanguage.extension}`;

            setSelectedLanguage(langId);
            setFileName(newFileName);
            setCode(newLanguage.template);
            setIsSaved(false);
            setIsLanguageMenuOpen(false);
            setActiveFileUUID(null);

            const newFile = {
                name: newFileName, code: newLanguage.template, type: 'code',
                fileUUID: null, isServerFile: false
            };
            setSavedFiles(prev => {
                const exists = prev.find(f => f.name === newFileName && !f.fileUUID);
                if (!exists) {
                    return [...prev, newFile];
                }
                return prev;
            });
        }
    };

    // 1. 🔑 인증 및 사용자 상태 관리 (안정화)
    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem('token');
            const storedUsername = localStorage.getItem('username');
            const newIsLoggedIn = !!(token && storedUsername);
            const newUsername = storedUsername || '';

            if (newIsLoggedIn !== isLoggedIn) {
                setIsLoggedIn(newIsLoggedIn);
            }
            if (newUsername !== username) {
                setUsername(newUsername);
            }

            if (window.feather) {
                window.feather.replace();
            }
        };

        checkAuth();
        const interval = setInterval(checkAuth, 500);

        return () => clearInterval(interval);
    }, [isLoggedIn, username]);

    // 2. 📁 파일 목록 로드 및 로그아웃 처리 (안정화)
    useEffect(() => {
        const fetchSavedFiles = async () => {
            const token = localStorage.getItem('token');
            if (!isLoggedIn || !token) return;

            try {
                const response = await fetch(`${config.API_BASE_URL}/api/file/my`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.status === 401) {
                    throw new Error('인증 실패: 토큰이 만료되었습니다.');
                }
                if (!response.ok) {
                    throw new Error(`파일 목록 조회 실패: ${response.statusText}`);
                }

                const fileList = await response.json();

                const serverFiles = fileList.map(file => ({
                    name: file.originalFileName,
                    code: '로딩 중...',
                    type: getFileType(file.originalFileName),
                    fileUUID: file.fileUUID,
                    isServerFile: true
                }));

                setSavedFiles(prev => {
                    const localFiles = prev.filter(f => !f.isServerFile && !f.fileUUID);
                    return [...localFiles, ...serverFiles];
                });

            } catch (error) {
                console.error('❌ 내 파일 목록 로드 실패:', error);
                toast(`파일 목록 로드 실패: ${error.message}`, 'toast-error');
            }
        };

        if (isLoggedIn) {
            fetchSavedFiles();
        } else {
            setSavedFiles(prev => prev.filter(f => !f.isServerFile));
            setCode('# 여기에 코드를 입력하세요');
            setFileName('untitled.py');
            setActiveFileUUID(null);
            setIsSaved(true);
            setSelectedLanguage('python');
        }

    }, [isLoggedIn, toast]);

    // 3. 🐛 에디터 레이아웃 관련 useEffect (최종 안정화)
    useEffect(() => {
        // applyResizeObserverFix() 제거했으므로, 브라우저 resize 이벤트에만 의존합니다.
        const updateAllEditorLayouts = () => {
            if (editorRef.current) {
                window.requestAnimationFrame(() => {
                    try { editorRef.current.layout(); } catch (e) { console.warn('에디터 레이아웃 업데이트 중 오류:', e); }
                });
            }
        };
        window.addEventListener('resize', updateAllEditorLayouts);
        const initialLayoutTimeout = setTimeout(() => { updateAllEditorLayouts(); }, 500);
        return () => {
            window.removeEventListener('resize', updateAllEditorLayouts);
            clearTimeout(initialLayoutTimeout);
        };
    }, []);

    // 4. 🐛 사이드바 접힘/펼침 상태 변경 시 에디터 레이아웃 업데이트 (간소화 유지)
    useEffect(() => {
        // 애니메이션 완료 후 한 번만 레이아웃을 최종 업데이트
        const timeoutId = setTimeout(() => {
            if (editorRef.current) {
                try {
                    editorRef.current.layout();
                    console.log('🔄 사이드바 애니메이션 완료 - 최종 에디터 레이아웃 업데이트');
                } catch (e) {
                    console.warn('사이드바 애니메이션 완료 시 에디터 레이아웃 업데이트 중 오류:', e);
                }
            }
        }, 350);

        return () => clearTimeout(timeoutId);
    }, [isLeftPanelCollapsed]);

    // 🎨 다크 모드 토글 시 에디터 테마 변경 (원본 유지)
    useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const newIsDarkMode = document.body.classList.contains('dark-mode');

                    if (newIsDarkMode !== isDarkMode) {
                        setIsDarkMode(newIsDarkMode);

                        if (editorRef.current && monacoRef.current) {
                            const newTheme = newIsDarkMode ? 'custom-dark' : 'custom-light';
                            monacoRef.current.editor.setTheme(newTheme);
                        }
                    }
                }
            });
        });

        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });

        return () => { observer.disconnect(); };
    }, [isDarkMode]);

    // 🆕 ModernSidebar 렌더링 함수 (원본 유지)
    const renderModernSidebar = () => {
        const myServerFiles = savedFiles.filter(f => f.isServerFile && f.fileUUID);
        const myLocalFiles = savedFiles.filter(f => !f.isServerFile && !f.fileUUID);

        const codeExamples = dummyFiles.filter(f => f.type === 'code');
        const jsonExamples = dummyFiles.filter(f => f.type === 'json');

        return (
            <div className="modern-sidebar">
                {/* 헤더 */}
                <div className="modern-sidebar-header">
                    <div className="sidebar-title-container">
                        <h2 className="sidebar-title">파일 탐색기</h2>
                        <button className="new-file-button" onClick={handleNewFile}>
                            <span className="icon-plus">+</span>
                        </button>
                    </div>
                </div>

                {/* 파일 목록 */}
                <div className="modern-sidebar-content">
                    {isLoggedIn ? (
                        <>
                            {/* 내 파일 섹션 */}
                            <div className="sidebar-section">
                                <button
                                    className="section-header"
                                    onClick={() => toggleSidebarSection('myFiles')}
                                >
                                    <span className="chevron-icon">
                                        {sidebarSections.myFiles ? '▼' : '▶'}
                                    </span>
                                    <i data-feather="folder" className="section-icon"></i>
                                    <span className="section-title">내 파일 ({myServerFiles.length + myLocalFiles.length}개)</span>
                                </button>

                                {sidebarSections.myFiles && (
                                    <div className="section-content">
                                        {/* 서버 저장된 파일 */}
                                        {myServerFiles.map((file) => (
                                            <div
                                                key={file.fileUUID}
                                                className={`file-item ${activeFileUUID === file.fileUUID ? 'active' : ''}`}
                                                onClick={() => handleFileSelect(file.fileUUID, true)}
                                            >
                                                {getFileIcon(file.name)}
                                                <span className="file-name">{file.name}</span>
                                                <span className="file-badge server-badge" title="서버 저장 파일">S</span>
                                            </div>
                                        ))}

                                        {/* 로컬 임시 파일 */}
                                        {myLocalFiles.map((file) => (
                                            <div
                                                key={file.name}
                                                className={`file-item local-file ${!activeFileUUID && fileName === file.name && !isSaved ? 'active' : ''}`}
                                                onClick={() => handleFileSelect(file.name, false)}
                                            >
                                                {getFileIcon(file.name)}
                                                <span className="file-name">{file.name}</span>
                                                <span className="file-badge local-badge" title="로컬 임시 파일">L</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 코드/JSON 예제 섹션 (원본 유지) */}
                            <div className="sidebar-section">
                                <button
                                    className="section-header"
                                    onClick={() => toggleSidebarSection('codeExamples')}
                                >
                                    <span className="chevron-icon">
                                        {sidebarSections.codeExamples ? '▼' : '▶'}
                                    </span>
                                    <i data-feather="code" className="section-icon"></i>
                                    <span className="section-title">코드 예제</span>
                                </button>
                                {sidebarSections.codeExamples && (
                                    <div className="section-content">
                                        {codeExamples.map((file, index) => (
                                            <div key={`code-${index}`} className="file-item example-file" onClick={() => handleDummyFileSelect(file)}>
                                                {getFileIcon(file.name)}
                                                <span className="file-name">{file.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="sidebar-section">
                                <button
                                    className="section-header"
                                    onClick={() => toggleSidebarSection('jsonExamples')}
                                >
                                    <span className="chevron-icon">
                                        {sidebarSections.jsonExamples ? '▼' : '▶'}
                                    </span>
                                    <i data-feather="database" className="section-icon"></i>
                                    <span className="section-title">JSON 예제</span>
                                </button>
                                {sidebarSections.jsonExamples && (
                                    <div className="section-content">
                                        {jsonExamples.map((file, index) => (
                                            <div key={`json-${index}`} className="file-item json-file example-file" onClick={() => handleDummyFileSelect(file)}>
                                                {getFileIcon(file.name)}
                                                <span className="file-name">{file.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="auth-section">
                            <div className="auth-header">
                                <span className="auth-icon">🔐</span>
                                <span className="auth-title">계정 접속</span>
                            </div>
                            <div className="auth-section">
                                <div className="auth-content sidebar-guest-message">
                                    <p>🔒 로그인 후 파일 저장 및 조회가 가능합니다</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 푸터 */}
                {isLoggedIn && (
                    <div className="modern-sidebar-footer">
                        <div className="sidebar-stats">
                            <div className="stat-row">
                                <span>서버 파일 수:</span>
                                <span>{myServerFiles.length}</span>
                            </div>
                            <div className="stat-row">
                                <span>활성 파일:</span>
                                <span className="active-file-name">{fileName}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="ide-container">
            <div className={`sidebar ${isLeftPanelCollapsed ? 'collapsed' : ''}`}>
                {renderModernSidebar()}
            </div>

            {/* 메인 콘텐츠 */}
            <div className={`main-content ${!isLoggedIn ? 'guest-mode' : ''}`}>
                {/* 상단 헤더 */}
                <div className="main-header">
                    <div className="header-left">
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

                        <div className="file-type-indicator">
                            <span className={`file-type-badge ${currentFileType === 'json' ? 'json-type' : 'code-type'}`}>
                                {currentFileType === 'json' ? '📊 JSON' : '💻 코드'}
                            </span>
                        </div>
                    </div>

                    <div className="header-right">
                        <div className="login-status-container">
                            <span className={`login-status ${isLoggedIn ? 'logged-in' : 'guest'}`}>
                                {isLoggedIn ? `${username} 님` : '비회원 모드'}
                            </span>
                        </div>

                        {isLoggedIn ? (
                            <>
                                <input
                                    type="text"
                                    value={fileName}
                                    onChange={(e) => setFileName(e.target.value)}
                                    className="filename-input"
                                    placeholder="파일명.확장자"
                                    title={`현재 파일 UUID: ${activeFileUUID || '없음'}`}
                                />
                                <button className="save-button" onClick={handleSave} disabled={isSaved}>
                                    {activeFileUUID ? '덮어쓰기' : '저장'}
                                </button>
                                <span className={`save-indicator ${isSaved ? 'saved' : ''}`}>
                                    {isSaved ? '✓' : '●'}
                                </span>
                            </>
                        ) : (
                            <div className="guest-controls">
                                <span className="guest-mode-text">제한된 기능으로 실행 중입니다</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 코드 에디터와 출력 영역 */}
                <div className="content-layout">
                    <div className="editor-section">
                        {isLoadingContent && (
                            <div className="content-loading-overlay">
                                파일 내용을 불러오는 중입니다...
                            </div>
                        )}
                        <div className="monaco-editor-wrapper" style={{ opacity: isLoadingContent ? 0.5 : 1 }}>
                            <Editor
                                // 🔑 key 추가: 파일 변경 시 에디터 강제 재마운트
                                key={activeFileUUID || fileName}
                                height="100%"
                                defaultLanguage={currentFileType === 'json' ? 'json' : selectedLanguage}
                                defaultValue={code}
                                language={currentFileType === 'json' ? 'json' : selectedLanguage}
                                value={code}
                                onChange={handleEditorChange}
                                onMount={handleEditorDidMount}
                                theme={isDarkMode ? "vs-dark" : "vs-light"}
                                options={{
                                    fontSize: 14,
                                    minimap: { enabled: false },
                                    scrollBeyondLastLine: false,
                                    automaticLayout: false, // 💡 충돌 회피를 위해 비활성화
                                    tabSize: 4,
                                    insertSpaces: true,
                                    cursorBlinking: "solid",
                                    folding: true,
                                    lineNumbersMinChars: 3,
                                    wordWrap: "on",
                                    renderWhitespace: "none",
                                    renderLineHighlight: "line",
                                    renderLineHighlightOnlyWhenFocus: false,
                                    scrollbar: {
                                        useShadows: false,
                                        vertical: 'auto',
                                        horizontal: 'auto',
                                        verticalScrollbarSize: 10,
                                        horizontalScrollbarSize: 10
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="right-panel">
                        <div className="action-buttons">
                            <button
                                className="run-code-button"
                                onClick={handleRun}
                                disabled={isRunning || currentFileType === 'json'}
                                title={currentFileType === 'json' ? 'JSON 파일은 실행할 수 없습니다' : '코드 실행'}
                            >
                                <span className="button-icon">▶</span>
                                {currentFileType === 'json' ? '실행 불가' : '실행 코드'}
                            </button>
                            <button
                                className="visualization-button"
                                onClick={handleVisualizationClick}
                                title={currentFileType === 'json' ? 'JSON 데이터 시각화' : 'API를 통한 코드 시각화'}
                            >
                                <span className="button-icon">📊</span>
                                {currentFileType === 'json' ? 'JSON 시각화' : '코드 시각화'}
                            </button>
                        </div>

                        <div className="input-section">
                            <div className="section-header">
                                {currentFileType === 'json' ? 'JSON 데이터 (읽기 전용)' : '프로그램 입력'}
                            </div>
                            <textarea
                                className="program-input"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={currentFileType === 'json' ?
                                    'JSON 파일에서는 입력값이 사용되지 않습니다' :
                                    '프로그램 실행 시 필요한 입력값을 여기에 작성하세요'
                                }
                                disabled={currentFileType === 'json'}
                            ></textarea>
                        </div>

                        <div className="output-section">
                            <div className="section-header">
                                {currentFileType === 'json' ? 'JSON 정보' : '프로그램 출력'}
                            </div>
                            <pre className="program-output">
                                {currentFileType === 'json' ?
                                    'JSON 파일에서는 시각화 버튼을 사용하여 데이터를 확인하세요.' :
                                    (isRunning ? "실행 중..." : (output || "코드를 실행하면 결과가 여기에 표시됩니다."))
                                }
                            </pre>
                        </div>
                    </div>
                </div>
            </div>

            {/* 시각화 모달 */}
            <VisualizationModal
                isOpen={isVisualizationModalOpen}
                onClose={() => setIsVisualizationModalOpen(false)}
                code={code}
                language={selectedLanguage}
                input={input}
                preloadedJsonData={isExampleFile ? selectedJsonData : null}
                isJsonFile={currentFileType === 'json'}
                isDark={isDarkMode}
            />

            <div id="toast-container"></div>
        </div>
    );
};

export default IDE;