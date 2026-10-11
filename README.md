# AI 선비 대표 주소

https://ai-seonbi.github.io/ 는 현재 스킬 목록 https://ai-seonbi.github.io/skills/ 로 연결합니다.

스킬별 안내는 `/skills/<skill-name>/`에서 관리합니다. 디자인 자료 주소는 https://ai-seonbi.github.io/skills/design-guide/ 입니다.

목록과 개별 페이지 원본은 https://github.com/ai-seonbi/skills 의 `docs/`에 있습니다. 이 저장소는 main 브랜치 루트에서 대표 주소의 연결 페이지와 독립적인 웹 서비스를 배포합니다.

## 킹 받는 답변

https://ai-seonbi.github.io/answer/ 에서 최대 24자의 답변을 입력해 공유 링크를 만듭니다. 받는 사람이 선물 상자를 누르면 드럼롤과 한국어 음성 뒤에 고양이 다섯 마리가 답변을 들고 춤춥니다. 별도 서버 없이 UTF-8 답변을 URL fragment에 담습니다. 링크를 가진 사람은 답변을 읽을 수 있습니다.

구현은 `answer/`에 있으며 외부 런타임·분석 도구·API가 없습니다. [장면과 제작 기록](docs/answer-production.md)에 레퍼런스, 타이밍, 에셋과 확인 범위를 기록합니다. 기존 `/skills/` 연결은 유지합니다.
