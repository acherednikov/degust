export interface AuthUser {
  displayName: string;
}

export interface JwtPayload {
  sub: string;
  name: string;
  exp: number;
  iat: number;
}
