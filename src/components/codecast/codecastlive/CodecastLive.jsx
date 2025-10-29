import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './CodecastLive.css';

import Header from './CodecastHeader';
import Sidebar from './CodecastSidebar';
import CodeEditor from './CodeEditor';
import FilePickerModal from './FilePickerModal';
import CodePreviewList from './CodePreviewList';
import ChatPanel from './ChatPanel';
import useCollabSocket from '../hooks/useCollabSocket';
import { createSession, updateSessionStatus } from '../api/sessions';
import { fetchMyFiles, fetchFileContent, inferLanguageFromFilename, saveFile } from '../api/files';
import config from '../../../config';
import { promptLogin } from '../../../utils/auth';

import {
    FaCheck,
    FaDesktop,
    FaSave,
} from 'react-icons/fa';

import {
    kickParticipant,
    grantEditPermission,
    revokeEditPermission,
} from '../api/roomAdmin';

// 참여 API 호출 함수
async function joinRoomApi(roomId, token) {
    if (!token) throw new Error("인증 토큰이 없습니다. 로그인이 필요합니다.");

    const API_BASE =
        process.env.REACT_APP_API_BASE_URL ||
        config.API_BASE_URL ||
        (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '');
    const res = await fetch(`${API_BASE}/api/collab/rooms/${encodeURIComponent(roomId)}/participants`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
    });

    if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data && typeof data === 'object') {
            return data.status ? data : { status: 'success', ...data };
        }
        return { status: 'success' };
    }

    const text = await res.text().catch(() => '');
    if (res.status === 409) return { status: 'already_joined', message: text };
    if (res.status === 404 || res.status === 403) {
        return { status: 'not_found', message: text || '존재하지 않는 방송 코드입니다.' };
    }
    throw new Error(text || `HTTP ${res.status}`);
}

const pickFirstNonEmptyString = (...values) => {
    for (const value of values) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed) return trimmed;
        }
    }
    return '';
};

const resolveParticipantName = (primary, fallbackEntry, fallbackId) => {
    const name = pickFirstNonEmptyString(
        primary?.displayName,
        primary?.nickName,
        primary?.nickname,
        primary?.profile?.nickname,
        primary?.profile?.name,
        primary?.userName,
        primary?.username,
        primary?.email,
        primary?.userEmail,
    primary?.ownerName,
        primary?.name,
        typeof primary?.userId === 'string' ? primary.userId : null,
        fallbackEntry?.displayName,
        fallbackEntry?.nickName,
        fallbackEntry?.nickname,
        fallbackEntry?.profile?.nickname,
        fallbackEntry?.profile?.name,
        fallbackEntry?.userName,
        fallbackEntry?.username,
        fallbackEntry?.email,
        fallbackEntry?.userEmail,
    fallbackEntry?.ownerName,
        fallbackEntry?.name,
        typeof fallbackEntry?.userId === 'string' ? fallbackEntry.userId : null,
        fallbackId != null ? String(fallbackId) : null
    );

    return name || (fallbackId != null ? String(fallbackId) : '익명 사용자');
};

const resolveParticipantEmail = (primary, fallbackEntry) => {
    return pickFirstNonEmptyString(
        primary?.email,
        primary?.userEmail,
        primary?.contactEmail,
        primary?.ownerEmail,
        fallbackEntry?.email,
        fallbackEntry?.userEmail,
        fallbackEntry?.contactEmail,
        fallbackEntry?.ownerEmail
    );
};


export default function CodecastLive({ isDark }) {
    const navigate = useNavigate();
    const location = useLocation();
    const injected = location.state || {};
    const qs = new URLSearchParams(location.search);
    const ridFromQuery = qs.get('rid');

    // 로그인 유저
    const storedUserId = localStorage.getItem('userId') || '';
    const username = localStorage.getItem('username') || storedUserId || 'anonymous';
    const storedEmail = localStorage.getItem('email') || localStorage.getItem('userEmail') || '';
    const token = localStorage.getItem('token') || '';
    useEffect(() => {
        if (!token) {
            promptLogin('방송에 참여하려면 로그인이 필요합니다.', { redirectTo: '/broadcast' });
            navigate('/broadcast', { replace: true });
        }
    }, [token, navigate]);

    const userId = storedUserId || username;

    // 권한 기본값
    const isOwner = injected.ownerId && injected.ownerId === username;
    const defaultRole = isOwner ? 'host' : (ridFromQuery ? 'view' : 'host');

    // 기본 파일 설정
    const defaultFile = useMemo(() => ({
        id: 'f_default',
        name: `${username}.py`,
        language: 'python',
        content: `# 여기에 코드를 입력하세요`,
    }), [username]);

    // 전체화면
    const wrapperRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // 프리뷰 열림/펼침 상태
    const [previewOpen, setPreviewOpen] = useState(true);

    // 방/세션
    const initialRoomId = injected.roomId || ridFromQuery || null;
    const [room, setRoom] = useState({
        id: initialRoomId,
        title: injected.title || '라이브 방송',
    });
    const [sessionId, setSessionId] = useState(injected.defaultSessionId || null);
    const [sessionOwnerId, setSessionOwnerId] = useState(
        injected.ownerId || (defaultRole === 'host' ? userId : null)
    );

    // 참가자/현재 사용자
    const initialMe = useMemo(
        () => ({
            id: userId,
            name: username,
            displayName: username,
            email: storedEmail,
            role: defaultRole,
            code: defaultFile.content,
            file: defaultFile,
            stage: 'ready',
        }),
        [userId, username, defaultRole, defaultFile, storedEmail]
    );

    const [participants, setParticipants] = useState([initialMe]);
    const [currentUser, setCurrentUser] = useState(initialMe);
    const [activeParticipantId, setActiveParticipantId] = useState(initialMe.id);
    const [hasManualFocus, setHasManualFocus] = useState(false);
    const [selfParticipantId, setSelfParticipantId] = useState(initialMe.id);

    // 채팅
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 1, user: 'SYSTEM', text: ridFromQuery ? '방에 입장했습니다.' : '방이 생성되었습니다.' },
    ]);

    // 파일 선택 모달
    const [showPicker, setShowPicker] = useState(false);
    const [availableFiles, setAvailableFiles] = useState([]);
    const [isLoadingFiles, setIsLoadingFiles] = useState(false);
    const [fileLoadError, setFileLoadError] = useState('');
    const fileContentCacheRef = useRef(new Map());

    // ✅ 세션별 권한: { [sessionId]: { [userId]: 'edit' } }
    const [sessionPermissions, setSessionPermissions] = useState({});

    const updateParticipants = useCallback(
        (updater) => {
            setParticipants((prev) => {
                let nextList = updater(prev);
                let detectedSelfId = null;

                setCurrentUser((prevCurrent) => {
                    const candidates = [
                        nextList.find((p) => p.id === prevCurrent.id),
                        nextList.find((p) => p.id === selfParticipantId),
                        nextList.find((p) => p.id === userId),
                        nextList.find((p) => p.name && p.name === prevCurrent.name),
                        nextList.find((p) => p.name && p.name === username),
                    ].filter(Boolean);

                    const me = candidates[0];
                    if (!me) return prevCurrent;

                    detectedSelfId = me.id || selfParticipantId;

                    return {
                        ...prevCurrent,
                        ...me,
                        id: me.id ?? prevCurrent.id,
                        code: me.code ?? prevCurrent.code,
                        file: me.file ?? prevCurrent.file,
                        stage: me.stage ?? prevCurrent.stage,
                        role: me.role ?? prevCurrent.role,
                    };
                });

                if (detectedSelfId && detectedSelfId !== selfParticipantId) {
                    setSelfParticipantId(detectedSelfId);
                }

                const ensureSelfId = detectedSelfId || selfParticipantId || userId;
                const hasSelf = nextList.some((p) => p.id === ensureSelfId);
                if (!hasSelf) {
                    const fallback =
                        prev.find((p) => p.id === ensureSelfId) ||
                        prev.find((p) => p.id === selfParticipantId) ||
                        prev.find((p) => p.id === userId) ||
                        prev.find((p) => p.name === username) ||
                        null;
                    if (fallback) {
                        nextList = [...nextList, fallback];
                    }
                }

                return nextList;
            });
        },
        [selfParticipantId, userId, username, setSelfParticipantId, setParticipants, setCurrentUser]
    );

    const { connect, disconnect, subscribeSystem, subscribeCode, sendCodeUpdate, publish } = useCollabSocket();

    const ownParticipantId = useMemo(() => selfParticipantId || currentUser.id, [selfParticipantId, currentUser.id]);

    useEffect(() => {
        const effectiveSelfId = selfParticipantId || currentUser.id;
        if (!effectiveSelfId) return;
        if (!sessionOwnerId) return;

        if (currentUser.stage === 'editing' && sessionOwnerId !== effectiveSelfId) {
            setSessionOwnerId(effectiveSelfId);
        }
    }, [currentUser.id, currentUser.stage, selfParticipantId, sessionOwnerId]);

    useEffect(() => {
        const exists = participants.some((p) => p.id === activeParticipantId);
        if (!exists) {
            const ownerParticipant = participants.find((p) => p.id === sessionOwnerId);
            const hostParticipant = participants.find((p) => p.role === 'host');
            const fallbackId = ownerParticipant?.id || hostParticipant?.id || selfParticipantId;
            if (fallbackId) {
                setActiveParticipantId(fallbackId);
            }
            setHasManualFocus(false);
        }
    }, [participants, activeParticipantId, sessionOwnerId, selfParticipantId]);

    const activeParticipant = useMemo(() => {
        const target = participants.find((p) => p.id === activeParticipantId);
        if (target) return target;
        const selfParticipant = participants.find((p) => p.id === selfParticipantId);
        return selfParticipant || participants[0] || null;
    }, [participants, activeParticipantId, selfParticipantId]);

    const applyRoomStateUpdate = useCallback(
        (msg) => {
            if (!msg) return;

            const sessionLike = msg.currentSession || msg.session || msg.activeSession;
            const editIds = new Set();
            let sessionOwnerPatch = null;
            let sessionOwnerResolvedId = null;

            if (sessionLike) {
                const ownerIdFromSession =
                    sessionLike.ownerId || sessionLike.owner?.userId || sessionLike.owner?.id || null;
                const sId = sessionLike.sessionId || sessionLike.id; // ✅ 세션 ID 추출

                if (ownerIdFromSession) {
                    setSessionOwnerId(ownerIdFromSession);
                    sessionOwnerResolvedId = ownerIdFromSession;
                }

                const rawStage = (sessionLike.stage || '').toString().toLowerCase();
                const sessionStatus = (sessionLike.status || sessionLike.stage || '').toString().toUpperCase();
                const isActiveSession = ['ACTIVE', 'EDITING', 'LIVE', 'RUNNING', 'STARTED', 'ON_AIR'].includes(sessionStatus);
                const normalizedStage = rawStage === 'editing'
                    ? 'editing'
                    : rawStage === 'watching'
                        ? 'watching'
                        : rawStage === 'ready'
                            ? 'ready'
                            : (isActiveSession ? 'editing' : 'ready');
                const sessionFile = sessionLike.file || sessionLike.currentFile || null;
                const sessionCode = sessionLike.code ?? sessionLike.content ?? sessionFile?.content;

                if (ownerIdFromSession) {
                    sessionOwnerPatch = {
                        ownerName: sessionLike.ownerName,
                        name: resolveParticipantName(sessionLike.owner, null, ownerIdFromSession),
                        displayName: resolveParticipantName(sessionLike.owner, null, ownerIdFromSession),
                        email: resolveParticipantEmail(sessionLike.owner, null),
                        stage: normalizedStage,
                        sessionId: sId, // ✅ 세션 ID 저장
                        file: sessionFile
                            ? {
                                ...sessionFile,
                                content: typeof sessionCode === 'string' ? sessionCode : sessionFile?.content,
                            }
                            : undefined,
                        code: typeof sessionCode === 'string' ? sessionCode : undefined,
                    };

                    if (isActiveSession) {
                        editIds.add(String(ownerIdFromSession));
                    }
                }

                const candidateEditors = [
                    sessionLike.permissions,
                    sessionLike.editorIds,
                    sessionLike.editors,
                    sessionLike.editUserIds,
                    msg.permissions,
                    msg.editorIds,
                    msg.editors,
                    msg.editUserIds,
                ];

                candidateEditors.forEach((entry) => {
                    if (!entry) return;
                    if (Array.isArray(entry)) {
                        entry.forEach((value) => {
                            if (typeof value === 'string' || typeof value === 'number') {
                                editIds.add(String(value));
                            } else if (value && typeof value === 'object') {
                                if (value.userId) {
                                    editIds.add(String(value.userId));
                                }
                                if (value.id) {
                                    editIds.add(String(value.id));
                                }
                            }
                        });
                    } else if (typeof entry === 'object') {
                        Object.entries(entry).forEach(([key, value]) => {
                            let lowered = '';
                            if (typeof value === 'string') {
                                lowered = value.toLowerCase();
                            } else if (value && typeof value === 'object') {
                                const derivedRole = value.role || value.permission || value.type;
                                if (typeof derivedRole === 'string') {
                                    lowered = derivedRole.toLowerCase();
                                } else if (value.canEdit || value.write === true) {
                                    lowered = 'edit';
                                }
                            } else {
                                lowered = String(value).toLowerCase();
                            }

                            if (['edit', 'editing', 'write', 'editor', 'editable'].includes(lowered)) {
                                editIds.add(String(key));
                            }
                        });
                    }
                });

                // ✅ 세션별 권한표 동기화
                if (sId) {
                    setSessionPermissions((prev) => ({
                        ...prev,
                        [sId]: Array.from(editIds).reduce((acc, id) => {
                            acc[String(id)] = 'edit';
                            return acc;
                        }, {})
                    }));
                }
            }

            updateParticipants((prev) => {
                const prevMap = new Map(prev.map((p) => [p.id, p]));
                const nextMap = new Map();

                const upsert = (id, draft) => {
                    const prevEntry = prevMap.get(id);
                    const normalizedId = String(id);
                    const isHost = draft.role === 'host' || prevEntry?.role === 'host';
                    const resolvedName = resolveParticipantName(draft, prevEntry, id);
                    const resolvedEmail = resolveParticipantEmail(draft, prevEntry) || prevEntry?.email || '';

                    nextMap.set(id, {
                        id,
                        name: resolvedName,
                        displayName: resolvedName,
                        email: resolvedEmail,
                        role: isHost
                            ? 'host'
                            : editIds.has(normalizedId)
                                ? 'edit'
                                : draft.role || prevEntry?.role || 'view',
                        code: draft.code ?? prevEntry?.code ?? '',
                        file: draft.file ?? prevEntry?.file ?? null,
                        stage: draft.stage || prevEntry?.stage || 'ready',
                        sessionId: draft.sessionId ?? prevEntry?.sessionId ?? null, // ✅ 보존
                    });
                };

                if (sessionOwnerResolvedId && sessionOwnerPatch) {
                    upsert(sessionOwnerResolvedId, sessionOwnerPatch);
                }

                if (msg.owner) {
                    const ownerParticipantId = msg.owner.userId || msg.owner.id;
                    if (ownerParticipantId) {
                        upsert(ownerParticipantId, {
                            ownerName: msg.owner.displayName || msg.owner.userName,
                            name: resolveParticipantName(msg.owner, null, ownerParticipantId),
                            displayName: resolveParticipantName(msg.owner, null, ownerParticipantId),
                            email: resolveParticipantEmail(msg.owner, null),
                            role: 'host',
                        });
                    }
                }

                (msg.participants || []).forEach((participant) => {
                    const participantId = participant?.userId || participant?.id;
                    if (!participantId) return;
                    upsert(participantId, {
                        displayName: participant.displayName || participant.ownerName,
                        ownerName: participant.ownerName,
                        name: resolveParticipantName(participant, null, participantId),
                        email: resolveParticipantEmail(participant, null),
                        stage: participant.stage,
                        code: typeof participant.code === 'string' ? participant.code : undefined,
                        file: participant.file,
                        role: participant.role,
                    });
                });

                if (!nextMap.has(userId)) {
                    const prevSelf = prevMap.get(userId) || initialMe;
                    nextMap.set(userId, { ...prevSelf });
                }

                const ordered = Array.from(nextMap.values()).sort((a, b) => {
                    if (a.role === 'host' && b.role !== 'host') return -1;
                    if (b.role === 'host' && a.role !== 'host') return 1;
                    if (a.id === userId && b.id !== userId) return -1;
                    if (b.id === userId && a.id !== userId) return 1;
                    return a.name.localeCompare(b.name);
                });

                return ordered;
            });
        },
        [initialMe, setSessionOwnerId, updateParticipants, userId]
    );

    const handleSystemEvent = useCallback(
        (event) => {
            if (!event?.type) return;
            const { type, payload = {} } = event;

            switch (type) {
                case 'SESSION_READY': {
                    const { sessionId: nextSessionId, ownerId, ownerName, file = {}, code } = payload;
                    if (nextSessionId) {
                        setSessionId((prev) => (prev === nextSessionId ? prev : nextSessionId));
                    }

                    if (ownerId) {
                        setSessionOwnerId(ownerId);
                    }

                    if (ownerId) {
                        const nameDraft = {
                            ownerName,
                            displayName: ownerName,
                            name: ownerName,
                        };

                        updateParticipants((prev) =>
                            prev.map((p) =>
                                p.id === ownerId
                                    ? {
                                        ...p,
                                        name: resolveParticipantName(nameDraft, p, ownerId),
                                        displayName: resolveParticipantName(nameDraft, p, ownerId),
                                        sessionId: nextSessionId || p.sessionId, // ✅
                                        file: file
                                            ? { ...p.file, ...file, ...(typeof code === 'string' ? { content: code } : {}) }
                                            : p.file,
                                        code: typeof code === 'string' ? code : file?.content ?? p.code ?? '',
                                        stage: 'ready',
                                    }
                                    : p
                            )
                        );
                    }
                    break;
                }
                case 'SESSION_STAGE_UPDATE': {
                    const { sessionId: nextSessionId, ownerId, stage, file, code } = payload;
                    if (nextSessionId && ownerId !== userId) {
                        setSessionId((prev) => (prev === nextSessionId ? prev : nextSessionId));
                    }

                    if (ownerId) {
                        setSessionOwnerId(ownerId);
                    }

                    if (ownerId && stage) {
                        const nameDraft = {
                            ownerName: payload.ownerName,
                            displayName: payload.ownerName,
                            name: payload.ownerName,
                        };

                        updateParticipants((prev) =>
                            prev.map((p) =>
                                p.id === ownerId
                                    ? {
                                        ...p,
                                        name: resolveParticipantName(nameDraft, p, ownerId),
                                        displayName: resolveParticipantName(nameDraft, p, ownerId),
                                        sessionId: nextSessionId || p.sessionId, // ✅
                                        stage,
                                        file: file
                                            ? { ...p.file, ...file, ...(typeof code === 'string' ? { content: code } : {}) }
                                            : p.file,
                                        code: typeof code === 'string' ? code : p.code,
                                    }
                                    : p
                            )
                        );
                    }
                    break;
                }
                case 'PERMISSION_CHANGED': {
                    const { sessionId: sid, targetUserId, role } = payload;
                    if (!targetUserId || !role) break;

                    // ✅ 세션 권한표 갱신 (전역 role은 수정하지 않음)
                    if (sid) {
                        setSessionPermissions((prev) => {
                            const cur = { ...(prev[sid] || {}) };
                            if (role === 'edit') cur[targetUserId] = 'edit';
                            else delete cur[targetUserId];
                            return { ...prev, [sid]: cur };
                        });
                    }
                    break;
                }
                case 'FILE_SAVED': {
                    const { ownerId, fileUUID } = payload;
                    if (!ownerId || !fileUUID) break;
                    updateParticipants((prev) =>
                        prev.map((p) =>
                            p.id === ownerId && p.file
                                ? { ...p, file: { ...p.file, fileUUID } }
                                : p
                        )
                    );
                    break;
                }
                default:
                    break;
            }
        },
        [updateParticipants, userId, setSessionOwnerId]
    );

    const broadcastSystemEvent = useCallback(
        (type, payload = {}) => {
            if (!room.id) return;
            publish(`/topic/room/${room.id}/system`, {
                type,
                payload,
                senderId: selfParticipantId || userId,
                senderName: username,
                timestamp: Date.now(),
            });
        },
        [publish, room.id, selfParticipantId, userId, username]
    );

    const roomStateHandlerRef = useRef(applyRoomStateUpdate);
    const systemEventHandlerRef = useRef(handleSystemEvent);

    useEffect(() => {
        roomStateHandlerRef.current = applyRoomStateUpdate;
    }, [applyRoomStateUpdate]);

    useEffect(() => {
        systemEventHandlerRef.current = handleSystemEvent;
    }, [handleSystemEvent]);

    const fetchAvailableFiles = useCallback(async () => {
        if (!token) {
            setAvailableFiles([]);
            return;
        }

        setIsLoadingFiles(true);
        setFileLoadError('');

        try {
            const list = await fetchMyFiles({ token });

            const mapped = list.map((file) => ({
                id: file.fileUUID,
                fileUUID: file.fileUUID,
                name: file.originalFileName,
                language: inferLanguageFromFilename(file.originalFileName),
                isServerFile: true,
            }));

            setAvailableFiles(mapped);

            const nextCache = new Map();
            mapped.forEach((file) => {
                if (file.fileUUID && fileContentCacheRef.current.has(file.fileUUID)) {
                    nextCache.set(file.fileUUID, fileContentCacheRef.current.get(file.fileUUID));
                }
            });
            fileContentCacheRef.current = nextCache;
        } catch (error) {
            console.error('[CodecastLive] 파일 목록 로드 실패:', error);
            setFileLoadError(error.message || '파일 목록을 가져오는 데 실패했습니다.');
        } finally {
            setIsLoadingFiles(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAvailableFiles();
    }, [fetchAvailableFiles]);

    // 유효한 roomId 없으면 뒤로
    useEffect(() => {
        if (!room.id) {
            alert('유효한 방송 코드가 없습니다. 방송 코드로 참여하거나 새 방송을 생성하세요.');
            navigate('/broadcast');
        }
    }, [room.id, navigate]);

    // ====== 연결 + 구독 ======
    useEffect(() => {
        if (!room.id) return;

        let unsubs = [];
        let gotSystem = false;

        const setup = async () => {
            try {
                if (token && room.id) {
                    console.log('[API] Joining room via REST API:', room.id);
                    const joinResult = await joinRoomApi(room.id, token);
                    if (joinResult?.status === 'not_found') {
                        alert(joinResult.message || '존재하지 않는 방송 코드입니다.');
                        navigate('/broadcast', { replace: true });
                        return;
                    }
                    console.log('[API] Room joined successfully or already registered.', joinResult);
                }

                console.log('[WS] effect start', { roomId: room.id, hasToken: !!token });
                await connect(token);
                console.log('[WS] after connect');

                unsubs.push(
                    subscribeSystem(room.id, (msg) => {
                        gotSystem = true;
                        if (!msg) return;

                        if (msg.roomName) {
                            setRoom((prev) => ({ ...prev, title: msg.roomName }));
                        }

                        if (msg.type) {
                            const type = String(msg.type).toUpperCase();
                            if (type === 'ROOM_STATE_UPDATE' || type === 'ROOM_STATE') {
                                const roomState = msg.payload?.roomState || msg.payload || {};
                                roomStateHandlerRef.current?.(roomState);
                            } else {
                                systemEventHandlerRef.current?.(msg);
                            }
                            return;
                        }

                        if (msg.roomState) {
                            roomStateHandlerRef.current?.(msg.roomState);
                            return;
                        }

                        if (msg.owner || msg.participants) {
                            roomStateHandlerRef.current?.(msg);
                        }
                    })
                );
            } catch (error) {
                console.error('[CodecastLive] Failed to join room or connect socket:', error.message);
            }

            setTimeout(() => {
                if (!gotSystem) console.warn('[WS] WARNING: No RoomStateUpdate received after subscribe.');
            }, 1500);
        };

        setup();

        return () => {
            unsubs.forEach((u) => u?.());
        };
    }, [room.id, token, connect, subscribeSystem, navigate]);

    const findById = (id) => participants.find((p) => p.id === id);

    const isViewingSelf = activeParticipant?.id === ownParticipantId;

    const roomOwnerId = useMemo(() => {
        const host = participants.find((p) => p.role === 'host');
        if (host) return host.id;
        if (currentUser.role === 'host') return currentUser.id;
        return injected.ownerId || null;
    }, [participants, injected.ownerId, currentUser.id, currentUser.role]);

    // ✅ 포커스된 세션만 계산 (권한 제외)
    const focusedSessionId = useMemo(() => {
        const focused = participants.find((p) => p.id === activeParticipantId);
        return focused?.sessionId || null;
    }, [activeParticipantId, participants]);

    const focusedOwnerId = useMemo(() => {
        const focused = participants.find((p) => p.id === activeParticipantId);
        return focused?.id || null;
    }, [activeParticipantId, participants]);

    // ✅ activeSessionMeta: 세션/오너만 담기
    const activeSessionMeta = useMemo(() => {
        if (!focusedSessionId) return null;
        return { sessionId: focusedSessionId, ownerId: focusedOwnerId };
    }, [focusedSessionId, focusedOwnerId]);

    // ✅ 현재 세션의 권한표만 별도로 조회
    const activeSessionPermissions = useMemo(() => {
        return focusedSessionId ? (sessionPermissions[focusedSessionId] || {}) : {};
    }, [focusedSessionId, sessionPermissions]);

    // 코드 구독은 세션ID/오너만 의존 (권한 변화로 재구독 방지)
    useEffect(() => {
        if (!room.id || !activeSessionMeta?.sessionId) return;

        let unsubscribe = null;
        let cancelled = false;

        const setupCodeSubscription = async () => {
            try {
                await connect(token);
                if (cancelled) return;
                unsubscribe = subscribeCode(room.id, activeSessionMeta.sessionId, (msg) => {
                    if (!msg) return;
                    const senderId = msg.senderId;
                    if (senderId === userId) return;
                    if (typeof msg.content !== 'string') return;

                    const newContent = msg.content;
                    const targetParticipantId = activeSessionMeta.ownerId;

                    updateParticipants((prev) =>
                        prev.map((p) =>
                            p.id === targetParticipantId
                                ? {
                                    ...p,
                                    code: newContent,
                                    file: p.file ? { ...p.file, content: newContent } : p.file,
                                    stage: 'editing',
                                }
                                : p
                        )
                    );
                });
            } catch (error) {
                if (!cancelled) {
                    console.error('[CodecastLive] Failed to subscribe code channel:', error.message);
                }
            }
        };

        setupCodeSubscription();

        return () => {
            cancelled = true;
            unsubscribe?.();
        };
    }, [room.id, activeSessionMeta?.sessionId, activeSessionMeta?.ownerId, token, connect, subscribeCode, updateParticipants, userId]);

    // 페이지 언마운트시에만 실제 소켓 종료
    useEffect(() => {
        return () => {
            console.log('[WS] unmount → disconnect()');
            disconnect();
        };
    }, [disconnect]);

    // ✅ 에디터 쓰기 가능 여부: 세션별 권한표 사용
    const hasEditPermissionOnActive = useMemo(() => {
        if (!activeParticipant) return false;
        if (!activeSessionMeta) return false;
        if (activeParticipant.stage !== 'editing') return false;

        // 세션 소유자(프리뷰의 주인) 본인은 항상 편집 가능
        if (activeSessionMeta.ownerId === ownParticipantId) return true;

        // 방장 특권 유지(원치 않으면 제거)
        const isRoomOwner = roomOwnerId === ownParticipantId;
        if (isRoomOwner) return true;

        // ✅ 세션별 권한표에서 확인
        return activeSessionPermissions[ownParticipantId] === 'edit';
    }, [activeParticipant, activeSessionMeta, ownParticipantId, roomOwnerId, activeSessionPermissions]);

    const editorReadOnly = !(isViewingSelf || hasEditPermissionOnActive);

    // 에디터 변경 → 서버 publish
    const handleEditorChange = (nextText) => {
        if (editorReadOnly) return;

        const ownId = selfParticipantId || currentUser.id;
        const targetParticipantId = activeParticipant?.id;
        if (!targetParticipantId) return;

        setParticipants((prev) =>
            prev.map((p) =>
                p.id === targetParticipantId
                    ? { ...p, code: nextText, file: p.file ? { ...p.file, content: nextText } : p.file }
                    : p
            )
        );

        if (targetParticipantId === ownId) {
            setCurrentUser((prev) => ({
                ...prev,
                code: nextText,
                file: prev.file ? { ...prev.file, content: nextText } : prev.file,
            }));
        }

        const targetSessionId = activeSessionMeta?.sessionId || sessionId;

        if (room.id && targetSessionId && activeParticipant?.stage === 'editing') {
            sendCodeUpdate(room.id, targetSessionId, {
                senderId: ownId,
                targetParticipantId,
                sessionId: targetSessionId,
                content: nextText,
            });
        }
    };

    // 사이드바 표시용 역할 계산: 현재 세션 권한표 반영
    const sidebarViewParticipants = useMemo(() => {
        const ownerId = activeSessionMeta?.ownerId;
        const perms = activeSessionPermissions || {};
        return participants.map((p) => {
            const idKey = String(p.id);
            const isSessionOwner = !!ownerId && p.id === ownerId;
            const hasEditPermission = perms[p.id] === 'edit' || perms[idKey] === 'edit';
            const sessionRole = isSessionOwner ? 'owner' : hasEditPermission ? 'edit' : 'view';
            const displayName = resolveParticipantName(p, null, p.id);

            return {
                ...p,
                sessionRole,
                isRoomOwner: p.id === roomOwnerId,
                displayName,
                name: displayName,
            };
        });
    }, [participants, activeSessionPermissions, activeSessionMeta?.ownerId, roomOwnerId]);

    // 파일 선택 처리
    const handlePickFile = async (picked) => {
        if (!token) {
            alert('로그인이 필요합니다. 다시 로그인 후 이용해주세요.');
            return;
        }

        try {
            let selectedFile;

            if (picked.__new) {
                selectedFile = {
                    id: `new-${Date.now()}`,
                    name: picked.name,
                    language: picked.language,
                    content: '',
                    fileUUID: null,
                    isServerFile: false,
                };
            } else {
                const fileUUID = picked.fileUUID || picked.id;
                let fileContent = fileUUID ? fileContentCacheRef.current.get(fileUUID) : null;

                if (!fileContent && fileUUID) {
                    fileContent = await fetchFileContent({ token, fileUUID });
                    fileContentCacheRef.current.set(fileUUID, fileContent);
                }

                selectedFile = {
                    ...picked,
                    fileUUID,
                    content: fileContent ?? '',
                };
            }

            await initializeSessionWithFile(selectedFile);
            setShowPicker(false);
        } catch (error) {
            console.error('[CodecastLive] 세션 준비 실패:', error);
            alert(`세션 준비에 실패했습니다: ${error.message || error}`);
        }
    };

    // 파일 선택 모달 열기
    const handleOpenFilePicker = () => {
        if (!token) {
            alert('로그인이 필요합니다. 다시 로그인 후 이용해주세요.');
            return;
        }
        fetchAvailableFiles();
        setShowPicker(true);
    };

    // 공유 시작/중지 토글 (기본 파일도 공유 가능)
    const handleShareToggle = async () => {
        if (!token) {
            alert('로그인이 필요합니다. 다시 로그인 후 이용해주세요.');
            return;
        }

        const ownId = selfParticipantId || currentUser.id;
        const viewingOwnIde = activeParticipantId === ownId;
        if (!viewingOwnIde) {
            alert('자신의 IDE 화면을 보고 있을 때만 방송을 시작하거나 중지할 수 있습니다.');
            return;
        }

        let ensuredSessionId = sessionId;
        let preparedFile = currentUser.file;
        const ownsCurrentSession = sessionOwnerId && (sessionOwnerId === (selfParticipantId || currentUser.id));
        try {
            if (!ensuredSessionId || !ownsCurrentSession) {
                const baseFile = currentUser.file || {
                    ...defaultFile,
                    content: currentUser.code ?? defaultFile.content ?? '',
                };
                const { sessionId: createdId, file } = await initializeSessionWithFile(baseFile);
                ensuredSessionId = createdId;
                preparedFile = file;
            }
        } catch (error) {
            console.error('[CodecastLive] 세션 준비 실패:', error);
            alert(`세션 준비에 실패했습니다: ${error.message || error}`);
            return;
        }

        setActiveParticipantId(selfParticipantId || currentUser.id);
        setHasManualFocus(false);

        const nextStage = currentUser.stage === 'editing' ? 'ready' : 'editing';
        const prevStage = currentUser.stage;
        const nextStatus = nextStage === 'editing' ? 'ACTIVE' : 'INACTIVE';

        updateParticipants((prev) =>
            prev.map((p) =>
                p.id === (selfParticipantId || currentUser.id)
                    ? { ...p, stage: nextStage }
                    : p
            )
        );
        setCurrentUser((prev) => ({ ...prev, stage: nextStage }));

        if (nextStage === 'editing') {
            setSessionOwnerId(selfParticipantId || currentUser.id);
        }

        try {
            await updateSessionStatus({ token, sessionId: ensuredSessionId, status: nextStatus });

            const payload = {
                sessionId: ensuredSessionId,
                ownerId: selfParticipantId || currentUser.id,
                ownerName: currentUser.name,
                stage: nextStage,
                ...((preparedFile || currentUser.file)
                    ? {
                        file: {
                            id: (preparedFile || currentUser.file).id,
                            name: (preparedFile || currentUser.file).name,
                            language: (preparedFile || currentUser.file).language,
                            fileUUID: (preparedFile || currentUser.file).fileUUID,
                        },
                    }
                    : {}),
                ...(nextStage === 'editing' ? { code: currentUser.code } : {}),
            };

            broadcastSystemEvent('SESSION_STAGE_UPDATE', payload);

            if (nextStage === 'editing' && room.id) {
                sendCodeUpdate(room.id, ensuredSessionId, {
                    senderId: selfParticipantId || currentUser.id,
                    content: currentUser.code,
                });
            }
        } catch (error) {
            console.error('[CodecastLive] 세션 상태 업데이트 실패:', error);
            updateParticipants((prev) =>
                prev.map((p) => (p.id === currentUser.id ? { ...p, stage: prevStage } : p))
            );
            setCurrentUser((prev) => ({ ...prev, stage: prevStage }));
            alert(`공유 상태 변경에 실패했습니다: ${error.message || error}`);
        }
    };

    const handleSaveCurrentFile = async () => {
        if (!currentUser.file) {
            alert('저장할 파일이 없습니다.');
            return;
        }
        if (!token) {
            alert('로그인이 필요합니다. 다시 로그인 후 이용해주세요.');
            return;
        }

        try {
            const result = await saveFile({
                token,
                filename: currentUser.file.name,
                content: currentUser.code ?? '',
                fileUUID: currentUser.file.fileUUID,
            });

            const nextFile = {
                ...currentUser.file,
                id: result.fileUUID,
                fileUUID: result.fileUUID,
                isServerFile: true,
                content: currentUser.code ?? '',
            };

            fileContentCacheRef.current.set(result.fileUUID, currentUser.code ?? '');

            updateParticipants((prev) =>
                prev.map((p) =>
                    p.id === currentUser.id
                        ? { ...p, file: nextFile, code: currentUser.code ?? p.code }
                        : p
                )
            );

            setCurrentUser((prev) => ({
                ...prev,
                file: nextFile,
                code: currentUser.code ?? prev.code,
            }));

            setAvailableFiles((prev) => {
                const exists = prev.some((f) => f.fileUUID === result.fileUUID);
                if (exists) {
                    return prev.map((f) =>
                        f.fileUUID === result.fileUUID
                            ? { ...f, name: nextFile.name, language: nextFile.language, isServerFile: true }
                            : f
                    );
                }

                return [
                    ...prev,
                    {
                        id: result.fileUUID,
                        fileUUID: result.fileUUID,
                        name: nextFile.name,
                        language: nextFile.language,
                        isServerFile: true,
                    },
                ];
            });

            broadcastSystemEvent('FILE_SAVED', {
                ownerId: selfParticipantId || currentUser.id,
                fileUUID: result.fileUUID,
            });

            await fetchAvailableFiles();
            alert('파일이 저장되었습니다.');
        } catch (error) {
            console.error('[CodecastLive] 파일 저장 실패:', error);
            alert(`파일 저장에 실패했습니다: ${error.message || error}`);
        }
    };

    // CodeEditor로 전달할 파일 선택 버튼
    const FileSelectButton = (
        <button
            className="control-btn select-file-btn"
            onClick={handleOpenFilePicker}
            title={"파일 선택 (클릭 시 새 파일 선택 또는 기존 파일 변경)"}
        >
            {'＋ 파일 선택'}
        </button>
    );

    // 포커스 모드
    const toggleFullscreen = async () => {
        const el = wrapperRef.current;
        if (!el) return;

        try {
            if (!document.fullscreenElement) {
                if (el.requestFullscreen) await el.requestFullscreen();
                else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
                else if (el.msRequestFullscreen) el.msRequestFullscreen();
            } else {
                if (document.exitFullscreen) await document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
                else if (document.msExitFullscreen) document.msExitFullscreen();
            }
        } catch (e) {
            console.error('Fullscreen error:', e);
        }
    };

    // 채팅
    const handleSendMessage = (text) => {
        if (!text.trim()) return;
        setMessages((prev) => [...prev, { id: Date.now(), user: currentUser.name, text }]);
    };

    const handleParticipantFocus = useCallback(
        (participantId) => {
            if (!participantId) return;
            if (activeParticipantId === participantId && hasManualFocus) {
                setHasManualFocus(false);
                setActiveParticipantId(selfParticipantId || currentUser.id);
                return;
            }
            setHasManualFocus(true);
            setActiveParticipantId(participantId);
        },
        [activeParticipantId, currentUser.id, hasManualFocus, selfParticipantId, setActiveParticipantId, setHasManualFocus]
    );

    const initializeSessionWithFile = useCallback(
        async (selectedFile) => {
            if (!room?.id) {
                throw new Error('방 정보가 없습니다. 방을 생성하거나 참여한 뒤 다시 시도하세요.');
            }
            if (!token) {
                throw new Error('로그인이 필요합니다. 다시 로그인해 주세요.');
            }

            const normalizedFile = {
                id: selectedFile.id || selectedFile.fileUUID || `local-${Date.now()}`,
                name: selectedFile.name || `${currentUser.name || 'Untitled'}.txt`,
                language: selectedFile.language || 'plaintext',
                content: selectedFile.content ?? currentUser.code ?? '',
                fileUUID: selectedFile.fileUUID ?? null,
                isServerFile: selectedFile.isServerFile ?? false,
            };

            const sessionResponse = await createSession({
                token,
                roomId: room.id,
                sessionName: normalizedFile.name,
            });

            const newSessionId = sessionResponse.sessionId || sessionResponse.id;
            if (!newSessionId) {
                throw new Error('세션 ID를 가져오지 못했습니다.');
            }

            setSessionId(newSessionId);
            setSessionOwnerId(selfParticipantId || currentUser.id);

            updateParticipants((prev) =>
                prev.map((p) =>
                    p.id === (selfParticipantId || currentUser.id)
                        ? {
                            ...p,
                            sessionId: newSessionId, // ✅
                            file: normalizedFile,
                            code: normalizedFile.content ?? p.code ?? '',
                            stage: 'ready',
                        }
                        : p
                )
            );

            // ✅ 세션 권한 초기화: 소유자만 편집 가능
            setSessionPermissions((prev) => ({
                ...prev,
                [newSessionId]: { [selfParticipantId || currentUser.id]: 'edit' }
            }));

            setCurrentUser((prev) => ({
                ...prev,
                file: normalizedFile,
                code: normalizedFile.content ?? prev.code,
                stage: 'ready',
            }));

            setActiveParticipantId(selfParticipantId || currentUser.id);
            setHasManualFocus(false);

            broadcastSystemEvent('SESSION_READY', {
                sessionId: newSessionId,
                ownerId: selfParticipantId || currentUser.id,
                ownerName: currentUser.name,
                file: {
                    id: normalizedFile.id,
                    name: normalizedFile.name,
                    language: normalizedFile.language,
                    fileUUID: normalizedFile.fileUUID,
                },
                code: normalizedFile.content ?? '',
            });

            return { sessionId: newSessionId, file: normalizedFile };
        },
        [broadcastSystemEvent, currentUser.code, currentUser.id, currentUser.name, room?.id, selfParticipantId, token, updateParticipants]
    );

    // 전체화면 상태 동기화
    useEffect(() => {
        const onChange = () => {
            const fullEl =
                document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
            setIsFullscreen(fullEl === wrapperRef.current);
        };
        document.addEventListener('fullscreenchange', onChange);
        document.addEventListener('webkitfullscreenchange', onChange);
        document.addEventListener('MSFullscreenChange', onChange);
        return () => {
            document.removeEventListener('fullscreenchange', onChange);
            document.removeEventListener('webkitfullscreenchange', onChange);
            document.removeEventListener('MSFullscreenChange', onChange);
        };
    }, []);

    // 나가기
    const handleLeave = () => {
        if (window.confirm('방송을 종료하고 나가시겠습니까?')) {
            navigate('/broadcast');
        }
    };

    const previewParticipants = useMemo(
        () => participants.filter((p) => p.stage === 'editing'), [participants]
    );

    // 참가자가 'editing' 상태인지만 확인해 프리뷰를 노출합니다.
    const isAnyParticipantSharing = participants.some((p) => p.stage === 'editing');

    useEffect(() => {
        if (!isAnyParticipantSharing && selfParticipantId && activeParticipantId !== selfParticipantId) {
            setActiveParticipantId(selfParticipantId);
            setHasManualFocus(false);
        }
    }, [isAnyParticipantSharing, activeParticipantId, selfParticipantId]);

    return (
        <div ref={wrapperRef} className="broadcast-wrapper">
            <Header
                roomTitle={room.title}
                onTitleChange={(newTitle) => setRoom((prev) => ({ ...prev, title: newTitle }))}
                onLeave={handleLeave}
                isFocusMode={isFullscreen}
                onToggleFocus={toggleFullscreen}
                inviteCode={room.id}
            />

            <div className={`main-section ${isChatOpen ? 'with-chat' : ''}`}>
                <Sidebar
                    participants={sidebarViewParticipants}   // ✅ 표시용 role 반영
                    currentUserId={currentUser.id}
                    roomOwnerId={roomOwnerId}
                    activeSession={activeSessionMeta}
                    sessionPermissions={activeSessionPermissions}
                    focusedParticipantId={activeParticipantId}
                    onSelectParticipant={handleParticipantFocus}
                    onChangePermission={async (sessionUuid, participantId, nextRole) => {
                        if (!sessionUuid) {
                            alert('세션이 준비된 이후에만 권한을 변경할 수 있습니다.');
                            return;
                        }

                        if (!activeSessionMeta) {
                            alert('활성 세션 정보를 불러오지 못했습니다.');
                            return;
                        }

                        const target = findById(participantId);
                        if (!target) return;

                        const isSessionOwner = activeSessionMeta.ownerId === currentUser.id;
                        const isRoomOwner = roomOwnerId === currentUser.id;
                        if (!isSessionOwner && !isRoomOwner) {
                            alert('세션 소유자 또는 방장만 권한을 변경할 수 있습니다.');
                            return;
                        }

                        if (target.id === activeSessionMeta.ownerId || target.id === roomOwnerId) {
                            alert('세션 소유자 또는 방장의 권한은 변경할 수 없습니다.');
                            return;
                        }

                        try {
                            if (nextRole === 'edit') {
                                await grantEditPermission({ token, sessionId: sessionUuid, targetUserId: target.id });
                            } else {
                                await revokeEditPermission({ token, sessionId: sessionUuid, targetUserId: target.id });
                            }

                            // ✅ 로컬 세션 권한표 갱신 (participants 전역 role은 건드리지 않음)
                            setSessionPermissions((prev) => {
                                const cur = { ...(prev[sessionUuid] || {}) };
                                if (nextRole === 'edit') cur[target.id] = 'edit';
                                else delete cur[target.id];
                                return { ...prev, [sessionUuid]: cur };
                            });

                            // ✅ 세션ID 포함해서 브로드캐스트
                            broadcastSystemEvent('PERMISSION_CHANGED', {
                                sessionId: sessionUuid,
                                targetUserId: target.id,
                                role: nextRole,
                            });
                        } catch (e) {
                            console.error(e);
                            if (String(e?.message || '').includes('403')) {
                                alert('권한 변경 실패: 서버에서 요청을 거부했습니다. (방장 또는 세션 소유자만 변경 가능)');
                            } else {
                                alert(`권한 변경 실패: ${e.message || e}`);
                            }
                        }
                    }}
                    onKick={async (participantId) => {
                        const target = findById(participantId);
                        if (!target) return;

                        if (currentUser.id !== roomOwnerId) {
                            alert('강퇴는 방장만 가능합니다.');
                            return;
                        }
                        if (target.id === currentUser.id) {
                            alert('자기 자신은 강퇴할 수 없습니다.');
                            return;
                        }
                        if (!window.confirm(`${target.name}님을 강퇴할까요?`)) return;

                        const prevParticipants = participants;
                        const prevCurrent = currentUser;

                        setParticipants((prev) => prev.filter((p) => p.id !== target.id));
                        if (currentUser.id === target.id) {
                            const me = findById(userId) || prevParticipants.find((p) => p.id !== target.id);
                            if (me) setCurrentUser(me);
                        }

                        try {
                            await kickParticipant({ token, roomId: room.id, targetUserId: target.id });
                        } catch (e) {
                            setParticipants(prevParticipants);
                            setCurrentUser(prevCurrent);
                            console.error(e);
                            alert(`강퇴 실패: ${e.message || e}`);
                        }
                    }}
                    onOpenChat={() => setIsChatOpen(true)}
                />

                <div className="editor-area">
                    <CodeEditor
                        file={
                            activeParticipant?.file
                                ? { ...activeParticipant.file, content: activeParticipant.file.content ?? activeParticipant.code ?? '' }
                                : undefined}
                        onChange={handleEditorChange}
                        currentUser={activeParticipant || currentUser}
                        readOnly={editorReadOnly}
                        isDark={isDark}
                        selectFileAction={isViewingSelf ? FileSelectButton : null}
                    />
                </div>

                {/* 하단 제어 바는 파일이 존재하고 쓰기 권한이 있을 때 표시 */}
                {currentUser.file && (
                    <div className="broadcast-controls-bar">
                        <div className="left-controls">
                            <button
                                className={`control-btn share-toggle-btn ${currentUser.stage === 'editing' ? 'active' : ''}`}
                                onClick={handleShareToggle}
                                title={currentUser.stage === 'editing' ? '클릭하여 공유 중지' : '클릭하여 방 참가자들에게 코드 공유 시작'}
                            >
                <span className="icon-wrapper">
                  {currentUser.stage === 'editing'
                      ? <FaCheck className="icon check-icon" />
                      : <FaDesktop className="icon" />}
                </span>
                                <span className="text">
                                    {currentUser.stage === 'editing' ? '그만하기' : '공유하기'}
                                </span>
                            </button>
                        </div>
                        <div className="right-controls">
                            <button
                                className="control-btn save-btn"
                                onClick={handleSaveCurrentFile}
                                title="현재 코드를 서버에 저장"
                            >
                <span className="icon-wrapper">
                  <FaSave className="icon" />
                </span>
                                <span className="text">저장하기</span>
                            </button>
                        </div>
                    </div>
                )}

                {(previewOpen && isAnyParticipantSharing) && (
                    <div className="preview-strip nochrome" aria-label="participants preview strip">
                        <div className="preview-strip-scroller">
                            <CodePreviewList
                                participants={previewParticipants}
                                activeParticipantId={activeParticipantId}
                                onSelect={(participantId) => {
                                    handleParticipantFocus(participantId);
                                }}
                            />
                        </div>
                    </div>
                )}

                {isAnyParticipantSharing && (
                    <button
                        className={`preview-toggle ${previewOpen ? 'open' : 'closed'}`}
                        onClick={() => setPreviewOpen((v) => !v)}
                        title={previewOpen ? '프리뷰 숨기기' : '프리뷰 열기'}
                    >
                        {previewOpen ? '프리뷰 숨기기 ▾' : '프리뷰 열기 ▴'}
                    </button>
                )}

                {isChatOpen && (
                    <ChatPanel
                        docked
                        open
                        messages={messages}
                        onClose={() => setIsChatOpen(false)}
                        onSend={handleSendMessage}
                    />
                )}
            </div>

            {showPicker && (
                <FilePickerModal
                    files={availableFiles}
                    loading={isLoadingFiles}
                    error={fileLoadError}
                    onRefresh={fetchAvailableFiles}
                    onSelect={handlePickFile}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
}
