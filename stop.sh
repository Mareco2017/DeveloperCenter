#!/usr/bin/env bash
set -euo pipefail

# 一键停止脚本：
# 场景：停止 start.sh 启动的前后端服务，也兜底清理占用默认端口的开发进程。
# 依赖：start.sh 写入的 PID 文件；macOS/Linux 可用的 lsof/kill。

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$ROOT_DIR/.run"
# 开发环境 API 端口：
# 场景：与 start.sh 和前端 .env.development 保持一致，默认停止 3001 后端服务。
SERVER_PORT="${SERVER_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-5766}"

# 按 PID 文件停止进程：
# 关键控制点：优先精确停止脚本自己启动的进程，避免误杀其他无关服务。
stop_by_pid_file() {
  local name="$1"
  local pid_file="$2"

  if [[ ! -f "$pid_file" ]]; then
    return 0
  fi

  local pid
  pid="$(cat "$pid_file")"
  if [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1; then
    echo "停止 ${name}，PID: ${pid}"
    kill "$pid" >/dev/null 2>&1 || true
  fi

  rm -f "$pid_file"
}

# 按端口兜底停止进程：
# 关键控制点：适配手动 npm run dev 启动的情况，避免端口残留导致下次一键启动失败。
stop_by_port() {
  local name="$1"
  local port="$2"
  local pids

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -z "$pids" ]]; then
    return 0
  fi

    echo "清理占用 ${name} 端口 ${port} 的进程: ${pids}"
  while read -r pid; do
    [[ -n "$pid" ]] && kill "$pid" >/dev/null 2>&1 || true
  done <<< "$pids"
}

# 清理项目残留开发进程：
# 关键控制点：当进程父子关系被终端或工具打散时，可能没有监听端口但仍残留 nodemon/vite 父进程。
stop_project_processes() {
  local patterns=(
    "$ROOT_DIR/server/node_modules/.bin/nodemon"
    "$ROOT_DIR/node_modules/.bin/vite"
  )

  for pattern in "${patterns[@]}"; do
    local pids
    pids="$(pgrep -f "$pattern" 2>/dev/null || true)"
    if [[ -z "$pids" ]]; then
      continue
    fi

    echo "清理项目残留进程: $pids"
    while read -r pid; do
      [[ -n "$pid" ]] && kill "$pid" >/dev/null 2>&1 || true
    done <<< "$pids"
  done
}

stop_by_pid_file "后端服务" "$RUN_DIR/server.pid"
stop_by_pid_file "前端服务" "$RUN_DIR/frontend.pid"

sleep 1

stop_by_port "后端" "$SERVER_PORT"
stop_by_port "前端" "$FRONTEND_PORT"
stop_project_processes

echo "项目已停止。"
