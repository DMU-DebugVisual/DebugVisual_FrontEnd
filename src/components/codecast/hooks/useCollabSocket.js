// /components/codecast/hooks/useCollabSocket.js
import { useRef, useCallback } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import config from "../../../config";

const COLLAB_SOCKET_URL = `${config.API_BASE_URL}/ws-collab`;

/**
 * STOMP/SockJS 래퍼 훅 (견고 버전)
 * - connect(token): Promise<void> → STOMP 연결 완료 후 resolve
 * - subscribe(dest, handler): 연결 전 호출 OK (연결 후 자동 구독)
 * - 재연결 시 기존 구독을 먼저 언서브 후 재구독 (중복 방지)
 * - 로깅/에러/플래그 처리 보강
 */
export default function useCollabSocket() {
    const clientRef = useRef(null);

    // [{ dest, handler, key, unsub }]
    const subsRef = useRef([]);

    // connect() 동시 호출 방지
    const isConnectingRef = useRef(false);

    const _makeKey = (dest, handler) => `${dest}::${handler?.toString()}`;

    /** (재)구독 복구 */
    const _resubscribeAll = useCallback(() => {
        const client = clientRef.current;
        if (!client?.connected) return;

        subsRef.current = subsRef.current.map((s) => {
            try { s.unsub?.(); } catch {}
            const sub = client.subscribe(s.dest, (msg) => {
                try {
                    s.handler(JSON.parse(msg.body));
                } catch {
                    s.handler({ raw: msg.body });
                }
            });
            return { ...s, unsub: () => sub?.unsubscribe() };
        });

        console.log("[WS] Resubscribed:", subsRef.current.map((s) => s.dest));
    }, []);

    /** 연결 (연결 완료되면 resolve) */
    const connect = useCallback((token) => {
        // 이미 연결됨
        if (clientRef.current?.connected) {
            return Promise.resolve();
        }

        // 다른 connect 진행 중이면 대기
        if (isConnectingRef.current) {
            return new Promise((resolve) => {
                const t = setInterval(() => {
                    if (clientRef.current?.connected) {
                        clearInterval(t);
                        resolve();
                    }
                }, 50);
            });
        }

        isConnectingRef.current = true;

        return new Promise((resolve, reject) => {
            const sock = new SockJS(COLLAB_SOCKET_URL);

            const client = new Client({
                webSocketFactory: () => sock,
                connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
                heartbeatIncoming: 10000,
                heartbeatOutgoing: 10000,
                reconnectDelay: 3000,
                debug: () => {},
                onConnect: () => {
                    console.log("[WS] Connected");
                    isConnectingRef.current = false; // ✅ 반드시 내려주기
                    _resubscribeAll();
                    resolve();
                },
                onStompError: (frame) => {
                    console.error("[WS] STOMP error:", frame.headers["message"], frame.body);
                    isConnectingRef.current = false;       // ✅ 에러시에도 내려주기
                },
                onWebSocketClose: (ev) => {
                    console.warn("[WS] WebSocket closed:", ev?.reason || ev);
                    isConnectingRef.current = false;       // ✅ 종료시에도 내려주기
                },
                onWebSocketError: (ev) => {
                    console.error("[WS] WebSocket error:", ev);
                    isConnectingRef.current = false;       // ✅ 에러시에도 내려주기
                },
            });

            try {
                client.activate();
                clientRef.current = client;
            } catch (e) {
                isConnectingRef.current = false;
                reject(e);
            }
        });
    }, [_resubscribeAll]);

    /** 연결 해제 */
    const disconnect = useCallback(() => {
        try {
            subsRef.current.forEach((s) => s.unsub?.());
            subsRef.current = [];
            isConnectingRef.current = false;            // ✅ 끊을 때도 내려주기
            clientRef.current?.deactivate();
            clientRef.current = null;
            console.log("[WS] Disconnected");
        } catch (e) {
            console.error("[WS] disconnect error:", e);
        }
    }, []);

    /** 구독 (연결 전 호출해도 OK: 연결되면 자동 구독) */
    const subscribe = useCallback((dest, handler) => {
        const client = clientRef.current;
        const key = _makeKey(dest, handler);

        // 중복 등록 방지
        if (subsRef.current.some((s) => s.key === key)) {
            console.log("[WS] subscribe skipped (duplicate):", dest);
            // 중복 방지를 위해 noop 언서브 반환 (원본만 유지)
            return () => {
                subsRef.current = subsRef.current.filter((s) => s.key !== key);
            };
        }

        const makeRecord = (unsubFn) => ({ dest, handler, key, unsub: unsubFn || null });

        // 아직 연결 전이면 목록에만 추가 → onConnect에서 일괄 구독
        if (!client?.connected) {
            subsRef.current.push(makeRecord(null));
            console.log("[WS] subscribe (queued) →", dest);
            return () => {
                subsRef.current = subsRef.current.filter((s) => s.key !== key);
            };
        }

        // 연결된 상태면 즉시 구독
        const sub = client.subscribe(dest, (msg) => {
            try {
                handler(JSON.parse(msg.body));
            } catch {
                handler({ raw: msg.body });
            }
        });
        const record = makeRecord(() => sub?.unsubscribe());
        subsRef.current.push(record);
        console.log("[WS] subscribe →", dest);

        // 개별 언서브
        return () => {
            try { record.unsub?.(); } catch {}
            subsRef.current = subsRef.current.filter((s) => s.key !== key);
            console.log("[WS] unsubscribe ←", dest);
        };
    }, []);

    /** 발행 (연결 안 되었으면 skip + 경고) */
    const publish = useCallback((dest, bodyObj) => {
        const client = clientRef.current;
        if (!client?.connected) {
            console.warn("[WS] publish skipped (not connected):", dest);
            return;
        }
        console.log("[WS] publish →", dest, bodyObj);
        client.publish({
            destination: dest,
            body: JSON.stringify(bodyObj ?? {}),
        });
    }, []);

    // ===== Helpers (명세에 맞춤) =====
    const subscribeSystem = useCallback(
        (roomId, cb) =>
            subscribe(`/topic/room/${roomId}/system`, (msg) => {
                console.log("[WS] SYSTEM RX:", msg);
                cb(msg);
            }),
        [subscribe]
    );

    const subscribeCode = useCallback(
        (roomId, sessionId, cb) =>
            subscribe(`/topic/room/${roomId}/session/${sessionId}/code`, (msg) => {
                console.log("[WS] CODE RX:", msg);
                cb(msg);
            }),
        [subscribe]
    );

    const sendCodeUpdate = useCallback(
        (roomId, sessionId, payload) =>
            publish(`/app/room/${roomId}/session/${sessionId}/code-update`, payload),
        [publish]
    );

    const sendJoin = useCallback(
        (roomId, payload) => publish(`/app/room/${roomId}/join`, payload),
        [publish]
    );

    return {
        connect,
        disconnect,
        subscribe,
        publish,
        subscribeSystem,
        subscribeCode,
        sendCodeUpdate,
        sendJoin,
    };
}
