import * as ms from 'ms'

export const COOKIE_CONFIG = {
  refreshToken: {
    name: 'refreshToken',
    options: {
      path: process.env.NODE_ENV === 'production' ? '/auth/refresh-token' : '/',
      httpOnly: true,
      sameSite: 'none' as const,
      secure: true,
      maxAge: ms(
        (process.env.REFRESH_TOKEN_EXPIRES_IN as ms.StringValue) || '30d'
      ),
    },
  },
  accessToken: {
    name: 'accessToken',
    options: {
      path: '/',
      httpOnly: true,
      sameSite: 'none' as const,
      secure: true,
      maxAge: ms(
        (process.env.ACCESS_TOKEN_EXPIRES_IN as ms.StringValue) || '1h'
      ),
    },
  },
}
