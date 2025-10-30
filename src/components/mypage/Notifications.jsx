import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaBell, FaCheckCircle, FaInbox, FaRedo } from "react-icons/fa";
import "./Mypage.css";
import "./Notifications.css";
import config from "../../config";
import { formatAbsoluteDateTimeKo, formatRelativeTimeKo } from "../../utils/date";

const resolveNotificationId = (notification) => {
    if (!notification) return null;
    return (
        notification.id ??
        notification.notificationId ??
        notification.notificationNo ??
        notification.notificationSeq ??
        null
    );
};

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const notificationsPerPage = 8;
    const maxPageButtons = 5;
    const navigate = useNavigate();

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setNotifications([]);
                setError("로그인 후 알림을 확인할 수 있습니다.");
                setCurrentPage(1);
                setLoading(false);
                return;
            }

            const response = await fetch(`${config.API_BASE_URL}/api/notifications`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error(`알림을 불러오지 못했습니다. (status: ${response.status})`);
            }

            const data = await response.json();
            const sorted = [...data].sort(
                (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            setNotifications(sorted);
            setCurrentPage(1);
        } catch (err) {
            console.error("Error fetching notifications:", err);
            setError(err.message || "알림을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
            setCurrentPage(1);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAsRead = useCallback(
        async (notification) => {
            const notificationId = resolveNotificationId(notification);
            if (!notificationId) return;

            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("로그인이 필요합니다.");
                    return;
                }

                const response = await fetch(
                    `${config.API_BASE_URL}/api/notifications/${notificationId}/read`,
                    {
                        method: "PUT",
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error("알림을 읽음 처리하지 못했습니다.");
                }

                let didUpdate = false;
                setNotifications((prev) =>
                    prev.map((item) => {
                        const itemId = resolveNotificationId(item);
                        if (itemId && itemId === notificationId && !item.read) {
                            didUpdate = true;
                            return { ...item, read: true };
                        }
                        return item;
                    })
                );

                if (didUpdate) {
                    setError(null);
                    window.dispatchEvent(new Event("dv:notifications-refresh"));
                }
            } catch (err) {
                console.error("Error marking notification as read:", err);
                setError(err.message || "알림 읽음 처리에 실패했습니다.");
            }
        },
        []
    );

    const handleMarkAll = useCallback(async () => {
        const unread = notifications.filter((item) => !item.read);
        if (unread.length === 0) return;

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("로그인이 필요합니다.");
                return;
            }

            await Promise.all(
                unread.map(async (notification) => {
                    const notificationId = resolveNotificationId(notification);
                    if (!notificationId) return;

                    const response = await fetch(
                        `${config.API_BASE_URL}/api/notifications/${notificationId}/read`,
                        {
                            method: "PUT",
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    );

                    if (!response.ok) {
                        throw new Error("일부 알림을 읽음 처리하지 못했습니다.");
                    }
                })
            );

            setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
            setError(null);
            window.dispatchEvent(new Event("dv:notifications-refresh"));
        } catch (err) {
            console.error("Error marking all notifications as read:", err);
            setError(err.message || "모든 알림을 읽음 처리하지 못했습니다.");
        }
    }, [notifications]);

    const handleNavigate = useCallback(
        async (notification) => {
            await handleMarkAsRead(notification);
            if (notification?.postId) {
                navigate(`/community/post/${notification.postId}`);
            }
        },
        [handleMarkAsRead, navigate]
    );

    const totalPages = useMemo(
        () => Math.ceil(notifications.length / notificationsPerPage),
        [notifications.length, notificationsPerPage]
    );

    useEffect(() => {
        if (totalPages === 0) {
            if (currentPage !== 1) {
                setCurrentPage(1);
            }
            return;
        }

        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const paginatedNotifications = useMemo(() => {
        if (totalPages === 0) {
            return [];
        }
        const start = (currentPage - 1) * notificationsPerPage;
        return notifications.slice(start, start + notificationsPerPage);
    }, [currentPage, notifications, notificationsPerPage, totalPages]);

    const pageNumbers = useMemo(() => {
        if (totalPages <= 0) {
            return [];
        }
        if (totalPages <= maxPageButtons) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }
        const chunkIndex = Math.floor((currentPage - 1) / maxPageButtons);
        const start = chunkIndex * maxPageButtons + 1;
        const end = Math.min(start + maxPageButtons - 1, totalPages);
        return Array.from({ length: end - start + 1 }, (_, index) => start + index);
    }, [currentPage, maxPageButtons, totalPages]);

    const goToPage = useCallback(
        (page) => {
            if (totalPages === 0) {
                return;
            }
            const target = Math.min(Math.max(page, 1), totalPages);
            setCurrentPage(target);
        },
        [totalPages]
    );

    const handlePrevPage = useCallback(() => {
        if (totalPages === 0) {
            return;
        }
        goToPage(currentPage - 1);
    }, [currentPage, goToPage, totalPages]);

    const handleNextPage = useCallback(() => {
        if (totalPages === 0) {
            return;
        }
        goToPage(currentPage + 1);
    }, [currentPage, goToPage, totalPages]);

    const canGoPrev = currentPage > 1;
    const canGoNext = totalPages > 0 && currentPage < totalPages;

    const showPagination = totalPages > 1;

    const hasUnread = useMemo(
        () => notifications.some((notification) => !notification.read),
        [notifications]
    );

    const unreadCount = useMemo(
        () => notifications.filter((notification) => !notification.read).length,
        [notifications]
    );

    return (
        <main className="mypage-content notifications-page">
            <header className="mypage-page-header">
                <div>
                    <h1>알림 센터</h1>
                    <p>최근 받은 알림을 한 곳에서 확인하고 관리해 보세요.</p>
                    <p className="notifications-summary">
                        총 {notifications.length}개 · 읽지 않은 알림 {unreadCount}개
                    </p>
                </div>
                <div className="notifications-actions">
                    <button
                        type="button"
                        className="ghost-button"
                        onClick={fetchNotifications}
                        disabled={loading}
                    >
                        <FaRedo aria-hidden="true" /> 새로고침
                    </button>
                    <button
                        type="button"
                        className="primary-button"
                        onClick={handleMarkAll}
                        disabled={!hasUnread || loading}
                    >
                        <FaCheckCircle aria-hidden="true" /> 모두 읽음 처리
                    </button>
                </div>
            </header>

            <section className="notifications-panel section-card">
                {error && (
                    <div className="notifications-feedback is-error" role="alert">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="notifications-feedback is-loading">
                        <FaBell aria-hidden="true" /> 알림을 불러오는 중입니다...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="notifications-empty" role="status">
                        <FaInbox aria-hidden="true" />
                        <p>아직 받은 알림이 없습니다.</p>
                        <button type="button" className="ghost-button" onClick={fetchNotifications}>
                            <FaRedo aria-hidden="true" /> 새로고침
                        </button>
                    </div>
                ) : (
                    <>
                        <ul className="notifications-list">
                            {paginatedNotifications.map((notification) => {
                                const notificationId = resolveNotificationId(notification);
                                const isUnread = !notification.read;
                                const createdAt = notification.createdAt || notification.created_at;
                                const relativeTime = formatRelativeTimeKo(createdAt);
                                const absoluteTime = formatAbsoluteDateTimeKo(createdAt);
                                const absoluteIso = absoluteTime && createdAt
                                    ? new Date(createdAt).toISOString()
                                    : "";

                                return (
                                    <li
                                        key={notificationId ?? notification.message}
                                        className={`notifications-list__item${
                                            isUnread ? " is-unread" : ""
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            className="notifications-list__main"
                                            onClick={() => handleNavigate(notification)}
                                        >
                                            <span className="notifications-list__icon" aria-hidden="true">
                                                <FaBell />
                                            </span>
                                            <span className="notifications-list__body">
                                                <span className="notifications-list__message">
                                                    {notification.message}
                                                </span>
                                                {(relativeTime || absoluteTime) && (
                                                    <span className="notifications-list__time">
                                                        {relativeTime && <span>{relativeTime}</span>}
                                                        {relativeTime && absoluteTime && (
                                                            <span className="notifications-list__time-dot">•</span>
                                                        )}
                                                        {absoluteTime && (
                                                            <time dateTime={absoluteIso}>{absoluteTime}</time>
                                                        )}
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                        <div className="notifications-list__controls">
                                            <button
                                                type="button"
                                                className="notifications-list__mark-read"
                                                onClick={() => handleMarkAsRead(notification)}
                                                disabled={!isUnread}
                                            >
                                                {isUnread ? "안읽음" : "읽음"}
                                            </button>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                        {showPagination && (
                            <div className="notifications-pagination">
                                <div className="notifications-pagination__pages">
                                    <button
                                        type="button"
                                        className="notifications-pagination__button"
                                        onClick={() => goToPage(1)}
                                        disabled={!canGoPrev}
                                    >
                                        &lt;&lt;
                                    </button>
                                    <button
                                        type="button"
                                        className="notifications-pagination__button"
                                        onClick={handlePrevPage}
                                        disabled={!canGoPrev}
                                    >
                                        &lt;
                                    </button>
                                    {pageNumbers.map((page) => (
                                        <button
                                            key={page}
                                            type="button"
                                            className={`notifications-pagination__button${
                                                page === currentPage ? " is-active" : ""
                                            }`}
                                            onClick={() => goToPage(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        className="notifications-pagination__button"
                                        onClick={handleNextPage}
                                        disabled={!canGoNext}
                                    >
                                        &gt;
                                    </button>
                                    <button
                                        type="button"
                                        className="notifications-pagination__button"
                                        onClick={() => goToPage(totalPages)}
                                        disabled={!canGoNext}
                                    >
                                        &gt;&gt;
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </main>
    );
};

export default Notifications;
