'use strict';

import { v4 as uuidv4 } from 'uuid';
import { DataTypes, Model, Sequelize } from 'sequelize';

export class ProgramPesantren extends Model {
  public id_program!: string;
  public nama_program!: string;
  public tipe_program!: string;
  public wajib!: string;
  public aktif!: string;
}

export function initProgramPesantren(sequelize: Sequelize) {
  ProgramPesantren.init(
    {
      id_program: {
        type: DataTypes.STRING,
        primaryKey: true,
        unique: true,
      },
      nama_program: {
        type: DataTypes.STRING(255),
        unique: true,
      },
      tipe_program: {
        type: DataTypes.ENUM(
          'Bahasa',
          'Quran',
          'Ibadah',
          'Kepemimpinan',
          'Lainnya'
        ),
      },
      wajib: {
        type: DataTypes.SMALLINT,
      },
      aktif: {
        type: DataTypes.ENUM('Ya', 'Tidak'),
      },
    },
    {
      sequelize,
      modelName: 'ProgramPesantren',
      tableName: 'program_pesantren',
      timestamps: false,
    }
  );

  ProgramPesantren.beforeCreate((row) => {
    row?.setDataValue('id_program', uuidv4());
  });

  return ProgramPesantren;
}

export default ProgramPesantren;
