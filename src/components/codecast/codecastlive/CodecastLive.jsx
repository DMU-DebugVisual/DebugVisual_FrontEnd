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

    const API_BASE = process.env.REACT_APP_API_BASE_URL || 'http://52.79.145.160:8080';
    const res = await fetch(`${API_BASE}/api/collab/rooms/${encodeURIComponent(roomId)}/participants`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        if (res.status === 409) return { status: 'already_joined' };
        throw new Error(text || `HTTP ${res.status}`);
    }
    return await res.json().catch(() => ({ status: 'success' }));
}


export default function CodecastLive({ isDark }) {
    const navigate = useNavigate();
    const location = useLocation();
    const injected = location.state || {};
    const qs = new URLSearchParams(location.search);
    const ridFromQuery = qs.get('rid');

    // 로그인 유저
    const storedUserId = localStorage.getItem('userId') || '';
    const username = localStorage.getItem('username') || storedUserId || 'anonymous';
    const token = localStorage.getItem('token') || '';
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

    // 참가자/현재 사용자
    const initialMe = useMemo(
        () => ({
            id: userId,
            name: username,
            role: defaultRole,
            code: defaultFile.content,
            file: defaultFile,
            stage: 'ready', // 초기 상태는 'ready'
        }),
        [userId, username, defaultRole, defaultFile]
    );

    const [participants, setParticipants] = useState([initialMe]);
    const [currentUser, setCurrentUser] = useState(initialMe);

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

    const updateParticipants = useCallback(
        (updater) => {
            setParticipants((prev) => {
                const updated = updater(prev);
                setCurrentUser((prevCurrent) => {
                    const me = updated.find((p) => p.id === userId);
                    if (!me) return prevCurrent;
                    return {
                        ...prevCurrent,
                        ...me,
                        code: me.code ?? prevCurrent.code,
                        file: me.file ?? prevCurrent.file,
                        stage: me.stage ?? prevCurrent.stage,
                        role: me.role ?? prevCurrent.role,
                    };
                });
                return updated;
            });
        },
        [setParticipants, setCurrentUser, userId]
    );

    const { connect, disconnect, subscribeSystem, subscribeCode, sendCodeUpdate, publish } = useCollabSocket();

    const applyRoomStateUpdate = useCallback(
        (msg) => {
            if (!msg) return;

            updateParticipants((prev) => {
                const prevMap = new Map(prev.map((p) => [p.id, p]));
                const nextMap = new Map();

                const upsert = (id, draft) => {
                    const prevEntry = prevMap.get(id);
                    nextMap.set(id, {
                        id,
                        name: draft.name || prevEntry?.name || id,
                        role: draft.role || prevEntry?.role || (draft.role === 'host' ? 'host' : 'view'),
                        code: draft.code ?? prevEntry?.code ?? '',
                        file: draft.file ?? prevEntry?.file ?? null,
                        stage: draft.stage || prevEntry?.stage || 'ready',
                    });
                };

                if (msg.owner?.userId) {
                    upsert(msg.owner.userId, {
                        name: msg.owner.userName || msg.owner.userId,
                        role: 'host',
                    });
                }

                (msg.participants || []).forEach((participant) => {
                    if (!participant?.userId) return;
                    upsert(participant.userId, {
                        name: participant.userName || participant.userId,
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
        [initialMe, updateParticipants, userId]
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
                        updateParticipants((prev) =>
                            prev.map((p) =>
                                p.id === ownerId
                                    ? {
                                        ...p,
                                        name: ownerName || p.name,
                                        file: { ...p.file, ...file },
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

                    if (ownerId && stage) {
                        updateParticipants((prev) =>
                            prev.map((p) =>
                                p.id === ownerId
                                    ? {
                                        ...p,
                                        stage,
                                        file: file ? { ...p.file, ...file } : p.file,
                                        code: typeof code === 'string' ? code : p.code,
                                    }
                                    : p
                            )
                        );
                    }
                    break;
                }
                case 'PERMISSION_CHANGED': {
                    const { targetUserId, role } = payload;
                    if (!targetUserId || !role) break;
                    updateParticipants((prev) =>
                        prev.map((p) => (p.id === targetUserId ? { ...p, role } : p))
                    );
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
        [updateParticipants, userId]
    );

    const broadcastSystemEvent = useCallback(
        (type, payload = {}) => {
            if (!room.id) return;
            publish(`/topic/room/${room.id}/system`, {
                type,
                payload,
                senderId: userId,
                senderName: username,
                timestamp: Date.now(),
            });
        },
        [publish, room.id, userId, username]
    );

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

    const canEdit = currentUser.role === 'host' || currentUser.role === 'edit';

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
                    await joinRoomApi(room.id, token);
                    console.log('[API] Room joined successfully or already registered.');
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
                                applyRoomStateUpdate(roomState);
                            } else {
                                handleSystemEvent(msg);
                            }
                            return;
                        }

                        if (msg.roomState) {
                            applyRoomStateUpdate(msg.roomState);
                            return;
                        }

                        if (msg.owner || msg.participants) {
                            applyRoomStateUpdate(msg);
                        }
                    })
                );

                if (sessionId) {
                    unsubs.push(
                        subscribeCode(room.id, sessionId, (msg) => {
                            if (!msg || msg.senderId === userId) return;
                            if (typeof msg.content !== 'string') return;

                            const senderId = msg.senderId;
                            const newContent = msg.content;

                            updateParticipants((prev) =>
                                prev.map((p) =>
                                    p.id === senderId
                                        ? {
                                            ...p,
                                            code: newContent,
                                            file: p.file ? { ...p.file, content: newContent } : p.file,
                                            stage: 'editing',
                                        }
                                        : p
                                )
                            );
                        })
                    );
                }
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
    }, [room.id, sessionId, token, connect, subscribeSystem, subscribeCode, applyRoomStateUpdate, handleSystemEvent, updateParticipants, userId]);

    // 페이지 언마운트시에만 실제 소켓 종료
    useEffect(() => {
        return () => {
            console.log('[WS] unmount → disconnect()');
            disconnect();
        };
    }, [disconnect]);

    // 에디터 변경 → 서버 publish
    const handleEditorChange = (nextText) => {
        // 서버에 보내는 것은 동일
        // 로컬 상태 업데이트
        setCurrentUser((prev) => ({
            ...prev,
            code: nextText,
            file: prev.file ? { ...prev.file, content: nextText } : prev.file,
        }));
        setParticipants((prev) =>
            prev.map((p) =>
                p.id === currentUser.id
                    ? { ...p, code: nextText, file: p.file ? { ...p.file, content: nextText } : p.file }
                    : p
            )
        );

        // 공유 중일 때만 업데이트를 브로드캐스트
        if (room.id && sessionId && currentUser.stage === 'editing') {
            sendCodeUpdate(room.id, sessionId, { senderId: userId, content: nextText });
        }
    };

    // 파일 선택 처리
    const handlePickFile = async (picked) => {
        if (!room?.id) {
            alert('방 정보가 없습니다. 방을 먼저 생성하거나 참여하세요.');
            return;
        }
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

            const sessionResponse = await createSession({
                token,
                roomId: room.id,
                sessionName: selectedFile.name,
            });

            const newSessionId = sessionResponse.sessionId || sessionResponse.id;
            if (!newSessionId) {
                throw new Error('세션 ID를 가져오지 못했습니다.');
            }

            setSessionId(newSessionId);

            updateParticipants((prev) =>
                prev.map((p) =>
                    p.id === currentUser.id
                        ? {
                            ...p,
                            file: selectedFile,
                            code: selectedFile.content ?? '',
                            stage: 'ready',
                        }
                        : p
                )
            );

            setCurrentUser((prev) => ({
                ...prev,
                file: selectedFile,
                code: selectedFile.content ?? '',
                stage: 'ready',
            }));

            broadcastSystemEvent('SESSION_READY', {
                sessionId: newSessionId,
                ownerId: currentUser.id,
                ownerName: currentUser.name,
                file: {
                    id: selectedFile.id,
                    name: selectedFile.name,
                    language: selectedFile.language,
                    fileUUID: selectedFile.fileUUID,
                },
                code: selectedFile.content ?? '',
            });

            setShowPicker(false);
        } catch (error) {
            console.error('[CodecastLive] 세션 준비 실패:', error);
            alert(`세션 준비에 실패했습니다: ${error.message || error}`);
        }
    };

    // 파일 선택 모달 열기
    const handleOpenFilePicker = () => {
        if (!canEdit) {
            alert('쓰기 권한이 없어 파일을 선택할 수 없습니다.');
            return;
        }
        if (!token) {
            alert('로그인이 필요합니다. 다시 로그인 후 이용해주세요.');
            return;
        }
        fetchAvailableFiles();
        setShowPicker(true);
    };

    // 공유 시작/중지 토글 (기본 파일도 공유 가능)
    const handleShareToggle = async () => {
        if (!currentUser.file) {
            alert('파일이 없습니다. 파일을 먼저 선택해주세요.');
            return;
        }
        if (!canEdit) {
            alert('쓰기 권한이 없어 공유 상태를 변경할 수 없습니다.');
            return;
        }
        if (!sessionId) {
            alert('세션이 아직 준비되지 않았습니다. 파일을 다시 선택해 주세요.');
            return;
        }
        if (!token) {
            alert('로그인이 필요합니다. 다시 로그인 후 이용해주세요.');
            return;
        }

        const nextStage = currentUser.stage === 'editing' ? 'ready' : 'editing';
        const prevStage = currentUser.stage;
        const nextStatus = nextStage === 'editing' ? 'ACTIVE' : 'INACTIVE';

        updateParticipants((prev) =>
            prev.map((p) => (p.id === currentUser.id ? { ...p, stage: nextStage } : p))
        );
        setCurrentUser((prev) => ({ ...prev, stage: nextStage }));

        try {
            await updateSessionStatus({ token, sessionId, status: nextStatus });

            const payload = {
                sessionId,
                ownerId: currentUser.id,
                ownerName: currentUser.name,
                stage: nextStage,
                ...(currentUser.file
                    ? {
                        file: {
                            id: currentUser.file.id,
                            name: currentUser.file.name,
                            language: currentUser.file.language,
                            fileUUID: currentUser.file.fileUUID,
                        },
                    }
                    : {}),
                ...(nextStage === 'editing' ? { code: currentUser.code } : {}),
            };

            broadcastSystemEvent('SESSION_STAGE_UPDATE', payload);

            if (nextStage === 'editing' && room.id) {
                sendCodeUpdate(room.id, sessionId, { senderId: userId, content: currentUser.code });
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
                ownerId: currentUser.id,
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

    const findByName = (name) => participants.find((p) => p.name === name);
    const findById = (id) => participants.find((p) => p.id === id);

    // 참가자가 'editing' 상태일 때만 프리뷰에 표시
    // 이제 기본 파일도 공유 가능하므로 defaultFile.id 조건은 제거합니다.
    const isAnyParticipantSharing = participants.some(p => p.stage === 'editing' && p.file !== null);


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
                    participants={participants}
                    currentUser={currentUser}
                    sessionId={sessionId}
                    onChangeRole={async (name, nextRole) => {
                        const target = findByName(name);
                        if (!target) return;

                        if (nextRole === 'host') {
                            alert('방장 권한 변경은 지원하지 않습니다.');
                            return;
                        }

                        if (!sessionId) {
                            alert('세션 시작 후에만 권한을 변경할 수 있습니다.');
                            return;
                        }

                        if (currentUser.role !== 'host' && currentUser.id !== target.id) {
                            alert('다른 사람 권한은 방장만 변경할 수 있습니다.');
                            return;
                        }

                        const prevParticipants = participants;
                        const prevCurrent = currentUser;

                        setParticipants((prev) =>
                            prev.map((p) => (p.id === target.id ? { ...p, role: nextRole } : p))
                        );
                        if (currentUser.id === target.id) {
                            setCurrentUser((prev) => ({ ...prev, role: nextRole }));
                        }

                        try {
                            if (nextRole === 'edit') {
                                await grantEditPermission({ token, sessionId, targetUserId: target.id });
                            } else if (nextRole === 'view') {
                                await revokeEditPermission({ token, sessionId, targetUserId: target.id });
                            }
                            broadcastSystemEvent('PERMISSION_CHANGED', {
                                targetUserId: target.id,
                                role: nextRole,
                            });
                        } catch (e) {
                            setParticipants(prevParticipants);
                            setCurrentUser(prevCurrent);
                            console.error(e);
                            alert(`권한 변경 실패: ${e.message || e}`);
                        }
                    }}
                    onKick={async (name) => {
                        const target = findByName(name);
                        if (!target) return;

                        if (currentUser.role !== 'host') {
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
                        file={currentUser.file}
                        onChange={handleEditorChange}
                        currentUser={currentUser}
                        isDark={isDark}
                        selectFileAction={FileSelectButton}
                    />
                </div>

                {/* 하단 제어 바는 파일이 존재하고 쓰기 권한이 있을 때 표시 */}
                {(currentUser.file && canEdit) && (
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
                                    {currentUser.stage === 'editing' ? '공유 중' : '공유하기'}
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
                                participants={participants.filter(p => p.stage === 'editing')}
                                activeName={currentUser.name}
                                onSelect={(userName) => {
                                    const pickedUser = participants.find((p) => p.name === userName);
                                    if (pickedUser) setCurrentUser(pickedUser);
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