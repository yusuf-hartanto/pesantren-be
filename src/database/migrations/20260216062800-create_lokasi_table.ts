'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  try {
    console.log('--- Memulai Migrasi: create_lokasi_table ---');

    await queryInterface.createTable('lokasi', {
      id_lokasi: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
        unique: true,
      },
      nama_lokasi: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      jenis_lokasi: {
        type: DataTypes.ENUM(
          'Cabang',
          'Asrama',
          'Kamar',
          'Masjid',
          'AreaMasjid',
          'SekolahFormal',
          'SekolahMDA',
          'RuangKelas',
          'RuangGuru',
          'RuangTU',
          'Perpustakaan',
          'Laboratorium',
          'GuestHouse',
          'Klinik',
          'UKS',
          'Dapur',
          'Kantin',
          'Koperasi',
          'Kantor',
          'Aula',
          'Gudang',
          'Lapangan',
          'Parkiran',
          'PosSatpam',
          'RuangRapat',
          'RuangSerbaguna',
          'Taman',
          'AreaUmum',
          'RuangMakan',
          'Lahan',
          'Workshop',
          'Studio',
          'RuangIT',
          'GedungLain',
          'AreaLain'
        ),
        allowNull: false,
      },
      parent_id: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'lokasi',
          key: 'id_lokasi',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      id_cabang: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'cabang', // Pastikan tabel 'cabang' sudah ada sebelumnya
          key: 'id_cabang',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      map_zoom: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      kode_lokasi: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
      },
      qr_code: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      kapasitas: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      lantai: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: queryInterface.sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    console.log('--- Migrasi Berhasil: Tabel lokasi dibuat ---');
  } catch (error) {
    console.error('--- Migrasi Gagal: create_lokasi_table ---');
    console.error('Pesan Error:', error);
    throw error; // Melempar error agar Sequelize CLI mencatatnya sebagai kegagalan
  }
};

export const down = async (queryInterface: QueryInterface) => {
  try {
    await queryInterface.dropTable('lokasi');
    console.log('--- Rollback Berhasil: Tabel lokasi dihapus ---');
  } catch (error) {
    console.error('--- Rollback Gagal: drop_lokasi_table ---');
    console.error(error);
    throw error;
  }
};
