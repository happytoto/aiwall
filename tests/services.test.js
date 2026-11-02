import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { maskSensitive } from "../lib/mask.js";
import { ITEMS, scoreAnswers } from "../lib/checklist.js";
import { onRequestPost as triage } from "../functions/api/triage.js";
import { onRequestPost as report } from "../functions/api/report.js";
import { onRequestPost as compliance } from "../functions/api/compliance.js";

// Claude API를 실제로 부르지 않고, 보낸 요청을 기록한 뒤 정해 둔 응답을 돌려줍니다.
let sent;
let reply;
beforeEach(() => {
  sent = [];
  globalThis.fetch = async (url, init) => {
    sent.push({ url: String(url), headers: new Headers(init.headers), body: JSON.parse(init.body) });
    const { status = 200, stop_reason = "end_turn", output } = reply;
    const body = status === 200
      ? { id: "msg_test", type: "message", role: "assistant", model: "claude-opus-5-5", stop_reason, stop_details: null,
          content: [{ type: "text", text: JSON.stringify(output) }], usage: { input_tokens: 10, output_tokens: 10 } }
      : { type: "error", error: { type: "rate_limit_error", message: "slow down" } };
    return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  };
});

const env = { ANTHROPIC_API_KEY: "sk-ant-test" };
const post = (body, headers = {}) => new Request("https://example.com/api", {
  method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body),
});
const call = async (fn, body, e = env, headers) => {
  const res = await fn({ request: post(body, headers), env: e });
  return { status: res.status, data: await res.json() };
};

const triageOutput = {
  summary: "root 무차별 대입 시도가 있습니다.", overall_risk: "high",
  findings: [{ severity: "high", title: "무차별 대입", evidence: "Failed password for root", explanation: "x", recommendation: "IP 차단", needs_human_review: true }],
  next_checks: ["auth.log 전체"],
};

test("민감정보를 가리고 IP는 남긴다", () => {
  const { text, counts } = maskSensitive(
    "user=kim@corp.co.kr password=hunter2 from 10.0.0.5 tel 010-1234-5678 rrn 900101-1234567 Authorization: Bearer abc.def AKIAABCDEFGHIJKLMNOP card 4111-1111-1111-1111",
  );
  assert.ok(!text.includes("kim@corp.co.kr") && !text.includes("hunter2") && !text.includes("010-1234-5678"));
  assert.ok(!text.includes("900101-1234567") && !text.includes("abc.def") && !text.includes("AKIAABCDEFGHIJKLMNOP"));
  assert.ok(!text.includes("4111-1111-1111-1111"));
  assert.ok(text.includes("10.0.0.5"));
  assert.match(text, /password=\[SECRET\]/);
  assert.match(text, /Bearer \[TOKEN\]/);
  assert.deepEqual(counts, { TOKEN: 1, SECRET: 1, AWS_KEY: 1, CARD: 1, RRN: 1, EMAIL: 1, PHONE: 1 });
});

test("sudo 로그의 작업 폴더(PWD=)는 비밀값으로 보지 않는다", () => {
  const line = "sudo: deploy : TTY=pts/0 ; PWD=/home/deploy ; USER=root ; COMMAND=/usr/bin/id";
  assert.equal(maskSensitive(line).text, line);
});

test("점검표 점수는 규칙으로 계산한다", () => {
  const all = (s) => Object.fromEntries(ITEMS.map(({ id }) => [id, s]));
  assert.equal(scoreAnswers(all("yes")).total, 100);
  assert.equal(scoreAnswers(all("partial")).total, 50);
  assert.equal(scoreAnswers(all("no")).total, 0);
  assert.equal(scoreAnswers({}).byDomain.length, 10);
});

test("triage: 가린 로그를 Claude에 보내고 구조화 결과를 돌려준다", async () => {
  reply = { output: triageOutput };
  const { status, data } = await call(triage, { logs: "sshd: Failed password for root, admin@corp.com" });
  assert.equal(status, 200);
  assert.equal(data.overall_risk, "high");
  assert.deepEqual(data.masked, { EMAIL: 1 });

  const req = sent[0];
  assert.match(req.url, /\/v1\/messages/);
  assert.equal(req.body.model, "claude-opus-5-5");
  assert.equal(req.body.fallbacks, "default");
  assert.match(req.headers.get("anthropic-beta"), /server-side-fallback-2026-07-01/);
  assert.equal(req.body.output_config.effort, "medium");
  assert.equal(req.body.output_config.format.type, "json_schema");
  assert.ok(!JSON.stringify(req.body.messages).includes("admin@corp.com"));
});

test("report: 보고서를 만든다", async () => {
  reply = { output: { title: "보고서", executive_summary: "요약", risk_rating: "medium",
    items: [{ title: "a", severity: "medium", impact: "b", action: "c", priority: "within_1_week", owner_role: "서버 관리자" }], roadmap: ["1"] } };
  const { status, data } = await call(report, { findings: "SSH 무차별 대입", company: "테스트사" });
  assert.equal(status, 200);
  assert.equal(data.company, "테스트사");
  assert.equal(data.items.length, 1);
});

test("compliance: 모든 항목에 답해야 하고, 모르는 id는 걸러낸다", async () => {
  let res = await call(compliance, { answers: { "gov-1": "yes" } });
  assert.equal(res.status, 400);
  assert.equal(sent.length, 0);

  reply = { output: { overall: "총평", maturity: "developing", quick_wins: ["MFA 켜기"], gaps: [
    { item_id: "acc-1", risk: "r", action: "a", priority: "immediate" },
    { item_id: "made-up", risk: "r", action: "a", priority: "immediate" },
  ] } };
  const answers = Object.fromEntries(ITEMS.map(({ id }) => [id, id === "acc-1" ? "no" : "yes"]));
  res = await call(compliance, { answers });
  assert.equal(res.status, 200);
  assert.deepEqual(res.data.gaps.map((g) => g.item_id), ["acc-1"]);
  assert.equal(res.data.score.total, Math.round(((ITEMS.length - 1) / ITEMS.length) * 100));
});

test("오류 처리: 거절, 속도 제한, 키 없음, 이용 코드", async () => {
  reply = { output: triageOutput, stop_reason: "refusal" };
  assert.equal((await call(triage, { logs: "x" })).status, 422);

  reply = { status: 429 };
  const limited = await call(triage, { logs: "x" }, { ...env });
  assert.equal(limited.status, 429);

  assert.equal((await call(triage, { logs: "x" }, {})).status, 503);
  assert.equal((await call(triage, { logs: "" })).status, 400);

  const locked = { ...env, ACCESS_CODE: "rocket" };
  assert.equal((await call(triage, { logs: "x" }, locked)).status, 401);
  reply = { output: triageOutput };
  assert.equal((await call(triage, { logs: "x" }, locked, { "x-access-code": "rocket" })).status, 200);
});
