'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';
import ProgramPesantren from '../program.pesantren/program.pesantren.model';

export class SantriProgram extends Model {
  declare id: string;
  declare id_santri: string;
  declare id_program: string;
  declare tgl_mulai: Date;
  declare tgl_selesai: Date;
  declare status: string;
}

export function initSantriProgram(sequelize: Sequelize) {
  SantriProgram.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      id_santri: {
        type: DataTypes.STRING,
      },
      id_program: {
        type: DataTypes.STRING,
      },
      tgl_mulai: {
        type: DataTypes.DATEONLY,
      },
      tgl_selesai: {
        type: DataTypes.DATEONLY,
      },
      status: {
        type: DataTypes.ENUM('Aktif', 'Nonaktif'),
      },
    },
    {
      sequelize,
      modelName: 'SantriProgram',
      tableName: 't_santri_program',
      timestamps: false,
    }
  );

  SantriProgram.beforeCreate((row) => {
    row?.setDataValue('id', uuidv4());
  });

  return SantriProgram;
}

export function associateSantriProgram() {
  SantriProgram.belongsTo(ProgramPesantren, {
    as: 'program_pesantren',
    foreignKey: 'id_program',
  });
}

export default SantriProgram;
