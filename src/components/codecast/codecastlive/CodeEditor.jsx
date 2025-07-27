import React from 'react';
import './CodeEditor.css';
import { FaPlay } from 'react-icons/fa';

const currentUser = {
    name: '김코딩',
    role: 'host',
    code: `# 버블 정렬 구현
def bubble_sort(arr):
    n = len(arr)

    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                # 두 요소 교환
                arr[j], arr[j + 1] = arr[j + 1], arr[j]

    return arr

# 예제 배열
array = [64, 34, 25, 12, 22, 11, 90]
print("정렬 전:", array)
print("정렬 후:", bubble_sort(array.copy()))`
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

const CodeEditor = () => {
    const handleRun = () => {
        alert("코드 실행 기능은 아직 미구현입니다.");
    };

    return (
        <section className="code-editor">
            <div className="editor-header">
                <div className="current-user-badge">
                    {getIcon(currentUser.role)} {currentUser.name}
                </div>
                <button className="run-button" onClick={handleRun}>
                    <FaPlay/> 실행
                </button>
            </div>
            <pre className="code-block">
                <code>{currentUser.code}</code>
            </pre>
        </section>
    );
};

export default CodeEditor;
