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

  public async index(data: any) {
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

    const paginatedGroups = await Model.findAll({
      attributes: [
        'id_cabang',
        'id_petugas',
        'kode_slot',
        'is_active',
        'keterangan',
        [
          Sequelize.fn(
            'MAX',
            Sequelize.col('JadwalInspeksiKebersihan.updated_at')
          ),
          'max_updated_at',
        ],
      ],
      where,
      include: [
        {
          model: Cabang,
          as: 'cabang',
          required: false,
          attributes: [],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          required: false,
          attributes: [],
        },
      ],
      group: [
        'JadwalInspeksiKebersihan.id_cabang',
        'JadwalInspeksiKebersihan.id_petugas',
        'JadwalInspeksiKebersihan.kode_slot',
        'JadwalInspeksiKebersihan.is_active',
        'JadwalInspeksiKebersihan.keterangan',
      ],
      order: [[Sequelize.literal('max_updated_at'), 'DESC']],
      offset: data?.offset ? Number(data.offset) : undefined,
      limit: data?.limit ? Number(data.limit) : undefined,
      raw: true,
    });

    if (paginatedGroups.length === 0) {
      return { count: 0, rows: [] };
    }

    const totalGroups = await Model.findAll({
      attributes: [
        'id_cabang',
        'id_petugas',
        'kode_slot',
        'is_active',
        'keterangan',
      ],
      where,
      include: [
        {
          model: Cabang,
          as: 'cabang',
          required: false,
          attributes: [],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          required: false,
          attributes: [],
        },
      ],
      group: [
        'JadwalInspeksiKebersihan.id_cabang',
        'JadwalInspeksiKebersihan.id_petugas',
        'JadwalInspeksiKebersihan.kode_slot',
        'JadwalInspeksiKebersihan.is_active',
        'JadwalInspeksiKebersihan.keterangan',
      ],
    });
    const total = totalGroups.length;

    const rows = await Model.findAll({
      where: {
        [Op.or]: paginatedGroups.map((g: any) => ({
          id_cabang: g.id_cabang || null,
          id_petugas: g.id_petugas || null,
          kode_slot: g.kode_slot || null,
          is_active: g.is_active,
          keterangan: g.keterangan || null,
        })),
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
      order: [['updated_at', 'DESC']],
    });

    return { count: total, rows };
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

  public async findAllByDayAndTime(day: number, jam: string) {
    return Model.findAll({
      where: {
        hari: day,
      },
      include: [
        {
          model: MasterSlotWaktu,
          as: 'master_slot_waktu',
          required: true,
          attributes: ['kode_slot', 'jam_mulai', 'jam_selesai'],
          where: {
            jam_mulai: jam
          }
        },
      ],
    });
  }
}

export const repository = new Repository();
