alter table "wines"
  add column "discount_percent" integer;

alter table "wines"
  add constraint "wines_discount_percent_check"
  check ("discount_percent" is null or ("discount_percent" >= 1 and "discount_percent" <= 99));
