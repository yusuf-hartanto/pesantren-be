'use strict';

import { Op } from 'sequelize';
import ActivityLog from '../../global/activity.log.model';
import AppResource from '../resource/resource.model';
import moment from 'moment';

export default class Repository {
  private buildQuery(data: any) {
    let query: any = {
      order: [['created_at', 'DESC']],
      where: {
        table_name: {
          [Op.in]: [
            'perizinan_santri',
            'absen_kelas_santri',
            'absen_harian_santri',
            'kebersihan_temuan',
            'kebersihan_inspeksi',
          ],
        },
      },
    };

    if (data?.table_name && data?.table_name !== '') {
      query.where.table_name = {
        [Op.eq]: data.table_name,
      };
    }

    if (data?.action && data?.action !== '') {
      query.where.action = {
        [Op.eq]: data.action,
      };
    }

    if (
      data?.tanggal_awal &&
      data?.tanggal_awal !== '' &&
      data?.tanggal_akhir &&
      data?.tanggal_akhir !== ''
    ) {
      query.where.created_at = {
        [Op.between]: [
          moment(data.tanggal_awal).startOf('day').toDate(),
          moment(data.tanggal_akhir).endOf('day').toDate(),
        ],
      };
    } else if (data?.tanggal_awal && data?.tanggal_awal !== '') {
      query.where.created_at = {
        [Op.gte]: moment(data.tanggal_awal).startOf('day').toDate(),
      };
    } else if (data?.tanggal_akhir && data?.tanggal_akhir !== '') {
      query.where.created_at = {
        [Op.lte]: moment(data.tanggal_akhir).endOf('day').toDate(),
      };
    }

    if (data?.keyword && data?.keyword !== '') {
      const kw = `%${data.keyword}%`;
      query.where[Op.or] = [
        { username: { [Op.like]: kw } },
        { '$resource.full_name$': { [Op.like]: kw } },
      ];
    }

    query.include = [
      {
        model: AppResource,
        as: 'resource',
        required: false,
        attributes: ['resource_id', 'username', 'full_name', 'email'],
      },
    ];

    return query;
  }

  public list(data: any) {
    const query = this.buildQuery(data);
    return ActivityLog.findAll(query);
  }

  public index(data: any) {
    const query = this.buildQuery(data);
    query.offset = data?.offset;
    query.limit = data?.limit;

    return ActivityLog.findAndCountAll(query);
  }

  public detail(condition: any) {
    return ActivityLog.findOne({
      where: condition,
      include: [
        {
          model: AppResource,
          as: 'resource',
          required: false,
          attributes: ['resource_id', 'username', 'full_name', 'email'],
        },
      ],
    });
  }
}

export const repository = new Repository();
