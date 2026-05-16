'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './jadwal.inspeksi.kebersihan.model';
import Pegawai from '../pegawai/pegawai.model';
import Cabang from '../cabang/cabang.model';
import MasterSlotWaktu from '../master.slot.waktu/master.slot.waktu.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['created_at', 'DESC']],
    };

    if (data?.is_active != '') {
      let condition: any = {};
      if (data?.id_petugas != '') {
        condition = {
          id_petugas: data?.id_petugas,
        };
      }

      query = {
        ...query,
        where: {
          ...condition,
          is_active: data?.is_active == 'true',
        },
      };
    }
    return Model.findAll({
      ...query,
      include: [
        {
          model: Cabang,
          as: 'cabang',
          required: false,
          attributes: ['id_cabang', 'nama_cabang'],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: MasterSlotWaktu,
          as: 'master_slot_waktu',
          required: false,
          attributes: ['kode_slot', 'jam_mulai', 'jam_selesai'],
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
            { kode_slot: { [Op.like]: `%${data?.keyword}%` } },
            Sequelize.where(
              Sequelize.cast(
                Sequelize.col('JadwalInspeksiKebersihan.hari'),
                'TEXT'
              ),
              { [Op.like]: `%${data?.keyword}%` }
            ),
            { keterangan: { [Op.like]: `%${data?.keyword}%` } },
          ],
        },
      };
    }
    return Model.findAndCountAll({
      ...query,
      include: [
        {
          model: Cabang,
          as: 'cabang',
          required: false,
          attributes: ['id_cabang', 'nama_cabang'],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: MasterSlotWaktu,
          as: 'master_slot_waktu',
          required: false,
          attributes: ['kode_slot', 'jam_mulai', 'jam_selesai'],
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
          model: Cabang,
          as: 'cabang',
          required: false,
          attributes: ['id_cabang', 'nama_cabang'],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: MasterSlotWaktu,
          as: 'master_slot_waktu',
          required: false,
          attributes: ['kode_slot', 'jam_mulai', 'jam_selesai'],
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
