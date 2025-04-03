import React from "react";
import "../styles/Header.css";

const Header = () => {
    return (
        <header className="header">
            <div className="logo">디벅비</div>
            <nav className="nav">
                <ul>
                    <li><a href="#">Home</a></li>
                    <li><a href="#">Group</a></li>
                    <li><a href="#">Community</a></li>
                    <li><a href="#">Setting</a></li>
                </ul>
            </nav>
            <div className="user-info"> </div>
        </header>
    );
};

export default Header;
