import 'dotenv/config';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const testerDir = process.env.TESTER_DIR;
if (!testerDir) throw new Error('TESTER_DIR is required');
const tag = 'api-full-fixture';

async function main() {
  const admin = await db.user.findUnique({ where: { email: 'api-admin@example.test' } });
  const learner = await db.user.findUnique({ where: { email: 'api-learner@example.test' } });
  if (!admin || !learner)
    throw new Error('Run create-api-test-users.ts first. Admin or learner test user is missing.');

  const language = await db.language.upsert({
    where: { code: 'en' },
    update: { isActive: true },
    create: { code: 'en', name: 'English', nativeName: 'English', isActive: true },
  });
  const category = await db.category.upsert({
    where: { slug: `${tag}-category` },
    update: { isPublished: true },
    create: {
      slug: `${tag}-category`,
      name: 'API Full Test Category',
      description: tag,
      isPublished: true,
    },
  });
  const topic = await db.topic.upsert({
    where: { slug: `${tag}-topic` },
    update: { isPublished: true },
    create: {
      slug: `${tag}-topic`,
      name: 'API Full Test Topic',
      description: tag,
      isPublished: true,
    },
  });
  const person = await db.person.upsert({
    where: { slug: `${tag}-person` },
    update: { isPublic: true },
    create: {
      slug: `${tag}-person`,
      displayName: 'API Test Contributor',
      biography: tag,
      isPublic: true,
    },
  });

  let work = await db.work.findUnique({ where: { slug: `${tag}-work` } });
  if (!work)
    work = await db.work.create({
      data: { slug: `${tag}-work`, languageId: language.id, status: 'DRAFT' as any },
    });
  let version = await db.workVersion.findUnique({
    where: { workId_version: { workId: work.id, version: 1 } },
  });
  if (!version)
    version = await db.workVersion.create({
      data: {
        workId: work.id,
        version: 1,
        title: 'API Full Test Work',
        summary: 'Stable fixture for complete API testing.',
        description: tag,
        content: { blocks: [{ type: 'paragraph', text: 'Fixture content' }] },
        preview: { text: 'Fixture preview' },
        references: [{ title: 'Fixture Reference' }],
        searchText: 'api full fixture work',
      } as any,
    });
  work = await db.work.update({
    where: { id: work.id },
    data: { status: 'PUBLISHED' as any, publishedVersionId: version.id, publishedAt: new Date() },
  });
  await db.workCategory.upsert({
    where: { workId_categoryId: { workId: work.id, categoryId: category.id } },
    update: {},
    create: { workId: work.id, categoryId: category.id },
  });
  await db.workTopic.upsert({
    where: { workId_topicId: { workId: work.id, topicId: topic.id } },
    update: {},
    create: { workId: work.id, topicId: topic.id },
  });
  await db.workPerson.upsert({
    where: {
      workId_personId_role: { workId: work.id, personId: person.id, role: 'AUTHOR' as any },
    },
    update: {},
    create: { workId: work.id, personId: person.id, role: 'AUTHOR' as any, position: 1 },
  });

  let module = await db.contentModule.findFirst({ where: { workId: work.id, position: 1 } });
  if (!module)
    module = await db.contentModule.create({
      data: { workId: work.id, title: 'Fixture Module', summary: tag, position: 1 },
    });
  let lesson = await db.lesson.findFirst({ where: { moduleId: module.id, slug: `${tag}-lesson` } });
  if (!lesson)
    lesson = await db.lesson.create({
      data: {
        moduleId: module.id,
        slug: `${tag}-lesson`,
        title: 'Fixture Lesson',
        summary: tag,
        position: 1,
      },
    });
  let lessonVersion = await db.lessonVersion.findUnique({
    where: { lessonId_version: { lessonId: lesson.id, version: 1 } },
  });
  if (!lessonVersion)
    lessonVersion = await db.lessonVersion.create({
      data: {
        lessonId: lesson.id,
        version: 1,
        content: { blocks: [{ type: 'paragraph', text: 'Fixture lesson content' }] },
        transcript: 'Fixture transcript',
        durationSeconds: 120,
      } as any,
    });
  lesson = await db.lesson.update({
    where: { id: lesson.id },
    data: { publishedVersionId: lessonVersion.id },
  });

  const learningPath = await db.learningPath.upsert({
    where: { slug: `${tag}-path` },
    update: { status: 'PUBLISHED' as any, publishedAt: new Date() },
    create: {
      slug: `${tag}-path`,
      title: 'Fixture Learning Path',
      summary: tag,
      description: tag,
      status: 'PUBLISHED' as any,
      publishedAt: new Date(),
    },
  });
  await db.learningPathItem.upsert({
    where: { pathId_workId: { pathId: learningPath.id, workId: work.id } },
    update: { position: 1 },
    create: { pathId: learningPath.id, workId: work.id, position: 1 },
  });
  const insight = await db.insight.upsert({
    where: { slug: `${tag}-insight` },
    update: { status: 'PUBLISHED' as any },
    create: {
      slug: `${tag}-insight`,
      title: 'Fixture Insight',
      excerpt: tag,
      body: { blocks: [{ text: 'Fixture insight' }] },
      status: 'PUBLISHED' as any,
      publishedAt: new Date(),
    } as any,
  });

  let product = await db.product.findFirst({
    where: { workId: work.id, name: 'API Full Test Product' },
  });
  if (!product)
    product = await db.product.create({
      data: {
        workId: work.id,
        name: 'API Full Test Product',
        description: tag,
        status: 'ACTIVE' as any,
      },
    });
  let price = await db.productPrice.findFirst({ where: { productId: product.id, endsAt: null } });
  if (!price)
    price = await db.productPrice.create({
      data: {
        productId: product.id,
        amountMinor: 19900n,
        currency: 'INR',
        startsAt: new Date(Date.now() - 60000),
      },
    });
  let bundle = await db.bundle.findFirst({ where: { name: 'API Full Test Bundle' } });
  if (!bundle)
    bundle = await db.bundle.create({
      data: { name: 'API Full Test Bundle', description: tag, status: 'ACTIVE' as any },
    });
  await db.bundleItem.upsert({
    where: { bundleId_productId: { bundleId: bundle.id, productId: product.id } },
    update: {},
    create: { bundleId: bundle.id, productId: product.id, position: 1 },
  });

  let cart = await db.cart.findFirst({ where: { userId: learner.id, status: 'ACTIVE' as any } });
  if (!cart)
    cart = await db.cart.create({
      data: {
        userId: learner.id,
        status: 'ACTIVE' as any,
        currency: 'INR',
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
  const cartItem = await db.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId: product.id } },
    update: { quantity: 1 },
    create: { cartId: cart.id, productId: product.id, quantity: 1 },
  });
  const entitlement = await db.entitlement.upsert({
    where: {
      userId_workId_sourceId: {
        userId: learner.id,
        workId: work.id,
        sourceId: `${tag}-entitlement`,
      },
    },
    update: { status: 'ACTIVE' as any, revokedAt: null },
    create: {
      userId: learner.id,
      workId: work.id,
      sourceType: 'ADMIN',
      sourceId: `${tag}-entitlement`,
      idempotencyKey: `${tag}-entitlement`,
      status: 'ACTIVE' as any,
    },
  });

  let quiz = await db.quiz.findFirst({
    where: { workId: work.id, lessonId: lesson.id, title: 'API Full Test Quiz' },
  });
  if (!quiz)
    quiz = await db.quiz.create({
      data: {
        workId: work.id,
        lessonId: lesson.id,
        title: 'API Full Test Quiz',
        description: tag,
        passingScore: 50,
        isActive: true,
      },
    });
  let question = await db.quizQuestion.findFirst({ where: { quizId: quiz.id, position: 1 } });
  if (!question)
    question = await db.quizQuestion.create({
      data: { quizId: quiz.id, prompt: 'Fixture question?', explanation: tag, position: 1 },
    });
  let option = await db.quizOption.findFirst({ where: { questionId: question.id, position: 1 } });
  if (!option)
    option = await db.quizOption.create({
      data: {
        questionId: question.id,
        text: 'Correct fixture option',
        isCorrect: true,
        position: 1,
      },
    });
  let attempt = await db.quizAttempt.findFirst({
    where: { userId: learner.id, quizId: quiz.id, status: 'IN_PROGRESS' as any },
  });
  if (!attempt)
    attempt = await db.quizAttempt.create({
      data: { userId: learner.id, quizId: quiz.id, status: 'IN_PROGRESS' as any },
    });

  let supportCase = await db.supportCase.findFirst({
    where: { requesterId: learner.id, subject: 'API Full Test Support' },
  });
  if (!supportCase)
    supportCase = await db.supportCase.create({
      data: {
        requesterId: learner.id,
        subject: 'API Full Test Support',
        message: tag,
        status: 'OPEN' as any,
      },
    });
  let contentReport = await db.contentReport.findFirst({
    where: { reporterId: learner.id, workId: work.id, reason: 'API_FULL_TEST' },
  });
  if (!contentReport)
    contentReport = await db.contentReport.create({
      data: {
        reporterId: learner.id,
        workId: work.id,
        reason: 'API_FULL_TEST',
        details: tag,
        status: 'OPEN' as any,
      },
    });
  let rights = await db.rightsRecord.findFirst({ where: { workId: work.id, notes: tag } });
  if (!rights)
    rights = await db.rightsRecord.create({
      data: {
        workId: work.id,
        basis: 'OWNED',
        territory: 'WORLDWIDE',
        status: 'CLEARED' as any,
        notes: tag,
      },
    });

  const manifest = {
    tag,
    adminId: admin.id,
    learnerId: learner.id,
    languageId: language.id,
    categoryId: category.id,
    categorySlug: category.slug,
    topicId: topic.id,
    topicSlug: topic.slug,
    personId: person.id,
    personSlug: person.slug,
    workId: work.id,
    workSlug: work.slug,
    workVersionId: version.id,
    moduleId: module.id,
    lessonId: lesson.id,
    lessonSlug: lesson.slug,
    lessonVersionId: lessonVersion.id,
    learningPathId: learningPath.id,
    learningPathSlug: learningPath.slug,
    insightId: insight.id,
    insightSlug: insight.slug,
    productId: product.id,
    priceId: price.id,
    bundleId: bundle.id,
    cartId: cart.id,
    cartItemId: cartItem.id,
    entitlementId: entitlement.id,
    quizId: quiz.id,
    questionId: question.id,
    optionId: option.id,
    attemptId: attempt.id,
    supportCaseId: supportCase.id,
    contentReportId: contentReport.id,
    rightsId: rights.id,
  };
  writeFileSync(resolve(testerDir, 'fixture-manifest.json'), JSON.stringify(manifest, null, 2));

  const overrides: Record<string, unknown> = {
    'GET /api/v1/works/{slug}': { pathValues: { slug: work.slug } },
    'GET /api/v1/works/{slug}/preview': { pathValues: { slug: work.slug } },
    'GET /api/v1/works/{slug}/references': { pathValues: { slug: work.slug } },
    'GET /api/v1/learning-paths/{slug}': { pathValues: { slug: learningPath.slug } },
    'GET /api/v1/categories/{slug}': { pathValues: { slug: category.slug } },
    'GET /api/v1/topics/{slug}': { pathValues: { slug: topic.slug } },
    'GET /api/v1/people/{slug}': { pathValues: { slug: person.slug } },
    'GET /api/v1/search': { queryValues: { q: 'fixture' } },
    'GET /api/v1/insights/{slug}': { pathValues: { slug: insight.slug } },
    'GET /api/v1/admin/works/{id}': { pathValues: { id: work.id } },
    'GET /api/v1/admin/lessons/{id}': { pathValues: { id: lesson.id } },
    'GET /api/v1/admin/rights/preflight/{workId}': { pathValues: { workId: work.id } },
    'GET /api/v1/products/{id}': { pathValues: { id: product.id } },
    'GET /api/v1/bundles/{id}': { pathValues: { id: bundle.id } },
    'GET /api/v1/carts/{id}': { pathValues: { id: cart.id } },
    'GET /api/v1/learn/works/{workId}': { pathValues: { workId: work.id } },
    'GET /api/v1/learn/lessons/{lessonId}': { pathValues: { lessonId: lesson.id } },
    'GET /api/v1/learn/lessons/{lessonId}/media': { pathValues: { lessonId: lesson.id } },
    'GET /api/v1/learn/lessons/{lessonId}/transcript': { pathValues: { lessonId: lesson.id } },
    'GET /api/v1/quizzes/{quizId}': { pathValues: { quizId: quiz.id } },
    'GET /api/v1/quiz-attempts/{attemptId}/result': { pathValues: { attemptId: attempt.id } },
    'GET /api/v1/works/{workId}/ratings': { pathValues: { workId: work.id } },
    'GET /api/v1/admin/users/{id}': { pathValues: { id: learner.id } },
    'PATCH /api/v1/admin/works/{id}': { pathValues: { id: work.id }, body: { slug: work.slug } },
    'PATCH /api/v1/admin/rights/{id}': { pathValues: { id: rights.id }, body: { notes: tag } },
    'PATCH /api/v1/admin/support-cases/{id}': {
      pathValues: { id: supportCase.id },
      body: { status: 'ASSIGNED', assigneeId: admin.id },
    },
    'POST /api/v1/admin/content-reports/{id}/resolve': {
      pathValues: { id: contentReport.id },
      body: { status: 'RESOLVED', resolution: 'Resolved by full API fixture test' },
    },
    'POST /api/v1/checkout/quote': { body: { cartId: cart.id } },
  };
  writeFileSync(resolve(testerDir, 'request-overrides.json'), JSON.stringify(overrides, null, 2));
  console.log(JSON.stringify({ created: true, manifest }, null, 2));
}

main().finally(async () => db.$disconnect());
