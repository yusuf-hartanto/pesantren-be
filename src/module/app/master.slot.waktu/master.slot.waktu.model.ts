'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class MasterSlotWaktu extends Model {
  declare id_master_slot_waktu: string;
  declare kode_slot: string;
  declare jam_mulai: Date;
  declare jam_selesai: Date;
  declare is_active: boolean;
  declare keterangan: string;
}

export function initMasterSlotWaktu(sequelize: Sequelize) {
  MasterSlotWaktu.init(
    {
      id_master_slot_waktu: {
        type: DataTypes.STRING,
        unique: true,
      },
      kode_slot: {
        type: DataTypes.STRING(255),
        primaryKey: true,
        unique: true,
      },
      jam_mulai: {
        type: DataTypes.TIME,
      },
      jam_selesai: {
        type: DataTypes.TIME,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      keterangan: {
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      modelName: 'MasterSlotWaktu',
      tableName: 'master_slot_waktu',
      timestamps: false,
    }
  );

  MasterSlotWaktu.beforeCreate((row) => {
    row?.setDataValue('id_master_slot_waktu', uuidv4());
  });

  return MasterSlotWaktu;
}

export function associateMasterSlotWaktu() {}

export default MasterSlotWaktu;
