<div align="center">

# 📚 요정 (Yojeong) - Backend

**글을 읽고 요약하는 능력을 체계적으로 훈련할 수 있는 AI 기반 학습 플랫폼**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-5.1.0-green.svg)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-Latest-green.svg)](https://nodejs.org/)
[![MariaDB](https://img.shields.io/badge/MariaDB-3.4.5-blue.svg)](https://mariadb.org/)

</div>

---

## 📖 프로젝트 소개

**요정(Yojeong)**은 글 읽기/쓰기 능력을 키우고 싶은 모든 사람을 위한 AI 기반 학습 플랫폼의 백엔드 서버입니다.

사용자가 제출한 요약문을 AI가 다각도로 분석하고, 구체적이고 실행 가능한 피드백을 제공하여 체계적인 학습을 지원합니다.

### 🎯 주요 기능

- 🤖 **AI 기반 요약 평가 및 피드백**
  - AI를 활용한 정교한 다단계 평가
  - 핵심 포인트 커버리지, 논리 흐름, 표현 정확성, 비판적 사고 분석

- 📊 **학습 기록 및 통계 관리**
  - 주간 학습 횟수, 평균 점수, 연속 학습 일수 추적
  - 개인 맞춤형 학습 히스토리 제공

- 🔐 **카카오 소셜 로그인**
  - OAuth 2.0 기반 간편 로그인
  - 세션 기반 인증 관리

- 📈 **학습 히스토리 분석**
  - 기간별 학습 패턴 분석
  - 성장 추이 시각화 데이터 제공

---

## 🏗️ 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│                    https://yojeong.ai.kr                        │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / REST API
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Nginx Reverse Proxy                        │
│                   (SSL Termination, CORS)                       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Express.js Backend Server                    │
│                                                                 │
│  ┌───────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │   Controllers │  │   Middlewares  │  │     Services     │  │
│  │               │  │                │  │                  │  │
│  │ • Summary     │  │ • Auth Check   │  │ • Gemini AI      │  │
│  │ • Auth        │  │ • Session Mgmt │  │ • Kakao OAuth    │  │
│  │ • History     │  └────────────────┘  │ • Validation     │  │
│  │ • Main        │                      └──────────────────┘  │
│  └───────────────┘                                             │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐│
│  │                         Models                             ││
│  │  • User Model    • Summary Model    • Usage Model         ││
│  └────────────────────────────────────────────────────────────┘│
└──────────────────────────────┬──────────────────────────────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
┌──────────────────┐  ┌─────────────────┐  ┌──────────────────┐
│   MariaDB        │  │  Google Gemini  │  │  Kakao OAuth     │
│   Database       │  │   API (2.5)     │  │   2.0 API        │
│                  │  │                 │  │                  │
│ • users          │  │ • Summary Gen   │  │ • Login          │
│ • summaries      │  │ • Evaluation    │  │ • User Info      │
│ • usage_limits   │  │ • Feedback      │  │                  │
└──────────────────┘  └─────────────────┘  └──────────────────┘
```

---

## 🔄 AI 프롬프트 처리 흐름

요정의 핵심 기능인 AI 요약 평가는 다음과 같은 5단계 파이프라인으로 처리됩니다:

```
┌──────────────────────────────────────────────────────────────────┐
│                      사용자 입력 수신                             │
│  • 원문 (originalText)                                           │
│  • 사용자 요약 (userSummary)                                      │
│  • 비판적 읽기 (criticalWeakness, criticalOpposite) - 선택      │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                 Step 1: AI 요약 생성                              │
│                                                                  │
│  Gemini API ──► 원문 기반 3개의 요약 생성                         │
│              ──► 최적 길이 요약 선택                              │
│                                                                  │
│  Output: aiSummary (평가 기준 요약)                               │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│           Step 2-5: 병렬 평가 실행 (Promise.all)                 │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Step 2: 핵심 포인트 분석 (evaluateKeyPoints)           │   │
│  │  • AI 요약에서 핵심 포인트 3-5개 추출                   │   │
│  │  • 사용자 요약의 각 포인트 포함 여부 평가 (boolean[])   │   │
│  │                                                          │   │
│  │  Output: { keyPoints: string[], userCoverage: boolean[] }│  │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Step 3: 논리 흐름 평가 (evaluateLogic)                 │   │
│  │  • 주장-근거-결론 구조 분석                             │   │
│  │  • 인과관계 명확성 평가                                 │   │
│  │                                                          │   │
│  │  Output: { analysis: string, quality: Quality }         │   │
│  │  Quality: PERFECT | EXCELLENT | GOOD | MODERATE | WEAK  │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Step 4: 표현 정확성 평가 (evaluateExpression)          │   │
│  │  • 객관성 및 명확성 평가                                │   │
│  │  • 과장/왜곡/감정어 사용 여부 확인                      │   │
│  │                                                          │   │
│  │  Output: { analysis: string, accuracy: Accuracy }       │   │
│  │  Accuracy: PERFECT | EXCELLENT | GOOD | MODERATE | WEAK │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Step 5: 비판적 사고 평가 (evaluateCriticalThinking)    │   │
│  │  • 비판적 읽기 내용의 논리적 통합 여부 평가 (선택적)    │   │
│  │                                                          │   │
│  │  Output: { analysis: string, thinking: Thinking }       │   │
│  │  Thinking: EXCELLENT | GOOD | WEAK | NONE               │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│              Step 6: 피드백 생성 (generateFeedback)              │
│                                                                  │
│  모든 평가 결과를 종합하여 구체적인 피드백 생성:                  │
│                                                                  │
│  • wellUnderstood[]: 잘 이해한 부분 (최대 3개)                   │
│  • missedPoints[]:  놓친 핵심 포인트 (최대 3개)                  │
│  • improvements[]:   구체적 개선 방안 (최대 3개)                 │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                Step 7: 최종 점수 계산                             │
│                                                                  │
│  • 핵심 포인트 커버리지 점수 (40점)                               │
│  • 논리 흐름 점수 (30점)                                          │
│  • 표현 정확성 점수 (30점)                                        │
│  • 비판적 사고 보너스 (선택적, 가중치 조정)                       │
│                                                                  │
│  Output: similarityScore (0-100)                                │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    데이터베이스 저장 & 응답                        │
│                                                                  │
│  • 평가 결과 저장 (summaries 테이블)                             │
│  • 사용 횟수 업데이트 (usage_limits 테이블)                      │
│  • 클라이언트에 결과 반환                                         │
└──────────────────────────────────────────────────────────────────┘
```

### 🔑 프롬프트 설계 원칙

1. **보안 우선**: 모든 프롬프트에 프롬프트 인젝션 방어 로직 내장
2. **JSON 전용 출력**: `responseMimeType: 'application/json'`으로 일관된 응답 형식 보장
3. **단계별 분리**: 각 평가 단계를 독립적으로 실행하여 정확도 향상
4. **병렬 처리**: Promise.all을 활용한 평가 속도 최적화
5. **일관된 평가 기준**: 6단계 품질 척도 (PERFECT ~ POOR) 적용

---

## 📁 프로젝트 구조

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

## 🛠️ 기술 스택

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
