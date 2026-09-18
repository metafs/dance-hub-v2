begin;

create extension if not exists pgtap with schema extensions;
grant usage on schema extensions to authenticated;
do $$
declare
  assertion_function record;
begin
  for assertion_function in
    select procedure.oid::regprocedure as signature
    from pg_catalog.pg_proc procedure
    join pg_catalog.pg_depend dependency
      on dependency.classid = 'pg_catalog.pg_proc'::regclass
      and dependency.objid = procedure.oid
      and dependency.deptype = 'e'
    join pg_catalog.pg_extension extension
      on extension.oid = dependency.refobjid
    where extension.extname = 'pgtap'
  loop
    execute format('grant execute on function %s to authenticated', assertion_function.signature);
  end loop;
end;
$$;

select plan(9);

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);

select ok(
  public.create_event_draft_with_content(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '{"title":"Atomic create","description":"Created as one aggregate","event_type":"performance","no_registration_required":false}',
    '{"artistId":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","artistRole":"出演","venueId":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","startsAt":"2030-04-01T10:00:00+09:00","endsAt":null,"allDay":false,"ticketOffers":[{"price_type":"fixed","label":"一般","currency":"JPY","amount_minor":"3000","min_amount_minor":null,"max_amount_minor":null,"notes":null,"display_order":0}],"imageObjectKey":"events/atomic-create.jpg","imageContentType":"image/jpeg","imageAlt":"Atomic create"}'
  ) is not null,
  'an authorized member creates a complete Event aggregate in one function call'
);

select is(
  (select count(*)::integer from public.event_revisions where title = 'Atomic create'),
  1,
  'atomic Event creation includes exactly one Revision'
);

select throws_ok(
  $$select public.create_event_draft_with_content(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    '{"title":"Atomic create rollback","event_type":"performance"}',
    '{"artistId":"88888888-8888-4888-8888-888888888888","artistRole":"出演","ticketOffers":[]}'
  )$$,
  '23503',
  null,
  'invalid related content aborts Event and Revision creation'
);

select is(
  (select count(*)::integer from public.events event join public.event_revisions revision on revision.event_id = event.id where event.owner_organization_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' and revision.title = 'Atomic create rollback'),
  0,
  'failed aggregate creation leaves no partial Event'
);

reset role;

insert into public.events (id, owner_organization_id)
values ('99999999-9999-4999-8999-999999999992', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
insert into public.event_revisions (id, event_id, created_by, title, description, event_type)
values (
  '99999999-9999-4999-8999-999999999993',
  '99999999-9999-4999-8999-999999999992',
  '33333333-3333-4333-8333-333333333333',
  'Original revision title', 'Original description', 'performance'
);
insert into public.event_artists (event_revision_id, artist_id, role, display_order)
values ('99999999-9999-4999-8999-999999999993', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', '出演', 0);

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);

select throws_ok(
  $$select id from public.save_event_revision_with_content(
    '99999999-9999-4999-8999-999999999992',
    '99999999-9999-4999-8999-999999999993',
    '{"title":"Must roll back","description":"New description","event_type":"performance"}',
    '{"artistId":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","artistRole":"出演","ticketOffers":[{"price_type":"fixed","label":"一般","currency":"JPY","amount_minor":"invalid","display_order":0}]}',
    false
  )$$,
  '22P02',
  null,
  'invalid replacement content aborts the entire Revision save'
);

select is(
  (select title from public.event_revisions where id = '99999999-9999-4999-8999-999999999993'),
  'Original revision title',
  'a failed content replacement rolls back the Revision field update'
);

select is(
  (select count(*)::integer from public.event_artists where event_revision_id = '99999999-9999-4999-8999-999999999993'),
  1,
  'a failed content replacement preserves the prior related rows'
);

select lives_ok(
  $$select id from public.save_event_revision_with_content(
    '99999999-9999-4999-8999-999999999992',
    '99999999-9999-4999-8999-999999999993',
    '{"title":"Saved atomically","description":"New description","event_type":"performance"}',
    '{"artistId":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","artistRole":"出演","ticketOffers":[]}',
    false
  )$$,
  'a valid Revision and content update succeeds together'
);

select is(
  (select title from public.event_revisions where id = '99999999-9999-4999-8999-999999999993'),
  'Saved atomically',
  'a successful save persists the Revision fields'
);

select * from finish();
rollback;
