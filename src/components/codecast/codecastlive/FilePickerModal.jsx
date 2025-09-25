import React from 'react';
import './FilePickerModal.css';

export default function FilePickerModal({ files, onSelect, onClose }) {
    return (
        <div className="fpm-backdrop" onClick={onClose}>
            <div className="fpm-modal" onClick={(e) => e.stopPropagation()}>
                <h3>공유할 파일 선택</h3>
                <ul className="fpm-list">
                    {files.map(f => (
                        <li key={f.id} className="fpm-item" onClick={() => onSelect(f)}>
                            <span className="fpm-name">{f.name}</span>
                            <span className="fpm-lang">{f.language}</span>
                        </li>
                    ))}
                </ul>
                <button className="fpm-close" onClick={onClose}>닫기</button>
            </div>
        </div>
    );
}
