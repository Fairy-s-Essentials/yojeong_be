import * as cheerio from 'cheerio';
import { REMOVE_SELECTORS, CONTENT_SELECTORS } from '../constant/extract.const';

/** 연속 공백/개행을 정리하여 깔끔한 텍스트로 변환 */
export function cleanText(raw: string): string {
  return raw
    .replace(/\n{3,}/g, '\n\n') // 3줄 이상 연속 개행 → 2줄로 축소
    .replace(/[^\S\n]+/g, ' ') // 개행 제외 연속 공백 → 단일 공백
    .trim();
}

/** HTML에서 본문 텍스트를 추출 (CONTENT_SELECTORS 우선 탐색 → 실패 시 body 전체) */
export function extractText($: cheerio.CheerioAPI): string {
  $(REMOVE_SELECTORS.join(', ')).remove();

  for (const selector of CONTENT_SELECTORS) {
    const el = $(selector);
    if (el.length > 0) {
      const text = el.first().text();
      const cleaned = cleanText(text);
      if (cleaned.length > 0) {
        return cleaned;
      }
    }
  }

  return cleanText($('body').text());
}
