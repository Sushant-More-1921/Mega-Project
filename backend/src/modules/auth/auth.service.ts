import { prisma } from '../../config/database';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';

export class AuthService {
  public async register(data: { phoneNumber: string; name?: string }) {
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: data.phoneNumber },
    });

    if (existingUser) {
      const error: any = new Error('User already exists');
      error.statusCode = 409;
      error.code = 'USER_ALREADY_EXISTS';
      throw error;
    }

    const user = await prisma.user.create({
      data: {
        phoneNumber: data.phoneNumber,
        name: data.name,
      },
    });

    return { id: user.id };
  }

  public async login(phoneNumber: string) {
    const user = await prisma.user.findUnique({
      where: { phoneNumber },
    });

    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    // Usually we would verify OTP here. For now, generate JWT directly.
    const token = jwt.sign(
      { id: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
      },
    };
  }
}
