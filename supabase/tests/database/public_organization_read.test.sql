begin;

create extension if not exists pgtap with schema extensions;
grant usage on schema extensions to anon, authenticated;
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
    execute format('grant execute on function %s to anon, authenticated', assertion_function.signature);
  end loop;
end;
$$;

select plan(13);

-- The seed Organization 'aaaa…' publishes an Event; 'bbbb…' publishes nothing
-- and must stay invisible to a Visitor.
insert into public.events (id, owner_organization_id)
values ('eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');

insert into public.event_revisions (id, event_id, created_by, status, title, event_type)
values (
  'ffffffff-ffff-4fff-8fff-ffffffffffff',
  'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
  '11111111-1111-4111-8111-111111111111',
  'approved',
  'Published fixture event',
  'performance'
);

update public.events
  set published_revision_id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
  where id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';

-- Column privileges: anon reads the name and nothing else.
select ok(
  has_column_privilege('anon', 'public.organizations', 'name', 'SELECT'),
  'anonymous users can read the Organization name'
);
select ok(
  has_column_privilege('anon', 'public.organizations', 'id', 'SELECT'),
  'anonymous users can read the Organization id'
);
select ok(
  not has_column_privilege('anon', 'public.organizations', 'website_url', 'SELECT'),
  'anonymous users cannot read the Organization website URL'
);
select ok(
  not has_column_privilege('anon', 'public.organizations', 'created_at', 'SELECT'),
  'anonymous users cannot read when an Organization was created'
);
select ok(
  not has_table_privilege('anon', 'public.organizations', 'INSERT'),
  'anonymous users cannot create Organizations'
);
select ok(
  not has_table_privilege('anon', 'public.organizations', 'UPDATE'),
  'anonymous users cannot modify Organizations'
);
select ok(
  not has_table_privilege('anon', 'public.organizations', 'DELETE'),
  'anonymous users cannot delete Organizations'
);

set local role anon;

select is(
  (select count(*)::integer from public.organizations),
  1,
  'a Visitor sees only the Organization that has published an Event'
);
select is(
  (select name from public.organizations),
  'Fixture Dance Organization',
  'a Visitor reads the publishing Organization by name'
);
select is_empty(
  $$select id from public.organizations
      where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$,
  'a Visitor cannot read an Organization that has published nothing'
);
select throws_ok(
  $$select website_url from public.organizations$$,
  '42501',
  null,
  'a Visitor is refused the withheld Organization columns'
);

reset role;

-- 11111111 belongs to no Organization and is not a Platform Admin, so the new
-- policy is the only thing that can show it an Organization.
set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select is(
  (select name from public.organizations
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'),
  'Fixture Dance Organization',
  'a signed-in non-member reads the publishing Organization'
);
select is_empty(
  $$select id from public.organizations
      where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'$$,
  'a signed-in non-member cannot read an Organization that has published nothing'
);

reset role;

select * from finish();
rollback;
