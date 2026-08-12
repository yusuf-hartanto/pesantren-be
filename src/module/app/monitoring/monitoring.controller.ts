import { Request, Response } from 'express';
import { repository } from './monitoring.repository';

export class LaporanPresensiController {

  async getKamarBelumAbsen(req: Request, res: Response) {
    try {
      const { tanggal, id_cabang, id_shift } = req.query;

      if (!tanggal) {
        return res.status(400).json({ status: false, message: 'Parameter tanggal wajib diisi (YYYY-MM-DD).' });
      }

      const data = await repository.getLaporanPresensiKamar(
        tanggal as string,
        id_cabang as string,
        id_shift as string
      );

      return res.status(200).json({
        status: true,
        message: 'Berhasil mendapatkan rekap presensi kamar',
        data: data
      });
    } catch (error: any) {
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  async getKelasBelumAbsen(req: Request, res: Response) {
    try {
      const { tanggal, id_cabang, id_lembaga, id_jampel } = req.query;

      if (!tanggal) return res.status(400).json({ status: false, message: 'Parameter tanggal wajib diisi.' });

      const data = await repository.getLaporanSantriBelumAbsenKelas(
        tanggal as string,
        id_cabang as string,
        id_lembaga as string,
        id_jampel as string
      );

      return res.status(200).json({
        status: true,
        message: 'Berhasil mendapatkan rekap presensi kelas',
        data: data
      });
    } catch (error: any) {
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  async getPegawaiBelumAbsen(req: Request, res: Response) {
    try {
      const { tanggal, id_lokasi, id_cabang, id_lembaga } = req.query;

      if (!tanggal) return res.status(400).json({ status: false, message: 'Parameter tanggal wajib diisi.' });

      const data = await repository.getLaporanPegawaiBelumAbsen(
        tanggal as string,
        id_lokasi as string,
        id_cabang as string,
        id_lembaga as string
      );

      return res.status(200).json({ status: true, message: 'Berhasil mendapatkan rekap presensi pegawai biasa', data });
    } catch (error: any) {
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  async getGuruBelumAbsen(req: Request, res: Response) {
    try {
      const { tanggal, id_cabang, id_lembaga } = req.query;

      if (!tanggal) return res.status(400).json({ status: false, message: 'Parameter tanggal wajib diisi.' });

      const data = await repository.getLaporanGuruBelumAbsen(
        tanggal as string,
        id_cabang as string,
        id_lembaga as string
      );

      return res.status(200).json({ status: true, message: 'Berhasil mendapatkan rekap jurnal guru tertunggak', data });
    } catch (error: any) {
      return res.status(500).json({ status: false, message: error.message });
    }
  }

  async getPetugasInspeksiBelumAbsen(req: Request, res: Response) {
    try {
      const { tanggal, id_cabang } = req.query;

      if (!tanggal) return res.status(400).json({ status: false, message: 'Parameter tanggal wajib diisi.' });

      const data = await repository.getLaporanPetugasBelumInspeksi(
        tanggal as string,
        id_cabang as string
      );

      return res.status(200).json({ status: true, message: 'Berhasil mendapatkan rekap petugas inspeksi tertunggak', data });
    } catch (error: any) {
      return res.status(500).json({ status: false, message: error.message });
    }
  }
}

export const laporanPresensiController =  new LaporanPresensiController();