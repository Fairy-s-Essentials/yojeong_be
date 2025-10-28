# Yojeong BE

## 🚀 프로젝트 시작 방법

### 의존성 설치

```bash
npm install
```

### 개발 서버 실행

```bash
npm run dev
```

### 빌드

```bash
npm run build
```

### 프로덕션 실행

```bash
npm start
```

## 📦 설치된 패키지

### Dependencies

- **Express**: ^5.1.0 - 웹 프레임워크
- **CORS**: ^2.8.5 - CORS 미들웨어
- **dotenv**: ^17.2.3 - 환경 변수 관리
- **MariaDB**: ^3.4.5 - MariaDB 데이터베이스 드라이버

### Dev Dependencies

- **TypeScript**: ^5.9.3 - 타입스크립트
- **ts-node**: ^10.9.2 - TypeScript 실행 환경
- **nodemon**: ^3.1.10 - 자동 재시작 도구
- **@types/express**: ^5.0.4 - Express 타입 정의
- **@types/express-serve-static-core**: ^5.1.0 - Express 코어 타입 정의
- **@types/node**: ^24.9.1 - Node.js 타입 정의

## 📁 폴더 구조
```
yojeong_be/
├── src/
│   ├── controller/      # 컨트롤러 로직
│   ├── router/          # 라우팅 설정
│   ├── service/         # 비즈니스 로직
│   └── server.ts        # 서버 진입점
├── dist/                # 빌드 결과물
├── .gitignore           # Git 제외 파일 설정
├── tsconfig.json        # TypeScript 설정
├── package.json         # 프로젝트 의존성 및 스크립트
└── README.md            # 프로젝트 문서
```