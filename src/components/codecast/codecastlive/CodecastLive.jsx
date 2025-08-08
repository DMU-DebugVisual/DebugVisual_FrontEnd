import React, { useState } from 'react';
import './CodecastLive.css';

import Header from './CodecastHeader';
import Sidebar from './CodecastSidebar';
import CodeEditor from './CodeEditor';
import CodePreviewList from './CodePreviewList';

const participants = [
    {
        name: '김코딩',
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
print("정렬 후:", bubble_sort(array.copy()))`,
        role: 'host'
    },
    {
        name: '이알고',
        code: `// 퀵 정렬 구현\nfunction quickSort(arr) {\n    if (arr.length <= 1) {\n        return arr;`,
        role: 'editing'
    },
    {
        name: '박개발',
        code: `// 병합 정렬 구현\nfunction mergeSort(arr) {\n    if (arr.length <= 1) {\n        return arr;`,
        role: 'editing'
    }
];

const CodecastLive = () => {
    const [currentUser, setCurrentUser] = useState(participants[0]);

    return (
        <div className="broadcast-wrapper">
            <Header />
            <div className="main-section">
                <Sidebar
                    participants={participants}
                    currentUser={currentUser}
                />
                <CodeEditor currentUser={currentUser} />
            </div>
            <CodePreviewList
                participants={participants}
                onSelect={(user) => setCurrentUser(user)}
            />
        </div>
    );
};

export default CodecastLive;
