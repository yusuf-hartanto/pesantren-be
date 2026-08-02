'use strict';

import { QueryInterface, DataTypes } from 'sequelize';

export const up = async (queryInterface: QueryInterface) => {
  const transaction = await queryInterface.sequelize.transaction();
  try {
    await queryInterface.createTable(
      'kesehatan_santri',
      {
        id_kesehatan: {
          type: DataTypes.STRING(255),
          primaryKey: true,
          allowNull: false,
        },
        id_santri: {
          type: DataTypes.STRING(255),
          allowNull: true,
          references: {
            model: 'santri',
            key: 'id_santri',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        id_pegawai: {
          type: DataTypes.STRING(255),
          allowNull: true,
          references: {
            model: 'pegawai',
            key: 'id_pegawai',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        id_petugas: {
          type: DataTypes.STRING(255),
          allowNull: true,
          references: {
            model: 'app_resource',
            key: 'resource_id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'RESTRICT',
        },
        tanggal_event: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: queryInterface.sequelize.literal('NOW()'),
        },
        kategori_sakit: {
          type: DataTypes.ENUM('Ringan', 'Sedang', 'Berat'),
          allowNull: false,
        },
        progres_status: {
          type: DataTypes.ENUM('Selesai', 'Dirawat', 'Dirujuk'),
          allowNull: false,
        },
        keluhan: {
          type: DataTypes.TEXT,
          allowNull: false,
        },
        tindakan: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        obat_diberikan: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        tanggal_mulai_rawat: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        tempat_dirawat: {
          type: DataTypes.STRING(100),
          allowNull: true,
        },
        estimasi_hari: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
        tanggal_dirujuk: {
          type: DataTypes.DATE,
          allowNull: true,
        },
        tempat_rujukan: {
          type: DataTypes.STRING(150),
          allowNull: true,
        },
        perizinan_id: {
          type: DataTypes.STRING(255),
          allowNull: true,
          references: {
            model: 'perizinan_santri',
            key: 'id_izin',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        sumber_pengajuan: {
          type: DataTypes.ENUM('Kesehatan'),
          allowNull: true,
        },
        izin_auto_created: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        keterangan: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        created_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: queryInterface.sequelize.literal('NOW()'),
        },
        updated_at: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: queryInterface.sequelize.literal('NOW()'),
        },
        is_deleted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        deleted_at: {
          type: DataTypes.DATE,
          allowNull: true,
        },
      },
      { transaction }
    );

    await queryInterface.sequelize.query(
      `
      ALTER TABLE kesehatan_santri
      ADD CONSTRAINT chk_subject CHECK (
        (id_santri IS NOT NULL AND id_pegawai IS NULL)
        OR (id_santri IS NULL AND id_pegawai IS NOT NULL)
      );
    `,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `
      ALTER TABLE kesehatan_santri
      ADD CONSTRAINT chk_rawat CHECK (
        (progres_status = 'Dirawat' AND tanggal_mulai_rawat IS NOT NULL)
        OR progres_status <> 'Dirawat'
      );
    `,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `
      ALTER TABLE kesehatan_santri
      ADD CONSTRAINT chk_rujuk CHECK (
        (progres_status = 'Dirujuk' AND tanggal_dirujuk IS NOT NULL AND tempat_rujukan IS NOT NULL)
        OR progres_status <> 'Dirujuk'
      );
    `,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `
      ALTER TABLE kesehatan_santri
      ADD CONSTRAINT chk_estimasi CHECK (
        estimasi_hari IS NULL
        OR estimasi_hari BETWEEN 1 AND 30
      );
    `,
      { transaction }
    );

    await queryInterface.sequelize.query(
      `
      ALTER TABLE kesehatan_santri
      ADD CONSTRAINT chk_soft_delete CHECK (
        (is_deleted = TRUE AND deleted_at IS NOT NULL)
        OR is_deleted = FALSE
      );
    `,
      { transaction }
    );

    await queryInterface.addIndex('kesehatan_santri', ['id_santri'], {
      name: 'idx_kesehatan_santri',
      transaction,
    });
    await queryInterface.addIndex('kesehatan_santri', ['id_pegawai'], {
      name: 'idx_kesehatan_pegawai_patient',
      transaction,
    });
    await queryInterface.addIndex('kesehatan_santri', ['id_petugas'], {
      name: 'idx_kesehatan_petugas',
      transaction,
    });
    await queryInterface.addIndex('kesehatan_santri', ['tanggal_event'], {
      name: 'idx_kesehatan_event',
      transaction,
    });
    await queryInterface.addIndex(
      'kesehatan_santri',
      ['id_santri', 'progres_status'],
      {
        name: 'idx_kesehatan_santri_progres',
        transaction,
      }
    );
    await queryInterface.addIndex(
      'kesehatan_santri',
      ['id_pegawai', 'progres_status'],
      {
        name: 'idx_kesehatan_pegawai_progres',
        transaction,
      }
    );
    await queryInterface.addIndex('kesehatan_santri', ['perizinan_id'], {
      name: 'idx_kesehatan_izin',
      transaction,
    });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export const down = async (queryInterface: QueryInterface) => {
  await queryInterface.dropTable('kesehatan_santri');
};
