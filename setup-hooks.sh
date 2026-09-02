#!/usr/bin/env bash
# 현재 저장소에서 PLM 커밋 훅을 활성화합니다.
set -e
cd "$(git rev-parse --show-toplevel)"
git config core.hooksPath .githooks
chmod +x .githooks/post-commit scripts/plm-task.sh 2>/dev/null || true
echo "PLM 커밋 훅이 활성화되었습니다 (core.hooksPath=.githooks)."
echo "커밋 메시지에 #<taskId> 를 포함하면 자동으로 대시보드에 반영됩니다."
echo "예: git commit -m \"작업 내용 #seed-t3 %60\""
