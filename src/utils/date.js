const absoluteDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
});

const MS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = SECONDS_IN_MINUTE * 60;
const SECONDS_IN_DAY = SECONDS_IN_HOUR * 24;
const SECONDS_IN_WEEK = SECONDS_IN_DAY * 7;
const SECONDS_IN_MONTH = SECONDS_IN_DAY * 30;
const SECONDS_IN_YEAR = SECONDS_IN_DAY * 365;

const toDate = (value) => {
    if (!value) return null;
    const parsed = value instanceof Date ? value : new Date(value);
    return Number.isNaN(parsed?.getTime()) ? null : parsed;
};

export const formatRelativeTimeKo = (value) => {
    const targetDate = toDate(value);
    if (!targetDate) {
        return "";
    }

    const diffSeconds = Math.floor((Date.now() - targetDate.getTime()) / MS_IN_SECOND);

    if (diffSeconds <= 0) {
        return "방금 전";
    }

    if (diffSeconds < SECONDS_IN_MINUTE) {
        return diffSeconds <= 10 ? "방금 전" : `${diffSeconds}초 전`;
    }

    const minutes = Math.floor(diffSeconds / SECONDS_IN_MINUTE);
    if (minutes < SECONDS_IN_MINUTE) {
        return `${minutes}분 전`;
    }

    const hours = Math.floor(diffSeconds / SECONDS_IN_HOUR);
    if (hours < 24) {
        return `${hours}시간 전`;
    }

    const days = Math.floor(diffSeconds / SECONDS_IN_DAY);
    if (days < 7) {
        return `${days}일 전`;
    }

    const weeks = Math.floor(diffSeconds / SECONDS_IN_WEEK);
    if (weeks < 5) {
        return `${weeks}주 전`;
    }

    const months = Math.floor(diffSeconds / SECONDS_IN_MONTH);
    if (months < 12) {
        return `${months}개월 전`;
    }

    const years = Math.floor(diffSeconds / SECONDS_IN_YEAR);
    return `${Math.max(years, 1)}년 전`;
};

export const formatAbsoluteDateTimeKo = (value) => {
    const targetDate = toDate(value);
    if (!targetDate) {
        return "";
    }

    return absoluteDateTimeFormatter.format(targetDate);
};
