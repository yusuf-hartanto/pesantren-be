'use strict';

import { Router } from 'express';
import apps from './module/app/app.routes';
import exception from './helpers/exception';
import auth from './module/auth/auth.routes';
import global from './module/global/global.routes';
import insurance from './module/insurance/insurance.routes';

const router: Router = Router();

router.use('/', global);
router.use('/auth', auth);
router.use('/app', apps);
router.use('/insurance', insurance);
router.use(exception);

export default router;
