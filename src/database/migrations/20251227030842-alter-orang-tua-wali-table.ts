'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc = await queryInterface.describeTable('orang_tua_wali');

    // 1. Tambah kolom keterangan jika belum ada
    if (!tableDesc.keterangan) {
      await queryInterface.addColumn(
        'orang_tua_wali',
        'keterangan',
        {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        { transaction }
      );
    }

    // 2. Change Columns (Postgres otomatis handle ENUM creation jika belum ada)
    await queryInterface.changeColumn(
      'orang_tua_wali',
      'hubungan',
      {
        type: DataTypes.ENUM('Ayah', 'Ibu', 'Wali'),
        allowNull: true,
      },
      { transaction }
    );

    await queryInterface.changeColumn(
      'orang_tua_wali',
      'pendidikan',
      {
        type: DataTypes.ENUM(
          'Tidak Sekolah',
          'SD / MI',
          'SMP / MTs',
          'SMA / MA',
          'SMK',
          'D1',
          'D2',
          'D3',
          'S1',
          'S2',
          'S3',
          'Lainnya'
        ),
        allowNull: true,
      },
      { transaction }
    );

    await queryInterface.changeColumn(
      'orang_tua_wali',
      'pekerjaan',
      {
        type: DataTypes.ENUM(
          'Tidak Bekerja',
          'Ibu Rumah Tangga',
          'Petani',
          'Buruh Harian',
          'Nelayan',
          'Wiraswasta',
          'Pedagang',
          'Karyawan Swasta',
          'PNS',
          'TNI / POLRI',
          'Guru / Dosen',
          'Pekerja Migran',
          'Pensiunan',
          'Lainnya'
        ),
        allowNull: true,
      },
      { transaction }
    );

    // 3. Tambah kolom-kolom baru dengan pengecekan
    const newColumns: any = {
      penghasilan: {
        type: DataTypes.ENUM(
          '< 1 juta',
          '1–2 juta',
          '2–3 juta',
          '3–5 juta',
          '> 5 juta',
          'Tidak berpenghasilan'
        ),
        allowNull: true,
      },
      deleted_at: { allowNull: true, type: DataTypes.DATE },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      province_id: { type: DataTypes.STRING, allowNull: true },
      city_id: { type: DataTypes.STRING, allowNull: true },
      district_id: { type: DataTypes.STRING, allowNull: true },
      sub_district_id: { type: DataTypes.STRING, allowNull: true },
    };

    for (const [colName, config] of Object.entries(newColumns)) {
      if (!tableDesc[colName]) {
        await queryInterface.addColumn(
          'orang_tua_wali',
          colName,
          config as any,
          { transaction }
        );
      }
    }
  });
};

export const down = async (queryInterface: QueryInterface) => {
  return queryInterface.sequelize.transaction(async (transaction) => {
    const tableDesc = await queryInterface.describeTable('orang_tua_wali');

    const columnsToRemove = [
      'keterangan',
      'deleted_at',
      'is_deleted',
      'penghasilan',
      'province_id',
      'city_id',
      'district_id',
      'sub_district_id',
    ];

    for (const col of columnsToRemove) {
      if (tableDesc[col]) {
        await queryInterface.removeColumn('orang_tua_wali', col, {
          transaction,
        });
      }
    }

    // Kembalikan ke STRING
    await queryInterface.changeColumn(
      'orang_tua_wali',
      'pendidikan',
      { type: DataTypes.STRING(255), allowNull: true },
      { transaction }
    );
    await queryInterface.changeColumn(
      'orang_tua_wali',
      'pekerjaan',
      { type: DataTypes.STRING(255), allowNull: true },
      { transaction }
    );
    await queryInterface.changeColumn(
      'orang_tua_wali',
      'hubungan',
      { type: DataTypes.STRING(255), allowNull: true },
      { transaction }
    );

    // Bersihkan ENUM types
    const enums = ['hubungan', 'pendidikan', 'pekerjaan', 'penghasilan'];
    for (const e of enums) {
      await queryInterface.sequelize.query(
        `DROP TYPE IF EXISTS "enum_orang_tua_wali_${e}";`,
        { transaction }
      );
    }
  });
};
