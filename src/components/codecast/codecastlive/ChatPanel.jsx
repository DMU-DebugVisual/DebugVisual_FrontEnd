import React, { useEffect, useRef, useState } from 'react';
import './ChatPanel.css';
import { FaTimes, FaPaperPlane } from 'react-icons/fa';

export default function ChatPanel({ open, messages, onClose, onSend }) {
    const [text, setText] = useState('');
    const listRef = useRef(null);

    useEffect(() => {
        // 새 메시지 도착/열릴 때 하단으로 스크롤
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, open]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSend?.(text);
        setText('');
    };

    return (
        <>
            {/* 반투명 배경 (클릭 시 닫힘) */}
            <div className={`chat-backdrop ${open ? 'show' : ''}`} onClick={onClose} />

            {/* 패널 */}
            <aside className={`chat-panel ${open ? 'open' : ''}`} aria-hidden={!open}>
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
        </>
    );
}
