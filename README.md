# 제연설비 설계 계산서 — NFTC 501 · MANMIN Ver-3.0

> 제연설비의 화재안전기술기준 NFTC 501 (2024.10.1 시행) 기반 웹 계산서

## 📁 파일 구조

```
├── index.html          # 메인 앱 (모든 기능 포함)
├── manifest.json       # PWA 매니페스트
├── sw.js               # Service Worker (오프라인 캐시)
├── icons/
│   ├── favicon.ico
│   ├── icon-16x16.png  ~ icon-512x512.png
│   ├── apple-touch-icon.png  (iOS 홈화면)
│   └── icon-maskable-512x512.png  (Android 어댑티브)
└── .github/workflows/deploy.yml   # GitHub Pages 자동 배포
```

## 🚀 GitHub Pages 배포 방법

1. 이 폴더 전체를 GitHub 저장소에 업로드
2. Settings → Pages → Source: **GitHub Actions** 선택
3. `main` 브랜치에 push → 자동 배포

배포 후 URL: `https://<username>.github.io/<repo-name>/`

## 📲 PWA 설치

| 환경 | 설치 방법 |
|------|----------|
| Android Chrome | 주소창 우측 ⋮ 메뉴 → **앱 설치** (또는 화면 내 설치 버튼) |
| iPhone Safari | 하단 공유 버튼 → **홈 화면에 추가** |
| PC Chrome/Edge | 주소창 우측 ⊞ 아이콘 클릭 → **설치** |

## ✨ 주요 기능

- 배출량 산출 (NFTC 501 §2.3)
- 공기유입구 산출 (NFTC 501 §2.5.6)
- 배출풍도 강판 두께 기준 (§2.6.2.1)
- 풍속 기준 검토 (§2.6.2.2, §2.7.1)
- 비상전원 및 기동장치 기준 (§2.9)
- A4 계산서 인쇄 / PDF 저장
- 완전 오프라인 동작 (PWA)
