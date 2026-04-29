#!/usr/bin/env bash
set -euo pipefail

# 一键启动脚本：
# 场景：本地开发时同时启动后端 Express 服务和前端 Vite 服务。
# 依赖：项目根目录、server 子项目、npm、Node >= 20.19；优先使用本机 nvm 中的高版本 Node。

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="$ROOT_DIR/.run"
# 开发环境 API 端口：
# 场景：前端 .env.development 的 VITE_API_BASE_URL 指向 3001，脚本需与其保持一致。
SERVER_PORT="${SERVER_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-5766}"

mkdir -p "$RUN_DIR"

# 选择 Node 运行时：
# 关键控制点：系统默认 Node 可能过旧，TypeORM/Vite 需要现代语法支持，因此优先选 nvm 中的新版 Node。
select_node_bin() {
  local candidates=(
    "$HOME/.nvm/versions/node/v24.13.0/bin"
    "$HOME/.nvm/versions/node/v22.0.0/bin"
    "$HOME/.nvm/versions/node/v20.19.0/bin"
  )

  for bin_dir in "${candidates[@]}"; do
    if [[ -x "$bin_dir/node" && -x "$bin_dir/npm" ]]; then
      echo "$bin_dir"
      return 0
    fi
  done

  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    dirname "$(command -v node)"
    return 0
  fi

  echo "未找到可用的 node/npm，请先安装 Node >= 20.19" >&2
  return 1
}

# 端口占用检查：
# 关键控制点：避免重复启动造成端口冲突；如需重启，请先执行 ./stop.sh。
ensure_port_free() {
  local port="$1"
  local name="$2"

  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "$name 端口 $port 已被占用，请先执行 ./stop.sh 后再启动。"
    lsof -nP -iTCP:"$port" -sTCP:LISTEN
    exit 1
  fi
}

# 后台启动单个服务：
# 依赖：调用方传入工作目录、日志文件和命令；启动后记录 PID 供 stop.sh 精确停止。
start_process() {
  local name="$1"
  local work_dir="$2"
  local pid_file="$3"
  local log_file="$4"
  shift 4

  echo "启动 $name ..."
  (
    cd "$work_dir"
    # 关键控制点：nohup 让开发服务脱离当前脚本会话，脚本退出后服务仍保持运行。
    nohup "$@" >"$log_file" 2>&1 &
    echo "$!" >"$pid_file"
    disown "$(cat "$pid_file")" >/dev/null 2>&1 || true
  )

  local pid
  pid="$(cat "$pid_file")"
  echo "${name} PID: ${pid}，日志: ${log_file}"
}

# 等待端口就绪：
# 关键控制点：启动命令返回不等于服务可访问；这里给后端编译和 Vite 冷启动留出缓冲时间。
wait_for_port() {
  local name="$1"
  local port="$2"
  local log_file="$3"
  local max_attempts=30

  for ((attempt = 1; attempt <= max_attempts; attempt++)); do
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      echo "$name 已就绪，端口: $port"
      return 0
    fi
    sleep 1
  done

  echo "$name 启动超时，请查看日志: $log_file" >&2
  tail -n 80 "$log_file" >&2 || true
  return 1
}

NODE_BIN="$(select_node_bin)"
export PATH="$NODE_BIN:$PATH"

echo "使用 Node: $(node -v) ($(command -v node))"
ensure_port_free "$SERVER_PORT" "后端"
ensure_port_free "$FRONTEND_PORT" "前端"

start_process "后端服务" \
  "$ROOT_DIR/server" \
  "$RUN_DIR/server.pid" \
  "$RUN_DIR/server.log" \
  env PORT="$SERVER_PORT" npm run dev

start_process "前端服务" \
  "$ROOT_DIR" \
  "$RUN_DIR/frontend.pid" \
  "$RUN_DIR/frontend.log" \
  npm run dev -- --host 0.0.0.0

wait_for_port "后端服务" "$SERVER_PORT" "$RUN_DIR/server.log"
wait_for_port "前端服务" "$FRONTEND_PORT" "$RUN_DIR/frontend.log"

echo
echo "项目启动中："
echo "  后端: http://localhost:$SERVER_PORT"
echo "  前端: http://localhost:$FRONTEND_PORT/"
echo "  账号: admin"
echo "  密码: 123456"
echo
echo "查看日志："
echo "  tail -f .run/server.log"
echo "  tail -f .run/frontend.log"
