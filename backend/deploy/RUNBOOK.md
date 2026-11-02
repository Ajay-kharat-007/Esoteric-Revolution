# Production runbook

## Release

1. Back up PostgreSQL and complete a restore test.
2. Build the pinned production image and run `npm run quality`.
3. Run `prisma migrate deploy` as the one-shot migration service.
4. Start API and worker containers, then require `/health/ready` to pass.
5. Smoke-test login, catalogue, checkout, payment webhook, entitlement and learning.

## Rollback

Deploy the previous application image. Prisma migrations are forward-only: do not automatically reverse them. Restore a verified backup only after an approved incident decision.

## Alerts

- Page on readiness failure or sustained HTTP 5xx.
- Page on entitlement mismatch, failed outbox growth, payment failure spikes, expired cleared rights, database capacity, or backup failure.
- Inspect `/internal/metrics` only from the private network using `x-internal-key`.

## Recovery

Run `deploy/scripts/backup.sh` daily to encrypted off-server storage. Run `restore-test.sh` against the latest backup at least monthly and retain the checksum and result in the operations log.

## Secrets

Keep `.env.production`, TLS keys, database credentials, PayU secrets, internal keys, storage/email webhook secrets, and encryption keys outside Git. Rotate provider and internal keys after suspected exposure.
