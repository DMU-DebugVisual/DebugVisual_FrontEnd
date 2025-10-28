// src/api/globalFetch.js

import { promptLogin } from "../utils/auth";

// 1. 기존의 window.fetch 함수를 백업해둡니다.
const originalFetch = window.fetch;

// 2. window.fetch 함수를 우리의 감시 기능이 추가된 새 함수로 덮어씁니다.
window.fetch = async (...args) => {
    // 3. 백업해둔 원래 fetch 함수를 호출하여 실제 API 요청을 보냅니다.
    const response = await originalFetch(...args);

    // 4. 응답을 받은 후, 인증 실패(401/403)가 발생했다면
    if ((response.status === 401 || response.status === 403) && localStorage.getItem("token")) {
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        localStorage.removeItem("userId");
        localStorage.removeItem("role");

        window.dispatchEvent(new Event("dv:auth-updated"));

        const redirectTo = window.location.hash ? window.location.hash.replace(/^#/, "") || "/" : window.location.pathname || "/";
        promptLogin("세션이 만료되었습니다. 다시 로그인해 주세요.", { redirectTo });
    }

    // 5. 원래 API를 호출했던 곳에 응답을 그대로 돌려줍니다.
    return response;
};