'use strict';

import express from 'express';
import { auth } from './auth.middleware';
import { validation } from './auth.validation';
import { auth as controller } from './auth.controller';

const router = express.Router();

router.post('/register', validation.register, controller.register);
router.post('/verify', controller.verify);
router.post('/login', auth.checkVerify, controller.login);
router.post('/logout', auth.checkToken, controller.logout);
router.post(
  '/refresh-token',
  auth.checkExpiredToken,
  auth.checkRefreshToken,
  controller.refresh
);
router.post('/forgot-password', controller.forgot);
router.post('/reset-password', controller.reset);

router.post('/verify-otp', controller.verifyOtp);

export default router;
