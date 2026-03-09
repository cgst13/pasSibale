-- Add qrCode and nfcCardId columns to citizens table
alter table public.citizens
add column "qrCode" text unique,
add column "nfcCardId" text unique;

-- Create an index for faster lookups
create index idx_citizens_qrCode on public.citizens("qrCode");
create index idx_citizens_nfcCardId on public.citizens("nfcCardId");
