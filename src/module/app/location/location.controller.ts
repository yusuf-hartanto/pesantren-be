import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './location.variable';
import { response } from '../../../helpers/response';
import { repository } from './location.repository';
import { repository as cabangRepo } from '../cabang/cabang.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
  TIMEZONE,
} from '../../../utils/constant';
import { Op, QueryTypes } from 'sequelize';
import { locationSchema, locationUpdateSchema } from './location.schema';
import QRCode from 'qrcode';
import z from 'zod';
import moment from 'moment';
import fs from 'fs/promises';
import ExcelJS from 'exceljs';
import { sequelize } from '../../../database/connection';
import crypto from 'crypto';
import { rawQuery } from '../../../helpers/rawQuery';

const generateDataExcel = (
  sheet: any,
  details: any,
  isTemplate: boolean = false
) => {
  // Definisikan susunan teks header persis di baris pertama
  sheet.addRow([
    'No',
    'Kode Lokasi',
    'Nama Lokasi',
    'Jenis Lokasi',
    'Induk (Nama/ID)',
    'Cabang (Nama/ID)',
    'Latitude',
    'Longitude',
    'Map Zoom',
    'Kapasitas',
    'Lantai',
    'Keterangan',
  ]);

  // Set property metadata kolom (width disesuaikan agar proporsional)
  sheet.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Kode Lokasi', key: 'kode_lokasi', width: 18 },
    { header: 'Nama Lokasi', key: 'nama_lokasi', width: 30 },
    { header: 'Jenis Lokasi', key: 'jenis_lokasi', width: 15 },
    { header: 'Induk (Nama/ID)', key: 'parent_id', width: 25 },
    { header: 'Cabang (Nama/ID)', key: 'id_cabang', width: 25 },
    { header: 'Latitude', key: 'latitude', width: 15 },
    { header: 'Longitude', key: 'longitude', width: 15 },
    { header: 'Map Zoom', key: 'map_zoom', width: 12 },
    { header: 'Kapasitas', key: 'kapasitas', width: 12 },
    { header: 'Lantai', key: 'lantai', width: 12 },
    { header: 'Keterangan', key: 'keterangan', width: 35 },
  ];

  // Styling Header Baris Pertama
  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    // Jika ingin memberikan warna abu-abu pada header, buka baris di bawah ini:
    // cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E0E0' } };
  });

  // Perulangan Data menggunakan gaya indeks array (for...in) & Logika IsTemplate
  for (let i in details) {
    // Logika spacing/indentasi hierarki untuk nama lokasi (hanya berlaku jika bukan template)
    let spacing: string =
      !isTemplate && details[i].__level
        ? '    '.repeat(details[i].__level)
        : '';

    sheet.addRow([
      parseInt(i) + 1,
      details[i]?.kode_lokasi || '',
      spacing + (details[i]?.nama_lokasi || ''),
      details[i]?.jenis_lokasi || '',
      // Logika Induk & Cabang: Jika template, keluarkan ID untuk mempermudah import ulang. Jika bukan, keluarkan Nama.
      isTemplate
        ? details[i]?.parent_id || ''
        : details[i]?.parent?.nama_lokasi || '',
      isTemplate
        ? details[i]?.id_cabang || ''
        : details[i]?.cabang?.nama_cabang || '',
      details[i]?.latitude || '',
      details[i]?.longitude || '',
      details[i]?.map_zoom || '',
      details[i]?.kapasitas || 0,
      details[i]?.lantai || '',
      details[i]?.keterangan || '',
    ]);
  }

  // Pemberian Border secara paksa ke seluruh cell yang aktif
  const columnCount = sheet.columns.length;

  for (let row = 1; row <= (details?.length || 0) + 1; row++) {
    const currentRow = sheet.getRow(row);

    for (let col = 1; col <= columnCount; col++) {
      const cell = currentRow.getCell(col);
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } },
      };
    }
  }

  return sheet;
};

const normalizeRow = (row: any) => ({
  kode_lokasi: String(row['Kode Lokasi'] || '').trim(),
  nama_lokasi: String(row['Nama Lokasi'] || '').trim(),
  jenis_lokasi: String(row['Jenis Lokasi'] || '').trim(),
  nama_parent: String(row['Induk (Nama/ID)'] || '').trim(),
  nama_cabang: String(row['Cabang (Nama/ID)'] || '').trim(),
  latitude: row['Latitude'] ? String(row['Latitude']) : null,
  longitude: row['Longitude'] ? String(row['Longitude']) : null,
  map_zoom: row['Map Zoom'] ? Number(row['Map Zoom']) : 15,
  kapasitas: row['Kapasitas'] ? Number(row['Kapasitas']) : 0,
  lantai: String(row['Lantai'] || '').trim(),
  keterangan: String(row['Keterangan'] || '').trim(),
  __row: row.__row,
});

const buildLocationTree = (data: any[]): any[] => {
  const map = new Map<string, any>();
  data.forEach((item) => map.set(item.id_lokasi, { ...item, children: [] }));
  const tree: any[] = [];
  map.forEach((item) => {
    if (!item.parent_id) tree.push(item);
    else {
      const parent = map.get(item.parent_id);
      if (parent) parent.children.push(item);
    }
  });
  return tree;
};

const flattenLocationTree = (datas: any[], level = 0): any[] => {
  let result: any[] = [];
  datas.forEach((data) => {
    result.push({ ...data, __level: level });
    if (data.children?.length) {
      result = result.concat(flattenLocationTree(data.children, level + 1));
    }
  });
  return result;
};

export const generateRandomString = (
  _input: string,
  length: number = 12
): string => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  const randomBytes = crypto.randomBytes(length);

  for (let i = 0; i < length; i++) {
    result += characters.charAt(randomBytes[i] % characters.length);
  }

  return result;
};

export default class Controller {
  constructor() {
    // Lakukan binding di sini
    this.create = this.create.bind(this);
    this.getParentCodes = this.getParentCodes.bind(this);
    this.generateInitial = this.generateInitial.bind(this);
    this.import = this.import.bind(this);
  }

  public async list(req: Request, res: Response) {
    try {
      const jenis_lokasi: any = req?.query?.jenis_lokasi || '';
      const orderWithParent: any = req?.query?.orderWithParent || '';
      const all_cabang = req?.query?.all_cabang === 'true';
      const result = await repository.list({
        jenis_lokasi,
        orderWithParent,
        all_cabang,
      });
      if (result?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`Lokasi list: ${err?.message}`, 500, res);
    }
  }

  public async index(req: Request, res: Response) {
    try {
      const query = helper.fetchQueryRequest(req);
      const { count, rows } = await repository.index(query);
      if (rows?.length < 1)
        return response.success(NOT_FOUND, null, res, false);
      return response.success(
        SUCCESS_RETRIEVED,
        { total: count, values: rows },
        res
      );
    } catch (err: any) {
      return helper.catchError(`Lokasi index: ${err?.message}`, 500, res);
    }
  }

  public async detail(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';
      let result: any = await repository.detail({ id_lokasi: id });

      if (!result) return response.success(NOT_FOUND, null, res, false);

      result = result.get({ plain: true });

      const qrBase64 = await QRCode.toDataURL(result.kode_lokasi, {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 2,
      });

      result.qr_code_base64 = qrBase64;

      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`Lokasi detail: ${err?.message}`, 500, res);
    }
  }

  private generateInitial(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase())
      .join('')
      .replace(/[^A-Z]/g, ''); // Pastikan hanya karakter alfabet
  }

  private async getParentCodes(parentId: string | null): Promise<string> {
    if (!parentId) return '';

    const parent: any = await repository.detail({ id_lokasi: parentId });
    if (!parent) return '';

    const grandParentPath = await this.getParentCodes(
      parent.dataValues.parent_id
    );
    const currentCode = parent.dataValues.kode_lokasi;

    return grandParentPath ? `${grandParentPath}_${currentCode}` : currentCode;
  }

  public async create(req: Request, res: Response) {
    try {
      const payload = Array.isArray(req.body)
        ? z.array(locationSchema).parse(req.body)
        : [locationSchema.parse(req.body)];

      const finalData = [];

      for (const item of payload) {
        //Logika Bisnis: Inherit ID Cabang dari Parent
        if (item.parent_id) {
          const parent: any = await repository.detail({
            id_lokasi: item.parent_id,
          });
          if (parent?.id_cabang) item.id_cabang = parent.id_cabang;
        }

        if (!item.kode_lokasi || item.kode_lokasi === '') {
          const parentPathCode = await this.getParentCodes(
            item?.parent_id || null
          );
          const myInitial = this.generateInitial(item.nama_lokasi);

          item.kode_lokasi = parentPathCode
            ? `${parentPathCode}-${myInitial}`
            : myInitial;
          item.qr_code = generateRandomString(item.kode_lokasi, 16);
        }

        // Cek Duplikasi
        const isDuplicate = await repository.detail({
          id_cabang: item.id_cabang || null,
          jenis_lokasi: item.jenis_lokasi,
          nama_lokasi: item.nama_lokasi,
        });

        if (isDuplicate)
          throw new Error(
            `Lokasi "${item.nama_lokasi}" sudah ada di cabang ini.`
          );

        finalData.push(item);
      }

      await repository.create({ payload: finalData });
      return response.success(SUCCESS_SAVED, null, res);
    } catch (err: any) {
      console.error('Error detail:', err);

      let errorMessage = err.message;
      let errorCode = 500;

      // Jika error berasal dari Zod (Validasi Field)
      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        const fieldName = firstIssue.path.join('.');
        errorMessage = `Field [${fieldName}]: ${firstIssue.message}`;
        errorCode = 400;
      }

      return helper.catchError(
        `Lokasi create: ${errorMessage}`,
        errorCode,
        res
      );
    }
  }

  public async update(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      // Ambil data lama dari database
      const existingData: any = await repository.detail({ id_lokasi: id });
      if (!existingData) return response.success(NOT_FOUND, null, res, false);

      // Validasi input menggunakan partial schema
      const validatedData = locationUpdateSchema.parse(req.body);

      // Gabungkan data lama dan data baru untuk keperluan logika bisnis
      const mergedData = {
        ...existingData.get({ plain: true }),
        ...validatedData,
      };

      // Logika Bisnis: Inherit ID Cabang dari Parent (jika parent_id berubah)
      if (validatedData.parent_id) {
        const parent: any = await repository.detail({
          id_lokasi: validatedData.parent_id,
        });
        if (parent?.id_cabang) {
          mergedData.id_cabang = parent.id_cabang;
        }
      }

      // Check duplicate
      const isDuplicate = await repository.detail({
        id_cabang: mergedData.id_cabang || null,
        jenis_lokasi: mergedData.jenis_lokasi,
        nama_lokasi: mergedData.nama_lokasi,
        id_lokasi: { [Op.ne]: id },
      });

      if (isDuplicate) {
        throw new Error(
          `Kombinasi Cabang, Jenis, dan Nama "${mergedData.nama_lokasi}" sudah digunakan oleh lokasi lain.`
        );
      }

      // Eksekusi Update
      await repository.update({
        payload: mergedData,
        condition: { id_lokasi: id },
      });

      return response.success(SUCCESS_UPDATED, null, res);
    } catch (err: any) {
      console.error('Error detail:', err);

      let errorMessage = err.message;
      let errorCode = 500;

      // Jika error berasal dari Zod (Validasi Field)
      if (err instanceof z.ZodError) {
        const firstIssue = err.issues[0];
        const fieldName = firstIssue.path.join('.');
        errorMessage = `Field [${fieldName}]: ${firstIssue.message}`;
        errorCode = 400;
      }

      return helper.catchError(
        `Lokasi create: ${errorMessage}`,
        errorCode,
        res
      );
    }
  }

  public async delete(req: Request, res: Response) {
    try {
      const id: string = req?.params?.id || '';

      // 1. Cek apakah data yang akan dihapus ada di database
      const check = await repository.detail({ id_lokasi: id });
      if (!check) return response.success(NOT_FOUND, null, res, false);

      // 2. Cek apakah lokasi ini memiliki child (sub-lokasi)
      const hasChild = await repository.detail({ parent_id: id });

      if (hasChild) {
        return response.success(
          `Gagal menghapus: Lokasi ini masih memiliki sub-lokasi di dalamnya. Silakan hapus atau pindahkan sub-lokasi terlebih dahulu.`,
          null,
          res,
          false
        );
      }

      // 3. Jika tidak ada child, eksekusi penghapusan
      await repository.delete({
        condition: { id_lokasi: id },
      });

      return response.success(SUCCESS_DELETED, null, res);
    } catch (err: any) {
      return helper.catchError(`Lokasi delete: ${err?.message}`, 500, res);
    }
  }

  public async export(req: Request, res: Response) {
    try {
      const { q, template } = req.body;
      const isTemplate = template == '1';

      let result = await repository.listForExport({ q, isTemplate });

      const rawData = result.map((d: any) =>
        typeof d.get === 'function' ? d.get({ plain: true }) : d
      );
      const tree = buildLocationTree(rawData);
      const flatValues = flattenLocationTree(tree);

      const { dir, path } = await helper.checkDirExport('excel');
      const filename = `master-lokasi-${isTemplate ? 'template' : moment().tz(TIMEZONE).format('DDMMYYYY')}.xlsx`;
      const urlExcel = `${dir}/${filename}`;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('LOKASI');

      generateDataExcel(sheet, flatValues);

      await workbook.xlsx.writeFile(`${path}/${filename}`);

      return response.success('Export excel berhasil', urlExcel, res);
    } catch (err: any) {
      return helper.catchError(`Export location: ${err.message}`, 500, res);
    }
  }

  public async import(req: Request, res: Response) {
    const uploaded = req.files?.file_import;
    if (!uploaded)
      return response.success('File tidak ditemukan', null, res, false);

    try {
      const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      const buffer = file.tempFilePath
        ? await fs.readFile(file.tempFilePath)
        : file.data;
      const rows = await helper.parseImportFile({
        name: file.name,
        data: buffer,
      });
      const results: any[] = [];

      for (const raw of rows) {
        const row = normalizeRow(raw);

        const errors: string[] = [];
        let parent_id = null,
          parent_nama = null;
        let id_cabang = null,
          cabang_nama = null;

        // Resolve Parent ID (Case-Insensitive)
        if (row.nama_parent) {
          const parent: any = await repository.findParentByName(
            row.nama_parent
          );
          if (parent) {
            parent_id = parent.dataValues.id_lokasi;
            id_cabang = parent.id_cabang;
            parent_nama = parent.dataValues.nama_lokasi;

            // Ambil juga nama cabangnya dari data parent agar children kebagian data nama cabang
            if (parent.cabang) {
              // Sesuaikan 'parent.cabang.nama_cabang' dengan relation/property yang ada di model parent Anda
              cabang_nama = parent.cabang.nama_cabang;
            }
          } else {
            errors.push(`Induk "${row.nama_parent}" tidak ditemukan`);
          }
        }

        // Resolve Cabang ID & Nama Cabang (Jika belum didapat dari parent ATAU jika nama_cabang diisi di excel)
        if (row.nama_cabang) {
          const cabang = await repository.findCabangByName(row.nama_cabang);

          if (cabang) {
            id_cabang = cabang.dataValues.id_cabang;
            cabang_nama = cabang.dataValues.nama_cabang;
          } else {
            errors.push(`Cabang "${row.nama_cabang}" tidak ditemukan`);
          }
        } else if (id_cabang && !cabang_nama) {
          const cabang: any = await repository.detail({ id_cabang });
          if (cabang) {
            cabang_nama = cabang.dataValues.nama_cabang;
          }
        }

        // Logic Generate Kode untuk keperluan Preview
        let finalKode = row.kode_lokasi;
        if (!finalKode) {
          const parentPathCode = await this.getParentCodes(parent_id);
          const myInitial = this.generateInitial(row.nama_lokasi);
          finalKode = parentPathCode
            ? `${parentPathCode}-${myInitial}`
            : myInitial;
        }

        // Cek Duplikasi Nama
        const isDuplicate = await repository.checkDuplicate({
          nama_lokasi: row.nama_lokasi,
          jenis_lokasi: row.jenis_lokasi,
          id_cabang: id_cabang,
          kode_lokasi: finalKode, // Penting: Agar tidak mendeteksi dirinya sendiri sebagai duplikat
        });

        if (isDuplicate)
          errors.push(`Lokasi "${row.nama_lokasi}" sudah ada di cabang ini.`);

        results.push({
          row: row.__row,
          valid: errors.length === 0,
          error: errors.join(', ') || null,
          payload: {
            kode_lokasi: finalKode,
            qr_code: generateRandomString(finalKode, 16),
            nama_lokasi: row.nama_lokasi,
            jenis_lokasi: row.jenis_lokasi,
            latitude: row.latitude ? +row.latitude : 0,
            longitude: row.longitude ? +row.longitude : 0,
            map_zoom: row.map_zoom,
            kapasitas: row.kapasitas,
            lantai: row.lantai ? +row.lantai : 0,
            keterangan: row.keterangan,
            parent_id,
            parent_nama,
            id_cabang,
            cabang_nama,
          },
        });
      }

      return response.success(
        'Preview import lokasi',
        {
          total: results.length,
          valid: results.filter((r) => r.valid).length,
          invalid: results.filter((r) => !r.valid).length,
          data: results,
        },
        res
      );
    } catch (err: any) {
      return helper.catchError(`Import Preview: ${err.message}`, 500, res);
    }
  }

  public async insert(req: Request, res: Response) {
    const payloads = req.body?.data as any[];
    if (!Array.isArray(payloads) || payloads.length === 0) {
      return response.success('Data import kosong', null, res, false);
    }

    const trx = await sequelize.transaction();
    try {
      for (const item of payloads) {
        // Validasi ulang data krusial sebelum insert
        if (!item.nama_lokasi) continue;

        // Pastikan QR Code & Kode Lokasi tetap terisi jika user mengubahnya di frontend
        if (!item.kode_lokasi) {
          const parentPathCode = await this.getParentCodes(item.parent_id);
          const myInitial = this.generateInitial(item.nama_lokasi);
          item.kode_lokasi = parentPathCode
            ? `${parentPathCode}-${myInitial}`
            : myInitial;
        }
        item.qr_code = generateRandomString(item.kode_lokasi, 16);

        // Gunakan repository upsertImport untuk eksekusi
        await repository.upsertImport(item, trx);
      }

      await trx.commit();
      return response.success(
        'Import batch lokasi berhasil',
        { total: payloads.length },
        res
      );
    } catch (err: any) {
      if (trx) await trx.rollback();
      return helper.catchError(`Insert Batch Gagal: ${err.message}`, 500, res);
    }
  }

  public async findQrCode(req: Request, res: Response) {
    try {
      const { qr_code } = req?.body;

      const result: any = await repository.detail({
        [Op.or]: {
          kode_lokasi: qr_code,
          qr_code,
        },
      });
      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`Lokasi qrcode: ${err?.message}`, 500, res);
    }
  }

  public async findAllLocationByLatlong(req: Request, res: Response) {
    try {
      const { latitude, longitude } = req?.body;

      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);

      const radius = 50; // meter

      const latDelta = radius / 111320;
      const lngDelta = radius / (111320 * Math.cos((lat * Math.PI) / 180));

      const minLat = lat - latDelta;
      const maxLat = lat + latDelta;
      const minLng = lng - lngDelta;
      const maxLng = lng + lngDelta;

      const query = `SELECT *
      FROM (
          SELECT 
            l1.id_lokasi,
            l1.nama_lokasi,
            l1.latitude,
            l1.longitude,
            l2.id_lokasi as id_lokasi_parent,
            l2.nama_lokasi as nama_lokasi_parent,
            (
                6371000 * acos(
                    cos(radians(?)) * 
                    cos(radians(l1.latitude)) *
                    cos(radians(l1.longitude) - radians(?)) +
                    sin(radians(?)) * 
                    sin(radians(l1.latitude))
                )
            ) AS distance
          FROM lokasi l1
          LEFT JOIN lokasi l2 ON l2.id_lokasi = l1.parent_id
          WHERE 
            l1.latitude BETWEEN ? AND ?
            AND l1.longitude BETWEEN ? AND ?
      ) AS nearby_locations
      WHERE distance <= ?
      ORDER BY distance ASC;`;

      const conn = await rawQuery.getConnection();
      const result: any = await conn.query(query, {
        type: QueryTypes.SELECT,
        replacements: [lat, lng, lat, minLat, maxLat, minLng, maxLng, radius],
      });

      if (!result) return response.success(NOT_FOUND, null, res, false);
      return response.success(SUCCESS_RETRIEVED, result, res);
    } catch (err: any) {
      return helper.catchError(`Lokasi latlong: ${err?.message}`, 500, res);
    }
  }
}

export const Location = new Controller();
