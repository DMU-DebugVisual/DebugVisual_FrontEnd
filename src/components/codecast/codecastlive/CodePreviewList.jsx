import React from 'react';
import './CodePreviewList.css';

const CodePreviewList = ({ participants, onSelect }) => {
    return (
        <section className="code-preview-list">
            {participants.map((p, idx) => (
                <div
                    key={idx}
                    className="code-preview-card"
                    onClick={() => onSelect(p)}
                    style={{ cursor: 'pointer' }}
                >
                    <div className="card-header">
                        <span className="card-name">{p.name}</span>
                        {p.role === 'host' && <span className="card-role">👑</span>}
                    </div>
                    <pre className="preview-code">{p.code}</pre>
                </div>
            ))}
        </section>
    );
};

export default CodePreviewList;
