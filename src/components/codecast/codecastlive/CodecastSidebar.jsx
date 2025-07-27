import React from 'react';
import './CodecastSidebar.css';
import { FaCrown, FaPenFancy, FaCircle } from 'react-icons/fa';

const participants = [
    { name: '김코딩', role: 'host' },
    { name: '이알고', role: 'editing' },
    { name: '박개발', role: 'editing' },
    { name: '최자료', role: 'viewer' },
    { name: '정해시', role: 'viewer' }
];

const getIcon = (role) => {
    switch (role) {
        case 'host':
            return <FaCrown className="participant-icon gold" />;
        case 'editing':
            return <FaPenFancy className="participant-icon green" />;
        default:
            return <FaCircle className="participant-icon gray" />;
    }
};

const CodecastSidebar = () => {
    return (
        <aside className="sidebar">
            <h2 className="sidebar-title">참여자 ({participants.length})</h2>
            <ul className="participant-list">
                {participants.map((p, idx) => (
                    <li key={idx} className="participant-item">
                        {getIcon(p.role)}
                        <span>{p.name}</span>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default CodecastSidebar;
