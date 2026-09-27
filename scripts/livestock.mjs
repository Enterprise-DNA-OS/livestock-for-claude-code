#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {getDb,REPO_ROOT} from './lib/db.mjs';
import {table} from './lib/format.mjs';
import {page,table as htmlTable,writeOut} from './lib/render.mjs';
import {TABLES} from './lib/tables.mjs';
import {importAgriwebb} from './lib/import.mjs';

export const READS={
 farms:'select * from farms order by name',
 mobs:'select * from mob_summary order by name',
 animals:'select a.name,a.eid,m.name mob,a.birth_date,a.sex,a.status from animals a join mobs m on m.id=a.mob_id order by a.name',
 paddocks:'select * from grazing_board order by paddock',
 grazing:'select paddock,area_ha,head,dse_per_ha,feed_kg_dm,feed_age_days,rest_so_far,rest_days,decision from grazing_board order by paddock',
 reconciliation:`select m.name,m.opening_head,coalesce(sum(e.delta) filter(where e.kind='birth'),0) births,coalesce(sum(e.delta) filter(where e.kind='purchase'),0) purchases,coalesce(-sum(e.delta) filter(where e.kind='death'),0) deaths,coalesce(-sum(e.delta) filter(where e.kind='sale'),0) sold,coalesce(sum(e.delta) filter(where e.kind='adjustment'),0) adjustments,s.head closing_head from mobs m join mob_summary s on s.id=m.id left join stock_events e on e.mob_id=m.id group by m.id,s.head order by m.name`,
 movements:'select m.name mob,p.name from_paddock,q.name to_paddock,v.moved_on,v.head,v.note from movements v join mobs m on m.id=v.mob_id join paddocks p on p.id=v.from_paddock join paddocks q on q.id=v.to_paddock order by v.moved_on desc',
 treatments:'select * from treatment_register order by treated_on desc,mob',
 withholding:'select name mob,head,history_verified,whp_clear,esi_clear,unknown_hold from mob_summary where head>0 order by name',
 inventory:'select name,batch,expiry,stock_ml,whp_days,esi_days,label_ref from products order by expiry',
 performance:'select * from performance_board order by mob',
 feed:'select m.name mob,f.fed_on,f.feed,f.kg_dm,f.cost,f.supplier_declaration from feeds f join mobs m on m.id=f.mob_id order by f.fed_on desc',
 costs:'select *,sales-purchases-treatments-feed recorded_cash_margin from cost_board order by mob',
 breeding:`select j.id,m.name mob,j.sire,j.joined_on,j.ended_on,j.females,j.pregnant,j.scan_due,round(100.0*j.pregnant/j.females,1) pregnancy_percent,case when j.pregnant is null and j.scan_due<current_date then 'SCAN OVERDUE' when j.pregnant is null then 'SCAN DUE' else 'SCANNED' end status from joinings j join mobs m on m.id=j.mob_id order by j.scan_due`,
 tasks:'select id,name,due,owner,status from farm_tasks order by due',
 sales:`select e.id,m.name mob,e.event_date,e.delta*-1 head,e.amount,e.reference,e.destination_pic,e.nvd,e.nlis_reference from stock_events e join mobs m on m.id=e.mob_id where e.kind='sale' order by e.event_date desc`,
 'sale-check':'select name,mob,sale_date,head,market,whp_clear,esi_clear,decision from sale_readiness order by sale_date',
 compliance:'select * from compliance_findings order by rule,record',
 attention:'select * from attention_board order by priority,kind,record',
};
export const MUTATIONS=['add','move','treat','weigh','feed-add','stocktake','stock-event','join','scan','plan-sale','release-sale','confirm-nlis','verify-history','task-add','task-done','log'];
export const COMMANDS=[...Object.keys(READS),'mob','weekly-review',...MUTATIONS,'import','export','draft-sale','draft-treatment','draft-audit','help'];
export function argsOf(args){
 const flags={},pos=[];
 for(let i=0;i<args.length;i++) {const a=args[i]; if(a.startsWith('--')){const j=a.indexOf('=');if(j>=0)flags[a.slice(2,j)]=a.slice(j+1);else flags[a.slice(2)]=['json','dry-run','help'].includes(a.slice(2))?true:(args[i+1]&&!args[i+1].startsWith('--')?args[++i]:true);}else pos.push(a);}
 return {flags,pos};
}
const need=(o,k)=>{if(typeof o[k]!=='string'||!o[k].trim())throw Error(`Required --${k}=...`);return o[k].trim();};
const number=(o,k,{min=0,integer=false,optional=false}={})=>{if(optional&&o[k]===undefined)return 0;const raw=need(o,k),n=Number(raw);if(!Number.isFinite(n)||n<min||(integer&&!Number.isInteger(n)))throw Error(`--${k} must be ${integer?'an integer':'a number'} >= ${min}`);return n;};
const day=(v)=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||Number.isNaN(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)throw Error('Date must be valid YYYY-MM-DD');return v;};
export async function resolve(db,t,q){
 if(!TABLES.includes(t))throw Error('Unknown register');if(!q||typeof q!=='string')throw Error(`Supply a name or id for ${t}`);
 const rows=await db.query(`select * from ${t} where lower(name)=lower($1) or id::text=$1`,[q]);
 const found=rows.length?rows:await db.query(`select * from ${t} where position(lower($1) in lower(name))>0 or starts_with(id::text,$1) order by name`,[q]);
 if(found.length!==1)throw Error(`${found.length?'Ambiguous':'No match'} ${t}: ${q}${found.length?'\n'+found.map(r=>r.id+'  '+r.name).join('\n'):''}`);
 return found[0];
}
async function insert(db,t,values){const cols=Object.keys(values);return (await db.query(`insert into ${t} (${cols.join(',')}) values (${cols.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(values)))[0];}
async function mobLocked(db,q){const m=await resolve(db,'mobs',q);await db.query('select id from mobs where id=$1 for update',[m.id]);return (await db.query('select * from mobs where id=$1',[m.id]))[0];}
async function headOf(db,m){return Number((await db.query('select head from mob_summary where id=$1',[m.id]))[0].head);}
async function dated(db,f){return day(f.date?need(f,'date'):(await db.query('select current_date::text today'))[0].today);}
async function presentDate(db,m,date){const today=(await db.query('select current_date::text today'))[0].today;if(date>today)throw Error('Completed records cannot be future dated');if(date<String(m.opening_date instanceof Date?m.opening_date.toISOString().slice(0,10):m.opening_date))throw Error('Date precedes mob opening snapshot');}

export async function execute(db,args){
 const {flags:f,pos}=argsOf(args),[cmd='help',q]=pos;
 if(cmd==='help'||f.help)return {commands:COMMANDS,usage:'npm run livestock -- <command> [name] --field=value [--json]',details:'See docs/commands.md for required fields. Read commands accept --json. Drafts never send.'};
 if(READS[cmd])return db.query(READS[cmd]);
 if(cmd==='mob') {const m=await resolve(db,'mobs',q);return {mob:(await db.query('select * from mob_summary where id=$1',[m.id]))[0],events:await db.query('select * from stock_events where mob_id=$1 order by event_date',[m.id]),treatments:await db.query('select * from treatments where mob_id=$1 order by treated_on',[m.id]),notes:await db.query('select body,author,created_at from notes where mob_id=$1 order by created_at',[m.id])};}
 if(cmd==='weekly-review')return {attention:await db.query(READS.attention),grazing:await db.query(READS.grazing),sales:await db.query(READS['sale-check'])};
 if(cmd==='import'){if(q!=='agriwebb')throw Error('Use import agriwebb');return importAgriwebb(db,f);}
 if(cmd==='export'){
  const out={format:'livestock-v1',exported_at:new Date().toISOString(),tables:{}};
  await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try{for(const t of TABLES)out.tables[t]=await db.query(`select * from ${t} order by ${t==='import_rows'?'hash':'id'}`);await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}
  const file=path.resolve(f.file||path.join(REPO_ROOT,'exports',`livestock-${Date.now()}.json`));fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(out,null,2));return {file,tables:TABLES.length,rows:Object.values(out.tables).reduce((n,a)=>n+a.length,0)};
 }
 if(cmd.startsWith('draft-')){
  let title,sections,name;
  if(cmd==='draft-audit'){title='Farm audit working pack';name='audit';sections=[{title:'Findings',html:htmlTable(await db.query(READS.compliance))},{title:'Reconciliation',html:htmlTable(await db.query(READS.reconciliation))}];}
  else if(cmd==='draft-treatment'){const m=await resolve(db,'mobs',q);name=m.name;title='Treatment register';sections=[{title:m.name,html:htmlTable(await db.query('select * from treatment_register where mob=$1',[m.name]))}];}
  else if(cmd==='draft-sale'){const s=await resolve(db,'sale_plans',q);name=s.name;title='Slaughter preparation worksheet';sections=[{title:s.name,html:htmlTable(await db.query('select * from sale_readiness where id=$1',[s.id]))},{title:'Recorded details',html:htmlTable([s])}];}
  else throw Error(`Unknown command ${cmd}`);
  const file=writeOut('drafts',`${cmd}-${name.replace(/[^a-z0-9]+/gi,'-')}-${Date.now()}`,page({title,subtitle:'DRAFT. Working record only. Not an official NVD, NLIS submission or certification.',sections}));return {file,draft:true};
 }
 if(!MUTATIONS.includes(cmd))throw Error(`Unknown command ${cmd}. Run help.`);
 await db.exec('BEGIN');
 try {
  let result;
  if(cmd==='add'){
   const type=q;
   if(type==='farm')result=await insert(db,'farms',{name:need(f,'name'),pic:need(f,'pic'),state:need(f,'state')});
   else if(type==='paddock'){const farm=await resolve(db,'farms',need(f,'farm'));result=await insert(db,'paddocks',{farm_id:farm.id,name:need(f,'name'),area_ha:number(f,'area',{min:0.01}),rest_days:number(f,'rest',{integer:true})});}
   else if(type==='mob'){const p=await resolve(db,'paddocks',need(f,'paddock'));result=await insert(db,'mobs',{paddock_id:p.id,name:need(f,'name'),species:need(f,'species').toLowerCase(),breed:f.breed||'',opening_head:number(f,'head',{integer:true}),opening_date:await dated(db,f),dse_per_head:number(f,'dse',{min:0.01}),purchase_cost:number(f,'cost',{optional:true})});}
   else if(type==='product')result=await insert(db,'products',{name:need(f,'name'),batch:need(f,'batch'),expiry:day(need(f,'expiry')),stock_ml:number(f,'stock'),whp_days:number(f,'whp',{integer:true}),esi_days:number(f,'esi',{integer:true}),label_ref:need(f,'label')});
   else if(type==='animal'){const m=await mobLocked(db,need(f,'mob'));const h=await headOf(db,m);const c=Number((await db.query("select count(*) n from animals where mob_id=$1 and status='on-farm'",[m.id]))[0].n);if(c>=h)throw Error('Individual register exceeds mob head count');result=await insert(db,'animals',{mob_id:m.id,name:need(f,'name'),eid:need(f,'eid'),birth_date:day(need(f,'born')),sex:need(f,'sex')});}
   else throw Error('add supports farm, paddock, mob, product, animal');
  }else if(cmd==='task-add'){const farm=await resolve(db,'farms',need(f,'farm'));result=await insert(db,'farm_tasks',{farm_id:farm.id,name:need(f,'name'),due:day(need(f,'due')),owner:need(f,'owner')});}
  else if(cmd==='task-done'){const t=await resolve(db,'farm_tasks',q);result=(await db.query("update farm_tasks set status='done' where id=$1 returning *",[t.id]))[0];}
  else if(cmd==='scan'){const j=(await db.query('select * from joinings where starts_with(id::text,$1) for update',[q||''])) ;if(j.length!==1)throw Error('Use one joining id from breeding');result=(await db.query('update joinings set pregnant=$1 where id=$2 returning *',[number(f,'pregnant',{integer:true}),j[0].id]))[0];}
  else if(cmd==='confirm-nlis'){const r=await db.query("update stock_events set nlis_reference=$1 where reference=$2 and kind='sale' returning *",[need(f,'reference'),q]);if(r.length!==1)throw Error('Sale reference must match exactly one record');result=r[0];}
  else if(cmd==='release-sale'){
   const s=await resolve(db,'sale_plans',q);await db.query('select id from sale_plans where id=$1 for update',[s.id]);const m=await mobLocked(db,(await db.query('select name from mobs where id=$1',[s.mob_id]))[0].name);
   const check=(await db.query('select * from sale_readiness where id=$1',[s.id]))[0];if(check.decision!=='READY FOR REVIEW')throw Error(`Release blocked: ${check.decision}`);
   const today=await dated(db,{});if(day(s.sale_date instanceof Date?s.sale_date.toISOString().slice(0,10):s.sale_date)!==today)throw Error('Release only on the planned date. Future plans stay drafts.');
   if(need(f,'reviewed-by').length<2)throw Error('Record reviewer');
   const count=Number((await db.query("select count(*) n from animals where mob_id=$1 and status='on-farm'",[m.id]))[0].n);if(count)throw Error('Mob has individually registered animals. Reconcile their disposition before mob sale.');
   result=await insert(db,'stock_events',{mob_id:m.id,event_date:today,kind:'sale',delta:-s.head,amount:s.amount,reference:`PLAN-${s.id}`,destination_pic:s.destination_pic,nvd:s.nvd});
   await db.query("update sale_plans set status='released' where id=$1",[s.id]);await insert(db,'notes',{mob_id:m.id,body:`Slaughter release ${s.name}; review ${f['reviewed-by']}`,author:f['reviewed-by']});
  }else{
   const m=await mobLocked(db,q),date=await dated(db,f),head=await headOf(db,m);
   if(!['plan-sale','join','log','verify-history'].includes(cmd))await presentDate(db,m,date);
   const n=()=>{const x=number(f,'head',{min:1,integer:true});if(x>head)throw Error(`Head exceeds current mob count ${head}`);return x;};
   if(cmd==='move'){
    const p=await resolve(db,'paddocks',need(f,'to')),old=(await db.query('select * from paddocks where id=$1',[m.paddock_id]))[0];if(p.farm_id!==old.farm_id)throw Error('Cross-property moves need official transfer workflow');
    const last=await db.query('select max(moved_on)::text d from movements where mob_id=$1',[m.id]);if(last[0].d&&date<last[0].d)throw Error('Movement predates current location history');
    if(p.grazing_clear&&date<=String(p.grazing_clear instanceof Date?p.grazing_clear.toISOString().slice(0,10):p.grazing_clear))throw Error('Paddock grazing hold is active');
    result=await insert(db,'movements',{mob_id:m.id,from_paddock:m.paddock_id,to_paddock:p.id,moved_on:date,head,note:f.note||''});await db.query('update mobs set paddock_id=$1 where id=$2',[p.id,m.id]);
   }else if(cmd==='treat'){
    const p=await resolve(db,'products',need(f,'product'));await db.query('select id from products where id=$1 for update',[p.id]);const fresh=(await db.query('select * from products where id=$1',[p.id]))[0];
    if(String(fresh.expiry instanceof Date?fresh.expiry.toISOString().slice(0,10):fresh.expiry)<date)throw Error('Product expired');const h=n(),dose=number(f,'dose',{min:0.001}),use=h*dose;
    if(fresh.whp_days===null||fresh.esi_days===null||!fresh.label_ref)throw Error('Product label intervals required');if(use>Number(fresh.stock_ml))throw Error('Insufficient product stock');
    result=await insert(db,'treatments',{mob_id:m.id,product_id:p.id,product:p.name,batch:p.batch,treated_on:date,head:h,dose_ml:dose,operator:need(f,'operator'),whp_days:p.whp_days,esi_days:p.esi_days,cost:number(f,'cost',{optional:true}),label_ref:p.label_ref});await db.query('update products set stock_ml=stock_ml-$1 where id=$2',[use,p.id]);
   }else if(cmd==='weigh')result=await insert(db,'weights',{mob_id:m.id,weighed_on:date,average_kg:number(f,'kg',{min:0.01}),sample_head:n()});
   else if(cmd==='feed-add')result=await insert(db,'feeds',{mob_id:m.id,fed_on:date,feed:need(f,'feed'),kg_dm:number(f,'kg',{min:0.01}),cost:number(f,'cost'),supplier_declaration:f.declaration||''});
   else if(cmd==='stocktake'){if(date!==await dated(db,{}))throw Error('Stocktake compares current head and must use today');result=await insert(db,'counts',{mob_id:m.id,counted_on:date,observed:number(f,'head',{integer:true}),expected:head,note:need(f,'note')});}
   else if(cmd==='stock-event'){
    const last=(await db.query('select max(event_date)::text d from stock_events where mob_id=$1',[m.id]))[0].d;if(last&&date<last)throw Error('Stock event predates the latest recorded count change');
    const kind=need(f,'kind');if(!['birth','purchase','death','adjustment'].includes(kind))throw Error('Sales use plan-sale then release-sale');const delta=Number(need(f,'delta'));if(!Number.isInteger(delta)||delta===0||head+delta<0)throw Error('Invalid count change');
    if(delta<0&&Number((await db.query("select count(*) n from animals where mob_id=$1 and status='on-farm'",[m.id]))[0].n)>head+delta)throw Error('Reconcile individual animals before reducing count');
    result=await insert(db,'stock_events',{mob_id:m.id,event_date:date,kind,delta,amount:number(f,'amount',{optional:true}),reference:need(f,'reference')});
   }else if(cmd==='join'){const females=n();result=await insert(db,'joinings',{mob_id:m.id,sire:need(f,'sire'),joined_on:day(need(f,'start')),ended_on:day(need(f,'end')),females,scan_due:day(need(f,'scan-due'))});}
   else if(cmd==='plan-sale')result=await insert(db,'sale_plans',{mob_id:m.id,name:need(f,'name'),sale_date:day(need(f,'date')),head:n(),market:need(f,'market'),destination_pic:f.pic||'',nvd:f.nvd||'',amount:number(f,'amount',{optional:true})});
   else if(cmd==='verify-history'){result=await insert(db,'notes',{mob_id:m.id,body:`Treatment history verified: ${need(f,'evidence')}`,author:need(f,'by')});await db.query('update mobs set history_verified=true where id=$1',[m.id]);}
   else if(cmd==='log')result=await insert(db,'notes',{mob_id:m.id,body:need(f,'note'),author:need(f,'by')});
  }
  await db.exec('COMMIT');return result;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
function print(value){if(Array.isArray(value)){console.log(table(value,value.length?Object.keys(value[0]).filter(k=>!['id','created_at','updated_at'].includes(k)).map(k=>({key:k,label:k.replaceAll('_',' '),format:v=>v instanceof Date?v.toISOString().slice(0,10):v})):[]));}else{for(const [k,v] of Object.entries(value||{})){if(Array.isArray(v)||v&&typeof v==='object'){console.log('\n'+k);print(Array.isArray(v)?v:[v]);}else console.log(`${k}: ${v??''}`);}}}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 const args=process.argv.slice(2);let db;
 try{db=await getDb();const result=await execute(db,args);if(argsOf(args).flags.json)console.log(JSON.stringify(result,null,2));else print(result);}
 catch(e){if(argsOf(args).flags.json)console.error(JSON.stringify({error:e.message}));else console.error(e.message);process.exitCode=1;}
 finally{if(db)await db.close();}
}
