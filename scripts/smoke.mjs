import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'livestock-smoke-'));
process.env.DATABASE_URL='';process.env.DATA_DIR=path.join(tmp,'db');process.env.OUTPUT_DIR=path.join(tmp,'output');
const {getDb,REPO_ROOT}=await import('./lib/db.mjs');
const {migrate}=await import('./migrate.mjs');
const {execute,READS,COMMANDS}=await import('./livestock.mjs');
let db,checks=0;const covered=new Set();
async function run(cmd,...args){covered.add(cmd);checks++;return execute(db,[cmd,...args.map(String)]);}
async function rejects(cmd,args,pattern){await assert.rejects(()=>run(cmd,...args),pattern);}
const count=async(t)=>Number((await db.query(`select count(*) n from ${t}`))[0].n);
const cli=(args,status=0)=>{const r=spawnSync(process.execPath,['scripts/livestock.mjs',...args],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});assert.equal(r.status,status,r.stderr);checks++;return r;};
try{
 db=await getDb();assert.equal((await migrate(db)).ran.length,2);assert.equal((await migrate(db)).ran.length,0);
 const seed=fs.readFileSync(path.join(REPO_ROOT,'supabase/seed.sql'),'utf8');await db.exec(seed);await db.exec(seed);assert.equal(await count('mobs'),3);
 const today=(await db.query('select current_date::text today'))[0].today;
 const date=(n)=>new Date(Date.parse(today)+n*86400000).toISOString().slice(0,10);
 for(const cmd of Object.keys(READS)){const rows=await run(cmd);assert.ok(rows.length,`${cmd} has demo records`);}
 assert.equal((await run('mobs')).find(x=>x.name==='Merino Ewes').head,478);
 assert.equal(Number((await run('performance')).find(x=>x.mob==='Angus Steers').daily_gain_kg),0.7);
 assert.equal((await run('grazing')).find(x=>x.paddock==='South Ridge').decision,'REST MET');
 assert.equal((await run('sale-check')).find(x=>x.name==='October steers').decision,'WHP HOLD');
 assert.equal((await run('mob','angus steers')).mob.name,'Angus Steers');assert.equal((await run('mob','30000000-0000-0000-0000-000000000002')).mob.head,478);
 await rejects('mob',['Angus'],/Ambiguous.*\n.*Angus Heifers.*\n.*Angus Steers/s);await rejects('mob',['nonexistent'],/No match/);
 assert.equal((await run('weekly-review')).grazing.length,4);assert.ok((await run('help')).commands.includes('release-sale'));
 await rejects('release-sale',['October steers','--reviewed-by=Jo'],/Release blocked: WHP HOLD/);
 await rejects('move',['Angus Steers','--to=Lucerne'],/grazing hold/);
 await rejects('move',['Angus Steers','--to=Ridge'],/Ambiguous/);
 assert.equal((await run('move','Angus Steers','--to=South Ridge','--note=rotation')).head,80);
 const stock=Number((await db.query("select stock_ml from products where name='Demo Drench'"))[0].stock_ml);
 await rejects('treat',['Angus Steers','--product=Demo Drench','--head=80','--dose=1000','--operator=Jo'],/Insufficient product/);
 assert.equal(Number((await db.query("select stock_ml from products where name='Demo Drench'"))[0].stock_ml),stock);
 await rejects('treat',['Angus Steers','--product=Expired Demo Vaccine','--head=80','--dose=1','--operator=Jo'],/expired/);
 await run('treat','Angus Steers','--product=Demo Drench','--head=80','--dose=10','--operator=Jo','--cost=200');
 assert.equal(Number((await db.query("select stock_ml from products where name='Demo Drench'"))[0].stock_ml),stock-800);
 await run('weigh','Merino Ewes','--head=50','--kg=55');await rejects('weigh',['Merino Ewes','--head=999','--kg=55'],/exceeds/);
 await rejects('weigh',['Merino Ewes','--head=2','--kg=55','--date=2026-02-30'],/valid/);
 await run('feed-add','Merino Ewes','--feed=Hay','--kg=100','--cost=45','--declaration=Supplier-1');
 await run('stocktake','Merino Ewes','--head=478','--note=All found');assert.ok(!(await run('attention')).some(x=>x.kind==='stocktake'));
 await rejects('stocktake',['Merino Ewes','--head=478','--note=Old count',`--date=${date(-1)}`],/must use today/);
 await rejects('stock-event',['Merino Ewes','--kind=birth','--delta=1','--reference=OLD',`--date=${date(-30)}`],/predates/);
 await run('stock-event','Merino Ewes','--kind=birth','--delta=10','--reference=LAMB-1');
 await rejects('stock-event',['Merino Ewes','--kind=birth','--delta=-10','--reference=BAD-1'],/check constraint/);
 await rejects('stock-event',['Merino Ewes','--kind=death','--delta=-9999','--reference=BAD-2'],/Invalid count/);
 await rejects('stock-event',['Merino Ewes','--kind=sale','--delta=-1','--reference=BAD-3'],/plan-sale/);
 const join=await run('join','Merino Ewes','--sire=Ram B',`--start=${date(-70)}`,`--end=${date(-35)}`,`--scan-due=${today}`,'--head=400');
 await run('scan',join.id,'--pregnant=360');await rejects('scan',[join.id,'--pregnant=401'],/check constraint/);
 await run('plan-sale','Merino Ewes','--name=Today ewes',`--date=${today}`,'--head=10','--market=domestic','--pic=DEMO-B','--nvd=DEMO-3','--amount=1700');
 const sale=await run('release-sale','Today ewes','--reviewed-by=Jo');assert.equal(sale.delta,-10);
 await rejects('release-sale',['Today ewes','--reviewed-by=Jo'],/RELEASED/);
 await run('confirm-nlis',sale.reference,'--reference=DEMO-NLIS-ACK');
 await run('verify-history','Angus Heifers','--evidence=Reviewed original export','--by=Jo');
 assert.equal((await run('mob','Angus Heifers')).mob.unknown_hold,true,'verification does not remove unknown treatment intervals');
 const task=await run('task-add','--farm=Wattle Creek Demo','--name=Repair gate',`--due=${today}`,'--owner=Jo');await run('task-done',task.id);
 await run('log','Merino Ewes','--note=Found missing sheep','--by=Jo');
 await run('add','farm','--name=Test Farm','--pic=TESTPIC','--state=NSW');
 await run('add','paddock','--farm=Test Farm','--name=Test Field','--area=10','--rest=20');
 await run('add','mob','--paddock=Test Field','--name=Test Cattle','--species=cattle','--head=20','--dse=8');
 await run('add','product','--name=Test Product','--batch=T1',`--expiry=${date(60)}`,'--stock=100','--whp=0','--esi=0','--label=Test only');
 await run('add','animal','--mob=Test Cattle','--name=Tag T1','--eid=TEST-EID',`--born=${date(-400)}`,'--sex=female');
 await rejects('move',['Test Cattle','--to=River Flat'],/Cross-property/);
 for(const [cmd,args] of [['draft-sale',['Today ewes']],['draft-treatment',['Angus Steers']],['draft-audit',[]]]){const d=await run(cmd,...args);const html=fs.readFileSync(d.file,'utf8');assert.match(html,/DRAFT/);assert.match(html,/Wattle Creek/);fs.unlinkSync(d.file);}
 const fixtures={
 paddocks:'Paddock Name,Area (ha)\nImport Field,12\n',
 mobs:'Mob Name,Paddock,Species,Number of Animals,DSE per Head\nImport Ewes,Import Field,sheep,12,1.5\n',
 treatments:`Mob,Product,Batch,Date,Head,Dose,WHP,ESI,Operator,Label Reference\nImport Ewes,Demo,X,${date(-1)},12,2,14,28,Jo,Demo label\n`,
 weights:`Mob,Date,Average Weight (kg),Head\nImport Ewes,${today},50,12\n`,
 animals:`Mob,VID,EID,Date of Birth,Sex\nImport Ewes,Import Tag,IMPORT-EID,${date(-400)},female\n`,
 feeds:`Mob,Date,Feed,Dry Matter (kg),Cost,Supplier Declaration\nImport Ewes,${today},Hay,25,12,Declaration 1\n`
 };
 const flags=['agriwebb','--farm=Test Farm',`--as-of=${today}`];for(const[k,v]of Object.entries(fixtures)){const f=path.join(tmp,k+'.csv');fs.writeFileSync(f,v);flags.push(`--${k}=${f}`);}
 assert.equal((await run('import',...flags,'--dry-run')).imported,6);assert.equal(await count('import_rows'),0);
 assert.equal((await run('import',...flags)).imported,6);assert.equal((await run('import',...flags)).skipped,6);assert.equal((await run('mob','Import Ewes')).mob.history_verified,false);
 const bad=path.join(tmp,'bad.csv');fs.writeFileSync(bad,'Paddock,Area\nRollback Field,10\nBroken Field,no\n');await rejects('import',['agriwebb','--farm=Test Farm',`--paddocks=${bad}`],/row 3/);assert.equal((await db.query("select * from paddocks where name='Rollback Field'")).length,0);
 fs.writeFileSync(bad,'Paddock,Area\n"Broken,10\n');await rejects('import',['agriwebb','--farm=Test Farm',`--paddocks=${bad}`],/Quote/);
 const exported=await run('export',`--file=${path.join(tmp,'backup.json')}`);const backup=JSON.parse(fs.readFileSync(exported.file));assert.equal(Object.keys(backup.tables).length,16);assert.ok(backup.tables.treatments.length>=3);
 // Boundary dates use full days after the treatment day, never an early same-day clearance.
 const held=(await run('withholding')).find(x=>x.mob==='Angus Steers');assert.equal(new Date(held.whp_clear).toISOString().slice(0,10),date(15));
 for(const [d,decision] of [[14,'WHP HOLD'],[15,'ESI HOLD'],[29,'READY FOR REVIEW']]){await run('plan-sale','Angus Steers',`--name=Boundary ${d}`,`--date=${date(d)}`,'--head=1','--market=export','--pic=DEMO','--nvd=DEMO');assert.equal((await run('sale-check')).find(x=>x.name===`Boundary ${d}`).decision,decision);}
 await db.close();db=null;
 const rendered=[];for(const script of ['view.mjs','docs.mjs']){const r=spawnSync(process.execPath,[`scripts/${script}`],{cwd:REPO_ROOT,env:process.env,encoding:'utf8'});assert.equal(r.status,0,r.stderr);for(const line of r.stdout.split('\n')){const m=/^(?:view|doc): (.+)$/.exec(line);if(m)rendered.push(path.join(REPO_ROOT,m[1]));}}
 assert.ok(rendered.length>=8);for(const file of rendered){assert.match(fs.readFileSync(file,'utf8'),/Wattle Creek Demo/);fs.unlinkSync(file);}
 const json=JSON.parse(cli(['mobs','--json']).stdout);assert.ok(json.length>=4);
 const human=cli(['sale-check']).stdout;assert.match(human,/WHP HOLD/);assert.doesNotMatch(human,/GMT/);
 assert.match(cli(['mob','Angus'],1).stderr,/Ambiguous/);assert.match(cli(['does-not-exist'],1).stderr,/Unknown command/);
 const missing=COMMANDS.filter(c=>!covered.has(c));assert.deepEqual(missing,[]);
 console.log(`PASS: ${checks} checks; ${COMMANDS.length} CLI commands exercised; rollback, CSV replay, date boundaries, documents and views verified.`);
}finally{if(db)await db.close();fs.rmSync(tmp,{recursive:true,force:true});}
