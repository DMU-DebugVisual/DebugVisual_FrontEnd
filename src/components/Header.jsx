import React from "react";
import { Link } from "react-router-dom";
import "../styles/Header.css";
import bug from "../assets/bug.png"

const Header = () => {
    return (
        <header className="header">
            <h1>디벅비</h1>
            <nav className="nav-menu">
                <Link to="#">Home</Link>
                <Link to="#">Group</Link>
                <Link to="#">Community</Link>
                <Link to="#">Makers</Link>
            </nav>
            <img src={bug}/>
        </header>
    );
};

export default Header;
