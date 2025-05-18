import {BrowserRouter, Route, Routes} from "react-router-dom";

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
import Settings from "./components/mypage/Settings";
import Shared from "./components/mypage/Shared";
import MyProject from "./components/mypage/MyProject";
import MyCommunity from "./components/mypage/MyCommunity";

function App() {
    return (
        <BrowserRouter basename="/DebugVisual_FrontEnd">
            <Header />
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/ide" element={<IDE />} />
                <Route path="/community" element={<Community />} />
                <Route path="/broadcast" element={<Codecast />} />
                <Route path="/startbroadcast" element={<StartCodecast />} />
                <Route path="/mypage">
                    <Route index element={<Mypage />} />
                    <Route path="project" element={<MyProject />} />
                    <Route path="community" element={<MyCommunity />} />
                    <Route path="setting" element={<Settings />} />
                    <Route path="shared" element={<Shared />} />
                </Route>
            </Routes>
            <Footer />
        </BrowserRouter>
    );
}

export default App;