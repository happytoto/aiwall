// Claude로 보내기 전에 개인정보·비밀값을 가립니다. IP는 분석에 필요해서 남깁니다.
// 순서가 중요합니다: 긴 패턴(키 블록, 카드번호)을 짧은 패턴(전화번호)보다 먼저 처리합니다.
const RULES = [
  ["PRIVATE_KEY", /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[PRIVATE_KEY]"],
  ["TOKEN", /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/-]+=*/g, "$1 [TOKEN]"],
  ["SECRET", /\b(password|passwd|secret|token|api[_-]?key|access[_-]?key)(\s*[=:]\s*)("[^"]*"|'[^']*'|[^\s&,;]+)/gi, "$1$2[SECRET]"],
  ["AWS_KEY", /\b(AKIA|ASIA)[0-9A-Z]{16}\b/g, "[AWS_KEY]"],
  ["CARD", /\b(?:\d{4}[- ]){3}\d{4}\b|\b\d{16}\b/g, "[CARD]"],
  ["RRN", /\b\d{6}-?[1-8]\d{6}\b/g, "[RRN]"],
  ["EMAIL", /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g, "[EMAIL]"],
  ["PHONE", /\b01[016789]-?\d{3,4}-?\d{4}\b/g, "[PHONE]"],
];

export function maskSensitive(text) {
  const counts = {};
  let out = String(text);
  for (const [name, pattern, replacement] of RULES) {
    const matches = out.match(pattern);
    if (!matches) continue;
    counts[name] = matches.length;
    out = out.replace(pattern, replacement);
  }
  return { text: out, counts };
}
