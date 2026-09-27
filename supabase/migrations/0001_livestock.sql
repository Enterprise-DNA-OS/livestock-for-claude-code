-- No extensions required. PostgreSQL and embedded PGlite use the same schema.
create function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end $$;
create table farms (id uuid primary key default gen_random_uuid(), name text not null unique, pic text not null, state text not null default 'NSW', biosecurity_review date, risk_review date, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger farms_updated before update on farms for each row execute function touch_updated_at();
create table paddocks (id uuid primary key default gen_random_uuid(), farm_id uuid not null references farms, name text not null, area_ha numeric not null check(area_ha>0), rest_days integer not null default 30 check(rest_days>=0), feed_kg_dm numeric check(feed_kg_dm>=0), feed_checked date, grazing_clear date, unique(farm_id,name), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger paddocks_updated before update on paddocks for each row execute function touch_updated_at();
create table mobs (id uuid primary key default gen_random_uuid(), paddock_id uuid not null references paddocks, name text not null unique, species text not null check(species in ('cattle','sheep')), breed text not null default '', opening_head integer not null check(opening_head>=0), opening_date date not null, dse_per_head numeric not null check(dse_per_head>0), purchase_cost numeric not null default 0 check(purchase_cost>=0), history_verified boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger mobs_updated before update on mobs for each row execute function touch_updated_at();
create table animals (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, name text not null unique, eid text unique, birth_date date, sex text not null default '', status text not null default 'on-farm' check(status in ('on-farm','sold','dead')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger animals_updated before update on animals for each row execute function touch_updated_at();
create table stock_events (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, event_date date not null, kind text not null check(kind in ('birth','purchase','death','sale','adjustment')), delta integer not null, amount numeric not null default 0 check(amount>=0), reference text not null, destination_pic text not null default '', nvd text not null default '', nlis_reference text not null default '', unique(mob_id,reference), check((kind in ('birth','purchase') and delta>0) or (kind in ('death','sale') and delta<0) or (kind='adjustment' and delta<>0)), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger stock_events_updated before update on stock_events for each row execute function touch_updated_at();
create table movements (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, from_paddock uuid not null references paddocks, to_paddock uuid not null references paddocks, moved_on date not null, head integer not null check(head>0), note text not null default '', check(from_paddock<>to_paddock), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger movements_updated before update on movements for each row execute function touch_updated_at();
create table counts (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, counted_on date not null, observed integer not null check(observed>=0), expected integer not null check(expected>=0), note text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger counts_updated before update on counts for each row execute function touch_updated_at();
create table products (id uuid primary key default gen_random_uuid(), name text not null unique, batch text not null, expiry date not null, stock_ml numeric not null check(stock_ml>=0), whp_days integer check(whp_days>=0), esi_days integer check(esi_days>=0), label_ref text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger products_updated before update on products for each row execute function touch_updated_at();
create table treatments (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, product_id uuid references products, product text not null, batch text not null, treated_on date not null, head integer not null check(head>0), dose_ml numeric not null check(dose_ml>0), operator text not null, whp_days integer check(whp_days>=0), esi_days integer check(esi_days>=0), cost numeric not null default 0 check(cost>=0), source_ref text unique, label_ref text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger treatments_updated before update on treatments for each row execute function touch_updated_at();
create table weights (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, weighed_on date not null, average_kg numeric not null check(average_kg>0), sample_head integer not null check(sample_head>0), unique(mob_id,weighed_on), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger weights_updated before update on weights for each row execute function touch_updated_at();
create table feeds (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, fed_on date not null, feed text not null, kg_dm numeric not null check(kg_dm>0), cost numeric not null check(cost>=0), supplier_declaration text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger feeds_updated before update on feeds for each row execute function touch_updated_at();
create table joinings (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, sire text not null, joined_on date not null, ended_on date not null, females integer not null check(females>0), pregnant integer check(pregnant>=0), scan_due date not null, check(ended_on>=joined_on), check(pregnant<=females), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger joinings_updated before update on joinings for each row execute function touch_updated_at();
create table sale_plans (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, name text not null unique, sale_date date not null, head integer not null check(head>0), market text not null check(market in ('domestic','export')), destination_pic text not null default '', nvd text not null default '', status text not null default 'planned' check(status in ('planned','released')), amount numeric not null default 0 check(amount>=0), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger sale_plans_updated before update on sale_plans for each row execute function touch_updated_at();
create table farm_tasks (id uuid primary key default gen_random_uuid(), farm_id uuid not null references farms, name text not null, due date not null, owner text not null, status text not null default 'open' check(status in ('open','done')), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger farm_tasks_updated before update on farm_tasks for each row execute function touch_updated_at();
create table notes (id uuid primary key default gen_random_uuid(), mob_id uuid not null references mobs, body text not null, author text not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create trigger notes_updated before update on notes for each row execute function touch_updated_at();

create index treatments_mob_date on treatments(mob_id,treated_on);
create index events_mob_date on stock_events(mob_id,event_date);
create index movements_paddock_date on movements(from_paddock,to_paddock,moved_on);
create view mob_summary as
select m.id,m.name,m.species,p.name paddock,f.name farm,m.opening_head,
 m.opening_head+coalesce((select sum(e.delta) from stock_events e where e.mob_id=m.id),0)::integer head,
 m.dse_per_head,m.history_verified,
 (select max(weighed_on) from weights w where w.mob_id=m.id) last_weighed,
 (select max(treated_on+whp_days+1) from treatments t where t.mob_id=m.id) whp_clear,
 (select max(treated_on+esi_days+1) from treatments t where t.mob_id=m.id) esi_clear,
 exists(select 1 from treatments t where t.mob_id=m.id and (whp_days is null or esi_days is null or label_ref='')) unknown_hold
from mobs m join paddocks p on p.id=m.paddock_id join farms f on f.id=p.farm_id;
create view grazing_board as
select p.id,p.name paddock,f.name farm,p.area_ha,
 coalesce(sum(s.head),0)::integer head,round(coalesce(sum(s.head*m.dse_per_head),0)/p.area_ha,2) dse_per_ha,
 p.feed_kg_dm,p.feed_checked,current_date-p.feed_checked feed_age_days,
 (select max(moved_on) from movements v where v.from_paddock=p.id) last_exit,
 current_date-(select max(moved_on) from movements v where v.from_paddock=p.id) rest_so_far,
 p.rest_days,p.grazing_clear,
 case when p.grazing_clear>=current_date then 'GRAZING HOLD' when coalesce(sum(s.head),0)>0 then 'OCCUPIED'
 when (select max(moved_on) from movements v where v.from_paddock=p.id) is null then 'REST UNKNOWN'
 when current_date-(select max(moved_on) from movements v where v.from_paddock=p.id)<p.rest_days then 'REST SHORT' else 'REST MET' end decision
from paddocks p join farms f on f.id=p.farm_id left join mobs m on m.paddock_id=p.id left join mob_summary s on s.id=m.id group by p.id,f.name;
create view treatment_register as select t.id,m.name mob,t.product,t.batch,t.treated_on,t.head,t.dose_ml,t.operator,t.whp_days,t.esi_days,
 t.treated_on+t.whp_days+1 whp_clear,t.treated_on+t.esi_days+1 esi_clear,t.label_ref,t.cost from treatments t join mobs m on m.id=t.mob_id;
create view sale_readiness as
select sp.id,sp.name,ms.name mob,sp.sale_date,sp.head,sp.market,ms.whp_clear,ms.esi_clear,
 case when sp.status='released' then 'RELEASED' when sp.head>ms.head then 'INSUFFICIENT HEAD'
 when not ms.history_verified then 'HISTORY UNVERIFIED' when ms.unknown_hold then 'HOLD UNKNOWN'
 when sp.sale_date<ms.whp_clear then 'WHP HOLD' when sp.market='export' and sp.sale_date<ms.esi_clear then 'ESI HOLD'
 when sp.destination_pic='' or sp.nvd='' then 'PAPERWORK MISSING' else 'READY FOR REVIEW' end decision
from sale_plans sp join mob_summary ms on ms.id=sp.mob_id;
create view performance_board as
select m.name mob,s.head,w.weighed_on,w.average_kg,w.sample_head,
 round((w.average_kg-prev.average_kg)/nullif(w.weighed_on-prev.weighed_on,0),3) daily_gain_kg,
 current_date-w.weighed_on days_since_weigh
from mobs m join mob_summary s on s.id=m.id
left join lateral(select * from weights where mob_id=m.id order by weighed_on desc limit 1) w on true
left join lateral(select * from weights where mob_id=m.id and weighed_on<w.weighed_on order by weighed_on desc limit 1) prev on true;
create view cost_board as
select m.name mob,s.head,m.purchase_cost+coalesce((select sum(amount) from stock_events where mob_id=m.id and kind='purchase'),0) purchases,
 coalesce((select sum(cost) from treatments where mob_id=m.id),0) treatments,
 coalesce((select sum(cost) from feeds where mob_id=m.id),0) feed,
 coalesce((select sum(amount) from stock_events where mob_id=m.id and kind='sale'),0) sales
from mobs m join mob_summary s on s.id=m.id;
create view compliance_findings as
select 'LPA-TREATMENT' rule,m.name record,'Treatment evidence or holding interval missing' issue,'docs/compliance.md#lpa-treatment' source from treatments t join mobs m on m.id=t.mob_id where t.whp_days is null or t.esi_days is null or t.label_ref='' or t.operator='' or t.batch=''
union all select 'LPA-HISTORY',name,'Imported treatment history needs review','docs/compliance.md#lpa-history' from mobs where not history_verified
union all select 'LPA-MOVEMENT',m.name,'Sale missing PIC, NVD or NLIS confirmation','docs/compliance.md#lpa-movement' from stock_events e join mobs m on m.id=e.mob_id where kind='sale' and (nvd='' or destination_pic='' or nlis_reference='')
union all select 'LPA-FEED',m.name,'Feed supplier declaration missing','docs/compliance.md#lpa-feed' from feeds f join mobs m on m.id=f.mob_id where supplier_declaration=''
union all select 'LPA-PLAN',name,'Biosecurity plan or property risk assessment review missing or over one year old','docs/compliance.md#lpa-plan' from farms where biosecurity_review is null or risk_review is null or biosecurity_review<current_date-365 or risk_review<current_date-365
union all select 'FARM-INVENTORY',name,'Treatment product expired','docs/compliance.md#farm-inventory' from products where expiry<current_date and stock_ml>0;
create view attention_board as
select 1 priority,'sale' kind,name record,decision issue from sale_readiness where decision not in ('READY FOR REVIEW','RELEASED')
union all select 2,'compliance',record,issue from compliance_findings
union all select 3,'task',name,'Overdue: '||owner from farm_tasks where due<current_date and status='open'
union all select 3,'weigh',mob,'Weight missing or older than 30 days' from performance_board where head>0 and (days_since_weigh>30 or weighed_on is null)
union all select 3,'stocktake',m.name,'Observed '||c.observed||', expected '||c.expected from counts c join mobs m on m.id=c.mob_id where c.observed<>c.expected and c.id=(select id from counts where mob_id=m.id order by counted_on desc,created_at desc limit 1)
union all select 4,'pasture',paddock,'Feed estimate missing or older than 14 days' from grazing_board where feed_age_days>14 or feed_checked is null;
