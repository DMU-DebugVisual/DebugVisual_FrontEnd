import React, { useState, useEffect, useCallback } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { FaMoon, FaSun, FaUserCircle, FaBell, FaArrowRight } from "react-icons/fa";
import "./Header.css";
import logoImage from '../../assets/logo3.png';
import config from '../../config';
import { formatAbsoluteDateTimeKo, formatRelativeTimeKo } from "../../utils/date";

const Header = ({ isDark, setIsDark, isLoggedIn, nickname, onLoginModalOpen }) => {
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isNotificationMenuOpen, setIsNotificationMenuOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const notificationsPreviewCount = 7;

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

    useEffect(() => {
        const refreshHandler = () => {
            if (isLoggedIn) {
                fetchNotifications();
            }
        };

        window.addEventListener("dv:notifications-refresh", refreshHandler);
        return () => window.removeEventListener("dv:notifications-refresh", refreshHandler);
    }, [fetchNotifications, isLoggedIn]);

    const toggleNotificationMenu = () => {
        setIsNotificationMenuOpen(!isNotificationMenuOpen);
        setIsUserMenuOpen(false);
    };

    const toggleUserMenu = () => {
        setIsUserMenuOpen(!isUserMenuOpen);
        setIsNotificationMenuOpen(false);
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
        },
        [handleNotificationRead, navigate, resolveNotificationId]
    );

    const handleViewAll = useCallback(() => {
        setIsNotificationMenuOpen(false);
        setIsUserMenuOpen(false);
        navigate("/mypage/notifications");
    }, [navigate]);

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

    const displayNotifications = notifications.slice(0, notificationsPreviewCount);
    const hasNotifications = notifications.length > 0;

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
                                <div className="notification-dropdown">
                                    <div className="notification-dropdown__header">
                                        <span className="notification-dropdown__title">최근 알림</span>
                                        {unreadCount > 0 && (
                                            <span className="notification-dropdown__badge">{unreadCount}개 읽지 않음</span>
                                        )}
                                    </div>
                                    <div className="notification-dropdown__list">
                                        {displayNotifications.length > 0 ? (
                                            displayNotifications.map((notification, index) => {
                                                const notificationId = resolveNotificationId(notification);
                                                const key = notificationId ?? `notification-${index}`;
                                                const isUnread = !notification.read;
                                                const disableRead = !notificationId || !isUnread;
                                                const createdAt = notification.createdAt ?? notification.created_at;
                                                const relativeTime = formatRelativeTimeKo(createdAt);
                                                const absoluteTime = formatAbsoluteDateTimeKo(createdAt);
                                                const absoluteIso = absoluteTime && createdAt
                                                    ? new Date(createdAt).toISOString()
                                                    : "";

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
                                                            <span className="notification-text">{notification.message}</span>
                                                            {(relativeTime || absoluteTime) && (
                                                                <span className="notification-meta">
                                                                    {relativeTime && (
                                                                        <span>{relativeTime}</span>
                                                                    )}
                                                                    {relativeTime && absoluteTime && (
                                                                        <span className="notification-meta__dot">•</span>
                                                                    )}
                                                                    {absoluteTime && (
                                                                        <time dateTime={absoluteIso}>{absoluteTime}</time>
                                                                    )}
                                                                </span>
                                                            )}
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
                                                            {isUnread ? "안읽음" : "읽음"}
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="no-notifications">알림이 없습니다.</div>
                                        )}
                                    </div>
                                    {hasNotifications && (
                                        <div className="notification-footer">
                                            <button type="button" className="notification-view-all" onClick={handleViewAll}>
                                                <span>알림 전체 보기</span>
                                                <FaArrowRight aria-hidden="true" />
                                            </button>
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
                    </>
                )}
            </div>
        </header>
    );
};

export default Header;