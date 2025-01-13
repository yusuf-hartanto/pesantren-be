'use strict';

import { uuid } from 'uuidv4';
import { DataTypes } from 'sequelize';
import conn from '../../config/database';
import Province from './provinces.model';

const Model = conn.sequelize.define(
  'area_regencies',
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true,
    },
    area_province_id: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
  },
  {
    createdAt: false,
    updatedAt: false,
    freezeTableName: true,
  }
);

Model.beforeCreate((area_provinces: { id: string; }) => area_provinces.id = uuid());

Model.belongsTo(Province, {
  as: 'province',
  targetKey: 'id',
  foreignKey: 'area_province_id',
});

export default Model;
