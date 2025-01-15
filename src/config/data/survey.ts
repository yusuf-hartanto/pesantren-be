'use strict';

export default class DataSurvey {
  public event() {
    return [
      {
        event: 'Event Survey 1',
        desc: 'Event Survey 1',
        start_period: '2025-01-01 00:00:00',
        end_period: '2025-01-31 23:59:59',
        is_active: 1,
        is_random: 0,
      },
    ];
  }

  public form() {
    return [
      {
        question: 'Apakah sudah menikah?',
        type: 'MultipleChoice',
        nourut: 1,
        is_active: 1,
      },
      {
        question: 'Pernikahan ke berapa untuk anda?',
        type: 'MultipleChoice',
        nourut: 2,
        is_active: 1,
      },
      {
        question: 'Pernikahan ke berapa untuk pasangan?',
        type: 'MultipleChoice',
        nourut: 3,
        is_active: 1,
      },
      {
        question: 'Berapa jumlah anak?',
        type: 'MultipleChoice',
        nourut: 4,
        is_active: 1,
      },
      {
        question: 'Apakah anda memilki anak yang berusia di bawah 18 tahun?',
        type: 'MultipleChoice',
        nourut: 5,
        is_active: 1,
      },
      {
        question: 'Status pasangan WNI atau WNA?',
        type: 'MultipleChoice',
        nourut: 6,
        is_active: 1,
      },
      {
        question: 'Status anak WNI atau WNA?',
        type: 'MultipleChoice',
        nourut: 7,
        is_active: 1,
      },
      {
        question: 'Apakah anda pernah melakukan hibah terhadap anak?',
        type: 'MultipleChoice',
        nourut: 8,
        is_active: 1,
      },
      {
        question: 'Apakah agama anda',
        type: 'MultipleChoice',
        nourut: 9,
        is_active: 1,
      },
      {
        question: 'Apakah anda sudah memiliki rencana pensiun?',
        type: 'MultipleChoice',
        nourut: 10,
        is_active: 1,
      },
      {
        question: 'Apakah anda memiliki aset properti?',
        type: 'MultipleChoice',
        nourut: 11,
        is_active: 1,
      },
      {
        question: 'Apakah status properti anda saat ini diagunkan ke bank?',
        type: 'MultipleChoice',
        nourut: 12,
        is_active: 1,
      },
      {
        question: 'Apakah anda memiliki aset di lebih dari satu bank?',
        type: 'MultipleChoice',
        nourut: 13,
        is_active: 1,
      },
      {
        question: 'Apakah anda memiliki aset di safe deposit box?',
        type: 'MultipleChoice',
        nourut: 14,
        is_active: 1,
      },
      {
        question: 'Apakah anda pengusaha?',
        type: 'MultipleChoice',
        nourut: 15,
        is_active: 1,
      },
      {
        question: 'Apakah perusahaan anda adalah perusahaan keluarga?',
        type: 'MultipleChoice',
        nourut: 16,
        is_active: 1,
      },
      {
        question: 'Apakah anda memiliki surat wasiat?',
        type: 'MultipleChoice',
        nourut: 17,
        is_active: 1,
      },
      {
        question:
          'Apakah anda memiliki keinginan untuk meninggalkan legacy dalam bentuk lain misalnya untuk charity atau hal lain yang anda support?',
        type: 'MultipleChoice',
        nourut: 18,
        is_active: 1,
      },
    ];
  }

  public formanswer() {
    return [
      {
        question_id: 1,
        text_answer: 'Iya',
        alert_answer:
          'Tanpa perjanjian nikah, harta bersama atau harta gono gini harus dibagi 2 apabila ada perceraian atau apabila ada risiko tutup usia salah satu pasangan',
        nourut: 1,
      },
      {
        question_id: 1,
        text_answer: 'Tidak',
        alert_answer: '',
        nourut: 2,
      },
      {
        question_id: 2,
        text_answer: 'Pertama',
        alert_answer: '',
        nourut: 1,
      },
      {
        question_id: 2,
        text_answer: 'Lebih dari 1',
        alert_answer:
          'Apabila memiliki anak dari pernikahan sebelumnya, anak bawaan memiliki hak legitimate portie untuk warisan',
        nourut: 2,
      },
      {
        question_id: 3,
        text_answer: '1',
        alert_answer: '',
        nourut: 1,
      },
      {
        question_id: 3,
        text_answer: '> 1',
        alert_answer:
          'Apabila memiliki anak dari pernikahan sebelumnya, anak bawaan memiliki hak legitimate portie untuk warisan',
        nourut: 2,
      },
      {
        question_id: 4,
        text_answer: '1',
        alert_answer: '',
        nourut: 1,
      },
      {
        question_id: 4,
        text_answer: '> 1',
        alert_answer:
          'Pembagian warisan harus memenuhi legitimate portie. Apabila tidak memenuhi legitimate portie, ahli waris berhak melakukan gugatan waris.',
        nourut: 2,
      },
      {
        question_id: 5,
        text_answer: 'Iya',
        alert_answer:
          'Apabila terjadi risiko tutup usia, anak yang berumur di bawah 18 tahun harus memiliki wali',
        nourut: 1,
      },
      {
        question_id: 5,
        text_answer: 'Tidak',
        alert_answer: '',
        nourut: 2,
      },
      {
        question_id: 6,
        text_answer: 'Iya',
        alert_answer:
          'Menurut UU no 5 tahun 1950 tentang Peraturan Dasar Pokok-Pokok Agraria, WNA hanya memiliki hak pakai dan hak sewa atas tanah dan bangunan di Indonesia',
        nourut: 1,
      },
      {
        question_id: 6,
        text_answer: 'Tidak',
        alert_answer: '',
        nourut: 2,
      },
      {
        question_id: 7,
        text_answer: 'Iya',
        alert_answer:
          'Menurut UU no 5 tahun 1950 tentang Peraturan Dasar Pokok-Pokok Agraria, WNA hanya memiliki hak pakai dan hak sewa atas tanah dan bangunan di Indonesia',
        nourut: 1,
      },
      {
        question_id: 7,
        text_answer: 'Tidak',
        alert_answer: '',
        nourut: 2,
      },
      {
        question_id: 8,
        text_answer: 'Iya',
        alert_answer:
          'Untuk non muslim, hibah satu garis keturunan dapat ditarik kembali untuk perhitungan waris.',
        nourut: 1,
      },
      {
        question_id: 8,
        text_answer: 'Tidak',
        alert_answer: '',
        nourut: 2,
      },
      {
        question_id: 9,
        text_answer: 'Islam/Muslim',
        alert_answer:
          'Pengaturan hak waris untuk Muslim dapat mengikuti 2 ketentuan : Hukum Faraidh dan Kompilasi Hukum Islam (HKI). Keduanya bisa sedikit berbeda dalam pelaksanaannya.',
        nourut: 1,
      },
      {
        question_id: 9,
        text_answer: 'Kristen Protestan',
        alert_answer: '',
        nourut: 2,
      },
      {
        question_id: 9,
        text_answer: 'Katolik',
        alert_answer: '',
        nourut: 3,
      },
      {
        question_id: 9,
        text_answer: 'Hindu',
        alert_answer: '',
        nourut: 4,
      },
      {
        question_id: 9,
        text_answer: 'Buddha',
        alert_answer: '',
        nourut: 5,
      },
      {
        question_id: 9,
        text_answer: 'Konghucu',
        alert_answer: '',
        nourut: 6,
      },
      {
        question_id: 10,
        text_answer: 'Iya',
        alert_answer:
          'Dana pensiun mesti setara dengan pengeluaran untuk usia harapan hidup dikurangi usia saat pensiun serta dengan mempertimbankan tingkat inflasi.',
        nourut: 1,
      },
      {
        question_id: 10,
        text_answer: 'Tidak',
        alert_answer:
          'Dana pensiun mesti setara dengan pengeluaran untuk usia harapan hidup dikurangi usia saat pensiun serta dengan mempertimbankan tingkat inflasi.',
        nourut: 2,
      },
      {
        question_id: 11,
        text_answer: 'Iya',
        alert_answer:
          'Apabila terjadi risiko tutup usia, ahli waris harus membayar BPHTB sebesar 50% dari BPHTP terutang (saat ini 5%).  Dana likuid untuk BPHTB bagi ahli waris harus sudah dipersiapkan tanpa mengganggu cashflow.',
        nourut: 1,
      },
      {
        question_id: 11,
        text_answer: 'Tidak',
        alert_answer: '',
        nourut: 2,
      },
      {
        question_id: 12,
        text_answer: 'Iya',
        alert_answer:
          'Apabila agunan diatasnamakan ke salah satu pihak ahli waris, maka pihak ahli waris lainnya dapat melakukan gugatan waris.',
        nourut: 1,
      },
      {
        question_id: 12,
        text_answer: 'Tidak',
        alert_answer: '',
        nourut: 2,
      },
      {
        question_id: 13,
        text_answer: 'Iya',
        alert_answer:
          'Apabila terjadi risiko tutup usia, aset di bank akan dibekukan hingga proses pewarisan selesai.',
        nourut: 1,
      },
      {
        question_id: 13,
        text_answer: 'Tidak',
        alert_answer: '',
        nourut: 2,
      },
      {
        question_id: 14,
        text_answer: 'Iya',
        alert_answer:
          'Aset yang ditempatkan di safe deposit box di bank adalah termasuk dalam aset yang akan dibekukan apabila terjadi risiko tutup usia.',
        nourut: 1,
      },
      {
        question_id: 14,
        text_answer: 'Tidak',
        alert_answer: '',
        nourut: 2,
      },
      {
        question_id: 15,
        text_answer: 'Iya',
        alert_answer:
          'Apakah anda telah mempersiapkan suksesi bisnis dari anda ke suksesor yang ditunjuk?',
        nourut: 1,
      },
      {
        question_id: 15,
        text_answer: 'Tidak',
        alert_answer: '',
        nourut: 2,
      },
      {
        question_id: 16,
        text_answer: 'Iya',
        alert_answer:
          'Apakah anda adalah generasi pertama atau generasi kedua dan lebih dalam bisnis perusahaan keluarga ini? Apakah anda telah melibatkan profesional dalam pengaturan suksesi bisnis? Pembagian saham, keuntungan serta perbedaan generasi adalah salah satu yang harus direncanakan dalam suksesi bisnis supaya tidak mengganggu operasional dan keberlanjutan bisnis.',
        nourut: 1,
      },
      {
        question_id: 16,
        text_answer: 'Tidak',
        alert_answer: '',
        nourut: 2,
      },
      {
        question_id: 17,
        text_answer: 'Iya',
        alert_answer: '',
        nourut: 1,
      },
      {
        question_id: 17,
        text_answer: 'Tidak',
        alert_answer:
          'Tanpa adanya surat wasiat, ada kemungkinan keinginan anda sebagai pewaris tidak terlaksana dengan sempurna.',
        nourut: 2,
      },
      {
        question_id: 18,
        text_answer: 'Iya',
        alert_answer:
          'Charity dan legacy yang anda dukung mesti direncanakan dari sekarang supaya pendistribusiannya dapat berjalan sempurna',
        nourut: 1,
      },
      {
        question_id: 18,
        text_answer: 'Tidak',
        alert_answer: '',
        nourut: 2,
      },
    ];
  }
}
export const datasurvey = new DataSurvey();
