'use strict';

export default class Variable {
  public fillable() {
    const field: Array<string> = [
      'id_inspeksi',
      'id_lokasi',
      'id_petugas',
      'id_geo',
      'qr_code',
      'scan_latitude',
      'scan_longitude',
      'jarak_meter',
      'valid_qr',
      'valid_geo',
      'metode_scan',
      'scan_source',
      'user_agent',
      'ip_address',
      'scan_at',
      'keterangan',
    ];
    return field;
  }
}

export const variable = new Variable();
