// src/modules/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { Throttle } from '@nestjs/throttler';

import { AuthService, AuthResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';

import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { User } from '../users/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ short: { limit: 3, ttl: 60000 } }) // 3 requests per minute
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Omit<AuthResponse, 'refreshToken'>> {
    const authResult = await this.authService.register(registerDto);

    // Set refresh token as HTTP-only cookie
    response.cookie('refreshToken', authResult.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { refreshToken, ...result } = authResult;
    return result;
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ short: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Omit<AuthResponse, 'refreshToken'>> {
    const authResult = await this.authService.login(loginDto);

    // Set refresh token as HTTP-only cookie
    response.cookie('refreshToken', authResult.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { refreshToken, ...result } = authResult;
    return result;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(
    @Req() request: Request,
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<Omit<AuthResponse, 'refreshToken'>> {
    // Try to get refresh token from cookie first, then from body
    const refreshToken =
      request.cookies?.refreshToken || refreshTokenDto.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const authResult = await this.authService.refreshToken(refreshToken);

    // Set new refresh token as HTTP-only cookie
    response.cookie('refreshToken', authResult.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    const { refreshToken: newRefreshToken, ...result } = authResult;
    return result;
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    response.clearCookie('refreshToken');
    return { message: 'Logged out successfully' };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getProfile(@Req() request: Request): Promise<User> {
    return request.user as User;
  }

  @Get('debug-jwt')
  async debugJwt(@Req() request: Request): Promise<any> {
    console.log('🔍 All headers:', request.headers);
    console.log('🔍 Authorization header:', request.headers.authorization);

    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return {
        error: 'No Authorization header found',
        receivedHeaders: Object.keys(request.headers),
        allHeaders: request.headers,
      };
    }

    if (!authHeader.startsWith('Bearer ')) {
      return {
        error: 'Authorization header does not start with Bearer',
        authHeader: authHeader,
      };
    }

    const token = authHeader.substring(7);
    console.log('🔍 Extracted token:', token.substring(0, 50) + '...');

    try {
      const jwt = require('jsonwebtoken');
      const currentSecret =
        process.env.JWT_SECRET ||
        'your-super-secret-jwt-key-change-in-production-minimum-32-characters';

      const decoded = jwt.verify(token, currentSecret);
      return {
        success: true,
        decoded,
        message: 'Token verified successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        tokenLength: token.length,
      };
    }
  }

  @Get('test-token')
  async testToken(@Req() request: Request): Promise<any> {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return { error: 'No auth header' };
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const jwt = require('jsonwebtoken');
      const secret =
        process.env.JWT_SECRET ||
        'your-super-secret-jwt-key-change-in-production-minimum-32-characters';

      console.log(
        'Testing token with secret:',
        secret.substring(0, 20) + '...',
      );
      const decoded = jwt.verify(token, secret);
      console.log('Token decoded successfully:', decoded);

      return { success: true, decoded };
    } catch (error) {
      console.log('Token verification failed:', error.message);
      return { error: error.message };
    }
  }
}
