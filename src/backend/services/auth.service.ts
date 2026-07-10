/**
 * Auth Service — Business logic for authentication.
 * Orchestrates repositories, JWT, password hashing, and OTP.
 * Never returns HTTP responses.
 */

import { UserRepository } from '../repositories/user.repository';
import { ProfileRepository } from '../repositories/profile.repository';
import { SessionRepository } from '../repositories/session.repository';
import { jwtService } from '../auth/jwt.service';
import { passwordService } from '../auth/password.service';
import { otpService } from '../auth/otp.service';
import { emailChannel } from '../notifications/channels/email.channel';
import { AppError } from '../utils/errors';

export class AuthService {
  constructor(
    private userRepo: UserRepository,
    private profileRepo: ProfileRepository,
    private sessionRepo: SessionRepository,
  ) {}

  async register(data: { email: string; password: string; full_name: string; callsign?: string }) {
    // Check for existing email
    const existing = await this.userRepo.findByEmail(data.email);
    if (existing) throw new AppError('EMAIL_EXISTS', 'Email already registered', 409);

    // Check for existing callsign
    if (data.callsign) {
      const existingCallsign = await this.userRepo.findByCallsign(data.callsign);
      if (existingCallsign) throw new AppError('CALLSIGN_TAKEN', 'Callsign already in use', 409);
    }

    // Hash password
    const passwordHash = await passwordService.hash(data.password);

    // Create user (unverified)
    const user = await this.userRepo.create({
      email: data.email,
      password_hash: passwordHash,
      full_name: data.full_name,
      callsign: data.callsign || null,
      status: 'unverified',
      role: 'member',
    });

    // Create empty profile
    await this.profileRepo.create({ user_id: user.id });

    // Generate and send OTP
    const otpCode = await otpService.generate(user.id);
    await emailChannel.send({
      to: data.email,
      subject: 'MIST — Verify Your Account',
      body: `Your verification code is: ${otpCode}`,
    });

    return {
      user_id: user.id,
      email: user.email,
      verification_required: true,
      otp_sent_to: data.email,
    };
  }

  async verifyOtp(data: { email: string; otp_code: string }) {
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) throw new AppError('INVALID_OTP', 'Invalid or expired OTP', 400);

    const isValid = await otpService.verify(user.id, data.otp_code);
    if (!isValid) throw new AppError('INVALID_OTP', 'Invalid or expired OTP', 400);

    // Activate user
    await this.userRepo.update(user.id, { status: 'active', email_verified: true });

    // Issue tokens
    const accessToken = await jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = await this.sessionRepo.create(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role },
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.userRepo.findByEmail(data.email);
    if (!user) throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);

    const valid = await passwordService.compare(data.password, user.password_hash);
    if (!valid) throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);

    if (user.status === 'unverified') {
      throw new AppError('ACCOUNT_UNVERIFIED', 'Account not verified — check email for OTP', 403);
    }
    if (user.status === 'suspended') {
      throw new AppError('ACCOUNT_SUSPENDED', 'Account suspended', 403);
    }

    await this.userRepo.updateLastActive(user.id);

    const accessToken = await jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    const refreshToken = await this.sessionRepo.create(user.id);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        callsign: user.callsign,
        role: user.role,
        avatar_url: user.avatar_url,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    const session = await this.sessionRepo.findByToken(refreshToken);
    if (!session || session.is_revoked || session.expires_at < new Date()) {
      throw new AppError('INVALID_REFRESH_TOKEN', 'Refresh token invalid or expired', 401);
    }

    const user = await this.userRepo.findById(session.user_id);
    if (!user) throw new AppError('INVALID_REFRESH_TOKEN', 'Refresh token invalid or expired', 401);

    const accessToken = await jwtService.sign({ sub: user.id, email: user.email, role: user.role });
    await this.sessionRepo.updateLastUsed(session.id);

    return { access_token: accessToken, expires_in: 900 };
  }

  async logout(refreshToken: string) {
    await this.sessionRepo.revoke(refreshToken);
  }

  async requestPasswordReset(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return; // Silent fail — don't reveal if email exists

    const resetToken = await otpService.generateResetToken(user.id);
    await emailChannel.send({
      to: email,
      subject: 'MIST — Password Reset',
      body: `Reset your password: https://mist.insomniacsgmrs.com/reset-password?token=${resetToken}`,
    });
  }

  async resetPassword(data: { reset_token: string; new_password: string }) {
    const userId = await otpService.verifyResetToken(data.reset_token);
    if (!userId) throw new AppError('INVALID_REFRESH_TOKEN', 'Reset token invalid or expired', 401);

    const passwordHash = await passwordService.hash(data.new_password);
    await this.userRepo.update(userId, { password_hash: passwordHash });
    await this.sessionRepo.revokeAllForUser(userId);
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new AppError('USER_NOT_FOUND', 'User not found', 404);
    return user;
  }

  async getOAuthUrl(provider: string) {
    // Delegate to OAuth service
    throw new AppError('NOT_IMPLEMENTED', 'OAuth not yet implemented', 501);
  }

  async handleOAuthCallback(provider: string, query: any) {
    throw new AppError('NOT_IMPLEMENTED', 'OAuth not yet implemented', 501);
  }
}