# TOTAL PROJECT BLUEPRINT
(Extracted Text Only - No Code Blocks)

## 1. 환경 변수 및 비밀 키 (The Keys)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBIXcgKCgoWy-nNS1-uGZaKRZirliPjVZg
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=med-check-app-c4ee9.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=med-check-app-c4ee9
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=med-check-app-c4ee9.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=290380737299
NEXT_PUBLIC_FIREBASE_APP_ID=1:290380737299:web:904b39389da696eb6a08e6
NEXT_PUBLIC_FIREBASE_VAPID_KEY=BPGEQuOR0rY9dVYs9OMexB3sxIOHFAuMMwds4jwM--ZX_rCkgVoareHnod3XGFksHyJBL6yjfsriDEb1v0cFiGA
FIREBASE_PROJECT_ID=med-check-app-c4ee9
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@med-check-app-c4ee9.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1BZFf+LkFP/bb... (중략) ...TragpkBs8RssdKEbRVw=\n-----END PRIVATE KEY-----\n"
QSTASH_TOKEN=eyJVc2VySUQiOiI0YTNjMDM2NS1hNGY5LTQ2ZjQtOTAwNC01ODRiOGZkYjc4NTEiLCJQYXNzd29yZCI6ImUzZmM2ZGFmNDAxMDRiZTdhY2U0YmZhODI0ZTI1MGIzIn0=
QSTASH_URL=https://qstash-us-east-1.upstash.io
APP_URL=http://localhost:3000

## 2. 순수 약 데이터 (The Data)
[
  { "id": "med1", "name": "씬지록신", "dose": "(갑상선 약) + 물 많이", "slot": "dawn" },
  { "id": "med2", "name": "소화효소", "dose": "1알 (베이직)", "slot": "morning" },
  { "id": "med3", "name": "류마티스 처방약", "dose": "(소론도, 옥시, 조피린, 라피졸)", "slot": "morning" },
  { "id": "med4", "name": "종근당 활성엽산", "dose": "1알 (0.8mg)", "slot": "morning", "tuesdayEvening": true },
  { "id": "med5", "name": "브라질너트", "dose": "2알", "slot": "morning" },
  { "id": "med6", "name": "소화효소", "dose": "1알 (베이직)", "slot": "noon" },
  { "id": "med7", "name": "구연산 칼슘", "dose": "1알 (250mg)", "slot": "noon" },
  { "id": "med8", "name": "마그네슘", "dose": "1알 (100 mg)", "slot": "noon" },
  { "id": "med9", "name": "오메가-3", "dose": "1알 (1250mg)", "slot": "noon" },
  { "id": "med11", "name": "비타민 K2", "dose": "1알", "slot": "noon" },
  { "id": "med10", "name": "비타민 D3", "dose": "(4000 IU)", "slot": "noon", "cycleType": "D3", "cycleStart": "2026-01-28", "cyclePeriod": 3 },
  { "id": "med12", "name": "구연산 칼슘", "dose": "1알 (250mg)", "slot": "snack" },
  { "id": "med13", "name": "마그네슘", "dose": "1알 (100 mg)", "slot": "snack" },
  { "id": "med14", "name": "소화효소", "dose": "1알 (베이직)", "slot": "evening" },
  { "id": "med15", "name": "류마티스 처방약", "dose": "(저녁분)", "slot": "evening" },
  { "id": "med16", "name": "오메가-3", "dose": "1알 (1250mg)", "slot": "evening" },
  { "id": "med_mtx", "name": "MTX (6알)", "dose": "", "slot": "evening", "cycleType": "MTX", "targetDay": 1 },
  { "id": "med17", "name": "구연산 칼슘", "dose": "1알 (250mg)", "slot": "night" },
  { "id": "med18", "name": "마그네슘", "dose": "1알 (100 mg)", "slot": "night" }
]

## 3. 수학적 로직 설명 (The Logic)

### D3 3일 주기 계산 방식
1. 오늘 날짜(시간 제외)에서 주기 시작일(cycleStart, 시간 제외)을 뺀다.
2. 경과한 일수(diffDays)가 계산된다.
3. 경과 일수를 주기 기간(3일)으로 나눈 나머지(remainder)를 구한다.
4. 나머지가 0이면 오늘이 복용일(Active)이다.
5. 나머지가 0이 아니면, D-Day까지 남은 일수는 (주기 - 나머지)이다.

### MTX 월요일 D-Day 계산 방식
1. 오늘의 요일 번호를 구한다 (0=일, 1=월, 2=화...).
2. 목표 요일(targetDay=1, 월요일)과 오늘의 요일이 같으면 오늘이 복용일(Active)이다.
3. 아니면 (7 + 목표 요일 - 오늘 요일) % 7 공식으로 남은 D-Day를 계산한다.

### 화요일 엽산 이동 처리 로직
1. 앱이 렌더링될 때 현재 요일을 확인한다.
2. 화요일(day === 2)인지 체크한다.
3. 약 리스트를 순회할 때, 'tuesdayEvening: true' 속성이 있는 약(엽산)을 발견하면,
4. 원래 슬롯('morning') 대신 'evening' 슬롯 리스트로 강제 이동시킨다.

### Upstash 예약 시 KST(한국시간) 보정 및 delay(초) 계산 공식
1. 서버(Vercel 등)의 현재 시간(UTC)을 가져온다.
2. 여기에 9시간을 더해 한국 시간(KST) 객체를 생성한다.
3. 사용자가 입력한 알림 시간(예: "08:00")을 파싱하여, 오늘의 해당 시간 KST 목표 객체를 만든다.
4. 이미 시간이 지났으면 목표 날짜를 하루 더한다(+1일).
5. [목표 KST 시간(밀리초) - 현재 KST 시간(밀리초)] / 1000 을 하여 지연 시간(delay, 초 단위)을 계산한다.
6. 이 delay 값을 Upstash에 전달하여 정확한 시점에 웹훅이 실행되도록 한다.

## 4. 핵심 서비스 설정 (The Infrastructure)

### Firebase Admin 설정 방법 (서버 사이드)
- 'firebase-admin' 패키지를 사용한다.
- admin.apps.length 체크로 중복 초기화를 방지한다.
- admin.credential.cert() 메소드에 환경 변수(projectId, clientEmail, privateKey)를 전달하여 초기화한다.
- privateKey의 줄바꿈 문자(\n)는 replace(/\\n/g, '\n') 처리가 필수적이다.

### Upstash QStash 호출 주소 및 방식
- Client 라이브러리(@upstash/qstash)를 사용한다.
- 호출 방식: qstashClient.publishJSON({})
- 타겟 URL: ${APP_URL}/api/schedule-notification (자기 자신의 API를 콜백으로 지정)
- Body: { action: 'execute-send', token: '...', ... } 형태의 JSON을 담는다.
- 핵심 옵션: delay(초 단위 계산값), retries: 0 (알림 중복 방지)

### FCM 토큰 발급 및 권한 요청 (브라우저 사이드)
- 'firebase/messaging'의 getMessaging()을 사용한다.
- Notification.requestPermission()을 호출하여 브라우저 알림 권한을 요청한다.
- 권한이 'granted'이면 getToken({ vapidKey: ... })을 호출하여 FCM 토큰을 발급받는다.
- 발급받은 토큰은 서버로 전송되어 알림 예약에 사용된다.
- 서비스 워커(firebase-messaging-sw.js 또는 유사 설정)가 백그라운드 수신을 담당한다.

## 5. 디자인 수치 (The Dimension)

- 메인 컨테이너 최대 너비: 740px
- 메인 화면 전자시계 폰트 크기: 12px (DSEG7-Classic 폰트)
- 모달 화면 시간 표시 크기: 16px (DSEG7-Classic 폰트)
- 약 아이콘 박스(picto-box) 크기: 34px x 34px
- 아이콘 박스 둥글기(border-radius): 10px
- 헤더 제목 폰트 크기: 22px
- 체크 서클 크기: 18px x 18px
