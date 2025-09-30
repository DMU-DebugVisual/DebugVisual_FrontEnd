import React, { useState, useEffect } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { FaMoon, FaSun, FaUserCircle, FaBell } from "react-icons/fa";
import "./Header.css";
import logoImage from '../../assets/logo3.png';
import config from '../../config';

const Header = ({ isDark, setIsDark, isLoggedIn, nickname, onLoginModalOpen }) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const [isViewAll, setIsViewAll] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const notificationsPerPage = 7;

    const navigate = useNavigate();
    const location = useLocation();

    const fetchNotifications = async () => {
        if (!isLoggedIn) return;
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const response = await fetch(`${config.API_BASE_URL}/api/notifications`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const sortedNotifications = data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setNotifications(sortedNotifications);
                const count = data.filter(n => !n.read).length;
                setUnreadCount(count);
            } else {
                console.error("Failed to fetch notifications");
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchNotifications();

            const intervalId = setInterval(() => {
                fetchNotifications();
            }, 10000);

            return () => clearInterval(intervalId);
        }
    }, [isLoggedIn]);

    const toggleNotificationMenu = () => {
        setIsNotificationMenuOpen(!isNotificationMenuOpen);
        setIsUserMenuOpen(false);
        if (isNotificationMenuOpen) {
            setIsViewAll(false);
            setCurrentPage(1);
        }
    };

    const toggleUserMenu = () => {
        setIsUserMenuOpen(!isUserMenuOpen);
        setIsNotificationMenuOpen(false);
        if (isNotificationMenuOpen) {
            setIsViewAll(false);
            setCurrentPage(1);
        }
    };

    const handleNotificationRead = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await fetch(`${config.API_BASE_URL}/api/notifications/${id}/read`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            fetchNotifications();
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const handleViewAll = () => {
        setIsViewAll(true);
        setCurrentPage(1);
    };

    // ✅ 닫기 버튼 핸들러 추가
    const closeViewAll = () => {
        setIsViewAll(false);
        setCurrentPage(1);
    };

    const goToMyPage = () => {
        navigate("/mypage");
        setIsUserMenuOpen(false);
    };

    const handleLogout = () => {
        localStorage.clear();
        if (location.pathname.startsWith("/mypage")) {
            navigate("/");
        } else {
            navigate(location.pathname);
        }
        window.location.reload();
    };

    const displayNotifications = isViewAll
        ? notifications.slice((currentPage - 1) * notificationsPerPage, currentPage * notificationsPerPage)
        : notifications.slice(0, notificationsPerPage);

    const totalPages = Math.ceil(notifications.length / notificationsPerPage);

    return (
        <header className="custom-header">
            <div className="header-left">
                <Link to="/" className="site-logo-link">
                    <img src={logoImage} alt="Zivorp Logo" className="site-logo" />
                </Link>
            </div>

            <nav className="header-nav">
                <NavLink to="/" end>홈</NavLink>
                <NavLink to="/ide">IDE</NavLink>
                <NavLink to="/community">커뮤니티</NavLink>
                <NavLink to="/broadcast">코드 방송</NavLink>
            </nav>

            <div className="header-right">
                <button
                    onClick={() => setIsDark(!isDark)}
                    className="theme-toggle-btn"
                    aria-label="Toggle theme"
                >
                    {isDark ? <FaSun /> : <FaMoon />}
                </button>

                {isLoggedIn ? (
                    <>
                        <div className="notification-container">
                            <button className="notification-btn" onClick={toggleNotificationMenu}>
                                <FaBell size={20} />
                                {unreadCount > 0 && (
                                    <span className="notification-badge">{unreadCount}</span>
                                )}
                            </button>
                            {isNotificationMenuOpen && (
                                <div className={`notification-dropdown ${isViewAll ? 'expanded-dropdown' : ''}`}>
                                    {/* ✅ 전체보기 모드일 때 닫기 버튼 추가 */}
                                    {isViewAll && (
                                        <button className="close-btn" onClick={closeViewAll}>
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    )}
                                    {displayNotifications.length > 0 ? (
                                        displayNotifications.map(notification => (
                                            <div
                                                key={notification.id}
                                                className={`notification-item ${!notification.read ? 'unread' : 'read'}`}
                                                onClick={() => handleNotificationRead(notification.id)}
                                            >
                                                <span className="notification-message">
                                                    {notification.message}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-notifications">알림이 없습니다.</div>
                                    )}
                                    {notifications.length > notificationsPerPage && (
                                        <div className="notification-footer">
                                            {isViewAll ? (
                                                <div className="pagination">
                                                    {Array.from({ length: totalPages }, (_, i) => (
                                                        <button
                                                            key={i + 1}
                                                            onClick={() => setCurrentPage(i + 1)}
                                                            className={currentPage === i + 1 ? 'active' : ''}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <button onClick={handleViewAll}>전체보기</button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="user-menu-container">
                            <span className="user-nickname" onClick={toggleUserMenu}>
                                <FaUserCircle size={24} className="user-icon" />
                                {nickname} 님 ▾
                            </span>
                            {isUserMenuOpen && (
                                <div className="user-dropdown">
                                    <button onClick={goToMyPage}>마이페이지</button>
                                    <button onClick={handleLogout}>로그아웃</button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <button onClick={onLoginModalOpen} className="btn btn-outline">
                            로그인
                        </button>
                        <Link to="/signup" className="btn btn-filled">
                            회원가입
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;