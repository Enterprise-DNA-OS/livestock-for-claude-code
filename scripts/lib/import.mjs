import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parse} from 'csv-parse/sync';
const aliases={name:['Name','Mob','Mob Name','Livestock Name'],paddock:['Paddock','Paddock Name','Location'],area:['Area (ha)','Area','Hectares'],species:['Species','Animal Type','Livestock Type'],head:['Number of Animals','Head','Head Count','Number','Count'],date:['Date','Treatment Date','Weigh Date'],product:['Product','Treatment','Product Name'],dose:['Dosage','Dose (ml)','Dose'],whp:['WHP (days)','WHP','Withholding Period'],esi:['ESI (days)','ESI','Export Slaughter Interval']};
const get=(r,k,...extra)=>{for(const a of [...(aliases[k]||[k]),...extra]){const found=Object.keys(r).find(x=>x.trim().toLowerCase()===a.toLowerCase());if(found&&String(r[found]).trim())return String(r[found]).trim();}return '';};
const req=(r,k,...extra)=>{const v=get(r,k,...extra);if(!v)throw Error(`Missing ${k} column/value`);return v;};
const num=(v,label,{min=0,integer=false}={})=>{if(!/^-?\d+(\.\d+)?$/.test(v))throw Error(`${label}: plain numeric value required`);const n=Number(v);if(!Number.isFinite(n)||n<min||integer&&!Number.isInteger(n))throw Error(`Invalid ${label}`);return n;};
const date=(v)=>{let s=v;const m=/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(v);if(m)s=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;if(!/^\d{4}-\d{2}-\d{2}$/.test(s)||Number.isNaN(Date.parse(s))||new Date(s).toISOString().slice(0,10)!==s)throw Error(`Invalid date ${v}; use YYYY-MM-DD or DD/MM/YYYY`);return s;};
async function exact(db,t,name){const rows=await db.query(`select * from ${t} where lower(name)=lower($1)`,[name]);if(rows.length!==1)throw Error(`${t}: exact unique name required: ${name}`);return rows[0];}
async function insert(db,t,r){const cols=Object.keys(r);return db.query(`insert into ${t} (${cols.join(',')}) values (${cols.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,Object.values(r));}
export async function importAgriwebb(db,f){
 const kinds=['paddocks','mobs','animals','treatments','weights','feeds'];
 for(const k of Object.keys(f))if(![...kinds,'farm','as-of','dse-cattle','dse-sheep','dry-run','json'].includes(k))throw Error(`Unknown import option --${k}`);
 if(!kinds.some(k=>f[k]))throw Error('Provide --paddocks, --mobs, --animals, --treatments, --weights or --feeds');
 const farm=await exact(db,'farms',f.farm||'');const asof=f['as-of']?date(f['as-of']):null;if(f.mobs&&!asof)throw Error('Mob snapshots require --as-of=YYYY-MM-DD');
 const report={dry_run:!!f['dry-run'],imported:0,skipped:0,by_kind:{}};
 await db.exec('BEGIN');
 try{
  for(const kind of kinds){if(!f[kind])continue;const data=fs.readFileSync(f[kind],'utf8');
   const rows=parse(data,{bom:true,columns:headers=>{const h=headers.map(x=>x.trim());if(new Set(h.map(x=>x.toLowerCase())).size!==h.length)throw Error('Duplicate CSV headers');return h;},skip_empty_lines:true,trim:true});
   if(!rows.length)throw Error(`${kind}: no rows`);report.by_kind[kind]=0;
   for(let i=0;i<rows.length;i++){
    const r=rows[i],hash=createHash('sha256').update(JSON.stringify([farm.id,kind,kind==='mobs'?asof:null,Object.entries(r).sort()])).digest('hex');
    if((await db.query('select hash from import_rows where hash=$1',[hash])).length){report.skipped++;continue;}
    try{
     if(kind==='paddocks')await insert(db,'paddocks',{farm_id:farm.id,name:req(r,'paddock','Name'),area_ha:num(req(r,'area'),'area',{min:0.001}),rest_days:30});
     else if(kind==='mobs'){
      const paddock=await exact(db,'paddocks',req(r,'paddock'));if(paddock.farm_id!==farm.id)throw Error('Paddock belongs to another farm');const species=req(r,'species').toLowerCase();
      await insert(db,'mobs',{name:req(r,'name'),paddock_id:paddock.id,species,breed:get(r,'Breed'),opening_head:num(req(r,'head'),'head',{integer:true}),opening_date:asof,dse_per_head:num(get(r,'DSE per Head')||String(f['dse-'+species]||''),'DSE per head',{min:0.001}),history_verified:false});
     }else{
      const m=await exact(db,'mobs',req(r,'name'));const p=(await db.query('select farm_id from paddocks where id=$1',[m.paddock_id]))[0];if(p.farm_id!==farm.id)throw Error('Mob belongs to another farm');
      if(kind==='treatments')await insert(db,'treatments',{mob_id:m.id,product:req(r,'product'),batch:get(r,'Batch','Batch Number')||'UNKNOWN',treated_on:date(req(r,'date')),head:num(req(r,'head'),'head',{min:1,integer:true}),dose_ml:num(req(r,'dose'),'dose',{min:0.001}),operator:get(r,'Operator','User','Applied By'),whp_days:get(r,'whp')?num(get(r,'whp'),'WHP',{integer:true}):null,esi_days:get(r,'esi')?num(get(r,'esi'),'ESI',{integer:true}):null,cost:num(get(r,'Cost')||'0','cost'),source_ref:hash,label_ref:get(r,'Label Reference')});
      else if(kind==='weights')await insert(db,'weights',{mob_id:m.id,weighed_on:date(req(r,'date')),average_kg:num(req(r,'Average Weight (kg)','Average Weight','Weight (kg)'),'weight',{min:0.001}),sample_head:num(req(r,'head'),'head',{min:1,integer:true})});
      else if(kind==='animals')await insert(db,'animals',{mob_id:m.id,name:req(r,'VID','Visual ID','Tag'),eid:req(r,'EID','Electronic ID'),birth_date:get(r,'Date of Birth')?date(get(r,'Date of Birth')):null,sex:get(r,'Sex')});
      else if(kind==='feeds')await insert(db,'feeds',{mob_id:m.id,fed_on:date(req(r,'date')),feed:req(r,'Feed','Feed Name'),kg_dm:num(req(r,'Dry Matter (kg)','kg DM'),'dry matter',{min:0.001}),cost:num(req(r,'Cost'),'cost'),supplier_declaration:get(r,'Supplier Declaration')});
     }
     if(kind==='treatments'){const m=await exact(db,'mobs',req(r,'name'));await db.query('update mobs set history_verified=false where id=$1',[m.id]);}
     await db.query('insert into import_rows(hash,kind,source_file,row_number) values($1,$2,$3,$4)',[hash,kind,String(f[kind]).split(/[\\/]/).pop(),i+2]);report.imported++;report.by_kind[kind]++;
    }catch(e){throw Error(`${kind} row ${i+2}: ${e.message}`);}
   }
  }
  // No individual count can silently exceed its opening mob snapshot.
  const over=await db.query("select m.name from mobs m join animals a on a.mob_id=m.id and a.status='on-farm' join mob_summary s on s.id=m.id group by m.id,s.head having count(*)>s.head");if(over.length)throw Error('Individual register exceeds head count: '+over.map(x=>x.name).join(', '));
  await db.exec(f['dry-run']?'ROLLBACK':'COMMIT');return report;
 }catch(e){await db.exec('ROLLBACK');throw e;}
}
