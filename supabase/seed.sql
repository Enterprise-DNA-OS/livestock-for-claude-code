-- Fictional mixed farm. Product names and intervals are demonstration values, not label guidance.
insert into farms(id,name,pic,state,biosecurity_review,risk_review) values ('10000000-0000-0000-0000-000000000001','Wattle Creek Demo','DEMO-PIC','NSW',current_date-400,current_date-20) on conflict do nothing;
insert into paddocks(id,farm_id,name,area_ha,rest_days,feed_kg_dm,feed_checked,grazing_clear) values
('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','River Flat',40,30,1600,current_date-3,null),
('20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','North Ridge',75,35,850,current_date-25,null),
('20000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000001','South Ridge',55,30,1800,current_date-2,null),
('20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000001','Lucerne',25,21,2200,current_date-1,current_date+7) on conflict do nothing;
insert into mobs(id,paddock_id,name,species,breed,opening_head,opening_date,dse_per_head,purchase_cost,history_verified) values
('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Angus Steers','cattle','Angus',80,current_date-100,8,72000,true),
('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','Merino Ewes','sheep','Merino',500,current_date-100,1.5,0,true),
('30000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','Angus Heifers','cattle','Angus',60,current_date-100,7,48000,false) on conflict do nothing;
insert into products(id,name,batch,expiry,stock_ml,whp_days,esi_days,label_ref) values
('40000000-0000-0000-0000-000000000001','Demo Drench','DEMO-A',current_date+180,10000,14,28,'DEMO ONLY: replace with actual label'),
('40000000-0000-0000-0000-000000000002','Expired Demo Vaccine','DEMO-B',current_date-5,500,0,0,'DEMO ONLY') on conflict do nothing;
insert into treatments(id,mob_id,product_id,product,batch,treated_on,head,dose_ml,operator,whp_days,esi_days,cost,label_ref) values
('50000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001','Demo Drench','DEMO-A',current_date-4,80,10,'Jo',14,28,160,'DEMO ONLY'),
('50000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000003',null,'Historic treatment','UNKNOWN',current_date-40,60,5,'',null,null,90,'') on conflict do nothing;
insert into weights(id,mob_id,weighed_on,average_kg,sample_head) values
('60000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',current_date-60,350,80),
('60000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001',current_date-10,385,80),
('60000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000002',current_date-45,52,50) on conflict do nothing;
insert into stock_events(id,mob_id,event_date,kind,delta,amount,reference,destination_pic,nvd) values
('70000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002',current_date-20,'death',-2,0,'DEATH-001','',''),
('70000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002',current_date-15,'sale',-20,3000,'SALE-001','DEMO-BUYER','DEMO-NVD-1') on conflict do nothing;
insert into movements(id,mob_id,from_paddock,to_paddock,moved_on,head,note) values ('80000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001',current_date-40,80,'Finished grazing South Ridge') on conflict do nothing;
insert into feeds(id,mob_id,fed_on,feed,kg_dm,cost,supplier_declaration) values
('90000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',current_date-2,'Hay',500,240,'DEMO-CVD-1'),
('90000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002',current_date-3,'Pellets',250,180,'') on conflict do nothing;
insert into joinings(id,mob_id,sire,joined_on,ended_on,females,scan_due) values ('a0000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002','Ram team A',current_date-100,current_date-65,480,current_date-3) on conflict do nothing;
insert into sale_plans(id,mob_id,name,sale_date,head,market,destination_pic,nvd) values
('b0000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','October steers',current_date+5,30,'export','DEMO-BUYER','DEMO-NVD-2'),
('b0000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000002','Cull ewes',current_date+2,40,'domestic','','') on conflict do nothing;
insert into farm_tasks(id,farm_id,name,due,owner) values ('c0000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Check North Ridge trough',current_date-2,'Jo') on conflict do nothing;
insert into counts(id,mob_id,counted_on,observed,expected,note) values ('d0000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000002',current_date-1,475,478,'Three missing at muster') on conflict do nothing;
insert into animals(id,mob_id,name,eid,birth_date,sex) values ('e0000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','Demo steer 001','DEMO-EID-001',current_date-600,'male') on conflict do nothing;
