/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */
import type { OpenAPIObject } from '@nestjs/swagger';
type SchemaObject = Record<string, unknown>;
type JsonSchema = SchemaObject & { required?: string[] };
const object = (properties: Record<string, SchemaObject>, required: string[] = []): JsonSchema => ({
  type: 'object',
  properties,
  ...(required.length ? { required } : {}),
});
const str = (format?: string): SchemaObject => ({ type: 'string', ...(format ? { format } : {}) });
const integer = (minimum?: number): SchemaObject => ({
  type: 'integer',
  ...(minimum === undefined ? {} : { minimum }),
});
const schemas: Record<string, JsonSchema> = {
  CreateSourceDto: object(
    {
      title: str(),
      author: str(),
      publisher: str(),
      publicationDate: str('date-time'),
      url: str('uri'),
      isbn: str(),
      notes: str(),
    },
    ['title'],
  ),
  UpdateSourceDto: object({
    title: str(),
    author: str(),
    publisher: str(),
    publicationDate: str('date-time'),
    url: str('uri'),
    isbn: str(),
    notes: str(),
  }),
  CreateClaimDto: object({ workId: str('uuid'), statement: str(), classification: str() }, [
    'workId',
    'statement',
  ]),
  ReviewClaimDto: object(
    {
      classification: str(),
      status: { type: 'string', enum: ['VERIFIED', 'DISPUTED', 'REJECTED'] },
      reviewNote: str(),
    },
    ['status'],
  ),
  LinkSourceDto: object({ sourceId: str('uuid'), locator: str() }, ['sourceId']),
  CreateRightsDto: object(
    {
      workId: str('uuid'),
      basis: str(),
      territory: str(),
      evidenceUrl: str('uri'),
      startsAt: str('date-time'),
      expiresAt: str('date-time'),
      notes: str(),
    },
    ['workId', 'basis'],
  ),
  UpdateRightsDto: object({
    basis: str(),
    territory: str(),
    status: { type: 'string', enum: ['PENDING', 'CLEARED', 'RESTRICTED', 'EXPIRED'] },
    evidenceUrl: str('uri'),
    expiresAt: str('date-time'),
    notes: str(),
  }),
  StartWorkflowDto: object(
    { workId: str('uuid'), workVersionId: str('uuid'), assigneeId: str('uuid') },
    ['workId', 'workVersionId'],
  ),
  WorkflowActionDto: object(
    {
      action: { type: 'string', enum: ['APPROVE', 'REQUEST_CHANGES', 'TRANSITION'] },
      toStage: {
        type: 'string',
        enum: ['RESEARCH_REVIEW', 'EDITORIAL_REVIEW', 'RIGHTS_REVIEW', 'APPROVED'],
      },
      reason: str(),
    },
    ['action'],
  ),
  ScheduleDto: object({ publishAt: str('date-time') }, ['publishAt']),
  AddCartItemDto: object({ productId: str('uuid'), quantity: integer(1) }, [
    'productId',
    'quantity',
  ]),
  UpdateQuantityDto: object({ quantity: integer(1) }, ['quantity']),
  CouponCodeDto: object({ code: str() }, ['code']),
  CreateProductDto: object(
    { workId: str('uuid'), name: str(), description: str(), status: { type: 'string' } },
    ['name'],
  ),
  UpdateProductDto: object({
    workId: str('uuid'),
    name: str(),
    description: str(),
    status: { type: 'string' },
  }),
  CreatePriceDto: object(
    {
      amountMinor: integer(0),
      currency: str(),
      startsAt: str('date-time'),
      endsAt: str('date-time'),
    },
    ['amountMinor', 'currency', 'startsAt'],
  ),
  CreateBundleDto: object(
    { name: str(), description: str(), productIds: { type: 'array', items: str('uuid') } },
    ['name', 'productIds'],
  ),
  CreateCouponDto: object(
    {
      code: str(),
      type: { type: 'string' },
      value: integer(0),
      currency: str(),
      startsAt: str('date-time'),
      expiresAt: str('date-time'),
    },
    ['code', 'type', 'value', 'startsAt'],
  ),
  InitiatePaymentDto: object({ orderId: str('uuid') }, ['orderId']),
  ReturnDto: object({ paymentId: str('uuid'), udf1: str(), transactionId: str(), txnid: str() }),
  PayuWebhookDto: object(
    {
      eventId: str(),
      paymentId: str('uuid'),
      transactionId: str(),
      amountMinor: integer(0),
      currency: str(),
      status: { type: 'string' },
    },
    ['eventId', 'paymentId', 'transactionId', 'amountMinor', 'currency', 'status'],
  ),
  RefundWebhookDto: object(
    { eventId: str(), refundId: str('uuid'), providerRefundId: str(), status: { type: 'string' } },
    ['eventId', 'refundId', 'providerRefundId', 'status'],
  ),
  RefundRequestDto: object({ reason: str(), amountMinor: integer(1) }, ['reason']),
  RefundDecisionDto: object({ reason: str() }, ['reason']),
  ProgressDto: object({ percent: integer(0), positionSeconds: integer(0), format: str() }, [
    'percent',
  ]),
  GrantEntitlementDto: object(
    { userId: str('uuid'), workId: str('uuid'), reason: str(), expiresAt: str('date-time') },
    ['userId', 'workId', 'reason'],
  ),
  RevokeEntitlementDto: object({ reason: str() }, ['reason']),
  StorageWebhookDto: object(
    { eventId: str(), objectKey: str(), status: str(), metadata: { type: 'object' } },
    ['eventId'],
  ),
  EmailWebhookDto: object(
    { eventId: str(), messageId: str(), status: str(), metadata: { type: 'object' } },
    ['eventId'],
  ),
  CheckoutOrderDto: object({ cartId: str('uuid') }, ['cartId']),
};
function optionalParameter(doc: OpenAPIObject, path: string, method: string, name: string) {
  const op = (doc.paths[path] as any)?.[method];
  const p = op?.parameters?.find((x: any) => x.name === name);
  if (p) p.required = false;
}
function bodyRef(doc: OpenAPIObject, path: string, method: string, schema: string) {
  const op = (doc.paths[path] as any)?.[method];
  if (op)
    op.requestBody = {
      required: true,
      content: { 'application/json': { schema: { $ref: `#/components/schemas/${schema}` } } },
    };
}
export function applyApiContractOverrides(document: OpenAPIObject): OpenAPIObject {
  document.components ??= {};
  document.components.schemas ??= {};
  Object.assign(document.components.schemas, schemas);
  for (const name of ['user-agent', 'x-cart-token'])
    for (const [path, item] of Object.entries(document.paths))
      for (const method of Object.keys(item ?? {})) optionalParameter(document, path, method, name);
  for (const name of ['q', 'action', 'resourceType', 'resourceId', 'page', 'pageSize'])
    for (const [path, item] of Object.entries(document.paths))
      for (const method of Object.keys(item ?? {})) optionalParameter(document, path, method, name);
  bodyRef(document, '/api/v1/checkout/orders', 'post', 'CheckoutOrderDto');
  return document;
}
