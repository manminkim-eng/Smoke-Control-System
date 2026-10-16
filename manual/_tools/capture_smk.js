// 제연설비 설계 계산서 매뉴얼 화면 캡처 — usage: node capture_smk.js <repoDir> <outDir>
// 규격: 1440×900 · DSF 1.25 (영상용 좁은 화면: MM_VW=720 MM_VH=1280 MM_DSF=2) · serviceWorkers block · _marks.json · _example.json
const {chromium}=require(process.env.MM_PW||'playwright');const fs=require('fs');const path=require('path');const {setup,server}=require('./serve');
const repo=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const VW=+(process.env.MM_VW||1440),VH=+(process.env.MM_VH||900),DSF=+(process.env.MM_DSF||1.25),PORT=8953;
const HIDE='#pwa-banner,#pwa-hdr-btn,#sw-update-bar,.pwa-banner,.sw-update-bar{display:none!important} *{animation:none!important;transition:none!important}';
const HELP=`window.__vis=e=>e&&e.getClientRects().length>0;
window.__find=sel=>{if(sel.startsWith('up:')){const [n,q]=sel.slice(3).split('|');let e=document.querySelector(q);for(let i=0;i<+n&&e;i++)e=e.parentElement;return e;}
 if(sel.startsWith('box:')){const t=sel.slice(4);return [...document.querySelectorAll('.box')].find(b=>__vis(b)&&b.querySelector('.box-hd')&&b.querySelector('.box-hd').textContent.includes(t))||null;}
 if(sel.startsWith('row:')){const t=sel.slice(4);return [...document.querySelectorAll('tr')].find(r=>__vis(r)&&r.textContent.includes(t))||null;}
 if(sel.startsWith('nth:')){const [q,i]=sel.slice(4).split('|');return [...document.querySelectorAll(q)].filter(__vis)[+i]||null;}
 for(const s of sel.split(',')){const e=[...document.querySelectorAll(s)].find(__vis);if(e)return e;}return null;};
window.__tab=t=>document.querySelector('.tab-btn[data-tab="'+t+'"]').click();
window.__set=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
window.__ex=(t,b,v,a,L)=>{__tab('calc');__set('zone-type',t);__set('has-boundary',b);__set('vert-dist',v);__set('floor-area',a);__set('corr-len',L);document.getElementById('btn-calc').click();};
window.__fml=i=>{document.getElementById('modal').style.display='flex';document.querySelector('.fml-tab[data-mp="'+i+'"]').click();};
window.__fmlClose=()=>{document.getElementById('modal').style.display='none';};`;
const EXA="__ex('room_ge400_lt40','boundary','2','600','30')";
const SHOTS=[
 {id:'s01_overview',pre:EXA+";window.scrollTo(0,0)",clip:'viewport',m:[['nth:.tab-btn|0','작업 탭 6개 + 계산서 출력'],['#mm-manual-btn','📘 매뉴얼 — 탭 막대 끝'],['.sum-bar','요약 바'],['.law-banner','핵심기준 띠'],['box:Ⅰ-0','프로젝트 정보']]},
 {id:'s02_header',clip:'.site-header',m:[['.hdr-h1','도구 이름 · Ver-5.1'],['#mm-manual-btn','📘 매뉴얼 — 탭 막대 끝'],['.hdr-right','NFTC 501 · 시행 2024. 10. 1.'],['.tab-bar-wrap','탭 7개']]},
 {id:'s03_input',clip:'box:Ⅰ-1',m:[['up:1|#zone-type','예상제연구역 유형 5가지'],['up:1|#has-boundary','벽 / 제연경계 구획'],['up:2|#vert-dist','수직거리'],['up:2|#floor-area','바닥면적'],['up:1|#zone-count','제연구역 개수(참고)'],['#btn-calc','💨 배출량 계산']]},
 {id:'s04_result',clip:'#result-area',m:[['up:1|#r-ref-short','적용 조항'],['up:1|#r-q','필요 배출량'],['up:1|#r-ai','유입구 최소 면적(올림)'],['up:1|#r-judge','판정 · 경고'],['#r-formula','산출식']]},
 {id:'s05_b_outlet',pre:"__ex('corr_outlet','wall','3.2','40','45')",clip:'#result-area',m:[['up:1|#r-q','표 2.3.1.2 — 40 m 초과 · 3 m 초과'],['#r-formula','산출식']]},
 {id:'s06_c_lt400',pre:"__ex('room_lt400','boundary','1.8','300','30')",clip:'#result-area',post:EXA,m:[['up:1|#r-ref-short','2.3.1 제외 → 표 2.3.2.1'],['up:1|#r-q','필요 배출량']]},
 {id:'s07_warn',pre:"__ex('corr_outlet','wall','2','80','65')",clip:'#result-area',post:EXA,m:[['up:1|#r-judge','경고 2건']]},
 {id:'s08_zone',pre:"__tab('zone');__set('za-input','600');__set('zd-input','38');__set('bw-input','0.6');__set('bv-input','2');__set('wl-input','45');window.scrollTo(0,0)",clip:'#tab-zone',m:[['box:Ⅱ-1','Ⅱ-1 면적 ≤ 1,000 ㎡'],['box:Ⅱ-2','Ⅱ-2 직경 60 m 원'],['box:Ⅱ-3','Ⅱ-3 경계 폭 · 수직거리'],['box:Ⅱ-4','Ⅱ-4 통로 · 제연방식']]},
 {id:'s09_duct',pre:"__tab('duct');__set('ds-input','800');__set('dl-input','1000');__set('ws-q','40000');__set('ws-a','0.8');__set('ws-type','suction');window.scrollTo(0,0)",clip:'#tab-duct',m:[['box:Ⅲ-1','Ⅲ-1 강판 두께'],['box:Ⅲ-2','Ⅲ-2 풍속 15 · 20 · 20 ㎧'],['box:Ⅲ-3','Ⅲ-3 댐퍼(신설)']]},
 {id:'s10_power',pre:"__tab('power');__set('mh-input','1.2');window.scrollTo(0,0)",clip:'#tab-power',m:[['box:Ⅳ-1','Ⅳ-1 비상전원 20분'],['box:Ⅳ-2','Ⅳ-2 기동 · 작동사항'],['box:수동기동장치 설치 높이','수동기동 0.8 ~ 1.5 m']]},
 {id:'s11_check',pre:"__tab('check');__set('pe-design','20000');__set('pe-meas','13000');__set('pi-design','18000');__set('pi-meas','12000');window.scrollTo(0,0)",clip:'#tab-check',m:[['box:Ⅴ-1','Ⅴ-1 배출구별 60 %'],['box:Ⅴ-2','Ⅴ-2 유입구별 60 %'],['box:Ⅴ-3','Ⅴ-3 시험 · 설치제외']]},
 {id:'s12_law_list',pre:"__tab('law');window.scrollTo(0,0)",clip:'box:Ⅵ-1',m:[]},
 {id:'s13_law_tbl',clip:'box:Ⅵ-2',m:[['nth:#tab-law .dt|1','표 2.3.2.1'],['nth:#tab-law .dt|2','표 2.3.2.2'],['nth:#tab-law .dt|3','표 2.3.1.2']]},
 {id:'s14_law_ref',clip:'box:Ⅵ-3',m:[]},
 {id:'s15_print',pre:EXA+";__tab('print');window.scrollTo(0,0)",wait:1200,clip:'viewport',m:[['#btn-jpg','🖼️ JPG 저장'],['.mm-btn-pdf','🖨️ 인쇄 · PDF'],['#rpt-outer','A4 미리보기']]},
 {id:'s16_a4page',clip:'#report-zone',m:[]},
 {id:'s17_fml_howto',pre:"__fml(0)",wait:500,fixed:true,clip:'.fml-box',m:[]},
 {id:'s18_fml_eq',pre:"__fml(1)",wait:400,fixed:true,clip:'.fml-box',m:[]},
 {id:'s19_fml_law',pre:"__fml(2)",wait:400,fixed:true,clip:'.fml-box',post:"__fmlClose();__tab('calc')",m:[]},
];
(async()=>{
 const s=await server(repo,PORT);const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:DSF,serviceWorkers:'block',locale:'ko-KR'});await setup(ctx);
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(`http://127.0.0.1:${PORT}/index.html`);await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(1500);
 await pg.addStyleTag({content:HIDE});await pg.evaluate(HELP);await pg.evaluate(()=>{const d=document.getElementById('proj-date');if(d)d.value='2026-10-16';});await pg.waitForTimeout(300);
 const meta={};
 for(const S of SHOTS){
  if(S.pre){try{await pg.evaluate(S.pre);}catch(e){errs.push(S.id+' pre '+e.message);}}
  await pg.waitForTimeout(S.wait||500);
  if(S.clip!=='viewport'&&!S.fixed){await pg.evaluate(c=>{const e=__find(c);if(e){window.scrollTo(0,e.getBoundingClientRect().top+scrollY-40);}},S.clip);await pg.waitForTimeout(400);}
  const info=await pg.evaluate(({S,VW,VH})=>{
   const abs=e=>{const r=e.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height};};
   let clip;
   if(S.clip==='viewport'){clip={x:0,y:scrollY,width:VW,height:VH};}
   else{const el=__find(S.clip);if(!el)return {err:'clip '+S.clip};const a=abs(el);const P=S.fixed?0:10;clip={x:Math.max(0,a.x-P),y:Math.max(0,a.y-P),width:a.w+2*P,height:a.h+2*P};}
   const marks=[];(S.m||[]).forEach(([sel,label],i)=>{const e=__find(sel);if(!e){marks.push({n:i+1,label,miss:sel});return;}const a=abs(e);
     marks.push({n:i+1,label,x:+((a.x-clip.x)/clip.width*100).toFixed(2),y:+((a.y-clip.y)/clip.height*100).toFixed(2),w:+(Math.min(a.w,clip.x+clip.width-a.x)/clip.width*100).toFixed(2),h:+(Math.min(a.h,clip.y+clip.height-a.y)/clip.height*100).toFixed(2)});});
   return {clip,marks};},{S,VW,VH});
  if(info.err){errs.push(S.id+' '+info.err);continue;}
  const c=info.clip;const cl={x:Math.max(0,c.x),y:Math.max(0,c.y),width:Math.min(c.width,VW-Math.max(0,c.x)),height:c.height};
  if(S.clip==='viewport'){await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:0,y:0,width:VW,height:VH}});}
  else if(S.fixed){const sy=await pg.evaluate(()=>scrollY),sx=await pg.evaluate(()=>scrollX);await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:Math.max(0,c.x-sx),y:Math.max(0,c.y-sy),width:Math.min(c.width,VW),height:Math.min(c.height,VH-Math.max(0,c.y-sy))}});}
  else{await pg.screenshot({path:path.join(out,S.id+'.png'),clip:cl,fullPage:true});}
  meta[S.id]={w:Math.round(cl.width),h:Math.round(Math.min(cl.height,S.fixed?VH:1e9)),marks:info.marks};
  if(S.post){try{await pg.evaluate(S.post);}catch(e){errs.push(S.id+' post '+e.message);}await pg.waitForTimeout(300);}
 }
 // 예제 값(앱 엔진 결과)
 const EX=await pg.evaluate(()=>({A:SMKENG.exhaust('room_ge400_lt40','boundary',2,600,30),B:SMKENG.exhaust('corr_outlet','wall',3.2,40,45),C:SMKENG.exhaust('room_lt400','boundary',1.8,300,30),W:SMKENG.exhaust('corr_outlet','wall',2,80,65)}));
 fs.writeFileSync(path.join(out,'_example.json'),JSON.stringify(EX,null,1));
 const mctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block',isMobile:true,hasTouch:true,locale:'ko-KR'});await setup(mctx);
 const mp=await mctx.newPage();await mp.goto(`http://127.0.0.1:${PORT}/index.html`);await mp.waitForTimeout(1500);await mp.addStyleTag({content:HIDE});await mp.evaluate(HELP);
 await mp.screenshot({path:path.join(out,'s20_mobile_main.png')});meta['s20_mobile_main']={w:390,h:844,marks:[]};
 await mp.evaluate(EXA);await mp.waitForTimeout(500);await mp.evaluate(()=>{const e=document.getElementById('result-area');window.scrollTo(0,e.getBoundingClientRect().top+scrollY-12);});await mp.waitForTimeout(500);
 await mp.screenshot({path:path.join(out,'s21_mobile_result.png')});meta['s21_mobile_result']={w:390,h:844,marks:[]};
 await mp.evaluate(()=>{__tab('law');const e=[...document.querySelectorAll('.box')].find(b=>b.textContent.includes('Ⅵ-2'));window.scrollTo(0,e.getBoundingClientRect().top+scrollY-12);});await mp.waitForTimeout(500);
 await mp.screenshot({path:path.join(out,'s22_mobile_law.png')});meta['s22_mobile_law']={w:390,h:844,marks:[]};
 const mob=await mp.evaluate(()=>({page:document.documentElement.scrollWidth,vw:innerWidth}));
 fs.writeFileSync(path.join(out,'_marks.json'),JSON.stringify(meta,null,1));
 const miss=[];Object.entries(meta).forEach(([k,v])=>v.marks.forEach(m=>{if(m.miss)miss.push(k+':'+m.miss);else if(m.x<0||m.y<0||m.x+m.w>100.5||m.y+m.h>100.5||m.w<=0||m.h<=0)miss.push(k+':OUT '+m.label+' '+m.x+','+m.y+','+m.w+','+m.h);}));
 console.log(JSON.stringify({mobile:mob,sizes:Object.fromEntries(Object.entries(meta).map(([k,v])=>[k,v.w+'x'+v.h])),miss,errs:errs.slice(0,15)},null,1));
 await b.close();s.close();
})();
