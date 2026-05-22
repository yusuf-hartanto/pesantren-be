'use strict';

import { v4 as uuidv4 } from 'uuid';
import Resource from '../app/resource/resource.model';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class ActivityLog extends Model {
  declare id: string;
  declare username: string;
  declare table_name: string;
  declare record_id: string;
  declare action: string;
  declare before_data: JSON;
  declare after_data: number | null;
  declare created_at: string;
}

export function initActivityLog(sequelize: Sequelize) {
  ActivityLog.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      username: {
        type: DataTypes.STRING,
      },
      table_name: {
        type: DataTypes.STRING,
      },
      record_id: {
        type: DataTypes.STRING,
      },
      action: {
        type: DataTypes.STRING,
      },
      before_data: {
        type: DataTypes.JSONB,
      },
      after_data: {
        type: DataTypes.JSONB,
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'ActivityLog',
      tableName: 'activity_logs',
      timestamps: false,
    }
  );

  ActivityLog.beforeCreate((activity_logs) => {
    activity_logs?.setDataValue('id', uuidv4());
  });

  return ActivityLog;
}

export function associateActivityLog() {
  ActivityLog.belongsTo(Resource, {
    as: 'resource',
    foreignKey: 'username',
  });
}

export default ActivityLog;
