'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './jadwal.pelajaran.model';
import KelasFormal from '../kelas.formal/kelas.formal.model';
import KelasMda from '../kelas.mda/kelas.mda.model';
import TahunAjaran from '../tahun.ajaran/tahun.ajaran.model';
import Semester from '../semester/semester.model';
import JamPelajaran from '../jam.pelajaran/jam.pelajaran.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['created_at', 'DESC']],
    };
    if (data?.status != '') {
      query = {
        ...query,
        where: {
          status: { [Op.eq]: data?.status },
        },
      };
    }
    return Model.findAll({
      ...query,
      include: [
        {
          model: KelasFormal,
          as: 'kelas_formal',
          required: false,
          attributes: ['id_kelas', 'nama_kelas'],
        },
        {
          model: KelasMda,
          as: 'kelas_mda',
          required: false,
          attributes: ['id_kelas_mda', 'nama_kelas_mda'],
        },
        {
          model: Semester,
          as: 'semester',
          required: false,
          attributes: ['id_semester', 'nama_semester'],
        },
        {
          model: TahunAjaran,
          as: 'tahun_ajaran',
          required: false,
          attributes: ['id_tahunajaran', 'tahun_ajaran'],
        },
        {
          model: JamPelajaran,
          as: 'jam_pelajaran',
          required: false,
          attributes: ['id_jampel', 'nama_jampel'],
        },
      ],
    });
  }

  public index(data: any) {
    let query: Object = {
      order: [['created_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      query = {
        ...query,
        where: {
          [Op.or]: [
            { keterangan: { [Op.like]: `%${data?.keyword}%` } },
          ],
        },
      };
    }
    return Model.findAndCountAll({
      ...query,
      include: [
        {
          model: KelasFormal,
          as: 'kelas_formal',
          required: false,
          attributes: ['id_kelas', 'nama_kelas'],
        },
        {
          model: KelasMda,
          as: 'kelas_mda',
          required: false,
          attributes: ['id_kelas_mda', 'nama_kelas_mda'],
        },
        {
          model: Semester,
          as: 'semester',
          required: false,
          attributes: ['id_semester', 'nama_semester'],
        },
        {
          model: TahunAjaran,
          as: 'tahun_ajaran',
          required: false,
          attributes: ['id_tahunajaran', 'tahun_ajaran'],
        },
        {
          model: JamPelajaran,
          as: 'jam_pelajaran',
          required: false,
          attributes: ['id_jampel', 'nama_jampel'],
        },
      ],
    });
  }

  public detail(condition: any) {
    return Model.findOne({
      where: {
        ...condition,
      },
      include: [
        {
          model: KelasFormal,
          as: 'kelas_formal',
          required: false,
          attributes: ['id_kelas', 'nama_kelas'],
        },
        {
          model: KelasMda,
          as: 'kelas_mda',
          required: false,
          attributes: ['id_kelas_mda', 'nama_kelas_mda'],
        },
        {
          model: Semester,
          as: 'semester',
          required: false,
          attributes: ['id_semester', 'nama_semester'],
        },
        {
          model: TahunAjaran,
          as: 'tahun_ajaran',
          required: false,
          attributes: ['id_tahunajaran', 'tahun_ajaran'],
        },
        {
          model: JamPelajaran,
          as: 'jam_pelajaran',
          required: false,
          attributes: ['id_jampel', 'nama_jampel'],
        },
      ],
    });
  }

  public async create(data: any) {
    return Model.create(data?.payload);
  }

  public update(data: any) {
    return Model.update(data?.payload, {
      where: data?.condition,
      individualHooks: true,
    });
  }

  public delete(data: any) {
    return Model.destroy({
      where: data?.condition,
      individualHooks: true,
    });
  }
}

export const repository = new Repository();
