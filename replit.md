# 부산광역시인권센터 OX 퀴즈

부산광역시인권센터 부스 방문객이 3분 인권 OX 퀴즈를 풀고 럭키드로우 참여 자격을 확인하는 모바일 웹앱입니다.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/busan-human-rights-quiz/src/App.tsx` — 홈, 퀴즈, 결과/직원 인증, 운영자 문항 편집 화면
- `artifacts/busan-human-rights-quiz/src/index.css` — 부산 인권센터 행사 테마와 반응형 스타일
- `attached_assets/Pasted-Create-a-mobile-friendly-web-application-for-the-OX-boo_1788918030920.txt` — 제품 요구사항 원문

## Architecture decisions

- 방문객 참여 결과와 뉴스레터 클릭 기록은 기기별 1회 참여를 위해 브라우저 LocalStorage에 저장합니다.
- 운영자 문항은 `/admin`에서 수정하고 API 서버의 PostgreSQL에 저장하므로 일반 창·시크릿 창·다른 기기에서도 같은 문항을 읽습니다.
- 기존 버전에서 LocalStorage에만 저장된 관리자 문항은 관리자 화면을 다시 열 때 서버 저장으로 자동 이전합니다.
- 모바일 부스 환경에서 한 손 조작이 쉽도록 O/X 선택과 다음 문항 흐름을 큰 터치 영역으로 제공합니다.

## Product

- 부산광역시인권센터 소개와 무료 법률상담·인권교육 안내
- 한국어 인권 OX 5문항, 즉시 정오답 해설, 문항당 2초 대기
- 총점 확인, 기기당 1회 참여 제한, 직원 4자리 PIN 인증을 통한 럭키드로우 해금
- 지정 뉴스레터 링크와 운영자용 문항·정답·해설 편집/저장

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
