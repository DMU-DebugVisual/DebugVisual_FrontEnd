export function promptLogin(message = "로그인이 필요합니다.", options = {}) {
    let resolvedMessage = message;
    let resolvedOptions = options;

    if (typeof message === "object" && message !== null) {
        resolvedOptions = message;
        resolvedMessage = message.message || "로그인이 필요합니다.";
    }

    const { redirectTo } = resolvedOptions || {};
    if (redirectTo) {
        try {
            sessionStorage.setItem("dv:postLoginRedirect", redirectTo);
        } catch (error) {
            console.warn("Failed to persist post-login redirect path", error);
        }
    }

    window.dispatchEvent(new CustomEvent("dv:open-login-modal", {
        detail: {
            message: resolvedMessage,
            redirectTo: resolvedOptions?.redirectTo || null,
        },
    }));
    window.dispatchEvent(new Event("dv:login-requested"));
    if (resolvedMessage) {
        console.info(resolvedMessage);
    }
}
