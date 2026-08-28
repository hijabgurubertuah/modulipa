import { AppModule, QuizConfig, ClassItem, StudentItem, AppSettings, GameItem } from '../types';
import { GAME_TEMPLATES } from '../utils/gameTemplates';

export const DEFAULT_MODULE_PASSWORDS: Record<number, string> = {
  2: '121212',
  3: '133133',
  4: '121212',
  5: '121212',
  6: '121212',
  7: '121212',
  8: '121212'
};

export const DEFAULT_MODULE_METADATA = [
  { id: 1, title: 'Modul 1', subtitle: 'Pengenalan & Persiapan Berkebun', icon: 'Sprout' },
  { id: 2, title: 'Modul 2', subtitle: 'Pemilihan Benih & Pembibitan', icon: 'Seedling' },
  { id: 3, title: 'Modul 3', subtitle: 'Pemeliharaan & Kebutuhan Air', icon: 'Droplets' },
  { id: 4, title: 'Modul 4', subtitle: 'Pemupukan Organik & Nutrisi', icon: 'Leaf' },
  { id: 5, title: 'Modul 5', subtitle: 'Pengendalian Hama Alami', icon: 'Bug' },
  { id: 6, title: 'Modul 6', subtitle: 'Panen & Pasca Panen', icon: 'Apple' },
  { id: 7, title: 'Modul 7', subtitle: 'Pemanfaatan Hasil Kebun', icon: 'ShoppingBag' },
  { id: 8, title: 'Modul 8', subtitle: 'Proyek Mandiri & Evaluasi', icon: 'Award' }
];

export const getDefaultModules = (): AppModule[] => [
  {
    id: 1,
    title: 'Modul 1',
    subtitle: 'Pengenalan & Persiapan Berkebun',
    password: '',
    icon: 'Sprout',
    order: 1,
    isPublished: true,
    pages: [
      {
        id: 0,
        title: 'Apa Itu Berkebun Ramah Lingkungan?',
        titleSize: 'lg',
        content: `Berkebun di lingkungan sekolah bukan sekadar menanam, melainkan langkah nyata menjaga kelestarian bumi dan memahami siklus hidup tumbuhan.\n\nBeberapa manfaat utama berkebun:\n1. **Menghasilkan Oksigen Segar**: Tanaman melalui fotosintesis menyerap karbon dioksida dan menghasilkan oksigen bersih.\n2. **Kemandirian Pangan**: Menghasilkan sayuran segar tanpa pestisida kimia berbahaya.\n3. **Melatih Tanggung Jawab**: Membiasakan siswa merawat dan menyiram tanaman secara konsisten.`,
        triggerQuestion: 'Mengapa tanah gembur sangat penting untuk akar tanaman yang baru tumbuh?'
      },
      {
        id: 1,
        title: 'Mengenal Media Tanam Berkualitas',
        titleSize: 'lg',
        content: `Media tanam yang ideal harus memiliki porositas yang baik (dapat mengalirkan kelebihan air) namun tetap mampu mengikat kelembapan dan unsur hara.\n\nKomposisi ideal media tanam pot/polybag:\n- **1 Bagian Tanah Subur**: Tanah lapisan atas (topsoil) kaya mikroorganisme.\n- **1 Bagian Kompos / Pupuk Kandang**: Sumber nutrisi organik alami.\n- **1 Bagian Sekam Bakar / Arang Sekam**: Menjaga kegemburan tanah dan sirkulasi udara akar.`,
        triggerQuestion: 'Apa fungsi arang sekam dalam campuran media tanam?'
      },
      {
        id: 2,
        title: 'Alat dan Wadah Tanam',
        titleSize: 'lg',
        content: `Untuk memulai berkebun di sekolah, kita dapat memanfaatkan berbagai wadah:\n\n- **Pot Plastik & Polybag**: Praktis, ringan, dan mudah dipindahkan.\n- **Wadah Daur Ulang**: Botol bekas air mineral atau kaleng bekas dengan lubang drainase di bagian bawah.\n- **Sekop Kecil & Gembor**: Memudahkan pencampuran tanah dan penyiraman lembut pada bibit.`,
        triggerQuestion: 'Mengapa wadah tanam wajib memiliki lubang drainase di bawahnya?'
      },
      {
        id: 3,
        title: 'Game Edukasi: Tebak Sayuran & Alat Berkebun',
        titleSize: 'lg',
        content: 'Buka kartu dan temukan pasangan tanaman & alat berkebun yang cocok. Selesaikan minimal Level 4 untuk melanjutkan materi kuis!',
        isGame: true,
        gameId: 'game_1',
        gameType: 'modular_game1',
        gameInstructions: 'Buka kartu dan temukan pasangan tanaman & alat berkebun yang cocok. Capai minimal Level 4.',
        gamePassScore: 4
      },
      {
        id: 4,
        title: 'Kuis & Evaluasi Modul 1',
        titleSize: 'lg',
        content: '',
        isFinalQuiz: true
      }
    ]
  },
  {
    id: 2,
    title: 'Modul 2',
    subtitle: 'Pemilihan Benih & Pembibitan',
    password: '1212',
    icon: 'Seedling',
    order: 2,
    isPublished: true,
    pages: [
      {
        id: 0,
        title: 'Kriteria Benih Unggul dan Sehat',
        titleSize: 'lg',
        content: `Keberhasilan panen berawal dari pemilihan benih yang berkualitas tinggi.\n\nCiri-ciri benih yang baik:\n- **Daya Kecambah Tinggi**: Minimal di atas 80% benih mampu bertunas.\n- **Bentuk Utuh & Bersih**: Tidak keriput, tidak berjamur, dan tidak berlubang dimakan serangga.\n- **Tenggelam Saat Direndam**: Benih yang tenggelam dalam air memiliki endosperma (cadangan makanan) yang padat.`,
        triggerQuestion: 'Mengapa benih yang mengapung di air sebaiknya dibuang?'
      },
      {
        id: 1,
        title: 'Teknik Penyemaian Benih',
        titleSize: 'lg',
        content: `Penyemaian bertujuan memberi perlindungan awal bagi embrio tanaman sebelum dipindahkan ke wadah tanam utama.\n\nTahapan penyemaian:\n1. Basahi media semai (cocopeat/tanah halus) hingga lembap.\n2. Tanam benih sedalam 0,5 - 1 cm.\n3. Letakkan di tempat teduh hingga berkecambah (2-4 hari).\n4. Setelah daun sejati muncul (3-4 helai daun), bibit siap dipindahkan.`,
        triggerQuestion: 'Kapan waktu terbaik memindahkan bibit semai ke pot pembesaran?'
      },
      {
        id: 2,
        title: 'Game Edukasi: Tebak Pasangan Tanaman Pangan',
        titleSize: 'lg',
        content: 'Temukan pasangan kartu tanaman pangan lokal dan rimpang hingga minimal Level 4 untuk melanjutkan materi!',
        isGame: true,
        gameId: 'game_2',
        gameType: 'modular_game2',
        gameInstructions: 'Buka kartu dan pasangkan tanaman pangan lokal hingga minimal Level 4.',
        gamePassScore: 4
      },
      {
        id: 3,
        title: 'Kuis & Evaluasi Modul 2',
        titleSize: 'lg',
        content: '',
        isFinalQuiz: true
      }
    ]
  },
  {
    id: 3,
    title: 'Modul 3',
    subtitle: 'Pemeliharaan & Kebutuhan Air',
    password: '1331',
    icon: 'Droplets',
    order: 3,
    isPublished: true,
    pages: [
      {
        id: 0,
        title: 'Kebutuhan Air dan Waktu Penyiraman',
        titleSize: 'lg',
        content: `Air adalah komponen vital dalam proses fotosintesis dan pengangkutan unsur hara dari akar ke seluruh bagian tanaman.\n\nAturan penting penyiraman:\n- **Waktu Terbaik**: Pagi hari (pukul 06.30 - 08.30) atau sore hari (pukul 16.00 - 17.30).\n- **Hindari Siang Terik**: Air pada daun saat siang panas dapat menyebabkan daun terbakar (*sun scald*) dan penguapan terlalu cepat.\n- **Siram Bagian Media**: Fokuskan siraman ke area akar/tanah, bukan daun.`,
        triggerQuestion: 'Mengapa penyiraman tidak disarankan saat tengah hari terik?'
      },
      {
        id: 1,
        title: 'Kebutuhan Cahaya Matahari',
        titleSize: 'lg',
        content: `Tanaman sayur daun (seperti bayam, kangkung, sawi) dan buah (seperti tomat, cabai) membutuhkan sinar matahari langsung minimal 4 - 6 jam sehari untuk fotosintesis optimal.\n\nGejala kekurangan cahaya (**Etiolasi**):\n- Batang tumbuh kurus, tinggi, dan pucat.\n- Daun berwarna kuning muda dan tanaman mudah rebah.`,
        triggerQuestion: 'Apa tanda fisik tanaman yang mengalami etiolasi (kurang sinar matahari)?'
      },
      {
        id: 2,
        title: 'Game Edukasi: Tebak Pasangan Bumbu & Rimpang',
        titleSize: 'lg',
        content: 'Buka dan pasangkan kartu rimpang bumbu dapur dan tanaman obat secara tepat hingga minimal Level 4!',
        isGame: true,
        gameId: 'game_3',
        gameType: 'modular_game3',
        gameInstructions: 'Buka dan pasangkan rimpang bumbu kebun secara tepat hingga Level 4.',
        gamePassScore: 4
      },
      {
        id: 3,
        title: 'Kuis & Evaluasi Modul 3',
        titleSize: 'lg',
        content: '',
        isFinalQuiz: true
      }
    ]
  },
  {
    id: 4,
    title: 'Modul 4',
    subtitle: 'Pemupukan Organik & Nutrisi',
    password: '1212',
    icon: 'Leaf',
    order: 4,
    isPublished: true,
    pages: [
      {
        id: 0,
        title: 'Unsur Hara Makro dan Mikro',
        titleSize: 'lg',
        content: `Tumbuhan membutuhkan nutrisi lengkap untuk pertumbuhan vegetatif dan generatif:\n\n- **Nitrogen (N)**: Merangsang pertumbuhan daun dan batang hijau segar.\n- **Fosfor (P)**: Memperkuat perakaran dan mempercepat pembungaan.\n- **Kalium (K)**: Meningkatkan daya tahan dari penyakit dan membesarkan buah.`,
        triggerQuestion: 'Unsur hara apa yang paling dibutuhkan tanaman sayuran daun?'
      },
      {
        id: 1,
        title: 'Membuat Kompos Organik Sekolah',
        titleSize: 'lg',
        content: `Sampah daun kering dan sisa kantin sekolah dapat diubah menjadi pupuk kompos berkualitas tinggi:\n\n1. Kumpulkan daun kering (unsur C/karbon) dan sisa sayuran (unsur N/nitrogen).\n2. Campur dan siram dengan bioaktivator (seperti EM4 atau air cucian beras).\n3. Simpan di wadah tertutup dan aduk setiap minggu.\n4. Dalam 3-4 minggu, kompos siap digunakan jika berwarna kehitaman dan berbau tanah segar.`,
        triggerQuestion: 'Bagaimana ciri-ciri fisik pupuk kompos yang telah matang sempurna?'
      },
      {
        id: 2,
        title: 'Game Edukasi: Tantangan Memori Berkebun',
        titleSize: 'lg',
        content: 'Buka kartu dan cocokkan pasangannya sebelum waktu habis untuk melatih ketangkasan dan fokus berkebun!',
        isGame: true,
        gameId: 'game_memory',
        gameType: 'memory',
        gameInstructions: 'Buka kartu dan cocokkan pasangannya sebelum waktu habis.',
        gamePassScore: 100
      },
      {
        id: 3,
        title: 'Kuis & Evaluasi Modul 4',
        titleSize: 'lg',
        content: '',
        isFinalQuiz: true
      }
    ]
  },
  {
    id: 5,
    title: 'Modul 5',
    subtitle: 'Pengendalian Hama Alami',
    password: '1212',
    icon: 'Bug',
    order: 5,
    isPublished: true,
    pages: [
      {
        id: 0,
        title: 'Mengenal Hama Umum Tanaman Kebun',
        titleSize: 'lg',
        content: `Beberapa organisme pengganggu tanaman yang sering dijumpai:\n\n- **Kutu Daun (Aphids)**: Menghisap cairan daun hingga keriput.\n- **Ulat Grayak**: Memakan helai daun hingga berlubang.\n- **Belalang & Siput**: Memotong pucuk daun muda.`,
        triggerQuestion: 'Mengapa penggunaan pestisida kimia sintetis sebaiknya dihindari di kebun sekolah?'
      },
      {
        id: 1,
        title: 'Pestisida Nabati Ramah Lingkungan',
        titleSize: 'lg',
        content: `Pestisida nabati dibuat dari bahan herbal di sekitar kita:\n\n- **Ekstrak Bawang Putih**: Mengandung allicin alami pengusir serangga dan antijamur.\n- **Air Rebusan Daun Pepaya**: Mengandung papain yang pahit bagi ulat.\n- **Ekstrak Cabai**: Mengusir serangga pengunyah.\n\nSemprotkan pestisida nabati pada sore hari di bagian bawah daun.`,
        triggerQuestion: 'Kapan waktu penyemprotan pestisida nabati yang paling efektif?'
      },
      {
        id: 2,
        title: 'Game Edukasi: Tebak Kata Pintar Fotosintesis',
        titleSize: 'lg',
        content: 'Pilih huruf pada keyboard virtual untuk menebak kata misteri sesuai petunjuk fotosintesis!',
        isGame: true,
        gameId: 'game_word_guess',
        gameType: 'custom_html',
        gameCode: GAME_TEMPLATES[0].code,
        gameInstructions: 'Pilih huruf pada keyboard virtual untuk menebak kata misteri sesuai petunjuk fotosintesis yang diberikan.',
        gamePassScore: 70
      },
      {
        id: 3,
        title: 'Kuis & Evaluasi Modul 5',
        titleSize: 'lg',
        content: '',
        isFinalQuiz: true
      }
    ]
  },
  {
    id: 6,
    title: 'Modul 6',
    subtitle: 'Panen & Pasca Panen',
    password: '1212',
    icon: 'Apple',
    order: 6,
    isPublished: true,
    pages: [
      {
        id: 0,
        title: 'Menentukan Waktu Panen yang Tepat',
        titleSize: 'lg',
        content: `Pemanenan harus dilakukan pada usia panen optimal agar sayuran renyah, segar, dan tidak berserat kasar.\n\nContoh usia panen sayuran umum:\n- **Kangkung & Bayam**: 20 - 25 hari setelah semai.\n- **Sawi / Pakcoy**: 30 - 35 hari setelah semai.\n- **Cabai & Tomat**: 75 - 90 hari setelah tanam.`,
        triggerQuestion: 'Apa akibatnya jika sayuran bayam dipanen terlalu tua?'
      },
      {
        id: 1,
        title: 'Teknik Panen dan Penanganan Pasca Panen',
        titleSize: 'lg',
        content: `Langkah pemanenan yang baik:\n1. Panen di pagi hari sebelum matahari menyengat agar daun tidak layu.\n2. Potong atau cabut tanaman dengan hati-hati.\n3. Cuci akar dan daun dengan air bersih mengalir.\n4. Tiriskan dan simpan di tempat sejuk terlindung dari panas.`,
        triggerQuestion: 'Mengapa panen sayuran daun paling baik dilakukan di pagi hari?'
      },
      {
        id: 2,
        title: 'Game Edukasi: Kuis Cepat Berwaktu IPA Hijau',
        titleSize: 'lg',
        content: 'Pilih opsi jawaban yang benar sebelum waktu 15 detik habis untuk mendapatkan skor maksimal!',
        isGame: true,
        gameId: 'game_speed_quiz',
        gameType: 'custom_html',
        gameCode: GAME_TEMPLATES[1].code,
        gameInstructions: 'Pilih opsi jawaban yang benar sebelum waktu 15 detik habis!',
        gamePassScore: 60
      },
      {
        id: 3,
        title: 'Kuis & Evaluasi Modul 6',
        titleSize: 'lg',
        content: '',
        isFinalQuiz: true
      }
    ]
  },
  {
    id: 7,
    title: 'Modul 7',
    subtitle: 'Pemanfaatan Hasil Kebun',
    password: '1212',
    icon: 'ShoppingBag',
    order: 7,
    isPublished: true,
    pages: [
      {
        id: 0,
        title: 'Konsumsi Sehat & Ketahanan Gizi Siswa',
        titleSize: 'lg',
        content: `Sayuran segar yang dipanen sendiri mengandung vitamin A, C, zat besi, dan serat tinggi tanpa residu pestisida kimiawi.\n\nManfaat mengonsumsi sayuran segar hasil kebun sekolah:\n- Meningkatkan daya tahan tubuh dan kecerdasan otak.\n- Menumbuhkan apresiasi terhadap kerja keras petani dan alam.`,
        triggerQuestion: 'Sebutkan vitamin dan mineral penting yang terkandung dalam sayuran hijau!'
      },
      {
        id: 1,
        title: 'Kewirausahaan Hijau (Green Entrepreneurship)',
        titleSize: 'lg',
        content: `Hasil kebun sekolah juga dapat dikemas rapi dan dijual di acara sekolah (Bazar/Market Day):\n\n1. **Sortir Kualitas**: Pisahkan sayuran segar terbaik.\n2. **Kemasan Bersih**: Gunakan kemasan daun pisang atau kertas ramah lingkungan.\n3. **Pelabelan**: Beri label "Sayuran Organik Segar SMPN 1 Bengkalis".`,
        triggerQuestion: 'Bagaimana cara meningkatkan nilai jual sayuran hasil kebun sekolah?'
      },
      {
        id: 2,
        title: 'Game Edukasi: Tangkap Bintang Pengetahuan',
        titleSize: 'lg',
        content: 'Gunakan tombol kontrol untuk mengarahkan keranjang menangkap 10 bintang ilmu pengetahuan!',
        isGame: true,
        gameId: 'game_star_catcher',
        gameType: 'custom_html',
        gameCode: GAME_TEMPLATES[2].code,
        gameInstructions: 'Gunakan tombol keyboard panah Kiri/Kanan atau tombol di layar untuk mengarahkan keranjang menangkap 10 bintang!',
        gamePassScore: 100
      },
      {
        id: 3,
        title: 'Kuis & Evaluasi Modul 7',
        titleSize: 'lg',
        content: '',
        isFinalQuiz: true
      }
    ]
  },
  {
    id: 8,
    title: 'Modul 8',
    subtitle: 'Proyek Mandiri & Evaluasi',
    password: '1212',
    icon: 'Award',
    order: 8,
    isPublished: true,
    pages: [
      {
        id: 0,
        title: 'Membuat Jurnal Pengamatan Berkebun',
        titleSize: 'lg',
        content: `Jurnal pengamatan membantu siswa mendokumentasikan perkembangan tanaman secara ilmiah.\n\nHal-hal yang dicatat dalam jurnal:\n- Tanggal semai dan tinggi tanaman setiap minggu.\n- Jumlah helai daun dan warna daun.\n- Catatan penyiraman, pemupukan, dan kendala hama yang dihadapi.`,
        triggerQuestion: 'Mengapa pencatatan berkala penting dalam metode ilmiah berkebun?'
      },
      {
        id: 1,
        title: 'Komitmen Menjaga Kelestarian Lingkungan',
        titleSize: 'lg',
        content: `Berkebun adalah wujud nyata kepedulian terhadap lingkungan hidup.\n\nMari jadikan kebun sekolah dan pekarangan rumah sebagai ruang hijau yang produktif, indah, dan berkelanjutan bagi masa depan kita bersama!`,
        triggerQuestion: 'Apa komitmen pribadimu dalam merawat tanaman di rumah dan sekolah?'
      },
      {
        id: 2,
        title: 'Game Edukasi: Flashcard Interaktif Konsep Berkebun',
        titleSize: 'lg',
        content: 'Klik kartu untuk membalik dan melihat kunci jawaban, lalu tandai jika kamu sudah menghafal konsep tersebut!',
        isGame: true,
        gameId: 'game_react_flashcard',
        gameType: 'custom_tsx',
        gameCode: GAME_TEMPLATES[3].code,
        gameInstructions: 'Klik kartu untuk membalik dan melihat kunci jawaban, lalu tekan tombol Sudah Hafal jika berhasil mengingat konsep.',
        gamePassScore: 100
      },
      {
        id: 3,
        title: 'Kuis & Evaluasi Modul 8',
        titleSize: 'lg',
        content: '',
        isFinalQuiz: true
      }
    ]
  }
];

export const getDefaultQuizzes = (): QuizConfig[] => [
  {
    moduleNumber: 1,
    title: 'Kuis Modul 1 - Pengenalan Berkebun',
    questions: [
      {
        id: 1,
        question: 'Komposisi ideal media tanam pot yang baik dan gembur adalah campuran dari...',
        options: [
          { id: 'A', text: 'Tanah subur, pupuk kompos, dan arang sekam' },
          { id: 'B', text: 'Pasir pantai, kerikil, dan tanah liat' },
          { id: 'C', text: 'Tanah liat murni dan air cucian sabun' },
          { id: 'D', text: 'Batu bata dan abu gosok' }
        ],
        correctId: 'A',
        explanation: 'Kombinasi tanah subur, kompos organik, dan arang sekam (1:1:1) memberikan aerasi, porositas, dan nutrisi yang seimbang.'
      },
      {
        id: 2,
        question: 'Mengapa wadah pot tanaman harus memiliki lubang di bagian dasarnya?',
        options: [
          { id: 'A', text: 'Agar air tidak menggenang dan akar tidak membusuk' },
          { id: 'B', text: 'Supaya cacing tanah cepat keluar' },
          { id: 'C', text: 'Untuk mempercepat penguapan pupuk' },
          { id: 'D', text: 'Hanya sebagai hiasan pot' }
        ],
        correctId: 'A',
        explanation: 'Lubang drainase mencegah kelebihan air menggenang yang dapat memicu pembusukan akar oleh jamur/bakteri.'
      },
      {
        id: 3,
        question: 'Gas apa yang diserap oleh tanaman saat proses fotosintesis di siang hari?',
        options: [
          { id: 'A', text: 'Karbon Dioksida (CO2)' },
          { id: 'B', text: 'Oksigen (O2)' },
          { id: 'C', text: 'Karbon Monoksida (CO)' },
          { id: 'D', text: 'Helium (He)' }
        ],
        correctId: 'A',
        explanation: 'Tanaman menyerap Karbon Dioksida (CO2) dan air dengan bantuan klorofil dan cahaya matahari untuk menghasilkan oksigen dan glukosa.'
      },
      {
        id: 4,
        question: 'Berikut ini yang BUKAN merupakan manfaat berkebun di sekolah adalah...',
        options: [
          { id: 'A', text: 'Mencemari lingkungan dengan limbah plastik' },
          { id: 'B', text: 'Melatih tanggung jawab dan kerja sama siswa' },
          { id: 'C', text: 'Menghasilkan sayuran segar dan sehat' },
          { id: 'D', text: 'Menciptakan suasana sekolah yang asri dan sejuk' }
        ],
        correctId: 'A',
        explanation: 'Berkebun ramah lingkungan justru memanfaatkan sampah daur ulang dan mengurangi polusi.'
      },
      {
        id: 5,
        question: 'Alat berkebun yang digunakan untuk menyiram tanaman dengan semprotan air lembut adalah...',
        options: [
          { id: 'A', text: 'Gembor / Sprayer' },
          { id: 'B', text: 'Sekop besar' },
          { id: 'C', text: 'Cangkul tanah' },
          { id: 'D', text: 'Gunting dahan' }
        ],
        correctId: 'A',
        explanation: 'Gembor atau sprayer menghasilkan butiran air halus sehingga tidak merusak bibit muda yang baru tumbuh.'
      }
    ]
  },
  {
    moduleNumber: 2,
    title: 'Kuis Modul 2 - Pembibitan & Benih',
    questions: [
      {
        id: 1,
        question: 'Cara sederhana menguji benih yang padat dan berkualitas baik adalah...',
        options: [
          { id: 'A', text: 'Merendam dalam air, benih yang baik akan tenggelam' },
          { id: 'B', text: 'Menjemur di bawah terik matahari hingga gosong' },
          { id: 'C', text: 'Memilih benih yang mengapung di permukaan air' },
          { id: 'D', text: 'Mengupas seluruh kulit benih' }
        ],
        correctId: 'A',
        explanation: 'Benih yang tenggelam memiliki cadangan makanan (endosperma) yang padat dan embrio yang sehat.'
      },
      {
        id: 2,
        question: 'Jumlah daun sejati pada bibit yang menandakan siap dipindahkan ke media pembesaran adalah...',
        options: [
          { id: 'A', text: '3 sampai 4 helai daun' },
          { id: 'B', text: '1 helai daun kuncup' },
          { id: 'C', text: 'Minimal 20 helai daun' },
          { id: 'D', text: 'Setelah berbunga mekar' }
        ],
        correctId: 'A',
        explanation: 'Bibit dengan 3-4 daun sejati sudah memiliki perakaran yang cukup kuat untuk adaptasi di media pot baru.'
      },
      {
        id: 3,
        question: 'Tujuan utama dilakukannya penyemaian benih sebelum ditanam langsung di lahan adalah...',
        options: [
          { id: 'A', text: 'Melindungi kecambah muda dari hama dan terik cuaca' },
          { id: 'B', text: 'Membuat tanaman tidak membutuhkan air lagi' },
          { id: 'C', text: 'Mengubah warna daun menjadi merah' },
          { id: 'D', text: 'Menghambat pertumbuhan tanaman' }
        ],
        correctId: 'A',
        explanation: 'Penyemaian memberi proteksi dan nutrisi optimal pada fase awal pertumbuhan tanaman yang rentan.'
      },
      {
        id: 4,
        question: 'Media semai yang baik memiliki karakteristik...',
        options: [
          { id: 'A', text: 'Halus, gembur, lembap, dan steril' },
          { id: 'B', text: 'Keras, berbatu, dan kering' },
          { id: 'C', text: 'Penuh dengan kerikil tajam' },
          { id: 'D', text: 'Mengandung deterjen' }
        ],
        correctId: 'A',
        explanation: 'Media semai harus berstruktur halus agar akar kecambah yang masih lembut mudah menembusnya.'
      },
      {
        id: 5,
        question: 'Kedalaman tanam benih sayuran kecil saat penyemaian umumnya berkisar antara...',
        options: [
          { id: 'A', text: '0,5 cm - 1 cm' },
          { id: 'B', text: '15 cm - 20 cm' },
          { id: 'C', text: '50 cm' },
          { id: 'D', text: '1 meter' }
        ],
        correctId: 'A',
        explanation: 'Benih sayur kecil cukup ditanam dangkal (0,5 - 1 cm) agar tunas mampu mencapai permukaan tanah dengan mudah.'
      }
    ]
  },
  {
    moduleNumber: 3,
    title: 'Kuis Modul 3 - Pemeliharaan & Kebutuhan Air',
    questions: [
      {
        id: 1,
        question: 'Waktu terbaik untuk menyiram tanaman adalah...',
        options: [
          { id: 'A', text: 'Pagi hari (06.30-08.30) atau sore hari (16.00-17.30)' },
          { id: 'B', text: 'Tengah hari saat matahari paling panas' },
          { id: 'C', text: 'Tengah malam pukul 00.00' },
          { id: 'D', text: 'Hanya seminggu sekali' }
        ],
        correctId: 'A',
        explanation: 'Pagi dan sore hari suhu tanah tidak terlalu tinggi, sehingga air terserap optimal tanpa menguap berlebihan atau merusak akar.'
      },
      {
        id: 2,
        question: 'Kondisi tanaman yang tumbuh kurus, pucat, dan batang memanjang akibat kurang cahaya matahari disebut...',
        options: [
          { id: 'A', text: 'Etiolasi' },
          { id: 'B', text: 'Fotosintesis' },
          { id: 'C', text: 'Transpirasi' },
          { id: 'D', text: 'Gutasi' }
        ],
        correctId: 'A',
        explanation: 'Etiolasi terjadi saat hormon auksin memacu pertumbuhan batang mencari arah datangnya cahaya matahari.'
      },
      {
        id: 3,
        question: 'Berapa durasi minimal paparan sinar matahari langsung yang dibutuhkan sayuran daun setiap hari?',
        options: [
          { id: 'A', text: '4 - 6 jam' },
          { id: 'B', text: '10 menit' },
          { id: 'C', text: '24 jam nonstop' },
          { id: 'D', text: 'Tidak perlu sinar matahari' }
        ],
        correctId: 'A',
        explanation: 'Sayuran daun memerlukan sinar matahari minimal 4-6 jam agar proses fotosintesis berjalan maksimal.'
      },
      {
        id: 4,
        question: 'Apa akibat menyiram daun tanaman di bawah terik matahari siang?',
        options: [
          { id: 'A', text: 'Tetesan air dapat membiaskan panas dan membakar daun' },
          { id: 'B', text: 'Tanaman langsung berbuah lebat' },
          { id: 'C', text: 'Daun akan berubah menjadi biru' },
          { id: 'D', text: 'Akar menjadi sangat dingin' }
        ],
        correctId: 'A',
        explanation: 'Efek lensa tetesan air di bawah terik matahari dapat menyebabkan daun mengalami luka bakar (sun scald).'
      },
      {
        id: 5,
        question: 'Bagian tanaman yang paling tepat disiram agar air diserap sempurna adalah...',
        options: [
          { id: 'A', text: 'Bagian tanah di sekitar perakaran' },
          { id: 'B', text: 'Ujung bunga saja' },
          { id: 'C', text: 'Hanya dinding luar pot' },
          { id: 'D', text: 'Hanya udara di atas tanaman' }
        ],
        correctId: 'A',
        explanation: 'Rambut-rambut akar tanaman yang berada di dalam tanah bertugas utama menyerap air dan hara.'
      }
    ]
  },
  {
    moduleNumber: 4,
    title: 'Kuis Modul 4 - Nutrisi & Pupuk Organik',
    questions: [
      {
        id: 1,
        question: 'Unsur hara makro yang bertugas merangsang pertumbuhan daun hijau segar adalah...',
        options: [
          { id: 'A', text: 'Nitrogen (N)' },
          { id: 'B', text: 'Kalsium (Ca)' },
          { id: 'C', text: 'Zat Besi (Fe)' },
          { id: 'D', text: 'Boron (B)' }
        ],
        correctId: 'A',
        explanation: 'Nitrogen berperan kunci dalam pembentukan protein dan klorofil daun.'
      },
      {
        id: 2,
        question: 'Bahan berikut yang tergolong sampah cokelat (kaya Karbon) dalam pembuatan kompos adalah...',
        options: [
          { id: 'A', text: 'Daun kering dan serbuk gergaji' },
          { id: 'B', text: 'Sisa sayuran sawi hijau basah' },
          { id: 'C', text: 'Kulit pisang basah' },
          { id: 'D', text: 'Kotoran hewan segar' }
        ],
        correctId: 'A',
        explanation: 'Daun kering, ranting kecil, dan sekam merupakan sumber karbon yang mengimbangi unsur nitrogen dalam kompos.'
      },
      {
        id: 3,
        question: 'Tanda fisik kompos organik yang telah matang sempurna dan siap digunakan adalah...',
        options: [
          { id: 'A', text: 'Berwarna cokelat kehitaman, gembur, dan berbau tanah segar' },
          { id: 'B', text: 'Berbau busuk menyengat dan berlendir panas' },
          { id: 'C', text: 'Masih berupa daun hijau utuh' },
          { id: 'D', text: 'Berwarna putih seperti kapur' }
        ],
        correctId: 'A',
        explanation: 'Kompos matang bertekstur remah/gembur, berwarna gelap, bersuhu ruang, dan beraroma harum tanah hutan.'
      },
      {
        id: 4,
        question: 'Fungsi utama unsur Fosfor (P) bagi tanaman adalah...',
        options: [
          { id: 'A', text: 'Memicu pembentukan akar yang kokoh dan pembungaan' },
          { id: 'B', text: 'Membasmi ulat daun secara instan' },
          { id: 'C', text: 'Menggugurkan daun tua' },
          { id: 'D', text: 'Mewarnai bunga menjadi hitam' }
        ],
        correctId: 'A',
        explanation: 'Fosfor sangat penting untuk transfer energi (ATP), perkembangan perakaran, serta pembentukan bunga dan biji.'
      },
      {
        id: 5,
        question: 'Keunggulan utama pupuk kompos organik dibandingkan pupuk kimia sintetis adalah...',
        options: [
          { id: 'A', text: 'Memperbaiki struktur tanah dan menjaga mikroorganisme tanah tetap hidup' },
          { id: 'B', text: 'Membuat tanah menjadi keras dan tandus' },
          { id: 'C', text: 'Mengandung racun kimiawi' },
          { id: 'D', text: 'Harganya sangat mahal' }
        ],
        correctId: 'A',
        explanation: 'Pupuk organik menambah bahan humus, meningkatkan kapasitas ikat air, dan menyuburkan mikrobioma tanah secara lestari.'
      }
    ]
  },
  {
    moduleNumber: 5,
    title: 'Kuis Modul 5 - Pengendalian Hama Alami',
    questions: [
      {
        id: 1,
        question: 'Bahan dapur yang efektif diolah menjadi pestisida nabati pengusir serangga adalah...',
        options: [
          { id: 'A', text: 'Bawang putih dan daun pepaya' },
          { id: 'B', text: 'Gula pasir dan garam dapur pekat' },
          { id: 'C', text: 'Minyak goreng bekas kotor' },
          { id: 'D', text: 'Susu kental manis' }
        ],
        correctId: 'A',
        explanation: 'Bawang putih mengandung senyawa allicin beraroma tajam, sedangkan daun pepaya mengandung papain pahit yang tidak disukai serangga.'
      },
      {
        id: 2,
        question: 'Waktu yang paling tepat untuk menyemprotkan pestisida nabati adalah...',
        options: [
          { id: 'A', text: 'Sore hari saat cuaca teduh dan hama mulai aktif' },
          { id: 'B', text: 'Siang hari saat hujan lebat' },
          { id: 'C', text: 'Tengah hari saat matahari bersinar paling terik' },
          { id: 'D', text: 'Cukup sebulan sekali saja' }
        ],
        correctId: 'A',
        explanation: 'Penyemprotan di sore hari menjaga efektivitas bahan organik agar tidak cepat terurai oleh panas matahari langsung.'
      },
      {
        id: 3,
        question: 'Hama berukuran sangat kecil yang sering berkumpul di bawah daun dan menghisap cairan tanaman adalah...',
        options: [
          { id: 'A', text: 'Kutu Daun (Aphids)' },
          { id: 'B', text: 'Burung gereja' },
          { id: 'C', text: 'Kucing liar' },
          { id: 'D', text: 'Cacing tanah' }
        ],
        correctId: 'A',
        explanation: 'Kutu daun (aphids) menghisap cairan floem tanaman sehingga daun menjadi keriput dan pertumbuhan kerdil.'
      },
      {
        id: 4,
        question: 'Keuntungan penggunaan pestisida nabati adalah...',
        options: [
          { id: 'A', text: 'Aman bagi kesehatan manusia dan mudah terurai di alam' },
          { id: 'B', text: 'Membunuh seluruh serangga baik di bumi' },
          { id: 'C', text: 'Meninggalkan racun berbahaya pada sayuran' },
          { id: 'D', text: 'Membuat sayuran berasa pahit selamanya' }
        ],
        correctId: 'A',
        explanation: 'Pestisida nabati bersifat biodegradable (cepat terurai alami) sehingga tidak meninggalkan residu racun pada hasil panen.'
      },
      {
        id: 5,
        question: 'Cacing tanah yang hidup di dalam pot media tanam berfungsi sebagai...',
        options: [
          { id: 'A', text: 'Sahabat petani yang membantu menggemburkan tanah dan menghasilkan kascing' },
          { id: 'B', text: 'Hama pemakan akar utama' },
          { id: 'C', text: 'Penyebab daun menjadi kuning' },
          { id: 'D', text: 'Hewan perusak media tanam' }
        ],
        correctId: 'A',
        explanation: 'Cacing tanah membuat rongga aerasi dalam tanah dan kotorannya (kascing) sangat kaya akan nutrisi tanaman.'
      }
    ]
  },
  {
    moduleNumber: 6,
    title: 'Kuis Modul 6 - Panen & Pasca Panen',
    questions: [
      {
        id: 1,
        question: 'Berapa rata-rata usia panen untuk sayuran kangkung dan bayam cabut?',
        options: [
          { id: 'A', text: '20 - 25 hari setelah semai' },
          { id: 'B', text: '6 bulan' },
          { id: 'C', text: '1 tahun' },
          { id: 'D', text: '2 hari saja' }
        ],
        correctId: 'A',
        explanation: 'Kangkung dan bayam merupakan tanaman semusim berumur genjah yang dapat dipanen pada usia 20-25 hari.'
      },
      {
        id: 2,
        question: 'Mengapa pemanenan sayuran daun paling baik dilakukan di pagi hari?',
        options: [
          { id: 'A', text: 'Kandungan air dan kesegaran daun masih optimal' },
          { id: 'B', text: 'Agar daun cepat menguning' },
          { id: 'C', text: 'Supaya tanaman langsung mati' },
          { id: 'D', text: 'Karena harga sayur selalu naik di pagi hari' }
        ],
        correctId: 'A',
        explanation: 'Pagi hari tanaman belum mengalami transpirasi (penguapan) tinggi, sehingga sel-sel daun masih renyah dan segar.'
      },
      {
        id: 3,
        question: 'Tindakan pertama yang dilakukan setelah memanen sayuran adalah...',
        options: [
          { id: 'A', text: 'Membersihkan kotoran/tanah dengan air bersih mengalir dan menyortir' },
          { id: 'B', text: 'Menjemur di atas aspal panas' },
          { id: 'C', text: 'Menyimpan di dalam kantong plastik tertutup tanpa dicuci' },
          { id: 'D', text: 'Membiarkannya di bawah terik matahari seharian' }
        ],
        correctId: 'A',
        explanation: 'Pembersihan dan sortasi mencegah kontaminasi bakteri serta memisahkan daun yang rusak.'
      },
      {
        id: 4,
        question: 'Ciri fisik sayuran sawi yang siap dipanen adalah...',
        options: [
          { id: 'A', text: 'Daun telah melebar hijau segar, batang kokoh, dan belum berbunga' },
          { id: 'B', text: 'Daun sudah kering dan berwarna cokelat' },
          { id: 'C', text: 'Batang mengeluarkan bunga banyak dan berkayu keras' },
          { id: 'D', text: 'Daun berlubang habis dimakan ulat' }
        ],
        correctId: 'A',
        explanation: 'Jika sayuran sudah berbunga, batangnya akan berserat kasar dan rasa daunnya cenderung agak pahit.'
      },
      {
        id: 5,
        question: 'Metode panen kangkung agar dapat dipanen kembali (panen bertingkat) adalah...',
        options: [
          { id: 'A', text: 'Memotong batang dan menyisakan 3-5 cm di atas tanah' },
          { id: 'B', text: 'Mencabut beserta seluruh akarnya' },
          { id: 'C', text: 'Membakar pangkal batangnya' },
          { id: 'D', text: 'Membuang seluruh bagian tanah' }
        ],
        correctId: 'A',
        explanation: 'Dengan memotong batang di atas buku ruas, tunas cabang baru akan tumbuh kembali untuk panen kedua.'
      }
    ]
  },
  {
    moduleNumber: 7,
    title: 'Kuis Modul 7 - Pemanfaatan Hasil Kebun',
    questions: [
      {
        id: 1,
        question: 'Sayuran hijau yang dipanen segar dari kebun sendiri kaya akan kandungan...',
        options: [
          { id: 'A', text: 'Serat, Vitamin A, C, dan Zat Besi' },
          { id: 'B', text: 'Lemak jenuh dan kolesterol tinggi' },
          { id: 'C', text: 'Pengawet buatan' },
          { id: 'D', text: 'Pewarna sintetis' }
        ],
        correctId: 'A',
        explanation: 'Sayuran organik bebas bahan kimia dan kaya antioksidan serta mikronutrien penting untuk daya tahan tubuh.'
      },
      {
        id: 2,
        question: 'Contoh kemasan ramah lingkungan untuk produk sayuran kebun sekolah adalah...',
        options: [
          { id: 'A', text: 'Daun pisang segar atau besek bambu' },
          { id: 'B', text: 'Styrofoam tebal' },
          { id: 'C', text: 'Kantong kresek hitam sekali pakai' },
          { id: 'D', text: 'Kaleng bekas berkarat' }
        ],
        correctId: 'A',
        explanation: 'Kemasan alami seperti daun pisang dan anyaman bambu menambah nilai estetika produk sekaligus mengurangi sampah plastik.'
      },
      {
        id: 3,
        question: 'Istilah untuk kegiatan wirausaha yang berorientasi pada pelestarian alam dan produk ramah lingkungan adalah...',
        options: [
          { id: 'A', text: 'Green Entrepreneurship (Kewirausahaan Hijau)' },
          { id: 'B', text: 'Monopoli industri' },
          { id: 'C', text: 'Eksploitasi sumber daya' },
          { id: 'D', text: 'Deforestasi lahan' }
        ],
        correctId: 'A',
        explanation: 'Green Entrepreneurship memadukan nilai ekonomi dengan tanggung jawab pelestarian lingkungan hidup.'
      },
      {
        id: 4,
        question: 'Mengapa pelabelan produk sayuran hasil kebun sekolah itu penting saat dijual di Bazar?',
        options: [
          { id: 'A', text: 'Memberikan informasi keaslian produk organik dan identitas sekolah' },
          { id: 'B', text: 'Hanya agar terlihat mahal' },
          { id: 'C', text: 'Untuk menutupi bagian daun yang rusak' },
          { id: 'D', text: 'Supaya tidak bisa dibeli siswa lain' }
        ],
        correctId: 'A',
        explanation: 'Label membangun kepercayaan konsumen mengenai asal-usul, tanggal panen, dan kualitas higienis sayuran.'
      },
      {
        id: 5,
        question: 'Salah satu olahan kreatif dari sayuran hasil panen sekolah adalah...',
        options: [
          { id: 'A', text: 'Jus sayur segar / keripik bayam higienis' },
          { id: 'B', text: 'Minyak jelantah' },
          { id: 'C', text: 'Batu bata sayur' },
          { id: 'D', text: 'Cat dinding kimia' }
        ],
        correctId: 'A',
        explanation: 'Pengolahan pascapanen menjadi keripik bayam atau smoothie sayur meningkatkan nilai tambah dan disukai anak muda.'
      }
    ]
  },
  {
    moduleNumber: 8,
    title: 'Kuis Modul 8 - Evaluasi & Proyek Kebun Mandiri',
    questions: [
      {
        id: 1,
        question: 'Data penting apa saja yang harus dicatat dalam jurnal pengamatan pertumbuhan tanaman?',
        options: [
          { id: 'A', text: 'Tinggi tanaman, jumlah daun, jadwal siram/pupuk, dan kondisi hama' },
          { id: 'B', text: 'Warna baju penyiram tanaman' },
          { id: 'C', text: 'Nomor sepatu siswa yang piket' },
          { id: 'D', text: 'Jumlah kendaraan yang lewat di depan sekolah' }
        ],
        correctId: 'A',
        explanation: 'Jurnal ilmiah mencatat variabel pertumbuhan dan perlakuan perawatan secara terukur dan kronologis.'
      },
      {
        id: 2,
        question: 'Sikap yang paling dibutuhkan dalam merawat kebun sekolah bersama kelompok adalah...',
        options: [
          { id: 'A', text: 'Gotong royong, disiplin jadwal piket, dan kepedulian' },
          { id: 'B', text: 'Saling menyalahkan saat tanaman layu' },
          { id: 'C', text: 'Membiarkan teman bekerja sendirian' },
          { id: 'D', text: 'Merusak tanaman kelompok lain' }
        ],
        correctId: 'A',
        explanation: 'Berkebun kelompok melatih karakter profil pelajar Pancasila: mandiri, gotong royong, dan bernalar kritis.'
      },
      {
        id: 3,
        question: 'Jika menemukan daun tanaman berlubang kecil-kecil karena ulat, tindakan tepat pertama adalah...',
        options: [
          { id: 'A', text: 'Mengambil ulat secara manual dan menyemprot pestisida nabati' },
          { id: 'B', text: 'Membakar seluruh kebun sekolah' },
          { id: 'C', text: 'Menyiram tanaman dengan air mendidih' },
          { id: 'D', text: 'Membiarkannya sampai tanaman habis' }
        ],
        correctId: 'A',
        explanation: 'Pengendalian mekanis (ambil manual) dan biologis (pestisida nabati) efektif tanpa merusak ekosistem kebun.'
      },
      {
        id: 4,
        question: 'Tujuan utama pembuatan proyek kebun mandiri di rumah siswa adalah...',
        options: [
          { id: 'A', text: 'Menerapkan ilmu berkebun di sekolah untuk ketahanan pangan keluarga' },
          { id: 'B', text: 'Menghabiskan uang jajan siswa' },
          { id: 'C', text: 'Membuat halaman rumah menjadi berantakan' },
          { id: 'D', text: 'Hanya untuk mendapatkan nilai tanpa dipraktikkan' }
        ],
        correctId: 'A',
        explanation: 'Praktik di rumah memperluas dampak positif gaya hidup hijau (*green living*) ke lingkungan keluarga dan masyarakat.'
      },
      {
        id: 5,
        question: 'Semboyan "Satu langkah kecil hari ini, Menyelamatkan hidup di masa depan" memiliki arti bahwa...',
        options: [
          { id: 'A', text: 'Aksi nyata merawat sebatang pohon memberi dampak besar bagi bumi' },
          { id: 'B', text: 'Kita tidak perlu berbuat apa-apa' },
          { id: 'C', text: 'Menanam tanaman tidak ada gunanya' },
          { id: 'D', text: 'Hanya menunggu orang lain yang bertindak' }
        ],
        correctId: 'A',
        explanation: 'Setiap benih yang kita rawat berkontribusi pada udara bersih, ketahanan pangan, dan kelestarian ekosistem bumi.'
      }
    ]
  }
];

export const DEFAULT_CLASSES: ClassItem[] = [
  { id: '7A', name: '7A', isActive: true, studentCount: 0, description: 'Kelas 7A' },
  { id: '7B', name: '7B', isActive: true, studentCount: 0, description: 'Kelas 7B' },
  { id: '7C', name: '7C', isActive: true, studentCount: 0, description: 'Kelas 7C' },
  { id: '7D', name: '7D', isActive: true, studentCount: 0, description: 'Kelas 7D' },
  { id: '8A', name: '8A', isActive: true, studentCount: 0, description: 'Kelas 8A' },
  { id: '8B', name: '8B', isActive: true, studentCount: 0, description: 'Kelas 8B' },
  { id: '8C', name: '8C', isActive: true, studentCount: 0, description: 'Kelas 8C' },
  { id: '8D', name: '8D', isActive: true, studentCount: 0, description: 'Kelas 8D' },
  { id: '9A', name: '9A', isActive: true, studentCount: 0, description: 'Kelas 9A' },
  { id: '9B', name: '9B', isActive: true, studentCount: 0, description: 'Kelas 9B' },
  { id: '9C', name: '9C', isActive: true, studentCount: 0, description: 'Kelas 9C' },
  { id: '9D', name: '9D', isActive: true, studentCount: 0, description: 'Kelas 9D' }
];

export const DEFAULT_STUDENTS: StudentItem[] = [];

export const DEFAULT_SETTINGS: AppSettings = {
  googleAppsScriptUrl: 'https://script.google.com/macros/s/AKfycbzLsyFBV2ntaJiXODGepHSTCfubPWmRdIO27iuXwbgVEA3Cs1vMw5c0F1KuOcd_A2NEsw/exec',
  sheetId: '',
  sheetUrl: '',
  adminPassword: 'gurusmp',
  schoolName: 'SMPN 1 Bengkalis',
  appTitle: 'Modul Belajar Berkebun IPA SMP',
  autoSyncToSheet: true,
  
  logoUrl: 'https://i.ibb.co.com/kVLW5n61/logo-smpn-1-bengkalis-kecil-Copy.png',
  logoTitle: 'Yuk Berkebun',
  logoSubtitle: 'Modul Digital',
  logoAnimation: true,

  sidebarTitle: 'Yuk Berkebun',
  sidebarSubtitle: 'Modul Digital',
  showAdminButton: true,
  sidebarFooterText: 'SMPN 1 Bengkalis',

  homeWelcomeTitle: 'Selamat Datang di Modul Berkebun SMPN 1 Bengkalis',
  homeWelcomeSubtitle: 'Modul Digital Pembelajaran IPA',
  homeQuote: '“Satu langkah kecil hari ini, Menyelamatkan hidup di masa depan”',
  homeButtonText: 'MULAI BELAJAR',
  homeCopyright: 'Copyright © SMPN 1 BENGKALIS',
  showHomeQuote: true,
  showHomeThemeButton: true
};

export const getDefaultGames = (): GameItem[] => [
  {
    id: 'game_1',
    title: 'Game Tebak Pasangan Sayuran (Modular Game 1)',
    category: 'Pertanian / Berkebun',
    type: 'modular_game1',
    description: 'Game memori pasangan buah & sayuran segar (tomat, cabai, sawi, wortel, jagung, terong, timun, kentang, semangka, dll.) dengan 11 tingkatan level berjenjang (Dasar hingga Dewa).',
    instructions: 'Buka dan temukan 2 kartu bergambar sayuran yang cocok. Capai minimal Level 4 untuk dapat lanjut ke halaman materi berikutnya.',
    passScore: 4,
    thumbnailIcon: 'Gamepad2',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    items: [
      { name: 'Tomat', emoji: '🍅', color: 'bg-red-50' },
      { name: 'Cabai', emoji: '🌶️', color: 'bg-red-50' },
      { name: 'Sawi', emoji: '🥬', color: 'bg-green-50' },
      { name: 'Wortel', emoji: '🥕', color: 'bg-orange-50' },
      { name: 'Jagung', emoji: '🌽', color: 'bg-yellow-50' },
      { name: 'Terong', emoji: '🍆', color: 'bg-purple-50' },
      { name: 'Timun', emoji: '🥒', color: 'bg-green-50' },
      { name: 'Kentang', emoji: '🥔', color: 'bg-amber-50' },
      { name: 'Semangka', emoji: '🍉', color: 'bg-red-50' },
      { name: 'Bayam', emoji: '🥗', color: 'bg-green-50' },
      { name: 'Brokoli', emoji: '🥦', color: 'bg-emerald-50' },
      { name: 'Strawberry', emoji: '🍓', color: 'bg-pink-50' },
      { name: 'Anggur', emoji: '🍇', color: 'bg-purple-50' },
      { name: 'Pisang', emoji: '🍌', color: 'bg-yellow-50' },
      { name: 'Apel', emoji: '🍎', color: 'bg-red-50' },
      { name: 'Jeruk', emoji: '🍊', color: 'bg-orange-50' },
      { name: 'Nanas', emoji: '🍍', color: 'bg-yellow-50' },
      { name: 'Mangga', emoji: '🥭', color: 'bg-orange-50' },
      { name: 'Lemon', emoji: '🍋', color: 'bg-yellow-50' },
      { name: 'Manggis', emoji: '🟣', color: 'bg-purple-50' },
      { name: 'Alpukat', emoji: '🥑', color: 'bg-green-50' },
      { name: 'Melon', emoji: '🍈', color: 'bg-green-50' },
      { name: 'Jamur', emoji: '🍄', color: 'bg-stone-50' },
      { name: 'Paprika', emoji: '🫑', color: 'bg-red-50' }
    ]
  },
  {
    id: 'game_2',
    title: 'Game Tebak Pasangan Tanaman Pangan (Modular Game 2)',
    category: 'Pertanian / Tanaman Pangan',
    type: 'modular_game2',
    description: 'Game memori pasangan tanaman pangan lokal & rimpang (kangkung, bayam, pakcoy, singkong, ubi jalar, talas, pepaya, serai) dengan 10 tingkatan level tantangan.',
    instructions: 'Temukan pasangan kartu tanaman pangan hingga semua kartu terbuka. Capai minimal Level 4 untuk menyelesaikan tantangan modul.',
    passScore: 4,
    thumbnailIcon: 'Gamepad2',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    items: [
      { name: 'Kangkung', emoji: '🌿', color: 'bg-green-50' },
      { name: 'Bayam', emoji: '🥬', color: 'bg-emerald-50' },
      { name: 'Sawi', emoji: '🥗', color: 'bg-green-100' },
      { name: 'Pakcoy', emoji: '🍃', color: 'bg-emerald-100' },
      { name: 'Singkong', emoji: '🥔', color: 'bg-amber-50' },
      { name: 'Ubi Jalar', emoji: '🍠', color: 'bg-orange-50' },
      { name: 'Talas', emoji: '🟤', color: 'bg-stone-50' },
      { name: 'Pisang', emoji: '🍌', color: 'bg-yellow-50' },
      { name: 'Pepaya', emoji: '🍈', color: 'bg-orange-100' },
      { name: 'Cabai', emoji: '🌶️', color: 'bg-red-50' },
      { name: 'Kunyit', emoji: '🧄', color: 'bg-yellow-100' },
      { name: 'Jahe', emoji: '🫚', color: 'bg-amber-100' },
      { name: 'Serai', emoji: '🌾', color: 'bg-green-50' },
      { name: 'Kacang Panjang', emoji: '🫛', color: 'bg-green-100' },
      { name: 'Buncis', emoji: '🫘', color: 'bg-emerald-50' },
      { name: 'Kacang Tanah', emoji: '🥜', color: 'bg-amber-100' }
    ]
  },
  {
    id: 'game_3',
    title: 'Game Tebak Pasangan Bumbu & Rimpang (Modular Game 3)',
    category: 'Pertanian / Rempah & Bumbu',
    type: 'modular_game3',
    description: 'Game memori pasangan rimpang bumbu dapur dan tanaman obat (kunyit, jahe, serai, kacang panjang, buncis) dengan 10 tingkatan level tantangan bertahap.',
    instructions: 'Buka dan pasangkan kartu rimpang & bumbu kebun secara tepat.',
    passScore: 4,
    thumbnailIcon: 'Gamepad2',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    items: [
      { name: 'Kunyit', emoji: '🧄', color: 'bg-yellow-100' },
      { name: 'Jahe', emoji: '🫚', color: 'bg-amber-100' },
      { name: 'Serai', emoji: '🌾', color: 'bg-green-50' },
      { name: 'Lengkuas', emoji: '🌿', color: 'bg-amber-50' },
      { name: 'Kencur', emoji: '🥔', color: 'bg-stone-100' },
      { name: 'Temulawak', emoji: '🟡', color: 'bg-yellow-50' },
      { name: 'Bawang Merah', emoji: '🧅', color: 'bg-purple-100' },
      { name: 'Bawang Putih', emoji: '🧄', color: 'bg-stone-50' },
      { name: 'Cabai Rawit', emoji: '🌶️', color: 'bg-red-50' },
      { name: 'Lada / Merica', emoji: '⚫', color: 'bg-slate-100' },
      { name: 'Ketumbar', emoji: '🟤', color: 'bg-amber-50' },
      { name: 'Kayu Manis', emoji: '🪵', color: 'bg-orange-100' },
      { name: 'Daun Pandan', emoji: '🍃', color: 'bg-emerald-100' },
      { name: 'Daun Salam', emoji: '🌿', color: 'bg-green-100' },
      { name: 'Kacang Panjang', emoji: '🫛', color: 'bg-green-100' },
      { name: 'Buncis', emoji: '🫘', color: 'bg-emerald-50' }
    ]
  },
  {
    id: 'game_memory',
    title: 'Tantangan Memori Berkebun (Memory Game)',
    category: 'Edukasi Interaktif',
    type: 'memory',
    description: 'Permainan memori kartu visual interaktif serbaguna untuk melatih fokus dan daya ingat siswa seputar konsep dan alat berkebun.',
    instructions: 'Buka kartu dan cocokkan pasangannya sebelum waktu habis.',
    passScore: 100,
    thumbnailIcon: 'Sparkles',
    isBuiltIn: true,
    createdAt: new Date().toISOString(),
    items: [
      { name: 'Tomat', emoji: '🍅', color: 'bg-red-50' },
      { name: 'Cabai', emoji: '🌶️', color: 'bg-red-50' },
      { name: 'Sawi', emoji: '🥬', color: 'bg-green-50' },
      { name: 'Wortel', emoji: '🥕', color: 'bg-orange-50' },
      { name: 'Jagung', emoji: '🌽', color: 'bg-yellow-50' },
      { name: 'Terong', emoji: '🍆', color: 'bg-purple-50' },
      { name: 'Timun', emoji: '🥒', color: 'bg-green-50' },
      { name: 'Kentang', emoji: '🥔', color: 'bg-amber-50' },
      { name: 'Semangka', emoji: '🍉', color: 'bg-red-50' },
      { name: 'Bayam', emoji: '🥗', color: 'bg-green-50' },
      { name: 'Brokoli', emoji: '🥦', color: 'bg-emerald-50' },
      { name: 'Strawberry', emoji: '🍓', color: 'bg-pink-50' }
    ]
  },
  {
    id: 'game_word_guess',
    title: 'Tebak Kata Pintar: Fotosintesis (Word Guess)',
    category: 'Bahasa / Istilah IPA',
    type: 'custom_html',
    description: 'Mini game interaktif tebak huruf kata misteri seputar fotosintesis dengan nyawa kesempatan, keyboard virtual, dan skor otomatis.',
    code: GAME_TEMPLATES[0].code,
    instructions: 'Pilih huruf pada keyboard virtual untuk menebak kata misteri sesuai petunjuk fotosintesis yang diberikan.',
    passScore: 70,
    thumbnailIcon: 'Code2',
    isBuiltIn: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'game_speed_quiz',
    title: 'Kuis Cepat Berwaktu: IPA Hijau (Speed Quiz)',
    category: 'Evaluasi Cepat',
    type: 'custom_html',
    description: 'Game kuis 4 opsi dengan hitung mundur waktu 15 detik, animasi progress bar, dan akumulasi nilai interaktif.',
    code: GAME_TEMPLATES[1].code,
    instructions: 'Pilih opsi jawaban yang benar sebelum waktu 15 detik habis!',
    passScore: 60,
    thumbnailIcon: 'Code2',
    isBuiltIn: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'game_star_catcher',
    title: 'Tangkap Bintang Pengetahuan (Canvas Arcade)',
    category: 'Arcade / Ketangkasan',
    type: 'custom_html',
    description: 'Game aksi arcade grafis canvas HTML5: Gerakkan keranjang ke kiri/kanan untuk menangkap 10 bintang ilmu pengetahuan.',
    code: GAME_TEMPLATES[2].code,
    instructions: 'Gunakan tombol keyboard panah Kiri/Kanan atau tombol di layar untuk mengarahkan keranjang menangkap 10 bintang!',
    passScore: 100,
    thumbnailIcon: 'Gamepad2',
    isBuiltIn: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'game_react_flashcard',
    title: 'Flashcard Interaktif Konsep Berkebun (React / TSX)',
    category: 'React / TSX Komponen',
    type: 'custom_tsx',
    description: 'Komponen React interaktif berbasis TSX dengan kartu berbalik (flip card), status pemahaman (Sudah Hafal / Belum Paham), dan skor.',
    code: GAME_TEMPLATES[3].code,
    instructions: 'Klik kartu untuk membalik dan melihat kunci jawaban, lalu tekan tombol Sudah Hafal jika berhasil mengingat konsep.',
    passScore: 100,
    thumbnailIcon: 'Code2',
    isBuiltIn: false,
    createdAt: new Date().toISOString()
  }
];

