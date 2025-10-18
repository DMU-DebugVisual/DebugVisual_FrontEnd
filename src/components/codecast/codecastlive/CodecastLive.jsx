// CodecastLive.jsx
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

// ✅ 추가: 권한/강퇴 API
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
                arr[j], arr[j + 1] = arr[j + 1]
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

export default function CodecastLive({ isDark }) {
    const navigate = useNavigate();
    const location = useLocation();
    const injected = location.state || {};
    const qs = new URLSearchParams(location.search);
    const ridFromQuery = qs.get('rid'); // 초대코드(=roomId)

    // 로그인 유저
    const username = localStorage.getItem('username') || 'anonymous';
    const token = localStorage.getItem('token') || '';
    const userId = username;

    // 권한 기본값
    const isOwner = injected.ownerId && injected.ownerId === username;
    const defaultRole = isOwner ? 'host' : (ridFromQuery ? 'view' : 'host');

    // 전체화면
    const wrapperRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // 👇 추가: 프리뷰 열림/펼침 상태
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
            code: '',
            file: null,
            stage: 'empty',
        }),
        [userId, username, defaultRole]
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
        return id ? { id, name } : null;
    };

    // ====== 연결 + 구독 ======
    useEffect(() => {
        if (!room.id) return;

        let unsubs = [];
        let gotSystem = false;

        (async () => {
            console.log('[WS] effect start', { roomId: room.id, hasToken: !!token });
            await connect(token);
            console.log('[WS] after connect');

            // 시스템 채널 구독
            unsubs.push(
                subscribeSystem(room.id, (msg) => {
                    gotSystem = true;
                    if (msg?.roomName) setRoom((prev) => ({ ...prev, title: msg.roomName }));

                    const ownerN = normalizeUser(msg?.owner);
                    const listN = Array.isArray(msg?.participants)
                        ? msg.participants.map(normalizeUser).filter(Boolean)
                        : [];

                    let rebuilt = [];
                    if (ownerN) {
                        rebuilt.push({
                            id: ownerN.id,
                            name: ownerN.name,
                            role: 'host',
                            code: '',
                            file: null,
                            stage: 'empty',
                        });
                    }
                    rebuilt = rebuilt.concat(
                        listN
                            .filter((u) => !ownerN || u.id !== ownerN.id)
                            .map((u) => ({
                                id: u.id,
                                name: u.name,
                                role: 'view',
                                code: '',
                                file: null,
                                stage: 'empty',
                            }))
                    );

                    if (!rebuilt.length) rebuilt = [initialMe];

                    setParticipants(rebuilt);

                    const me = rebuilt.find((u) => u.id === userId);
                    if (me) {
                        setCurrentUser((prev) => ({
                            ...prev,
                            id: me.id,
                            name: me.name,
                            role: me.role,
                            code: prev.code ?? '',
                            file: prev.file ?? null,
                            stage: prev.stage ?? 'empty',
                        }));
                    } else {
                        setCurrentUser(initialMe);
                    }
                })
            );

            // JOIN(서버가 사용하면 등록됨)
            try {
                console.log('[WS] JOIN publish');
                sendJoin(room.id, { senderId: userId, senderName: username });
            } catch (e) {
                console.warn('[WS] JOIN publish failed:', e);
            }

            // 코드 채널 구독 (세션 존재 시)
            if (sessionId) {
                unsubs.push(
                    subscribeCode(room.id, sessionId, (msg) => {
                        if (msg?.senderId === userId) return;
                        if (typeof msg?.content === 'string') {
                            setCurrentUser((prev) => {
                                const nextFile = prev.file ? { ...prev.file, content: msg.content } : prev.file;
                                return { ...prev, code: msg.content, file: nextFile, stage: 'editing' };
                            });
                            setParticipants((prev) =>
                                prev.map((p) =>
                                    p.id === currentUser.id
                                        ? {
                                            ...p,
                                            code: msg.content,
                                            file: p.file ? { ...p.file, content: msg.content } : p.file,
                                            stage: 'editing',
                                        }
                                        : p
                                )
                            );
                        }
                    })
                );
            }

            setTimeout(() => {
                if (!gotSystem) console.warn('[WS] WARNING: No RoomStateUpdate received after subscribe.');
            }, 1500);
        })();

        return () => {
            unsubs.forEach((u) => u?.());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [room.id, sessionId]);

    // 페이지 언마운트시에만 실제 소켓 종료
    useEffect(() => {
        return () => {
            console.log('[WS] unmount → disconnect()');
            disconnect();
        };
    }, [disconnect]);

    // 에디터 변경 → 서버 publish
    const handleEditorChange = (nextText) => {
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

        if (room.id && sessionId) {
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
                                stage: 'editing',
                            }
                            : p
                    )
                );
                setCurrentUser((prev) => ({
                    ...prev,
                    file: { name: picked.name, language: picked.language, content: '' },
                    code: '',
                    stage: 'editing',
                }));
            } else {
                setParticipants((prev) =>
                    prev.map((p) =>
                        p.id === currentUser.id
                            ? { ...p, file: picked, code: picked.content ?? '', stage: 'editing' }
                            : p
                    )
                );
                setCurrentUser((prev) => ({
                    ...prev,
                    file: picked,
                    code: picked.content ?? '',
                    stage: 'editing',
                }));
            }

            setShowPicker(false);
        } catch (e) {
            console.error(e);
            alert(`세션 생성 실패: ${e.message || e}`);
        }
    };

    // 공유 시작(쓰기 권한 필요)
    const handleStartShare = () => {
        if (!canEdit) {
            alert('쓰기 권한이 없어 세션을 시작할 수 없습니다.');
            return;
        }
        setShowPicker(true);
    };

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

                        // host 승격/강등은 지원하지 않음
                        if (nextRole === 'host') {
                            alert('방장 권한 변경은 지원하지 않습니다.');
                            return;
                        }

                        if (!sessionId) {
                            alert('세션 시작 후에만 권한을 변경할 수 있습니다.');
                            return;
                        }

                        // 방장만 타인 권한 변경 (필요 없으면 제거)
                        if (currentUser.role !== 'host' && currentUser.id !== target.id) {
                            alert('다른 사람 권한은 방장만 변경할 수 있습니다.');
                            return;
                        }

                        const prevParticipants = participants;
                        const prevCurrent = currentUser;

                        // 낙관적 업데이트
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
                            // 성공 → 서버가 system 스냅샷을 쏘면 여기 상태는 곧 동기화됨
                        } catch (e) {
                            // 롤백
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

                        // 낙관적 제거
                        setParticipants((prev) => prev.filter((p) => p.id !== target.id));
                        if (currentUser.id === target.id) {
                            const me = findById(userId) || prevParticipants.find((p) => p.id !== target.id);
                            if (me) setCurrentUser(me);
                        }

                        try {
                            await kickParticipant({ token, roomId: room.id, targetUserId: target.id });
                            // 성공 → 시스템 스냅샷 방송 기대
                        } catch (e) {
                            // 롤백
                            setParticipants(prevParticipants);
                            setCurrentUser(prevCurrent);
                            console.error(e);
                            alert(`강퇴 실패: ${e.message || e}`);
                        }
                    }}
                    onOpenChat={() => setIsChatOpen(true)}
                />

                <div className="editor-area">
                    {currentUser.stage === 'empty' && (
                        <div className="empty-state">
                            <button className="plus-button" onClick={handleStartShare}>＋</button>
                            <p className="empty-help">파일을 선택하세요</p>
                        </div>
                    )}

                    {currentUser.stage === 'editing' && (
                        <CodeEditor
                            file={currentUser.file}
                            onChange={handleEditorChange}
                            currentUser={currentUser}
                            isDark={isDark}
                        />
                    )}
                </div>

                {/* ✅ 프리뷰 스트립: 하단 중앙, 카드만 노출(제목/닫기 X 없음) */}
                {previewOpen && (
                    <div className="preview-strip nochrome" aria-label="participants preview strip">
                        {/* 가로 스크롤 컨테이너 */}
                        <div className="preview-strip-scroller">
                            <CodePreviewList
                                participants={participants}
                                activeName={currentUser.name}
                                onSelect={(userName) => {
                                    const pickedUser = participants.find((p) => p.name === userName);
                                    if (pickedUser) setCurrentUser(pickedUser);
                                }}
                            />
                        </div>
                    </div>
                )}

                {/* ✅ 열림/닫기 토글: 스트립 외부 하단 중앙 탭 */}
                <button
                    className={`preview-toggle ${previewOpen ? 'open' : 'closed'}`}
                    onClick={() => setPreviewOpen((v) => !v)}
                    title={previewOpen ? '프리뷰 숨기기' : '프리뷰 열기'}
                >
                    {previewOpen ? '프리뷰 숨기기 ▾' : '프리뷰 열기 ▴'}
                </button>

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
