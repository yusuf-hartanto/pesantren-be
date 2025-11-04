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
import { associateTahunAjaran, initTahunAjaran } from '../app/tahun.ajaran/tahun.ajaran.model';
import { associateSemester, initSemester } from '../app/semester/semester.ajaran.model';

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

  // associate
  associateAppRole();
  associateAppRoleMenu();
  associateAppResource();
  associateAreaRegency();
  associateAreaProvince();
  associateTahunAjaran();
  associateSemester();
}
