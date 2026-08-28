import { ScoreRecord, StudentItem, ClassItem, ActivityLog } from '../types';
import { firestoreService } from './firestoreService';
import { GOOGLE_FORM_CONFIG } from '../config/googleForm';
import { DEFAULT_SETTINGS } from './defaultData';

const getEffectiveScriptUrl = async (): Promise<string> => {
  try {
    const settings = await firestoreService.getSettings();
    if (settings.googleAppsScriptUrl && settings.googleAppsScriptUrl.trim().startsWith('http')) {
      return settings.googleAppsScriptUrl.trim();
    }
  } catch {}
  return DEFAULT_SETTINGS.googleAppsScriptUrl || '';
};

export const sheetService = {
  /**
   * Submit student quiz result to Google Sheet (routed to Nilai_[KELAS] tab)
   * and save to Firestore
   */
  testConnection: async (customScriptUrl?: string): Promise<{
    success: boolean;
    message: string;
    latencyMs: number;
    classesCount: number;
    studentsCount: number;
    scoresCount: number;
    classList: string[];
    sheetStatus?: string;
  }> => {
    const effectiveUrl = await getEffectiveScriptUrl();
    const url = (customScriptUrl || effectiveUrl || '').trim();

    if (!url || !url.startsWith('http')) {
      return {
        success: false,
        message: 'URL Google Apps Script belum diatur.',
        latencyMs: 0,
        classesCount: 0,
        studentsCount: 0,
        scoresCount: 0,
        classList: []
      };
    }

    const startTime = performance.now();
    try {
      const fetchUrl = url.includes('?') ? `${url}&action=getAllData` : `${url}?action=getAllData`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(fetchUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - startTime);

      if (!res.ok) {
        return {
          success: false,
          message: `HTTP ${res.status}: ${res.statusText}`,
          latencyMs,
          classesCount: 0,
          studentsCount: 0,
          scoresCount: 0,
          classList: []
        };
      }

      const data = await res.json();
      const classes = Array.isArray(data.classes) ? data.classes : [];
      const students = Array.isArray(data.students) ? data.students : [];
      const scores = Array.isArray(data.scores) ? data.scores : [];
      const classList = classes.map((c: any) => c.name || c.id).filter(Boolean);

      return {
        success: data.status === 'success' || classes.length > 0 || students.length > 0,
        message: 'Koneksi ke Google Apps Script dan Google Spreadsheet 100% Berhasil & Aktif!',
        latencyMs,
        classesCount: classes.length,
        studentsCount: students.length,
        scoresCount: scores.length,
        classList,
        sheetStatus: data.status || 'OK'
      };
    } catch (err: any) {
      const latencyMs = Math.round(performance.now() - startTime);
      return {
        success: false,
        message: err.name === 'AbortError' ? 'Koneksi Timeout (>15 detik).' : (err?.message || 'Gagal menghubungi server Google Apps Script.'),
        latencyMs,
        classesCount: 0,
        studentsCount: 0,
        scoresCount: 0,
        classList: []
      };
    }
  },

  /**
   * Submit student quiz result to Google Sheet (routed to Nilai_[KELAS] tab)
   * and save to Firestore
   */
  submitScore: async (scoreData: {
    name: string;
    userClass: string;
    quizName: string;
    moduleNumber: number;
    score: number;
    totalQuestions: number;
    percentage: number;
    answers?: Record<number, string>;
  }): Promise<{ success: boolean; message: string; syncedToSheet: boolean }> => {
    const scriptUrl = await getEffectiveScriptUrl();
    const date = new Date().toLocaleString('id-ID');
    let syncedToSheet = false;

    // 1. Save to Firestore database
    const scoreRecord: Omit<ScoreRecord, 'id'> = {
      username: scoreData.name,
      userClass: scoreData.userClass,
      moduleNumber: scoreData.moduleNumber,
      quizTitle: scoreData.quizName,
      score: scoreData.score,
      totalQuestions: scoreData.totalQuestions,
      percentage: scoreData.percentage,
      date,
      timestamp: Date.now(),
      syncedToSheet: false
    };

    // 2. If Google Apps Script Web App URL is configured, POST to it
    if (scriptUrl && scriptUrl.startsWith('http')) {
      try {
        const payload = {
          action: 'submitScore',
          name: scoreData.name,
          userClass: scoreData.userClass,
          quizName: scoreData.quizName,
          moduleNumber: scoreData.moduleNumber,
          score: scoreData.score,
          totalQuestions: scoreData.totalQuestions,
          percentage: scoreData.percentage,
          date,
          answers: JSON.stringify(scoreData.answers || {})
        };

        // Standard Apps Script no-cors POST method
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8'
          },
          body: JSON.stringify(payload)
        });

        syncedToSheet = true;
        scoreRecord.syncedToSheet = true;
      } catch (err) {
        console.warn('Apps Script POST score sync note:', err);
      }
    }

    // 3. Fallback submit via Google Form if configured
    if (GOOGLE_FORM_CONFIG.formId && GOOGLE_FORM_CONFIG.entries.name) {
      try {
        const params = new URLSearchParams();
        params.append(GOOGLE_FORM_CONFIG.entries.name, scoreData.name);
        params.append(GOOGLE_FORM_CONFIG.entries.userClass, scoreData.userClass);
        params.append(GOOGLE_FORM_CONFIG.entries.quizName, scoreData.quizName);
        params.append(GOOGLE_FORM_CONFIG.entries.score, scoreData.score.toString());
        
        await fetch(`https://docs.google.com/forms/d/e/${GOOGLE_FORM_CONFIG.formId}/formResponse`, {
          method: 'POST',
          mode: 'no-cors',
          body: params
        });
      } catch (e) {
        console.warn('Google Form fallback note:', e);
      }
    }

    // Save final record to Firestore
    await firestoreService.saveScore(scoreRecord);

    return {
      success: true,
      message: syncedToSheet 
        ? `Nilai berhasil disimpan ke Firebase dan tab Nilai_${scoreData.userClass} di Google Sheet!` 
        : 'Nilai tersimpan di Firebase. (Hubungkan URL Google Apps Script di Admin untuk sync instan ke Google Sheet)',
      syncedToSheet
    };
  },

  /**
   * Record student login to Google Apps Script and Firestore
   */
  recordLogin: async (name: string, userClass: string): Promise<void> => {
    const scriptUrl = await getEffectiveScriptUrl();
    const date = new Date().toLocaleString('id-ID');

    // Firestore record
    await firestoreService.recordStudentLogin(name, userClass);

    // Apps Script sync
    if (scriptUrl && scriptUrl.startsWith('http')) {
      try {
        await fetch(scriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'recordLogin',
            name,
            userClass,
            date
          })
        });
      } catch (e) {
        console.warn('Apps Script login sync note:', e);
      }
    }
  },

  /**
   * Notify Google Apps Script to create new class tabs (Siswa_XYZ and Nilai_XYZ)
   */
  syncClassAdded: async (className: string): Promise<void> => {
    const scriptUrl = await getEffectiveScriptUrl();
    if (!scriptUrl || !scriptUrl.startsWith('http')) return;

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'addClass',
          className
        })
      });
    } catch (e) {
      console.warn('Sync class added error:', e);
    }
  },

  /**
   * Notify Google Apps Script to delete or archive class tabs and update summary sheet
   */
  syncClassDeleted: async (className: string): Promise<{ success: boolean; message: string }> => {
    const scriptUrl = await getEffectiveScriptUrl();
    if (!scriptUrl || !scriptUrl.startsWith('http')) {
      return { success: false, message: 'URL Google Apps Script belum diisi.' };
    }

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'deleteClass',
          className
        })
      });
      return { success: true, message: `Tab Siswa_${className} dan Nilai_${className} diproses untuk dihapus dari Google Sheet.` };
    } catch (e: any) {
      console.warn('Sync class deleted error:', e);
      return { success: false, message: e?.message || 'Gagal mengirim permintaan hapus kelas ke Google Sheet.' };
    }
  },

  /**
   * Pull all data (Classes, Students, Scores, Logs) from Google Apps Script
   */
  fetchDataFromSheet: async (customScriptUrl?: string): Promise<{
    success: boolean;
    message: string;
    classes?: ClassItem[];
    students?: StudentItem[];
    scores?: ScoreRecord[];
    logs?: ActivityLog[];
  }> => {
    const effectiveUrl = await getEffectiveScriptUrl();
    const url = (customScriptUrl || effectiveUrl || '').trim();

    if (!url || !url.startsWith('http')) {
      return {
        success: false,
        message: 'URL Google Apps Script belum diisi. Masukkan URL Web App pada form di atas.'
      };
    }

    try {
      // Send GET request with action=getAllData with 35s timeout controller to accommodate GAS cold starts
      const fetchUrl = url.includes('?') ? `${url}&action=getAllData` : `${url}?action=getAllData`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      let res: Response;
      try {
        res = await fetch(fetchUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          return {
            success: false,
            message: 'Koneksi ke Google Spreadsheet memakan waktu lebih lama dari biasanya. Data lokal tetap dapat digunakan.'
          };
        }
        throw fetchErr;
      } finally {
        clearTimeout(timeoutId);
      }

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      if (data.status !== 'success' && !data.classes && !data.students) {
        throw new Error(data.message || 'Format respon spreadsheet tidak sesuai.');
      }

      const classMap = new Map<string, ClassItem>();
      if (Array.isArray(data.classes)) {
        data.classes.forEach((c: any, idx: number) => {
          const name = (c.name || c.id || `Kelas_${idx + 1}`).toString().trim();
          const id = (c.id || name).toString().trim();
          const upperKey = name.toUpperCase();
          if (upperKey && !classMap.has(upperKey)) {
            classMap.set(upperKey, {
              id,
              name,
              isActive: c.isActive !== false && c.status !== 'Non-Aktif',
              studentCount: Number(c.studentCount || c.jumlahSiswa || 0),
              description: c.description || ''
            });
          }
        });
      }
      const classes: ClassItem[] = Array.from(classMap.values());

      const studentMap = new Map<string, StudentItem>();
      if (Array.isArray(data.students)) {
        data.students.forEach((s: any, idx: number) => {
          const name = (s.name || s.nama || 'Siswa').toString().trim();
          const userClass = (s.userClass || s.kelas || '8A').toString().trim();
          const id = s.id || `std_${name.toLowerCase().replace(/\s+/g, '_')}_${userClass}_${idx}`;
          studentMap.set(id, {
            id,
            name,
            userClass,
            nisn: s.nisn || s.nis || '',
            password: s.password || s.pin || '',
            pin: s.pin || s.password || '',
            status: (s.status === 'Non-Aktif' ? 'Non-Aktif' : 'Aktif') as 'Aktif' | 'Non-Aktif',
            lastLogin: s.lastLogin || s.terakhirLogin || '',
            lastModule: s.lastModule ? Number(s.lastModule) : undefined
          });
        });
      }
      const students: StudentItem[] = Array.from(studentMap.values());

      const scoreMap = new Map<string, ScoreRecord>();
      if (Array.isArray(data.scores)) {
        data.scores.forEach((sc: any, idx: number) => {
          const id = sc.id || `sc_${idx}_${Date.now()}`;
          scoreMap.set(id, {
            id,
            username: sc.username || sc.name || sc.nama || '-',
            userClass: sc.userClass || sc.kelas || '-',
            moduleNumber: Number(sc.moduleNumber || sc.modul || 1),
            quizTitle: sc.quizTitle || sc.namaKuis || 'Kuis',
            score: Number(sc.score || sc.nilai || 0),
            totalQuestions: Number(sc.totalQuestions || sc.totalSoal || 0),
            percentage: Number(sc.percentage || sc.persentase || sc.score || 0),
            date: sc.date || sc.timestamp || new Date().toLocaleString('id-ID'),
            syncedToSheet: true
          });
        });
      }
      const scores: ScoreRecord[] = Array.from(scoreMap.values());

      return {
        success: true,
        message: `Berhasil menarik ${classes.length} Kelas, ${students.length} Siswa, dan ${scores.length} Nilai dari tab kelas Google Spreadsheet!`,
        classes,
        students,
        scores
      };
    } catch (err: any) {
      console.warn('Fetch data from Sheet notice:', err?.message || err);
      return {
        success: false,
        message: `Gagal menarik data dari Google Sheet: ${err?.message || 'Pastikan script sudah di-Deploy sebagai Web App dengan akses "Anyone" (Siapa saja).'}`
      };
    }
  },

  /**
   * Sync classes to Google Sheet (updates Ringkasan_Kelas and creates individual tabs)
   */
  syncClassesToSheet: async (classes: ClassItem[]): Promise<{ success: boolean; message: string }> => {
    const scriptUrl = await getEffectiveScriptUrl();
    if (!scriptUrl || !scriptUrl.startsWith('http')) {
      return { success: false, message: 'URL Google Apps Script belum diisi di Pengaturan.' };
    }

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncClasses',
          classes: JSON.stringify(classes)
        })
      });
      return { success: true, message: 'Data kelas dan tab per-kelas berhasil disinkronkan ke Google Sheet.' };
    } catch (err: any) {
      return { success: false, message: `Gagal kirim ke Google Sheet: ${err?.message}` };
    }
  },

  /**
   * Sync students list to individual class tabs (Siswa_7A, Siswa_7B, dll)
   */
  syncStudentsToSheet: async (students: StudentItem[]): Promise<{ success: boolean; message: string }> => {
    const scriptUrl = await getEffectiveScriptUrl();
    if (!scriptUrl || !scriptUrl.startsWith('http')) {
      return { success: false, message: 'URL Google Apps Script belum diisi di Pengaturan.' };
    }

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncStudents',
          students: JSON.stringify(students)
        })
      });
      return { success: true, message: 'Data akun login siswa berhasil disinkronkan ke tab masing-masing kelas.' };
    } catch (err: any) {
      return { success: false, message: `Gagal kirim ke Google Sheet: ${err?.message}` };
    }
  },

  /**
   * Sync all classes, students, and scores to Google Sheet in one comprehensive operation
   */
  syncAllToGoogleSheet: async (
    classes: ClassItem[], 
    students: StudentItem[], 
    scores?: ScoreRecord[]
  ): Promise<{ success: boolean; message: string }> => {
    const scriptUrl = await getEffectiveScriptUrl();
    if (!scriptUrl || !scriptUrl.startsWith('http')) {
      return { success: false, message: 'URL Google Apps Script belum diisi di Pengaturan.' };
    }

    try {
      await fetch(scriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'syncAllData',
          classes: JSON.stringify(classes),
          students: JSON.stringify(students),
          scores: JSON.stringify(scores || [])
        })
      });
      return { success: true, message: 'Seluruh tab kelas, data siswa login, dan rekap nilai berhasil disinkronkan ke Google Sheet!' };
    } catch (err: any) {
      return { success: false, message: `Gagal kirim ke Google Sheet: ${err?.message}` };
    }
  },

  /**
   * Generate the full, clean Google Apps Script code for the user's Spreadsheet
   * featuring multi-tab per-class structure (Siswa_7A, Nilai_7A, etc.)
   */
  getAppsScriptTemplate: (spreadsheetId: string = ''): string => {
    return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT DATABASE RESMI - MODUL BELAJAR DIGITAL
 * =========================================================================
 * Akun Pemilik: gubersmart@gmail.com
 *
 * FITUR MULTI-TAB OTOMATIS:
 * 1. 'Ringkasan_Kelas' : Master data seluruh kelas dan rekap total siswa.
 * 2. 'Siswa_[KELAS]'   : Tab data siswa + info akun login (NISN, Username, PIN, Status).
 * 3. 'Nilai_[KELAS]'   : Tab rekap nilai kuis & hasil belajar per masing-masing kelas.
 * 4. 'Log_Aktivitas'   : Riwayat login dan aktivitas pembelajaran siswa.
 *
 * CARA PEMASANGAN DI GOOGLE SPREADSHEET (gubersmart@gmail.com):
 * -------------------------------------------------------------------------
 * 1. Buka Google Spreadsheet baru Anda di Google Drive.
 * 2. Klik menu 'Extensions' (Ekstensi) > 'Apps Script'.
 * 3. Hapus semua kode default dan tempelkan (paste) seluruh kode ini.
 * 4. Klik icon Simpan (Save / Ctrl+S).
 * 5. Pilih fungsi 'setupDatabaseSheets' di dropdown atas, lalu klik 'Run' (Jalankan).
 *    (Beri izin akses Google saat diminta pertama kali).
 * 6. Klik tombol biru 'Deploy' (Terapkan) > 'New deployment' (Penerapan baru).
 * 7. Pilih icon roda gigi > 'Web app' (Aplikasi web).
 * 8. Pengaturan Wajib:
 *    - Description : Backend Modul Belajar Multi-Tab
 *    - Execute as  : Me (gubersmart@gmail.com)
 *    - Who has access : Anyone (Siapa saja)  <-- WAJIB PILIH INI!
 * 9. Klik 'Deploy', lalu Salin 'Web App URL' (https://script.google.com/macros/s/.../exec).
 * 10. Tempelkan URL tersebut ke Panel Admin Modul Belajar Digital!
 * =========================================================================
 */

// Inisialisasi struktur sheet otomatis (Master Ringkasan + Tab Per Kelas)
function setupDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Sheet Ringkasan Kelas
  var sheetKelas = ss.getSheetByName('Ringkasan_Kelas');
  if (!sheetKelas) {
    sheetKelas = ss.insertSheet('Ringkasan_Kelas', 0);
  }
  sheetKelas.clear();
  sheetKelas.appendRow(['No', 'ID_Kelas', 'Nama_Kelas', 'Status', 'Jumlah_Siswa', 'Keterangan']);
  formatHeaderRow(sheetKelas, '#4338ca'); // Indigo
  
  // Contoh daftar kelas awal
  var defaultClasses = ['7A', '7B', '7C', '8A', '8B', '8C', '9A', '9B'];
  
  defaultClasses.forEach(function(cls, idx) {
    sheetKelas.appendRow([idx + 1, cls, cls, 'Aktif', 32, 'Kelas Reguler']);
    createOrFormatClassTabs(ss, cls);
  });
  
  // Tab Log Aktivitas
  var sheetLog = ss.getSheetByName('Log_Aktivitas') || ss.insertSheet('Log_Aktivitas');
  if (sheetLog.getLastRow() === 0) {
    sheetLog.appendRow(['Timestamp', 'NISN_NIS', 'Nama_Siswa', 'Kelas', 'Tindakan', 'Detail']);
    formatHeaderRow(sheetLog, '#b45309'); // Amber
  }

  // Bersihkan Sheet1 bawaan jika ada
  var defaultSheet1 = ss.getSheetByName('Sheet1') || ss.getSheetByName('Sheet 1');
  if (defaultSheet1 && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet1); } catch (e) {}
  }

  return 'Database Google Sheet Multi-Tab Berhasil Dibuat!';
}

// Buat atau Format Tab Siswa_[Kelas] dan Nilai_[Kelas]
function createOrFormatClassTabs(ss, className) {
  var cleanName = String(className).trim().toUpperCase();
  if (!cleanName) return;

  // A. Tab Siswa_[KELAS] (Data Siswa + Info Login)
  var studentTabName = 'Siswa_' + cleanName;
  var sSheet = ss.getSheetByName(studentTabName);
  if (!sSheet) {
    sSheet = ss.insertSheet(studentTabName);
    sSheet.appendRow([
      'No',
      'NISN_NIS',
      'Nama_Lengkap',
      'Username_Login',
      'Password_PIN',
      'Status_Akun',
      'Terakhir_Login',
      'Progres_Modul',
      'Keterangan'
    ]);
    formatHeaderRow(sSheet, '#1e40af'); // Biru Navy

    // Contoh data siswa awal
    sSheet.appendRow([1, '1001', 'Contoh Siswa 1', 'siswa1_' + cleanName.toLowerCase(), '123456', 'Aktif', '-', 'Modul 1', 'Akun Aktif']);
    sSheet.appendRow([2, '1002', 'Contoh Siswa 2', 'siswa2_' + cleanName.toLowerCase(), '123456', 'Aktif', '-', 'Modul 1', 'Akun Aktif']);
  }

  // B. Tab Nilai_[KELAS] (Rekap Nilai Kuis Kelas Ini)
  var scoreTabName = 'Nilai_' + cleanName;
  var nSheet = ss.getSheetByName(scoreTabName);
  if (!nSheet) {
    nSheet = ss.insertSheet(scoreTabName);
    nSheet.appendRow([
      'Timestamp',
      'NISN_NIS',
      'Nama_Siswa',
      'Modul',
      'Nama_Kuis',
      'Nilai',
      'Jumlah_Benar',
      'Total_Soal',
      'Persentase',
      'Predikat',
      'Detail_Jawaban'
    ]);
    formatHeaderRow(nSheet, '#047857'); // Hijau Emerald
  }
}

// Hapus Tab Siswa dan Nilai saat Kelas Dihapus
function removeClassTabs(ss, className) {
  var cleanName = String(className).trim().toUpperCase();
  if (!cleanName) return;

  var sSheet = ss.getSheetByName('Siswa_' + cleanName);
  if (sSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(sSheet); } catch (e) {}
  }

  var nSheet = ss.getSheetByName('Nilai_' + cleanName);
  if (nSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(nSheet); } catch (e) {}
  }

  // Hapus juga baris kelas terkait dari sheet Ringkasan_Kelas jika ada
  var sheetKelas = ss.getSheetByName('Ringkasan_Kelas') || ss.getSheetByName('Data_Kelas');
  if (sheetKelas && sheetKelas.getLastRow() > 1) {
    try {
      var range = sheetKelas.getRange(2, 1, sheetKelas.getLastRow() - 1, sheetKelas.getLastColumn());
      var values = range.getValues();
      for (var i = values.length - 1; i >= 0; i--) {
        var rowCls = String(values[i][2] || values[i][1] || values[i][0] || '').trim().toUpperCase();
        if (rowCls === cleanName) {
          sheetKelas.deleteRow(i + 2);
        }
      }
    } catch (e) {}
  }
}

// Format Header Tabel Elegan
function formatHeaderRow(sheet, headerColor) {
  var numCols = Math.max(sheet.getLastColumn(), 1);
  var range = sheet.getRange(1, 1, 1, numCols);
  range.setBackground(headerColor);
  range.setFontColor('#FFFFFF');
  range.setFontWeight('bold');
  range.setHorizontalAlignment('center');
  range.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);
}

// Handler GET (Menarik Data Semua Kelas, Siswa, dan Nilai ke Web App)
function doGet(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var result = {
    status: 'success',
    timestamp: new Date().toISOString(),
    classes: [],
    students: [],
    scores: []
  };

  // 1. Baca Data dari Tab Ringkasan_Kelas
  var sheetKelas = ss.getSheetByName('Ringkasan_Kelas') || ss.getSheetByName('Data_Kelas');
  if (sheetKelas && sheetKelas.getLastRow() > 1) {
    var rowsK = sheetKelas.getRange(2, 1, sheetKelas.getLastRow() - 1, sheetKelas.getLastColumn()).getValues();
    result.classes = rowsK.map(function(r) {
      var name = String(r[2] || r[1] || r[0] || '').trim();
      var id = String(r[1] || name);
      return {
        id: id,
        name: name,
        status: String(r[3] || 'Aktif'),
        isActive: String(r[3]).toLowerCase() !== 'non-aktif',
        studentCount: Number(r[4] || 0),
        description: String(r[5] || '')
      };
    }).filter(function(c) { return c.name !== ''; });
  }

  // 2. Baca Data Siswa dari Setiap Tab 'Siswa_*'
  var sheets = ss.getSheets();
  sheets.forEach(function(sh) {
    var sheetName = sh.getName();
    if (sheetName.indexOf('Siswa_') === 0) {
      var clsName = sheetName.replace('Siswa_', '').trim().toUpperCase();
      if (sh.getLastRow() > 1) {
        var rowsS = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
        rowsS.forEach(function(r, idx) {
          var nama = String(r[2] || r[1] || '').trim();
          if (nama) {
            result.students.push({
              id: 'std_' + clsName + '_' + (r[1] || idx),
              nisn: String(r[1] || ''),
              name: nama,
              userClass: clsName,
              username: String(r[3] || nama.toLowerCase().replace(/\\s+/g, '')),
              password: String(r[4] || '123456'),
              pin: String(r[4] || '123456'),
              status: String(r[5] || 'Aktif'),
              lastLogin: String(r[6] || ''),
              lastModule: r[7] ? String(r[7]).replace(/[^0-9]/g, '') : '1'
            });
          }
        });
      }
    }
  });

  // 3. Baca Rekap Nilai dari Setiap Tab 'Nilai_*'
  sheets.forEach(function(sh) {
    var sheetName = sh.getName();
    if (sheetName.indexOf('Nilai_') === 0) {
      var clsName = sheetName.replace('Nilai_', '').trim().toUpperCase();
      if (sh.getLastRow() > 1) {
        var rowsN = sh.getRange(2, 1, sh.getLastRow() - 1, sh.getLastColumn()).getValues();
        rowsN.forEach(function(r, idx) {
          var nama = String(r[2] || r[1] || '').trim();
          if (nama) {
            result.scores.push({
              id: 'sc_' + clsName + '_' + idx + '_' + (r[0] || ''),
              date: String(r[0] || ''),
              nisn: String(r[1] || ''),
              username: nama,
              userClass: clsName,
              moduleNumber: Number(String(r[3] || '1').replace(/[^0-9]/g, '')) || 1,
              quizTitle: String(r[4] || 'Kuis Modul'),
              score: Number(r[5] || 0),
              totalQuestions: Number(r[7] || 10),
              percentage: Number(String(r[8] || '0').replace('%', '')),
              answers: String(r[10] || '{}')
            });
          }
        });
      }
    }
  });

  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// Handler POST (Menerima Nilai, Tambah/Hapus Kelas, Sinkronisasi Akun Login Siswa)
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);
  
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = data.action;
    
    // 1. Aksi Tambah Kelas Baru (Buat Tab Siswa_[Kelas] & Nilai_[Kelas] Otomatis)
    if (action === 'addClass') {
      var newCls = String(data.className || '').trim().toUpperCase();
      if (newCls) {
        createOrFormatClassTabs(ss, newCls);
        updateClassSummarySheet(ss);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Tab kelas ' + newCls + ' berhasil dibuat' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Aksi Hapus Kelas (Hapus Tab Siswa_[Kelas] & Nilai_[Kelas])
    if (action === 'deleteClass') {
      var delCls = String(data.className || '').trim().toUpperCase();
      if (delCls) {
        removeClassTabs(ss, delCls);
        updateClassSummarySheet(ss);
      }
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Tab kelas ' + delCls + ' berhasil dihapus' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. Aksi Submit Nilai Kuis (Masuk ke Tab Nilai_[KELAS] Siswa Tersebut)
    if (action === 'submitScore') {
      var studentClass = String(data.userClass || 'UMUM').trim().toUpperCase();
      createOrFormatClassTabs(ss, studentClass);
      
      var scoreSheetName = 'Nilai_' + studentClass;
      var sheetN = ss.getSheetByName(scoreSheetName);
      var timestamp = data.date || new Date().toLocaleString('id-ID');
      var scoreVal = Number(data.score || 0);
      var totalQ = Number(data.totalQuestions || 10);
      var pct = Number(data.percentage || Math.round((scoreVal / (totalQ * 10)) * 100));
      var predicate = pct >= 85 ? 'Sangat Baik (A)' : pct >= 75 ? 'Baik (B)' : pct >= 60 ? 'Cukup (C)' : 'Perlu Bimbingan (D)';

      sheetN.appendRow([
        timestamp,
        data.nisn || '',
        data.name || '-',
        'Modul ' + (data.moduleNumber || 1),
        data.quizName || 'Kuis',
        scoreVal,
        data.correctCount || Math.round((pct / 100) * totalQ),
        totalQ,
        pct + '%',
        predicate,
        data.answers || '{}'
      ]);
      
      updateStudentProgressInClassTab(ss, studentClass, data.name, data.moduleNumber);
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Nilai berhasil dicatat di tab ' + scoreSheetName }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 4. Aksi Catat Login Siswa (Update Terakhir Login di Tab Siswa_[KELAS])
    if (action === 'recordLogin') {
      var sClass = String(data.userClass || 'UMUM').trim().toUpperCase();
      var timestampL = data.date || new Date().toLocaleString('id-ID');
      
      // Catat di Tab Siswa
      updateStudentLoginInClassTab(ss, sClass, data.name, timestampL);
      
      // Catat di Tab Log Aktivitas
      var sheetLog = ss.getSheetByName('Log_Aktivitas') || ss.insertSheet('Log_Aktivitas');
      sheetLog.appendRow([
        timestampL,
        data.nisn || '',
        data.name || '-',
        sClass,
        'LOGIN SISWA',
        'Masuk ke portal modul belajar'
      ]);
      
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 5. Aksi Sinkronisasi Penuh Semua Kelas & Siswa
    if (action === 'syncClasses' || action === 'syncAllData') {
      var classesList = JSON.parse(data.classes || '[]');
      var studentsList = JSON.parse(data.students || '[]');
      
      // Update Ringkasan Kelas
      var sheetRingkasan = ss.getSheetByName('Ringkasan_Kelas') || ss.insertSheet('Ringkasan_Kelas', 0);
      sheetRingkasan.clear();
      sheetRingkasan.appendRow(['No', 'ID_Kelas', 'Nama_Kelas', 'Status', 'Jumlah_Siswa', 'Keterangan']);
      formatHeaderRow(sheetRingkasan, '#4338ca');

      classesList.forEach(function(c, idx) {
        var clsName = String(c.name || c.id).trim().toUpperCase();
        var stCount = studentsList.filter(function(s) { return String(s.userClass).toUpperCase() === clsName; }).length;
        sheetRingkasan.appendRow([
          idx + 1,
          c.id || clsName,
          clsName,
          c.isActive !== false ? 'Aktif' : 'Non-Aktif',
          stCount || c.studentCount || 0,
          c.description || 'Kelas Belajar'
        ]);
        createOrFormatClassTabs(ss, clsName);
      });

      // Distribusikan data siswa ke masing-masing tab Siswa_[KELAS]
      var groupedStudents = {};
      studentsList.forEach(function(s) {
        var k = String(s.userClass || 'UMUM').trim().toUpperCase();
        if (!groupedStudents[k]) groupedStudents[k] = [];
        groupedStudents[k].push(s);
      });

      Object.keys(groupedStudents).forEach(function(k) {
        createOrFormatClassTabs(ss, k);
        var tab = ss.getSheetByName('Siswa_' + k);
        if (tab) {
          var lastR = tab.getLastRow();
          if (lastR > 1) {
            tab.getRange(2, 1, lastR - 1, tab.getLastColumn()).clearContent();
          }
          groupedStudents[k].forEach(function(std, i) {
            tab.appendRow([
              i + 1,
              std.nisn || std.nis || '',
              std.name,
              std.username || std.name.toLowerCase().replace(/\\s+/g, ''),
              std.password || std.pin || '123456',
              std.status || 'Aktif',
              std.lastLogin || '-',
              std.lastModule ? ('Modul ' + std.lastModule) : 'Modul 1',
              'Akun Terdaftar'
            ]);
          });
        }
      });

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Semua tab kelas & siswa berhasil disinkronkan' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 6. Aksi Sinkronisasi Siswa Saja
    if (action === 'syncStudents') {
      var stds = JSON.parse(data.students || '[]');
      var byClass = {};
      stds.forEach(function(s) {
        var k = String(s.userClass || 'UMUM').trim().toUpperCase();
        if (!byClass[k]) byClass[k] = [];
        byClass[k].push(s);
      });

      Object.keys(byClass).forEach(function(k) {
        createOrFormatClassTabs(ss, k);
        var tab = ss.getSheetByName('Siswa_' + k);
        if (tab) {
          var lr = tab.getLastRow();
          if (lr > 1) {
            tab.getRange(2, 1, lr - 1, tab.getLastColumn()).clearContent();
          }
          byClass[k].forEach(function(std, i) {
            tab.appendRow([
              i + 1,
              std.nisn || std.nis || '',
              std.name,
              std.username || std.name.toLowerCase().replace(/\\s+/g, ''),
              std.password || std.pin || '123456',
              std.status || 'Aktif',
              std.lastLogin || '-',
              std.lastModule ? ('Modul ' + std.lastModule) : 'Modul 1',
              'Akun Terdaftar'
            ]);
          });
        }
      });

      return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Data akun siswa berhasil disinkronkan' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'unknown_action' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Helper Update Terakhir Login di Tab Siswa_[KELAS]
function updateStudentLoginInClassTab(ss, userClass, studentName, timestamp) {
  createOrFormatClassTabs(ss, userClass);
  var sheet = ss.getSheetByName('Siswa_' + userClass);
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  var found = false;
  
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).toLowerCase().trim() === String(studentName).toLowerCase().trim()) {
      sheet.getRange(i + 1, 7).setValue(timestamp);
      found = true;
      break;
    }
  }
  
  if (!found) {
    var newNo = data.length;
    sheet.appendRow([newNo, '', studentName, studentName.toLowerCase().replace(/\\s+/g, ''), '123456', 'Aktif', timestamp, 'Modul 1', 'Login Mandiri']);
  }
}

// Helper Update Progres Modul di Tab Siswa_[KELAS]
function updateStudentProgressInClassTab(ss, userClass, studentName, modNum) {
  var sheet = ss.getSheetByName('Siswa_' + userClass);
  if (!sheet) return;
  
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][2]).toLowerCase().trim() === String(studentName).toLowerCase().trim()) {
      sheet.getRange(i + 1, 8).setValue('Modul ' + modNum);
      break;
    }
  }
}

// Helper Refresh Ringkasan Kelas
function updateClassSummarySheet(ss) {
  var sheetRingkasan = ss.getSheetByName('Ringkasan_Kelas');
  if (!sheetRingkasan) return;
  
  var sheets = ss.getSheets();
  var classNames = [];
  sheets.forEach(function(sh) {
    var n = sh.getName();
    if (n.indexOf('Siswa_') === 0) {
      classNames.push(n.replace('Siswa_', ''));
    }
  });

  sheetRingkasan.clear();
  sheetRingkasan.appendRow(['No', 'ID_Kelas', 'Nama_Kelas', 'Status', 'Jumlah_Siswa', 'Keterangan']);
  formatHeaderRow(sheetRingkasan, '#4338ca');

  classNames.forEach(function(cls, i) {
    var sSheet = ss.getSheetByName('Siswa_' + cls);
    var count = sSheet ? Math.max(0, sSheet.getLastRow() - 1) : 0;
    sheetRingkasan.appendRow([i + 1, cls, cls, 'Aktif', count, 'Tab: Siswa_' + cls + ' & Nilai_' + cls]);
  });
}
`;
  }
};
