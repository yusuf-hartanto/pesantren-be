'use strict';

import { Router } from 'express';
import { role } from './role/role.controller';
import { menu } from './menu/menu.controller';
import { auth } from '../auth/auth.middleware';
import { resource } from './resource/resource.controller';
import { roleMenu } from './role.menu/role.menu.controller';
import { paramGlobal } from './param.global/param.global.controller';
import { tahunAngkatan } from './tahun.angkatan/tahun.angkatan.controller';
import { tingkat } from './tingkat/tingkat.controller';
import { tahunAjaran } from './tahun.ajaran/tahun.ajaran.controller';
import { semester } from './semester/semester.controller';
import { statusAwalSantri } from './status.awal.santri/status.awal.santri.controller';
import { beasiswaSantri } from './beasiswa.santri/beasiswa.santri.controller';

const router: Router = Router();

router.get('/role/all-data', auth.checkBearerToken, role.list);
router.get('/role', auth.checkBearerToken, role.index);
router.get('/role/:id', auth.checkBearerToken, role.detail);
router.post('/role', auth.checkBearerToken, role.create);
router.put('/role/:id', auth.checkBearerToken, role.update);
router.delete('/role/:id', auth.checkBearerToken, role.delete);

router.get('/menu/all-data', auth.checkBearerToken, menu.list);
router.get('/menu', auth.checkBearerToken, menu.index);
router.get('/menu/:id', auth.checkBearerToken, menu.detail);
router.post('/menu', auth.checkBearerToken, menu.create);
router.put('/menu/:id', auth.checkBearerToken, menu.update);
router.delete('/menu/:id', auth.checkBearerToken, menu.delete);

router.get('/role-menu/all-data', auth.checkBearerToken, roleMenu.list);
router.get('/role-menu', auth.checkBearerToken, roleMenu.index);
router.post('/role-menu', auth.checkBearerToken, roleMenu.create);

router.get('/param-global/all-data', auth.checkToken, paramGlobal.list);
router.get('/param-global', auth.checkToken, paramGlobal.index);
router.get('/param-global/detail', auth.checkToken, paramGlobal.detail);
router.post('/param-global', auth.checkBearerToken, paramGlobal.create);
router.put('/param-global/:id', auth.checkBearerToken, paramGlobal.update);
router.delete('/param-global/:id', auth.checkBearerToken, paramGlobal.delete);

router.get('/resource', auth.checkBearerToken, resource.index);
router.get('/resource/check/:username', auth.checkBearerToken, resource.check);
router.get('/resource/:id', auth.checkBearerToken, resource.detail);
router.post('/resource', auth.checkBearerToken, resource.create);
router.put('/resource/:id', auth.checkBearerToken, resource.update);
router.delete('/resource/:id', auth.checkBearerToken, resource.delete);

router.get('/tahun-angkatan/all-data', auth.checkBearerToken, tahunAngkatan.list);
router.get('/tahun-angkatan', auth.checkBearerToken, tahunAngkatan.index);
router.get('/tahun-angkatan/:id', auth.checkBearerToken, tahunAngkatan.detail);
router.post('/tahun-angkatan', auth.checkBearerToken, tahunAngkatan.create);
router.put('/tahun-angkatan/:id', auth.checkBearerToken, tahunAngkatan.update);
router.delete('/tahun-angkatan/:id', auth.checkBearerToken, tahunAngkatan.delete);

router.get('/tingkat/all-data', auth.checkBearerToken, tingkat.list);
router.get('/tingkat', auth.checkBearerToken, tingkat.index);
router.get('/tingkat/:id', auth.checkBearerToken, tingkat.detail);
router.post('/tingkat', auth.checkBearerToken, tingkat.create);
router.put('/tingkat/:id', auth.checkBearerToken, tingkat.update);
router.delete('/tingkat/:id', auth.checkBearerToken, tingkat.delete);

router.get('/tahun-ajaran/all-data', auth.checkBearerToken, tahunAjaran.list);
router.get('/tahun-ajaran', auth.checkBearerToken, tahunAjaran.index);
router.get('/tahun-ajaran/:id', auth.checkBearerToken, tahunAjaran.detail);
router.post('/tahun-ajaran', auth.checkBearerToken, tahunAjaran.create);
router.put('/tahun-ajaran/:id', auth.checkBearerToken, tahunAjaran.update);
router.delete('/tahun-ajaran/:id', auth.checkBearerToken, tahunAjaran.delete);

router.get('/semester/all-data', auth.checkBearerToken, semester.list);
router.get('/semester', auth.checkBearerToken, semester.index);
router.get('/semester/:id', auth.checkBearerToken, semester.detail);
router.post('/semester', auth.checkBearerToken, semester.create);
router.put('/semester/:id', auth.checkBearerToken, semester.update);
router.delete('/semester/:id', auth.checkBearerToken, semester.delete);

router.get('/status-awal-santri/all-data', auth.checkBearerToken, statusAwalSantri.list);
router.get('/status-awal-santri', auth.checkBearerToken, statusAwalSantri.index);
router.get('/status-awal-santri/:id', auth.checkBearerToken, statusAwalSantri.detail);
router.post('/status-awal-santri', auth.checkBearerToken, statusAwalSantri.create);
router.put('/status-awal-santri/:id', auth.checkBearerToken, statusAwalSantri.update);
router.delete('/status-awal-santri/:id', auth.checkBearerToken, statusAwalSantri.delete);

router.get('/beasiswa-santri/all-data', auth.checkBearerToken, beasiswaSantri.list);
router.get('/beasiswa-santri', auth.checkBearerToken, beasiswaSantri.index);
router.get('/beasiswa-santri/:id', auth.checkBearerToken, beasiswaSantri.detail);
router.post('/beasiswa-santri', auth.checkBearerToken, beasiswaSantri.create);
router.put('/beasiswa-santri/:id', auth.checkBearerToken, beasiswaSantri.update);
router.delete('/beasiswa-santri/:id', auth.checkBearerToken, beasiswaSantri.delete);

export default router;
