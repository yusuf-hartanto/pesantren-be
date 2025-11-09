'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import Resource from '../app/resource/resource.model';

export class Notif extends Model {
  public id!: string;
  public message!: string;
  public nomor_urut!: number;
  public status!: string;
}

export function initNotif(sequelize: Sequelize) {
  Notif.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      resource_id: {
        type: DataTypes.STRING,
      },
      message: {
        type: DataTypes.STRING(255),
      },
      utl: {
        type: DataTypes.STRING,
      },
      status: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'Notif',
      tableName: 'notif',
      timestamps: false,
    }
  );

  Notif.beforeCreate((notif) => {
    notif?.setDataValue('id_notif', uuidv4());
  });

  return Notif;
}

export function associateNotif() {
  Notif.belongsTo(Resource, {
    as: 'resource',
    foreignKey: 'resource_id',
  });
}

export default Notif;
