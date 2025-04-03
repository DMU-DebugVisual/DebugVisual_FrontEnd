import React, { useState } from "react";
import "../styles/HiddenNav.css"; // 스타일 분리

const HiddenNav = () => {
    // 오버레이 열림/닫힘 상태 관리
    const [isOpen, setIsOpen] = useState(false);

    const openOverlay = () => {
        setIsOpen(true);
    };

    const closeOverlay = () => {
        setIsOpen(false);
    };

    return (
        <div>
            {/* 오른쪽 중간쯤에 위치하는 버튼 */}
            <button className="hidden-nav-toggle" onClick={openOverlay}>
                ➕
            </button>

            {/* 오버레이 */}
            {isOpen && (
                <div className="hidden-nav-overlay">
                    <div className="hidden-nav-content">
                        {/* 닫기 버튼 */}
                        <button className="hidden-nav-close" onClick={closeOverlay}>
                            ✕
                        </button>
                        <nav>
                            <ul>
                                <li><a href="#">메뉴 1</a></li>
                                <li><a href="#">메뉴 2</a></li>
                                <li><a href="#">메뉴 3</a></li>
                            </ul>
                        </nav>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HiddenNav;
