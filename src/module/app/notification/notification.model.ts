'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import AppResource from '../resource/resource.model';

export class Notification extends Model {
  declare id_notification: string;
  declare from: string;
  declare to: string;
  declare title: string;
  declare type: string;
  declare url: string;
  declare message: string;
  declare status: number;
}

export function initNotification(sequelize: Sequelize) {
  Notification.init(
    {
      id_notification: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      from: {
        type: DataTypes.STRING,
      },
      to: {
        type: DataTypes.STRING,
      },
      title: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.STRING,
      },
      url: {
        type: DataTypes.STRING,
      },
      message: {
        type: DataTypes.TEXT,
      },
      status: {
        type: DataTypes.SMALLINT,
        allowNull: true,
        defaultValue: 0,
      },
    },
    {
      sequelize,
      modelName: 'Notification',
      tableName: 'notifications',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  Notification.beforeCreate((row) => {
    row?.setDataValue('id_notification', uuidv4());
  });

  return Notification;
}

export function associateNotification() {
  Notification.belongsTo(AppResource, {
    as: 'sender',
    foreignKey: 'from',
  });

  Notification.belongsTo(AppResource, {
    as: 'receiver',
    foreignKey: 'to',
  });
}

export default Notification;
