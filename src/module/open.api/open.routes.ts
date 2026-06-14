'use strict';

import express from 'express';
import { controller } from './open.controller';
import { verifyOpenApiSignature } from '../../middlewares/openAuth';

const router = express.Router();

router.all('/generate-signature', controller.generateSignature);

router.use(verifyOpenApiSignature);

router.post('/sync-santri', controller.syncSantri);
router.post('/perizinan', controller.syncPerizinan);

router.get('/absensi-harian-santri', controller.absensiHarian);
router.get('/kebersihan-temuan', controller.kebersihanTemuan);
router.get('/perizinan', controller.perizinan);
router.get('/rapot-santri', controller.rapotSantri);

export default router;
