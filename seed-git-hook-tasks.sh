#!/usr/bin/env bash
# 실행 중인 PLM 대시보드에 "Git 커밋 훅 연동" 세부 Task를 등록합니다.
# 사용법: PLM_HOST=http://localhost:4000 bash seed-git-hook-tasks.sh
HOST="${PLM_HOST:-http://localhost:4000}"
PROJECT="개인형 PLM 대시보드 1차 개선"

post_task() {
  curl -s -X POST "$HOST/api/tasks" -H "Content-Type: application/json" -d "$1" > /dev/null
  echo "등록됨: $(echo "$1" | python3 -c 'import json,sys;print(json.load(sys.stdin)["title"])')"
}

post_task '{"title":"커밋 메시지 규칙 정의 (#taskId, %진행률, 완료 키워드)","project":"'"$PROJECT"'","status":"done","progress":100,"due":"2026-09-02"}'
post_task '{"title":"post-commit 훅 스크립트 작성","project":"'"$PROJECT"'","status":"done","progress":100,"due":"2026-09-02"}'
post_task '{"title":"훅 설치 스크립트 작성 (core.hooksPath 방식)","project":"'"$PROJECT"'","status":"done","progress":100,"due":"2026-09-02"}'
post_task '{"title":"통합 테스트 (진행률/완료/무관 커밋 3가지 케이스)","project":"'"$PROJECT"'","status":"done","progress":100,"due":"2026-09-02"}'
post_task '{"title":"실제 작업 저장소에 훅 적용 및 1주일 실사용 검증","project":"'"$PROJECT"'","status":"hold","progress":0,"due":"2026-09-09"}'
post_task '{"title":"커밋 메시지 규칙 문서화 및 팀 공유","project":"'"$PROJECT"'","status":"hold","progress":0,"due":"2026-09-09"}'

echo "완료. 대시보드 '과제' 탭에서 확인하세요."
