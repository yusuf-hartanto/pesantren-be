'use strict';

export class Variable {
  public fillable() {
    return [
      'id_santri',
      'id_lokasi',
      'id_jam_pelajaran',
      'tanggal',
      'waktu_absen',
      'status_kehadiran',
      'keterangan',
      'id_petugas',
      'is_deleted',
    ];
  }
}

export const variable = new Variable();
