export const MIN_CONTENT_LENGTH = 1000;
export const MAX_CONTENT_LENGTH = 5000;

/** HTML 파싱 시 제거할 비본문 요소 셀렉터 */
export const REMOVE_SELECTORS = [
  'script',
  'style',
  'noscript',
  'iframe',
  'svg',
  'header',
  'footer',
  'nav',
  'form',
  'button',
  'input',
  'select',
  'textarea',
  '[role="navigation"]',
  '[role="banner"]',
  '[role="contentinfo"]',
  '.sidebar',
  '.advertisement',
  '.ad',
  '.ads',
  '.comment',
  '.comments',
  '#sidebar',
  '#comments',
  '#ad'
];

/** 본문 영역을 찾기 위한 셀렉터 */
export const CONTENT_SELECTORS = [
  'article',
  '[role="main"]',
  'main',
  '.post-content',
  '.article-content',
  '.entry-content',
  '.content',
  '#content',
  '.post-body',
  '.article-body'
];
