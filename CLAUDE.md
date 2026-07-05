# CraveMap 프로젝트 컨텍스트

## 프로젝트 개요
외국인 유학생을 위한 본국 음식점/마트 지도 서비스
스택: Next.js (App Router) + Supabase + TypeScript + Tailwind CSS + next-intl + Zustand
타겟: 모바일 웹 (모바일 브라우저 기준으로 UI 개발, 데스크톱은 보조)
디자인: 모바일 우선 반응형 (390px 기준)

## DB 테이블 구조
- countries: 국가 정보 (code, flag_emoji, name_i18n JSONB, marker_color)
- users: 회원 정보 (id=auth.uid, email, nickname, country_code, provider, is_verified)
- stores: 가게 정보 (name, country_code, category, latitude, longitude, address, memo, is_approved, reported_by)
- store_images: 가게 사진 (store_id, image_url, storage_path, order_index 0~2)
- comments: 댓글 (store_id, user_id, content)

## 핵심 개발 원칙

### 데이터
- 국가명: DB countries.name_i18n[locale]에서 동적 조회
- 카테고리명: /messages/{locale}.json 번역 파일에서 관리
- 가게이름/주소/메모: 번역 없이 원문 그대로 표시

### 인증
- 보호 라우트: /report, /mypage → 미들웨어에서 세션 확인
- Google 로그인 후 nickname/country_code가 NULL이면 /onboarding 강제 리다이렉트
- 권한 체크: 서버 로직 + RLS 이중 확인

### 지도
- 마커 필터링: 서버 재요청 없이 클라이언트에서 setMap(null)로 처리
- 나라 필터 + 카테고리 필터: AND 조건 동시 적용
- 마커 색상: CN=#DE2910 / VN=#FFCD00 / JP=#2B4C8C / 기타=#7F8C8D

### API
- 제보 등록 순서 반드시 지킬 것:
  1. 이미지 Storage 업로드
  2. stores INSERT
  3. store_images INSERT (실패해도 가게는 유지, 207 반환)
- 댓글 삭제: 서버에서 user_id 확인 + RLS 이중 보호

### 다국어
- 지원 언어: ko / en / zh / vi / ja
- 번역 파일 위치: /messages/{locale}.json
- 언어 감지 순서: localStorage → navigator.language → 기본값 ko
- 번역 키 누락 시 ko로 폴백

### Supabase 클라이언트
- 클라이언트 컴포넌트: createBrowserClient
- 서버 컴포넌트/API Route: createServerClient

### 에러 처리
- 폼 오류: 인라인 메시지
- API 실패: 하단 토스트
- 로그인 실패: 이메일/비밀번호 중 어느 쪽인지 구분 안 함 (보안)

## 세부 정의서 위치 (노션)
- 인증 플로우 정의서
- 지도 API 정의서
- API 명세서
- 다국어(i18n) 정의서
- 개발 원칙/컨벤션

## CraveMap 프로젝트 현재 상태

### 완료된 세팅
- Next.js (App Router) + TypeScript + Tailwind CSS 프로젝트 생성 완료
- 패키지 설치 완료: @supabase/supabase-js, @supabase/ssr, next-intl, zustand, date-fns
- 환경변수 설정 완료 (.env.local에 Supabase URL, anon key, 카카오맵 키 입력됨)

### 생성된 파일들
- lib/supabase.ts → 브라우저용 Supabase 클라이언트
- lib/supabase-server.ts → 서버용 Supabase 클라이언트
- types/index.ts → Country, User, Store, StoreImage, Comment 타입 정의
- messages/ko.json, en.json, zh.json, vi.json, ja.json → 5개 언어 번역 파일
- i18n.ts → next-intl 설정
- middleware.ts → 보호 라우트(/report, /mypage) + 다국어 미들웨어
- CLAUDE.md → 프로젝트 개발 원칙 정의

### Supabase DB 현황
- 테이블 생성 완료: countries, users, stores, store_images, comments
- RLS 정책 적용 완료
- auth.users 생성 시 public.users 자동 INSERT 트리거 적용 완료

### 앞으로 개발할 순서
1. 레이아웃 및 네비게이션 바
2. 로그인/회원가입/온보딩 페이지
3. 지도 메인 화면 (카카오맵 + 마커 + 필터)
4. 제보하기 페이지
5. 가게 상세 (바텀시트/사이드 패널)
6. 댓글 기능
7. 다국어 적용 마무리 및 배포