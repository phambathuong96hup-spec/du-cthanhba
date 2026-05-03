export const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbz6HCpXjtEJHKGFfNk4gp3fLDr2Xycv0EBc61UeeB23uwlOoaH_N9SLHP5Z9er29NmW5w/exec';


export interface DeviceDocument {
  docType: string;
  licenseNo: string;
  frequency: string;
  issuedDate: string;
  expiryDate: string;
  prepTime: string;
  status: string;
  daysUntilExpiry: number | null;
}

export interface DeviceData {
  id: string;
  name: string;
  department: string;
  status: string;
  dateAdded: string;
  documents?: DeviceDocument[];
  alertLevel?: 'ok' | 'warning' | 'danger';
  minDaysUntil?: number;
  [key: string]: any;
}

export interface UserData {
  username: string;
  password?: string;
  role: string;
  name: string;
  email?: string;
}

export interface RepairData {
  rowId: string;
  deviceId: string;
  userName: string;
  userEmail: string;
  description: string;
  status: string;
}

// Hàm helper xử lý lỗi fetch chung
const safeFetch = async (input: RequestInfo, init?: RequestInit) => {
  try {
    const response = await fetch(input, init);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    return null;
  }
};

export const fetchDevices = async (): Promise<DeviceData[]> => {
  const data = await safeFetch(`${GOOGLE_SHEETS_API_URL}?action=getDevices`);
  if (!data || !Array.isArray(data)) return [];

  const validData = data.filter((item: any) => (item['Tên Thiết bị'] && item['Tên Thiết bị'].trim() !== '') || (item.name && item.name.trim() !== ''));

  return validData.map((item: any, index: number) => {
    const isOldFormat = 'Tên Thiết bị' in item;
    return {
      id: isOldFormat ? (item['Seri Máy'] || `TB-${String(index + 1).padStart(3, '0')}`) : (item.serial || `TB-${String(index + 1).padStart(3, '0')}`),
      name: isOldFormat ? item['Tên Thiết bị'].trim() : item.name.trim(),
      department: isOldFormat ? (item['Nơi đặt thiết bị'] || 'Chưa phân bổ') : (item.location || 'Chưa phân bổ'),
      status: 'O',
      dateAdded: isOldFormat ? (item['Ngày cấp/ Ngày Đăng kiểm'] || 'N/A') : ((item.documents && item.documents.length > 0) ? item.documents[0].issuedDate : 'N/A'),
      ...item
    };
  });
};

export const fetchUsers = async (): Promise<UserData[]> => {
  const data = await safeFetch(`${GOOGLE_SHEETS_API_URL}?action=getUsers`);
  if (!data || !Array.isArray(data)) return [];

  const validData = data.filter((item: any) => item['Tên đăng nhập'] && item['Tên đăng nhập'].trim() !== '');

  return validData.map((item: any) => ({
    username: item['Tên đăng nhập'] ? item['Tên đăng nhập'].trim() : '',
    password: item['Mật khẩu'] ? String(item['Mật khẩu']).trim() : '',
    role: item['Quyền hạn'] ? item['Quyền hạn'].trim() : 'User',
    name: item['Họ và Tên'] ? item['Họ và Tên'].trim() : 'Người dùng',
    email: item['Email'] ? item['Email'].trim() : '',
  }));
};

export const fetchRepairs = async (): Promise<RepairData[]> => {
  const data = await safeFetch(`${GOOGLE_SHEETS_API_URL}?action=getRepairs`);
  if (!data || !Array.isArray(data)) return [];

  return data.map((item: any) => ({
    rowId: item['Thời gian'] || '',
    deviceId: item['Mã Máy/Thiết bị'] || '',
    userName: item['Người báo lỗi'] || '',
    userEmail: item['Email người báo'] || '',
    description: item['Mô tả lỗi'] || '',
    status: item['Trạng Thái'] || 'Chờ duyệt',
  }));
};

export const reportRepair = async (payload: any) => {
  const data = await safeFetch(GOOGLE_SHEETS_API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'reportRepair', payload }),
  });
  return data || { success: false, message: 'Lỗi kết nối mạng.' };
};

export const approveRepair = async (payload: { rowId: string; deviceId: string; newStatus: string }) => {
  const data = await safeFetch(GOOGLE_SHEETS_API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'approveRepair', payload }),
  });
  return data || { success: false, message: 'Lỗi kết nối mạng.' };
};

export const addDevice = async (payload: {
  name: string;
  serial: string;
  department: string;
  dateAdded: string;
  notes?: string;
}) => {
  const data = await safeFetch(GOOGLE_SHEETS_API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'addDevice', payload }),
  });
  return data || { success: false, message: 'Lỗi kết nối mạng.' };
};

export const editDevice = async (payload: {
  serial: string;
  name: string;
  department: string;
  dateAdded: string;
  notes?: string;
}) => {
  const data = await safeFetch(GOOGLE_SHEETS_API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'editDevice', payload }),
  });
  return data || { success: false, message: 'Lỗi kết nối mạng.' };
};

export const updateDocumentStatus = async (serial: string, status: string) => {
  const data = await safeFetch(GOOGLE_SHEETS_API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'updateDocStatus', payload: { serial, status } }),
  });
  return data || { success: false, message: 'Lỗi kết nối mạng.' };
};

// ===== GSP (Nhiệt độ/Độ ẩm Kho) =====

export interface GspRecord {
  date: string;
  shift: string;
  tempKho: number;
  tempTuLanh: number;
  humidity: number;
  note: string;
  recorder: string;
}

export const fetchGspRecords = async (): Promise<GspRecord[]> => {
  const data = await safeFetch(`${GOOGLE_SHEETS_API_URL}?action=getGSP`);
  if (!Array.isArray(data)) return [];
  return data.map((item: any) => ({
    date: item['Ngày'] || item['date'] || '',
    shift: item['Ca'] || item['shift'] || '',
    tempKho: parseFloat(item['Nhiệt độ Kho'] || item['tempKho'] || 0),
    tempTuLanh: parseFloat(item['Nhiệt độ Tủ lạnh'] || item['tempTuLanh'] || 0),
    humidity: parseFloat(item['Độ ẩm'] || item['humidity'] || 0),
    note: item['Ghi chú'] || item['note'] || '',
    recorder: item['Người ghi'] || item['recorder'] || '',
  }));
};

export const addGspRecord = async (payload: Omit<GspRecord, 'date'>) => {
  const data = await safeFetch(GOOGLE_SHEETS_API_URL, {
    method: 'POST',
    body: JSON.stringify({ action: 'addGSP', payload }),
  });
  return data || { success: false, message: 'Lỗi kết nối mạng.' };
};
