import * as cheerio from 'cheerio';
import {
  MIN_CONTENT_LENGTH,
  REMOVE_SELECTORS,
  CONTENT_SELECTORS
} from '../constant/extract.const';

/** 연속 공백/개행을 정리하여 깔끔한 텍스트로 변환 */
export function cleanText(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
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
      if (cleaned.length >= MIN_CONTENT_LENGTH) {
        return cleaned;
      }
    }
  }

  const bodyText = $('body').text();
  return cleanText(bodyText);
}
