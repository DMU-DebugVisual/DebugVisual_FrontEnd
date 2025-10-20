// No changes to apply
import config from "../../../config";

const API_BASE = process.env.REACT_APP_API_BASE_URL || config.API_BASE_URL;

async function request(path, { token, method = "GET", headers = {}, responseType = "json" } = {}) {
    if (!token) {
        throw new Error("인증 토큰이 필요합니다. 다시 로그인해 주세요.");
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method,
        headers: {
            ...(responseType === "json" && method !== "GET" ? { "Content-Type": "application/json" } : {}),
            Authorization: `Bearer ${token}`,
            ...headers,
        },
        credentials: "include",
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
    }

    if (responseType === "text") {
        return res.text();
    }

    try {
        return await res.json();
    } catch (error) {
        throw new Error("서버 응답을 해석할 수 없습니다.");
    }
}

export async function fetchMyFiles({ token }) {
    const data = await request("/api/file/my", { token });

    if (!Array.isArray(data)) {
        throw new Error("파일 목록 응답이 올바르지 않습니다.");
    }

    return data;
}

export async function fetchFileContent({ token, fileUUID }) {
    if (!fileUUID) {
        throw new Error("파일 식별자가 필요합니다.");
    }

    const content = await request(`/api/file/${encodeURIComponent(fileUUID)}/content`, {
        token,
        responseType: "text",
    });

    return content;
}

const EXTENSION_TO_LANGUAGE = {
    py: "python",
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    java: "java",
    c: "c",
    cpp: "c++",
    cc: "c++",
    cs: "csharp",
    go: "go",
    rb: "ruby",
    php: "php",
    swift: "swift",
    kt: "kotlin",
};

export function inferLanguageFromFilename(filename = "") {
    const lastDot = filename.lastIndexOf(".");
    if (lastDot === -1 || lastDot === filename.length - 1) {
        return "plaintext";
    }

    const ext = filename.slice(lastDot + 1).toLowerCase();
    return EXTENSION_TO_LANGUAGE[ext] || "plaintext";
}

export async function saveFile({ token, filename, content = "", fileUUID }) {
    if (!token) {
        throw new Error("인증 토큰이 필요합니다. 다시 로그인해 주세요.");
    }
    if (!filename) {
        throw new Error("파일 이름이 필요합니다.");
    }

    const fileBlob = new Blob([content], { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", new File([fileBlob], filename));

    let url = `${API_BASE}/api/file/upload`;
    if (fileUUID) {
        url += `?fileUUID=${encodeURIComponent(fileUUID)}`;
    }

    const res = await fetch(url, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${token}`,
        },
        credentials: "include",
        body: formData,
    });

    const text = await res.text().catch(() => "");
    if (!res.ok) {
        throw new Error(text || `HTTP ${res.status}`);
    }

    if (!text) {
        throw new Error("파일 저장 응답을 해석할 수 없습니다.");
    }

    const data = JSON.parse(text);
    if (!data?.fileUUID) {
        throw new Error("파일 저장 결과에 fileUUID가 없습니다.");
    }

    return data;
}
