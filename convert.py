"""
SRT to LRC Converter
Usage: python srt_to_lrc.py input.srt
Output: input.lrc (cùng thư mục)
"""

import re
import sys
from pathlib import Path


def parse_srt_time(time_str: str) -> str:
    """Convert SRT timestamp (HH:MM:SS,mmm) to LRC timestamp (MM:SS.xx)"""
    match = re.match(r"(\d{2}):(\d{2}):(\d{2})[,.](\d{3})", time_str.strip())
    if not match:
        return "00:00.00"

    hours, minutes, seconds, millis = match.groups()
    total_minutes = int(hours) * 60 + int(minutes)
    centiseconds = int(millis) // 10  # LRC dùng 2 chữ số (centiseconds)

    return f"{total_minutes:02d}:{int(seconds):02d}.{centiseconds:02d}"


def srt_to_lrc(srt_path: str, title: str = "", artist: str = "") -> str:
    """Convert SRT file content to LRC format"""
    srt_file = Path(srt_path)
    content = srt_file.read_text(encoding="utf-8")

    # LRC header
    lines = []
    if title:
        lines.append(f"[ti:{title}]")
    if artist:
        lines.append(f"[ar:{artist}]")
    lines.append(f"[by:srt_to_lrc converter]")
    lines.append("")

    # Parse SRT blocks
    # Mỗi block có dạng:
    # 1
    # 00:00:12,500 --> 00:00:17,800
    # Lời bài hát dòng 1
    # Lời bài hát dòng 2 (nếu có)
    blocks = re.split(r"\n\s*\n", content.strip())

    for block in blocks:
        block_lines = block.strip().split("\n")
        if len(block_lines) < 3:
            continue

        # Dòng 2: timestamp
        time_match = re.match(
            r"(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})",
            block_lines[1].strip(),
        )
        if not time_match:
            continue

        start_time = parse_srt_time(time_match.group(1))

        # Dòng 3+: text (gộp nhiều dòng thành 1)
        text = " ".join(line.strip() for line in block_lines[2:] if line.strip())

        # Xoá HTML tags nếu có (VD: <i>text</i>)
        text = re.sub(r"<[^>]+>", "", text)

        lines.append(f"[{start_time}] {text}")

    return "\n".join(lines)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python srt_to_lrc.py <input.srt> [title] [artist]")
        print("Example: python srt_to_lrc.py song.srt 'Bài Hát' 'Ca Sĩ'")
        sys.exit(1)

    srt_path = sys.argv[1]
    title = sys.argv[2] if len(sys.argv) > 2 else ""
    artist = sys.argv[3] if len(sys.argv) > 3 else ""

    if not Path(srt_path).exists():
        print(f"Error: File '{srt_path}' không tồn tại")
        sys.exit(1)

    lrc_content = srt_to_lrc(srt_path, title, artist)

    # Ghi file LRC
    output_path = Path(srt_path).with_suffix(".lrc")
    output_path.write_text(lrc_content, encoding="utf-8")

    print(f"Done! Đã tạo: {output_path}")
