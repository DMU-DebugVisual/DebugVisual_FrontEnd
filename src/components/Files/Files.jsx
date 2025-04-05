import React, { useState } from 'react';
import filesStyle from './Files.style';

const Files = () => {
  const [activeFile, setActiveFile] = useState(1);
  const [fileHover, setFileHover] = useState(null);

  // 샘플 파일 목록
  const files = [
    { id: 1, name: '자료구조_for문 실습', type: 'file' },
    { id: 2, name: '알고리즘_정렬', type: 'file' },
    { id: 3, name: '프로젝트_메모', type: 'file' }
  ];

  const handleFileClick = (id) => {
    setActiveFile(id);
  };

  return (
    <>
      <div className="sidebar-content">
        <ul className="files-list">
          {files.map(file => (
            <li
              key={file.id}
              className={`file-item ${activeFile === file.id ? 'active' : ''} ${fileHover === file.id ? 'hover' : ''}`}
              onClick={() => handleFileClick(file.id)}
              onMouseEnter={() => setFileHover(file.id)}
              onMouseLeave={() => setFileHover(null)}
            >
              <span className="file-icon">📄</span> {file.name}
            </li>
          ))}
        </ul>
      </div>
      {filesStyle}
    </>
  );
};

export default Files;
