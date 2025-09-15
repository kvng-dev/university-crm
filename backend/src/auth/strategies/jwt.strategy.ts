// src/modules/auth/strategies/jwt.strategy.ts
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService, JwtPayload } from '../auth.service';
import { User } from '../../users/entities/user.entity';
import { jwtConfig } from 'src/config/jwt.config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.secret,
    });
    console.log(
      '🎯 JwtStrategy initialized with secret:',
      process.env.JWT_SECRET ||
        'your-super-secret-jwt-key-change-in-production',
    ); // Debug log
  }

  async validate(payload: JwtPayload): Promise<User> {
    console.log('✅ JwtStrategy validate called with payload:', payload);

    try {
      const user = await this.authService.validateJwtPayload(payload);
      console.log('👤 User found:', { id: user.id, email: user.email });
      return user;
    } catch (error) {
      console.error('❌ JWT validation error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
