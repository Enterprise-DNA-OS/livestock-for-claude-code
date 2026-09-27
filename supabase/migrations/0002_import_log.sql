create table import_rows(hash text primary key,kind text not null,source_file text not null,row_number integer not null,created_at timestamptz not null default now());
