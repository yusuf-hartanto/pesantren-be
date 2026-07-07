'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './jadwal.inspeksi.kebersihan.model';
import Pegawai from '../pegawai/pegawai.model';
import Cabang from '../cabang/cabang.model';
import MasterSlotWaktu from '../master.slot.waktu/master.slot.waktu.model';
import { getUserContextData } from '../../../context/userContext';

export default class Repository {
  public list(data: any) {
    let query: any = {
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

    const userContext = getUserContextData();
    if (userContext && userContext?.id_cabang) {
      query.where = {
        ...query.where,
        id_cabang: userContext?.id_cabang,
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
    let where: any = {};

    // Filter keyword
    if (data?.keyword) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      where[Op.or] = [
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.col('JadwalInspeksiKebersihan.kode_slot')
          ),
          {
            [Op.like]: keyword,
          }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(
              Sequelize.col('JadwalInspeksiKebersihan.hari'),
              'TEXT'
            )
          ),
          {
            [Op.like]: keyword,
          }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.col('JadwalInspeksiKebersihan.keterangan')
          ),
          {
            [Op.like]: keyword,
          }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('cabang.nama_cabang')),
          {
            [Op.like]: keyword,
          }
        ),
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('pegawai.nama_lengkap')),
          {
            [Op.like]: keyword,
          }
        ),
      ];
    }

    // Filter status
    if (data?.status) {
      where.is_active = data.status == 'Ya';
    }

    // Filter cabang
    if (data?.id_cabang) {
      where.id_cabang = data.id_cabang;
    }

    const userContext = getUserContextData();
    if (userContext && userContext?.id_cabang) {
      where.id_cabang = userContext?.id_cabang;
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
