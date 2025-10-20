// sessions.js
import config from "../../../config";

export async function createSession({ token, roomId, sessionName }) {
    const url = `${config.API_BASE_URL}/api/collab/rooms/${roomId}/sessions`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ sessionName }),
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
        const err = new Error(`HTTP ${res.status}${text ? ` - ${text}` : ""}`);
        err.status = res.status;
        throw err;
    }
    return text ? JSON.parse(text) : {};
}

export async function updateSessionStatus({ token, sessionId, status }) {
    const url = `${config.API_BASE_URL}/api/collab/sessions/${sessionId}/status`;

    const res = await fetch(url, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: JSON.stringify({ status }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        const err = new Error(`HTTP ${res.status}${text ? ` - ${text}` : ""}`);
        err.status = res.status;
        throw err;
    }
}
