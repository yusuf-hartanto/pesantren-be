'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import moment from 'moment';

export class Cabang extends Model {
  public id_cabang!: string;
  public nama_cabang!: string;
  public nomor_urut!: number;
  public keterangan!: string;
  public alamat!: string;
  public createdAt!: Date;
  public updatedAt!: Date;
}

export function initCabang(sequelize: Sequelize) {
  Cabang.init(
    {
      id_cabang: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      nama_cabang: {
        type: DataTypes.STRING(255),
        unique: true,
      },
      nomor_urut: {
        type: DataTypes.INTEGER,
        unique: true,
      },
      keterangan: {
        type: DataTypes.STRING(255),
      },
      alamat: {
        type: DataTypes.STRING(255),
      },
      created_at: {
        type: DataTypes.DATE,
        get() {
          const value = this.getDataValue('created_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
          this.setDataValue('created_at', formattedValue);
        }
      },
      updated_at: {
        type: DataTypes.DATE,
        get() {
          const value = this.getDataValue('updated_at');
          return value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
        },
        set(value) {
          const formattedValue = value ? moment(value).format('YYYY-MM-DD HH:mm:ss') : null;
          this.setDataValue('updated_at', formattedValue);
        }
      }
    },
    {
      sequelize,
      modelName: 'Cabang',
      tableName: 'cabang',
      timestamps: false
    }
  );

  Cabang.beforeCreate((cabang) => {
    cabang?.setDataValue('id_cabang', uuidv4());
  });

  Cabang.beforeBulkCreate((cabangInstances) => {
    cabangInstances.forEach(cabang => {
      cabang.setDataValue('id_cabang', uuidv4()); // Assign a UUID to each instance
    });
  });
  
  return Cabang;
}

export default Cabang;
