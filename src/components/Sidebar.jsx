import React from "react";
import { Link } from "react-router-dom";

import "../styles/Sidebar.css";

const Sidebar = () => {
    return (
        <aside className="sidebar">
            <Link to="#">로그인</Link>
            <Link to="#">회원가입</Link>
        </aside>
    )
};

export default Sidebar;
