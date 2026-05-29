create table "discounts" (
  "id" uuid primary key default gen_random_uuid(),
  "name" text not null,
  "percent" integer not null,
  "created_at" timestamptz(6) not null default now(),
  "updated_at" timestamptz(6) not null default now(),
  constraint "discounts_percent_check" check ("percent" >= 1 and "percent" <= 99)
);

create index "discounts_name_idx" on "discounts" ("name");

alter table "wines"
  add column "discount_id" uuid;

insert into "discounts" ("name", "percent")
select 'Descuento ' || "discount_percent" || '%', "discount_percent"
from (
  select distinct "discount_percent"
  from "wines"
  where "discount_percent" is not null
    and "discount_percent" >= 1
    and "discount_percent" <= 99
) as existing_discounts;

update "wines" as wine
set "discount_id" = discount."id"
from "discounts" as discount
where wine."discount_percent" = discount."percent"
  and discount."name" = 'Descuento ' || wine."discount_percent" || '%';

create index "wines_discount_id_idx" on "wines" ("discount_id");

alter table "wines"
  add constraint "wines_discount_id_fkey"
  foreign key ("discount_id")
  references "discounts" ("id")
  on delete set null
  on update cascade;
