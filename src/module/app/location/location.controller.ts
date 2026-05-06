import { Request, Response } from 'express';
import { helper } from '../../../helpers/helper';
import { variable } from './location.variable';
import { response } from '../../../helpers/response';
import { repository } from './location.repository';
import {
  ALREADY_EXIST,
  NOT_FOUND,
  SUCCESS_DELETED,
  SUCCESS_RETRIEVED,
  SUCCESS_SAVED,
  SUCCESS_UPDATED,
} from '../../../utils/constant';
import { Op } from 'sequelize';
import { locationSchema, locationUpdateSchema } from './location.schema';
import QRCode from 'qrcode';
import z from 'zod';
import moment from 'moment';
import fs from 'fs/promises';
import ExcelJS from 'exceljs';
import { sequelize } from '../../../database/connection';
import crypto from 'crypto';


const generateDataExcel = (sheet: any, details: any) => {
  sheet.addRow([
    'No',
    'Kode Lokasi',
    'Nama Lokasi',
    'Jenis Lokasi',
    'Induk (Nama)',
    'Cabang (Nama)',
    'Latitude',
    'Longitude',
    'Map Zoom',
    'Kapasitas',
    'Lantai',
    'Keterangan',
  ]);

  sheet.getRow(1).eachCell((cell: any) => {
    cell.font = { bold: true };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (let i in details) {
    let spacing: string = details[i].__level ? '    ' : '';
    sheet.addRow([
      parseInt(i) + 1,
      details[i]?.kode_lokasi || '',
      spacing + (details[i]?.nama_lokasi || ''),
      details[i]?.jenis_lokasi || '',
      details[i]?.parent?.nama_lokasi || '',
      details[i]?.cabang?.nama_cabang || '',
      details[i]?.latitude || '',
      details[i]?.longitude || '',
      details[i]?.map_zoom || '',
      details[i]?.kapasitas || 0,
      details[i]?.lantai || '',
      details[i]?.keterangan || '',
    ]);
  }

  return sheet;
};

const normalizeRow = (row: any) => ({
  kode_lokasi: String(row['Kode Lokasi'] || '').trim(),
  nama_lokasi: String(row['Nama Lokasi'] || '').trim(),
  jenis_lokasi: String(row['Jenis Lokasi'] || '').trim(),
  nama_parent: String(row['Induk (Nama)'] || '').trim(),
  nama_cabang: String(row['Cabang (Nama)'] || '').trim(),
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

export const generateRandomString = (_input: string, length: number = 12): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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
      const result = await repository.list({});
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
      let result: any = (await repository.detail({ id_lokasi: id }));

      if (!result) return response.success(NOT_FOUND, null, res, false);

      result = result.get({ plain: true });

      const qrBase64 = await QRCode.toDataURL(result.kode_lokasi, {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 2
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
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .replace(/[^A-Z]/g, ''); // Pastikan hanya karakter alfabet
  }

  private async getParentCodes(parentId: string | null): Promise<string> {
    if (!parentId) return '';

    const parent: any = await repository.detail({ id_lokasi: parentId });
    if (!parent) return '';

    const grandParentPath = await this.getParentCodes(parent.dataValues.parent_id);
    const currentCode = parent.dataValues.kode_lokasi;;

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
          const parent: any = await repository.detail({ id_lokasi: item.parent_id });
          if (parent?.id_cabang) item.id_cabang = parent.id_cabang;
        }

        if (!item.kode_lokasi || item.kode_lokasi === "") {
          const parentPathCode = await this.getParentCodes(item?.parent_id || null);
          const myInitial = this.generateInitial(item.nama_lokasi);
          
          item.kode_lokasi = parentPathCode ? `${parentPathCode}-${myInitial}` : myInitial;
          item.qr_code = generateRandomString(item.kode_lokasi, 16);
        }

        // Cek Duplikasi
        const isDuplicate = await repository.detail({
          id_cabang: item.id_cabang || null,
          jenis_lokasi: item.jenis_lokasi,
          nama_lokasi: item.nama_lokasi,
        });

        if (isDuplicate) throw new Error(`Lokasi "${item.nama_lokasi}" sudah ada di cabang ini.`);
        
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

      return helper.catchError(`Lokasi create: ${errorMessage}`, errorCode, res);
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
      const mergedData = { ...existingData.get({ plain: true }), ...validatedData };

      // Logika Bisnis: Inherit ID Cabang dari Parent (jika parent_id berubah)
      if (validatedData.parent_id) {
        const parent: any = await repository.detail({ id_lokasi: validatedData.parent_id });
        if (parent?.id_cabang) {
          mergedData.id_cabang = parent.id_cabang;
        }
      }

      // Check duplicate
      const isDuplicate = await repository.detail({
        id_cabang: mergedData.id_cabang || null,
        jenis_lokasi: mergedData.jenis_lokasi,
        nama_lokasi: mergedData.nama_lokasi,
        id_lokasi: { [Op.ne]: id }
      });

      if (isDuplicate) {
        throw new Error(`Kombinasi Cabang, Jenis, dan Nama "${mergedData.nama_lokasi}" sudah digunakan oleh lokasi lain.`);
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

      return helper.catchError(`Lokasi create: ${errorMessage}`, errorCode, res);
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
      
      let condition: any = {};
      let limit: number | undefined = undefined;

      if (isTemplate) {
        limit = 5;
      } else if (q) {
        condition = {
          nama_lokasi: { [Op.like]: `%${q}%` }
        };
      }
      const result = await repository.listForExport(condition, limit);

      if (!isTemplate && result?.length < 1) {
        return response.success(NOT_FOUND, null, res, false);
      }

      const rawData = result.map((d: any) => (typeof d.get === 'function' ? d.get({ plain: true }) : d));
      const tree = buildLocationTree(rawData);
      const flatValues = flattenLocationTree(tree);

      const { dir, path } = await helper.checkDirExport('excel');
      const filename = `master-lokasi-${isTemplate ? 'template' : moment().format('DDMMYYYY')}.xlsx`;
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
    if (!uploaded) return response.success('File tidak ditemukan', null, res, false);

    try {
      const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
      const buffer = file.tempFilePath ? await fs.readFile(file.tempFilePath) : file.data;
      const rows = await helper.parseImportFile({ name: file.name, data: buffer });
      const results: any[] = [];
      
      for (const raw of rows) {
        const row = normalizeRow(raw);
        
        const errors: string[] = [];
        let parent_id = null, parent_nama = null;
        let id_cabang = null, cabang_nama = null;

        // Resolve Parent ID (Case-Insensitive)
        if (row.nama_parent) {
          const parent = await repository.findParentByName(row.nama_parent);
          if (parent) {
            parent_id = parent.dataValues.id_lokasi;
            id_cabang = parent.id_cabang;
            parent_nama = parent.dataValues.nama_lokasi;
          } else errors.push(`Induk "${row.nama_parent}" tidak ditemukan`);
        }

        // Resolve Cabang ID
       
        if (row.nama_cabang && !id_cabang) {
          const cabang = await repository.findCabangByName(row.nama_cabang);
          
          if (cabang) {
            id_cabang = cabang.dataValues.id_cabang; 
            cabang_nama = cabang.dataValues.nama_cabang;
          }
          else errors.push(`Cabang "${row.nama_cabang}" tidak ditemukan`);
        }

        // Logic Generate Kode untuk keperluan Preview
        let finalKode = row.kode_lokasi;
        console.log('PARENT ID', parent_id)
        if (!finalKode) {
          const parentPathCode = await this.getParentCodes(parent_id);
          const myInitial = this.generateInitial(row.nama_lokasi);
          finalKode = parentPathCode ? `${parentPathCode}-${myInitial}` : myInitial;
        }

        // Cek Duplikasi Nama
        const isDuplicate = await repository.checkDuplicate({
          nama_lokasi: row.nama_lokasi,
          jenis_lokasi: row.jenis_lokasi,
          id_cabang: id_cabang,
          kode_lokasi: finalKode // Penting: Agar tidak mendeteksi dirinya sendiri sebagai duplikat
        });

        // console.log('RESULTS', finalKode, isDuplicate, id_cabang, row.jenis_lokasi, row.nama_lokasi, finalKode)
        if (isDuplicate) errors.push(`Lokasi "${row.nama_lokasi}" sudah ada di cabang ini.`);

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
            longitude: row.longitude ? +row.longitude: 0,
            map_zoom: row.map_zoom,
            kapasitas: row.kapasitas,
            lantai: row.lantai ? +row.lantai : 0,
            keterangan: row.keterangan,
            parent_id,
            parent_nama,
            id_cabang,
            cabang_nama
          }
        });
      }

      return response.success('Preview import lokasi', {
        total: results.length,
        valid: results.filter(r => r.valid).length,
        invalid: results.filter(r => !r.valid).length,
        data: results
      }, res);
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
          item.kode_lokasi = parentPathCode ? `${parentPathCode}-${myInitial}` : myInitial;
        }
        item.qr_code = generateRandomString(item.kode_lokasi, 16);

        // Gunakan repository upsertImport untuk eksekusi
        await repository.upsertImport(item, trx);
      }
      
      await trx.commit();
      return response.success('Import batch lokasi berhasil', { total: payloads.length }, res);
    } catch (err: any) {
      if (trx) await trx.rollback();
      return helper.catchError(`Insert Batch Gagal: ${err.message}`, 500, res);
    }
  }
}

export const Location = new Controller();