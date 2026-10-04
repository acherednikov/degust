export interface User {
  id: string;
  displayName: string;
  accessToken: string;
}

export interface LoginResponse {
  user: User;
  access_token: string;
}

export interface JwtPayload {
  sub: string;
  name: string;
  exp: number;
  iat: number;
}
