// src/config/jwt.config.ts
export const jwtConfig = {
  secret:
    process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  signOptions: {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
};

export const jwtRefreshConfig = {
  secret:
    process.env.JWT_REFRESH_SECRET ||
    'your-super-secret-refresh-key-change-in-production',
  signOptions: {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
};
