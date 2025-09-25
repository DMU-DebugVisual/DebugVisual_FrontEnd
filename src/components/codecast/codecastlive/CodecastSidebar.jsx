import React from 'react';
import './CodecastSidebar.css';
import { FaCrown, FaPenFancy, FaEye } from 'react-icons/fa';

const IconByRole = ({ role }) => {
    if (role === 'host') return <FaCrown className="participant-icon host" />;
    if (role === 'edit') return <FaPenFancy className="participant-icon edit" />;
    return <FaEye className="participant-icon view" />;
};

export default function CodecastSidebar({ participants, currentUser }) {
    return (
        <aside className="codecast-sidebar">
            <h2 className="codecast-sidebar-title">
                참여자 <span className="count">({participants.length})</span>
            </h2>
            <ul className="participant-list">
                {participants.map((p) => (
                    <li
                        key={p.name}
                        className={`participant-item ${
                            p.name === currentUser.name ? 'active-user' : ''
                        }`}
                    >
                        <IconByRole role={p.role} />
                        <span className="name">{p.name}</span>
                    </li>
                ))}
            </ul>
        </aside>
    );
}
