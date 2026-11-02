# 플러그인·스킬·MCP 설치 보고서 (2026-10-06)

출처: 게으른 빌더(lazyowen.com) 가이드. 이 클라우드 환경에서는 사이트 접속이 막혀 있어서 검색 결과로 읽었습니다.
- [클로드 코드를 쓰기 전에 깔아야 하는 플러그인 5개](https://lazyowen.com/en/guides/claude-skills-top5-0815)
- [Prompt Master](https://lazyowen.com/en/guides/prompt-master)
- [Graphify](https://lazyowen.com/guides/graphify)
- "필수 MCP 5개" 가이드: 원문 목록을 확인하지 못했습니다. 그래서 여러 출처에서 공통으로 추천하는 항목으로 대신했습니다.

## 요약: 도구 총 13개 중 11개 필요, 그중 5개 설치 완료(검증됨)

| # | 도구 | 종류 | 필요 | 결과 | 검증 / 사유 |
|---|------|------|------|------|-------------|
| 1 | OmniRoute | npm CLI | O | ⚠️ 설치만 됨 | `omniroute --version` → 3.8.48. 컨테이너 전용이라 다음 세션에서는 사라짐. 실제로 쓰려면 로컬 PC에서 계정을 연결해야 함 |
| 2 | Headroom | pip | O | ❌ 차단 | 자동 보안 분류기가 거부함(외부 코드 통합) |
| 3 | claude-mem | npx 설치기 | O | ❌ 차단 | 위와 같은 사유 |
| 4 | claude-code-setup | 공식 플러그인 | O | ✅ | `.claude/settings.json`의 `enabledPlugins`에 등록 |
| 5 | Task Observer | 스킬 | O | ✅ | `.claude/skills/task-observer` (v3.5.0). 세션 스킬 목록에 인식됨 |
| 6 | Prompt Master | 스킬 | O | ✅ | `.claude/skills/prompt-master` (v1.8.0). 세션 스킬 목록에 인식됨 |
| 7 | Graphify | pip + 훅 | O | ❌ 차단 | 위와 같은 사유 |
| 8 | Playwright MCP | MCP | O | ✅ | 핸드셰이크 성공, 도구 25개 |
| 9 | Sequential Thinking MCP | MCP | O | ✅ | 핸드셰이크 성공, 도구 1개 |
| 10 | Context7 MCP | MCP | O | ⚠️ 등록만 됨 | `.mcp.json`에 등록. 이 환경에서는 네트워크 정책으로 접속 불가(403) |
| 11 | GitHub MCP | MCP | O | ✅ 기존 | 이 세션에 이미 연결되어 있음 |
| 12 | Filesystem MCP | MCP | X | — | Claude Code에 내장된 파일 도구와 기능이 겹침 |
| 13 | 기존 디자인 스킬 3종 | 스킬 | — | 이미 있음 | impeccable, design-taste-frontend, emil-design-eng |

## 변경 파일
- `.claude/skills/prompt-master/`, `.claude/skills/task-observer/`: 새 스킬
- `.mcp.json`: playwright, context7, sequential-thinking (버전 고정)
- `.claude/settings.json`: MCP 자동 승인, 공식 마켓플레이스, claude-code-setup 플러그인

## 남은 작업 (사용자 PC에서 직접 실행)
```bash
pip install "headroom-ai[all]" && headroom doctor
npx --yes claude-mem@latest install
pip install graphifyy && graphify claude install
omniroute   # 실행 후 확인: curl http://localhost:20128/v1/models
```
