// src/components/codecast/api/roomAdmin.js
const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://52.79.145.160:8080';

async function req(path, { method = 'GET', token, body } = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(text || `HTTP ${res.status}`);
    }
    try { return await res.json(); } catch { return {}; }
}

/** 방에서 참가자 강퇴 */
export function kickParticipant({ token, roomId, targetUserId }) {
    return req(`/api/collab/rooms/${encodeURIComponent(roomId)}/participants/${encodeURIComponent(targetUserId)}`, {
        method: 'DELETE',
        token,
    });
}

/** 세션 내 쓰기 권한 부여 (edit) */
export function grantEditPermission({ token, sessionId, targetUserId }) {
    return req(`/api/collab/sessions/${encodeURIComponent(sessionId)}/permissions/${encodeURIComponent(targetUserId)}`, {
        method: 'POST',
        token,
    });
}

/** 세션 내 쓰기 권한 회수 (view) */
export function revokeEditPermission({ token, sessionId, targetUserId }) {
    return req(`/api/collab/sessions/${encodeURIComponent(sessionId)}/permissions/${encodeURIComponent(targetUserId)}`, {
        method: 'DELETE',
        token,
    });
}
