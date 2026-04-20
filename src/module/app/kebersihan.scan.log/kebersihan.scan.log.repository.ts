'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './kebersihan.scan.log.model';
import Pegawai from '../pegawai/pegawai.model';
import Cabang from '../cabang/cabang.model';
import Lokasi from '../location/location.model';
import JadwalInspeksiKebersihan from '../jadwal.inspeksi.kebersihan/jadwal.inspeksi.kebersihan.model';
import KebersihanTemuan from '../kebersihan.temuan/kebersihan.temuan.model';
import KebersihanInspeksi from '../kebersihan.inspeksi/kebersihan.inspeksi.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['created_at', 'DESC']],
    };

    if (data?.id_inspeksi != '') {
      query = {
        ...query,
        where: {
          id_inspeksi: { [Op.eq]: data?.id_inspeksi },
        },
      };
    }

    return Model.findAll({
      ...query,
      include: [
        {
          model: KebersihanInspeksi,
          as: 'kebersihan_inspeksi',
          required: false,
          attributes: ['id_inspeksi', 'tanggal', 'waktu', 'kode_slot', 'status_kondisi'],
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
            { id_inspeksi: { [Op.like]: `%${data?.keyword}%` } },
            { keterangan: { [Op.like]: `%${data?.keyword}%` } },
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
          required: false,
          attributes: ['id_inspeksi', 'tanggal', 'waktu', 'kode_slot', 'status_kondisi'],
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
          attributes: ['id_inspeksi', 'tanggal', 'waktu', 'kode_slot', 'status_kondisi'],
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
