import config from "../../../config";

export async function createRoom({ token, name /*, code*/ }) {
    if (!token) throw new Error("NO_TOKEN");

    // const url = `${config.API_BASE_URL}/api/collab/rooms`;
    const url = `http://52.79.145.160:8080/api/collab/rooms`;

    // 스웨거 기준 roomName만 전송
    const body = { roomName: name };

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        const err = new Error(`HTTP ${res.status}: ${text || res.statusText}`);
        err.status = res.status;
        throw err;
    }

    // { roomId, roomName, ownerId, defaultSessionId }
    return res.json();
}
