import * as ms from 'ms'

export const COOKIE_CONFIG = {
  refreshToken: {
    name: 'refreshToken',
    options: {
      path: '/',
      httpOnly: false,
      sameSite: 'none' as const,
      secure: true,
      maxAge: ms(
        (process.env.REFRESH_TOKEN_EXPIRES_IN as ms.StringValue) || '30d'
      ),
      domain: process.env.NODE_ENV === 'production' ? 'mutari.id' : 'localhost',
    },
  },
  accessToken: {
    name: 'accessToken',
    options: {
      path: '/',
      httpOnly: false,
      sameSite: 'none' as const,
      secure: true,
      maxAge: ms(
        (process.env.ACCESS_TOKEN_EXPIRES_IN as ms.StringValue) || '1h'
      ),
      domain: process.env.NODE_ENV === 'production' ? 'mutari.id' : 'localhost',
    },
  },
}
