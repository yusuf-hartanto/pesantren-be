'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import KebersihanInspeksi from '../kebersihan.inspeksi/kebersihan.inspeksi.model';

export class KebersihanTemuan extends Model {
  declare id_temuan: string;
  declare id_inspeksi: string;
  declare kategori: string;
  declare deskripsi: string;
  declare tingkat: number;
  declare perlu_tindak_lanjut: boolean;
  declare foto_path: string;
  declare created_at: string;
}

export function initKebersihanTemuan(sequelize: Sequelize) {
  KebersihanTemuan.init(
    {
      id_temuan: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_inspeksi: {
        type: DataTypes.STRING,
      },
      kategori: {
        type: DataTypes.STRING(255),
      },
      deskripsi: {
        type: DataTypes.TEXT,
      },
      tingkat: {
        type: DataTypes.SMALLINT,
      },
      perlu_tindak_lanjut: {
        type: DataTypes.BOOLEAN,
      },
      foto_path: {
        type: DataTypes.TEXT,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'KebersihanTemuan',
      tableName: 'kebersihan_temuan',
      timestamps: false,
    }
  );

  KebersihanTemuan.beforeCreate((row) => {
    row?.setDataValue('id_temuan', uuidv4());
  });

  KebersihanTemuan.beforeBulkCreate((rows) => {
    for (const row of rows) {
      row?.setDataValue('id_temuan', uuidv4());
    }
  });

  return KebersihanTemuan;
}

export function associateKebersihanTemuan() {
  KebersihanTemuan.belongsTo(KebersihanInspeksi, {
    as: 'kebersihan_inspeksi',
    foreignKey: 'id_inspeksi',
  });
}

export default KebersihanTemuan;
