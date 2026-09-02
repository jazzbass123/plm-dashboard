#!/usr/bin/env bash
# VS Code Tasks / Git 훅에서 호출되어 PLM 대시보드의 과제 상태를 갱신합니다.
# 사전 조건: plm-dashboard 서버(node server.js)가 실행 중이어야 합니다.
#
# 사용법:
#   plm-task.sh list                        과제 목록과 ID 출력
#   plm-task.sh done <taskId>                과제를 완료(100%)로 표시
#   plm-task.sh progress <taskId> <percent>  진행률 업데이트 (상태도 progress로 전환)
#   plm-task.sh status <taskId> <status>     상태만 변경 (progress/hold/done)

HOST="${PLM_HOST:-http://localhost:4000}"
ACTION="$1"

case "$ACTION" in
  list)
    curl -s "$HOST/api/tasks" | python3 -c '
import json, sys
for t in json.load(sys.stdin):
    print(f"{t[\"id\"]}  [{t.get(\"status\",\"?\"):8}]  {t.get(\"progress\",0):3}%  {t[\"title\"]}")
'
    ;;
  done)
    TASK_ID="$2"
    curl -s -X PUT "$HOST/api/tasks/$TASK_ID" \
      -H "Content-Type: application/json" \
      -d '{"status":"done","progress":100}' > /dev/null
    echo "완료 처리됨: $TASK_ID"
    ;;
  progress)
    TASK_ID="$2"
    PCT="$3"
    curl -s -X PUT "$HOST/api/tasks/$TASK_ID" \
      -H "Content-Type: application/json" \
      -d "{\"progress\": $PCT, \"status\": \"progress\"}" > /dev/null
    echo "진행률 갱신됨: $TASK_ID -> ${PCT}%"
    ;;
  status)
    TASK_ID="$2"
    ST="$3"
    curl -s -X PUT "$HOST/api/tasks/$TASK_ID" \
      -H "Content-Type: application/json" \
      -d "{\"status\": \"$ST\"}" > /dev/null
    echo "상태 갱신됨: $TASK_ID -> ${ST}"
    ;;
  *)
    echo "사용법: plm-task.sh list | done <taskId> | progress <taskId> <percent> | status <taskId> <status>"
    exit 1
    ;;
esac
