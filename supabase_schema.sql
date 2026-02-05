-- Minimal users table (optional; auth.users remains the source of truth)
create table public.users (
  id uuid primary key references auth.users on delete cascade,
  name text,
  email text unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.users enable row level security;

create policy "Users can view their own profile."
  on public.users for select
  using (auth.uid() = id);

create policy "Users can insert their own profile."
  on public.users for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile."
  on public.users for update
  using (auth.uid() = id);

-- Data Packets Table (Internal name, UI will use "Data Packets")
create table public.data_packets (
  id uuid default gen_random_uuid() primary key,
  owner_id uuid references auth.users not null,
  schema jsonb not null, -- Stores column definitions: [{name: 'Salary', type: 'number'}, ...]
  context_text text,
  is_public boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.data_packets enable row level security;

-- Packet Shares (share links + email invites)
create table public.data_packet_shares (
  id uuid default gen_random_uuid() primary key,
  packet_id uuid references public.data_packets(id) on delete cascade not null,
  share_type text not null check (share_type in ('link', 'invite')),
  share_token text unique,
  invited_email text,
  expires_at timestamp with time zone,
  created_by uuid references auth.users not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index on public.data_packet_shares (packet_id);
create index on public.data_packet_shares (share_token);
create index on public.data_packet_shares (invited_email);

alter table public.data_packet_shares enable row level security;

create policy "Owners can manage shares."
  on data_packet_shares for all
  using (
    exists (
      select 1 from data_packets
      where data_packets.id = data_packet_shares.packet_id
      and data_packets.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from data_packets
      where data_packets.id = data_packet_shares.packet_id
      and data_packets.owner_id = auth.uid()
    )
  );

create policy "Invitees can view share records."
  on data_packet_shares for select
  using (
    share_type = 'invite'
    and lower(invited_email) = lower((auth.jwt() ->> 'email'))
  );

-- Data Packet policies
create policy "Users can CRUD their own packets."
  on data_packets for all
  using ( auth.uid() = owner_id );

create policy "Anyone can view public packets."
  on data_packets for select
  using ( is_public = true );

create policy "Invitees can view packets."
  on data_packets for select
  using (
    exists (
      select 1 from data_packet_shares s
      where s.packet_id = data_packets.id
      and s.share_type = 'invite'
      and lower(s.invited_email) = lower((auth.jwt() ->> 'email'))
      and (s.expires_at is null or s.expires_at > now())
    )
  );

-- Data Rows Table
create table public.data_rows (
  id uuid default gen_random_uuid() primary key,
  packet_id uuid references public.data_packets(id) on delete cascade not null,
  row_data jsonb not null -- Stores the actual row values: { "Salary": 50000, "Name": "John" }
);

alter table public.data_rows enable row level security;

create policy "Users can view rows of accessible packets."
  on data_rows for select
  using (
    exists (
      select 1 from data_packets
      where data_packets.id = data_rows.packet_id
      and (
        data_packets.owner_id = auth.uid()
        or data_packets.is_public = true
        or exists (
          select 1 from data_packet_shares s
          where s.packet_id = data_packets.id
          and s.share_type = 'invite'
          and lower(s.invited_email) = lower((auth.jwt() ->> 'email'))
          and (s.expires_at is null or s.expires_at > now())
        )
      )
    )
  );

create policy "Owners can insert rows."
  on data_rows for insert
  with check (
    exists (
      select 1 from data_packets
      where data_packets.id = data_rows.packet_id
      and data_packets.owner_id = auth.uid()
    )
  );
