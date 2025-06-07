const ideconfig = {
    // 기존 설정
    SOME_EXISTING_CONFIG: 'value',

    // ✅ API 주소 설정 추가
    API_BASE_URL:
        process.env.NODE_ENV === 'development'
            ? '/api'
            : 'http://13.209.72.114:8080/api'
};

export default ideconfig;
