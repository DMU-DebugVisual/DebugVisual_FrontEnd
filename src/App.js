import { HashRouter, Route, Routes } from "react-router-dom";
import { useState, useEffect } from "react";

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


function App() {
    const [isDark, setIsDark] = useState(false);

    // 로그인 상태 관리 추가
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [nickname, setNickname] = useState('');

    // 로그인 상태 확인
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUsername = localStorage.getItem('username');

        console.log('🔍 App.js 로그인 상태 확인:', { token: !!token, username: storedUsername });

        if (token && storedUsername) {
            setIsLoggedIn(true);
            setNickname(storedUsername);
            console.log('✅ App.js에서 로그인 상태로 설정됨');
        } else {
            setIsLoggedIn(false);
            setNickname('');
            console.log('❌ App.js에서 비로그인 상태로 설정됨');
        }
    }, []);

    // 로그인 상태 변경을 감지하기 위한 이벤트 리스너 (선택사항)
    useEffect(() => {
        const handleStorageChange = () => {
            const token = localStorage.getItem('token');
            const storedUsername = localStorage.getItem('username');

            if (token && storedUsername) {
                setIsLoggedIn(true);
                setNickname(storedUsername);
            } else {
                setIsLoggedIn(false);
                setNickname('');
            }
        };

        // storage 이벤트 리스너 추가
        window.addEventListener('storage', handleStorageChange);

        // 클린업
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    useEffect(() => {
        document.body.classList.toggle("dark-mode", isDark);
    }, [isDark]);

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
            setIsDark(true);
        }
    }, []);

    useEffect(() => {
        document.body.classList.toggle("dark-mode", isDark);
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }, [isDark]);

    return (
        <HashRouter>
            <Header
                isDark={isDark}
                setIsDark={setIsDark}
                isLoggedIn={isLoggedIn}
                nickname={nickname}
            />
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />

                <Route path="/ide" element={<IDE />} />
                <Route path="/ide/:param" element={<IDE />} />
                <Route path="/ide/:language/:filename" element={<IDE />} />

                <Route path="/community" element={<Community />} />
                <Route path="/community/write" element={<CommunityWrite />} />  {/* ✅ 추가 */}

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

            <Footer />
        </HashRouter>
    );
}

export default App;