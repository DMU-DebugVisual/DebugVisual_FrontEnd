// sessions.js
import config from "../../../config";

export async function createSession({ token, roomId, fileName, language }) {
    // const url = `${config.API_BASE_URL}/api/collab/rooms/${roomId}/sessions`;
    const url = `http://52.79.145.160:8080/api/collab/rooms/${roomId}/sessions`;

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileName, language }),
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
        const err = new Error(`HTTP ${res.status}${text ? ` - ${text}` : ""}`);
        err.status = res.status;
        throw err;
    }
    return text ? JSON.parse(text) : {};

    // return res.json(); // { sessionId, ... }
}
