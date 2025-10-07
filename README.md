# Pedi Codex

소아과 기출 5개년 데이터를 GitHub Pages에서 바로 확인할 수 있는 정리본입니다. 검색, 연도별 필터, 딥링크가 포함된 정적 대시보드라서 별도의 백엔드 없이도 운영할 수 있습니다.

## 빠르게 배포하기

1. 저장소를 자신의 GitHub 계정으로 포크하거나 `Use this template`로 새 저장소를 만듭니다.
2. 저장소 설정에서 **Settings → Pages**로 이동합니다.
3. **Deploy from a branch**를 선택하고, **Branch: `main` / `root`**를 지정합니다.
4. 몇 분 뒤 생성되는 `https://<github-아이디>.github.io/pedi/` 주소에 접속하면 Codex 대시보드가 열립니다.

## 로컬에서 미리보기

```bash
git clone https://github.com/<github-아이디>/pedi.git
cd pedi
python -m http.server
```

브라우저에서 `http://localhost:8000`을 열면 GitHub Pages와 동일한 화면을 확인할 수 있습니다.

## 데이터 구조

- `chapter/` : 장별 Markdown. 각 파일의 Frontmatter와 본문이 목차 카드로 변환됩니다.
- `question_bank.json` : 문제 메타데이터. 연도, 회차, 키워드 등이 포함되며 검색 인덱스와 연도 칩을 구성합니다.
- `key_mapping.json` : 질문 키를 목차 항목에 연결하는 맵.

데이터를 수정한 뒤 커밋하면 다음 배포 때 자동으로 반영됩니다. 숫자, 연도 등의 포맷을 맞춰야 검색 결과가 정확하게 동작합니다.

## Codex 대시보드 사용법

1. 상단 메트릭 카드에서 전체 장/절/항목/문제 규모를 확인합니다.
2. “개념/문제 검색” 입력란에 키워드를 적으면 장·절·항목·문제가 묶인 카드가 표시됩니다.
3. 카드의 **바로 가기** 링크는 해당 목차 위치로 이동하며, 연도 칩을 클릭하면 특정 연도 문제만 필터링됩니다.
4. 추가로 정리할 내용이 있다면 `chapter/`의 Markdown에 서브헤딩과 본문을 작성하면 자동으로 목차에 반영됩니다.

필요에 따라 스타일(`style.css`)이나 상호작용(`script.js`)을 수정해 자신만의 학습 Codex로 확장하세요.
