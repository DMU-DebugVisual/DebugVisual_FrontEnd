export function promptLogin(message = "로그인이 필요합니다.") {
    alert(message);
    window.dispatchEvent(new CustomEvent("dv:open-login-modal"));
}
