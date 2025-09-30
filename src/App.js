import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
// ✅ 1. jwt-decode 라이브러리를 import 합니다.
import { jwtDecode } from "jwt-decode";

import Header from "./components/header/Header";
import Footer from "./components/footer/Footer";
import Main from "./components/mainpage/Main";
import Login from "./components/login/Login";
import SignUp from "./components/signup/SignUp";
import Codecast from "./components/codecast/Codecast";
import Community from "./components/community/Community";
import IDE from "./components/ide/IDE";
import StartCodecast from "./components/codecast/StartCodecast";
import Mypage from "./components/mypage/Mypage";
import MyPageLayout from "./components/mypage/MyPageLayout";
import Settings from "./components/mypage/Settings";
import Shared from "./components/mypage/Shared";
import MyProject from "./components/mypage/MyProject";
import MyCommunity from "./components/mypage/MyCommunity";
import ScrollToTop from "./components/common/ScrollToTop";
import CommunityWrite from "./components/community/CommunityWrite";
import VisualizationModal from "./components/ide/VisualizationModal";
import PostDetail from "./components/community/PostDetail";
import CodecastLive from "./components/codecast/codecastlive/CodecastLive";

function AppContent() {
    const location = useLocation();
    const [isDark, setIsDark] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [nickname, setNickname] = useState('');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const isSignupPage = location.pathname === "/signup";
    const isIdePage = location.pathname.startsWith("/ide");

    // ✅ 2. 토큰 만료를 확인하는 로직으로 교체된 useEffect
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username');

        if (token && storedUsername) {
            try {
                const decodedToken = jwtDecode(token);
                // 토큰의 만료 시간(exp)이 현재 시간보다 이전이면 만료된 것
                if (decodedToken.exp * 1000 < Date.now()) {
                    // 토큰이 만료된 경우, 로그아웃 처리
                    localStorage.removeItem('token');
                    localStorage.removeItem('username');
                    setIsLoggedIn(false);
                    setNickname('');
                    console.log('만료된 토큰이 감지되어 자동 로그아웃되었습니다.');
                } else {
                    // 토큰이 유효한 경우, 로그인 상태로 설정
                    setIsLoggedIn(true);
                    setNickname(storedUsername);
                }
            } catch (error) {
                // 토큰 형식이 잘못된 경우에도 로그아웃 처리
                localStorage.removeItem('token');
                localStorage.removeItem('username');
                setIsLoggedIn(false);
                setNickname('');
                console.error('잘못된 토큰 형식으로 인해 로그아웃 처리:', error);
            }
        } else {
            // 토큰이 없는 경우, 기본적으로 로그아웃 상태
            setIsLoggedIn(false);
            setNickname('');
        }
    }, []); // 앱이 처음 로드될 때 한 번만 실행됩니다.

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") setIsDark(true);
    }, []);

    useEffect(() => {
        document.body.classList.toggle("dark-mode", isDark);
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }, [isDark]);

    return (
        <>
            {!isSignupPage && (
                <Header
                    isDark={isDark}
                    setIsDark={setIsDark}
                    isLoggedIn={isLoggedIn}
                    nickname={nickname}
                    onLoginModalOpen={() => setIsLoginModalOpen(true)}
                />
            )}

            <ScrollToTop />

            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/ide" element={<IDE />} />
                <Route path="/ide/:param" element={<IDE />} />
                <Route path="/ide/:language/:filename" element={<IDE />} />
                <Route path="/community" element={<Community />} />
                <Route path="/community/write" element={<CommunityWrite />} />
                <Route path="/community/post/:id" element={<PostDetail />} />
                <Route path="/broadcast" element={<Codecast />} />
                <Route path="/startbroadcast" element={<StartCodecast />} />
                <Route path="/broadcast/live" element={<CodecastLive isDark={isDark} />} />
                <Route path="/mypage" element={<MyPageLayout nickname={nickname} />}>
                    <Route index element={<Mypage nickname={nickname} />} />
                    <Route path="project" element={<MyProject />} />
                    <Route path="community" element={<MyCommunity />} />
                    <Route path="setting" element={<Settings nickname={nickname} />} />
                    <Route path="shared" element={<Shared />} />
                </Route>
            </Routes>

            {(!isSignupPage && !isIdePage) && <Footer />}

            {isLoginModalOpen && (
                <Login
                    onClose={() => setIsLoginModalOpen(false)}
                    onLoginSuccess={() => {
                        setIsLoggedIn(true);
                        setNickname(localStorage.getItem('username') || '');
                    }}
                />
            )}
        </>
    );
}

export default function App() {
    return (
        <HashRouter>
            <AppContent />
        </HashRouter>
    );
}