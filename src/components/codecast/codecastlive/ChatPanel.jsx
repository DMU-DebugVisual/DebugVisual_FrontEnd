// ChatPanel.jsx
import React, { useEffect, useRef, useState } from 'react';
import './ChatPanel.css';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';

export default function ChatPanel({ docked = false, open, messages, onClose, onSend }) {
    const [text, setText] = useState('');
    const listRef = useRef(null);

    useEffect(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend?.(text);
        setText('');
    };

    if (docked) {
        // ✅ 도킹 모드: 오른쪽 고정 사이드바
        return (
            <aside className="chat-panel docked" aria-hidden={!open}>
                <div className="chat-header">
                    <h3>방 채팅</h3>
                    <button className="chat-close" onClick={onClose} aria-label="채팅 닫기"><FaTimes /></button>
                </div>

                <div className="chat-list" ref={listRef}>
                    {messages.map((m) => (
                        <div key={m.id} className="chat-item">
                            <div className="chat-user">{m.user}</div>
                            <div className="chat-text">{m.text}</div>
                        </div>
                    ))}
                </div>

                <form className="chat-input" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="메시지를 입력하세요…"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />
                    <button type="submit" className="send-btn" aria-label="전송">
                        <FaPaperPlane />
                    </button>
                </form>
            </aside>
        );
    }
}
