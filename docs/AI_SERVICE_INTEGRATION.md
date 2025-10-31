# AI 서비스 연동 가이드 (Google Gemini API)

## 개요

`POST /summaries` 엔드포인트에서 사용자의 요약을 AI로 분석하는 기능이 필요합니다.
이 문서는 Google Gemini API를 사용한 AI 서비스 연동 가이드를 제공합니다.

## AI 서비스 요구사항

### 입력 데이터
```typescript
interface AIAnalysisRequest {
  originalText: string;      // 원문
  userSummary: string;       // 사용자 요약
  difficultyLevel: 1 | 2 | 3; // 난이도 (참고용)
}
```

### 출력 데이터
```typescript
interface AIAnalysisResponse {
  aiSummary: string;           // AI가 생성한 요약
  similarityScore: number;     // 유사도 점수 (0~100)
  wellUnderstood: string[];    // 잘 파악한 것 (배열)
  missedPoints: string[];      // 놓친 포인트 (배열)
  improvements: string[];      // 개선 제안 (배열)
}
```

## Gemini API 설정

### 1. API 키 발급

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에 접속
2. "Create API Key" 클릭
3. API 키 복사 및 안전하게 보관

### 2. 패키지 설치

```bash
npm install @google/generative-ai
```

또는

```bash
yarn add @google/generative-ai
```

## 구현 예시

### 1. Gemini API 사용 (추천) ⭐

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const prompt = `
당신은 텍스트 요약 평가 전문가입니다. 사용자의 요약을 객관적으로 분석하고 건설적인 피드백을 제공합니다.

다음은 원문과 사용자가 작성한 요약입니다.

## 원문
${request.originalText}

## 사용자 요약
${request.userSummary}

## 난이도 레벨
${request.difficultyLevel} (1: 쉬움, 2: 보통, 3: 어려움)

다음 작업을 수행해주세요:
1. 원문을 간결하게 요약해주세요 (300~600자)
2. 사용자 요약의 정확도를 0~100점으로 평가해주세요
3. 사용자가 잘 파악한 핵심 포인트를 2~3개 나열해주세요
4. 사용자가 놓친 중요한 포인트를 2~3개 나열해주세요
5. 사용자 요약을 개선하기 위한 구체적인 제안을 2~3개 제시해주세요

응답은 반드시 다음 JSON 형식으로만 제공해주세요. 다른 텍스트는 포함하지 마세요:
{
  "aiSummary": "AI 요약 내용",
  "similarityScore": 85,
  "wellUnderstood": ["포인트1", "포인트2"],
  "missedPoints": ["포인트1", "포인트2"],
  "improvements": ["제안1", "제안2"]
}
`;

  try {
    // Gemini Pro 모델 사용
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.95,
        topK: 40,
      }
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // JSON 추출 (```json ``` 마크다운 제거)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    return {
      aiSummary: parsed.aiSummary,
      similarityScore: Math.min(100, Math.max(0, parsed.similarityScore)),
      wellUnderstood: parsed.wellUnderstood || [],
      missedPoints: parsed.missedPoints || [],
      improvements: parsed.improvements || []
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('AI_SERVICE_ERROR');
  }
}
```

### 2. Gemini API with Streaming (선택적)

스트리밍을 사용하면 응답이 생성되는 동안 실시간으로 받을 수 있습니다:

```typescript
async function analyzeWithAIStreaming(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const prompt = `(위와 동일한 프롬프트)`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    const result = await model.generateContentStream(prompt);
    
    let fullText = '';
    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      fullText += chunkText;
      // 진행 상황을 로깅하거나 WebSocket으로 전송 가능
      console.log('Streaming chunk:', chunkText);
    }

    // JSON 파싱
    let jsonText = fullText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    return {
      aiSummary: parsed.aiSummary,
      similarityScore: Math.min(100, Math.max(0, parsed.similarityScore)),
      wellUnderstood: parsed.wellUnderstood || [],
      missedPoints: parsed.missedPoints || [],
      improvements: parsed.improvements || []
    };
  } catch (error) {
    console.error('Gemini Streaming Error:', error);
    throw new Error('AI_SERVICE_ERROR');
  }
}
```

### 3. Gemini API with Safety Settings

유해한 콘텐츠를 필터링하려면 안전 설정을 추가할 수 있습니다:

```typescript
import { 
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold 
} from '@google/generative-ai';

async function analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const prompt = `(위와 동일한 프롬프트)`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    
    // 안전성 체크
    if (!response.text()) {
      console.error('Content blocked by safety filters');
      throw new Error('AI_SERVICE_SAFETY_BLOCK');
    }

    const text = response.text();
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    return {
      aiSummary: parsed.aiSummary,
      similarityScore: Math.min(100, Math.max(0, parsed.similarityScore)),
      wellUnderstood: parsed.wellUnderstood || [],
      missedPoints: parsed.missedPoints || [],
      improvements: parsed.improvements || []
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('AI_SERVICE_ERROR');
  }
}
```

### 4. Mock AI 서비스 (개발/테스트용)

AI API가 준비되지 않았거나 테스트 목적으로 사용할 수 있는 Mock 서비스입니다:

```typescript
async function analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  // 개발 중에는 랜덤 데이터 반환
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기 (실제 API 호출 시뮬레이션)

  const score = Math.floor(Math.random() * 30) + 70; // 70~100점 랜덤

  return {
    aiSummary: `${request.originalText.substring(0, 200)}... (AI가 생성한 요약)`,
    similarityScore: score,
    wellUnderstood: [
      '주제의 핵심을 정확히 파악했습니다',
      '중요한 논점을 잘 요약했습니다'
    ],
    missedPoints: [
      '구체적인 수치 데이터를 포함하면 더욱 명확한 요약이 될 것입니다',
      '원인과 결과의 관계를 더 명확히 서술할 필요가 있습니다'
    ],
    improvements: [
      '문장을 더 간결하게 작성하면 가독성이 향상됩니다',
      '핵심 키워드를 앞쪽에 배치하면 주제가 더 명확해집니다'
    ]
  };
}
```

## 통합 예시

`POST /summaries` 엔드포인트에서 Gemini API를 호출하는 전체 흐름:

```typescript
import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from './database';

// Gemini API 초기화
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface AIAnalysisRequest {
  originalText: string;
  userSummary: string;
  difficultyLevel: 1 | 2 | 3;
}

interface AIAnalysisResponse {
  aiSummary: string;
  similarityScore: number;
  wellUnderstood: string[];
  missedPoints: string[];
  improvements: string[];
}

async function analyzeWithGemini(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const prompt = `
당신은 텍스트 요약 평가 전문가입니다. 사용자의 요약을 객관적으로 분석하고 건설적인 피드백을 제공합니다.

다음은 원문과 사용자가 작성한 요약입니다.

## 원문
${request.originalText}

## 사용자 요약
${request.userSummary}

## 난이도 레벨
${request.difficultyLevel} (1: 쉬움, 2: 보통, 3: 어려움)

다음 작업을 수행해주세요:
1. 원문을 간결하게 요약해주세요 (300~600자)
2. 사용자 요약의 정확도를 0~100점으로 평가해주세요
3. 사용자가 잘 파악한 핵심 포인트를 2~3개 나열해주세요
4. 사용자가 놓친 중요한 포인트를 2~3개 나열해주세요
5. 사용자 요약을 개선하기 위한 구체적인 제안을 2~3개 제시해주세요

응답은 반드시 다음 JSON 형식으로만 제공해주세요. 다른 텍스트는 포함하지 마세요:
{
  "aiSummary": "AI 요약 내용",
  "similarityScore": 85,
  "wellUnderstood": ["포인트1", "포인트2"],
  "missedPoints": ["포인트1", "포인트2"],
  "improvements": ["제안1", "제안2"]
}
`;

  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      }
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // JSON 추출
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);

    return {
      aiSummary: parsed.aiSummary,
      similarityScore: Math.min(100, Math.max(0, parsed.similarityScore)),
      wellUnderstood: parsed.wellUnderstood || [],
      missedPoints: parsed.missedPoints || [],
      improvements: parsed.improvements || []
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw new Error('AI_SERVICE_ERROR');
  }
}

export async function createSummary(req: Request, res: Response) {
  const userId = req.userId; // authMiddleware에서 설정
  const {
    originalText,
    originalUrl,
    difficultyLevel,
    userSummary,
    criticalWeakness,
    criticalOpposite,
    criticalApplication
  } = req.body;

  try {
    // 1. 유효성 검증
    if (originalText.length < 1000 || originalText.length > 5000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '원문은 1000자 이상 5000자 이하여야 합니다'
        }
      });
    }

    // 2. Gemini AI 분석 (동기 처리, 10~30초 소요)
    const aiResult = await analyzeWithGemini({
      originalText,
      userSummary,
      difficultyLevel
    });

    // 3. DB 저장
    // AI 분석 결과 배열을 || 구분자로 join
    const aiWellUnderstoodText = aiResult.wellUnderstood.join('||');
    const aiMissedPointsText = aiResult.missedPoints.join('||');
    const aiImprovementsText = aiResult.improvements.join('||');

    const query = `
      INSERT INTO summaries (
        user_id, original_text, original_url, difficulty_level,
        user_summary, critical_weakness, critical_opposite, critical_application,
        ai_summary, similarity_score,
        ai_well_understood, ai_missed_points, ai_improvements
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await db.query(query, [
      userId,
      originalText,
      originalUrl || null,
      difficultyLevel,
      userSummary,
      criticalWeakness,
      criticalOpposite,
      criticalApplication,
      aiResult.aiSummary,
      aiResult.similarityScore,
      aiWellUnderstoodText,
      aiMissedPointsText,
      aiImprovementsText
    ]);

    const summaryId = result.insertId;

    // 4. 저장된 데이터 조회
    const saved = await db.query(
      'SELECT * FROM summaries WHERE id = ?',
      [summaryId]
    );

    // 5. 응답 (|| 구분자를 split하여 배열로 변환)
    return res.json({
      success: true,
      data: {
        id: saved.id,
        userId: saved.user_id,
        originalText: saved.original_text,
        originalUrl: saved.original_url,
        difficultyLevel: saved.difficulty_level,
        userSummary: saved.user_summary,
        criticalWeakness: saved.critical_weakness,
        criticalOpposite: saved.critical_opposite,
        criticalApplication: saved.critical_application,
        aiSummary: saved.ai_summary,
        similarityScore: saved.similarity_score,
        aiWellUnderstood: saved.ai_well_understood.split('||'),
        aiMissedPoints: saved.ai_missed_points.split('||'),
        aiImprovements: saved.ai_improvements.split('||'),
        learningNote: saved.learning_note,
        createdAt: saved.created_at.toISOString()
      }
    });

  } catch (error) {
    console.error('Create Summary Error:', error);

    if (error.message === 'AI_SERVICE_ERROR') {
      return res.status(500).json({
        success: false,
        error: {
          code: 'AI_SERVICE_ERROR',
          message: 'AI 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요'
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: '서버 오류가 발생했습니다'
      }
    });
  }
}
```

## 에러 처리

### 타임아웃 설정

Gemini API 호출 시 타임아웃을 설정하여 무한 대기를 방지합니다:

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

async function analyzeWithAI(
  request: AIAnalysisRequest,
  timeoutMs: number = 60000
): Promise<AIAnalysisResponse> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    
    // 타임아웃 Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('AI_SERVICE_TIMEOUT')), timeoutMs);
    });
    
    // AI 호출 Promise
    const aiPromise = model.generateContent(prompt);
    
    // 둘 중 먼저 완료되는 것 반환
    const result = await Promise.race([aiPromise, timeoutPromise]);
    
    // ... 결과 처리
    
  } catch (error) {
    if (error.message === 'AI_SERVICE_TIMEOUT') {
      console.error('Gemini API Timeout');
      throw new Error('AI_SERVICE_TIMEOUT');
    }
    console.error('Gemini API Error:', error);
    throw new Error('AI_SERVICE_ERROR');
  }
}
```

### 재시도 로직

네트워크 오류 등으로 실패한 경우 재시도:

```typescript
async function analyzeWithAI(
  request: AIAnalysisRequest,
  retries: number = 3
): Promise<AIAnalysisResponse> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  
  for (let i = 0; i < retries; i++) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
      const result = await model.generateContent(prompt);
      
      // 성공 시 결과 반환
      const text = result.response.text();
      // ... JSON 파싱 및 반환
      
    } catch (error) {
      console.error(`Attempt ${i + 1} failed:`, error);
      
      if (i === retries - 1) {
        // 마지막 재시도 실패
        throw new Error('AI_SERVICE_ERROR');
      }
      
      // 지수 백오프 (1초, 2초, 4초...)
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }
}
```

### API 에러 핸들링

Gemini API의 다양한 에러 처리:

```typescript
import { GoogleGenerativeAI, GoogleGenerativeAIError } from '@google/generative-ai';

async function analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
    const result = await model.generateContent(prompt);
    
    // ... 정상 처리
    
  } catch (error) {
    if (error instanceof GoogleGenerativeAIError) {
      console.error('Gemini API Error:', {
        name: error.name,
        message: error.message,
        // status: error.status,
      });
      
      // 에러 타입별 처리
      if (error.message.includes('quota')) {
        throw new Error('AI_SERVICE_QUOTA_EXCEEDED');
      } else if (error.message.includes('safety')) {
        throw new Error('AI_SERVICE_SAFETY_BLOCK');
      } else if (error.message.includes('API key')) {
        throw new Error('AI_SERVICE_AUTH_ERROR');
      }
    }
    
    throw new Error('AI_SERVICE_ERROR');
  }
}
```

## 환경 변수 설정

`.env` 파일에 Gemini API 관련 설정 추가:

```bash
# Google Gemini API
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-1.5-pro

# AI Service 설정
AI_TIMEOUT=60000
AI_MAX_RETRIES=3
AI_TEMPERATURE=0.7
AI_MAX_OUTPUT_TOKENS=2048
```

TypeScript에서 환경 변수 타입 정의:

```typescript
// env.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GEMINI_API_KEY: string;
      GEMINI_MODEL: string;
      AI_TIMEOUT: string;
      AI_MAX_RETRIES: string;
      AI_TEMPERATURE: string;
      AI_MAX_OUTPUT_TOKENS: string;
    }
  }
}

export {};
```

설정 파일로 관리:

```typescript
// config/ai.config.ts
export const aiConfig = {
  apiKey: process.env.GEMINI_API_KEY,
  model: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  timeout: parseInt(process.env.AI_TIMEOUT || '60000'),
  maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3'),
  generationConfig: {
    temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
    maxOutputTokens: parseInt(process.env.AI_MAX_OUTPUT_TOKENS || '2048'),
    topP: 0.95,
    topK: 40,
  }
};
```

## 비용 관리

Gemini API 호출은 비용이 발생하므로 다음을 고려하세요:

### Gemini API 가격 (2024년 기준)

**Gemini 1.5 Pro**
- 입력: $3.5 / 1M tokens (128K 이하)
- 출력: $10.5 / 1M tokens
- 무료 티어: 분당 15 RPM, 일일 1,500 요청

**Gemini 1.5 Flash**
- 입력: $0.075 / 1M tokens
- 출력: $0.3 / 1M tokens
- 빠른 응답이 필요하고 비용을 줄이고 싶다면 Flash 사용

### 비용 절감 전략

#### 1. 캐싱
동일한 원문+요약 조합은 캐싱하여 재사용:

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379')
});

async function analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  // 캐시 키 생성
  const cacheKey = `ai:${Buffer.from(request.originalText + request.userSummary).toString('base64').substring(0, 100)}`;
  
  // 캐시 확인
  const cached = await redis.get(cacheKey);
  if (cached) {
    console.log('Cache hit - AI call skipped');
    return JSON.parse(cached);
  }
  
  // AI 호출
  const result = await callGeminiAPI(request);
  
  // 캐시 저장 (24시간)
  await redis.setex(cacheKey, 86400, JSON.stringify(result));
  
  return result;
}
```

#### 2. 토큰 제한
maxOutputTokens 설정으로 비용 제한:

```typescript
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-pro',
  generationConfig: {
    maxOutputTokens: 1500, // 출력 토큰 제한
  }
});
```

#### 3. 사용자당 일일 제한
```typescript
async function checkDailyLimit(userId: number): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const count = await db.query(`
    SELECT COUNT(*) as count
    FROM summaries
    WHERE user_id = ? AND created_at >= ?
  `, [userId, today]);
  
  const DAILY_LIMIT = 10; // 일일 10회 제한
  return count[0].count < DAILY_LIMIT;
}

// API 핸들러에서 사용
export async function createSummary(req: Request, res: Response) {
  const userId = req.userId;
  
  const canCreate = await checkDailyLimit(userId);
  if (!canCreate) {
    return res.status(429).json({
      success: false,
      error: {
        code: 'DAILY_LIMIT_EXCEEDED',
        message: '일일 요약 생성 횟수를 초과했습니다. 내일 다시 시도해주세요.'
      }
    });
  }
  
  // ... 요약 생성 로직
}
```

#### 4. 로깅 및 모니터링
모든 AI 호출을 로깅하여 비용 추적:

```typescript
interface AIUsageLog {
  userId: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: Date;
}

async function logAIUsage(log: AIUsageLog) {
  await db.query(`
    INSERT INTO ai_usage_logs (user_id, model, input_tokens, output_tokens, cost, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [log.userId, log.model, log.inputTokens, log.outputTokens, log.cost, log.timestamp]);
}

// AI 호출 후
const inputTokens = estimateTokens(request.originalText + request.userSummary);
const outputTokens = estimateTokens(JSON.stringify(aiResult));
const cost = calculateCost(inputTokens, outputTokens, 'gemini-1.5-pro');

await logAIUsage({
  userId,
  model: 'gemini-1.5-pro',
  inputTokens,
  outputTokens,
  cost,
  timestamp: new Date()
});
```

#### 5. Flash 모델 사용 고려
비용이 부담된다면 Gemini 1.5 Flash 사용:

```typescript
// 저비용 모델
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash', // Pro 대신 Flash
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 1500,
  }
});
```

비교:
- **Pro**: 더 정확하고 상세한 분석, 더 비쌈
- **Flash**: 빠르고 저렴, 약간 덜 정확

## 테스트

Gemini API 테스트를 위한 예시:

```typescript
import { describe, it, expect, beforeAll } from '@jest/globals';
import { GoogleGenerativeAI } from '@google/generative-ai';

describe('Gemini AI Analysis Service', () => {
  let genAI: GoogleGenerativeAI;
  
  beforeAll(() => {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  });

  it('should analyze text successfully', async () => {
    const request = {
      originalText: '인공지능 기술의 발전은 우리 사회에 많은 변화를 가져오고 있다. 특히 자연어 처리 분야에서는 대규모 언어 모델의 등장으로 기계가 인간의 언어를 이해하고 생성하는 능력이 크게 향상되었다. 이러한 기술은 번역, 요약, 질의응답 등 다양한 분야에서 활용되고 있으며, 앞으로도 더욱 발전할 것으로 예상된다.' + '테스트 원문 텍스트...'.repeat(50),
      userSummary: 'AI 기술, 특히 자연어 처리가 발전하여 다양한 분야에서 활용되고 있다.',
      difficultyLevel: 1 as const
    };

    const result = await analyzeWithAI(request);

    expect(result.aiSummary).toBeDefined();
    expect(result.aiSummary.length).toBeGreaterThan(100);
    expect(result.similarityScore).toBeGreaterThanOrEqual(0);
    expect(result.similarityScore).toBeLessThanOrEqual(100);
    expect(result.wellUnderstood).toBeInstanceOf(Array);
    expect(result.wellUnderstood.length).toBeGreaterThan(0);
    expect(result.missedPoints).toBeInstanceOf(Array);
    expect(result.improvements).toBeInstanceOf(Array);
  }, 60000); // 60초 타임아웃

  it('should handle timeout', async () => {
    const request = {
      originalText: '테스트 원문...'.repeat(1000),
      userSummary: '테스트 요약...',
      difficultyLevel: 1 as const
    };

    await expect(
      analyzeWithAI(request, 1000) // 1초 타임아웃
    ).rejects.toThrow('AI_SERVICE_TIMEOUT');
  });

  it('should retry on failure', async () => {
    // 네트워크 오류 시뮬레이션
    let attempts = 0;
    const mockAnalyze = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Network error');
      }
      return mockAIResponse;
    };

    const result = await mockAnalyze();
    expect(attempts).toBe(3);
  });
  
  it('should validate JSON response format', async () => {
    const request = {
      originalText: '테스트 원문...'.repeat(100),
      userSummary: '테스트 요약...',
      difficultyLevel: 1 as const
    };

    const result = await analyzeWithAI(request);

    // JSON 구조 검증
    expect(result).toHaveProperty('aiSummary');
    expect(result).toHaveProperty('similarityScore');
    expect(result).toHaveProperty('wellUnderstood');
    expect(result).toHaveProperty('missedPoints');
    expect(result).toHaveProperty('improvements');
    
    // 배열 검증
    expect(Array.isArray(result.wellUnderstood)).toBe(true);
    expect(Array.isArray(result.missedPoints)).toBe(true);
    expect(Array.isArray(result.improvements)).toBe(true);
  }, 60000);
});
```

### Mock 테스트 (단위 테스트용)

```typescript
// __mocks__/gemini.mock.ts
export const mockGeminiResponse = {
  aiSummary: '테스트 AI 요약입니다.',
  similarityScore: 85,
  wellUnderstood: ['포인트 1', '포인트 2'],
  missedPoints: ['놓친 포인트 1'],
  improvements: ['개선 제안 1', '개선 제안 2']
};

export const mockAnalyzeWithAI = jest.fn().mockResolvedValue(mockGeminiResponse);
```

```typescript
// summary.test.ts
import { createSummary } from './summary.controller';
import { mockAnalyzeWithAI } from './__mocks__/gemini.mock';

jest.mock('./ai-service', () => ({
  analyzeWithAI: mockAnalyzeWithAI
}));

describe('Summary Controller', () => {
  it('should create summary with AI analysis', async () => {
    const req = {
      userId: 1,
      body: {
        originalText: '테스트 원문...',
        userSummary: '테스트 요약...',
        difficultyLevel: 1
      }
    };
    
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await createSummary(req, res);

    expect(mockAnalyzeWithAI).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          aiSummary: expect.any(String),
          similarityScore: expect.any(Number)
        })
      })
    );
  });
});
```

## 프로덕션 체크리스트

### 1. 보안
- [ ] API 키를 환경 변수로 관리
- [ ] `.env` 파일을 `.gitignore`에 추가
- [ ] 프로덕션 환경에서는 별도의 API 키 사용
- [ ] API 키 로테이션 계획 수립

### 2. 에러 처리
- [ ] 타임아웃 설정 (60초)
- [ ] 재시도 로직 구현 (3회)
- [ ] 에러 로깅 시스템 구축
- [ ] 사용자 친화적 에러 메시지

### 3. 성능
- [ ] Redis 캐싱 구현
- [ ] 일일 요청 제한 설정
- [ ] Rate Limiting 구현
- [ ] 응답 시간 모니터링

### 4. 비용
- [ ] AI 사용량 로깅
- [ ] 일일/월별 비용 알림
- [ ] 사용자당 요청 제한
- [ ] Flash 모델 사용 검토

### 5. 모니터링
- [ ] API 호출 성공률 추적
- [ ] 평균 응답 시간 측정
- [ ] 에러율 모니터링
- [ ] 비용 대시보드 구축

## 참고 자료

### Gemini API 공식 문서
- [Google AI for Developers](https://ai.google.dev/)
- [Gemini API Quickstart](https://ai.google.dev/gemini-api/docs/quickstart)
- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Safety Settings](https://ai.google.dev/gemini-api/docs/safety-settings)

### Node.js SDK
- [Google Generative AI SDK](https://www.npmjs.com/package/@google/generative-ai)
- [GitHub Repository](https://github.com/google/generative-ai-js)

## 다음 단계

1. **Google AI Studio에서 API 키 발급**
   - https://makersuite.google.com/app/apikey

2. **패키지 설치**
   ```bash
   npm install @google/generative-ai
   ```

3. **환경 변수 설정**
   ```bash
   GEMINI_API_KEY=your-api-key-here
   ```

4. **AI 서비스 모듈 구현**
   - `src/services/ai.service.ts` 파일 생성
   - 위의 코드 예시 참고하여 구현

5. **요약 생성 API에 통합**
   - `POST /summaries` 핸들러 수정
   - AI 서비스 호출 추가

6. **테스트**
   - 단위 테스트 작성
   - 통합 테스트 실행
   - 실제 API 호출 테스트

7. **모니터링 설정**
   - 로깅 시스템 구축
   - 비용 추적 시스템 구현

8. **프로덕션 배포**
   - 환경 변수 설정
   - Rate Limiting 활성화
   - 모니터링 알림 설정

## 문제 해결

### API 키 오류
```
Error: API key not valid
```
→ API 키가 올바른지 확인하고 환경 변수 설정 확인

### 타임아웃 에러
```
Error: AI_SERVICE_TIMEOUT
```
→ 타임아웃 시간을 늘리거나 입력 텍스트 길이 확인

### JSON 파싱 에러
```
Error: Unexpected token in JSON
```
→ Gemini 응답에서 ```json 마크다운 제거 로직 확인

### 안전 필터 차단
```
Content blocked by safety filters
```
→ Safety Settings 조정하거나 입력 텍스트 검토

### 할당량 초과
```
Error: Quota exceeded
```
→ 요청 빈도 줄이기 또는 유료 플랜 업그레이드 검토
