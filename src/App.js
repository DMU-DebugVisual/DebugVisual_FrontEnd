import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

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
import PostDetail from "./components/community/PostDetail"; // ✅ 게시글 상세 컴포넌트 추가

function AppContent() {
    const location = useLocation();
    const [isDark, setIsDark] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [nickname, setNickname] = useState('');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    const isSignupPage = location.pathname === "/signup";

    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username');
        if (token && storedUsername) {
            setIsLoggedIn(true);
            setNickname(storedUsername);
        } else {
            setIsLoggedIn(false);
            setNickname('');
        }
    }, []);

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
                <Route path="/community/post/:id" element={<PostDetail />} /> {/* ✅ 상세 페이지 라우팅 추가 */}
                <Route path="/broadcast" element={<Codecast />} />
                <Route path="/startbroadcast" element={<StartCodecast />} />
                <Route path="/mypage" element={<MyPageLayout nickname={nickname} />}>
                    <Route index element={<Mypage nickname={nickname} />} />
                    <Route path="project" element={<MyProject />} />
                    <Route path="community" element={<MyCommunity />} />
                    <Route path="setting" element={<Settings nickname={nickname} />} />
                    <Route path="shared" element={<Shared />} />
                </Route>
            </Routes>

            {!isSignupPage && <Footer />}

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
