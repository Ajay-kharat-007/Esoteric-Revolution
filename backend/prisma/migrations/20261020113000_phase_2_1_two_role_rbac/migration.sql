-- Phase 2.1: normalize platform accounts to exactly two roles.
INSERT INTO "roles" ("id", "code", "name")
SELECT gen_random_uuid(), 'admin', 'Admin'
WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "code" = 'admin');

INSERT INTO "roles" ("id", "code", "name")
SELECT gen_random_uuid(), 'learner', 'Learner'
WHERE NOT EXISTS (SELECT 1 FROM "roles" WHERE "code" = 'learner');

-- Any account that previously held an operational role becomes Admin.
INSERT INTO "user_roles" ("user_id", "role_id", "assigned_at")
SELECT DISTINCT ur."user_id", admin_role."id", CURRENT_TIMESTAMP
FROM "user_roles" ur
JOIN "roles" old_role ON old_role."id" = ur."role_id"
CROSS JOIN "roles" admin_role
WHERE admin_role."code" = 'admin'
  AND old_role."code" NOT IN ('admin', 'learner')
ON CONFLICT ("user_id", "role_id") DO NOTHING;

-- Accounts with Admin must not also retain Learner.
DELETE FROM "user_roles" learner_link
USING "roles" learner_role
WHERE learner_link."role_id" = learner_role."id"
  AND learner_role."code" = 'learner'
  AND EXISTS (
    SELECT 1 FROM "user_roles" admin_link
    JOIN "roles" admin_role ON admin_role."id" = admin_link."role_id"
    WHERE admin_link."user_id" = learner_link."user_id" AND admin_role."code" = 'admin'
  );

-- Remove all links to legacy roles, then remove the roles themselves.
DELETE FROM "user_roles" ur USING "roles" r
WHERE ur."role_id" = r."id" AND r."code" NOT IN ('admin', 'learner');
DELETE FROM "role_permissions" rp USING "roles" r
WHERE rp."role_id" = r."id" AND r."code" NOT IN ('admin', 'learner');
DELETE FROM "roles" WHERE "code" NOT IN ('admin', 'learner');

-- Existing role-less users become Learners.
INSERT INTO "user_roles" ("user_id", "role_id", "assigned_at")
SELECT u."id", learner_role."id", CURRENT_TIMESTAMP
FROM "users" u CROSS JOIN "roles" learner_role
WHERE learner_role."code" = 'learner'
  AND NOT EXISTS (SELECT 1 FROM "user_roles" ur WHERE ur."user_id" = u."id");

-- Exactly one role assignment per user.
CREATE UNIQUE INDEX IF NOT EXISTS "user_roles_one_role_per_user_key" ON "user_roles" ("user_id");
