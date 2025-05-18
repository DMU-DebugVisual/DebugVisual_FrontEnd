// 개발 환경에서는 프록시를 통해 우회해야 하므로 ''로 설정
const isDev = process.env.NODE_ENV === 'development';

const config = {
    API_BASE_URL: isDev ? '' : 'http://3.38.244.234:8080',
};

export default config;


// 아래는 프록시 코드를 제거하면 활성화 후 위 코드들 지우기
//const config = {
    //API_BASE_URL: 'http://3.38.244.234:8080', // 절대경로로 고정
//};

// default config;