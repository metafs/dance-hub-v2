-- A withdrawal or correction request concerns a public Event (listing policy
-- F, G-6). The form inserts with the service role, so the database is what
-- keeps it from confirming that an unpublished Event exists: a draft, a
-- withdrawn and a missing Event are refused with the same error.
begin;

create extension if not exists pgtap with schema extensions;
select plan(5);

-- A draft that was never published.
insert into public.events (id, owner_organization_id)
values ('13131313-aaaa-4aaa-8aaa-000000000001', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.event_revisions (id, event_id, created_by, status, title)
values ('13131313-bbbb-4bbb-8bbb-000000000001', '13131313-aaaa-4aaa-8aaa-000000000001', '33333333-3333-4333-8333-333333333333', 'draft', '未公開の下書き');

set local role service_role;

select lives_ok(
  $$insert into public.listing_requests (event_id, kind, requester_contact, message) values ('e0000001-0000-4000-8000-000000000001', 'correction', 'visitor@example.com', '会場名が違います')$$,
  'a request about a public Event is accepted'
);

select lives_ok(
  $$insert into public.listing_requests (event_id, kind, requester_contact, message) values ('e0000006-0000-4000-8000-000000000006', 'withdrawal', 'visitor@example.com', '中止の告知も消してください')$$,
  'a request about a cancelled Event, which stays public, is accepted'
);

select throws_ok(
  $$insert into public.listing_requests (event_id, kind, requester_contact, message) values ('13131313-aaaa-4aaa-8aaa-000000000001', 'withdrawal', 'visitor@example.com', 'x')$$,
  'P0001',
  'listing requests concern a public event',
  'a request naming an unpublished Event is refused'
);

select throws_ok(
  $$insert into public.listing_requests (event_id, kind, requester_contact, message) values ('13131313-aaaa-4aaa-8aaa-00000000ffff', 'withdrawal', 'visitor@example.com', 'x')$$,
  'P0001',
  'listing requests concern a public event',
  'a request naming no Event is refused the same way, so the answer reveals nothing'
);

reset role;
update public.events
set withdrawn_at = now(), withdrawn_by = '22222222-2222-4222-8222-222222222222', withdrawal_reason = 'F-1'
where id = 'e0000002-0000-4000-8000-000000000002';
set local role service_role;

select throws_ok(
  $$insert into public.listing_requests (event_id, kind, requester_contact, message) values ('e0000002-0000-4000-8000-000000000002', 'correction', 'visitor@example.com', 'x')$$,
  'P0001',
  'listing requests concern a public event',
  'a request naming a withdrawn Event is refused'
);

reset role;

select * from finish();
rollback;
