---
name: 로켓보안
description: 빠르고 강한 로켓보안. 정거장 운영 매뉴얼 문법의 보안 진단·컨설팅 사이트
colors:
  rocket-red: "#cc2a14"
  rocket-red-deep: "#a8210f"
  station-white: "#f5f6f7"
  flight-ink: "#121416"
  manual-gray: "#4a4f55"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 4.6vw, 4.4rem)"
    fontWeight: 800
    lineHeight: 1.12
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "clamp(1.9rem, 2.8vw, 2.6rem)"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Pretendard Variable, Pretendard, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Archivo Expanded, Pretendard Variable, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.08em"
  figure:
    fontFamily: "Archivo Expanded, Pretendard Variable, sans-serif"
    fontSize: "clamp(2.4rem, 3.6vw, 3.2rem)"
    fontWeight: 700
    lineHeight: 1
rounded:
  none: "0px"
spacing:
  gutter: "clamp(20px, 4vw, 56px)"
  nav: "64px"
components:
  button-primary:
    backgroundColor: "{colors.rocket-red}"
    textColor: "{colors.station-white}"
    rounded: "{rounded.none}"
    padding: "15px 26px"
  button-primary-hover:
    backgroundColor: "{colors.rocket-red-deep}"
  procedure-header:
    backgroundColor: "{colors.flight-ink}"
    textColor: "{colors.station-white}"
    rounded: "{rounded.none}"
    padding: "10px 16px"
---

# Design System: 로켓보안

## Overview

**Creative North Star: "정거장 운영 매뉴얼"**

로켓보안은 하나의 궤도 정거장처럼 보인다. 1970년대 우주기관 그래픽 표준 매뉴얼의 문법을 따르며, 밝은 종이 바탕 위에 로켓 레드가 화면의 큰 면을 차지하고, 서비스는 정거장 설계도의 모듈로 설명된다. 어두운 우주 배경, 네온 방패, 같은 크기 카드 나열 같은 보안 업계 기본형은 쓰지 않는다.

밀도는 중간이다. 한 화면에 한 가지 메시지, 절차는 체크리스트 상자, 실적은 임무 기록 행으로 보여 준다. 움직임은 도면선이 한 번 그려지는 것과 스크롤에 따른 모듈 점등뿐이다.

**Key Characteristics:**
- 로켓 레드 면과 밝은 바탕의 강한 대비
- 흰 도면선으로 그린 정거장 설계도가 서비스 지도 역할
- 직각 모서리, 그림자 없음, 얇은 선과 점선 구분
- 영문 확장폭 라벨(Archivo Expanded)과 한글 본문(Pretendard)의 짝

## Colors

로켓 레드 하나가 화면의 30~60%를 차지하는 집중형 팔레트다.

### Primary
- **Rocket Red** (rocket-red): 설계도 패널, 도킹 신청 영역, 주 버튼, 강조 글자. 흰 글자와의 대비 약 5.4:1.
- **Rocket Red Deep** (rocket-red-deep): 주 버튼 hover.

### Neutral
- **Station White** (station-white): 페이지 바탕과 레드 위 글자. 순백이 아닌 차가운 흰색.
- **Flight Ink** (flight-ink): 본문, 절차 상자 머리, 테두리.
- **Manual Gray** (manual-gray): 보조 설명 글자. 바탕 대비 약 8:1.

### Named Rules
**The One Red Rule.** 강조색은 로켓 레드 하나뿐이다. 다른 색의 배지·상태 표시를 더하지 않는다.

## Typography

**Display Font:** Pretendard Variable (system-ui 대체)
**Body Font:** Pretendard Variable
**Label Font:** Archivo Expanded (font-stretch 125%, 대문자)

**Character:** 굵고 촘촘한 한글 제목과 넓게 벌린 영문 도면 라벨이 기술 매뉴얼의 표기 체계를 만든다.

### Hierarchy
- **Display** (800, clamp(2.6rem, 4.6vw, 4.4rem), 1.12): 첫 화면 헤드라인만. 강조 단어는 같은 서체의 레드.
- **Headline** (800, clamp(1.9rem, 2.8vw, 2.6rem), 1.2): 섹션 제목.
- **Body** (400, 17px, 1.65): 설명문, 최대 32em.
- **Label** (400, 0.75rem 이상, 0.08em, 대문자): 도면 라벨, 절차 상자 머리의 영문 표기. 11px 미만 금지.
- **Figure** (700, clamp(2.4rem, 3.6vw, 3.2rem)): 임무 기록의 수치, tabular-nums.

### Named Rules
**The No Eyebrow Rule.** 섹션 제목 위에 작은 라벨을 두지 않는다. 모듈 이름은 절차 상자 머리와 설계도에 적는다.

## Layout

데스크톱은 5:7 두 열이다. 왼쪽 열이 이야기(첫 화면, 진단 모듈, 컨설팅 모듈, 임무 기록)를 스크롤하고, 오른쪽 레드 패널은 내비게이션 아래에 고정되어 설계도를 계속 보여 준다. 900px 이하에서는 한 열로 쌓이고, 설계도는 첫 화면 바로 다음에 고정 없이 놓인다. 좌우 여백은 gutter 토큰, 섹션 위 여백(88px)이 아래(48px)보다 크다.

## Elevation & Depth

그림자를 쓰지 않는다. 깊이는 레드 면과 흰 바탕의 면 대비, 1~1.5px 선, 점선으로만 표현한다.

### Named Rules
**The Flat Manual Rule.** 모든 면은 평평하다. 입체 효과가 필요하면 선과 면의 대비로 푼다.

## Shapes

모서리는 모두 직각(0px)이다. 구분선은 실선 1px, 절차 목록 안은 점선, 설계도 지시선은 3-4 점선이다.

## Components

### Buttons
- **Shape:** 직각 (0px)
- **Primary:** 로켓 레드 바탕, 흰 글자, 15px 26px. 화살표 아이콘은 hover 시 3px 이동.
- **Hover / Focus:** 로켓 레드 딥으로 전환. focus는 3px 잉크 외곽선(레드 위에서는 흰색).
- **Text link:** 밑줄 링크, 굵게.

### Navigation
- 64px 고정 상단 바, 바탕색과 같은 면, 아래 1px 선. 링크는 매뉴얼 그레이, hover 시 잉크. 900px 이하에서는 도킹 신청 버튼만 남는다.

### 정거장 설계도 (Signature)
흰 도면선으로 그린 정거장: 양끝 태양전지판, 트러스, 가운데 모듈 다섯 개(도킹 포트, 진단 모듈, 허브, 컨설팅 모듈, 임무 기록). 현재 읽는 섹션의 모듈이 흰색으로 채워지고 라벨이 선명해진다. 첫 로딩 때 선이 한 번 그려진다(동작 줄이기 설정이면 생략).

### 절차 상자
잉크색 머리(한글 모듈 이름 + 영문 PROCEDURE) 아래 체크 아이콘 목록. 1.5px 잉크 테두리, 항목 사이 점선.

### 임무 기록 행
고객 유형과 과제, 7칸 일수 막대(소요 일수만큼 레드), 레드 수치와 결과 설명. 행 사이 1px 선.

## Do's and Don'ts

### Do:
- **Do** 강조가 필요하면 로켓 레드 면을 크게 쓴다.
- **Do** 서비스 설명은 설계도의 모듈 이름과 일치시킨다.
- **Do** 수치는 PRODUCT.md에 있는 사례 값만 쓴다.

### Don't:
- **Don't** 모서리를 둥글리거나 그림자를 넣지 않는다.
- **Don't** 섹션 제목 위에 작은 라벨을 두지 않는다.
- **Don't** 로켓 레드 외의 강조색을 추가하지 않는다.
