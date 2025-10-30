# AI 서비스 연동 가이드

## 개요

`POST /summaries` 엔드포인트에서 사용자의 요약을 AI로 분석하는 기능이 필요합니다.
이 문서는 AI 서비스 연동을 위한 가이드라인을 제공합니다.

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

## 구현 예시

### 1. OpenAI API 사용 예시

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const prompt = `
다음은 원문과 사용자가 작성한 요약입니다.

## 원문
${request.originalText}

## 사용자 요약
${request.userSummary}

다음 작업을 수행해주세요:
1. 원문을 간결하게 요약해주세요 (300~600자)
2. 사용자 요약의 정확도를 0~100점으로 평가해주세요
3. 사용자가 잘 파악한 핵심 포인트를 2~3개 나열해주세요
4. 사용자가 놓친 중요한 포인트를 2~3개 나열해주세요
5. 사용자 요약을 개선하기 위한 구체적인 제안을 2~3개 제시해주세요

응답은 반드시 다음 JSON 형식으로만 제공해주세요:
{
  "aiSummary": "AI 요약 내용",
  "similarityScore": 85,
  "wellUnderstood": ["포인트1", "포인트2"],
  "missedPoints": ["포인트1", "포인트2"],
  "improvements": ["제안1", "제안2"]
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '당신은 텍스트 요약 평가 전문가입니다. 사용자의 요약을 객관적으로 분석하고 건설적인 피드백을 제공합니다.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000
    });

    const result = JSON.parse(completion.choices[0].message.content);

    return {
      aiSummary: result.aiSummary,
      similarityScore: Math.min(100, Math.max(0, result.similarityScore)),
      wellUnderstood: result.wellUnderstood || [],
      missedPoints: result.missedPoints || [],
      improvements: result.improvements || []
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    throw new Error('AI_SERVICE_ERROR');
  }
}
```

### 2. Anthropic Claude API 사용 예시

```typescript
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

async function analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const prompt = `
다음은 원문과 사용자가 작성한 요약입니다.

<original_text>
${request.originalText}
</original_text>

<user_summary>
${request.userSummary}
</user_summary>

다음 작업을 수행해주세요:
1. 원문을 간결하게 요약해주세요 (300~600자)
2. 사용자 요약의 정확도를 0~100점으로 평가해주세요
3. 사용자가 잘 파악한 핵심 포인트를 2~3개 나열해주세요
4. 사용자가 놓친 중요한 포인트를 2~3개 나열해주세요
5. 사용자 요약을 개선하기 위한 구체적인 제안을 2~3개 제시해주세요

응답은 반드시 다음 JSON 형식으로만 제공해주세요:
{
  "aiSummary": "AI 요약 내용",
  "similarityScore": 85,
  "wellUnderstood": ["포인트1", "포인트2"],
  "missedPoints": ["포인트1", "포인트2"],
  "improvements": ["제안1", "제안2"]
}
`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = message.content[0].type === 'text' 
      ? message.content[0].text 
      : '';
    
    const result = JSON.parse(content);

    return {
      aiSummary: result.aiSummary,
      similarityScore: Math.min(100, Math.max(0, result.similarityScore)),
      wellUnderstood: result.wellUnderstood || [],
      missedPoints: result.missedPoints || [],
      improvements: result.improvements || []
    };
  } catch (error) {
    console.error('AI Analysis Error:', error);
    throw new Error('AI_SERVICE_ERROR');
  }
}
```

### 3. Mock AI 서비스 (개발/테스트용)

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

`POST /summaries` 엔드포인트에서 AI 서비스를 호출하는 전체 흐름:

```typescript
import { Request, Response } from 'express';
import { db } from './database';
import { analyzeWithAI } from './ai-service';

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

    // 2. AI 분석 (동기 처리, 10~30초 소요)
    const aiResult = await analyzeWithAI({
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

AI 서비스 호출 시 타임아웃을 설정하여 무한 대기를 방지합니다:

```typescript
import axios from 'axios';

const aiClient = axios.create({
  timeout: 60000, // 60초
  headers: {
    'Content-Type': 'application/json'
  }
});

async function analyzeWithAI(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  try {
    const response = await aiClient.post('/analyze', request);
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('AI_SERVICE_TIMEOUT');
    }
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
  for (let i = 0; i < retries; i++) {
    try {
      const response = await callAIService(request);
      return response;
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      // 1초 대기 후 재시도
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}
```

## 환경 변수 설정

`.env` 파일에 AI 서비스 관련 설정 추가:

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4-turbo-preview

# Anthropic Claude
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# AI Service 설정
AI_TIMEOUT=60000
AI_MAX_RETRIES=3
```

## 비용 관리

AI API 호출은 비용이 발생하므로 다음을 고려하세요:

1. **캐싱**: 동일한 원문+요약 조합은 캐싱하여 재사용
2. **토큰 제한**: max_tokens 설정으로 비용 제한
3. **로깅**: 모든 AI 호출을 로깅하여 비용 추적
4. **Rate Limiting**: 사용자당 일일 요약 생성 횟수 제한

```typescript
// 예시: 사용자당 일일 제한 확인
async function checkDailyLimit(userId: number): Promise<boolean> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const count = await db.query(`
    SELECT COUNT(*) as count
    FROM summaries
    WHERE user_id = ? AND created_at >= ?
  `, [userId, today]);
  
  const DAILY_LIMIT = 10;
  return count[0].count < DAILY_LIMIT;
}
```

## 테스트

AI 서비스 테스트를 위한 예시:

```typescript
describe('AI Analysis Service', () => {
  it('should analyze text successfully', async () => {
    const request = {
      originalText: '테스트 원문...',
      userSummary: '테스트 요약...',
      difficultyLevel: 1
    };

    const result = await analyzeWithAI(request);

    expect(result.aiSummary).toBeDefined();
    expect(result.similarityScore).toBeGreaterThanOrEqual(0);
    expect(result.similarityScore).toBeLessThanOrEqual(100);
    expect(result.wellUnderstood).toBeInstanceOf(Array);
    expect(result.missedPoints).toBeInstanceOf(Array);
    expect(result.improvements).toBeInstanceOf(Array);
  });

  it('should handle timeout', async () => {
    // 타임아웃 시뮬레이션
    await expect(analyzeWithAI(request)).rejects.toThrow('AI_SERVICE_TIMEOUT');
  });
});
```

## 다음 단계

1. AI 서비스 선택 (OpenAI, Anthropic, 자체 모델 등)
2. API 키 발급 및 설정
3. 프롬프트 엔지니어링 및 최적화
4. 에러 처리 및 로깅 구현
5. 비용 모니터링 시스템 구축
