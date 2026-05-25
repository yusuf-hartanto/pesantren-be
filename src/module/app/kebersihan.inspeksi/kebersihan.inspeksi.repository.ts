'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './kebersihan.inspeksi.model';
import Pegawai from '../pegawai/pegawai.model';
import Cabang from '../cabang/cabang.model';
import Lokasi from '../location/location.model';
import JadwalInspeksiKebersihan from '../jadwal.inspeksi.kebersihan/jadwal.inspeksi.kebersihan.model';
import KebersihanTemuan from '../kebersihan.temuan/kebersihan.temuan.model';

export default class Repository {
  public list(data: any) {
    let query: Object = {
      order: [['created_at', 'DESC']],
    };

    if (data?.kode_slot != '') {
      query = {
        ...query,
        where: {
          kode_slot: { [Op.eq]: data?.kode_slot },
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
          model: Lokasi,
          as: 'lokasi',
          required: false,
          attributes: ['id_lokasi', 'nama_lokasi'],
        },
        {
          model: JadwalInspeksiKebersihan,
          as: 'jadwal_inspeksi_kebersihan',
          required: false,
          attributes: ['id_jadwal', 'hari'],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: KebersihanTemuan,
          as: 'temuans',
          required: false,
          attributes: [
            'id_temuan',
            'kategori',
            'deskripsi',
            'tingkat',
            'perlu_tindak_lanjut',
            'foto_path',
            'created_at',
          ],
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
            { catatan_umum: { [Op.like]: `%${data?.keyword}%` } },
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
          model: Lokasi,
          as: 'lokasi',
          required: false,
          attributes: ['id_lokasi', 'nama_lokasi'],
        },
        {
          model: JadwalInspeksiKebersihan,
          as: 'jadwal_inspeksi_kebersihan',
          required: false,
          attributes: ['id_jadwal', 'hari'],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: KebersihanTemuan,
          as: 'temuans',
          required: false,
          attributes: [
            'id_temuan',
            'kategori',
            'deskripsi',
            'tingkat',
            'perlu_tindak_lanjut',
            'foto_path',
            'created_at',
            'status',
            'foto_path_tindakan',
          ],
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
          model: Lokasi,
          as: 'lokasi',
          required: false,
          attributes: ['id_lokasi', 'nama_lokasi'],
        },
        {
          model: JadwalInspeksiKebersihan,
          as: 'jadwal_inspeksi_kebersihan',
          required: false,
          attributes: ['id_jadwal', 'hari'],
        },
        {
          model: Pegawai,
          as: 'pegawai',
          required: false,
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: KebersihanTemuan,
          as: 'temuans',
          required: false,
          attributes: [
            'id_temuan',
            'kategori',
            'deskripsi',
            'tingkat',
            'perlu_tindak_lanjut',
            'foto_path',
            'created_at',
          ],
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
