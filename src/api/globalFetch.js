// src/api/globalFetch.js

// 1. 기존의 window.fetch 함수를 백업해둡니다.
const originalFetch = window.fetch;

// 2. window.fetch 함수를 우리의 감시 기능이 추가된 새 함수로 덮어씁니다.
window.fetch = async (...args) => {
    // 3. 백업해둔 원래 fetch 함수를 호출하여 실제 API 요청을 보냅니다.
    const response = await originalFetch(...args);

    // 4. 응답을 받은 후, 만약 401 에러(토큰 만료)가 발생했다면
    if (response.status === 401) {
        // 이전에 localStorage에 저장된 토큰이 있을 때만 로그아웃 처리
        if (localStorage.getItem('token')) {
            localStorage.removeItem('token');
            localStorage.removeItem('username');

            alert('세션이 만료되었습니다. 다시 로그인해 주세요.');
            // 현재 페이지를 새로고침하여 로그인 상태를 갱신합니다.
            // 로그인 페이지로 강제 이동시키는 것보다 사용자 경험이 더 나을 수 있습니다.
            window.location.reload();
        }
    }

    // 5. 원래 API를 호출했던 곳에 응답을 그대로 돌려줍니다.
    return response;
};