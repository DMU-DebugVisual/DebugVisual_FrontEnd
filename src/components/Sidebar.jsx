import React from "react";
import "../styles/Sidebar.css";

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <button className="sidebar-btn">로그인</button>
            <button className="sidebar-btn">회원가입</button>
        </aside>
    );
};

export default Sidebar;
