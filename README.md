# HallOfFame

정적 GitHub Pages용 HallOfFame 웹사이트입니다. HTML/CSS/Vanilla JS만 사용하며, 영화/도서 카드 탐색, 검색, 다국어 전환(ko/en/ja), 상세 모달을 제공합니다.

## 파일 구조

- `index.html`: 메인 페이지 마크업
- `styles.css`: 반응형 스타일
- `app.js`: 필터/검색/다국어/모달 로직
- `data/items.json`: 카드 데이터 소스

## GitHub Pages 배포 (repo-based)

`username.github.io/HallOfFame` 형태로 배포하는 방법입니다.

1. GitHub에 `HallOfFame` 저장소를 push 합니다.
2. 저장소 `Settings` -> `Pages`로 이동합니다.
3. `Build and deployment`에서 `Source`를 `Deploy from a branch`로 선택합니다.
4. Branch를 `main`(또는 원하는 배포 브랜치), 폴더를 `/ (root)`로 선택 후 저장합니다.
5. 배포 완료 후 URL은 `https://<username>.github.io/HallOfFame/` 입니다.

## items.json 스키마 변경 방법

현재 각 아이템은 아래 형태입니다.

```json
{
  "id": "movie-parasite",
  "category": "movie",
  "year": 2019,
  "director": "Bong Joon-ho",
  "author": "",
  "image": "https://picsum.photos/seed/parasite/700/1000",
  "title": { "ko": "기생충", "en": "Parasite", "ja": "パラサイト" },
  "comment": { "ko": "...", "en": "...", "ja": "..." },
  "description": { "ko": "...", "en": "...", "ja": "..." },
  "quote": { "ko": "...", "en": "...", "ja": "..." }
}
```

변경 시 규칙:

1. `id`는 고유값으로 유지합니다.
2. `category`는 `movie` 또는 `book`만 사용합니다.
3. `movie`는 `director`, `book`은 `author`를 채웁니다.
4. 다국어 필드(`title/comment/description/quote`)는 `ko/en/ja` 키를 유지합니다.
5. 이미지 경로는 원격 URL을 사용하면 로컬 에셋 없이 바로 렌더링됩니다.

## 이후 Vercel + Supabase로 마이그레이션 (요약)

1. Vercel에 현재 저장소를 import해 정적 사이트로 먼저 배포합니다.
2. Supabase 프로젝트 생성 후 `items` 테이블을 만들고 현재 `items.json` 데이터를 row로 이관합니다.
3. `app.js`의 `fetch("data/items.json")`를 Supabase REST API 또는 JS SDK 조회 코드로 교체합니다.
4. RLS 정책을 설정해 읽기 공개/쓰기 제한을 분리합니다.
5. 향후 관리자 페이지를 추가해 아이템 CRUD를 Supabase에 직접 반영하도록 확장합니다.
