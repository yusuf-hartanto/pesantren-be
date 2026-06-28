'use strict';

import { Op, Sequelize } from 'sequelize';
import moment from 'moment';
import Model from './absen.harian.santri.model';
import PenempatanKamarSantri from '../penempatan.kamar.santri/penempatan.kamar.santri.model'; // Sesuaikan path asli Anda
import AppSantri from '../santri/santri.model';
import Lokasi from '../location/location.model';
import ShiftPresensi from '../shift.presensi/shift.presensi.model';
import Pegawai from '../pegawai/pegawai.model';
import AppResource from '../resource/resource.model';

export default class Repository {
  /**
   * Mengambil daftar santri yang aktif di kamar tertentu pada tanggal tertentu
   */
  public async getActiveSantriByKamar(
    id_lokasi_kamar: string,
    tanggal: string
  ) {
    const targetDate = moment(tanggal).format('YYYY-MM-DD');

    return await PenempatanKamarSantri.findAll({
      where: {
        id_lokasi: id_lokasi_kamar,
        status: 'Aktif',
        is_deleted: false,
        tanggal_masuk: { [Op.lte]: targetDate },
        [Op.or]: [
          { tanggal_keluar: null },
          { tanggal_keluar: { [Op.gte]: targetDate } },
        ],
      },
      include: [
        {
          model: AppSantri,
          as: 'santri',
          where: { status: 1 }, // Santri dengan status aktif
          attributes: ['id_santri', 'fullname', 'nis', 'gender'],
        },
      ],
      order: [[{ model: AppSantri, as: 'santri' }, 'fullname', 'ASC']],
    });
  }

  /**
   * Mencari Shift Presensi kategori ASRAMA berdasarkan window waktu_absen.
   * Jika ada > 1 shift cocok, dipilih yang memiliki durasi paling kecil (prioritas).
   */
  public async findMatchingAsramaShift(waktu_absen: string) {
    const time = moment(waktu_absen, 'HH:mm:ss').format('HH:mm:ss');

    const matchingShifts = await ShiftPresensi.findAll({
      where: {
        kategori_shift: 'ASRAMA',
        status: 'Aktif',
        waktu_mulai: { [Op.lte]: time },
        waktu_selesai: { [Op.gte]: time },
      },
    });

    if (matchingShifts.length === 0) return null;
    if (matchingShifts.length === 1) return matchingShifts[0];

    // Jika lebih dari 1 shift cocok, hitung durasi terkecil (waktu_selesai - waktu_mulai)
    return matchingShifts.reduce((shortest, current) => {
      const startShortest = moment(shortest.waktu_mulai, 'HH:mm:ss');
      const endShortest = moment(shortest.waktu_selesai, 'HH:mm:ss');
      const durationShortest = moment
        .duration(endShortest.diff(startShortest))
        .asMinutes();

      const startCurrent = moment(current.waktu_mulai, 'HH:mm:ss');
      const endCurrent = moment(current.waktu_selesai, 'HH:mm:ss');
      const durationCurrent = moment
        .duration(endCurrent.diff(startCurrent))
        .asMinutes();

      return durationCurrent < durationShortest ? current : shortest;
    });
  }

  public async findAllAsramaShift() {
    const allActiveAsramaShifts = await ShiftPresensi.findAll({
      where: {
        kategori_shift: 'ASRAMA',
        status: 'Aktif',
      },
    });

    return allActiveAsramaShifts;
  }

  /**
   * Validasi apakah santri memiliki penempatan aktif di kamar & tanggal yang dimaksud
   */
  public async checkSantriKamarValidity(
    id_santri: string,
    id_lokasi_kamar: string,
    tanggal: string
  ) {
    const targetDate = moment(tanggal).format('YYYY-MM-DD');

    return await PenempatanKamarSantri.findOne({
      where: {
        id_santri,
        id_lokasi: id_lokasi_kamar,
        status: 'Aktif',
        is_deleted: false,
        tanggal_masuk: { [Op.lte]: targetDate },
        [Op.or]: [
          { tanggal_keluar: null },
          { tanggal_keluar: { [Op.gte]: targetDate } },
        ],
      },
    });
  }

  public async checkExistingAbsen(criteria: {
    id_santri: string;
    tanggal: string;
    id_shift_presensi: string | null;
  }) {
    return await Model.findOne({
      where: {
        id_santri: criteria.id_santri,
        tanggal: criteria.tanggal,
        id_shift_presensi: criteria.id_shift_presensi,
      },
    });
  }

  public async detail(condition: { id_absen?: string }) {
    return await Model.findOne({
      where: condition,
      include: [
        {
          model: AppSantri,
          as: 'santri',
          attributes: ['id_santri', 'fullname', 'nis', 'nik', 'gender'],
        },
        {
          model: Lokasi,
          as: 'lokasiKamar',
          attributes: ['id_lokasi', 'nama_lokasi'],
        },
        {
          model: ShiftPresensi,
          as: 'shiftPresensi',
          attributes: [
            'id_shift',
            'nama_shift',
            'waktu_mulai',
            'waktu_selesai',
          ],
        },
        {
          model: Pegawai,
          as: 'petugas',
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: AppResource,
          as: 'resource',
          attributes: ['resource_id', 'full_name'],
        },
      ],
    });
  }

  public async update(data: {
    payload: any;
    condition: { id_absen?: string };
  }) {
    return await Model.update(data.payload, {
      where: data.condition,
    });
  }

  /**
   * Simpan atau update presensi secara massal (Upsert berdasarkan Unique Constraint DB)
   */
  public async upsertBulkAbsen(payloads: any[]) {
    const trx = await Model.sequelize?.transaction();
    try {
      for (const item of payloads) {
        const existing = await Model.findOne({
          where: {
            id_santri: item.id_santri,
            tanggal: item.tanggal,
            id_shift_presensi: item.id_shift_presensi,
            is_deleted: false,
          },
          transaction: trx,
        });

        if (existing) {
          await existing.update(item, { transaction: trx });
        } else {
          await Model.create(item, { transaction: trx });
        }
      }
      await trx?.commit();
      return true;
    } catch (error) {
      await trx?.rollback();
      throw error;
    }
  }

  /**
   * Ambil data history absensi (Standard Index API)
   */
  public async index(data: any) {
    const santriAttributes = ['id_santri', 'fullname', 'nis', 'nik', 'gender'];
    if (data?.isOpenApi) {
      santriAttributes.push(
        'id_santri_sitrendi',
        'id_wali_sitrendi',
        'institution_id_sitrendi'
      );
    }

    const query: any = {
      order: [
        ['tanggal', 'DESC'],
        ['waktu_absen', 'DESC'],
      ],
      offset: data?.offset,
      limit: data?.limit,
      distinct: true,
      include: [
        {
          model: AppSantri,
          as: 'santri',
          attributes: santriAttributes,
        },
        { model: Lokasi, as: 'lokasiKamar', attributes: ['nama_lokasi'] },
        {
          model: ShiftPresensi,
          as: 'shiftPresensi',
          attributes: ['nama_shift'],
        },
        { model: Pegawai, as: 'petugas', attributes: ['nama_lengkap'] },
        {
          model: AppResource,
          as: 'resource',
          attributes: ['resource_id', 'full_name'],
        },
      ],
      where: {
        is_deleted: false,
      },
    };

    // 1. Filter Tanggal (jika data.tanggal dikirim)
    if (data?.tanggal) {
      query.where.tanggal = data.tanggal;
    }

    // 2. Filter Shift Presensi (id_shift)
    if (data?.id_shift_presensi) {
      query.where.id_shift_presensi = data.id_shift_presensi;
    }

    // 3. Filter Lokasi Kamar (id_lokasi)
    if (data?.id_lokasi_kamar) {
      query.where.id_lokasi_kamar = data.id_lokasi_kamar;
    }

    // 4. Filter Status Kehadiran (Hadir, Izin, Sakit, Alfa)
    if (data?.status) {
      query.where.status_kehadiran = data.status;
    }

    // 5. Filter Date Range (tanggal_awal & tanggal_akhir)
    if (data?.tanggal_awal && data?.tanggal_akhir) {
      query.where.tanggal = {
        [Op.between]: [data.tanggal_awal, data.tanggal_akhir],
      };
    }

    // 6. Filter Santri (id_santri SiTrendi dari relasi santri)
    if (data?.id_santri) {
      query.where['$santri.id_santri_sitrendi$'] = data.id_santri;
    }

    // 6. Filter Pencarian Global (Nama / NIS / Keyword)
    if (data?.q) {
      const keyword = `%${data.q.toLowerCase()}%`;
      query.where[Op.or] = [
        Sequelize.where(
          Sequelize.fn('LOWER', Sequelize.col('santri.fullname')),
          {
            [Op.like]: keyword,
          }
        ),
        Sequelize.where(
          Sequelize.fn(
            'LOWER',
            Sequelize.cast(Sequelize.col('santri.nis'), 'TEXT')
          ),
          {
            [Op.like]: keyword,
          }
        ),
      ];
    }

    return await Model.findAndCountAll(query);
  }

  public async findSantriAndRoomByNis(
    nis: string,
    tanggal: string,
    id_lokasi?: string
  ) {
    const targetDate = moment(tanggal).format('YYYY-MM-DD');

    // Susun kondisi default untuk penempatan kamar
    const penempatanWhere: any = {
      status: 'Aktif',
      is_deleted: false,
      tanggal_masuk: { [Op.lte]: targetDate },
      [Op.or]: [
        { tanggal_keluar: null },
        { tanggal_keluar: { [Op.gte]: targetDate } },
      ],
    };

    // Jika id_lokasi dikirim dari controller, kunci langsung di query ini
    if (id_lokasi) {
      penempatanWhere.id_lokasi = id_lokasi;
    }

    return await AppSantri.findOne({
      where: {
        status: 1, // Santri aktif
        [Op.or]: [{ nis: nis }, { kartu_santri_nomor: nis }],
      },
      attributes: ['id_santri', 'fullname', 'nis'],
      include: [
        {
          model: PenempatanKamarSantri,
          as: 'penempatanKamar',
          where: penempatanWhere,
          // Ubah menjadi true agar jika kondisi kamar tidak terpenuhi,
          // query langsung mengembalikan null (tidak tanggung/setengah ketemu)
          required: true,
          attributes: ['id_lokasi'],
        },
      ],
    });
  }

  public async upsertSingleAbsen(payload: any) {
    const existing = await Model.findOne({
      where: {
        id_santri: payload.id_santri,
        tanggal: payload.tanggal,
        id_shift_presensi: payload.id_shift_presensi,
        is_deleted: false,
      },
    });

    if (existing) {
      return await existing.update({
        status_kehadiran: 'Hadir',
        waktu_absen: payload.waktu_absen,
        id_petugas: payload.id_petugas,
        keterangan: 'Hadir via Pindai QR Code',
      });
    }

    return await Model.create(payload);
  }

  /**
   * Tarik data log absensi untuk keperluan Export Excel biasa
   */
  public async listForExport(params: {
    q?: string;
    id_lokasi_kamar?: string;
    id_shift_presensi?: string;
    tanggal?: string;
    status?: string;
    isTemplate?: boolean;
    limit?: number;
    tanggal_awal?: string;
    tanggal_akhir?: string;
  }) {
    const {
      q,
      id_lokasi_kamar,
      id_shift_presensi,
      tanggal,
      status,
      isTemplate,
      limit,
      tanggal_awal,
      tanggal_akhir,
    } = params;

    let whereClause: any = {
      is_deleted: false,
    };

    if (!isTemplate) {
      // 1. Filter Tanggal
      if (tanggal) {
        whereClause.tanggal = tanggal;
      }

      // 2. Filter Shift Presensi
      if (id_shift_presensi) {
        whereClause.id_shift_presensi = id_shift_presensi;
      }

      // 3. Filter Lokasi Kamar
      if (id_lokasi_kamar) {
        whereClause.id_lokasi_kamar = id_lokasi_kamar;
      }

      // 4. Filter Status Kehadiran
      if (status) {
        whereClause.status_kehadiran = status;
      }

      // 5. Filter Date Range (tanggal_awal & tanggal_akhir)
      if (tanggal_awal && tanggal_akhir) {
        whereClause.tanggal = {
          [Op.between]: [tanggal_awal, tanggal_akhir],
        };
      }

      // 6. Filter Pencarian Global (Nama / NIS)
      if (q) {
        const keyword = `%${q.toLowerCase()}%`;
        whereClause[Op.or] = [
          Sequelize.where(
            Sequelize.fn('LOWER', Sequelize.col('santri.fullname')),
            {
              [Op.like]: keyword,
            }
          ),
          Sequelize.where(
            Sequelize.fn(
              'LOWER',
              Sequelize.cast(Sequelize.col('santri.nis'), 'TEXT')
            ),
            {
              [Op.like]: keyword,
            }
          ),
        ];
      }
    }

    return await Model.findAll({
      where: whereClause,
      limit: limit || (isTemplate ? 5 : undefined),
      subQuery: false,
      include: [
        { model: AppSantri, as: 'santri', attributes: ['fullname', 'nis'] },
        {
          model: Lokasi,
          as: 'lokasiKamar',
          attributes: ['id_lokasi', 'nama_lokasi'],
        },
        {
          model: ShiftPresensi,
          as: 'shiftPresensi',
          attributes: ['id_shift', 'nama_shift'],
        },
        {
          model: Pegawai,
          as: 'petugas',
          attributes: ['id_pegawai', 'nama_lengkap'],
        },
        {
          model: AppResource,
          as: 'resource',
          attributes: ['resource_id', 'full_name'],
        },
      ],
      order: [
        ['tanggal', 'DESC'],
        [{ model: AppSantri, as: 'santri' }, 'fullname', 'ASC'],
      ],
    });
  }

  /**
   * Menyediakan data penempatan kamar aktif saat admin mengunduh opsi "Template Kosongan"
   */
  public async listSantriActiveForTemplate(params: {
    id_lokasi_kamar?: string;
    tanggal?: string;
  }) {
    const targetDate = params.tanggal
      ? moment(params.tanggal).format('YYYY-MM-DD')
      : moment().format('YYYY-MM-DD');
    let condition: any = {
      status: 'Aktif',
      is_deleted: false,
      tanggal_masuk: { [Op.lte]: targetDate },
      [Op.or]: [
        { tanggal_keluar: null },
        { tanggal_keluar: { [Op.gte]: targetDate } },
      ],
    };

    if (params.id_lokasi_kamar) condition.id_lokasi = params.id_lokasi_kamar;

    return await PenempatanKamarSantri.findAll({
      where: condition,
      include: [
        {
          model: AppSantri,
          as: 'santri',
          where: { status: 1 },
          attributes: ['fullname', 'nis'],
        },
        { model: Lokasi, as: 'lokasi', attributes: ['nama_lokasi'] },
      ],
    });
  }

  /**
   * Membantu mencari data santri murni berbasis NIS saja saat proses pembacaan file Import
   */
  public async findSantriByNisOnly(nis: string) {
    return await AppSantri.findOne({
      where: { nis: nis, status: 1 },
      attributes: ['id_santri', 'fullname', 'nis'],
    });
  }
}

export const repository = new Repository();
