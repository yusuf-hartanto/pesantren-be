'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';
import Cabang from '../cabang/cabang.model';

export class Asrama extends Model {
  declare id_asrama: string;
  declare nama_asrama: string;
  declare jumlah_kamar: number;
  declare keterangan: string;
  declare created_at: Date;
  declare updated_at: Date;

  // Relasi
  declare cabang?: Cabang[];
}

export function initAsrama(sequelize: Sequelize) {
  Asrama.init(
    {
      id_asrama: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      nama_asrama: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      jumlah_kamar: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      id_cabang: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      keterangan: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      created_at: {
        type: DataTypes.DATE,
        get() {
          const value = this.getDataValue('created_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value
            ? moment(value).format('YYYY-MM-DD HH:mm:ss')
            : null;
          this.setDataValue('created_at', formattedValue);
        },
      },
      updated_at: {
        type: DataTypes.DATE,
        get() {
          const value = this.getDataValue('updated_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value
            ? moment(value).format('YYYY-MM-DD HH:mm:ss')
            : null;
          this.setDataValue('updated_at', formattedValue);
        },
      },
    },
    {
      sequelize,
      modelName: 'Asrama',
      tableName: 'asrama',
      timestamps: false,
    }
  );

  // UUID Otomatis sebelum create
  Asrama.beforeCreate((asrama) => {
    asrama?.setDataValue('id_asrama', uuidv4());
  });

  Asrama.beforeBulkCreate((asramaInstances) => {
    asramaInstances.forEach((asrama) => {
      asrama.setDataValue('id_asrama', uuidv4());
    });
  });

  return Asrama;
}

export function associateAsrama() {
  Asrama.belongsTo(Cabang, {
    foreignKey: 'id_cabang',
    as: 'cabang',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
  });
}

export default Asrama;
