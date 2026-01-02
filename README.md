<div align="center">

# 요정: 요약의 정석 - Backend

**글을 읽고 요약하는 능력을 체계적으로 훈련할 수 있는 AI 기반 학습 플랫폼**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-green.svg)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Latest-green.svg)](https://nodejs.org/)
[![MariaDB](https://img.shields.io/badge/MariaDB-3.4.5-blue.svg)](https://mariadb.org/)

</div>

---

## 프로젝트 소개

<요정: 요약의 정석>은 글 읽기/쓰기 능력을 키우고 싶은 모든 사람을 위한 AI 기반 학습 플랫폼의 백엔드 서버입니다.

사용자가 제출한 요약문을 AI가 다각도로 분석하고, 구체적이고 실행 가능한 피드백을 제공하여 체계적인 학습을 지원합니다.

### 주요 기능

- 🤖 **AI 기반 요약 평가 및 피드백**
  - AI를 활용한 정교한 다단계 평가
  - 핵심 포인트 커버리지, 논리 흐름, 표현 정확성, 비판적 사고 분석

- 📊 **학습 기록 및 통계 관리**
  - 주간 학습 횟수, 평균 점수, 연속 학습 일수 추적
  - 개인 맞춤형 학습 히스토리 제공

- 📈 **학습 히스토리 분석**
  - 기간별 학습 패턴 분석
  - 성장 추이 시각화 데이터 제공

---

## 시스템 아키텍처 

<img width="2632" height="1306" alt="image" src="https://github.com/user-attachments/assets/028ff842-1544-4506-a1d1-2dc21169a6c9" />

---

## 프롬프트 아키텍처

<img width="2506" height="1164" alt="image" src="https://github.com/user-attachments/assets/5a482d30-98bf-4038-b48a-2faed5e96e00" />

---

## 프로젝트 구조

```
yojeong_be/
├── src/
│   ├── config/              # 설정 파일
│   ├── constant/            # 상수 정의
│   ├── controllers/         # 라우트 핸들러
│   ├── middlewares/         # Express 미들웨어
│   ├── models/              # 데이터베이스 모델
│   ├── routes/              # API 라우터
│   ├── services/            # 비즈니스 로직
│   ├── types/               # TypeScript 타입 정의
│   ├── utils/               # 유틸리티 함수
│   └── server.ts            # 서버 진입점
├── tsconfig.json           # TypeScript 설정
├── eslint.config.mjs       # ESLint 설정
├── package.json            # 프로젝트 의존성
└── README.md               # 프로젝트 문서
```

---

## 기술 스택

### Core

- **Runtime**: Node.js
- **Language**: TypeScript 5.9.3
- **Framework**: Express.js 5.1.0

### Database & Storage

- **Database**: MariaDB 3.4.5
- **Session Store**: express-session 1.18.2

### External Services

- **AI/ML**: Google Generative AI (Gemini 2.5 Flash)
- **OAuth**: Kakao OAuth 2.0
- **HTTP Client**: Axios 1.13.1

### Development Tools

- **Code Quality**: ESLint 9.38.0, Prettier 3.6.2
- **Type Checking**: TypeScript ESLint 8.46.2
- **Dev Server**: Nodemon 3.1.10, ts-node 10.9.2
