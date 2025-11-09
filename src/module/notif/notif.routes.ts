'use strict';

import { Router } from 'express';
import { notif } from './notif.controller';
import { auth } from '../auth/auth.middleware';

const router: Router = Router();

router.get('/', auth.checkBearerToken, notif.index);
router.put('/:id', auth.checkBearerToken, notif.read);

export default router;
