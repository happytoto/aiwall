# RocketSecu 서비스 모듈

홈페이지에 소개한 서비스 3가지를 고객이 `/services.html`에서 바로 쓸 수 있게 만든 모듈입니다.
Cloudflare Pages Functions에서 Claude API(`claude-opus-5-5`)를 호출합니다.

## 1. 서비스별 계획과 구현

| 서비스 | 고객 문제 | 입력 | 출력 | API | 주요 파일 |
|---|---|---|---|---|---|
| AI 로그 분석 | 로그를 읽을 사람이 없음 | 로그 텍스트(최대 10만 자), 환경 설명 | 요약, 위험도, 발견 항목(근거·설명·조치·사람 확인 여부), 추가 확인 항목 | `POST /api/triage` | `functions/api/triage.js` |
| 보고서 자동 작성 | 컨설팅 보고서가 느리고 비쌈 | 점검 결과, 회사명, 범위 | 경영진 요약, 조치 목록(영향·조치·기한·담당), 3개월 로드맵. PDF 저장 | `POST /api/report` | `functions/api/report.js` |
| 보안 기본 점검 | 무엇부터 해야 할지 모름 | 19개 질문 답변, 회사 정보 | 규칙 기반 점수(영역별), 성숙도, 부족한 항목별 위험·개선, 이번 주 할 일 | `POST /api/compliance` | `functions/api/compliance.js`, `lib/checklist.js` |

세 서비스는 이어서 쓸 수 있습니다. 로그 분석 결과의 "이 결과로 보고서 만들기"를 누르면 보고서 탭에 내용이 채워집니다.

## 2. 설계 원칙 (홈페이지 약속과 일치)

| 홈페이지 약속 | 구현 |
|---|---|
| 데이터 최소화 | `lib/mask.js`가 이메일·전화번호·주민등록번호·카드번호·비밀번호·토큰·AWS 키·개인키를 Claude로 보내기 전에 가림. 가린 개수는 고객에게 표시 |
| 사람이 최종 판단 | 영향이 큰 조치는 `needs_human_review`로 표시하고 화면에 경고. 보고서에 "전문가 검수 권장" 문구 |
| 방어 목적만 | 시스템 프롬프트에 방어 목적 조치만 제안하도록 명시. 거절(`refusal`)되면 안내 문구 반환 |
| 정확성 | 점검 점수는 AI가 아니라 규칙으로 계산(같은 답이면 같은 점수). 모르는 항목 id는 서버가 걸러냄 |
| 안전한 출력 | Structured Outputs(Zod 스키마)로 결과 형식을 고정. 화면에는 `textContent`로만 넣어 HTML 실행 차단 |
| 프롬프트 주입 방어 | 고객 입력은 `<logs>`, `<findings>`, `<company>` 태그로 감싸고 그 안의 지시문을 따르지 않게 함 |

Claude 호출 공통 처리(`lib/claude.js`): Structured Outputs, `effort: medium`, 분류기 거절 시 Anthropic 권장 모델로 넘기는 `fallbacks: "default"`, SDK 오류 종류별 안내 메시지.

## 3. 운영 설정 (Cloudflare 대시보드)

**Workers & Pages → aiwall → Settings → Variables and Secrets**에 추가합니다.

| 변수 | 필수 | 설명 |
|---|---|---|
| `ANTHROPIC_API_KEY` | 예 (Secret) | Claude Console에서 발급한 API 키. 없으면 서비스가 "설정이 끝나지 않았습니다"를 반환 |
| `ACCESS_CODE` | 권장 (Secret) | 설정하면 이 코드를 입력한 고객만 사용 가능. 데모 신청 고객에게 메일로 전달. 비워 두면 누구나 사용(API 비용 주의) |

변수를 추가한 뒤 다시 배포해야 반영됩니다.

## 4. 테스트

```bash
npm install
npm test
```

테스트는 Claude API를 실제로 부르지 않고 가짜 응답으로 확인합니다: 민감정보 가리기, 점수 계산, 요청 형식(모델·fallbacks·structured output), 오류 처리(거절·속도 제한·키 없음·이용 코드).

## 5. 다음 단계 제안

| 순서 | 할 일 | 이유 |
|---|---|---|
| 1 | 실제 로그 샘플로 결과 품질 검토 | 지금 테스트는 응답 형식만 확인함. 품질은 실제 호출로만 확인 가능 |
| 2 | 사용량 제한 (Cloudflare Rate Limiting 또는 KV) | 이용 코드가 유출되면 비용이 늘 수 있음 |
| 3 | 결과 저장·이력 (Cloudflare D1) | 고객이 지난 분석을 다시 볼 수 있게 |
| 4 | 같은 지시문 반복 비용 절감 (프롬프트 캐싱) | 시스템 프롬프트를 길게 키우면 효과가 커짐 |
