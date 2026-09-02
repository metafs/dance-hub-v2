begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

insert into public.events (id, owner_organization_id)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into public.event_revisions (
  id, event_id, created_by, title, description, event_type
) values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  '33333333-3333-4333-8333-333333333333',
  'Ticket Offer DB test',
  'A complete revision whose price is announced before its sales URL.',
  'performance'
);

select lives_ok(
  $$insert into public.event_ticket_offers (event_revision_id, price_type, label, currency, amount_minor, display_order) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'fixed', '一般前売', 'JPY', 3000, 0)$$,
  'fixed offer stores one integer minor-unit amount'
);

select lives_ok(
  $$insert into public.event_ticket_offers (event_revision_id, price_type, currency, min_amount_minor, max_amount_minor, display_order) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'range', 'JPY', 1000, 3000, 1)$$,
  'range offer stores ordered minor-unit bounds'
);

select lives_ok(
  $$insert into public.event_ticket_offers (event_revision_id, price_type, currency, min_amount_minor, display_order) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'pay_what_you_can', 'JPY', 500, 2)$$,
  'pay-what-you-can may store a minimum amount'
);

select lives_ok(
  $$insert into public.event_ticket_offers (event_revision_id, price_type, label, currency, amount_minor, display_order) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'sliding_scale', 'Access', 'JPY', 1000, 3)$$,
  'each sliding-scale level stores its own exact amount'
);

select lives_ok(
  $$insert into public.event_ticket_offers (event_revision_id, price_type, display_order) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'free', 4)$$,
  'free offer stores no currency or amount'
);

select throws_ok(
  $$insert into public.event_ticket_offers (event_revision_id, price_type, currency, amount_minor, display_order) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'fixed', 'jpy', 3000, 5)$$,
  '23514',
  null,
  'currency must use uppercase alpha-3 format'
);

select throws_ok(
  $$insert into public.event_ticket_offers (event_revision_id, price_type, currency, min_amount_minor, max_amount_minor, display_order) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'range', 'JPY', 3000, 1000, 5)$$,
  '23514',
  null,
  'range minimum cannot exceed maximum'
);

select throws_ok(
  $$insert into public.event_ticket_offers (event_revision_id, price_type, currency, amount_minor, display_order) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'sliding_scale', 'JPY', 1000, 5)$$,
  '23514',
  null,
  'sliding-scale levels require a human label'
);

insert into public.event_artists (event_revision_id, artist_id, role, display_order)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', '出演', 0);
insert into public.event_schedules (event_revision_id, venue_id, starts_at)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', '2030-04-01 10:00:00+00');
insert into public.event_media (event_revision_id, object_key, content_type, alt_text, is_main, display_order)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'events/ticket-offer-test.jpg', 'image/jpeg', 'Ticket Offer test', true, 0);

select lives_ok(
  $$select public.assert_event_revision_reviewable('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1')$$,
  'a ticket offer satisfies publication validation without a ticket link'
);

update public.event_revisions
set status = 'approved'
where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1';
update public.events
set published_revision_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1'
where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

select throws_ok(
  $$update public.event_ticket_offers set amount_minor = 3500 where event_revision_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1' and display_order = 0$$,
  'P0001',
  'event revision content is immutable in status approved',
  'approved revision ticket offers are immutable'
);

select throws_ok(
  $$delete from public.event_ticket_offers where event_revision_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1' and display_order = 0$$,
  'P0001',
  'event revision content is immutable in status approved',
  'approved revision ticket offers reject deletes'
);

set local role anon;
select is(
  (select count(*)::integer from public.event_ticket_offers where event_revision_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1'),
  5,
  'anonymous readers see offers from the current approved revision'
);
reset role;

insert into public.event_revisions (
  id, event_id, created_by, title, description, event_type
) values (
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  '33333333-3333-4333-8333-333333333333',
  'Private Ticket Offer draft',
  'Not publicly visible.',
  'performance'
);
insert into public.event_ticket_offers (event_revision_id, price_type, currency, amount_minor)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', 'fixed', 'JPY', 9999);

set local role authenticated;
select set_config('request.jwt.claim.sub', '55555555-5555-4555-8555-555555555555', true);
select throws_ok(
  $$insert into public.event_ticket_offers (event_revision_id, price_type, currency, amount_minor, display_order) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2', 'fixed', 'JPY', 1000, 1)$$,
  '42501',
  null,
  'a member of another organization cannot add offers'
);
reset role;

set local role anon;
select is(
  (select count(*)::integer from public.event_ticket_offers where event_revision_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2'),
  0,
  'anonymous readers cannot see draft ticket offers'
);
reset role;

delete from public.event_ticket_offers where event_revision_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2';
delete from public.event_revisions where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2';

insert into public.event_revisions (
  id, event_id, created_by, status, title, description, event_type
) values
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    '33333333-3333-4333-8333-333333333333',
    'in_review', 'Locked review', 'Review content is locked.', 'performance'
  ),
  (
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4',
    'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
    '33333333-3333-4333-8333-333333333333',
    'superseded', 'Locked history', 'Historical content is locked.', 'performance'
  );

select throws_ok(
  $$insert into public.event_ticket_offers (event_revision_id, price_type, currency, amount_minor) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3', 'fixed', 'JPY', 1000)$$,
  'P0001',
  'event revision content is immutable in status in_review',
  'in-review revisions reject ticket offer inserts'
);

select throws_ok(
  $$insert into public.event_ticket_offers (event_revision_id, price_type, currency, amount_minor) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4', 'fixed', 'JPY', 1000)$$,
  'P0001',
  'event revision content is immutable in status superseded',
  'superseded revisions reject ticket offer inserts'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select lives_ok(
  $$select public.create_event_revision_draft('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee')$$,
  'an organization member can copy published offers into a new draft'
);
reset role;

select is(
  (
    select count(*)::integer
    from public.event_ticket_offers offer
    join public.event_revisions revision on revision.id = offer.event_revision_id
    where revision.event_id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
      and revision.status = 'draft'
  ),
  5,
  'post-publication draft contains every published offer'
);

select throws_ok(
  $$insert into public.event_ticket_offers (event_revision_id, price_type, currency, amount_minor, display_order) values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'fixed', 'JPY', 3500, 8)$$,
  'P0001',
  'event revision content is immutable in status approved',
  'approved offers reject inserts as well as updates'
);

select * from finish();
rollback;
