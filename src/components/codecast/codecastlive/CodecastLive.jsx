import React, {useEffect, useMemo, useRef, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import './CodecastLive.css';

import Header from './CodecastHeader';
import Sidebar from './CodecastSidebar';
import CodeEditor from './CodeEditor';
import FilePickerModal from './FilePickerModal';
import CodePreviewList from './CodePreviewList'; // ✅ 다시 추가

// 더미 파일 목록
const dummyFiles = [
    { id: 'f1', name: 'BubbleSort.py', language: 'python', content: `# 버블 정렬 구현
def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr

array = [64, 34, 25, 12, 22, 11, 90]
print("정렬 전:", array)
print("정렬 후:", bubble_sort(array.copy()))` },
    { id: 'f2', name: 'quickSort.js', language: 'javascript', content: `// 퀵 정렬 구현
function quickSort(arr) {
  if (arr.length <= 1) return arr;
  const pivot = arr[0];
  const left = arr.slice(1).filter(x => x < pivot);
  const right = arr.slice(1).filter(x => x >= pivot);
  return [...quickSort(left), pivot, ...quickSort(right)];
}` },
    { id: 'f3', name: 'mergeSort.js', language: 'javascript', content: `// 병합 정렬 구현
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
}` },
];

const initialParticipants = [
    { name: '김코딩', role: 'host', code: '' },
    { name: '이알고', role: 'edit', code: '' },
    { name: '박개발', role: 'view', code: '' },
];

const CodecastLive = ({ isDark }) => {
    const navigate = useNavigate();
    const wrapperRef = useRef(null);         // ✅ 전체화면 타깃
    const [isFullscreen, setIsFullscreen] = useState(false); // ✅ 전체화면 상태

    /*const room = useMemo(() => ({ id: 'sess-001', title: '정렬 알고리즘 라이브 코딩' }), []);*/
    // 🔸 방 정보는 수정 가능해야 하므로 useState로
    const [room, setRoom] = useState({
        id: 'sess-001',
        title: '정렬 알고리즘 라이브 코딩',
    });

    // 🔸 단계: 공유 전("empty") ↔ 편집 중("editing")
    const [stage, setStage] = useState('empty');

    // 🔸 파일 선택 모달
    const [showPicker, setShowPicker] = useState(false);

    // 🔸 현재 편집 중인 파일(더미)
    const [file, setFile] = useState(null); // {id, name, language, content}

    // 🔸 참가자 상태(프리뷰에 코드 반영)
    const [participants, setParticipants] = useState(initialParticipants);

    // 🔸 현재 중앙에 띄울 사용자
    const [currentUser, setCurrentUser] = useState(initialParticipants[0]);

    const handleStartShare = () => setShowPicker(true);

    const handlePickFile = (picked) => {
        setFile(picked);
        setShowPicker(false);
        setStage('editing');

        // 현재 사용자 코드에 파일 내용 복사 (프리뷰/사이드바 반영)
        setParticipants((prev) =>
            prev.map((p) => (p.name === currentUser.name ? { ...p, code: picked.content } : p))
        );
        setCurrentUser((prev) => ({ ...prev, code: picked.content }));
    };

    const handleEditorChange = (nextText) => {
        if (file) setFile({ ...file, content: nextText });

        // 현재 사용자 코드도 업데이트해서 프리뷰에 반영
        setCurrentUser((prev) => ({ ...prev, code: nextText }));
        setParticipants((prev) =>
            prev.map((p) => (p.name === currentUser.name ? { ...p, code: nextText } : p))
        );
    };

    const handleLeave = () => {
        if (window.confirm('방송을 종료하고 나가시겠습니까?')) {
            navigate('/broadcast');
        }
    };

    // ✅ 전체화면 토글 (헤더의 포커스 버튼에 연결)
    const toggleFullscreen = async () => {
        const el = wrapperRef.current;
        if (!el) return;

        try {
            if (!document.fullscreenElement) {
                // Safari 대응 (웹킷)
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

    // ✅ 전체화면 변경 이벤트로 상태 동기화
    useEffect(() => {
        const onChange = () => {
            const fullEl =
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.msFullscreenElement;
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

    return (
        // ✅ 전체 화면의 타깃 요소에 ref 부착
        <div ref={wrapperRef} className="broadcast-wrapper">
            <Header
                roomTitle={room.title}
                onTitleChange={(newTitle) => setRoom((prev) => ({ ...prev, title: newTitle }))}
                onLeave={handleLeave}
                isFocusMode={isFullscreen}        // 버튼 상태 표시
                onToggleFocus={toggleFullscreen}  // 전체화면 토글
            />

            <div className="main-section">
                {/*<Sidebar participants={participants} currentUser={currentUser}/>*/}
                <Sidebar
                    participants={participants}
                    currentUser={currentUser}
                    onChangeRole={(name, nextRole) => {
                        setParticipants(prev =>
                            prev.map(p => (p.name === name ? { ...p, role: nextRole } : p))
                        );
                    }}
                    onKick={(name) => {
                        // 프리뷰/현재 사용자 등 동기화
                        setParticipants(prev => prev.filter(p => p.name !== name));
                        if (currentUser.name === name) {
                            // 방출된 유저가 현재 선택 상황이면 첫 사용자로 스위칭
                            const next = participants.find(p => p.name !== name);
                            if (next) setCurrentUser(next);
                        }
                    }}
                />

                <div className="editor-area">
                    {stage === 'empty' && (
                        <div className="empty-state">
                            <button className="plus-button" onClick={handleStartShare}>＋</button>
                            <p className="empty-help">파일을 선택하세요</p>
                        </div>
                    )}

                    {stage === 'editing' && (
                        <CodeEditor
                            file={file}
                            onChange={handleEditorChange}
                            currentUser={currentUser}
                            isDark={isDark}
                        />
                    )}
                </div>
            </div>

            {/* ✅ 하단 프리뷰 리스트 */}
            <CodePreviewList
                participants={participants}
                activeName={currentUser.name}
                onSelect={(userName) => {
                    // 사용자 전환 (선택 사용자로 중앙 에디터 포커스)
                    const pickedUser = participants.find((p) => p.name === userName);
                    if (!pickedUser) return;
                    setCurrentUser(pickedUser);

                    // 현재 선택된 파일이 없고, 해당 사용자가 코드가 있다면 임시 파일 객체 구성
                    if (stage === 'editing') {
                        setFile((prev) =>
                            prev
                                ? {...prev, content: pickedUser.code ?? prev.content}
                                : {id: 'temp', name: 'SharedFile', language: 'python', content: pickedUser.code || ''}
                        );
                    }
                }}
            />

            {showPicker && (
                <FilePickerModal
                    files={dummyFiles}
                    onSelect={handlePickFile}
                    onClose={() => setShowPicker(false)}
                />
            )}
        </div>
    );
};

export default CodecastLive;
