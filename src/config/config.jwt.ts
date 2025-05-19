'use strict';

interface JWTConfig {
  secret: string;
  expiresIn: number;
  secretRefresh: string;
  expiresInRefresh: number;
}

let jwtConfig: JWTConfig;

export function initializeJWT(data: any) {
  if (jwtConfig) return jwtConfig;

  jwtConfig = {
    secret: data?.secret || 'token',
    expiresIn: data?.expiresIn || 3600,
    secretRefresh: data?.secretRefresh || 'refresh',
    expiresInRefresh: data?.expiresInRefresh || 86400,
  };

  return jwtConfig;
}

export { jwtConfig };
