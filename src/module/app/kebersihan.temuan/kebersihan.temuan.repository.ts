'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './kebersihan.temuan.model';
import KebersihanInspeksi from '../kebersihan.inspeksi/kebersihan.inspeksi.model';
import Cabang from '../cabang/cabang.model';
import Lokasi from '../location/location.model';
import Pegawai from '../pegawai/pegawai.model';

export default class Repository {
  private buildQuery(data: any) {
    let query: any = {
      order: [['created_at', 'DESC']],
    };

    if (data?.id_inspeksi && data?.id_inspeksi != '') {
      query.where = {
        ...query.where,
        id_inspeksi: { [Op.eq]: data?.id_inspeksi },
      };
    }

    if (data?.keyword && data?.keyword != undefined) {
      query.where = {
        ...query.where,
        [Op.or]: [
          { kategori: { [Op.like]: `%${data?.keyword}%` } },
          { deskripsi: { [Op.like]: `%${data?.keyword}%` } },
        ],
      };
    }

    if (data?.status && data?.status != '') {
      query.where = {
        ...query.where,
        status: { [Op.eq]: data?.status },
      };
    }

    let inspeksiWhere: any = {};
    let isInspeksiRequired = false;

    if (
      data?.tanggal_awal &&
      data?.tanggal_awal != '' &&
      data?.tanggal_akhir &&
      data?.tanggal_akhir != ''
    ) {
      inspeksiWhere.tanggal = {
        [Op.between]: [data?.tanggal_awal, data?.tanggal_akhir],
      };
      isInspeksiRequired = true;
    } else if (data?.tanggal_awal && data?.tanggal_awal != '') {
      inspeksiWhere.tanggal = {
        [Op.gte]: data?.tanggal_awal,
      };
      isInspeksiRequired = true;
    } else if (data?.tanggal_akhir && data?.tanggal_akhir != '') {
      inspeksiWhere.tanggal = {
        [Op.lte]: data?.tanggal_akhir,
      };
      isInspeksiRequired = true;
    }

    if (data?.id_cabang && data?.id_cabang != '') {
      inspeksiWhere.id_cabang = data?.id_cabang;
      isInspeksiRequired = true;
    }

    if (data?.id_lokasi && data?.id_lokasi != '') {
      inspeksiWhere.id_lokasi = data?.id_lokasi;
      isInspeksiRequired = true;
    }

    if (data?.id_petugas && data?.id_petugas != '') {
      inspeksiWhere.id_petugas = data?.id_petugas;
      isInspeksiRequired = true;
    }

    if (data?.status_kondisi && data?.status_kondisi != '') {
      inspeksiWhere.status_kondisi = data?.status_kondisi;
      isInspeksiRequired = true;
    }

    query.include = [
      {
        model: KebersihanInspeksi,
        as: 'kebersihan_inspeksi',
        required: isInspeksiRequired,
        attributes: ['id_inspeksi', 'waktu', 'tanggal', 'status_kondisi'],
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
            model: Lokasi,
            as: 'lokasi',
            required: false,
            attributes: ['id_lokasi', 'nama_lokasi'],
          },
        ],
        ...(Object.keys(inspeksiWhere).length > 0 && { where: inspeksiWhere }),
      },
    ];

    return query;
  }

  public list(data: any) {
    const query = this.buildQuery(data);
    return Model.findAll(query);
  }

  public index(data: any) {
    const query = this.buildQuery(data);
    query.offset = data?.offset;
    query.limit = data?.limit;

    return Model.findAndCountAll(query);
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
          attributes: ['id_inspeksi', 'waktu', 'tanggal'],
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
              model: Lokasi,
              as: 'lokasi',
              required: false,
              attributes: ['id_lokasi', 'nama_lokasi'],
            },
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

  public insert(data: any) {
    return Model.bulkCreate(data);
  }
}

export const repository = new Repository();
