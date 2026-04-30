import { Model, DataTypes, Optional, Sequelize } from 'sequelize';
import { v4 as uuidv4 } from 'uuid';
import Lokasi from '../location/location.model';

// 1. Definisikan Interface untuk atribut Model
interface GeoAreaAttributes {
  id_geo: string;
  id_lokasi: string | null;
  nama_area: string;
  tipe_geo: 'POINT' | 'CIRCLE' | 'POLYGON';
  latitude?: number | null;
  longitude?: number | null;
  radius_meter?: number | null;
  polygon_json?: object | null;
  toleransi_meter?: number | null;
  is_active?: boolean | null;
  versi?: number | null;
  keterangan?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

// 2. Tentukan atribut mana yang opsional saat proses 'create'
interface GeoAreaCreationAttributes extends Optional<GeoAreaAttributes, 'id_geo' | 'created_at' | 'updated_at'> { }

// 3. Class Model
class GeoArea extends Model<GeoAreaAttributes, GeoAreaCreationAttributes> implements GeoAreaAttributes {
  public id_geo!: string;
  public id_lokasi!: string | null;
  public nama_area!: string;
  public tipe_geo!: 'POINT' | 'CIRCLE' | 'POLYGON';
  public latitude!: number | null;
  public longitude!: number | null;
  public radius_meter!: number | null;
  public polygon_json!: object | null;
  public toleransi_meter!: number | null;
  public is_active!: boolean | null;
  public versi!: number | null;
  public keterangan!: string | null;

  // timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

// 4. Inisialisasi Model
export function initGeoArea(sequelize: Sequelize) {
  GeoArea.init(
    {
      id_geo: {
        type: DataTypes.STRING, // Menggunakan STRING untuk menampung UUID
        primaryKey: true,
      },
      id_lokasi: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
          model: 'lokasi',
          key: 'id_lokasi',
        },
      },
      nama_area: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      tipe_geo: {
        type: DataTypes.ENUM('POINT', 'CIRCLE', 'POLYGON'),
        allowNull: false,
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      longitude: {
        type: DataTypes.DECIMAL(10, 7),
        allowNull: true,
      },
      radius_meter: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      polygon_json: {
        type: DataTypes.JSONB, // Menggunakan JSONB untuk fleksibilitas koordinat POLYGON
        allowNull: true,
      },
      toleransi_meter: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      versi: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
      keterangan: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'geo_areas',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    }
  );

  // Hooks untuk otomatisasi UUID
  GeoArea.beforeCreate((geoArea) => {
    geoArea?.setDataValue('id_geo', uuidv4());
  });

  GeoArea.beforeBulkCreate((geoAreaInstances) => {
    geoAreaInstances.forEach((geoArea) => {
      geoArea.setDataValue('id_geo', uuidv4());
    });
  });

  return GeoArea;
}

// 5. Definisi Relasi
export function associateGeoArea() {
  GeoArea.belongsTo(Lokasi, { 
    foreignKey: 'id_lokasi', 
    as: 'lokasi',
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE'
  });
}

export default GeoArea;