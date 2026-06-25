'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './guru.pengganti.model';
import JadwalPelajaran from '../jadwal.pelajaran/jadwal.pelajaran.model';
import JamPelajaran from '../jam.pelajaran/jam.pelajaran.model';
import KelasFormal from '../kelas.formal/kelas.formal.model';
import LembagaPendidikanFormal from '../lembaga.pendidikan.formal/lembaga.pendidikan.formal.model';
import KelasMda from '../kelas.mda/kelas.mda.model';
import LembagaPendidikanKepesantrenan from '../lembaga.pendidikan.kepesantrenan/lembaga.pendidikan.kepesantrenan.model';
import Pegawai from '../pegawai/pegawai.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['created_at', 'DESC']],
    };
    if (data?.status != '') {
      query = {
        ...query,
        where: {
          status_approval: { [Op.eq]: data?.status },
        },
      };
    }
    return Model.findAll({
      ...query,
      include: [
        {
          model: JadwalPelajaran,
          as: 'jadwal_pelajaran',
          required: false,
          attributes: ['id_jadwal', 'hari'],
          include: [
            {
              model: JamPelajaran,
              as: 'jam_pelajaran',
              required: false,
              attributes: ['id_jampel', 'mulai', 'selesai'],
            },
            {
              model: KelasFormal,
              as: 'kelas_formal',
              required: false,
              attributes: ['id_kelas', 'nama_kelas'],
              include: [
                {
                  model: LembagaPendidikanFormal,
                  as: 'lembaga',
                  required: false,
                  attributes: ['id_lembaga', 'nama_lembaga'],
                },
              ],
            },
            {
              model: KelasMda,
              as: 'kelas_mda',
              required: false,
              attributes: ['id_kelas_mda', 'nama_kelas_mda'],
              include: [
                {
                  model: LembagaPendidikanKepesantrenan,
                  as: 'lembaga',
                  required: false,
                  attributes: ['id_lembaga', 'nama_lembaga'],
                },
              ],
            },
          ],
        },
        {
          model: Pegawai,
          as: 'guru_asli',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: Pegawai,
          as: 'guru_pengganti',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
      ],
    });
  }

  public index(data: any) {
    let where: any = {};

    // Filter status
    if (data?.status) {
      where.status_approval = data.status;
    }

    let query: Object = {
      order: [['created_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
      where,
    };

    return Model.findAndCountAll({
      ...query,
      include: [
        {
          model: JadwalPelajaran,
          as: 'jadwal_pelajaran',
          required: false,
          attributes: ['id_jadwal', 'hari'],
          include: [
            {
              model: JamPelajaran,
              as: 'jam_pelajaran',
              required: false,
              attributes: ['id_jampel', 'mulai', 'selesai'],
            },
            {
              model: KelasFormal,
              as: 'kelas_formal',
              required: false,
              attributes: ['id_kelas', 'nama_kelas'],
              include: [
                {
                  model: LembagaPendidikanFormal,
                  as: 'lembaga',
                  required: false,
                  attributes: ['id_lembaga', 'nama_lembaga'],
                },
              ],
            },
            {
              model: KelasMda,
              as: 'kelas_mda',
              required: false,
              attributes: ['id_kelas_mda', 'nama_kelas_mda'],
              include: [
                {
                  model: LembagaPendidikanKepesantrenan,
                  as: 'lembaga',
                  required: false,
                  attributes: ['id_lembaga', 'nama_lembaga'],
                },
              ],
            },
          ],
        },
        {
          model: Pegawai,
          as: 'guru_asli',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: Pegawai,
          as: 'guru_pengganti',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
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
          model: JadwalPelajaran,
          as: 'jadwal_pelajaran',
          required: false,
          attributes: ['id_jadwal', 'hari'],
          include: [
            {
              model: JamPelajaran,
              as: 'jam_pelajaran',
              required: false,
              attributes: ['id_jampel', 'mulai', 'selesai'],
            },
            {
              model: KelasFormal,
              as: 'kelas_formal',
              required: false,
              attributes: ['id_kelas', 'nama_kelas'],
              include: [
                {
                  model: LembagaPendidikanFormal,
                  as: 'lembaga',
                  required: false,
                  attributes: ['id_lembaga', 'nama_lembaga'],
                },
              ],
            },
            {
              model: KelasMda,
              as: 'kelas_mda',
              required: false,
              attributes: ['id_kelas_mda', 'nama_kelas_mda'],
              include: [
                {
                  model: LembagaPendidikanKepesantrenan,
                  as: 'lembaga',
                  required: false,
                  attributes: ['id_lembaga', 'nama_lembaga'],
                },
              ],
            },
          ],
        },
        {
          model: Pegawai,
          as: 'guru_asli',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: Pegawai,
          as: 'guru_pengganti',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
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
