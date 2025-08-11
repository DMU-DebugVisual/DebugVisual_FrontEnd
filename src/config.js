// config.js
//const API_BASE_URL = 'https://api.zivorp.com';
const API_BASE_URL = 'http://52.79.145.160:8080';

const API_ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    SIGNUP: `${API_BASE_URL}/api/auth/signup`,
    RUN_CODE: `${API_BASE_URL}/api/code/run`,
    ISUALIZE_CODE: `${API_BASE_URL}/api/code/visualize`
    // 필요시 다른 엔드포인트도 추가
};

const config = {
    API_BASE_URL,
    API_ENDPOINTS
};

export default config;