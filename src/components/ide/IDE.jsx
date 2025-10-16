// IDE.jsx - ModernSidebar 디자인 통합 버전 (사이드바 접힘 시 에디터 레이아웃 자동 조정)

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import VisualizationModal from './VisualizationModal';
import './IDE.css';
import config from '../../config';
import { jsonExamples } from './mockData/index.js';

// 🎨 Feather Icons CDN 로드
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

// ResizeObserver 패치 함수
const applyResizeObserverFix = () => {
    if (window._isResizeObserverPatched) return;
    const originalResizeObserver = window.ResizeObserver;

    class PatchedResizeObserver extends originalResizeObserver {
        constructor(callback) {
            const throttledCallback = (entries, observer) => {
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

    const originalConsoleError = console.error;
    console.error = (...args) => {
        if (args[0] && typeof args[0] === 'string' && args[0].includes('ResizeObserver')) {
            return;
        }
        originalConsoleError.apply(console, args);
    };

    try {
        window.ResizeObserver = PatchedResizeObserver;
        window._isResizeObserverPatched = true;
    } catch (e) {
        console.warn('ResizeObserver를 패치할 수 없습니다:', e);
    }
};

const IDE = () => {
    // 🆕 더미 파일 데이터
    const [dummyFiles] = useState([
        // 코드 예제 파일들
        {
            name: "bubble_sort.c",
            type: "code",
            code: `#include <stdio.h>

void bubbleSort(int arr[], int n) {
    int i, j;
    for (i = 0; i < n-1; i++) {
        for (j = 0; j < n-i-1; j++) {
            if (arr[j] > arr[j+1]) {
                int temp = arr[j];
                arr[j] = arr[j+1];
                arr[j+1] = temp;
            }
        }
    }
}

int main() {
    int arr[] = {64, 34, 25, 12, 22, 11, 90};
    int n = sizeof(arr)/sizeof(arr[0]);
    
    bubbleSort(arr, n);
    
    printf("정렬된 배열: ");
    for (int i = 0; i < n; i++) {
        printf("%d ", arr[i]);
    }
    printf("\\n");
    
    return 0;
}`
        },
        {
            name: "linked_list.c",
            type: "code",
            code: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node* next;
};

void printList(struct Node* node) {
    while (node != NULL) {
        printf("%d -> ", node->data);
        node = node->next;
    }
    printf("NULL\\n");
}

int main() {
    struct Node* head = NULL;
    struct Node* second = NULL;
    struct Node* third = NULL;
    
    head = (struct Node*)malloc(sizeof(struct Node));
    second = (struct Node*)malloc(sizeof(struct Node));
    third = (struct Node*)malloc(sizeof(struct Node));
    
    head->data = 1;
    head->next = second;
    
    second->data = 2;
    second->next = third;
    
    third->data = 3;
    third->next = NULL;
    
    printList(head);
    
    return 0;
}`
        },
        {
            name: "fibonacci.c",
            type: "code",
            code: `#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1)
        return n;
    return fibonacci(n-1) + fibonacci(n-2);
}

int main() {
    int n = 10;
    printf("피보나치 수열 (n=%d): ", n);
    for (int i = 0; i < n; i++) {
        printf("%d ", fibonacci(i));
    }
    printf("\\n");
    return 0;
}`
        },
        {
            name: "binary_tree.c",
            type: "code",
            code: `#include <stdio.h>
#include <stdlib.h>

struct Node {
    int data;
    struct Node* left;
    struct Node* right;
};

struct Node* createNode(int data) {
    struct Node* node = (struct Node*)malloc(sizeof(struct Node));
    node->data = data;
    node->left = NULL;
    node->right = NULL;
    return node;
}

void inorderTraversal(struct Node* root) {
    if (root != NULL) {
        inorderTraversal(root->left);
        printf("%d ", root->data);
        inorderTraversal(root->right);
    }
}

int main() {
    struct Node* root = createNode(1);
    root->left = createNode(2);
    root->right = createNode(3);
    root->left->left = createNode(4);
    root->left->right = createNode(5);
    
    printf("중위 순회: ");
    inorderTraversal(root);
    printf("\\n");
    
    return 0;
}`
        },
        {
            name: "heap.c",
            type: "code",
            code: `#include <stdio.h>

void heapify(int arr[], int n, int i) {
    int largest = i;
    int left = 2 * i + 1;
    int right = 2 * i + 2;
    
    if (left < n && arr[left] > arr[largest])
        largest = left;
    
    if (right < n && arr[right] > arr[largest])
        largest = right;
    
    if (largest != i) {
        int temp = arr[i];
        arr[i] = arr[largest];
        arr[largest] = temp;
        heapify(arr, n, largest);
    }
}

void heapSort(int arr[], int n) {
    for (int i = n / 2 - 1; i >= 0; i--)
        heapify(arr, n, i);
    
    for (int i = n - 1; i >= 0; i--) {
        int temp = arr[0];
        arr[0] = arr[i];
        arr[i] = temp;
        heapify(arr, i, 0);
    }
}

int main() {
    int arr[] = {12, 11, 13, 5, 6, 7};
    int n = sizeof(arr) / sizeof(arr[0]);
    
    heapSort(arr, n);
    
    printf("정렬된 배열: ");
    for (int i = 0; i < n; i++)
        printf("%d ", arr[i]);
    printf("\\n");
    
    return 0;
}`
        },
        {
            name: "graph.c",
            type: "code",
            code: `#include <stdio.h>
#include <stdlib.h>

#define MAX_VERTICES 100

struct Graph {
    int vertices;
    int adjMatrix[MAX_VERTICES][MAX_VERTICES];
};

void initGraph(struct Graph* graph, int vertices) {
    graph->vertices = vertices;
    for (int i = 0; i < vertices; i++) {
        for (int j = 0; j < vertices; j++) {
            graph->adjMatrix[i][j] = 0;
        }
    }
}

void addEdge(struct Graph* graph, int src, int dest) {
    graph->adjMatrix[src][dest] = 1;
    graph->adjMatrix[dest][src] = 1;
}

void printGraph(struct Graph* graph) {
    printf("인접 행렬:\\n");
    for (int i = 0; i < graph->vertices; i++) {
        for (int j = 0; j < graph->vertices; j++) {
            printf("%d ", graph->adjMatrix[i][j]);
        }
        printf("\\n");
    }
}

int main() {
    struct Graph graph;
    initGraph(&graph, 5);
    
    addEdge(&graph, 0, 1);
    addEdge(&graph, 0, 4);
    addEdge(&graph, 1, 2);
    addEdge(&graph, 1, 3);
    addEdge(&graph, 1, 4);
    addEdge(&graph, 2, 3);
    addEdge(&graph, 3, 4);
    
    printGraph(&graph);
    
    return 0;
}`
        },
        // JSON 예제 파일들
        ...jsonExamples
    ]);

    // 🆕 사이드바 섹션 상태 관리
    const [sidebarSections, setSidebarSections] = useState({
        myFiles: true,
        codeExamples: true,
        jsonExamples: false
    });

    // 파일 타입 구분을 위한 상태
    const [isVisualizationModalOpen, setIsVisualizationModalOpen] = useState(false);
    const [selectedJsonData, setSelectedJsonData] = useState(null);
    const [isExampleFile, setIsExampleFile] = useState(false);
    const [currentFileType, setCurrentFileType] = useState('code');

    // 기본 상태들
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
    const [input, setInput] = useState("");

    // 파일 목록을 코드파일과 JSON파일로 분리 관리
    const [savedFiles, setSavedFiles] = useState([
        { name: "untitled.py", code: '# 여기에 코드를 입력하세요', type: 'code' }
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

    // 파일 타입 감지 함수
    const getFileType = (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        return extension === 'json' ? 'json' : 'code';
    };

    // 🆕 파일 아이콘 생성 함수
    const getFileIcon = (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        switch (extension) {
            case 'py':
                return (
                    <div className="file-icon python-icon">
                        Py
                    </div>
                );
            case 'c':
                return (
                    <div className="file-icon c-icon">
                        C
                    </div>
                );
            case 'cpp':
                return (
                    <div className="file-icon cpp-icon">
                        C++
                    </div>
                );
            case 'java':
                return (
                    <div className="file-icon java-icon">
                        Java
                    </div>
                );
            case 'js':
                return (
                    <div className="file-icon js-icon">
                        JS
                    </div>
                );
            case 'json':
                return (
                    <div className="file-icon json-icon">
                        JSON
                    </div>
                );
            default:
                return (
                    <div className="file-icon default-icon">
                        📄
                    </div>
                );
        }
    };

    // 🆕 사이드바 섹션 토글 함수
    const toggleSidebarSection = (section) => {
        setSidebarSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // 🆕 개선된 파일 선택 핸들러
    const handleFileSelect = (name) => {
        if (!isSaved) {
            const shouldSave = window.confirm('변경 사항을 저장하시겠습니까?');
            if (shouldSave) {
                handleSave();
            }
        }

        const selectedFile = savedFiles.find((file) => file.name === name);
        if (selectedFile) {
            setFileName(selectedFile.name);
            setCode(selectedFile.code);
            setActiveFile(selectedFile.name);
            setIsSaved(true);

            // 파일 타입 설정
            const fileType = getFileType(selectedFile.name);
            setCurrentFileType(fileType);

            // 일반 파일 선택 시 예제 파일 상태 초기화
            setSelectedJsonData(null);
            setIsExampleFile(false);

            // 파일 확장자에 맞는 언어 설정
            const langId = getLanguageFromFileName(selectedFile.name);
            if (langId && langId !== selectedLanguage) {
                setSelectedLanguage(langId);
            }

            console.log(`📁 파일 선택: ${name} (타입: ${fileType})`);
        }
    };

    // 🆕 더미 파일 선택 핸들러
    const handleDummyFileSelect = (file) => {
        if (!isSaved) {
            const shouldContinue = window.confirm('현재 파일에 저장되지 않은 변경사항이 있습니다. 예제 파일을 불러오시겠습니까?');
            if (!shouldContinue) return;
        }

        setCode(file.code);
        setFileName(file.name);

        // 파일 타입 설정
        const fileType = getFileType(file.name);
        setCurrentFileType(fileType);

        if (file.type === 'json') {
            // JSON 예제 파일인 경우
            try {
                const jsonData = JSON.parse(file.code);
                setSelectedJsonData(jsonData);
                setIsExampleFile(true);
                console.log('🗂️ JSON 예제 파일 선택:', file.name);
                toast(`JSON 예제 파일 "${file.name}"을 불러왔습니다.`);
            } catch (error) {
                console.error('JSON 파싱 실패:', error);
                setSelectedJsonData(null);
                setIsExampleFile(false);
            }
        } else {
            // 코드 예제 파일인 경우
            setSelectedJsonData(null);
            setIsExampleFile(false);
            toast(`코드 예제 파일 "${file.name}"을 불러왔습니다.`);
        }

        // 언어 설정
        const extension = file.name.split('.').pop().toLowerCase();
        const languageFromExtension = getLanguageFromExtension(extension);
        if (languageFromExtension && languageFromExtension !== selectedLanguage) {
            setSelectedLanguage(languageFromExtension);
        }

        setIsSaved(false);
        setActiveFile('');

        console.log(`📚 예제 파일 선택: ${file.name} (타입: ${fileType})`);
    };

    // 🆕 현재 파일과 매칭되는 JSON 파일명 생성
    const getMatchingJsonFileName = (codeFileName) => {
        const baseName = codeFileName.split('.')[0];
        return `${baseName}.json`;
    };

    // 🆕 JSON 파일 생성/업데이트 함수 (문자열 그대로 저장)
    const createOrUpdateJsonFileRaw = async (jsonFileName, content) => {
        try {
            // savedFiles에서 기존 JSON 파일 찾기
            const existingFileIndex = savedFiles.findIndex(f => f.name === jsonFileName);

            if (existingFileIndex >= 0) {
                // 기존 파일 업데이트
                const updatedFiles = [...savedFiles];
                updatedFiles[existingFileIndex] = {
                    name: jsonFileName,
                    code: content,
                    type: 'json'
                };
                setSavedFiles(updatedFiles);
                console.log(`✅ JSON 파일 업데이트됨: ${jsonFileName}`);
            } else {
                // 새 JSON 파일 생성
                const newJsonFile = {
                    name: jsonFileName,
                    code: content,
                    type: 'json'
                };
                setSavedFiles(prev => [...prev, newJsonFile]);
                console.log(`✅ JSON 파일 생성됨: ${jsonFileName}`);
            }

            return content;
        } catch (error) {
            console.error('❌ JSON 파일 생성/업데이트 실패:', error);
            throw error;
        }
    };

    // 🆕 개선된 시각화 클릭 핸들러
    const handleVisualizationClick = async () => {
        if (!code.trim()) {
            alert('시각화할 코드를 먼저 작성해주세요.');
            return;
        }

        const fileType = getFileType(fileName);
        setCurrentFileType(fileType);

        if (fileType === 'json') {
            // JSON 파일인 경우: API 호출 없이 에디터 내용을 직접 파싱
            console.log('📄 JSON 파일 시각화 - API 호출 없음');
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
            // 코드 파일인 경우: API 호출 후 AST 부분만 JSON 파일로 생성/덮어쓰기
            console.log('💻 코드 파일 시각화 - API 호출 후 AST만 JSON 생성');

            try {
                // API 호출
                const requestBody = {
                    code: code,
                    input: input,
                    lang: mapLanguageToAPI(selectedLanguage)
                };

                console.log('🚀 시각화 API 호출:', requestBody);

                const response = await fetch(`${config.API_BASE_URL}/api/code/visualize`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody),
                });

                if (!response.ok) {
                    throw new Error(`API 요청 실패: ${response.status} ${response.statusText}`);
                }

                const apiResponse = await response.json();
                console.log('✅ API 응답 수신:', apiResponse);

                // AST 부분만 추출
                let visualizationData = apiResponse.ast || "AST 데이터가 없습니다.";

                if (typeof visualizationData === 'string') {
                    // 앞부분 제거
                    if (visualizationData.startsWith('```json\n')) {
                        visualizationData = visualizationData.slice(7);
                    }
                    // 뒷부분 제거
                    if (visualizationData.endsWith('\n```')) {
                        visualizationData = visualizationData.slice(0, -4);
                    }
                }

                // 매칭되는 JSON 파일명 생성
                const jsonFileName = getMatchingJsonFileName(fileName);

                // AST 데이터를 JSON 파일로 생성/업데이트
                await createOrUpdateJsonFileRaw(jsonFileName, visualizationData);

                // 시각화 모달 열기
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
        const defaultName = `untitled${savedFiles.length + 1}${currentLang.extension}`;
        const newFileName = prompt('새 파일 이름을 입력하세요:', defaultName);

        if (!newFileName) return;

        if (savedFiles.some(file => file.name === newFileName)) {
            alert('이미 존재하는 파일 이름입니다.');
            return;
        }

        const fileType = getFileType(newFileName);
        const newFile = {
            name: newFileName,
            code: fileType === 'json' ? '{}' : currentLang.template,
            type: fileType
        };

        setSavedFiles([...savedFiles, newFile]);
        setFileName(newFileName);
        setCode(newFile.code);
        setActiveFile(newFileName);
        setIsSaved(true);
        setCurrentFileType(fileType);

        // 새 파일 생성 시 예제 파일 상태 초기화
        setSelectedJsonData(null);
        setIsExampleFile(false);

        // JSON 파일이 아닌 경우에만 언어 업데이트
        if (fileType !== 'json') {
            const fileExtension = newFileName.split('.').pop().toLowerCase();
            const languageFromExtension = getLanguageFromExtension(fileExtension);
            if (languageFromExtension !== selectedLanguage) {
                setSelectedLanguage(languageFromExtension);
            }
        }

        console.log(`✨ 새 파일 생성: ${newFileName} (타입: ${fileType})`);
    };

    // 나머지 기본 함수들
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

    const mapLanguageToAPI = (langId) => {
        switch (langId) {
            case 'cpp':
                return 'c';
            case 'javascript':
                return 'javascript';
            default:
                return langId;
        }
    };

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
        editor.updateOptions(editorOptions);

        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function() {
            handleSave();
        });

        monaco.editor.defineTheme('custom-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [],
            colors: {
                'editor.lineHighlightBackground': '#7e57c233',
                'editor.lineHighlightBorder': '#7e57c244'
            }
        });

        monaco.editor.defineTheme('custom-light', {
            base: 'vs',
            inherit: true,
            rules: [],
            colors: {
                'editor.lineHighlightBackground': '#6a47b811',
                'editor.lineHighlightBorder': '#6a47b822'
            }
        });

        const updateEditorTheme = (monaco) => {
            if (!monaco && !editorRef.current) return;
            const m = monaco || window.monaco;
            if (m) {
                m.editor.setTheme(isDarkMode ? 'custom-dark' : 'custom-light');
            }
        };

        updateEditorTheme(monaco);

        setTimeout(() => {
            try {
                editor.layout();
            } catch (e) {
                console.warn('에디터 초기 레이아웃 설정 중 오류:', e);
            }
        }, 100);
    };

    const handleSave = () => {
        if (!isLoggedIn) {
            alert("로그인 후 이용 가능한 기능입니다.");
            return;
        }

        try {
            const currentCode = editorRef.current.getValue();
            const existingFileIndex = savedFiles.findIndex((file) => file.name === fileName);

            if (existingFileIndex >= 0) {
                const updatedFiles = [...savedFiles];
                updatedFiles[existingFileIndex] = {
                    name: fileName,
                    code: currentCode,
                    type: getFileType(fileName)
                };
                setSavedFiles(updatedFiles);
            } else {
                setSavedFiles([...savedFiles, {
                    name: fileName,
                    code: currentCode,
                    type: getFileType(fileName)
                }]);
            }

            setIsSaved(true);
            setCode(currentCode);
            toast("파일이 저장되었습니다.");
        } catch (error) {
            console.error('파일 저장 중 오류:', error);
            toast("저장 중 오류가 발생했습니다.");
        }
    };

    const handleRun = async () => {
        if (currentFileType === 'json') {
            alert('JSON 파일은 실행할 수 없습니다. 시각화 버튼을 사용해주세요.');
            return;
        }

        setIsRunning(true);
        setOutput("실행 중...");

        try {
            const currentCode = editorRef.current.getValue();
            const requestBody = {
                code: currentCode,
                input: input,
                lang: mapLanguageToAPI(selectedLanguage)
            };

            const response = await fetch(config.API_ENDPOINTS.RUN_CODE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
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

            if (isLoggedIn) {
                setActiveFile(newFileName);
                const newFile = { name: newFileName, code: newLanguage.template, type: 'code' };
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

    const toast = (message) => {
        const existingToasts = document.querySelectorAll('.toast');
        existingToasts.forEach(toast => {
            document.getElementById('toast-container')?.removeChild(toast);
        });

        const toastElement = document.createElement('div');
        toastElement.className = 'toast toast-success';
        toastElement.textContent = message;

        const container = document.getElementById('toast-container');
        if (!container) {
            const newContainer = document.createElement('div');
            newContainer.id = 'toast-container';
            document.body.appendChild(newContainer);
            newContainer.appendChild(toastElement);
        } else {
            container.appendChild(toastElement);
        }

        setTimeout(() => {
            toastElement.classList.add('show');
        }, 10);

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

    // useEffect들
    useEffect(() => {
        applyResizeObserverFix();
        const updateAllEditorLayouts = () => {
            if (editorRef.current) {
                window.requestAnimationFrame(() => {
                    try {
                        editorRef.current.layout();
                    } catch (e) {
                        console.warn('에디터 레이아웃 업데이트 중 오류:', e);
                    }
                });
            }
        };
        window.addEventListener('resize', updateAllEditorLayouts);
        const initialLayoutTimeout = setTimeout(() => {
            updateAllEditorLayouts();
        }, 500);
        return () => {
            window.removeEventListener('resize', updateAllEditorLayouts);
            clearTimeout(initialLayoutTimeout);
        };
    }, []);

    // 🆕 사이드바 접힘/펼침 상태 변경 시 에디터 레이아웃 업데이트 (즉시 + 점진적)
    useEffect(() => {
        const updateEditorLayout = () => {
            if (editorRef.current) {
                // 즉시 한 번 업데이트 (애니메이션과 동시에 시작)
                try {
                    editorRef.current.layout();
                    console.log('🔄 사이드바 상태 변경 - 즉시 에디터 레이아웃 업데이트');
                } catch (e) {
                    console.warn('사이드바 상태 변경 즉시 에디터 레이아웃 업데이트 중 오류:', e);
                }

                // 애니메이션 중간에 한 번 더 업데이트 (150ms)
                setTimeout(() => {
                    try {
                        editorRef.current.layout();
                        console.log('🔄 사이드바 애니메이션 중간 - 에디터 레이아웃 업데이트');
                    } catch (e) {
                        console.warn('사이드바 애니메이션 중간 에디터 레이아웃 업데이트 중 오류:', e);
                    }
                }, 150);

                // 애니메이션 완료 후 최종 업데이트 (350ms)
                setTimeout(() => {
                    try {
                        editorRef.current.layout();
                        console.log('🔄 사이드바 애니메이션 완료 - 최종 에디터 레이아웃 업데이트');
                    } catch (e) {
                        console.warn('사이드바 애니메이션 완료 시 에디터 레이아웃 업데이트 중 오류:', e);
                    }
                }, 350);
            }
        };

        updateEditorLayout();
    }, [isLeftPanelCollapsed]); // 사이드바 접힘 상태가 변경될 때마다 실행

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
                            console.log(`🎨 Monaco Editor 테마 변경: ${newTheme}`);
                        }
                    }
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });

        return () => {
            observer.disconnect();
        };
    }, [isDarkMode]);

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
        };

        checkAuth();
        const interval = setInterval(checkAuth, 500);

        // 🎨 Feather Icons 렌더링
        const renderFeatherIcons = () => {
            if (window.feather) {
                window.feather.replace();
            }
        };

        // 컴포넌트 마운트 후 아이콘 렌더링
        setTimeout(renderFeatherIcons, 100);

        return () => clearInterval(interval);
    }, [isLoggedIn, username]);

    // 🆕 ModernSidebar 렌더링 함수
    const renderModernSidebar = () => {
        const myFiles = savedFiles.filter(f => f.type === 'code');
        const myJsonFiles = savedFiles.filter(f => f.type === 'json');
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
                                    <span className="section-title">내 파일</span>
                                </button>

                                {sidebarSections.myFiles && (
                                    <div className="section-content">
                                        {myFiles.map((file) => (
                                            <div
                                                key={file.name}
                                                className={`file-item ${activeFile === file.name ? 'active' : ''}`}
                                                onClick={() => handleFileSelect(file.name)}
                                            >
                                                {getFileIcon(file.name)}
                                                <span className="file-name">{file.name}</span>
                                            </div>
                                        ))}
                                        {myJsonFiles.map((file) => (
                                            <div
                                                key={file.name}
                                                className={`file-item json-file ${activeFile === file.name ? 'active' : ''}`}
                                                onClick={() => handleFileSelect(file.name)}
                                            >
                                                {getFileIcon(file.name)}
                                                <span className="file-name">{file.name}</span>
                                                {/* 🔄 JSON 배지 제거 */}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* 코드 예제 섹션 */}
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
                                            <div
                                                key={`code-${index}`}
                                                className={`file-item example-file ${fileName === file.name && !activeFile ? 'active' : ''}`}
                                                onClick={() => handleDummyFileSelect(file)}
                                            >
                                                {getFileIcon(file.name)}
                                                <span className="file-name">{file.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* JSON 예제 섹션 */}
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
                                            <div
                                                key={`json-${index}`}
                                                className={`file-item json-file example-file ${fileName === file.name && !activeFile ? 'active' : ''}`}
                                                onClick={() => handleDummyFileSelect(file)}
                                            >
                                                {getFileIcon(file.name)}
                                                <span className="file-name">{file.name}</span>
                                                {/* 🔄 JSON 배지 제거 */}
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
                                    <p>🔒 로그인 후 이용 가능합니다</p>
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
                                <span>파일 수:</span>
                                <span>{savedFiles.length}</span>
                            </div>
                            <div className="stat-row">
                                <span>활성 파일:</span>
                                <span className="active-file-name">{activeFile || fileName}</span>
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
                            onClick={() => {
                                setIsLeftPanelCollapsed(!isLeftPanelCollapsed);
                                // 상태 변경과 동시에 즉시 에디터 레이아웃 업데이트
                                if (editorRef.current) {
                                    try {
                                        editorRef.current.layout();
                                        console.log('🔄 햄버거 버튼 클릭 - 즉시 에디터 레이아웃 업데이트');
                                    } catch (e) {
                                        console.warn('햄버거 버튼 클릭 후 에디터 레이아웃 업데이트 중 오류:', e);
                                    }
                                }
                            }}
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
                                />
                                <button className="save-button" onClick={handleSave}>
                                    저장
                                </button>
                                <span className={`save-indicator ${isSaved ? 'saved' : ''}`}>
                                    {isSaved && '✓'}
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
                        <div className="monaco-editor-wrapper">
                            <Editor
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
                                    automaticLayout: true, // 🔄 자동 레이아웃 활성화
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