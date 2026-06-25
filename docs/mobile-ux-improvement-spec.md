# 모바일 UI/UX 개선 기획 문서

## 1. 개요 (Objective)

**Toss Style Theme**가 Discourse 모바일 뷰에서 레이아웃이 깨지거나 간격에 오류가 발생하는 문제를 체계적으로 개선한다.  
본 문서는 UI/UX 디자이너, 프론트엔드 시니어 개발자, Discourse 전문가의 3자 회의를 통해 도출된 **실질적인 개선/보완 필요 지점**을 정리하며, 후속 개발과 검증의 기준으로 사용한다.

### 대상 사용자
- 320px ~ 800px 뷰포트를 사용하는 Discourse 모바일 웹 사용자
- iOS Safari / Android Chrome의 주소줄/하단 UI 변화, safe-area 등에 민감한 사용자

### 성공 기준 (Success Criteria)
- 주요 페이지(홈, 카테고리, 토픽 목록, 토픽 상세, 검색, 사용자 페이지, PM)에서 가로 스크롤, 요소 겹침, 잘림이 발생하지 않는다.
- 하단/상단 플로팅 UI(네비게이션, 글쓰기 버튼)가 시스템 UI(주소줄, safe-area)와 충돌하지 않는다.
- 반응형 간격이 TDS 스케일(`--tds-space-*`)에 맞춰 일관되게 적용된다.
- `!important` 남용과 중복/상충되는 미디어 쿼리가 제거된다.
- 실제 기기(iOS Safari, Android Chrome) 및 브라우저 DevTools에서 320/375/414/768px 테스트를 통과한다.

---

## 2. 현재 코드 구조 (Current Architecture)

```
scss/
  var-mixin.scss          # TDS 변수, 믹스인, 그림자
  common/                 # 공통 스타일 (헤더, 사이드바, 토픽 카드, 검색 등)
  desktop/                # 데스크톱 전용
  mobile/                 # 모바일 전용 (fkb-m-*.scss)
mobile/mobile.scss        # 모바일 빌드 엔트리
common/common.scss        # 공통 빌드 엔트리
common/head_tag.html       # head에 직접 주입되는 CSS (grid override, nav pills, 검색바 등)
javascripts/discourse/
  api-initializers/       # search-relocate, init-nav-controls, narrow-desktop, fkb-template 등
  components/             # fkb-panel, topic-list-item 섹션 등 Ember GJS 컴포넌트
```

---

## 3. 문제 분석 및 개선 지점

### 3.1 UI/UX 디자이너 관점

#### 3.1.1 시각적 일관성 및 간격 (Spacing & Visual Hierarchy)
| 문제 | 근거 | 개선 방향 |
|------|------|-----------|
| **고정 픽셀과 상대 단위 혼용** | `head_tag.html`은 픽셀(px), `scss`는 대부분 `em`/`var` 단위를 사용하여 모바일에서 일관된 간격이 나오지 않음. | 모바일은 rem/var 기반으로 통일하고, 픽셀은 기기별 렌더링 차이를 고려해 최소화. |
| **TDS 간격 토큰 미준수** | `.list-controls`의 상단 여백이 24px/16px로 하드코딩되어 있고, 카드 마진/패딩도 `--tds-space-*`와 일치하지 않는 경우가 있음. | `--tds-space-xs(4)` / `s(8)` / `m(12)` / `l(16)` / `xl(24)` / `2xl(32)`로 재매핑. |
| **피드 카드 간격 비대칭** | 데스크톱은 24px, 모바일은 `.main-link`에 `margin-block-end: var(--tds-space-l)`(16px)과 카드 쉐도우가 어색하게 맞물림. | 모바일 카드 간격을 16px 또는 12px로 고정하고, 쉐도우를 데스크톱보다 낮은 단계(`--tds-shadow-s`)로 조정. |
| **타이포그래피 위계 혼란** | 모바일에서 제목 `1.35em`과 본문 `0.95em`의 대비가 줄어들어 가독성이 떨어짐. | 모바일 제목을 1.125em~1.2em로 조정하고, 본문 line-height을 1.6으로 확보. |
| **색상/대비 일관성** | `head_tag.html`에 `#3182f6`, `#4e5968`, `#191f28` 등의 하드코딩된 색상이 다수 존재. | `--tds-blue`, `--color-text`, `--color-text-muted` 등 시맨틱 토큰으로 치환. |

#### 3.1.2 인터랙션 및 사용성
| 문제 | 근거 | 개선 방향 |
|------|------|-----------|
| **모바일 탭 가로 스크롤 미비** | README에는 “모바일/태블릿 가로 스크롤”이 명시되어 있으나, 실제 `head_tag.html`의 `nav-pills`는 `flex-flow: row wrap` 처리가 되어 있어 스크롤이 아닌 줄바꿈으로 동작. | 탭 수가 많은 경우를 대비해 `overflow-x: auto`, `white-space: nowrap`, `scrollbar-width: none` 적용. |
| **하단 플로팅 버튼 접근성** | `#create-topic` 버튼이 시각적으로만 아이콘이며, `aria-label` 부재 시 스크린 리더 사용자가 기능을 알기 어려움. | `aria-label` 추가 및 토글 상태(열림/닫힘)를 `aria-expanded`로 전달. |
| **카드 호버 모션 잔존** | 모바일에서 `:hover` 트랜스폼이 터치 이후에 stuck 상태로 남을 수 있음. | `@media (hover: hover)`로 감싸고, 모바일에서는 `:active`만 짧게 피드백. |
| **검색 드롭다운 위치/크기** | 모바일에서 검색 드롭다운이 `320px` 고정폭으로 설정되어 있어, 320px 기기에서 좌우 짤림. | 모바일은 `width: calc(100vw - 32px)`로 유동화하고, 앵커 기준 위치를 `left: 50%; transform: translateX(-50%)`로 중앙 정렬. |

---

### 3.2 프론트엔드 시니어 개발자 관점

#### 3.2.1 레이아웃 시스템
| 문제 | 근거 | 개선 방향 |
|------|------|-----------|
| **grid-template-areas 강제 덮어쓰기** | `head_tag.html`에서 `#main-outlet`의 `grid-template-areas`를 `!important`로 강제 덮어쓰고, 모바일에서는 `display: block`으로 초기화. 이는 Discourse의 다양한 body class에 따라 레이아웃이 깨질 수 있음. | 공통 레이아웃은 CSS Grid 유지, 모바일은 `display: block` 또는 `display: flex` + `flex-direction: column`으로 명시. page-specific class별 별도 검증 필요. |
| **중첩된 미디어 쿼리 및 조건 분기** | `head_tag.html`과 `scss/mobile/fkb-m-topic-list.scss`에서 `@media (max-width: 800px)`가 중복되어 있고, `max-width: 1099px`과 `max-width: 1000px` 등 기준이 제각각. | 모바일 브레이크포인트를 1개(권장: 768px 이하) 또는 2개(576, 768)로 통합하고, 기준을 문서화. |
| **고정폭 컴포넌트** | `.unified-search-bar` 320px, `.search-dropdown-anchor` 320px, `.relocated-search-wrapper` 320px 등 모바일에서 고정폭 사용. | min-width를 제거하고 `width: 100%` 기반으로 재설계. |
| **위치 지정(position) 남용** | 하단 네비게이션과 글쓰기 버튼이 `position: fixed` + `bottom` 픽셀 조합으로 배치되어, 주소줄 축소/확대, safe-area, 키보드 노출 시 위치가 어긋남. | `position: fixed` 요소에 `env(safe-area-inset-bottom)`를 적극 사용하고, 키보드 노출 시에는 `@media` 또는 JS 리사이즈 핸들러로 하단 요소를 숨기거나 재배치. |
| **요소 이동 후 DOM 상태 동기화** | `search-relocate.js`가 DOM 요소를 이동시키고, `MutationObserver`로 계속 재배치. Discourse의 리렌더링 시점과 충돌하면 검색바가 사라지거나 중복될 수 있음. | 이동 여부를 flag로 관리하고, `requestAnimationFrame`/`will-change` 최적화. 필요 시 outlet 기반 렌더링으로 마이그레이션 검토. |

#### 3.2.2 CSS 특이성 및 유지보수
| 문제 | 근거 | 개선 방향 |
|------|------|-----------|
| **`!important` 과다 사용** | `head_tag.html` 전반에 `!important`가 수십 개 사용. 이는 디버깅을 어렵게 하고, Discourse의 기본 스타일과 충돌 시 덮어쓰기 어려움. | `!important`를 제거하고, 구체적인 셀렉터 또는 CSS 변수 우선순위로 대체. |
| **head_tag.html 직접 CSS 주입** | SCSS 컴파일러를 우회하여 직접 head에 주입. 이는 테마 캐싱, 다크모드, 변수 치환에 문제를 일으킬 수 있음. | 가능한 한 `.scss` 파일로 이전하고, 불가피한 경우에만 head_tag.html에 남기되, CSS 변수 사용. |
| **믹스인/변수 미사용** | 모바일 파일에서 `var(--tds-radius-l)`, `var(--tds-space-l)` 등을 쓰지만, 데스크톱과 모바일이 별도 변수 토큰을 사용할 수 있는 구조가 없음. | `--tds-mobile-*` 같은 모바일 전용 토큰 또는 `mixin`을 정의해 관심사 분리. |
| **반응형 폭 계산 오류** | `calc(100vw - 32px)`는 좌우 16px 여백을 가정하지만, 일부 페이지에서는 본문의 실제 여백과 불일치. | Discourse의 `--d-sidebar-width`, `--main-width` 등 기본 변수와 조합하여 계산. |

#### 3.2.3 성능 및 접근성
| 문제 | 근거 | 개선 방향 |
|------|------|-----------|
| **MutationObserver로 인한 레이아웃 스래싱** | `search-relocate.js`가 `document.body`의 `childList` + `subtree`를 관찰하고, 변화마다 `relocateSearch()`를 호출. | 필요한 최소 범위(`.navigation-container` 내부)만 관찰하고, 디바운스/스로틀링 적용. |
| **focus 상태의 모바일 키보드 영향** | 검색 input에 포커스 시 키보드가 올라오면서 `.search-dropdown-anchor` 위치가 달라질 수 있음. | 포커스 시 `window.visualViewport`를 활용해 드롭다운 위치 보정. |
| **aria-label 다국어 미매핑** | `fkb-panel-toggle-button.gjs`에는 `@title`이 있지만, 시각적으로 의존하는 아이콘 버튼에 `aria-label`이 명시적이지 않음. | `i18n` 기반 `aria-label`을 추가하고, 토글 상태를 `aria-pressed`로 표현. |

---

### 3.3 Discourse 전문가 관점

#### 3.3.1 Discourse 기본 구조와의 충돌
| 문제 | 근거 | 개선 방향 |
|------|------|-----------|
| **Discourse 기본 모바일 클래스 의존** | Discourse는 `mobile-view` class를 body에 추가하지만, 본 테마는 `.navigation-topics` 등 body class에 의존하여 모바일 감지. | `.mobile-view`를 명시적으로 활용하고, 모바일 전용 스타일은 `mobile.scss`로 집중. |
| **topic-list 모바일 레이아웃 변환** | `fkb-template.js`에서 `api.registerValueTransformer("topic-list-item-mobile-layout", () => false)`를 사용하여 Discourse의 모바일 topic-list 레이아웃을 끔. 이는 향후 Discourse 업데이트 시 충돌 가능성. | 주석으로 비활성화 이유를 명시하고, Discourse 버전별 호환성을 README에 기록. |
| **column 삭제의 영향** | `topic-list-columns`에서 `posters`, `replies`, `views`, `activity`를 삭제. 모바일에서 이 데이터를 custom component로 재구현하지만, 일부 플러그인이 이 column에 의존하면 깨짐. | 플러그인 호환성 안내를 문서화하고, `disable_topic_list_modification` 옵션을 더욱 눈에 띄게 안내. |
| **Grid area 초기화** | `head_tag.html`에서 `.mobile-view #main-outlet`에 `grid-template-areas: none`을 적용. Discourse의 chat, docs, sidebar page 등에서 예상치 못한 배열 문제. | `has-full-page-chat`, `docs-page`, `has-sidebar-page`에 대한 개별 grid 정의를 명확히 하고, QA 시트에 포함. |
| **Search relocate의 Fragility** | Discourse 검색 메뉴는 `search-menu` 컴포넌트가 동적으로 생성/파괴됨. `search-relocate.js`가 DOM을 직접 조작하면, Discourse 라우팅/리렌더링 시점에 맞지 않아 빈 검색바가 생길 수 있음. | Discourse outlet(`above-main-container`, `discovery-list-container-top`) 사용을 검토하거나, `api.decorateCooked` 대신 `api.renderInOutlet`로 전환. |

#### 3.3.2 플러그인 및 테마 호환성
| 문제 | 근거 | 개선 방향 |
|------|------|-----------|
| **footer-nav 플러그인** | `html.footer-nav-visible:not(.footer-nav-ipad)` 조건이 흩어져 있으며, `f-nav-height`의 기본값이 49px로 하드코딩. | Discourse footer-nav의 실제 높이 변수를 사용하거나, fallback 값을 SCSS 변수로 중앙화. |
| **Chat / Docs / PM 페이지** | 모바일에서 `has-full-page-chat`, `docs-page`, `archetype-private_message`에 대한 별도 스타일은 있지만, 세부 레이아웃 검증이 부족. | 각 페이지에 대한 모바일 QA 체크리스트를 작성하고, 별도 테스트 페이지를 준비. |
| **다크 모드** | `head_tag.html`에 하드코딩된 색상(`#ffffff`, `#4e5968`)이 다크 모드에서 어울리지 않을 수 있음. | `var(--primary)`, `var(--secondary)` 등 Discourse 시맨틱 변수 사용. |

---

## 4. 우선순위 기반 개선 로드맵

### P0 - 긴급 (Critical / Layout Breakage)
1. **모바일 검색 드롭다운 잘림** - `width: 320px` 고정폭 제거 및 뷰포트 기반 유동폭 적용.
2. **하단 플로팅 버튼/네비게이션과 시스템 UI 충돌** - `env(safe-area-inset-bottom)` + `visualViewport` 반영.
3. **모바일 카드/목록 가로 스크롤/Overflow** - `calc(100vw - 32px)` 통일 및 `box-sizing: border-box` 점검.
4. **head_tag.html의 grid-template-areas 덮어쓰기로 인한 페이지별 깨짐** - page-specific 클래스별 grid 정의 재검토.

### P1 - 고우선 (Major UX / Spacing)
5. **TDS 간격 토큰 재매핑** - px → `--tds-space-*` 변환, 모바일 전용 토큰 정의.
6. **nav-pills 탭 가로 스크롤 구현** - `overflow-x: auto` + 스크롤바 숨김 + 터치 슬라이드 지원.
7. **`!important` 및 하드코딩 색상 제거** - 시맨틱 변수 치환, 특이성 정리.
8. **검색바 이동 로직 안정화** - MutationObserver 범위 축소 및 디바운스, DOM 중복 이동 방지.

### P2 - 중우선 (Polish / Accessibility)
9. **모바일 카드 hover 효과 제거** - `@media (hover: hover)` 적용.
10. **아이콘 전용 버튼 접근성 보강** - `aria-label`, `aria-pressed`, `aria-expanded` 추가.
11. **폰트 위계 및 라인하이트 조정** - 모바일 타이포그래피 스케일 정의.
12. **다크 모드 대응** - 하드코딩된 라이트 색상 제거.

### P3 - 낮우선 (Maintainability / Future-proof)
13. **head_tag.html → SCSS 마이그레이션** - SCSS 컴파일러를 통한 관리.
14. **브레이크포인트 통일** - 768px 기준으로 통합, 문서화.
15. **모바일 QA 체크리스트 작성** - 페이지/기기/브라우저 매트릭스 정의.
16. **Discourse 버전 호환성 문서화** - 변환기(transformer) 사용 이유 및 제약 기록.

---

## 5. 세부 개선 작업 목록 (Tasks)

### Task 1: 모바일 검색 드롭다운 유동폭
- **Acceptance**: 320px 기기에서 검색 결과 드롭다운이 좌우 16px 여백을 유지하며 잘리지 않음.
- **Verify**: Chrome DevTools 320px, iPhone SE 시뮬레이터에서 시각 확인.
- **Files**: `common/head_tag.html`

### Task 2: 하단 플로팅 UI safe-area 적용
- **Acceptance**: `navigation-controls`, `#navigation-bar`, `#create-topic` FAB가 iPhone 노치/주소줄 변화에도 겹침 없이 배치.
- **Verify**: iOS Safari 실기기 또는 Simulator에서 상하 스크롤, 키보드 노출 테스트.
- **Files**: `scss/mobile/fkb-m-topic-list.scss`, `scss/mobile/fkb-m-f-nav.scss`

### Task 3: TDS 간격 토큰 재매핑
- **Acceptance**: 모바일 스타일에서 12px/16px/24px 등의 간격이 `--tds-space-*`로 일치.
- **Verify**: SCSS 검색으로 px 단위 하드코딩을 5개 이하로 감소.
- **Files**: `scss/mobile/*.scss`, `common/head_tag.html`

### Task 4: nav-pills 탭 가로 스크롤
- **Acceptance**: 탭이 2줄로 줄바꿈되지 않고, 터치로 좌우 스크롤 가능.
- **Verify**: 탭이 5개 이상일 때 375px 뷰포트에서 가로 스크롤 확인.
- **Files**: `common/head_tag.html`, `scss/common/fkb-c-global.scss`

### Task 5: `!important` 및 하드코딩 색상 제거
- **Acceptance**: `head_tag.html`의 `!important` 사용 30% 이상 감소, 하드코딩 색상 50% 이상 변수 치환.
- **Verify**: 정규식 검색으로 개수 비교.
- **Files**: `common/head_tag.html`

### Task 6: 검색바 이동 안정화
- **Acceptance**: 페이지 전환 20회 후에도 검색바가 1개만 존재, 중복 없음.
- **Verify**: `document.querySelectorAll('.unified-search-bar').length`가 1 또는 0.
- **Files**: `javascripts/discourse/api-initializers/search-relocate.js`

### Task 7: 모바일 hover 제거
- **Acceptance**: 모바일 터치 디바이스에서 카드 탭 후 stuck hover 상태 없음.
- **Verify**: Chrome DevTools 모바일 터치 시뮬레이션으로 확인.
- **Files**: `scss/common/fkb-c-topic-list.scss`, `scss/mobile/fkb-m-topic-list.scss`

### Task 8: 접근성 보강
- **Acceptance**: 모든 아이콘 전용 버튼에 `aria-label` 존재, 토글 버튼에 `aria-pressed`/`aria-expanded` 상태.
- **Verify**: axe-core 또는 Lighthouse a11y audit에서 관련 warning 제거.
- **Files**: `javascripts/discourse/components/fkb-panel-toggle-button.gjs`, `javascripts/discourse/components/topic-list-item/*.gjs`, `common/head_tag.html`

### Task 9: page-specific grid 정의 검증
- **Acceptance**: `mobile-view`, `has-full-page-chat`, `docs-page`, `has-sidebar-page`에서 가로 스크롤/격자 깨짐 없음.
- **Verify**: 해당 페이지를 375px, 768px에서 각각 확인.
- **Files**: `common/head_tag.html`

### Task 10: 모바일 QA 체크리스트 작성
- **Acceptance**: 10개 이상 주요 시나리오를 담은 체크리스트 문서 작성.
- **Verify**: 팀 리뷰 승인.
- **Files**: `docs/mobile-qa-checklist.md`

---

## 6. 기술적 경계 (Boundaries)

- **Always**:  
  - 모든 변경은 `.mobile-view` 또는 모바일 전용 미디어 쿼리 내에서 적용.  
  - `var(--tds-space-*`, `--tds-radius-*`, `--tds-shadow-*)`를 우선 사용.  
  - `env(safe-area-inset-bottom)` 및 `visualViewport`를 고려.  
  - 변경 후 `git diff`를 확인하고, atomic commit으로 기록.  

- **Ask first**:  
  - `head_tag.html`의 구조적 변경(예: grid-template-areas 제거).  
  - Discourse API 버전 업데이트 또는 transformer 추가/제거.  
  - 신규 JS 의존성 추가.  

- **Never**:  
  - 새로운 `!important`를 추가하지 않음.  
  - 데스크톱 레이아웃을 깨뜨리는 모바일 수정.  
  - 특정 브라우저의 비표준 CSS hack 사용.  

---

## 7. 검증 전략 (Testing Strategy)

### 7.1 수동 시각 테스트
- **뷰포트**: 320, 375, 390, 414, 768px
- **브라우저**: iOS Safari (실기기/Simulator), Android Chrome, Chrome DevTools, Firefox Responsive
- **시나리오**:  
  - 홈/토픽 목록 스크롤 시 하단 FAB/네비게이션 동작  
  - 검색 포커스 → 결과 드롭다운 위치  
  - 탭이 많은 카테고리/태그 페이지에서 가로 스크롤  
  - 키보드 노출 시 composer 및 검색 UI  

### 7.2 정적 검사
- SCSS 컴파일 오류 확인 (Discourse CLI 또는 `sass`)
- `!important` 개수 및 px 하드코딩 개수 변화 추적
- `head_tag.html`과 `.scss` 간 중복 규칙 검색

### 7.3 접근성 검사
- axe-core 또는 Lighthouse
- 키보드 탭 네비게이션
- VoiceOver/TalkBack으로 주요 버튼 라벨 확인

---

## 8. 열린 질문 (Open Questions)

1. 모바일 브레이크포인트를 768px 단일 기준으로 통일하는 것이 가능한가, 아니면 576px/768px 2단계가 필요한가?  
2. `head_tag.html`의 CSS를 SCSS로 완전 이전할 것인가, 아니면 일부만 이전할 것인가?  
3. 검색바 이동 로직을 outlet 기반으로 리팩터링할 때, 현재 사용 중인 Discourse 버전에서 지원하는 outlet은 무엇인가?  
4. 다크 모드 지원 범위는 어디까지인가? (시스템 다크 모드 전용 vs 사용자 선택)  
5. 하단 네비게이션은 Discourse footer-nav 플러그인을 사용하는가, 테마 자체 구현인가?  

---

*문서 버전: 1.0*  
*작성일: 2026-06-25*  
*다음 단계: 본 스펙 리뷰 후, P0/P1 작업부터 순차적으로 구현 및 PR.*
