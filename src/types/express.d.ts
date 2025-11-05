import 'express';
import { SessionUser } from './session';

declare module 'express' {
  interface Request {
    user?: SessionUser;
    accessToken?: string;
  }
}

