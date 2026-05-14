#!/usr/bin/env bash
# 将 audio/ 中所有 MP3 转码为 AAC（.m4a）
# 码率跟随源文件，320kbps 上限取 256kbps
# 输出目录镜像 audio/ 结构，原文件不动
# 用法：./transcode.sh [输入目录] [输出目录] [并发数]

INPUT_DIR="${1:-song/audio}"
OUTPUT_DIR="${2:-song/audio_aac}"
JOBS="${3:-4}"

if ! command -v ffmpeg &>/dev/null; then
  echo "错误：未找到 ffmpeg，请先安装：brew install ffmpeg"
  exit 1
fi

process_one() {
  local src="$1"
  local INPUT_DIR="$2"
  local OUTPUT_DIR="$3"

  local bitrate
  bitrate=$(ffprobe -v quiet -print_format json -show_streams "$src" 2>/dev/null \
    | python3 -c "
import json,sys
d=json.load(sys.stdin)
s=next((s for s in d.get('streams',[]) if s.get('codec_type')=='audio'),None)
print(int(s.get('bit_rate',0))//1000 if s else 0)
" 2>/dev/null)

  local target_bitrate
  if [[ "$bitrate" -ge 320 ]]; then
    target_bitrate="256k"
  else
    target_bitrate="${bitrate}k"
  fi

  local rel dst
  rel=$(python3 -c "import os,sys; print(os.path.relpath(sys.argv[1], sys.argv[2]))" "$src" "$INPUT_DIR")
  dst="${OUTPUT_DIR}/${rel%.mp3}.m4a"
  mkdir -p "$(dirname "$dst")"

  if [[ -f "$dst" ]]; then
    echo "已存在，跳过：$(basename "$dst")"
    return 0
  fi

  echo "转码（${bitrate}kbps → AAC ${target_bitrate}）：$(basename "$src")"
  if ffmpeg -i "$src" -c:a aac -b:a "$target_bitrate" -vn -movflags +faststart "$dst" -loglevel error 2>&1; then
    return 0
  else
    rm -f "$dst"
    echo "失败：$src"
    return 1
  fi
}

export -f process_one

echo "并发数：$JOBS，开始转码..."
find "$INPUT_DIR" -name "*.mp3" | sort | \
  xargs -P "$JOBS" -I {} bash -c 'process_one "$@"' _ {} "$INPUT_DIR" "$OUTPUT_DIR"

echo ""
converted=$(find "$OUTPUT_DIR" -name "*.m4a" | wc -l | tr -d ' ')
echo "完成：输出目录共 $converted 个文件 → $OUTPUT_DIR"
