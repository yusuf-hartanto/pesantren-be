import crypto from 'crypto'
import { v4 as uuidv4 } from 'uuid';
import { helper } from '../../helpers/helper';
import { repository as repoSantri } from '../app/santri/santri.repository';
import { repository as repoWali } from '../app/orang.tua.wali/orang.tua.wali.repository';
import { repository as repoInstitution } from '../app/institution/institution.repository';

const BASE_URL = process.env.SITRENDI_URL || ''
const SECRET_KEY = process.env.SITRENDI_SECRET_KEY || ''

interface SyncSantriPayload {
  institution_id: string
}

export default class Service {
  public async syncSantri(payload: SyncSantriPayload) {
    if (!BASE_URL) return 'Belum setup url SiTrendi';
    if (!SECRET_KEY) return 'Belum setup secret_key SiTrendi';

    const timestamp = helper.generateTimestamp();
    const rawBody = JSON.stringify(payload);

    const signature = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(timestamp + rawBody)
      .digest('hex');

    const response = await fetch(`${BASE_URL}/api/open/sync-santri`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': timestamp,
        'X-Signature': signature
      },
      body: rawBody
    });

    const result = await response.json();
    return result;
  }

  public async syncSantriData(data: any[]) {
    /*
    |--------------------------------------------------------------------------
    | INSTITUTION
    |--------------------------------------------------------------------------
    */
    const institutionMap = new Map();
    for (const item of data) {
      if (!institutionMap.has(item.institution_id)) {
        institutionMap.set(item.institution_id, {
          id_institution: uuidv4(),
          institution_id_sitrendi: item.institution_id,
          institution_name: item.institution_name,
          status: item.is_active ? 1 : 0,
        });
      }
    }
    const institution = Array.from(institutionMap.values());
    await repoInstitution.bulkUpsert(institution);

    const institutionDb = await repoInstitution.list();
    const institutionPkMap = new Map(
      institutionDb.map((item: any) => [
        item.institution_id_sitrendi,
        item.id_institution
      ])
    );

    /*
    |--------------------------------------------------------------------------
    | WALI
    |--------------------------------------------------------------------------
    */
    const waliMap = new Map();
    for (const item of data) {
      if (!waliMap.has(item.user_id)) {
        waliMap.set(item.user_id, {
          id_wali: uuidv4(),
          id_wali_sitrendi: item.user_id,
          nama_wali: item.nama_wali,
          no_hp: item.phone_wali,
        });
      }
    }
    const wali = Array.from(waliMap.values());
    await repoWali.bulkUpsert(wali);

    const waliDb = await repoWali.all({});
    const waliPkMap = new Map(
      waliDb.map((item: any) => [
        item.id_wali_sitrendi,
        item.id_wali
      ])
    );

    /*
    |--------------------------------------------------------------------------
    | SANTRI
    |--------------------------------------------------------------------------
    */
    const santriMap = new Map();
    for (const item of data) {
      const key = `${item.id}_${item.institution_id}`;

      if (!santriMap.has(key)) {
        santriMap.set(key, {
          id_santri: uuidv4(),
          fullname: item.full_name,
          nis: item.nis,
          nik: item.identity_number?.trim() || null,
          gender: item.gender,
          birth_place: item.birth_place,
          birth_date: item.birth_date,
          phone: item.phone,

          id_institution: institutionPkMap.get(item.institution_id) || null,
          institution_name: item.institution_name,

          group_code_1: item.group_code_1,
          group_code_2: item.group_code_2,
          group_code_3: item.group_code_3,

          nomor_nasabah: item.nomor_nasabah,
          nomor_rekening: item.nomor_rekening,
          kartu_santri: item.kartu_santri,

          status: item.is_active ? 1 : 0,

          id_santri_sitrendi: item.id,
          institution_id_sitrendi: item.institution_id,
          id_wali_sitrendi: item.user_id,
          id_wali: waliPkMap.get(item.user_id) || null,
        });
      }
    }
    const santri = Array.from(santriMap.values());
    await repoSantri.bulkUpsert(santri);

    return {
      institution: institution.length,
      wali: wali.length,
      santri: santri.length
    };
  }
}

export const service = new Service();