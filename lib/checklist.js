// 중소기업 보안 기본 점검표. 특정 인증 기준의 공식 항목 번호가 아니라,
// ISMS-P 같은 국내 인증을 준비할 때 먼저 갖춰야 할 기본 통제를 쉬운 말로 정리한 것입니다.
// 브라우저(services.html)와 서버(functions/api/compliance.js)가 함께 씁니다.
export const CHECKLIST = [
  { domain: "관리체계", items: [
    { id: "gov-1", text: "정보보호 책임자(담당자)가 정해져 있다" },
    { id: "gov-2", text: "문서로 된 보안 정책이 있고 1년 안에 검토했다" },
  ] },
  { domain: "계정·인증", items: [
    { id: "acc-1", text: "관리자 계정에 2단계 인증(MFA)을 쓴다" },
    { id: "acc-2", text: "퇴사·이동한 직원의 계정을 바로 회수한다" },
  ] },
  { domain: "접근통제", items: [
    { id: "net-1", text: "서버 관리 포트(SSH, RDP)를 인터넷에 그대로 열어 두지 않았다" },
    { id: "net-2", text: "직원별로 필요한 권한만 준다 (공용 관리자 계정 없음)" },
  ] },
  { domain: "암호화", items: [
    { id: "enc-1", text: "웹사이트와 API가 HTTPS만 쓴다" },
    { id: "enc-2", text: "비밀번호는 해시로, 중요한 개인정보는 암호화해서 저장한다" },
  ] },
  { domain: "로그·모니터링", items: [
    { id: "log-1", text: "서버·방화벽·웹 로그를 한곳에 모아 6개월 이상 보관한다" },
    { id: "log-2", text: "로그인 실패 급증 같은 이상 징후에 알림을 받는다" },
  ] },
  { domain: "취약점·패치", items: [
    { id: "vul-1", text: "운영체제와 주요 소프트웨어 보안 업데이트를 한 달 안에 적용한다" },
    { id: "vul-2", text: "1년에 한 번 이상 취약점 점검을 받는다" },
  ] },
  { domain: "백업·복구", items: [
    { id: "bak-1", text: "중요한 데이터를 정기적으로 백업하고, 한 벌은 분리된 곳에 둔다" },
    { id: "bak-2", text: "백업으로 실제 복구해 본 적이 있다" },
  ] },
  { domain: "사고 대응", items: [
    { id: "inc-1", text: "보안 사고가 나면 누가 무엇을 할지 정해진 절차가 있다" },
    { id: "inc-2", text: "개인정보 유출 시 신고·통지 기한과 연락처를 알고 있다" },
  ] },
  { domain: "개인정보", items: [
    { id: "pii-1", text: "수집하는 개인정보 목록과 보관 기간을 정리해 두었다" },
    { id: "pii-2", text: "개인정보 처리방침을 홈페이지에 공개했다" },
  ] },
  { domain: "교육", items: [
    { id: "edu-1", text: "직원에게 1년에 한 번 이상 피싱·보안 교육을 한다" },
  ] },
];

export const STATUSES = { yes: "예", partial: "일부", no: "아니오", unknown: "모름" };
const POINTS = { yes: 1, partial: 0.5, no: 0, unknown: 0 };

export const ITEMS = CHECKLIST.flatMap(({ domain, items }) => items.map((item) => ({ ...item, domain })));

// 점수는 AI가 아니라 규칙으로 계산합니다. 같은 답이면 언제나 같은 점수가 나옵니다.
export function scoreAnswers(answers) {
  const byDomain = CHECKLIST.map(({ domain, items }) => {
    const got = items.reduce((sum, { id }) => sum + (POINTS[answers[id]] ?? 0), 0);
    return { domain, score: Math.round((got / items.length) * 100) };
  });
  const total = ITEMS.reduce((sum, { id }) => sum + (POINTS[answers[id]] ?? 0), 0);
  return { total: Math.round((total / ITEMS.length) * 100), byDomain };
}
