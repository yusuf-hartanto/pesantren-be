declare namespace Express {
  interface Request {
    user?: any;
    files?: any;
  }
}
declare module 'express-xss-sanitizer';
