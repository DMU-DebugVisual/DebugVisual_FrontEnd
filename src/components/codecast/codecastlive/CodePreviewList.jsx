// CodePreviewList.jsx
import React from 'react';
import './CodePreviewList.css';
import { FaCrown, FaPenFancy, FaEye } from 'react-icons/fa';

const RoleIcon = ({ role }) => {
    if (role === 'host') return <FaCrown className="r-icon host" />;
    if (role === 'edit') return <FaPenFancy className="r-icon edit" />;
    return <FaEye className="r-icon view" />;
};

export default function CodePreviewList({ participants, activeParticipantId, onSelect }) {
    return (
        <div className="preview-bar">
            <div className="preview-track">
                {participants.map((p) => {
                    const isEditing = p.stage === 'editing';
                    const code = p.code ?? '';
                    const previewText = code
                        ? code.slice(0, 120)
                        : (isEditing ? '공유 중 (내용 없음)' : '파일 미선택 / 코드 없음');
                    const isActive = p.id === activeParticipantId;

                    return (
                        <button
                            key={p.id}
                            className={`preview-card ${isActive ? 'active' : ''}`}
                            onClick={() => onSelect(p.id)}
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
