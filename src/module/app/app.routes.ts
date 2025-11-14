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
import { kelompokPejaran } from './kelompok.pelajaran/kelompok.pelajaran.controller';
import { jenisJamPelajaran } from './jenis.jampel/jenis.jampel.controller';
import { jenisGuru } from './jenis.guru/jenis.guru.controller';
import { mataPelajaran } from './mata.pelajaran/mata.pelajaran.controller';
import { jamPelajaran } from './jam.pelajaran/jam.pelajaran.controller';
import { cabang } from './cabang/cabang.controller';
import { LembagaPendidikan } from './lembaga.pendidikan/lembaga.pendidikan.controller';
import { OrganitationUnit } from './organitation.unit/organitation.unit.controller';
import { Jabatan } from './jabatan/jabatan.controller';
import { JenisPenilaian } from './jenis.penilaian/jenis.penilaian.controller';
import { Asrama } from './asrama/asrama.controller';

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

router.get(
  '/tahun-angkatan/all-data',
  auth.checkBearerToken,
  tahunAngkatan.list
);
router.get('/tahun-angkatan', auth.checkBearerToken, tahunAngkatan.index);
router.get('/tahun-angkatan/:id', auth.checkBearerToken, tahunAngkatan.detail);
router.post('/tahun-angkatan', auth.checkBearerToken, tahunAngkatan.create);
router.put('/tahun-angkatan/:id', auth.checkBearerToken, tahunAngkatan.update);
router.delete(
  '/tahun-angkatan/:id',
  auth.checkBearerToken,
  tahunAngkatan.delete
);

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

router.get(
  '/status-awal-santri/all-data',
  auth.checkBearerToken,
  statusAwalSantri.list
);
router.get(
  '/status-awal-santri',
  auth.checkBearerToken,
  statusAwalSantri.index
);
router.get(
  '/status-awal-santri/:id',
  auth.checkBearerToken,
  statusAwalSantri.detail
);
router.post(
  '/status-awal-santri',
  auth.checkBearerToken,
  statusAwalSantri.create
);
router.put(
  '/status-awal-santri/:id',
  auth.checkBearerToken,
  statusAwalSantri.update
);
router.delete(
  '/status-awal-santri/:id',
  auth.checkBearerToken,
  statusAwalSantri.delete
);

router.get(
  '/beasiswa-santri/all-data',
  auth.checkBearerToken,
  beasiswaSantri.list
);
router.get('/beasiswa-santri', auth.checkBearerToken, beasiswaSantri.index);
router.get(
  '/beasiswa-santri/:id',
  auth.checkBearerToken,
  beasiswaSantri.detail
);
router.post('/beasiswa-santri', auth.checkBearerToken, beasiswaSantri.create);
router.put(
  '/beasiswa-santri/:id',
  auth.checkBearerToken,
  beasiswaSantri.update
);
router.delete(
  '/beasiswa-santri/:id',
  auth.checkBearerToken,
  beasiswaSantri.delete
);

router.get(
  '/kelompok-pelajaran/all-data',
  auth.checkBearerToken,
  kelompokPejaran.list
);
router.get('/kelompok-pelajaran', auth.checkBearerToken, kelompokPejaran.index);
router.get(
  '/kelompok-pelajaran/:id',
  auth.checkBearerToken,
  kelompokPejaran.detail
);
router.post(
  '/kelompok-pelajaran',
  auth.checkBearerToken,
  kelompokPejaran.create
);
router.put(
  '/kelompok-pelajaran/:id',
  auth.checkBearerToken,
  kelompokPejaran.update
);
router.delete(
  '/kelompok-pelajaran/:id',
  auth.checkBearerToken,
  kelompokPejaran.delete
);

router.get(
  '/jenis-jampel/all-data',
  auth.checkBearerToken,
  jenisJamPelajaran.list
);
router.get('/jenis-jampel', auth.checkBearerToken, jenisJamPelajaran.index);
router.get(
  '/jenis-jampel/:id',
  auth.checkBearerToken,
  jenisJamPelajaran.detail
);
router.post('/jenis-jampel', auth.checkBearerToken, jenisJamPelajaran.create);
router.put(
  '/jenis-jampel/:id',
  auth.checkBearerToken,
  jenisJamPelajaran.update
);
router.delete(
  '/jenis-jampel/:id',
  auth.checkBearerToken,
  jenisJamPelajaran.delete
);

router.get('/jenis-guru/all-data', auth.checkBearerToken, jenisGuru.list);
router.get('/jenis-guru', auth.checkBearerToken, jenisGuru.index);
router.get('/jenis-guru/:id', auth.checkBearerToken, jenisGuru.detail);
router.post('/jenis-guru', auth.checkBearerToken, jenisGuru.create);
router.put('/jenis-guru/:id', auth.checkBearerToken, jenisGuru.update);
router.delete('/jenis-guru/:id', auth.checkBearerToken, jenisGuru.delete);

router.get('/mapel/all-data', auth.checkBearerToken, mataPelajaran.list);
router.get('/mapel', auth.checkBearerToken, mataPelajaran.index);
router.get('/mapel/:id', auth.checkBearerToken, mataPelajaran.detail);
router.post('/mapel', auth.checkBearerToken, mataPelajaran.create);
router.put('/mapel/:id', auth.checkBearerToken, mataPelajaran.update);
router.delete('/mapel/:id', auth.checkBearerToken, mataPelajaran.delete);

router.get('/jampel/all-data', auth.checkBearerToken, jamPelajaran.list);
router.get('/jampel', auth.checkBearerToken, jamPelajaran.index);
router.get('/jampel/:id', auth.checkBearerToken, jamPelajaran.detail);
router.post('/jampel', auth.checkBearerToken, jamPelajaran.create);
router.put('/jampel/:id', auth.checkBearerToken, jamPelajaran.update);
router.delete('/jampel/:id', auth.checkBearerToken, jamPelajaran.delete);

router.get('/cabang/all-data', auth.checkBearerToken, cabang.list);
router.get('/cabang', auth.checkBearerToken, cabang.index);
router.get('/cabang/:id', auth.checkBearerToken, cabang.detail);
router.post('/cabang', auth.checkBearerToken, cabang.create);
router.put('/cabang/:id', auth.checkBearerToken, cabang.update);
router.delete('/cabang/:id', auth.checkBearerToken, cabang.delete);

router.get('/lembaga/all-data', auth.checkBearerToken, LembagaPendidikan.list);
router.get('/lembaga', auth.checkBearerToken, LembagaPendidikan.index);
router.get('/lembaga/:id', auth.checkBearerToken, LembagaPendidikan.detail);
router.post('/lembaga', auth.checkBearerToken, LembagaPendidikan.create);
router.put('/lembaga/:id', auth.checkBearerToken, LembagaPendidikan.update);
router.delete('/lembaga/:id', auth.checkBearerToken, LembagaPendidikan.delete);

router.get('/organitation-unit/all-data', auth.checkBearerToken, OrganitationUnit.list);
router.get('/organitation-unit', auth.checkBearerToken, OrganitationUnit.index);
router.get('/organitation-unit/:id', auth.checkBearerToken, OrganitationUnit.detail);
router.post('/organitation-unit', auth.checkBearerToken, OrganitationUnit.create);
router.put('/organitation-unit/:id', auth.checkBearerToken, OrganitationUnit.update);
router.delete('/organitation-unit/:id', auth.checkBearerToken, OrganitationUnit.delete);

router.get('/jabatan/all-data', auth.checkBearerToken, Jabatan.list);
router.get('/jabatan', auth.checkBearerToken, Jabatan.index);
router.get('/jabatan/:id', auth.checkBearerToken, Jabatan.detail);
router.post('/jabatan', auth.checkBearerToken, Jabatan.create);
router.put('/jabatan/:id', auth.checkBearerToken, Jabatan.update);
router.delete('/jabatan/:id', auth.checkBearerToken, Jabatan.delete);

router.get('/jenis-penilaian/all-data', auth.checkBearerToken, JenisPenilaian.list);
router.get('/jenis-penilaian', auth.checkBearerToken, JenisPenilaian.index);
router.get('/jenis-penilaian/:id', auth.checkBearerToken, JenisPenilaian.detail);
router.post('/jenis-penilaian', auth.checkBearerToken, JenisPenilaian.create);
router.put('/jenis-penilaian/:id', auth.checkBearerToken, JenisPenilaian.update);
router.delete('/jenis-penilaian/:id', auth.checkBearerToken, JenisPenilaian.delete);

router.get('/asrama/all-data', auth.checkBearerToken, Asrama.list);
router.get('/asrama', auth.checkBearerToken, Asrama.index);
router.get('/asrama/:id', auth.checkBearerToken, Asrama.detail);
router.post('/asrama', auth.checkBearerToken, Asrama.create);
router.put('/asrama/:id', auth.checkBearerToken, Asrama.update);
router.delete('/asrama/:id', auth.checkBearerToken, Asrama.delete);

export default router;
