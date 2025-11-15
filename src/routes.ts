'use strict';

import { Router } from 'express';
import apps from './module/app/app.routes';
import exception from './helpers/exception';
import auth from './module/auth/auth.routes';
import area from './module/area/area.routes';
import global from './module/global/global.routes';
import notif from './module/notif/notif.routes';

const router: Router = Router();

router.use('/', global);
router.use('/auth', auth);
router.use('/app', apps);
router.use('/area', area);
router.use('/notif', notif);
router.use(exception);

export default router;
