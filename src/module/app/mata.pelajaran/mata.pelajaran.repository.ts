'use strict';

import { Op, Sequelize } from 'sequelize';
import Model from './mata.pelajaran.model';
import KelompokPelajaran from '../kelompok.pelajaran/kelompok.pelajaran.model';
import LembagaPendidikanFormal from '../lembaga.pendidikan.formal/lembaga.pendidikan.formal.model';
import { getUserContextData } from '../../../context/userContext';
import LembagaPendidikanKepesantrenan from '../lembaga.pendidikan.kepesantrenan/lembaga.pendidikan.kepesantrenan.model';

export default class Repository {
  public list(data: any) {
    let query: any = {
      order: [['nomor_urut', 'DESC']],
    };

    const userContext = getUserContextData();
    if (userContext && userContext?.lembaga_type) {
      query = { 
        ...query,
        where: { lembaga_type: userContext?.lembaga_type, }
      }
    }

    if (data?.lembaga_type != '') {
      query = {
        ...query,
        where: {
          ...query.where,
          lembaga_type: data?.lembaga_type,
        },
      };
    }

    if (data?.id_lembaga != '') {
      query = {
        ...query,
        where: {
          ...query.where,
          id_lembaga: data?.id_lembaga,
        },
      };
    }

    if (data?.nama_mapel !== undefined && data?.nama_mapel != null) {
      const keyword = `%${data.nama_mapel.toLowerCase()}%`;
      query = {
        ...query,
        where: {
          ...query.where,
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('nama_mapel')),
              {
                [Op.like]: keyword,
              }
            ),
          ],
        },
      };
    }
    return Model.findAll({
      ...query,
      include: [
        {
          model: KelompokPelajaran,
          as: 'kelompok_pelajaran',
          required: false,
          attributes: ['id_kelpelajaran', 'nama_kelpelajaran', 'keterangan'],
        },
        {
          model: LembagaPendidikanFormal,
          as: 'lembaga_formal',
          required: false,
          attributes: ['id_lembaga', 'nama_lembaga'],
        },
        {
          model: LembagaPendidikanKepesantrenan,
          as: 'lembaga_kepesantrenan',
          required: false,
          attributes: ['id_lembaga', 'nama_lembaga'],
        },
      ],
    });
  }

  public index(data: any) {
    let query: any = {
      order: [['nomor_urut', 'DESC']],
      offset: data?.offset,
      limit: data?.limit,
    };

    const userContext = getUserContextData();
    if (userContext && userContext?.lembaga_type) {
      query = { 
        ...query,
        where: { lembaga_type: userContext?.lembaga_type, }
      }
    }

    if (data?.keyword && data?.keyword != undefined) {
      const keyword = `%${data.keyword.toLowerCase()}%`;
      query = {
        ...query,
        where: {
          ...query.where,
          [Op.or]: [
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('kode_mapel')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn('LOWER', Sequelize.col('nama_mapel')),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.col('lembaga_formal.nama_lembaga')
              ),
              {
                [Op.like]: keyword,
              }
            ),
            Sequelize.where(
              Sequelize.fn(
                'LOWER',
                Sequelize.col('kelompok_pelajaran.nama_kelpelajaran')
              ),
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
          model: KelompokPelajaran,
          as: 'kelompok_pelajaran',
          required: false,
          attributes: ['id_kelpelajaran', 'nama_kelpelajaran', 'keterangan'],
        },
        {
          model: LembagaPendidikanFormal,
          as: 'lembaga_formal',
          required: false,
          attributes: ['id_lembaga', 'nama_lembaga'],
        },
        {
          model: LembagaPendidikanKepesantrenan,
          as: 'lembaga_kepesantrenan',
          required: false,
          attributes: ['id_lembaga', 'nama_lembaga'],
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
          model: KelompokPelajaran,
          as: 'kelompok_pelajaran',
          required: false,
          attributes: ['id_kelpelajaran', 'nama_kelpelajaran', 'keterangan'],
        },
        {
          model: LembagaPendidikanFormal,
          as: 'lembaga_formal',
          required: false,
          attributes: ['id_lembaga', 'nama_lembaga'],
        },
        {
          model: LembagaPendidikanKepesantrenan,
          as: 'lembaga_kepesantrenan',
          required: false,
          attributes: ['id_lembaga', 'nama_lembaga'],
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
