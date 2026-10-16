// 화면 동작 점검 — usage: node smoke_smk.js <repoDir> <outDir>
const {chromium}=require(process.env.MM_PW||'playwright');const fs=require('fs');const path=require('path');const {setup,server}=require('./serve');
const repo=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
(async()=>{const s=await server(repo,8952);const b=await chromium.launch();const R=[];
 for(const [w,h,d] of [[1440,900,1],[390,844,2]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:d,serviceWorkers:'block',locale:'ko-KR'});await setup(ctx);
  const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://127.0.0.1:8952/index.html');await pg.waitForTimeout(1500);
  const cases=[['room_ge400_lt40','boundary','2','600','30','45,000'],['room_ge400_gt40','boundary','3.2','800','30','65,000'],['corr_outlet','wall','3.5','40','40','45,000'],['room_lt400','wall','1','300','30','18,000'],['room_lt400','boundary','1.8','300','30','40,000'],['corridor','wall','2','0','65','45,000']];
  for(const c of cases){await pg.selectOption('#zone-type',c[0]);await pg.selectOption('#has-boundary',c[1]);await pg.fill('#vert-dist',c[2]);await pg.fill('#floor-area',c[3]);await pg.evaluate(v=>{document.getElementById('corr-len').value=v},c[4]);await pg.click('#btn-calc');await pg.waitForTimeout(150);
   const q=await pg.textContent('#r-q');const j=await pg.textContent('#r-judge');R.push({w,case:c.slice(0,5).join('/'),q:q.trim(),exp:c[5],ok:q.includes(c[5]),judge:j.trim().slice(0,60)});}
  await pg.click('.tab-btn[data-tab="law"]');await pg.waitForTimeout(300);
  const ov=await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  await pg.screenshot({path:path.join(out,`law_${w}.png`),fullPage:true});
  await pg.click('.tab-btn[data-tab="print"]');await pg.waitForTimeout(800);await pg.screenshot({path:path.join(out,`print_${w}.png`),fullPage:true});
  R.push({w,overflow:ov,errs});await ctx.close();}
 console.log(JSON.stringify(R,null,1));await b.close();s.close();})();
