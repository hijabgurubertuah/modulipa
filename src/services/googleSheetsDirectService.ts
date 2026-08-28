import { getAccessToken } from './googleSheetsAuth';
import { ClassItem, StudentItem, ScoreRecord } from '../types';

export interface SheetMetadata {
  id: string;
  title: string;
  sheets: {
    sheetId: number;
    title: string;
    index: number;
    rowCount?: number;
    columnCount?: number;
  }[];
}

export const extractSpreadsheetId = (urlOrId: string): string => {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();
  // If it's a URL like https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // If user pasted just the ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
};

export const googleSheetsDirectService = {
  /**
   * Get metadata and tab sheets list from Google Spreadsheet
   */
  getSpreadsheetInfo: async (spreadsheetIdOrUrl: string): Promise<{
    success: boolean;
    metadata?: SheetMetadata;
    message?: string;
  }> => {
    const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
    if (!spreadsheetId) {
      return { success: false, message: 'ID atau URL Spreadsheet tidak valid.' };
    }

    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Sesi Google OAuth belum aktif. Silakan Login dengan Google terlebih dahulu.' };
    }

    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json'
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      const sheets = (data.sheets || []).map((s: any) => ({
        sheetId: s.properties?.sheetId,
        title: s.properties?.title || '',
        index: s.properties?.index || 0,
        rowCount: s.properties?.gridProperties?.rowCount,
        columnCount: s.properties?.gridProperties?.columnCount
      }));

      return {
        success: true,
        metadata: {
          id: data.spreadsheetId || spreadsheetId,
          title: data.properties?.title || 'Google Spreadsheet',
          sheets
        }
      };
    } catch (err: any) {
      console.error('getSpreadsheetInfo error:', err);
      return { success: false, message: err.message || 'Gagal membaca metadata Google Spreadsheet.' };
    }
  },

  /**
   * Create a new tab / sheet in the spreadsheet
   */
  createSheetTab: async (
    spreadsheetIdOrUrl: string, 
    tabTitle: string, 
    headerRows?: string[]
  ): Promise<{ success: boolean; sheetId?: number; message?: string }> => {
    const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Harap Login dengan Google terlebih dahulu.' };
    }

    try {
      // 1. Add Sheet
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: {
                  title: tabTitle,
                  gridProperties: {
                    rowCount: 100,
                    columnCount: headerRows ? Math.max(headerRows.length, 10) : 10
                  }
                }
              }
            }
          ]
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        // If sheet already exists, that is fine
        if (errorData.error?.message?.includes('already exists')) {
          return { success: true, message: `Tab "${tabTitle}" sudah ada.` };
        }
        throw new Error(errorData.error?.message || `Gagal membuat tab ${tabTitle}`);
      }

      const data = await res.json();
      const newSheetId = data.replies?.[0]?.addSheet?.properties?.sheetId;

      // 2. If headers provided, set first row
      if (headerRows && headerRows.length > 0) {
        await googleSheetsDirectService.updateRangeValues(
          spreadsheetId,
          `'${tabTitle}'!A1:${String.fromCharCode(64 + headerRows.length)}1`,
          [headerRows]
        );
      }

      return { success: true, sheetId: newSheetId, message: `Tab "${tabTitle}" berhasil dibuat!` };
    } catch (err: any) {
      console.error('createSheetTab error:', err);
      return { success: false, message: err.message || 'Gagal menambahkan tab sheet.' };
    }
  },

  /**
   * Delete a tab / sheet by name
   */
  deleteSheetTab: async (
    spreadsheetIdOrUrl: string, 
    tabTitle: string
  ): Promise<{ success: boolean; message?: string }> => {
    const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Harap Login dengan Google terlebih dahulu.' };
    }

    try {
      // First get sheet ID for this title
      const info = await googleSheetsDirectService.getSpreadsheetInfo(spreadsheetId);
      if (!info.success || !info.metadata) {
        throw new Error(info.message || 'Gagal memeriksa tab spreadsheet.');
      }

      const target = info.metadata.sheets.find(s => s.title.toLowerCase() === tabTitle.toLowerCase());
      if (!target) {
        return { success: false, message: `Tab "${tabTitle}" tidak ditemukan di spreadsheet.` };
      }

      if (info.metadata.sheets.length <= 1) {
        return { success: false, message: 'Tidak dapat menghapus satu-satunya tab yang tersisa di spreadsheet.' };
      }

      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requests: [
            {
              deleteSheet: {
                sheetId: target.sheetId
              }
            }
          ]
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `Gagal menghapus tab ${tabTitle}`);
      }

      return { success: true, message: `Tab "${tabTitle}" berhasil dihapus.` };
    } catch (err: any) {
      console.error('deleteSheetTab error:', err);
      return { success: false, message: err.message || 'Gagal menghapus tab sheet.' };
    }
  },

  /**
   * Read values from range
   */
  getRangeValues: async (
    spreadsheetIdOrUrl: string, 
    range: string
  ): Promise<{ success: boolean; values?: any[][]; message?: string }> => {
    const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Harap Login dengan Google terlebih dahulu.' };
    }

    try {
      const encodedRange = encodeURIComponent(range);
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueRenderOption=UNFORMATTED_VALUE`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json'
          }
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${res.status}: Gagal membaca data range.`);
      }

      const data = await res.json();
      return { success: true, values: data.values || [] };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal membaca isi range.' };
    }
  },

  /**
   * Update values in range (Overwrites)
   */
  updateRangeValues: async (
    spreadsheetIdOrUrl: string, 
    range: string, 
    values: any[][]
  ): Promise<{ success: boolean; updatedRows?: number; message?: string }> => {
    const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Harap Login dengan Google terlebih dahulu.' };
    }

    try {
      const encodedRange = encodeURIComponent(range);
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            range,
            majorDimension: 'ROWS',
            values
          })
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${res.status}: Gagal update range.`);
      }

      const data = await res.json();
      return { success: true, updatedRows: data.updatedRows };
    } catch (err: any) {
      console.error('updateRangeValues error:', err);
      return { success: false, message: err.message || 'Gagal memperbarui nilai sheet.' };
    }
  },

  /**
   * Append values to sheet (Adds new row at the bottom)
   */
  appendRowValues: async (
    spreadsheetIdOrUrl: string, 
    range: string, 
    values: any[][]
  ): Promise<{ success: boolean; message?: string }> => {
    const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Harap Login dengan Google terlebih dahulu.' };
    }

    try {
      const encodedRange = encodeURIComponent(range);
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            values
          })
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${res.status}: Gagal menambahkan baris.`);
      }

      return { success: true, message: 'Baris baru berhasil ditambahkan.' };
    } catch (err: any) {
      console.error('appendRowValues error:', err);
      return { success: false, message: err.message || 'Gagal menambahkan baris.' };
    }
  },

  /**
   * Clear range content
   */
  clearRange: async (
    spreadsheetIdOrUrl: string,
    range: string
  ): Promise<{ success: boolean; message?: string }> => {
    const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Harap Login dengan Google terlebih dahulu.' };
    }

    try {
      const encodedRange = encodeURIComponent(range);
      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}:clear`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Gagal menghapus isi rentang sheet.');
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message || 'Gagal clear range.' };
    }
  },

  /**
   * Initialize or Structure full standard Sheets layout:
   * 1. Ringkasan_Kelas
   * 2. Siswa_[KELAS]
   * 3. Nilai_[KELAS]
   * 4. Log_Aktivitas
   */
  setupFullStandardSpreadsheet: async (
    spreadsheetIdOrUrl: string,
    classes: ClassItem[],
    students: StudentItem[]
  ): Promise<{ success: boolean; message: string; details: string[] }> => {
    const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
    const details: string[] = [];

    const info = await googleSheetsDirectService.getSpreadsheetInfo(spreadsheetId);
    if (!info.success || !info.metadata) {
      return { success: false, message: info.message || 'Gagal membaca spreadsheet.', details };
    }

    const existingTitles = info.metadata.sheets.map(s => s.title.toLowerCase());

    // 1. Ringkasan_Kelas
    if (!existingTitles.includes('ringkasan_kelas')) {
      await googleSheetsDirectService.createSheetTab(spreadsheetId, 'Ringkasan_Kelas', [
        'Nama Kelas', 'Jumlah Siswa', 'Status', 'Catatan / Wali Kelas'
      ]);
      details.push('Tab "Ringkasan_Kelas" dibuat.');
    }

    // Populate Ringkasan_Kelas
    const classRows = (classes || []).map(c => [
      c.name,
      c.studentCount || (students || []).filter(s => s.userClass === c.name).length || 0,
      c.isActive !== false ? 'Aktif' : 'Non-Aktif',
      c.description || ''
    ]);
    if (classRows.length > 0) {
      await googleSheetsDirectService.updateRangeValues(spreadsheetId, "'Ringkasan_Kelas'!A2:D" + (classRows.length + 1), classRows);
      details.push(`Data ${classRows.length} kelas ditulis ke "Ringkasan_Kelas".`);
    }

    // 2. Per-Class Student Tabs & Score Tabs
    for (const c of classes) {
      const studentTabName = `Siswa_${c.name}`;
      const scoreTabName = `Nilai_${c.name}`;

      // Siswa tab
      if (!existingTitles.includes(studentTabName.toLowerCase())) {
        await googleSheetsDirectService.createSheetTab(spreadsheetId, studentTabName, [
          'No', 'NISN / ID', 'Nama Lengkap', 'Kelas', 'Password', 'Status'
        ]);
        details.push(`Tab "${studentTabName}" dibuat.`);
      }

      // Write students for this class
      const classStudents = (students || []).filter(s => s.userClass === c.name);
      if (classStudents.length > 0) {
        const studentRows = classStudents.map((s, idx) => [
          idx + 1,
          s.nisn || '',
          s.name,
          s.userClass,
          s.password || '',
          s.status || 'Aktif'
        ]);
        // Clear first then write
        await googleSheetsDirectService.clearRange(spreadsheetId, `'${studentTabName}'!A2:F200`);
        await googleSheetsDirectService.updateRangeValues(spreadsheetId, `'${studentTabName}'!A2:F` + (studentRows.length + 1), studentRows);
        details.push(`${studentRows.length} siswa ditulis ke tab "${studentTabName}".`);
      }

      // Nilai tab
      if (!existingTitles.includes(scoreTabName.toLowerCase())) {
        await googleSheetsDirectService.createSheetTab(spreadsheetId, scoreTabName, [
          'Waktu', 'Nama Lengkap', 'Kelas', 'Kuis / Modul', 'Nilai', 'Total Soal', 'Persentase (%)'
        ]);
        details.push(`Tab "${scoreTabName}" dibuat.`);
      }
    }

    // 3. Log_Aktivitas Tab
    if (!existingTitles.includes('log_aktivitas')) {
      await googleSheetsDirectService.createSheetTab(spreadsheetId, 'Log_Aktivitas', [
        'Waktu', 'Nama Pengguna', 'Kelas', 'Aktivitas / Halaman', 'Detail'
      ]);
      details.push('Tab "Log_Aktivitas" dibuat.');
    }

    return {
      success: true,
      message: 'Seluruh struktur Google Spreadsheet berhasil disinkronkan langsung via Google Sheets API!',
      details
    };
  },

  /**
   * Pull all data directly from all tabs of the Google Spreadsheet
   */
  pullAllDataDirect: async (
    spreadsheetIdOrUrl: string
  ): Promise<{
    success: boolean;
    classes: ClassItem[];
    students: StudentItem[];
    scores: ScoreRecord[];
    message?: string;
  }> => {
    const spreadsheetId = extractSpreadsheetId(spreadsheetIdOrUrl);
    const info = await googleSheetsDirectService.getSpreadsheetInfo(spreadsheetId);
    if (!info.success || !info.metadata) {
      return { success: false, classes: [], students: [], scores: [], message: info.message };
    }

    const fetchedClasses: ClassItem[] = [];
    const fetchedStudents: StudentItem[] = [];
    const fetchedScores: ScoreRecord[] = [];

    // 1. Read Ringkasan_Kelas or determine from Siswa_ tabs
    const classTab = info.metadata.sheets.find(s => s.title.toLowerCase().includes('kelas'));
    if (classTab) {
      const res = await googleSheetsDirectService.getRangeValues(spreadsheetId, `'${classTab.title}'!A2:D100`);
      if (res.success && res.values) {
        res.values.forEach((row, idx) => {
          const className = String(row[0] || '').trim();
          if (className) {
            fetchedClasses.push({
              id: `cls_${className.toLowerCase().replace(/\s+/g, '_')}`,
              name: className,
              studentCount: Number(row[1]) || 0,
              isActive: String(row[2] || '').toLowerCase() !== 'non-aktif',
              description: String(row[3] || '')
            });
          }
        });
      }
    }

    // 2. Read Siswa_ tabs
    const studentTabs = info.metadata.sheets.filter(s => 
      s.title.toLowerCase().startsWith('siswa_') || 
      s.title.toLowerCase().startsWith('siswa') ||
      s.title.toLowerCase().includes('data siswa')
    );

    for (const tab of studentTabs) {
      // deduce class name from tab title e.g. Siswa_7A -> 7A
      const classNameFromTab = tab.title.replace(/^Siswa_/i, '').replace(/^Siswa\s*/i, '').trim();
      
      const res = await googleSheetsDirectService.getRangeValues(spreadsheetId, `'${tab.title}'!A2:F500`);
      if (res.success && res.values) {
        res.values.forEach((row, rIdx) => {
          // Headers: No, NISN, Nama Lengkap, Kelas, Password, Status
          const nisn = String(row[1] || '').trim();
          const name = String(row[2] || row[1] || '').trim();
          const userClass = String(row[3] || classNameFromTab || '').trim();
          const password = String(row[4] || '').trim();
          const status = String(row[5] || 'Aktif').trim();

          if (name && name.toLowerCase() !== 'nama lengkap' && name.toLowerCase() !== 'nama') {
            fetchedStudents.push({
              id: `stu_${userClass}_${rIdx + 1}_${name.toLowerCase().replace(/\s+/g, '_')}`,
              name,
              userClass: userClass || classNameFromTab || '7A',
              nisn: nisn !== name ? nisn : '',
              password: password || undefined,
              status: status.toLowerCase() === 'non-aktif' ? 'Non-Aktif' : 'Aktif'
            });
          }
        });
      }

      // If class not in fetchedClasses, add it
      if (classNameFromTab && !fetchedClasses.some(c => c.name.toLowerCase() === classNameFromTab.toLowerCase())) {
        fetchedClasses.push({
          id: `cls_${classNameFromTab.toLowerCase().replace(/\s+/g, '_')}`,
          name: classNameFromTab,
          studentCount: fetchedStudents.filter(s => s.userClass === classNameFromTab).length,
          isActive: true
        });
      }
    }

    // 3. Read Nilai_ tabs
    const scoreTabs = info.metadata.sheets.filter(s => s.title.toLowerCase().startsWith('nilai_') || s.title.toLowerCase().startsWith('nilai'));
    for (const tab of scoreTabs) {
      const classNameFromTab = tab.title.replace(/^Nilai_/i, '').replace(/^Nilai\s*/i, '').trim();
      const res = await googleSheetsDirectService.getRangeValues(spreadsheetId, `'${tab.title}'!A2:G500`);
      if (res.success && res.values) {
        res.values.forEach((row, sIdx) => {
          const date = String(row[0] || '');
          const username = String(row[1] || '');
          const userClass = String(row[2] || classNameFromTab);
          const quizTitle = String(row[3] || 'Kuis');
          const score = Number(row[4]) || 0;
          const totalQuestions = Number(row[5]) || 0;
          const percentage = Number(row[6]) || 0;
          const moduleMatch = quizTitle.match(/\d+/);
          const moduleNumber = moduleMatch ? parseInt(moduleMatch[0], 10) : 1;

          if (username && username.toLowerCase() !== 'nama lengkap') {
            fetchedScores.push({
              id: `scr_${tab.title}_${sIdx}`,
              username,
              userClass,
              moduleNumber,
              quizTitle,
              score,
              totalQuestions,
              percentage,
              date,
              timestamp: Date.now() - sIdx * 60000,
              syncedToSheet: true
            });
          }
        });
      }
    }

    return {
      success: true,
      classes: fetchedClasses,
      students: fetchedStudents,
      scores: fetchedScores
    };
  }
};
