'use strict';

import { Sequelize } from 'sequelize';
import { initAppOtp } from '../auth/otp.model';
import { initAppMenu } from '../app/menu/menu.model';
import { initAppRole, associateAppRole } from '../app/role/role.model';
import { initParamGlobal } from '../app/param.global/param.global.model';
import { initAreaRegency, associateAreaRegency } from '../area/regencies.model';
import {
  initAreaProvince,
  associateAreaProvince,
} from '../area/provinces.model';
import {
  initAppRoleMenu,
  associateAppRoleMenu,
} from '../app/role.menu/role.menu.model';
import {
  initAppResourceModel,
  associateAppResource,
} from '../app/resource/resource.model';
import { initTahunAngkatan } from '../app/tahun.angkatan/tahun.angkatan.model';
import { initTingkat } from '../app/tingkat/tingkat.model';
import {
  associateTahunAjaran,
  initTahunAjaran,
} from '../app/tahun.ajaran/tahun.ajaran.model';
import {
  associateSemester,
  initSemester,
} from '../app/semester/semester.model';
import { initStatusAwalSantri } from '../app/status.awal.santri/status.awal.santri.model';
import { initBeasiswaSantri } from '../app/beasiswa.santri/beasiswa.santri.model';
import { initKelompokPelajaran } from '../app/kelompok.pelajaran/kelompok.pelajaran.model';
import { initJenisJamPelajaran } from '../app/jenis.jampel/jenis.jampel.model';
import { initJenisGuru } from '../app/jenis.guru/jenis.guru.model';
import {
  initMataPelajaran,
  associateMataPelajaran,
} from '../app/mata.pelajaran/mata.pelajaran.model';
import {
  initJamPelajaran,
  associateJamPelajaran,
} from '../app/jam.pelajaran/jam.pelajaran.model';
import { initKegiatanAkademik, associateKegiatanAkademik } from '../app/kegiatan.akademik/kegiatan.akademik.model';
import { initProgramPesantren } from '../app/program.pesantren/program.pesantren.model';
import { initSantriProgram, associateSantriProgram } from '../app/santri.program/santri.program.model';
import { initOrangTuaWali, associateOrangTuaWali } from '../app/orang.tua.wali/orang.tua.wali.model';

export function initializeModels(sequelize: Sequelize) {
  // initialize
  initAppOtp(sequelize);
  initAppRole(sequelize);
  initAppMenu(sequelize);
  initParamGlobal(sequelize);
  initAppRoleMenu(sequelize);
  initAreaRegency(sequelize);
  initAreaProvince(sequelize);
  initAppResourceModel(sequelize);
  initTahunAngkatan(sequelize);
  initTingkat(sequelize);
  initTahunAjaran(sequelize);
  initSemester(sequelize);
  initStatusAwalSantri(sequelize);
  initBeasiswaSantri(sequelize);
  initKelompokPelajaran(sequelize);
  initJenisJamPelajaran(sequelize);
  initJenisGuru(sequelize);
  initMataPelajaran(sequelize);
  initJamPelajaran(sequelize);
  initKegiatanAkademik(sequelize);
  initProgramPesantren(sequelize);
  initSantriProgram(sequelize);
  initOrangTuaWali(sequelize);

  // associate
  associateAppRole();
  associateAppRoleMenu();
  associateAppResource();
  associateAreaRegency();
  associateAreaProvince();
  associateTahunAjaran();
  associateSemester();
  associateMataPelajaran();
  associateJamPelajaran();
  associateKegiatanAkademik();
  associateSantriProgram();
  associateOrangTuaWali();
}
