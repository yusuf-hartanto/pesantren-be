'use strict';

import { Router } from 'express';
import { area } from './area.controller';

const router: Router = Router();

router.get('/province', area.province);
router.get('/regency', area.allRegency);
router.get('/regency/:id', area.regency);

export default router;
