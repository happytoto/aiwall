# KoDT Motion & Sound

코리아디지털트러스트의 로고 모션과 음악 디렉션을 확인하는 인터랙티브 콘셉트 페이지입니다.

## 실행

`npm install` 후 `npm run dev`로 실행합니다. 프로덕션 빌드는 `npm run build`입니다.

## 구성

- `src/App.tsx`: 반응형 프로젝트 페이지, 모션 플레이어, 9개 장면, 사운드 선택, 프로젝트 노트
- `src/MotionCanvas.tsx`: 두 원에서 무한대, 45도 회전, 새로운 원으로 이어지는 3D 모션 및 SVG 대체 화면
- `src/sound.ts`: Web Audio 기반의 세 가지 48초 합성 사운드와 WAV 내보내기
- `src/project.ts`: 장면 구성, 시간 정보, 프로젝트 가이드 내보내기
- `src/index.css`: 아이보리와 테라코타 중심의 디자인과 모바일 레이아웃

제공된 참고 스케치와 악보의 개념을 해석한 작업입니다. 표시된 로고는 공식 최종 CI가 아니며, 사운드는 원곡 녹음이나 악보의 정확한 재현이 아닌 합성 콘셉트 스케치입니다. 기본 피아노 방향은 69 BPM이며, 미니멀 일렉트로닉 방향은 92 BPM입니다.

## 검증

`npx playwright install --with-deps chromium` 후 `npx playwright test`로 데스크톱 및 모바일 레이아웃, 플레이어, 노트, 사운드, 다운로드, WebGL 대체 화면을 확인할 수 있습니다.

Pretendard 폰트 라이선스는 `public/fonts/LICENSE.txt`에 포함되어 있습니다.