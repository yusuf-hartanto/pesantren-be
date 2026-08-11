'use strict';

import AppResourceRole from './resource.role.model';
import AppRole from '../role/role.model';
import Pegawai from '../pegawai/pegawai.model';
import Cabang from '../cabang/cabang.model';
import OrganizationUnit from '../organization.unit/organization.unit.model';
import LembagaPendidikanFormal from '../lembaga.pendidikan.formal/lembaga.pendidikan.formal.model';
import LembagaPendidikanKepesantrenan from '../lembaga.pendidikan.kepesantrenan/lembaga.pendidikan.kepesantrenan.model';

export class ResourceRoleRepository {
  public listByUser(resource_id: string) {
    return AppResourceRole.findAll({
      where: {
        resource_id,
        status: 'ACTIVE',
      },
      include: [
        {
          model: AppRole,
          as: 'role',
          attributes: ['role_id', 'role_name', 'status'],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          attributes: ['id_pegawai', 'nama_lengkap', 'nip', 'nik'],
        },
        {
          model: Cabang,
          as: 'cabang',
          attributes: ['id_cabang', 'nama_cabang'],
        },
        {
          model: OrganizationUnit,
          as: 'organizationUnit',
          attributes: [
            'id_orgunit',
            'nama_orgunit',
            'id_cabang',
            'id_lembaga',
            'lembaga_type',
          ],
        },
        {
          model: LembagaPendidikanFormal,
          as: 'lembagaPendidikanFormal',
          attributes: ['id_lembaga', 'nama_lembaga'],
        },
        {
          model: LembagaPendidikanKepesantrenan,
          as: 'lembagaPendidikanKepesantrenan',
          attributes: ['id_lembaga', 'nama_lembaga'],
        },
      ],
      order: [
        ['is_default', 'DESC'],
        ['created_at', 'ASC'],
      ],
    });
  }

  public detail(condition: any) {
    return AppResourceRole.findOne({
      where: condition,
      include: [
        {
          model: AppRole,
          as: 'role',
          attributes: ['role_id', 'role_name', 'status'],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          attributes: ['id_pegawai', 'nama_lengkap', 'nip', 'nik'],
        },
        {
          model: Cabang,
          as: 'cabang',
          attributes: ['id_cabang', 'nama_cabang'],
        },
        {
          model: OrganizationUnit,
          as: 'organizationUnit',
          attributes: [
            'id_orgunit',
            'nama_orgunit',
            'id_cabang',
            'id_lembaga',
            'lembaga_type',
          ],
        },
        {
          model: LembagaPendidikanFormal,
          as: 'lembagaPendidikanFormal',
          attributes: ['id_lembaga', 'nama_lembaga'],
        },
        {
          model: LembagaPendidikanKepesantrenan,
          as: 'lembagaPendidikanKepesantrenan',
          attributes: ['id_lembaga', 'nama_lembaga'],
        },
      ],
    });
  }

  public create(payload: any) {
    return AppResourceRole.create(payload);
  }

  public bulkCreate(payloads: any[]) {
    return AppResourceRole.bulkCreate(payloads);
  }

  public update(payload: any, condition: any) {
    return AppResourceRole.update(payload, { where: condition });
  }

  public delete(condition: any) {
    return AppResourceRole.destroy({ where: condition });
  }
}

export const repository = new ResourceRoleRepository();
export default repository;
