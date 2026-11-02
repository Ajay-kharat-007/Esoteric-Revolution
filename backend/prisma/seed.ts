import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
async function main(): Promise<void> {
  await prisma.systemRecord.upsert({
    where: { key: 'foundation.seed' },
    update: { value: { version: 1 } },
    create: { key: 'foundation.seed', value: { version: 1 } },
  });
  const permissions = [
    ['profile.read', 'Read own profile'],
    ['profile.write', 'Update own profile'],
    ['learning.access', 'Access entitled learning'],
  ] as const;
  for (const [code, description] of permissions) {
    await prisma.permission.upsert({
      where: { code },
      update: { description },
      create: { code, description },
    });
  }
  const roles = ['learner', 'admin'];
  for (const code of roles) {
    await prisma.role.upsert({
      where: { code },
      update: {},
      create: { code, name: code.charAt(0).toUpperCase() + code.slice(1) },
    });
  }

  // Normalize the installation to exactly admin and learner.
  const existingUsers = await prisma.user.findMany({
    select: { id: true, roles: { select: { role: { select: { code: true } } } } },
  });
  for (const user of existingUsers) {
    const roleCodes = user.roles.map((entry) => entry.role.code);
    const targetCode = roleCodes.includes('admin') ? 'admin' : 'learner';
    const targetRole = await prisma.role.findUniqueOrThrow({ where: { code: targetCode } });
    await prisma.userRole.deleteMany({ where: { userId: user.id } });
    await prisma.userRole.create({ data: { userId: user.id, roleId: targetRole.id } });
  }
  await prisma.rolePermission.deleteMany({ where: { role: { code: { notIn: roles } } } });
  await prisma.role.deleteMany({ where: { code: { notIn: roles } } });
  await prisma.featureFlag.upsert({
    where: { key: 'learning.personal_knowledge' },
    update: {},
    create: {
      key: 'learning.personal_knowledge',
      description: 'Enable bookmarks, notes, reflections and assessments.',
      enabled: true,
    },
  });
  await prisma.featureFlag.upsert({
    where: { key: 'commerce.checkout' },
    update: {},
    create: {
      key: 'commerce.checkout',
      description: 'Enable checkout and payment initiation.',
      enabled: true,
    },
  });
  await prisma.consentType.upsert({
    where: { code: 'terms' },
    update: {},
    create: { code: 'terms', name: 'Terms of Service', required: true },
  });
  await prisma.consentType.upsert({
    where: { code: 'marketing' },
    update: {},
    create: { code: 'marketing', name: 'Marketing Communications' },
  });

  const english = await prisma.language.upsert({
    where: { code: 'en' },
    update: { isActive: true },
    create: { code: 'en', name: 'English', nativeName: 'English' },
  });
  const category = await prisma.category.upsert({
    where: { slug: 'foundations' },
    update: { isPublished: true },
    create: {
      slug: 'foundations',
      name: 'Foundations',
      description: 'Essential starting points.',
      isPublished: true,
    },
  });
  const topic = await prisma.topic.upsert({
    where: { slug: 'self-knowledge' },
    update: { isPublished: true },
    create: { slug: 'self-knowledge', name: 'Self Knowledge', isPublished: true },
  });
  const person = await prisma.person.upsert({
    where: { slug: 'esoteric-library-editorial' },
    update: { isPublic: true },
    create: {
      slug: 'esoteric-library-editorial',
      displayName: 'Esoteric Library Editorial',
      biography: 'The Esoteric Library editorial team.',
      isPublic: true,
    },
  });
  let work = await prisma.work.findUnique({ where: { slug: 'introduction-to-esoteric-study' } });
  if (!work) {
    work = await prisma.work.create({
      data: { slug: 'introduction-to-esoteric-study', languageId: english.id },
    });
    const version = await prisma.workVersion.create({
      data: {
        workId: work.id,
        version: 1,
        title: 'Introduction to Esoteric Study',
        subtitle: 'A responsible beginning',
        summary: 'A grounded introduction to the study of esoteric traditions.',
        description:
          'Learn how to approach primary sources, symbolism, and historical context responsibly.',
        preview: { blocks: [{ type: 'paragraph', text: 'Welcome to the Esoteric Library.' }] },
        references: [{ title: 'Editorial source register', type: 'internal' }],
        searchText: 'esoteric study symbolism history foundations',
      },
    });
    work = await prisma.work.update({
      where: { id: work.id },
      data: {
        status: 'PUBLISHED',
        publishedVersionId: version.id,
        publishedAt: new Date(),
        categories: { create: { categoryId: category.id } },
        topics: { create: { topicId: topic.id } },
        people: { create: { personId: person.id, role: 'AUTHOR' } },
      },
    });
  }
  await prisma.work.upsert({
    where: { slug: 'unpublished-catalogue-draft' },
    update: {},
    create: {
      slug: 'unpublished-catalogue-draft',
      languageId: english.id,
      versions: {
        create: { version: 1, title: 'Unpublished Draft', summary: 'This must never be public.' },
      },
    },
  });
  await prisma.learningPath.upsert({
    where: { slug: 'begin-here' },
    update: { status: 'PUBLISHED' },
    create: {
      slug: 'begin-here',
      title: 'Begin Here',
      summary: 'Start your learning journey.',
      status: 'PUBLISHED',
      publishedAt: new Date(),
      items: { create: { workId: work.id, position: 1 } },
    },
  });
  await prisma.insight.upsert({
    where: { slug: 'how-to-use-the-library' },
    update: { status: 'PUBLISHED' },
    create: {
      slug: 'how-to-use-the-library',
      title: 'How to Use the Library',
      excerpt: 'A short guide to responsible study.',
      body: { blocks: [{ type: 'paragraph', text: 'Follow sources and keep context in view.' }] },
      status: 'PUBLISHED',
      publishedAt: new Date(),
    },
  });
}
main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
