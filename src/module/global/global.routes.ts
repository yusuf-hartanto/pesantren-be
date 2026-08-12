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
router.get('/summary', auth.checkBearerToken, global.summary);
router.post('/sync-santri', global.syncSantri);
router.post('/map-santri-relations', global.mapSantriRelations);
router.get('/summary-kepesantrenan', auth.checkBearerToken, global.summaryKepesantrenan);
router.get('/summary-lembaga-formal', auth.checkBearerToken, global.summaryLembagaFormal);
router.get('/summary-lembaga-non-formal', auth.checkBearerToken, global.summaryLembagaNonFormal);

export default router;
