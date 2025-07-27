import React from 'react';
import './CodePreviewList.css';

const previews = [
    {
        name: '김코딩',
        // language: 'Python',
        code: `# 버블 정렬 구현\ndef bubble_sort(arr):\n    n = len(arr)\n`,
        isHost: true
    },
    {
        name: '이알고',
        // language: 'JavaScript',
        code: `// 퀵 정렬 구현\nfunction quickSort(arr) {\n    if (arr.length <= 1) {\n        return arr;`,
        isHost: false
    },
    {
        name: '박개발',
        // language: 'JavaScript',
        code: `// 병합 정렬 구현\nfunction mergeSort(arr) {\n    if (arr.length <= 1) {\n        return arr;`,
        isHost: false
    }
];

const CodePreviewList = () => {
    return (
        <section className="code-preview-list">
            {previews.map((p, idx) => (
                <div key={idx} className="code-preview-card">
                    <div className="card-header">
                        <span className="card-name">{p.name}</span>
                        {p.isHost && <span className="card-role">👑</span>}
                    </div>
                    {/*<div className="preview-language">{p.language}</div>*/}
                    <pre className="preview-code">{p.code}</pre>
                </div>
            ))}
        </section>
    );
};

export default CodePreviewList;
