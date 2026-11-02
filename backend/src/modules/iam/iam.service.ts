import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { ConsentAction, OtpPurpose, UserStatus } from '../../generated/prisma/enums';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PasswordService } from './password.service';
import type {
  DevelopmentAdminDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  UpdateMeDto,
} from './iam.dto';
@Injectable()
export class IamService {
  constructor(
    private readonly db: PrismaService,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}
  private hashToken(v: string) {
    return createHash('sha256')
      .update(v + this.config.getOrThrow<string>('auth.refreshPepper'))
      .digest('hex');
  }
  private async otp(userId: string | null, destination: string, purpose: OtpPurpose) {
    const code = randomInt(100000, 1000000).toString();
    const row = await this.db.otpChallenge.create({
      data: {
        userId,
        destination,
        purpose,
        codeHash: this.hashToken(code),
        expiresAt: new Date(
          Date.now() + this.config.getOrThrow<number>('auth.otpTtlMinutes') * 60000,
        ),
      },
    });
    return {
      challengeId: row.id,
      expiresAt: row.expiresAt,
      ...(this.config.get('app.environment') === 'production' ? {} : { developmentOtp: code }),
    };
  }
  private async tokens(
    user: { id: string },
    meta?: { userAgent?: string; ipAddress?: string },
    familyId: string = randomUUID(),
  ) {
    const refreshToken = randomBytes(48).toString('base64url');
    const session = await this.db.authSession.create({
      data: {
        userId: user.id,
        familyId,
        tokenHash: this.hashToken(refreshToken),
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
        expiresAt: new Date(
          Date.now() + this.config.getOrThrow<number>('auth.refreshTtlDays') * 86400000,
        ),
      },
    });
    const roles = (
      await this.db.userRole.findMany({ where: { userId: user.id }, include: { role: true } })
    ).map((x) => x.role.code);
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, sid: session.id, roles },
      {
        secret: this.config.getOrThrow<string>('auth.accessSecret'),
        expiresIn: this.config.getOrThrow<string>('auth.accessTtl') as never,
      },
    );
    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.getOrThrow<string>('auth.accessTtl'),
    };
  }
  async register(dto: RegisterDto) {
    if (!dto.email && !dto.phone) throw new BadRequestException('Email or phone is required');
    const destination = (dto.email?.toLowerCase() ?? dto.phone)!;
    const exists = await this.db.user.findFirst({
      where: {
        OR: [
          dto.email ? { email: dto.email.toLowerCase() } : undefined,
          dto.phone ? { phone: dto.phone } : undefined,
        ].filter(Boolean) as never,
      },
    });
    if (exists) throw new ConflictException('Account already exists');
    const learner = await this.db.role.findUniqueOrThrow({ where: { code: 'learner' } });
    const user = await this.db.user.create({
      data: {
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        passwordHash: await this.passwords.hash(dto.password),
        profile: { create: { displayName: dto.displayName } },
        roles: { create: { roleId: learner.id } },
      },
    });
    return this.otp(user.id, destination, OtpPurpose.REGISTRATION);
  }
  async developmentAdmin(dto: DevelopmentAdminDto) {
    if (this.config.get('app.environment') === 'production') throw new NotFoundException();
    const roles = await this.db.role.findMany({
      where: { code: 'admin' },
      select: { id: true, code: true },
    });
    const user = await this.db.user.upsert({
      where: { email: dto.email.toLowerCase() },
      update: {
        passwordHash: await this.passwords.hash(dto.password),
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        profile: {
          upsert: {
            create: { displayName: dto.displayName },
            update: { displayName: dto.displayName },
          },
        },
      },
      create: {
        email: dto.email.toLowerCase(),
        passwordHash: await this.passwords.hash(dto.password),
        status: UserStatus.ACTIVE,
        emailVerifiedAt: new Date(),
        profile: { create: { displayName: dto.displayName } },
      },
    });
    await this.db.userRole.createMany({
      data: roles.map((role) => ({ userId: user.id, roleId: role.id })),
      skipDuplicates: true,
    });
    return { created: true, email: user.email, roles: roles.map((role) => role.code) };
  }
  async verifyOtp(
    challengeId: string,
    code: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ) {
    const c = await this.db.otpChallenge.findUnique({ where: { id: challengeId } });
    if (!c || c.consumedAt || c.expiresAt < new Date() || c.attempts >= 5)
      throw new BadRequestException('OTP is invalid or expired');
    if (this.hashToken(code) !== c.codeHash) {
      await this.db.otpChallenge.update({
        where: { id: c.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('OTP is invalid or expired');
    }
    await this.db.otpChallenge.update({ where: { id: c.id }, data: { consumedAt: new Date() } });
    if (!c.userId) throw new BadRequestException('OTP has no account');
    const user = await this.db.user.update({
      where: { id: c.userId },
      data: {
        status: UserStatus.ACTIVE,
        email: c.destination.includes('@') ? c.destination : undefined,
        emailVerifiedAt: c.destination.includes('@') ? new Date() : undefined,
        phone: !c.destination.includes('@') ? c.destination : undefined,
        phoneVerifiedAt: !c.destination.includes('@') ? new Date() : undefined,
      },
    });
    return this.tokens(user, meta);
  }
  async resend(challengeId: string) {
    const c = await this.db.otpChallenge.findUnique({ where: { id: challengeId } });
    if (!c || c.consumedAt || c.expiresAt < new Date())
      throw new BadRequestException('Challenge is invalid or expired');
    return this.otp(c.userId, c.destination, c.purpose);
  }
  async login(dto: LoginDto, meta?: { userAgent?: string; ipAddress?: string }) {
    const id = dto.identifier.toLowerCase();
    const user = await this.db.user.findFirst({
      where: { OR: [{ email: id }, { phone: dto.identifier }] },
    });
    if (
      !user?.passwordHash ||
      user.status !== UserStatus.ACTIVE ||
      !(await this.passwords.verify(dto.password, user.passwordHash))
    )
      throw new UnauthorizedException('Invalid credentials');
    return this.tokens(user, meta);
  }
  async requestLoginOtp(identifier: string) {
    const id = identifier.toLowerCase();
    const user = await this.db.user.findFirst({
      where: { OR: [{ email: id }, { phone: identifier }], status: UserStatus.ACTIVE },
    });
    if (!user) return { accepted: true };
    return { accepted: true, ...(await this.otp(user.id, identifier, OtpPurpose.LOGIN)) };
  }
  async refresh(token: string, meta?: { userAgent?: string; ipAddress?: string }) {
    const hash = this.hashToken(token);
    const session = await this.db.authSession.findUnique({ where: { tokenHash: hash } });
    if (!session) throw new UnauthorizedException('Invalid refresh token');
    if (session.revokedAt) {
      await this.db.authSession.updateMany({
        where: { familyId: session.familyId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (session.expiresAt < new Date()) throw new UnauthorizedException('Refresh token expired');
    await this.db.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date(), lastUsedAt: new Date() },
    });
    return this.tokens({ id: session.userId }, meta, session.familyId);
  }
  async logout(userId: string, sessionId: string) {
    await this.db.authSession.updateMany({
      where: { id: sessionId, userId },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }
  async logoutAll(userId: string) {
    await this.db.authSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }
  async sessions(userId: string) {
    return this.db.authSession.findMany({
      where: { userId, revokedAt: null },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
        expiresAt: true,
      },
    });
  }
  async revokeSession(userId: string, id: string) {
    const result = await this.db.authSession.updateMany({
      where: { id, userId },
      data: { revokedAt: new Date() },
    });
    if (!result.count) throw new NotFoundException('Session not found');
    return { success: true };
  }
  async forgot(identifier: string) {
    const id = identifier.toLowerCase();
    const user = await this.db.user.findFirst({
      where: { OR: [{ email: id }, { phone: identifier }] },
    });
    if (!user) return { accepted: true };
    const raw = randomBytes(32).toString('base64url');
    await this.db.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(raw),
        expiresAt: new Date(Date.now() + 15 * 60000),
      },
    });
    return {
      accepted: true,
      ...(this.config.get('app.environment') === 'production'
        ? {}
        : { developmentResetToken: raw }),
    };
  }
  async reset(dto: ResetPasswordDto) {
    const row = await this.db.passwordResetToken.findUnique({
      where: { tokenHash: this.hashToken(dto.token) },
    });
    if (!row || row.consumedAt || row.expiresAt < new Date())
      throw new BadRequestException('Reset token is invalid or expired');
    await this.db.$transaction([
      this.db.user.update({
        where: { id: row.userId },
        data: { passwordHash: await this.passwords.hash(dto.password) },
      }),
      this.db.passwordResetToken.update({
        where: { id: row.id },
        data: { consumedAt: new Date() },
      }),
      ...(dto.revokeAllSessions !== false
        ? [
            this.db.authSession.updateMany({
              where: { userId: row.userId, revokedAt: null },
              data: { revokedAt: new Date() },
            }),
          ]
        : []),
    ]);
    return { success: true };
  }
  me(userId: string) {
    return this.db.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        profile: true,
        roles: { select: { role: { select: { code: true } } } },
      },
    });
  }
  updateMe(userId: string, dto: UpdateMeDto) {
    return this.db.userProfile.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
  }
  preferences(userId: string, preferences: Record<string, unknown>) {
    return this.db.userProfile.upsert({
      where: { userId },
      update: { preferences: preferences as Prisma.InputJsonValue },
      create: { userId, preferences: preferences as Prisma.InputJsonValue },
    });
  }
  consents(userId: string) {
    return this.db.userConsent.findMany({
      where: { userId },
      include: { consentType: true },
      orderBy: { createdAt: 'desc' },
    });
  }
  async consent(userId: string, code: string, granted: boolean) {
    const type = await this.db.consentType.findUnique({ where: { code } });
    if (!type) throw new NotFoundException('Consent type not found');
    if (type.required && !granted)
      throw new BadRequestException('Required consent cannot be withdrawn');
    return this.db.userConsent.create({
      data: {
        userId,
        consentCode: code,
        version: type.version,
        action: granted ? ConsentAction.GRANTED : ConsentAction.WITHDRAWN,
      },
    });
  }
  deletion(userId: string, reason?: string) {
    return this.db.deletionRequest.create({ data: { userId, reason } });
  }
}
