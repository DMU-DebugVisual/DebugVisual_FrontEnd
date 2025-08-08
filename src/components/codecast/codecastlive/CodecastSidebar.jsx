import React from 'react';
import './CodecastSidebar.css';
import { FaCrown, FaPenFancy, FaCircle } from 'react-icons/fa';

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

const CodecastSidebar = ({ participants, currentUser }) => {
    return (
        <aside className="sidebar">
            <h2 className="sidebar-title">참여자 ({participants.length})</h2>
            <ul className="participant-list">
                {participants.map((p, idx) => (
                    <li
                        key={idx}
                        className={`participant-item ${p.name === currentUser.name ? 'active-user' : ''}`}
                    >
                        {getIcon(p.role)}
                        <span>{p.name}</span>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default CodecastSidebar;
