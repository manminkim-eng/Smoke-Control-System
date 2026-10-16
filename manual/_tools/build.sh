#!/bin/bash
# 제연설비 매뉴얼 전체 재생성: 캡처 → WebP → HTML → PDF → 좁은 화면 점검   usage: LANG=ko_KR.UTF-8 bash build.sh <repoDir> <rawDir>
set -e; REPO="$(cd "$1" && pwd)"; RAW="$2"; mkdir -p "$RAW"; RAW="$(cd "$RAW" && pwd)"; cd "$(dirname "$0")"; M="$REPO/manual"; mkdir -p "$M/images"
node capture_smk.js "$REPO" "$RAW" > "$RAW/_log.json"
cp "$RAW/_example.json" ./_example.json
python3 - "$RAW" "$M" <<'PY'
import sys,glob,os,shutil
from PIL import Image
raw,M=sys.argv[1],sys.argv[2]
for f in sorted(glob.glob(raw+'/s*.png')):
    Image.open(f).convert('RGB').save(M+'/images/'+os.path.basename(f)[:-4]+'.webp',quality=82,method=6)
shutil.copy(raw+'/_marks.json',M+'/images/_marks.json')
PY
MANUAL_DIR="$M" python3 gen_manual_smk.py
node pdf_smk.js "$M" 제연설비설계계산서_사용자매뉴얼_Ver-5.1.pdf "제연설비 설계 계산서 사용자 매뉴얼 Ver-5.1"
node audit_responsive.js "$M/index.html" > "$RAW/_audit.json"
