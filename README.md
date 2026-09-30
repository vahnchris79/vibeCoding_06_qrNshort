# 🌐 QR & URL 스마트 툴킷 (QR & URL Toolkit)

QR코드 생성과 OpenAPI 기반 URL 단축 기능을 하나의 웹 앱으로 통합한 올인원 링크 솔루션입니다.

---

## 🚀 빠른 시작 (Getting Started)

별도의 백엔드 설치나 패키지 빌드 없이 순수 웹 표준 기술로 작성되어 있어, 브라우저에서 바로 열거나 간단한 로컬 웹 서버로 즉시 실행할 수 있습니다.

```bash
# 로컬 웹 서버 실행 (Python 3)
python3 -m http.server 8080

# 브라우저 접속
http://localhost:8080/index.html
```

---

## ✨ 핵심 기능 안내

### 1. 메인 허브 화면 (`/index.html`)
- **'QR코드' 버튼**: 클릭 시 `url2qr/index.html`로 즉시 연결
- **'URL단축' 버튼**: 클릭 시 `urlShort/index.html`로 즉시 연결
- 감각적인 3D 카드 틸트 인터랙션과 앰비언트 그래디언트 배경 효과 제공

### 2. QR코드 생성기 (`/url2qr/index.html`)
- URL 입력 시 실시간 고화질 QR코드 자동 렌더링
- QR코드 직접 클릭 또는 'JPG 다운로드' 버튼 클릭 시 고해상도 JPG 파일 저장
- 클립보드로 이미지 복사 지원

### 3. URL 단축기 (`/urlShort/index.html`)
- **3-1. UI 구성**: 'URL 입력'창, '단축하기' 버튼, '읽기 전용 출력 상자', '복사' 버튼
- **3-2. 버튼 비활성화**: 입력 필드가 비어있으면 '단축하기' 버튼이 자동으로 비활성화(`disabled`)
- **3-3. OpenAPI 단축**: `is.gd` 및 `v.gd` 공개 OpenAPI 연동으로 초고속 단축 URL 생성 및 읽기 전용 상자에 결과 표시
- **3-4. 원클릭 복사 & 알림**: '복사' 버튼 클릭 시 클립보드 자동 복사 및 **'복사하였습니다.'** 알림창 표시
- **부가 기능**:
  - 단축 URL로 즉시 QR코드 생성 연동 (`../url2qr/index.html?url=...`)
  - 최근 단축한 링크 내역(히스토리) 보관

---

## 📂 파일 구조

```
project06/
├── index.html              # 메인 허브 포털 화면
├── css/style.css           # 메인 허브 스타일시트
├── js/main.js              # 메인 허브 인터랙션
├── img/logo.png            # 공통 브랜딩 로고
├── url2qr/                 # QR코드 생성기 모듈
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   └── js/qrcode.min.js
├── urlShort/               # URL 단축기 모듈 (신규)
│   ├── index.html
│   ├── css/style.css
│   ├── js/app.js
│   └── img/logo.png
├── SPECIFICATION.md        # 기능 명세서
└── README.md               # 프로젝트 안내 문서
```
