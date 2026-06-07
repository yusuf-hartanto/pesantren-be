declare namespace Express {
  interface Request {
    user?: any;
    files?: any;
    rawBody?: Buffer;
  }
}
declare module 'express-xss-sanitizer';
