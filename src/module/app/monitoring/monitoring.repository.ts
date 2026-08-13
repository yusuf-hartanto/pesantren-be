import { QueryTypes } from "sequelize";
import { sequelize } from "../../../database/connection";
import moment from 'moment-timezone';
import { TIMEZONE } from "../../../utils/constant";

function getHariIndonesia(tanggal: string): string {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const date = new Date(tanggal);
    return days[date.getDay()];
}

function getHariInspeksiNumber(tanggal: string): number {
    const date = new Date(tanggal);
    const jsDay = date.getDay();
    // Jika Minggu (0), kembalikan 7 (Ahad). Selain itu, biarkan angkanya sama.
    return jsDay === 0 ? 7 : jsDay; 
}

export default class LaporanPresensiRepository {
    public async getLaporanPresensiKamar(
        tanggalHariIni: string,
        idCabang?: string,
        idShift?: string
    ) {
        let targetShiftId = idShift;

        // ====================================================================
        // AUTO-DETECT SHIFT
        // ====================================================================
        if (!targetShiftId) {
            const currentTime = moment().tz(TIMEZONE).format('HH:mm:ss');
            const activeShift: any[] = await sequelize.query(
                `
            SELECT id_shift 
            FROM shift_presensi 
            WHERE status = 'Aktif'
            AND (
                (waktu_mulai <= waktu_selesai AND :currentTime >= waktu_mulai AND :currentTime <= waktu_selesai)
                OR 
                (waktu_mulai > waktu_selesai AND (:currentTime >= waktu_mulai OR :currentTime <= waktu_selesai))
            )
            LIMIT 1;
        `,
                {
                    replacements: { currentTime },
                    type: QueryTypes.SELECT
                }
            );

            if (activeShift.length === 0) {
                throw new Error('Tidak ada shift presensi aktif saat ini.');
            }
            targetShiftId = activeShift[0].id_shift;
        }

        // ====================================================================
        // QUERY MASTER DATA 
        // ====================================================================
        const tanggal3HariLalu = moment(tanggalHariIni).tz(TIMEZONE).subtract(3, 'days').format('YYYY-MM-DD');

        const rawData: any[] = await sequelize.query(
            `
        WITH HistoriKamarShift AS (
            SELECT DISTINCT 
                id_lokasi_kamar, 
                id_shift_presensi
            FROM absen_harian_santri
            WHERE tanggal >= :tanggal3HariLalu 
            AND tanggal <= :tanggalHariIni
            AND deleted_at IS NULL
        )
        
        SELECT 
            pks.id_lokasi AS id_lokasi_kamar,
            l.nama_lokasi AS nama_kamar,
            
            (
            SELECT COUNT(id_santri) 
            FROM penempatan_kamar_santri p2 
            WHERE p2.id_lokasi = pks.id_lokasi 
                AND p2.status = 'Aktif' 
                AND p2.is_deleted = false
            ) AS total_santri_di_kamar,
            
            pks.id_waliasuh,
            peg.nama_lengkap AS nama_waliasuh,
            peg.no_hp,
            
            sp.id_shift,
            sp.nama_shift,
            
            pks.id_santri,
            s.fullname AS nama_santri,
            s.nis,
            
            CASE WHEN hs.id_shift_presensi IS NOT NULL THEN true ELSE false END AS is_valid_shift
            
        FROM penempatan_kamar_santri pks
        INNER JOIN santri s ON pks.id_santri = s.id_santri
        LEFT JOIN location l ON pks.id_lokasi = l.id_lokasi
        LEFT JOIN pegawai peg ON pks.id_waliasuh = peg.id_pegawai
        
        INNER JOIN shift_presensi sp ON sp.id_shift = :targetShiftId
        
        LEFT JOIN HistoriKamarShift hs 
            ON pks.id_lokasi = hs.id_lokasi_kamar 
            AND sp.id_shift = hs.id_shift_presensi
            
        LEFT JOIN absen_harian_santri ahs 
            ON pks.id_santri = ahs.id_santri 
            AND pks.id_lokasi = ahs.id_lokasi_kamar
            AND sp.id_shift = ahs.id_shift_presensi
            AND ahs.tanggal = :tanggalHariIni
            AND ahs.deleted_at IS NULL
            
        WHERE 
            pks.status = 'Aktif'
            AND pks.is_deleted = false
            AND sp.status = 'Aktif'
            AND ahs.id_absen IS NULL 
            AND (:idCabang IS NULL OR l.id_cabang = :idCabang)
            
        ORDER BY 
            l.nama_lokasi ASC, 
            s.fullname ASC;
        `,
            {
                replacements: {
                    tanggalHariIni: moment(tanggalHariIni).tz(TIMEZONE).format('YYYY-MM-DD'),
                    tanggal3HariLalu: moment(tanggal3HariLalu).tz(TIMEZONE).subtract(3, 'days').format('YYYY-MM-DD'),
                    targetShiftId,
                    idCabang: idCabang || null
                },
                type: QueryTypes.SELECT,
            }
        );

        // ====================================================================
        // GROUPING 1: REKAP PER KAMAR
        // ====================================================================
        const rekapPerKamar = rawData.reduce((acc: any[], curr: any) => {
            let kamarGroup = acc.find((k) => k.id_lokasi_kamar === curr.id_lokasi_kamar);

            if (!kamarGroup) {
                kamarGroup = {
                    id_lokasi_kamar: curr.id_lokasi_kamar,
                    nama_kamar: curr.nama_kamar,
                    total_santri: parseInt(curr.total_santri_di_kamar, 10) || 0,
                    shifts_valid: [],
                    shifts_unmapped: []
                };
                acc.push(kamarGroup);
            }

            const targetArray = curr.is_valid_shift ? kamarGroup.shifts_valid : kamarGroup.shifts_unmapped;

            let shiftGroup = targetArray.find((s: any) => s.id_shift === curr.id_shift);
            if (!shiftGroup) {
                shiftGroup = {
                    id_shift: curr.id_shift,
                    nama_shift: curr.nama_shift,
                    total_santri_belum_absen: 0,
                    santri_belum_absen: []
                };
                targetArray.push(shiftGroup);
            }

            shiftGroup.santri_belum_absen.push({
                id_santri: curr.id_santri,
                nama_santri: curr.nama_santri,
                nis: curr.nis,
                id_waliasuh: curr.id_waliasuh,
                no_hp: curr.no_hp || null,
                nama_waliasuh: curr.nama_waliasuh || 'Belum Ditentukan'
            });

            shiftGroup.total_santri_belum_absen += 1;

            return acc;
        }, []);

        // ====================================================================
        // GROUPING 2: REKAP WALI ASUH (Dengan Array Object Kamar)
        // ====================================================================
        const rekapPerWaliAsuh = rawData.reduce((acc: any[], curr: any) => {
            const waliasuhId = curr.id_waliasuh || 'UNASSIGNED';
            let waliGroup = acc.find((w) => w.id_waliasuh === waliasuhId);

            if (!waliGroup) {
                waliGroup = {
                    id_waliasuh: waliasuhId,
                    nama_waliasuh: curr.nama_waliasuh || 'Belum Ditentukan',
                    no_hp: curr.no_hp || null,
                    total_santri_belum_absen: 0,
                    kamar_tanggung_jawab: [] // Wadah untuk array of object
                };
                acc.push(waliGroup);
            }

            let kamarTugas = waliGroup.kamar_tanggung_jawab.find(
                (kt: any) => kt.id_lokasi_kamar === curr.id_lokasi_kamar && kt.id_shift === curr.id_shift
            );

            if (!kamarTugas) {
                const namaKamarLabel = curr.is_valid_shift
                    ? curr.nama_kamar
                    : `${curr.nama_kamar} (Shift Tak Wajar)`;

                waliGroup.kamar_tanggung_jawab.push({
                    id_lokasi_kamar: curr.id_lokasi_kamar,
                    nama_kamar: namaKamarLabel,
                    id_shift: curr.id_shift,
                    nama_shift: curr.nama_shift,
                    total_santri: parseInt(curr.total_santri_di_kamar, 10) || 0
                });
            }

            waliGroup.total_santri_belum_absen += 1;

            return acc;
        }, []);

        return {
            shift_terpilih: targetShiftId,
            rekap_kamar: rekapPerKamar,
            rekap_waliasuh: rekapPerWaliAsuh
        };
    }

    public async getLaporanSantriBelumAbsenKelas(
      tanggalHariIni: string,
      idCabang?: string,
      idLembaga?: string,
      idJamPelajaran?: string
    ) {
      let targetJamIds: string[] = [];
    
      // ====================================================================
      // LOGIKA AUTO-DETECT JAM PELAJARAN (Bila tidak dikirim)
      // ====================================================================
      if (idJamPelajaran) {
        targetJamIds.push(idJamPelajaran);
      } else {
        const currentTime = moment().format('HH:mm:ss');
        const activeJams: any[] = await sequelize.query(
          `
            SELECT id_jampel 
            FROM jam_pelajaran 
            WHERE status = 'Aktif'
              AND (
                (mulai <= selesai AND :currentTime >= mulai AND :currentTime <= selesai)
                OR 
                (mulai > selesai AND (:currentTime >= mulai OR :currentTime <= selesai))
              )
          `,
          {
            replacements: { currentTime },
            type: QueryTypes.SELECT
          }
        );
    
        if (activeJams.length === 0) {
          throw new Error('Tidak ada jam pelajaran aktif saat ini.');
        }
        
        targetJamIds = activeJams.map((j) => j.id_jampel);
      }
    
      // ====================================================================
      // QUERY MASTER DENGAN CTE, SUBQUERY, & INNER JOIN
      // ====================================================================
      const tanggal3HariLalu = moment(tanggalHariIni).subtract(3, 'days').format('YYYY-MM-DD');
    
      const rawData: any[] = await sequelize.query(
        `
          WITH HistoriKelasJam AS (
            SELECT DISTINCT 
                id_lokasi AS id_kelas, 
                id_jam_pelajaran
            FROM absen_kelas_santri
            WHERE tanggal >= :tanggal3HariLalu 
              AND tanggal <= :tanggalHariIni
              AND deleted_at IS NULL
          )
          
          SELECT 
            mk.id_kelas,
            mk.nama_kelas,
            mk.tipe_kelas,
            
            (
              SELECT COUNT(id_santri) 
              FROM penempatan_kelas_santri p2 
              WHERE (p2.id_kelas_formal = mk.id_kelas OR p2.id_kelas_mda = mk.id_kelas)
                AND p2.status = 'Aktif' 
                AND p2.deleted_at IS NULL
            ) AS total_santri_di_kelas,
    
            jp.id_jampel AS id_jam_pelajaran,
            jp.nama_jampel,
            
            mk.id_santri,
            mk.nama_santri,
            mk.nis,
            
            CASE WHEN hk.id_jam_pelajaran IS NOT NULL THEN true ELSE false END AS is_valid_jampel
            
          FROM (
            SELECT 
                p.id_santri, s.fullname AS nama_santri, s.nis,
                p.id_kelas_formal AS id_kelas, 'FORMAL' AS tipe_kelas, kf.nama_kelas,
                kf.id_cabang, kf.id_lembaga
            FROM penempatan_kelas_santri p
            INNER JOIN santri s ON p.id_santri = s.id_santri
            INNER JOIN kelas_formal kf ON p.id_kelas_formal = kf.id_kelas
            WHERE p.status = 'Aktif' AND p.deleted_at IS NULL AND p.id_kelas_formal IS NOT NULL
            
            UNION ALL
            
            SELECT 
                p.id_santri, s.fullname AS nama_santri, s.nis,
                p.id_kelas_mda AS id_kelas, 'PESANTREN' AS tipe_kelas, km.nama_kelas_mda AS nama_kelas,
                km.id_cabang, km.id_lembaga
            FROM penempatan_kelas_santri p
            INNER JOIN santri s ON p.id_santri = s.id_santri
            INNER JOIN kelas_mda km ON p.id_kelas_mda = km.id_kelas_mda
            WHERE p.status = 'Aktif' AND p.deleted_at IS NULL AND p.id_kelas_mda IS NOT NULL
          ) mk
          
          -- =========================================================
          -- KOREKSI: MENGGUNAKAN INNER JOIN (MENGGANTIKAN CROSS JOIN)
          -- =========================================================
          INNER JOIN jam_pelajaran jp ON jp.id_jampel IN (:targetJamIds)
          
          LEFT JOIN HistoriKelasJam hk 
            ON mk.id_kelas = hk.id_kelas 
            AND jp.id_jampel = hk.id_jam_pelajaran
            
          LEFT JOIN absen_kelas_santri aks 
            ON mk.id_santri = aks.id_santri 
            AND mk.id_kelas = aks.id_lokasi
            AND jp.id_jampel = aks.id_jam_pelajaran
            AND aks.tanggal = :tanggalHariIni
            AND aks.deleted_at IS NULL
            
          WHERE 
            -- PENTING: Mencegah anak MDA ditagih absen untuk jam pelajaran Formal
            jp.lembaga_type = mk.tipe_kelas
            
            AND aks.id_absen IS NULL 
            
            -- Filter Dinamis
            AND (:idCabang IS NULL OR mk.id_cabang = :idCabang)
            AND (:idLembaga IS NULL OR mk.id_lembaga = :idLembaga)
            
          ORDER BY 
            mk.tipe_kelas ASC,
            mk.nama_kelas ASC, 
            jp.mulai ASC, 
            mk.nama_santri ASC;
        `,
        {
          replacements: { 
            tanggalHariIni, 
            tanggal3HariLalu,
            targetJamIds, 
            idCabang: idCabang || null,
            idLembaga: idLembaga || null
          },
          type: QueryTypes.SELECT,
        }
      );
    
      // ====================================================================
      // GROUPING 
      // ====================================================================
      const groupedData = rawData.reduce((acc: any[], curr: any) => {
        let kelasGroup = acc.find((k) => k.id_kelas === curr.id_kelas);
        
        if (!kelasGroup) {
          kelasGroup = {
            id_kelas: curr.id_kelas,
            nama_kelas: curr.nama_kelas,
            tipe_kelas: curr.tipe_kelas,
            total_santri: parseInt(curr.total_santri_di_kelas, 10) || 0,
            jam_pelajaran_valid: [],   
            jam_pelajaran_unmapped: [] 
          };
          acc.push(kelasGroup);
        }
    
        const targetArray = curr.is_valid_jampel ? kelasGroup.jam_pelajaran_valid : kelasGroup.jam_pelajaran_unmapped;
    
        let jamGroup = targetArray.find((j: any) => j.id_jam_pelajaran === curr.id_jam_pelajaran);
        
        if (!jamGroup) {
          jamGroup = {
            id_jam_pelajaran: curr.id_jam_pelajaran,
            nama_jampel: curr.nama_jampel,
            total_santri_belum_absen: 0, 
            santri_belum_absen: [] 
          };
          targetArray.push(jamGroup);
        }
    
        jamGroup.santri_belum_absen.push({
          id_santri: curr.id_santri,
          nama_santri: curr.nama_santri,
          nis: curr.nis
        });
    
        jamGroup.total_santri_belum_absen += 1;
    
        return acc;
      }, []);
    
      return {
        jam_pelajaran_terpilih: targetJamIds,
        rekap_kelas: groupedData
      };
    }

    public async getLaporanPegawaiBelumAbsen(
      tanggal: string, 
      idLokasi?: string,
      idCabang?: string,
      idLembaga?: string
    ) {
      const rawData: any[] = await sequelize.query(
        `
          SELECT 
            jkp.id_pegawai,
            peg.nama_lengkap AS nama_pegawai,
            peg.nip,
            peg.no_hp,
            jkp.id_lokasi,
            l.nama_lokasi,
            jkp.id_jamkerja,
            jkp.waktu_mulai,
            jkp.waktu_selesai,
            'Belum Absen' AS status_presensi
            
          FROM jam_kerja_pegawai jkp
          
          INNER JOIN pegawai peg ON jkp.id_pegawai = peg.id_pegawai
          
          LEFT JOIN orgunit ou ON peg.id_orgunit = ou.id_orgunit
          
          LEFT JOIN location l ON jkp.id_lokasi = l.id_lokasi
          
          LEFT JOIN absen_harian_pegawai ahp 
            ON jkp.id_jamkerja = ahp.id_jamkerja
            AND jkp.id_pegawai = ahp.id_pegawai
            AND ahp.tanggal = :tanggal
            AND ahp.deleted_at IS NULL
    
          LEFT JOIN jenis_guru jg 
            ON peg.id_pegawai = jg.id_guru
            
          WHERE 
            jkp.is_active = true
            AND jkp.deleted_at IS NULL
            AND peg.status_pegawai = 'Aktif'
            AND peg.deleted_at IS NULL
            
            AND ahp.id_absen IS NULL
            
            AND jg.id_jenisguru IS NULL
            
            AND (:id_lokasi IS NULL OR jkp.id_lokasi = :id_lokasi)
            
            AND (:id_cabang IS NULL OR ou.id_cabang = :id_cabang)
            AND (:id_lembaga IS NULL OR ou.id_lembaga = :id_lembaga)
            
          ORDER BY 
            l.nama_lokasi ASC, 
            peg.nama_lengkap ASC;
        `,
        {
          replacements: { 
            tanggal: tanggal,
            id_lokasi: idLokasi || null,
            id_cabang: idCabang || null,
            id_lembaga: idLembaga || null
          },
          type: QueryTypes.SELECT,
        }
      );
    
      return rawData;
    }


    public async getLaporanGuruBelumAbsen(
      tanggal: string,
      idCabang?: string,
      idLembaga?: string
    ) {
      const hariIni = getHariIndonesia(tanggal);
    
      const rawData: any[] = await sequelize.query(
        `
          SELECT 
            jg.id_guru AS id_pegawai,
            peg.nama_lengkap AS nama_guru,
            peg.nip,
            peg.no_hp,
            jad.id_jadwal,
            jad.id_kelas,
            -- Mengambil nama kelas (Mengecek Formal atau MDA)
            COALESCE(kf.nama_kelas, km.nama_kelas_mda) AS nama_kelas,
            
            jp.id_jampel AS id_jam_pelajaran,
            jp.nama_jampel,
            jp.mulai,
            jp.selesai,
            
            'Belum Mengisi Jurnal' AS status_presensi
            
          FROM jadwal_pelajaran jad
          
          INNER JOIN jenis_guru jg ON jad.id_gmapel = jg.id_jenisguru
          
          INNER JOIN pegawai peg ON jg.id_guru = peg.id_pegawai
          
          LEFT JOIN orgunit ou ON peg.id_orgunit = ou.id_orgunit
          
          INNER JOIN jam_pelajaran jp ON jad.id_jam_pelajaran = jp.id_jampel
          
          LEFT JOIN kelas_formal kf ON jad.id_kelas = kf.id_kelas
          LEFT JOIN kelas_mda km ON jad.id_kelas = km.id_kelas_mda

          LEFT JOIN jurnal_kelas jnk 
            ON jad.id_jam_pelajaran = jnk.id_jam_pelajaran
            AND jad.id_kelas = jnk.id_lokasi
            AND jnk.tanggal = :tanggal
            AND jnk.deleted_at IS NULL
            
          WHERE 
            jad.hari = :hari
            AND jad.status = 'Aktif'
            AND jg.status = 'A'
            AND peg.status_pegawai = 'Aktif'
            AND peg.deleted_at IS NULL
            
            AND jnk.id_jurnal IS NULL
            
            AND (:idCabang IS NULL OR ou.id_cabang = :idCabang)
            AND (:idLembaga IS NULL OR ou.id_lembaga = :idLembaga)
            
          ORDER BY 
            peg.nama_lengkap ASC, 
            jp.mulai ASC;
        `,
        {
          replacements: { 
            tanggal: tanggal,
            hari: hariIni, 
            idCabang: idCabang || null,
            idLembaga: idLembaga || null
          },
          type: QueryTypes.SELECT,
        }
      );
    
      // Grouping Data berdasarkan Guru
      const groupedData = rawData.reduce((acc: any[], curr: any) => {
        let guruGroup = acc.find((g) => g.id_pegawai === curr.id_pegawai);
    
        if (!guruGroup) {
          guruGroup = {
            id_pegawai: curr.id_pegawai,
            nama_guru: curr.nama_guru,
            nip: curr.nip,
            no_hp: curr.no_hp,
            total_jadwal_terlewat: 0,
            jadwal_terlewat: [] 
          };
          acc.push(guruGroup);
        }
    
        guruGroup.jadwal_terlewat.push({
          id_jadwal: curr.id_jadwal,
          id_kelas: curr.id_kelas,
          nama_kelas: curr.nama_kelas || 'Kelas Tidak Ditemukan',
          id_jam_pelajaran: curr.id_jam_pelajaran,
          nama_jampel: curr.nama_jampel,
          waktu_mulai: curr.mulai,
          waktu_selesai: curr.selesai,
          status_presensi: curr.status_presensi
        });
    
        guruGroup.total_jadwal_terlewat += 1;
    
        return acc;
      }, []);
    
      return groupedData;
    }
    
    public async getLaporanPetugasBelumInspeksi(tanggal: string, idCabang?: string) {
      const hariTarget = getHariInspeksiNumber(tanggal);
    

      const rawData: any[] = await sequelize.query(
        `
          SELECT 
            jik.id_petugas,
            peg.nama_lengkap AS nama_petugas,
            peg.nip,
            peg.no_hp,
            jik.id_jadwal,
            jik.id_cabang,
            c.nama_cabang,
            
            jik.kode_slot,
            msw.jam_mulai,
            msw.jam_selesai,
            msw.keterangan AS keterangan_slot,
            
            'Belum Inspeksi' AS status_inspeksi
            
          FROM jadwal_inspeksi_kebersihan jik
          

          INNER JOIN pegawai peg ON jik.id_petugas = peg.id_pegawai
          
          LEFT JOIN master_slot_waktu msw ON jik.kode_slot = msw.kode_slot
          
          LEFT JOIN cabang c ON jik.id_cabang = c.id_cabang
          
          LEFT JOIN kebersihan_inspeksi ki 
            ON jik.id_jadwal = ki.id_jadwal 
            AND ki.tanggal = :tanggal
            
          WHERE 
            jik.is_active = true
            AND jik.hari = :hari -- Filter jadwal khusus pada hari tersebut (1-7)
            AND peg.status_pegawai = 'Aktif'
            AND peg.deleted_at IS NULL
            
            AND (:id_cabang IS NULL OR jik.id_cabang = :id_cabang)
            
            AND ki.id_inspeksi IS NULL
            
          ORDER BY 
            peg.nama_lengkap ASC, 
            msw.jam_mulai ASC;
        `,
        {
          replacements: { 
            tanggal: tanggal,
            hari: hariTarget,
            id_cabang: idCabang || null
          },
          type: QueryTypes.SELECT,
        }
      );
    

      const groupedData = rawData.reduce((acc: any[], curr: any) => {
        let petugasGroup = acc.find((p) => p.id_petugas === curr.id_petugas);
    

        if (!petugasGroup) {
          petugasGroup = {
            id_petugas: curr.id_petugas,
            nama_petugas: curr.nama_petugas,
            nip: curr.nip,
            no_hp: curr.no_hp,
            total_tugas_terlewat: 0,
            jadwal_terlewat: []
          };
          acc.push(petugasGroup);
        }
    

        petugasGroup.jadwal_terlewat.push({
          id_jadwal: curr.id_jadwal,
          id_cabang: curr.id_cabang,
          nama_cabang: curr.nama_cabang || '-',
          kode_slot: curr.kode_slot,
          jam_mulai: curr.jam_mulai,
          jam_selesai: curr.jam_selesai,
          keterangan_slot: curr.keterangan_slot,
          status_inspeksi: curr.status_inspeksi
        });
    
        petugasGroup.total_tugas_terlewat += 1;
    
        return acc;
      }, []);
    
      return groupedData;
    }
}

export const repository = new LaporanPresensiRepository();