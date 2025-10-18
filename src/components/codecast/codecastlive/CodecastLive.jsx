import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './CodecastLive.css';

import Header from './CodecastHeader';
import Sidebar from './CodecastSidebar';
import CodeEditor from './CodeEditor';
import FilePickerModal from './FilePickerModal';
import CodePreviewList from './CodePreviewList';
import ChatPanel from './ChatPanel';
import useCollabSocket from '../hooks/useCollabSocket';
import { createSession } from '../api/sessions';

import {
    FaCrown,
    FaPenFancy,
    FaEye,
    FaUser,
    FaEllipsisV,
    FaCheck,
    FaComments,
    FaDesktop,
    FaPhoneSlash
} from 'react-icons/fa';

import {
    kickParticipant,
    grantEditPermission,
    revokeEditPermission,
} from '../api/roomAdmin';

// 더미 파일 목록(기존 유지)
const dummyFiles = [
    {
        id: 'f1',
        name: 'BubbleSort.py',
        language: 'python',
        content: `# 버블 정렬 구현
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                if arr[j] > arr[j + 1]:
                    arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

array = [64, 34, 25, 12, 22, 11, 90]
print("정렬 전:", array)
print("정렬 후:", bubble_sort(array.copy()))`,
    },
    {
        id: 'f2',
        name: 'quickSort.js',
        language: 'javascript',
        content: `// 퀵 정렬 구현
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x < pivot);
  const right = arr.slice(1).filter(x => x >= pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
}`,
    },
    {
        id: 'f3',
        name: 'mergeSort.js',
        language: 'javascript',
        content: `// 병합 정렬 구현
function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  let i=0, j=0, out=[];
  while(i<left.length && j<right.length){
    out.push(left[i] < right[j] ? left[i++] : right[j++]);
  }
  return out.concat(left.slice(i)).concat(right.slice(j));
}`,
    },
];

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
    const username = localStorage.getItem('username') || 'anonymous';
    const token = localStorage.getItem('token') || '';
    const userId = username;

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

    const canEdit = currentUser.role === 'host' || currentUser.role === 'edit';

    // 소켓 훅
    const { connect, disconnect, subscribeSystem, subscribeCode, sendCodeUpdate, sendJoin } = useCollabSocket();

    // 유효한 roomId 없으면 뒤로
    useEffect(() => {
        if (!room.id) {
            alert('유효한 방송 코드가 없습니다. 방송 코드로 참여하거나 새 방송을 생성하세요.');
            navigate('/broadcast');
        }
    }, [room.id, navigate]);

    // ====== 헬퍼 ======
    const normalizeUser = (u) => {
        if (!u) return null;
        const id = u.userId ?? u.id ?? u.username ?? u.userName ?? u.name;
        const name = u.userName ?? u.name ?? id;
        return id ? { id, name, role: u.role } : null;
    };

    // ====== 연결 + 구독 ======
    useEffect(() => {
        if (!room.id) return;

        let unsubs = [];
        let gotSystem = false;

        (async () => {
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
                        if (msg?.roomName) setRoom((prev) => ({ ...prev, title: msg.roomName }));

                        const ownerN = normalizeUser(msg?.owner);
                        const listN = Array.isArray(msg?.participants)
                            ? msg.participants.map(normalizeUser).filter(Boolean)
                            : [];

                        setParticipants((prevParticipants) => {
                            const prevMap = new Map(prevParticipants.map(p => [p.id, p]));
                            const newParticipantsMap = new Map();

                            if (ownerN) {
                                const existingHost = prevMap.get(ownerN.id);
                                newParticipantsMap.set(ownerN.id, {
                                    id: ownerN.id,
                                    name: ownerN.name,
                                    role: 'host',
                                    code: existingHost?.code || '',
                                    file: existingHost?.file || null,
                                    stage: existingHost?.stage || 'ready',
                                });
                            }

                            listN
                                .filter((u) => !ownerN || u.id !== ownerN.id)
                                .forEach((u) => {
                                    const existingP = prevMap.get(u.id);
                                    const role = u.role || existingP?.role || 'view';

                                    newParticipantsMap.set(u.id, {
                                        id: u.id,
                                        name: u.name,
                                        role: role,
                                        code: existingP?.code || '',
                                        file: existingP?.file || null,
                                        stage: existingP?.stage || 'ready',
                                    });
                                });

                            const rebuilt = Array.from(newParticipantsMap.values());

                            const me = rebuilt.find((u) => u.id === userId);
                            if (me) {
                                setCurrentUser((prev) => ({
                                    ...prev,
                                    id: me.id,
                                    name: me.name,
                                    role: me.role,
                                    code: prev.code ?? me.code,
                                    file: prev.file ?? me.file,
                                    stage: prev.stage ?? me.stage,
                                }));
                            }

                            if (!rebuilt.length) return prevParticipants.length ? prevParticipants : [initialMe];

                            return rebuilt;
                        });
                    })
                );

                try {
                    console.log('[WS] JOIN publish');
                    sendJoin(room.id, { senderId: userId, senderName: username });
                } catch (e) {
                    console.warn('[WS] JOIN publish failed:', e);
                }

                // 코드 업데이트 구독은 'editing' 상태와 관계없이 항상 유지
                if (sessionId) {
                    unsubs.push(
                        subscribeCode(room.id, sessionId, (msg) => {
                            if (msg?.senderId === userId) return;
                            if (typeof msg?.content === 'string') {
                                const senderId = msg.senderId;
                                const newContent = msg.content;

                                setParticipants((prev) =>
                                    prev.map((p) => {
                                        if (p.id === senderId) {
                                            return {
                                                ...p,
                                                code: newContent,
                                                file: p.file ? { ...p.file, content: newContent } : p.file,
                                                stage: 'editing', // 다른 사람의 업데이트는 공유 중임을 의미
                                            };
                                        }
                                        return p;
                                    })
                                );

                                setCurrentUser((prev) => {
                                    // 현재 사용자가 받은 업데이트를 자신의 상태에 반영
                                    if (prev.id === senderId) {
                                        const nextFile = prev.file ? { ...prev.file, content: newContent } : prev.file;
                                        return { ...prev, code: newContent, file: nextFile, stage: 'editing' };
                                    }

                                    const updatedParticipant = participants.find(p => p.id === prev.id);
                                    return updatedParticipant ? updatedParticipant : prev;
                                });
                            }
                        })
                    );
                }


            } catch (error) {
                console.error('[CodecastLive] Failed to join room or connect socket:', error.message);
            }

            setTimeout(() => {
                if (!gotSystem) console.warn('[WS] WARNING: No RoomStateUpdate received after subscribe.');
            }, 1500);
        })();

        return () => {
            unsubs.forEach((u) => u?.());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room.id, sessionId, userId]);

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
        try {
            if (picked.__new) {
                if (!room?.id) return alert('방 정보가 없습니다. 방을 먼저 생성하세요.');
                if (!token) return alert('로그인이 필요합니다.');

                const data = await createSession({
                    token,
                    roomId: room.id,
                    fileName: picked.name,
                    language: picked.language,
                });

                setSessionId(data.sessionId || data.id);

                setParticipants((prev) =>
                    prev.map((p) =>
                        p.id === currentUser.id
                            ? {
                                ...p,
                                file: { name: picked.name, language: picked.language, content: '' },
                                code: '',
                                stage: 'ready',
                            }
                            : p
                    )
                );
                setCurrentUser((prev) => ({
                    ...prev,
                    file: { name: picked.name, language: picked.language, content: '' },
                    code: '',
                    stage: 'ready',
                }));
            } else {
                setParticipants((prev) =>
                    prev.map((p) =>
                        p.id === currentUser.id
                            ? { ...p, file: picked, code: picked.content ?? '', stage: 'ready' }
                            : p
                    )
                );
                setCurrentUser((prev) => ({
                    ...prev,
                    file: picked,
                    code: picked.content ?? '',
                    stage: 'ready',
                }));
            }

            setShowPicker(false);
        } catch (e) {
            console.error(e);
            alert(`세션 생성 실패: ${e.message || e}`);
        }
    };

    // 파일 선택 모달 열기
    const handleOpenFilePicker = () => {
        if (!canEdit) {
            alert('쓰기 권한이 없어 파일을 선택할 수 없습니다.');
            return;
        }
        setShowPicker(true);
    };

    // ✅ 수정: 공유 시작/중지 토글 (기본 파일도 공유 가능)
    const handleShareToggle = () => {

        // 파일이 없으면 토글 불가 (기본 파일은 항상 있으므로 이 경고는 사실상 작동하지 않음)
        if (!currentUser.file) {
            alert("파일이 없습니다. 파일을 먼저 선택해주세요.");
            return;
        }

        // 쓰기 권한 없으면 토글 불가
        if (!canEdit) {
            alert('쓰기 권한이 없어 공유 상태를 변경할 수 없습니다.');
            return;
        }

        if (currentUser.stage === 'editing') {
            // 공유 중일 때: 공유 중지
            setParticipants((prev) =>
                prev.map((p) =>
                    p.id === currentUser.id
                        ? { ...p, stage: 'ready' } // 상태만 'ready'로 변경
                        : p
                )
            );
            setCurrentUser((prev) => ({ ...prev, stage: 'ready' }));
            // ⚠️ TODO: 서버에 공유 중지 알림 로직 (예: sendStageChange(room.id, userId, 'ready')) 필요
        } else {
            // 공유 중이 아닐 때: 공유 시작
            setParticipants((prev) =>
                prev.map((p) =>
                    p.id === currentUser.id
                        ? { ...p, stage: 'editing' } // 상태를 'editing'으로 변경
                        : p
                )
            );
            setCurrentUser((prev) => ({ ...prev, stage: 'editing' }));
            // ⚠️ TODO: 서버에 공유 시작 알림 로직 (예: sendStageChange(room.id, userId, 'editing')) 필요

            // ✅ 수정: 공유 시작 시 현재 에디터의 코드를 무조건 브로드캐스트하여 프리뷰에 즉시 반영
            if (room.id && sessionId) {
                sendCodeUpdate(room.id, sessionId, { senderId: userId, content: currentUser.code });
            } else {
                // 세션 ID가 없다면 (매우 드문 경우, 새 방 생성 직후 등)
                console.warn("Session ID가 없어 코드 업데이트를 보낼 수 없습니다.");
            }
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
                <FilePickerModal files={dummyFiles} onSelect={handlePickFile} onClose={() => setShowPicker(false)} />
            )}
        </div>
    );
}