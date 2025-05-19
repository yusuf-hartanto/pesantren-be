'use strict';

import express from 'express';
import { global } from './global.controller';
import { auth } from '../auth/auth.middleware';

const router = express.Router();

router.get('/', global.index);
router.get('/health', global.health);
router.post('/sendmail', global.sendmail);
router.post('/sendtele', global.sendtele);
router.get('/navigation', auth.checkToken, global.navigation);

export default router;
