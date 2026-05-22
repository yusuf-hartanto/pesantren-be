'use strict';

export class Variable {
  /**
   * Kolom yang diizinkan untuk diisi (Whitelist)
   * Termasuk field wilayah dan field hasil kalkulasi (umur)
   */
  public fillable() {
    return [
      'id_pegawai',
      'nik',
      'nip',
      'nama_lengkap',
      'email',
      'no_hp',
      'jenis_kelamin',
      'tempat_lahir',
      'tanggal_lahir',
      'umur', // Diizinkan karena dihitung di Controller
      'alamat',

      // Hierarki Wilayah
      'province_id',
      'city_id',
      'district_id',
      'sub_district_id',

      // Kepegawaian
      'pendidikan',
      'bidang_ilmu',
      'id_orgunit',
      'id_jabatan',
      'status_pegawai',
      'tmt',
      'foto',

      // Timestamps (Opsional, biasanya ditangani Sequelize)
      'created_at',
      'updated_at',
    ];
  }
}

export const variable = new Variable();
