import React, { useState, useEffect, useCallback } from "react";
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

    const fetchNotifications = useCallback(async () => {
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
    }, [isLoggedIn]);

    useEffect(() => {
        if (isLoggedIn) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isLoggedIn, fetchNotifications]);

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

    const resolveNotificationId = useCallback((notification) => {
        if (!notification) return null;
        return (
            notification.id ??
            notification.notificationId ??
            notification.notificationNo ??
            notification.notificationSeq ??
            null
        );
    }, []);

    const handleNotificationRead = useCallback(
        async (id) => {
            if (!id) return false;
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error("Error marking notification as read: missing auth token");
                    return false;
                }
                const response = await fetch(`${config.API_BASE_URL}/api/notifications/${id}/read`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error(`Failed to mark notification as read: ${response.status}`);
                }

                let didMark = false;
                setNotifications((prev) =>
                    prev.map((item) => {
                        const itemId = resolveNotificationId(item);
                        if (itemId && itemId === id && !item.read) {
                            didMark = true;
                            return { ...item, read: true };
                        }
                        return item;
                    })
                );

                if (didMark) {
                    setUnreadCount((prev) => Math.max(prev - 1, 0));
                }

                return true;
            } catch (error) {
                console.error("Error marking notification as read:", error);
                return false;
            }
        },
        [resolveNotificationId]
    );

    const handleNotificationNavigate = useCallback(
        async (notification) => {
            if (!notification) return;

            const notificationId = resolveNotificationId(notification);
            await handleNotificationRead(notificationId);

            if (notification.postId) {
                navigate(`/community/post/${notification.postId}`);
            }

            setIsNotificationMenuOpen(false);
            setIsViewAll(false);
            setCurrentPage(1);
        },
        [handleNotificationRead, navigate, resolveNotificationId]
    );

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
                                        displayNotifications.map((notification, index) => {
                                            const notificationId = resolveNotificationId(notification);
                                            const key = notificationId ?? `notification-${index}`;
                                            const isUnread = !notification.read;
                                            const disableRead = !notificationId || !isUnread;

                                            return (
                                                <div
                                                    key={key}
                                                    className={`notification-item ${isUnread ? 'unread' : 'read'}`}
                                                >
                                                    <button
                                                        type="button"
                                                        className="notification-message"
                                                        onClick={() => handleNotificationNavigate(notification)}
                                                    >
                                                        {notification.message}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="notification-read-btn"
                                                        disabled={disableRead}
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            await handleNotificationRead(notificationId);
                                                        }}
                                                    >
                                                        읽음
                                                    </button>
                                                </div>
                                            );
                                        })
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