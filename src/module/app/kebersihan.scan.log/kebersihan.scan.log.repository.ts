'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './kebersihan.scan.log.model';
import Pegawai from '../pegawai/pegawai.model';
import Lokasi from '../location/location.model';
import KebersihanInspeksi from '../kebersihan.inspeksi/kebersihan.inspeksi.model';
import { getUserContextData } from '../../../context/userContext';

export default class Repository {
  public list(data: any) {
    const userContext = getUserContextData();
    const idCabang = data?.id_cabang || userContext?.id_cabang;

    let query: any = {
      order: [['scan_at', 'DESC']],
    };

    if (data?.id_scan_log && data?.id_scan_log != '') {
      query = {
        ...query,
        where: {
          id_scan_log: { [Op.eq]: data?.id_scan_log },
        },
      };
    }

    return Model.findAll({
      ...query,
      include: [
        {
          model: KebersihanInspeksi,
          as: 'kebersihan_inspeksi',
          required: !!idCabang,
          attributes: [
            'id_inspeksi',
            'tanggal',
            'waktu',
            'kode_slot',
            'status_kondisi',
          ],
          ...(idCabang && { where: { id_cabang: idCabang } }),
        },
        {
          model: Lokasi,
          as: 'lokasi',
          required: false,
          attributes: ['id_lokasi', 'nama_lokasi'],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
      ],
    });
  }

  public index(data: any) {
    const userContext = getUserContextData();
    const idCabang = data?.id_cabang || userContext?.id_cabang;

    let query: any = {
      order: [['scan_at', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };
    if (data?.keyword && data?.keyword != undefined) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query = {
        ...query,
        where: {
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('id_inspeksi')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('keterangan')),
              {
                [Op.like]: keyword,
              }
            ),
          ],
        },
      };
    }
    return Model.findAndCountAll({
      ...query,
      include: [
        {
          model: KebersihanInspeksi,
          as: 'kebersihan_inspeksi',
          required: !!idCabang,
          attributes: [
            'id_inspeksi',
            'tanggal',
            'waktu',
            'kode_slot',
            'status_kondisi',
          ],
          ...(idCabang && { where: { id_cabang: idCabang } }),
        },
        {
          model: Lokasi,
          as: 'lokasi',
          required: false,
          attributes: ['id_lokasi', 'nama_lokasi'],
        },
        {
          model: Pegawai,
          as: 'pegawai',
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
          model: KebersihanInspeksi,
          as: 'kebersihan_inspeksi',
          required: false,
          attributes: [
            'id_inspeksi',
            'tanggal',
            'waktu',
            'kode_slot',
            'status_kondisi',
          ],
        },
        {
          model: Lokasi,
          as: 'lokasi',
          required: false,
          attributes: ['id_lokasi', 'nama_lokasi'],
        },
        {
          model: Pegawai,
          as: 'pegawai',
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
