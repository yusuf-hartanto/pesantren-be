'use strict';

import { Op, Transaction } from 'sequelize';
import Model from './geo.areas.model';
import Lokasi from '../location/location.model';
import { sequelize } from '../../../database/connection';

export default class GeoAreaRepository {
  /**
   * Menampilkan daftar area geo (biasanya yang aktif saja atau berdasarkan filter)
   */
  public list(data: any) {
    let query: any = {
      order: [['versi', 'DESC']],
      include: [
        {
          model: Lokasi,
          as: 'lokasi',
          attributes: ['id_lokasi', 'nama_lokasi'],
          required: false,
        },
      ],
      where: {},
    };

    if (data?.id_lokasi) {
      query.where.id_lokasi = data.id_lokasi;
    }

    if (data?.is_active !== undefined) {
      query.where.is_active = data.is_active;
    }

    return Model.findAll(query);
  }

  /**
   * Pagination list dengan pencarian keyword
   */
  public index(data: any) {
    let query: any = {
      order: [['created_at', 'DESC']],
      offset: data?.offset || 0,
      limit: data?.limit || 10,
      include: [
        {
          model: Lokasi,
          as: 'lokasi',
          attributes: ['id_lokasi', 'nama_lokasi'],
          required: false,
        },
      ],
      where: {},
    };

    if (data?.keyword) {
      query.where[Op.or] = [
        { nama_area: { [Op.like]: `%${data.keyword}%` } },
        { keterangan: { [Op.like]: `%${data.keyword}%` } },
      ];
    }

    return Model.findAndCountAll(query);
  }

  /**
   * Mengambil satu data berdasarkan kondisi tertentu
   */
  public detail(condition: any) {
    return Model.findOne({
      where: { ...condition },
      include: [{ model: Lokasi, as: 'lokasi' }],
    });
  }

  /**
   * CREATE dengan Logic Versioning & Auto-Deactivate
   * Memenuhi Rules:
   * 1. Hanya satu yang aktif per lokasi
   * 2. Perubahan menaikkan versi
   * 3. Menonaktifkan versi lama
   */
  public async create(data: any) {
    const payload = data.payload;

    // Menggunakan transaksi agar proses update & insert konsisten
    const transaction: Transaction = await sequelize.transaction();

    try {
      // 1. Cari versi terakhir untuk lokasi tersebut
      const lastEntry = await Model.findOne({
        where: { id_lokasi: payload.id_lokasi },
        order: [['versi', 'DESC']],
        transaction,
        raw: true,
      });

      const nextVersion = lastEntry ? (lastEntry.versi || 0) + 1 : 1;
      // 2. Nonaktifkan area geo lama yang masih aktif untuk lokasi ini
      await Model.update(
        { is_active: false },
        {
          where: {
            id_lokasi: payload.id_lokasi,
            is_active: true,
          },
          transaction,
        }
      );

      // 3. Buat entitas baru sebagai versi terbaru
      const newArea = await Model.create(
        {
          ...payload,
          versi: nextVersion,
          is_active: true, // Selalu aktif saat baru dibuat
        },
        { transaction }
      );

      await transaction.commit();
      return newArea;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Update digunakan untuk koreksi data minor (seperti keterangan)
   * Jika mengubah struktur Geo (Lat/Long/Polygon), sebaiknya gunakan create() untuk memicu versi baru
   */
  public async update(data: any) {
    const { payload, condition } = data;
    const transaction: Transaction = await sequelize.transaction();

    try {
      // 1. Ambil data yang akan diupdate untuk mendapatkan id_lokasi
      const existing = await Model.findOne({
        where: condition,
        transaction,
        raw: true,
      });
      if (!existing) throw new Error('Data tidak ditemukan');

      // 2. Jika payload mencoba mengaktifkan area (is_active: true)
      if (payload.is_active === true || payload.is_active === 1) {
        // Nonaktifkan semua area lain di lokasi yang sama
        await Model.update(
          { is_active: false },
          {
            where: {
              id_lokasi: existing.id_lokasi,
              id_geo: { [Op.ne]: existing.id_geo }, // Kecuali data ini sendiri
            },
            transaction,
          }
        );
      }

      // 3. Jalankan update utama
      const result = await Model.update(payload, {
        where: condition,
        transaction,
      });

      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Soft delete atau hard delete area
   */
  public delete(data: any) {
    return Model.destroy({
      where: data?.condition,
    });
  }

  /**
   * Helper: Mendapatkan area yang sedang aktif untuk satu lokasi
   */
  public findActiveByLokasi(id_lokasi: string) {
    return Model.findOne({
      where: {
        id_lokasi,
        is_active: true,
      },
    });
  }
}

export const repository = new GeoAreaRepository();
