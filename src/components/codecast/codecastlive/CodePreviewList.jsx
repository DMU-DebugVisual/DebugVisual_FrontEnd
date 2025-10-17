// CodePreviewList.jsx
import React from 'react';
import './CodePreviewList.css';
import { FaCrown, FaPenFancy, FaEye } from 'react-icons/fa';

const RoleIcon = ({ role }) => {
    if (role === 'host') return <FaCrown className="r-icon host" />;
    if (role === 'edit') return <FaPenFancy className="r-icon edit" />;
    return <FaEye className="r-icon view" />;
};

export default function CodePreviewList({ participants, activeName, onSelect }) {
    return (
        <div className="preview-bar">
            <div className="preview-track">
                {participants.map((p) => {
                    const isEditing = p.stage === 'editing';        // ✅ 세션(파일) 선택 여부의 신뢰 가능한 기준
                    const code = (p.code ?? '');                    // ✅ 코드의 최신 소스는 p.code로
                    const previewText = isEditing ? code.slice(0, 120) : '파일 미선택 / 코드 없음';

                    return (
                        <button
                            key={p.name}
                            className={`preview-card ${activeName === p.name ? 'active' : ''}`}
                            onClick={() => onSelect(p.name)}
                            title={`${p.name} 열기`}
                        >
                            <div className="preview-header">
                                <RoleIcon role={p.role} />
                                <span className="p-name">{p.name}</span>
                            </div>

                            <pre className="snippet">{previewText}</pre>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
