# -*- coding: utf-8 -*-
"""제연설비 설계 계산서 v5.1.0 배출량 독립 대조 — usage: python3 -I verify_smk.py ../../index.html
   NFTC 501(국립소방연구원공고 제2024-52호, 2024. 10. 1.) 원문 표 2.3.1.2 · 2.3.2.1 · 2.3.2.2(원문 PDF 표 그림 판독)를
   이 파일에 따로 적어 두고, 앱 index.html 의 SMKENG.exhaust()를 node로 돌려 전 구간을 대조한다."""
import sys,re,json,subprocess,random,math,itertools
src=open(sys.argv[1],encoding='utf-8').read()
a=src.index('function getQ_bdry(v, type) {');b=src.index("document.getElementById('zone-type').addEventListener")
js="var window={};\n"+src[a:b]+"\nconst cases=JSON.parse(require('fs').readFileSync(0,'utf8'));process.stdout.write(JSON.stringify(cases.map(c=>window.SMKENG.exhaust(...c))));"
open('/tmp/_smk_eng.js','w').write(js)
# ── 원문 표 (독립 기재) ──
T2321=[(2,40000),(2.5,45000),(3,50000),(None,60000)]   # 표 2.3.2.1 2 m 이하 / 2 초과 2.5 이하 / 2.5 초과 3 이하 / 3 초과
T2322=[(2,45000),(2.5,50000),(3,55000),(None,65000)]   # 표 2.3.2.2
T2312={'le40':[(2,25000),(2.5,30000),(3,35000),(None,45000)],'gt40':[(2,30000),(2.5,35000),(3,40000),(None,50000)]}
def look(t,v):
    for lim,q in t:
        if lim is None or v<=lim: return q
def ref(type_,bnd,vd,area,L):
    if type_=='room_lt400':
        return look(T2321,vd) if bnd=='boundary' else max(area*60,5000)
    if type_=='room_ge400_lt40': return 40000 if bnd=='wall' else look(T2321,vd)
    if type_=='room_ge400_gt40': return 45000 if bnd=='wall' else look(T2322,vd)
    if type_=='corridor': return 45000 if bnd=='wall' else look(T2322,vd)
    if type_=='corr_outlet': return look(T2312['le40' if L<=40 else 'gt40'],vd)
types=['room_lt400','room_ge400_lt40','room_ge400_gt40','corridor','corr_outlet']
cases=[]
vds=[0.5,1,1.9,2,2.0000001,2.1,2.5,2.50001,2.9,3,3.0001,3.5,5]
Ls=[10,39.9,40,40.1,59,60,61]
areas=[10,49,49.9,50,83.4,100,250.5,300,399,399.9,400,600,1000]
for t,bn,v,a_,L in itertools.product(types,['wall','boundary'],vds,areas,Ls): cases.append([t,bn,v,a_,L])
rnd=random.Random(20261016)
for _ in range(50000):
    cases.append([rnd.choice(types),rnd.choice(['wall','boundary']),round(rnd.uniform(0,6),3),round(rnd.uniform(1,1200),1),round(rnd.uniform(1,80),1)])
out=json.loads(subprocess.run(['node','/tmp/_smk_eng.js'],input=json.dumps(cases),capture_output=True,text=True,check=True).stdout)
bad=[];warnchk=0
for c,o in zip(cases,out):
    q=ref(*c)
    ai=math.ceil(q/60*35-1e-9)
    if abs(o['Q']-q)>1e-6 or o['Ai']!=ai or o['Ai']<q/60*35-1e-9: bad.append((c,o['Q'],q,o['Ai'],ai))
    t,bn,v,a_,L=c
    exp=(t=='corr_outlet' and (a_>=50 or L>60)) or (t=='corridor' and L>60) or (t=='room_lt400' and a_>=400) or (t in('room_ge400_lt40','room_ge400_gt40') and a_<400)
    if bool(o['warn'])!=exp: bad.append(('WARN',c,o['warn']))
    warnchk+=1
tbl=[('표 2.3.2.1',[ref('room_ge400_lt40','boundary',v,600,0) for v in (2,2.5,3,3.1)]),('표 2.3.2.2',[ref('room_ge400_gt40','boundary',v,600,0) for v in (2,2.5,3,3.1)]),('표 2.3.1.2 40 m 이하',[ref('corr_outlet','wall',v,30,40) for v in (2,2.5,3,3.1)]),('표 2.3.1.2 40 m 초과',[ref('corr_outlet','wall',v,30,40.1) for v in (2,2.5,3,3.1)])]
print('대조 건수',len(cases),'불일치',len(bad))
for n,v in tbl: print(n,v)
print('경고 판정 대조',warnchk)
for x in bad[:10]: print('✗',x)
print('PASS' if not bad else 'FAIL')
