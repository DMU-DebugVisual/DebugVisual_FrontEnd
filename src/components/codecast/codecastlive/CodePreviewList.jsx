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
                    const hasFile = !!p.file; // 파일 선택 여부
                    const content = p.file?.content ?? '';
                    const hasContent = content.trim().length > 0;

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

                            <pre className="snippet">
                {hasFile
                    ? (hasContent ? content.slice(0, 120) : '') // ✅ 새 파일(빈 내용) → 비워두기
                    : '파일 미선택 / 코드 없음'}                  {/* ✅ 파일 없을 때만 플레이스홀더 */}
              </pre>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
