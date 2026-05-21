const SHEETS = {
  devices: 'Devices',
  users: 'Users',
  repairs: 'Repairs',
  transfers: 'Transfers',
  gsp: 'GSP',
  legacy: 'Trang thiết bị 2026',
  documents: 'Documents'
};

const DEVICE_SPREADSHEET_ID = '1fwwIwXpCqhCZzaitYs2__hzfuTNW7mcGAvKl3y_hqZ0';
const USERS_SPREADSHEET_ID = '10yRv_RD5ersJzD9xd-UDkZ8-hoiHxRBW6bz71qtMqoQ';
const LEGACY_DEVICE_SHEET_GID = 281087352;
const USERS_SHEET_GID = 1113591284;

const DEVICE_HEADERS = [
  'id',
  'Tên Thiết bị',
  'Đơn vị tính',
  'Số lượng',
  'Model',
  'Seri Máy',
  'Nơi đặt thiết bị',
  'Hiện trạng thực tế',
  'Hãng SX',
  'Nước SX',
  'Năm SX',
  'Năm SD',
  'Giá',
  'Nguồn',
  'Phân loại',
  'Công ty cung ứng',
  'Nhóm',
  'Ghi chú',
  'Ngày tạo',
  'Ngày cập nhật'
];

const DOCUMENT_HEADERS = [
  'DeviceId',
  'Tên Thiết bị',
  'Loại tài liệu',
  'Số văn bản / Số Đăng kiểm',
  'Ngày cấp / Ngày Đăng kiểm',
  'Hạn đăng kiểm / Hạn hiệu lực',
  'Thời gian chuẩn bị hồ sơ (ngày)',
  'Trạng thái Hồ sơ',
  'Người chịu trách nhiệm',
  'Phối hợp thực hiện',
  'Giao quản lý tại khoa',
  'Ngày tạo',
  'Ngày cập nhật',
  'Link tài liệu'
];

const USER_HEADERS = ['Tên đăng nhập', 'Mã PIN', 'Quyền hạn', 'Họ và Tên', 'Email', 'Khoa/Phòng', 'Trạng thái'];
const REPAIR_HEADERS = ['Thời gian', 'Mã Máy/Thiết bị', 'Người báo lỗi', 'Email người báo', 'Mô tả lỗi', 'Trạng Thái', 'Người duyệt', 'Ghi chú xử lý'];
const TRANSFER_HEADERS = [
  'TransferId',
  'CreatedAt',
  'DeviceId',
  'DeviceName',
  'FromDepartment',
  'ToDepartment',
  'Quantity',
  'Status',
  'RequestedBy',
  'RequestedByName',
  'RequestedByEmail',
  'RequestedNote',
  'RequestedAt',
  'ReceivedBy',
  'ReceivedByName',
  'ReceivedByEmail',
  'ReceivedNote',
  'ReceivedAt',
  'RejectedBy',
  'RejectedAt',
  'RejectReason',
  'UpdatedAt'
];
const GSP_HEADERS = ['date', 'shift', 'tempKho', 'tempTuLanh', 'humidity', 'note', 'recorder'];
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function doGet(e) {
  if (e.parameter.action === 'login') {
    return json_({ success: false, message: 'Đăng nhập phải dùng POST để không lộ mã PIN trên URL.' });
  }
  return json_(route_(e.parameter.action, e.parameter));
}

function doPost(e) {
  try {
    const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    return json_(route_(body.action, body.payload || {}));
  } catch (err) {
    return json_({ success: false, message: 'Lỗi parse payload: ' + err.toString() });
  }
}

function route_(action, payload) {
  setupSheets();
  let actor;
  switch (action) {
    case 'getDevices':
      return getDevicesJoined_();
    case 'getDepartments':
      return getDepartments_();
    case 'login':
      return login_(payload);
    case 'getUsers':
      actor = requireAdmin_(payload);
      if (!actor) return authError_();
      return getUserRows_()
        .filter(row => userStatus_(row) !== 'inactive')
        .map(row => {
           const safeRow = { ...row };
           delete safeRow['Mã PIN']; // BẢO MẬT: Không trả về mã PIN
           delete safeRow['Mật khẩu']; // Tương thích dữ liệu cũ, nếu còn
           return safeRow;
        });
    case 'getRepairs':
      actor = requireAuthenticated_(payload);
      if (!actor) return authError_();
      return getRows_(SHEETS.repairs);
    case 'getTransfers':
      actor = requireAuthenticated_(payload);
      if (!actor) return authError_();
      return getRows_(SHEETS.transfers);
    case 'getGSP':
      actor = requireAuthenticated_(payload);
      if (!actor) return authError_();
      return getRows_(SHEETS.gsp);
    case 'addDevice':
      actor = requireAdmin_(payload);
      if (!actor) return authError_('Chỉ Admin được thêm thiết bị.');
      return addDevice_(payload);
    case 'editDevice':
      actor = requireAdmin_(payload);
      if (!actor) return authError_('Chỉ Admin được sửa thiết bị.');
      return editDevice_(payload);
    case 'reportRepair':
      actor = requireAuthenticated_(payload);
      if (!actor) return authError_();
      payload.userName = userDisplayName_(actor);
      payload.userEmail = userEmail_(actor);
      return reportRepair_(payload);
    case 'approveRepair':
      actor = requireAdmin_(payload);
      if (!actor) return authError_('Chỉ Admin được duyệt hoặc cập nhật sửa chữa.');
      payload.approver = userDisplayName_(actor);
      return approveRepair_(payload);
    case 'updateDocStatus':
      actor = requireAdmin_(payload);
      if (!actor) return authError_('Chỉ Admin được cập nhật trạng thái hồ sơ.');
      return updateDocStatus_(payload);
    case 'addDocument':
      actor = requireAdmin_(payload);
      if (!actor) return authError_('Chỉ Admin được thêm hoặc cập nhật tài liệu.');
      return addDocument_(payload);
    case 'createTransfer':
      actor = requireAuthenticated_(payload);
      if (!actor) return authError_();
      payload.actorUsername = userUsername_(actor);
      return createTransfer_(payload);
    case 'receiveTransfer':
      actor = requireAuthenticated_(payload);
      if (!actor) return authError_();
      payload.actorUsername = userUsername_(actor);
      return receiveTransfer_(payload);
    case 'rejectTransfer':
      actor = requireAuthenticated_(payload);
      if (!actor) return authError_();
      payload.actorUsername = userUsername_(actor);
      return rejectTransfer_(payload);
    case 'cancelTransfer':
      actor = requireAuthenticated_(payload);
      if (!actor) return authError_();
      payload.actorUsername = userUsername_(actor);
      return cancelTransfer_(payload);
    case 'transferDevice':
      actor = requireAuthenticated_(payload);
      if (!actor) return authError_();
      payload.actorUsername = userUsername_(actor);
      return createTransfer_(payload);
    case 'addGSP':
      actor = requireAuthenticated_(payload);
      if (!actor) return authError_();
      payload.recorder = userDisplayName_(actor);
      return addGSP_(payload);
    case 'migrateLegacyDevices':
      actor = requireAdmin_(payload);
      if (!actor) return authError_('Chỉ Admin được chạy migrate dữ liệu.');
      return migrateLegacyDevices_();
    case 'editUser':
      actor = requireAuthenticated_(payload);
      if (!actor) return authError_();
      return editUser_(payload);
    default:
      return { success: false, message: 'Action không hợp lệ: ' + action };
  }
}

function login_(payload) {
  const users = getUserRows_();
  const username = String(payload.username || '').trim();
  const pin = String(payload.pin || payload.password || '').trim();
  
  if (!username || !pin) {
    return { success: false, message: 'Vui lòng nhập tên đăng nhập và mã PIN.' };
  }
  
  const user = users.find(u => {
    const account = getUserField_(u, ['Tên đăng nhập', 'Ten dang nhap', 'Username', 'Tài khoản', 'Tai khoan', 'username']);
    const email = getUserField_(u, ['Email', 'email']);
    const userPin = getUserField_(u, ['Mã PIN', 'Ma PIN', 'PIN', 'pin', 'Mật khẩu', 'Mat khau', 'Password', 'password', 'Mã pin', 'MÃ PIN']);
    return (normalize_(account) === normalize_(username) || normalize_(email) === normalize_(username)) && String(userPin).trim() === pin;
  });
  
  if (user) {
    if (userStatus_(user) === 'inactive') {
      return { success: false, message: 'Tài khoản đã bị khóa.' };
    }
    const safeUser = { ...user };
    // Xóa các trường nhạy cảm trước khi trả về
    ['Mã PIN', 'Ma PIN', 'PIN', 'pin', 'Mật khẩu', 'Mat khau', 'Password', 'password', 'Mã pin', 'MÃ PIN'].forEach(k => delete safeUser[k]);
    const session = createSessionToken_(user);
    return { success: true, user: safeUser, token: session.token, expiresAt: session.expiresAt };
  }
  return { success: false, message: 'Tên đăng nhập hoặc mã PIN không chính xác.' };
}

function createSessionToken_(user) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const body = JSON.stringify({
    username: userUsername_(user),
    expiresAt: expiresAt
  });
  const encodedBody = stripBase64Padding_(Utilities.base64EncodeWebSafe(body, Utilities.Charset.UTF_8));
  return {
    token: encodedBody + '.' + signSessionValue_(encodedBody),
    expiresAt: expiresAt
  };
}

function verifySessionToken_(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 2) return null;
  if (!constantTimeEqual_(signSessionValue_(parts[0]), parts[1])) return null;

  try {
    const body = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(padBase64_(parts[0]))).getDataAsString());
    if (!body.username || Number(body.expiresAt) <= Date.now()) return null;
    const user = findUser_(body.username);
    if (!user) return null;
    if (userStatus_(user) === 'inactive') return null;
    return user;
  } catch (err) {
    console.error('verifySessionToken_ failed', err);
    return null;
  }
}

function requireAuthenticated_(payload) {
  return verifySessionToken_(payload && payload.sessionToken);
}

function requireAdmin_(payload) {
  const user = requireAuthenticated_(payload);
  return user && isAdmin_(user) ? user : null;
}

function authError_(message) {
  return {
    success: false,
    message: message || 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.'
  };
}

function signSessionValue_(value) {
  const signature = Utilities.computeHmacSha256Signature(value, sessionSecret_());
  return stripBase64Padding_(Utilities.base64EncodeWebSafe(signature));
}

function sessionSecret_() {
  const configured = PropertiesService.getScriptProperties().getProperty('SESSION_SECRET');
  if (configured) return configured;
  return ScriptApp.getScriptId() + ':' + DEVICE_SPREADSHEET_ID + ':' + USERS_SPREADSHEET_ID;
}

function stripBase64Padding_(value) {
  return String(value || '').replace(/=+$/g, '');
}

function padBase64_(value) {
  const text = String(value || '');
  const padding = (4 - (text.length % 4)) % 4;
  return text + '='.repeat(padding);
}

function constantTimeEqual_(left, right) {
  const a = String(left || '');
  const b = String(right || '');
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i += 1) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function setupSheets() {
  ensureSheet_(SHEETS.devices, DEVICE_HEADERS);
  ensureSheet_(SHEETS.repairs, REPAIR_HEADERS);
  ensureSheet_(SHEETS.transfers, TRANSFER_HEADERS);
  ensureSheet_(SHEETS.gsp, GSP_HEADERS);
  ensureSheet_(SHEETS.documents, DOCUMENT_HEADERS);
}

function migrateLegacyDevices() {
  return migrateLegacyDevices_();
}

function getDocType_(licenseNo, group, docIndex) {
  const g = String(group || '').trim();
  const match = g.match(/^(IV|III|II|I)\b/i) || g.match(/\b(IV|III|II|I)\b/i);
  const roman = match ? match[1].toUpperCase() : '';

  if (roman === 'I') {
    if (docIndex === 0) return 'Giấy phép';
    if (docIndex === 1) return 'Kiểm định';
    if (docIndex === 2) return 'An toàn bức xạ';
  }
  if (roman === 'II') return 'Kiểm định';
  if (roman === 'III') return 'Bảo dưỡng';
  return 'Khác';
}

function parseDate_(dateStr) {
  if (!dateStr) return new Date(NaN);
  const parts = String(dateStr).split('/');
  if (parts.length === 3) {
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parseInt(parts[2], 10);
    return new Date(y, m, d);
  }
  return new Date(dateStr);
}

function getDevicesJoined_() {
  const devices = getRows_(SHEETS.devices);
  const documents = getRows_(SHEETS.documents);
  
  const docsByDevice = {};
  documents.forEach(doc => {
    const devId = String(doc.DeviceId || '').trim();
    if (!docsByDevice[devId]) docsByDevice[devId] = [];
    docsByDevice[devId].push(doc);
  });
  
  return devices.map(device => {
    const devId = String(device.id || '').trim();
    const devDocs = docsByDevice[devId] || [];
    device.documents = devDocs;
    
    // Tìm tài liệu khẩn cấp nhất cho tương thích ngược
    let urgentDoc = null;
    let minTime = Infinity;
    
    devDocs.forEach(doc => {
      const expDateStr = doc['Hạn đăng kiểm / Hạn hiệu lực'];
      if (expDateStr && expDateStr !== 'N/A') {
        const time = parseDate_(expDateStr).getTime();
        if (!isNaN(time) && time < minTime) {
          minTime = time;
          urgentDoc = doc;
        }
      }
    });
    
    if (urgentDoc) {
      device['Số đăng kiểm'] = urgentDoc['Số văn bản / Số Đăng kiểm'] || '';
      device['Ngày cấp/ Ngày Đăng kiểm'] = urgentDoc['Ngày cấp / Ngày Đăng kiểm'] || '';
      device['Hạn đăng kiểm'] = urgentDoc['Hạn đăng kiểm / Hạn hiệu lực'] || '';
      device['Thời hạn cấp lại/ Hạn đăng kiểm'] = urgentDoc['Hạn đăng kiểm / Hạn hiệu lực'] || '';
      device['Thời gian chuẩn bị Hồ sơ'] = urgentDoc['Thời gian chuẩn bị hồ sơ (ngày)'] || '';
      device['Thời gian  chuẩn bị Hồ sơ'] = urgentDoc['Thời gian chuẩn bị hồ sơ (ngày)'] || '';
      device['Trạng thái Hồ sơ'] = urgentDoc['Trạng thái Hồ sơ'] || 'Chưa gửi';
      device['Loại tài liệu khẩn cấp'] = urgentDoc['Loại tài liệu'] || '';
    } else {
      device['Số đăng kiểm'] = '';
      device['Ngày cấp/ Ngày Đăng kiểm'] = '';
      device['Hạn đăng kiểm'] = '';
      device['Thời hạn cấp lại/ Hạn đăng kiểm'] = '';
      device['Thời gian chuẩn bị Hồ sơ'] = '';
      device['Thời gian  chuẩn bị Hồ sơ'] = '';
      device['Trạng thái Hồ sơ'] = '';
      device['Loại tài liệu khẩn cấp'] = '';
    }
    
    return device;
  });
}

function migrateLegacyDevices_() {
  const ss = deviceSpreadsheet_();
  const legacySheet = sheetByGid_(ss, LEGACY_DEVICE_SHEET_GID) || ss.getSheetByName(SHEETS.legacy) || ss.getSheets()[0];
  const values = legacySheet.getDataRange().getDisplayValues();
  if (values.length < 5) return { success: false, message: 'Không tìm thấy dữ liệu Excel nguồn.' };

  setupSheets();

  const devicesSheet = ss.getSheetByName(SHEETS.devices);
  const documentsSheet = ss.getSheetByName(SHEETS.documents);
  
  if (devicesSheet.getLastRow() > 1) {
    devicesSheet.getRange(2, 1, devicesSheet.getLastRow() - 1, devicesSheet.getLastColumn()).clearContent();
  }
  if (documentsSheet.getLastRow() > 1) {
    documentsSheet.getRange(2, 1, documentsSheet.getLastRow() - 1, documentsSheet.getLastColumn()).clearContent();
  }

  let currentGroup = '';
  const parsedDevices = [];
  const parsedDocs = [];
  
  let currentDevice = null;
  const statusCols = ["Mới chưa sử dụng", "Mới mang ra sử dụng", "Sửa chữa nhỏ", "Sửa chữa lớn", "Hỏng"];

  for (let r = 2; r < values.length; r++) {
    const row = values[r];
    const sttVal = String(row[0] || '').trim();
    const nameVal = String(row[1] || '').trim();

    // Bỏ qua dòng tiêu đề bảng nếu bị lặp lại trong Sheet
    if (sttVal.toUpperCase() === 'STT' || nameVal.toUpperCase() === 'TÊN MÁY' || nameVal.toUpperCase() === 'TÊN THIẾT BỊ') {
      continue;
    }

    // Kiểm tra tiêu đề nhóm
    if (sttVal && !/^\d+(\.\d+)?$/.test(sttVal)) {
      currentGroup = sttVal;
      currentDevice = null;
      continue;
    }
    if (!sttVal && nameVal && /^(IV|III|II|I)[:.\s]/i.test(nameVal)) {
      currentGroup = nameVal;
      currentDevice = null;
      continue;
    }

    // Hàng phụ thuộc (STT và Tên rỗng) chứa tài liệu đăng kiểm bổ sung
    if (!sttVal && !nameVal) {
      if (currentDevice) {
        const licenseNo = String(row[8] || '').trim();
        const doc = {
          DeviceId: currentDevice.id,
          deviceRef: currentDevice,
          'Tên Thiết bị': currentDevice['Tên Thiết bị'],
          'Loại tài liệu': getDocType_(licenseNo, currentGroup, currentDevice.documents.length),
          'Số văn bản / Số Đăng kiểm': licenseNo,
          'Ngày cấp / Ngày Đăng kiểm': String(row[9] || '').trim(),
          'Hạn đăng kiểm / Hạn hiệu lực': String(row[10] || '').trim(),
          'Thời gian chuẩn bị hồ sơ (ngày)': String(row[17] || '').trim(),
          'Trạng thái Hồ sơ': 'Chưa gửi',
          'Người chịu trách nhiệm': '',
          'Phối hợp thực hiện': '',
          'Giao quản lý tại khoa': '',
          'Ngày tạo': new Date(),
          'Ngày cập nhật': new Date()
        };

        // Điền chi tiết thiết bị nếu có ở hàng phụ này
        const modelVal = String(row[4] || '').trim();
        const seriVal = String(row[5] || '').trim();
        const mfgVal = String(row[11] || '').trim();
        const countryVal = String(row[12] || '').trim();
        const yMfg = String(row[13] || '').trim();
        const yUse = String(row[14] || '').trim();
        const price = String(row[15] || '').trim();
        const source = String(row[16] || '').trim();

        if (modelVal) currentDevice.Model = modelVal;
        if (seriVal) {
          currentDevice['Seri Máy'] = seriVal;
          currentDevice.id = seriVal;
        }
        if (mfgVal) currentDevice['Hãng SX'] = mfgVal;
        if (countryVal) currentDevice['Nước SX'] = countryVal;
        if (yMfg) currentDevice['Năm SX'] = yMfg;
        if (yUse) currentDevice['Năm SD'] = yUse;
        if (price) currentDevice['Giá'] = price;
        if (source) currentDevice['Nguồn'] = source;

        if (doc['Số văn bản / Số Đăng kiểm']) {
          currentDevice.documents.push(doc);
          parsedDocs.push(doc);
        }
      }
      continue;
    }

    // Thiết bị mới
    const id = 'TTB-2026-' + String(parsedDevices.length + 1).padStart(4, '0');
    
    let classify = '';
    for (let i = 0; i < statusCols.length; i++) {
      if (String(row[19 + i] || '').trim()) {
        classify = (i + 1) + ' - ' + statusCols[i];
        break;
      }
    }

    const isOxyGroup = currentGroup.toUpperCase().indexOf('BỒN OXY') >= 0 || currentGroup.toUpperCase().indexOf('OXY') >= 0;
    const device = {
      id: id,
      'Tên Thiết bị': nameVal,
      'Đơn vị tính': String(row[2] || '').trim(),
      'Số lượng': String(row[3] || '').trim() || '1',
      Model: String(row[4] || '').trim(),
      'Seri Máy': String(row[5] || '').trim(),
      'Nơi đặt thiết bị': isOxyGroup ? (String(row[11] || '').trim() || 'Nhà Oxy') : (String(row[6] || '').trim() || 'Chưa phân bổ'),
      'Hiện trạng thực tế': String(row[7] || '').trim() || 'Đang sử dụng',
      'Hãng SX': isOxyGroup ? '' : String(row[11] || '').trim(),
      'Nước SX': isOxyGroup ? '' : String(row[12] || '').trim(),
      'Năm SX': isOxyGroup ? '' : String(row[13] || '').trim(),
      'Năm SD': isOxyGroup ? '' : String(row[14] || '').trim(),
      'Giá': isOxyGroup ? '' : String(row[15] || '').trim(),
      'Nguồn': isOxyGroup ? '' : String(row[16] || '').trim(),
      'Phân loại': classify,
      'Công ty cung ứng': String(row[24] || '').trim(),
      'Nhóm': currentGroup,
      'Ghi chú': String(row[25] || '').trim(),
      'Ngày tạo': new Date(),
      'Ngày cập nhật': new Date(),
      documents: []
    };

    if (device['Seri Máy']) {
      device.id = device['Seri Máy'];
    }

    currentDevice = device;
    parsedDevices.push(device);

    // Lưu tài liệu đầu tiên nếu có ở hàng chính
    const licenseNo = String(row[8] || '').trim();
    if (licenseNo) {
      const doc = {
        DeviceId: currentDevice.id,
        deviceRef: currentDevice,
        'Tên Thiết bị': currentDevice['Tên Thiết bị'],
        'Loại tài liệu': getDocType_(licenseNo, currentGroup, 0),
        'Số văn bản / Số Đăng kiểm': licenseNo,
        'Ngày cấp / Ngày Đăng kiểm': String(row[9] || '').trim(),
        'Hạn đăng kiểm / Hạn hiệu lực': String(row[10] || '').trim(),
        'Thời gian chuẩn bị hồ sơ (ngày)': String(row[17] || '').trim(),
        'Trạng thái Hồ sơ': 'Chưa gửi',
        'Người chịu trách nhiệm': '',
        'Phối hợp thực hiện': '',
        'Giao quản lý tại khoa': '',
        'Ngày tạo': new Date(),
        'Ngày cập nhật': new Date()
      };
      currentDevice.documents.push(doc);
      parsedDocs.push(doc);
    }
  }

  // Đồng bộ DeviceId cho toàn bộ tài liệu dựa trên ID cuối cùng của thiết bị cha
  parsedDocs.forEach(doc => {
    if (doc.deviceRef) {
      doc.DeviceId = doc.deviceRef.id;
      delete doc.deviceRef;
    }
  });

  // Ghi thiết bị xuống Sheets
  parsedDevices.forEach(dev => {
    const devCopy = { ...dev };
    delete devCopy.documents;
    appendObject_(SHEETS.devices, devCopy);
  });

  // Ghi tài liệu xuống Sheets
  parsedDocs.forEach(doc => {
    appendObject_(SHEETS.documents, doc);
  });

  return { success: true, message: 'Đã import thành công ' + parsedDevices.length + ' thiết bị và ' + parsedDocs.length + ' tài liệu kiểm định.' };
}

function addDevice_(payload) {
  const id = payload.serial || nextDeviceId_();
  appendObject_(SHEETS.devices, {
    id,
    'Tên Thiết bị': payload.name || '',
    'Seri Máy': id,
    'Nơi đặt thiết bị': payload.department || '',
    'Ngày cấp/ Ngày Đăng kiểm': payload.dateAdded || '',
    'Ghi chú': payload.notes || '',
    'Số lượng': payload.quantity || 1,
    'Ngày tạo': new Date(),
    'Ngày cập nhật': new Date()
  });
  return { success: true, message: 'Đã thêm thiết bị.' };
}

function editDevice_(payload) {
  const rowIndex = findDeviceRow_(payload.serial || payload.id);
  if (rowIndex < 2) return { success: false, message: 'Không tìm thấy thiết bị.' };
  updateRowByObject_(SHEETS.devices, rowIndex, {
    'Tên Thiết bị': payload.name,
    'Seri Máy': payload.serial,
    'Nơi đặt thiết bị': payload.department,
    'Ngày cấp/ Ngày Đăng kiểm': payload.dateAdded,
    'Ghi chú': payload.notes,
    'Ngày cập nhật': new Date()
  });
  return { success: true, message: 'Đã cập nhật thiết bị.' };
}

function createTransfer_(payload) {
  const deviceId = payload.deviceId || payload.serial || payload.id;
  const toDepartment = String(payload.toDepartment || '').trim();
  const actor = findUser_(payload.actorUsername);
  if (!deviceId || !toDepartment) return { success: false, message: 'Thiếu thiết bị hoặc khoa/phòng nhận.' };
  if (!actor) return { success: false, message: 'Không xác thực được người chuyển.' };

  const rowIndex = findDeviceRow_(deviceId);
  if (rowIndex < 2) return { success: false, message: 'Không tìm thấy thiết bị.' };

  const device = rowObject_(SHEETS.devices, rowIndex);
  const fromDepartment = device['Nơi đặt thiết bị'] || '';
  if (normalize_(fromDepartment) === normalize_(toDepartment)) return { success: false, message: 'Khoa nhận đang trùng với khoa hiện tại.' };
  
  const isBorrow = String(payload.reason || '').indexOf('[Mượn]') === 0;
  if (!isAdmin_(actor)) {
    if (isBorrow) {
      if (normalize_(userDepartment_(actor)) !== normalize_(toDepartment)) {
        return { success: false, message: 'Chỉ tài khoản thuộc khoa nhận mới được tạo yêu cầu mượn.' };
      }
    } else {
      if (normalize_(userDepartment_(actor)) !== normalize_(fromDepartment)) {
        return { success: false, message: 'Chỉ tài khoản thuộc khoa đang giữ thiết bị mới được tạo yêu cầu chuyển.' };
      }
    }
  }

  const transferId = nextTransferId_();
  const now = new Date();
  appendObject_(SHEETS.transfers, {
    TransferId: transferId,
    CreatedAt: now,
    DeviceId: deviceId,
    DeviceName: device['Tên Thiết bị'] || device.name || '',
    FromDepartment: fromDepartment,
    ToDepartment: toDepartment,
    Quantity: payload.quantity || device['Số lượng'] || 1,
    Status: 'PENDING_RECEIVE',
    RequestedBy: userUsername_(actor),
    RequestedByName: userDisplayName_(actor),
    RequestedByEmail: userEmail_(actor),
    RequestedNote: payload.reason || payload.note || '',
    RequestedAt: now,
    UpdatedAt: now
  });

  sendTransferMail_({
    type: 'request',
    transferId,
    device,
    fromDepartment,
    toDepartment,
    actor,
    note: payload.reason || payload.note || ''
  });

  return { success: true, message: 'Đã gửi yêu cầu luân chuyển sang ' + toDepartment + '. Chờ khoa nhận xác nhận.', transferId };
}

function receiveTransfer_(payload) {
  const actor = findUser_(payload.actorUsername);
  if (!actor) return { success: false, message: 'Không xác thực được người nhận.' };
  const rowIndex = findTransferRow_(payload.transferId);
  if (rowIndex < 2) return { success: false, message: 'Không tìm thấy yêu cầu luân chuyển.' };

  const transfer = rowObject_(SHEETS.transfers, rowIndex);
  if (transfer.Status !== 'PENDING_RECEIVE') return { success: false, message: 'Yêu cầu này không còn ở trạng thái chờ nhận.' };
  if (!isAdmin_(actor) && normalize_(userDepartment_(actor)) !== normalize_(transfer.ToDepartment)) {
    return { success: false, message: 'Chỉ tài khoản thuộc khoa nhận mới được xác nhận nhận thiết bị.' };
  }

  const deviceRow = findDeviceRow_(transfer.DeviceId);
  if (deviceRow < 2) return { success: false, message: 'Không tìm thấy thiết bị cần luân chuyển.' };
  const now = new Date();
  updateRowByObject_(SHEETS.devices, deviceRow, {
    'Nơi đặt thiết bị': transfer.ToDepartment,
    'Ngày cập nhật': now
  });
  updateRowByObject_(SHEETS.transfers, rowIndex, {
    Status: 'COMPLETED',
    ReceivedBy: userUsername_(actor),
    ReceivedByName: userDisplayName_(actor),
    ReceivedByEmail: userEmail_(actor),
    ReceivedNote: payload.note || '',
    ReceivedAt: now,
    UpdatedAt: now
  });

  sendTransferMail_({
    type: 'received',
    transfer,
    actor,
    note: payload.note || ''
  });

  return { success: true, message: 'Đã xác nhận nhận thiết bị và cập nhật khoa/phòng sử dụng.' };
}

function rejectTransfer_(payload) {
  const actor = findUser_(payload.actorUsername);
  if (!actor) return { success: false, message: 'Không xác thực được người từ chối.' };
  const rowIndex = findTransferRow_(payload.transferId);
  if (rowIndex < 2) return { success: false, message: 'Không tìm thấy yêu cầu luân chuyển.' };

  const transfer = rowObject_(SHEETS.transfers, rowIndex);
  if (transfer.Status !== 'PENDING_RECEIVE') return { success: false, message: 'Yêu cầu này không còn ở trạng thái chờ nhận.' };
  if (!isAdmin_(actor) && normalize_(userDepartment_(actor)) !== normalize_(transfer.ToDepartment)) {
    return { success: false, message: 'Chỉ tài khoản thuộc khoa nhận mới được từ chối yêu cầu.' };
  }

  const now = new Date();
  updateRowByObject_(SHEETS.transfers, rowIndex, {
    Status: 'REJECTED',
    RejectedBy: userUsername_(actor),
    RejectedAt: now,
    RejectReason: payload.reason || '',
    UpdatedAt: now
  });

  sendTransferMail_({
    type: 'rejected',
    transfer,
    actor,
    note: payload.reason || ''
  });

  return { success: true, message: 'Đã từ chối yêu cầu luân chuyển.' };
}

function cancelTransfer_(payload) {
  const actor = findUser_(payload.actorUsername);
  if (!actor) return { success: false, message: 'Không xác thực được người hủy.' };
  const rowIndex = findTransferRow_(payload.transferId);
  if (rowIndex < 2) return { success: false, message: 'Không tìm thấy yêu cầu luân chuyển.' };

  const transfer = rowObject_(SHEETS.transfers, rowIndex);
  if (transfer.Status !== 'PENDING_RECEIVE') return { success: false, message: 'Chỉ hủy được yêu cầu đang chờ nhận.' };
  if (!isAdmin_(actor) && String(userUsername_(actor)) !== String(transfer.RequestedBy)) {
    return { success: false, message: 'Chỉ người tạo yêu cầu hoặc Admin mới được hủy.' };
  }

  updateRowByObject_(SHEETS.transfers, rowIndex, {
    Status: 'CANCELLED',
    RejectReason: payload.reason || 'Đã hủy yêu cầu',
    UpdatedAt: new Date()
  });

  return { success: true, message: 'Đã hủy yêu cầu luân chuyển.' };
}

function reportRepair_(payload) {
  const deviceId = payload.deviceId || payload.serial || '';
  appendObject_(SHEETS.repairs, {
    'Thời gian': new Date(),
    'Mã Máy/Thiết bị': deviceId,
    'Người báo lỗi': payload.userName || payload.name || '',
    'Email người báo': payload.userEmail || payload.email || '',
    'Mô tả lỗi': payload.description || '',
    'Trạng Thái': 'Chờ duyệt'
  });

  // Gửi email thông báo báo hỏng
  try {
    const device = findDeviceById_(deviceId);
    if (device) {
      const recipients = getDeviceRecipients_(device);
      if (recipients.length > 0) {
        sendNotificationMail_({
          recipients: recipients,
          subject: '[QLTTB] ⚠️ Báo hỏng thiết bị: ' + (device['Tên Thiết bị'] || deviceId),
          body: [
            '<h3 style="color:#d32f2f;">Thông báo Thiết bị Báo hỏng</h3>',
            '<table style="border-collapse:collapse;width:100%;" border="1" cellpadding="8">',
            '<tr><td style="background:#f5f5f5;width:180px;"><strong>Mã thiết bị</strong></td><td>' + deviceId + '</td></tr>',
            '<tr><td style="background:#f5f5f5;"><strong>Tên thiết bị</strong></td><td>' + (device['Tên Thiết bị'] || '') + '</td></tr>',
            '<tr><td style="background:#f5f5f5;"><strong>Model / Seri</strong></td><td>' + (device.Model || '') + ' / ' + (device['Seri Máy'] || '') + '</td></tr>',
            '<tr><td style="background:#f5f5f5;"><strong>Nơi đặt</strong></td><td>' + (device['Nơi đặt thiết bị'] || '') + '</td></tr>',
            '<tr><td style="background:#f5f5f5;"><strong>Người báo lỗi</strong></td><td>' + (payload.userName || '') + ' (' + (payload.userEmail || '') + ')</td></tr>',
            '<tr><td style="background:#f5f5f5;"><strong>Mô tả lỗi</strong></td><td style="color:#d32f2f;">' + (payload.description || '') + '</td></tr>',
            '</table>',
            '<p style="margin-top:16px;">Vui lòng đăng nhập hệ thống <strong>Quản lý Trang thiết bị Y tế</strong> để xem chi tiết và xử lý.</p>'
          ].join('')
        });
      }
    }
  } catch (err) { console.error('reportRepair_ email failed', err); }

  return { success: true, message: 'Đã ghi nhận báo hỏng.' };
}

function approveRepair_(payload) {
  const rows = getRows_(SHEETS.repairs);
  const idx = rows.findIndex(row => String(row['Thời gian']) === String(payload.rowId));
  if (idx < 0) return { success: false, message: 'Không tìm thấy phiếu sửa chữa.' };
  
  const newStatus = payload.newStatus || payload.status || 'Đã duyệt';
  updateRowByObject_(SHEETS.repairs, idx + 2, {
    'Trạng Thái': newStatus,
    'Người duyệt': payload.approver || '',
    'Ghi chú xử lý': payload.note || ''
  });

  // Đồng bộ hiện trạng thiết bị nếu trạng thái sửa chữa thay đổi
  const repairRow = rows[idx];
  const deviceId = String(repairRow['Mã Máy/Thiết bị'] || '').trim();
  if (deviceId) {
    const deviceRowIndex = findDeviceRow_(deviceId);
    if (deviceRowIndex >= 2) {
      let deviceStatus = '';
      if (newStatus === 'Đang sửa') deviceStatus = 'Đang sửa chữa';
      else if (newStatus === 'Đã sửa xong' || newStatus === 'Hoàn thành') deviceStatus = 'Đang sử dụng';
      else if (newStatus === 'Hỏng - chờ thanh lý') deviceStatus = 'Hỏng';
      if (deviceStatus) {
        updateRowByObject_(SHEETS.devices, deviceRowIndex, {
          'Hiện trạng thực tế': deviceStatus,
          'Ngày cập nhật': new Date()
        });
      }
    }
  }

  // Gửi email thông báo cập nhật sửa chữa
  try {
    const device = findDeviceById_(deviceId);
    if (device) {
      const recipients = getDeviceRecipients_(device);
      // Thêm người báo lỗi vào danh sách nhận
      const reporterEmail = String(repairRow['Email người báo'] || '').trim();
      if (reporterEmail) recipients.push(reporterEmail);
      const uniqueRecipients = Array.from(new Set(recipients));
      if (uniqueRecipients.length > 0) {
        sendNotificationMail_({
          recipients: uniqueRecipients,
          subject: '[QLTTB] 🔧 Cập nhật sửa chữa thiết bị: ' + (device['Tên Thiết bị'] || deviceId),
          body: [
            '<h3 style="color:#1565c0;">Cập nhật Tình trạng Sửa chữa Thiết bị</h3>',
            '<table style="border-collapse:collapse;width:100%;" border="1" cellpadding="8">',
            '<tr><td style="background:#f5f5f5;width:180px;"><strong>Mã thiết bị</strong></td><td>' + deviceId + '</td></tr>',
            '<tr><td style="background:#f5f5f5;"><strong>Tên thiết bị</strong></td><td>' + (device['Tên Thiết bị'] || '') + '</td></tr>',
            '<tr><td style="background:#f5f5f5;"><strong>Trạng thái mới</strong></td><td style="font-weight:bold;color:#1565c0;">' + newStatus + '</td></tr>',
            '<tr><td style="background:#f5f5f5;"><strong>Người duyệt</strong></td><td>' + (payload.approver || '') + '</td></tr>',
            payload.note ? '<tr><td style="background:#f5f5f5;"><strong>Ghi chú xử lý</strong></td><td>' + payload.note + '</td></tr>' : '',
            '</table>',
            '<p style="margin-top:16px;">Vui lòng đăng nhập hệ thống <strong>Quản lý Trang thiết bị Y tế</strong> để xem chi tiết.</p>'
          ].join('')
        });
      }
    }
  } catch (err) { console.error('approveRepair_ email failed', err); }

  return { success: true, message: 'Đã cập nhật phiếu sửa chữa.' };
}

function updateDocStatus_(payload) {
  const deviceId = String(payload.serial || '').trim();
  const docType = String(payload.docType || '').trim();
  const status = String(payload.status || '').trim();
  
  if (!deviceId) return { success: false, message: 'Thiếu DeviceId / Số Seri.' };
  
  const rows = getRows_(SHEETS.documents);
  let foundIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (String(row.DeviceId || '').trim() === deviceId) {
      if (!docType || String(row['Loại tài liệu'] || '').trim() === docType) {
        foundIndex = i + 2;
        break;
      }
    }
  }
  
  if (foundIndex < 2) {
    return { success: false, message: 'Không tìm thấy tài liệu đăng kiểm phù hợp cho thiết bị ' + deviceId + ' (Loại: ' + (docType || 'Bất kỳ') + ').' };
  }
  
  updateRowByObject_(SHEETS.documents, foundIndex, {
    'Trạng thái Hồ sơ': status,
    'Ngày cập nhật': new Date()
  });
  
  return { success: true, message: 'Đã cập nhật trạng thái tài liệu ' + docType + ' của thiết bị ' + deviceId + ' thành "' + status + '".' };
}

function addDocument_(payload) {
  const deviceId = String(payload.serial || '').trim();
  const docType = String(payload.docType || '').trim();
  
  if (!deviceId || !docType) {
    return { success: false, message: 'Thiếu DeviceId hoặc Loại tài liệu.' };
  }
  
  let fileUrl = payload.fileUrl || '';
  
  // Nếu có file đính kèm dạng Base64
  if (payload.fileContent && payload.fileName) {
    try {
      let folder;
      try {
        const ss = SpreadsheetApp.openById(DEVICE_SPREADSHEET_ID);
        const parentFolder = DriveApp.getFileById(ss.getId()).getParents().next();
        const folders = parentFolder.getFoldersByName('Tài liệu kiểm định');
        if (folders.hasNext()) {
          folder = folders.next();
        } else {
          folder = parentFolder.createFolder('Tài liệu kiểm định');
        }
      } catch (e) {
        folder = DriveApp.getRootFolder();
      }
      
      const decoded = Utilities.base64Decode(payload.fileContent);
      const blob = Utilities.newBlob(decoded, payload.mimeType || 'application/pdf', payload.fileName);
      const file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      fileUrl = file.getUrl();
    } catch (err) {
      return { success: false, message: 'Không thể tải file lên Google Drive: ' + err.toString() };
    }
  }
  
  // Kiểm tra xem đã tồn tại loại tài liệu này cho thiết bị chưa
  const rows = getRows_(SHEETS.documents);
  let foundIndex = -1;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (String(row.DeviceId || '').trim() === deviceId && String(row['Loại tài liệu'] || '').trim() === docType) {
      foundIndex = i + 2;
      break;
    }
  }
  
  const existingLink = foundIndex >= 2 ? rows[foundIndex - 2]['Link tài liệu'] || '' : '';
  const finalFileUrl = fileUrl || existingLink;
  
  const docData = {
    'DeviceId': deviceId,
    'Loại tài liệu': docType,
    'Số văn bản / Số Đăng kiểm': payload.licenseNo || '',
    'Ngày cấp / Ngày Đăng kiểm': payload.issuedDate || '',
    'Hạn đăng kiểm / Hạn hiệu lực': payload.expiryDate || '',
    'Thời gian chuẩn bị hồ sơ (ngày)': payload.prepTime || '',
    'Trạng thái Hồ sơ': payload.status || 'Chưa gửi',
    'Người chịu trách nhiệm': payload.responsible || '',
    'Phối hợp thực hiện': payload.collaborator || '',
    'Giao quản lý tại khoa': payload.deptManager || '',
    'Link tài liệu': finalFileUrl,
    'Ngày cập nhật': new Date()
  };
  
  if (foundIndex >= 2) {
    // Cập nhật tài liệu cũ
    updateRowByObject_(SHEETS.documents, foundIndex, docData);
    return { success: true, message: 'Đã cập nhật thông tin tài liệu và file.', fileUrl: finalFileUrl };
  } else {
    // Tạo mới tài liệu
    docData['Ngày tạo'] = new Date();
    
    // Lấy tên thiết bị để ghi vào sheet documents cho dễ theo dõi
    let deviceName = '';
    const devRows = getRows_(SHEETS.devices);
    const dev = devRows.find(d => String(d.id || '').trim() === deviceId);
    if (dev) {
      deviceName = dev['Tên Thiết bị'] || dev.name || '';
    }
    docData['Tên Thiết bị'] = deviceName;
    
    appendObject_(SHEETS.documents, docData);
    return { success: true, message: 'Đã thêm mới tài liệu và file thành công.', fileUrl: finalFileUrl };
  }
}

function addGSP_(payload) {
  appendObject_(SHEETS.gsp, {
    date: new Date(),
    shift: payload.shift,
    tempKho: payload.tempKho,
    tempTuLanh: payload.tempTuLanh,
    humidity: payload.humidity,
    note: payload.note,
    recorder: payload.recorder
  });
  return { success: true, message: 'Đã lưu nhật ký GSP.' };
}

function getDepartments_() {
  const departments = {};
  getRows_(SHEETS.devices).forEach(row => {
    const value = String(row['Nơi đặt thiết bị'] || row.department || '').trim();
    if (value) departments[value] = true;
  });
  getUserRows_().forEach(row => {
    const value = String(row['Khoa/Phòng'] || '').trim();
    if (value) departments[value] = true;
  });
  return Object.keys(departments).sort();
}

function getRows_(sheetName) {
  const sheet = deviceSpreadsheet_().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values.shift();
  return values
    .filter(row => row.some(cell => String(cell).trim() !== ''))
    .map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ''])));
}

function getUserRows_() {
  const sheet = userSheet_();
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values.shift();
  return values
    .filter(row => row.some(cell => String(cell).trim() !== ''))
    .map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] || ''])));
}

function getUserField_(user, keys) {
  for (let i = 0; i < keys.length; i += 1) {
    const direct = user[keys[i]];
    if (direct !== undefined && String(direct).trim() !== '') return direct;
  }

  const wanted = keys.map(normalizeHeader_);
  const actualKeys = Object.keys(user);
  for (let i = 0; i < actualKeys.length; i += 1) {
    if (wanted.indexOf(normalizeHeader_(actualKeys[i])) > -1) {
      const value = user[actualKeys[i]];
      if (value !== undefined && String(value).trim() !== '') return value;
    }
  }
  return '';
}

function userUsername_(user) {
  return String(getUserField_(user, ['Tên đăng nhập', 'Ten dang nhap', 'Username', 'Tài khoản', 'Tai khoan', 'username']) || '').trim();
}

function userDisplayName_(user) {
  return String(getUserField_(user, ['Họ và Tên', 'Họ và tên', 'Ho va Ten', 'Ho va ten', 'Name', 'name']) || userUsername_(user)).trim();
}

function userEmail_(user) {
  return String(getUserField_(user, ['Email', 'email']) || '').trim();
}

function userDepartment_(user) {
  return String(getUserField_(user, ['Khoa/Phòng', 'Khoa/Phong', 'Khoa/ Phòng', 'Khoa', 'Department', 'department', 'Nơi công tác', 'Noi cong tac']) || '').trim();
}

function userStatus_(user) {
  return String(getUserField_(user, ['Trạng thái', 'Trang thai', 'Status', 'status']) || 'active').trim().toLowerCase();
}

function appendObject_(sheetName, object) {
  const sheet = deviceSpreadsheet_().getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  sheet.appendRow(headers.map(header => object[header] === undefined ? '' : object[header]));
}

function updateRowByObject_(sheetName, rowIndex, object) {
  const sheet = deviceSpreadsheet_().getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const range = sheet.getRange(rowIndex, 1, 1, headers.length);
  const row = range.getValues()[0];
  headers.forEach((header, index) => {
    if (object[header] !== undefined) row[index] = object[header];
  });
  range.setValues([row]);
}

function rowObject_(sheetName, rowIndex) {
  const sheet = deviceSpreadsheet_().getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const row = sheet.getRange(rowIndex, 1, 1, headers.length).getDisplayValues()[0];
  return Object.fromEntries(headers.map((header, index) => [header, row[index] || '']));
}

function findDeviceRow_(deviceId) {
  const sheet = deviceSpreadsheet_().getSheetByName(SHEETS.devices);
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return -1;
  const headers = values[0];
  const idIndex = headers.indexOf('id');
  const serialIndex = headers.indexOf('Seri Máy');
  for (let i = 1; i < values.length; i += 1) {
    if (String(values[i][idIndex]) === String(deviceId) || String(values[i][serialIndex]) === String(deviceId)) {
      return i + 1;
    }
  }
  return -1;
}

function findTransferRow_(transferId) {
  const sheet = deviceSpreadsheet_().getSheetByName(SHEETS.transfers);
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return -1;
  const headers = values[0];
  const idIndex = headers.indexOf('TransferId');
  for (let i = 1; i < values.length; i += 1) {
    if (String(values[i][idIndex]) === String(transferId)) return i + 1;
  }
  return -1;
}

function findUser_(username) {
  const normalized = normalize_(username);
  if (!normalized) return null;
  return getUserRows_().find(user => normalize_(userUsername_(user)) === normalized) || null;
}

function isAdmin_(user) {
  return normalize_(getUserField_(user, ['Quyền hạn', 'Quyền', 'Role', 'role'])) === 'admin';
}

function normalize_(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeHeader_(value) {
  return normalize_(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '');
}

function nextTransferId_() {
  return 'LC-' + Utilities.formatDate(new Date(), 'GMT+7', 'yyyyMMdd-HHmmss') + '-' + Math.floor(Math.random() * 900 + 100);
}

function emailsByDepartment_(department) {
  return getUserRows_()
    .filter(user => userStatus_(user) !== 'inactive')
    .filter(user => normalize_(userDepartment_(user)) === normalize_(department) || isAdmin_(user))
    .map(user => userEmail_(user))
    .filter(Boolean);
}

function sendTransferMail_(data) {
  try {
    const transfer = data.transfer || {};
    const device = data.device || {};
    const deviceId = transfer.DeviceId || device['Seri Máy'] || device.id || '';
    const deviceName = transfer.DeviceName || device['Tên Thiết bị'] || device.name || '';
    const fromDepartment = data.fromDepartment || transfer.FromDepartment || '';
    const toDepartment = data.toDepartment || transfer.ToDepartment || '';
    const actorName = data.actor ? userDisplayName_(data.actor) : '';
    const note = data.note || '';
    const transferId = data.transferId || transfer.TransferId || '';
    let subject = '';
    let recipients = [];

    if (data.type === 'request') {
      subject = '[QLTTB] 🔄 Yêu cầu nhận luân chuyển thiết bị ' + deviceId;
      recipients = emailsByDepartment_(toDepartment);
    } else if (data.type === 'received') {
      subject = '[QLTTB] ✅ Đã nhận luân chuyển thiết bị ' + deviceId;
      recipients = emailsByDepartment_(fromDepartment).concat(emailsByDepartment_(toDepartment));
    } else if (data.type === 'rejected') {
      subject = '[QLTTB] ❌ Từ chối nhận luân chuyển thiết bị ' + deviceId;
      recipients = emailsByDepartment_(fromDepartment);
    }

    // Bổ sung người chịu trách nhiệm quản lý thiết bị vào danh sách nhận email
    const fullDevice = findDeviceById_(deviceId);
    if (fullDevice) {
      const deviceRecipients = getDeviceRecipients_(fullDevice);
      recipients = recipients.concat(deviceRecipients);
    }

    recipients = Array.from(new Set(recipients));
    if (recipients.length === 0) return;

    const htmlBody = [
      '<h3 style="color:#1565c0;">Thông báo Luân chuyển Thiết bị Y tế</h3>',
      '<table style="border-collapse:collapse;width:100%;" border="1" cellpadding="8">',
      '<tr><td style="background:#f5f5f5;width:180px;"><strong>Mã yêu cầu</strong></td><td>' + transferId + '</td></tr>',
      '<tr><td style="background:#f5f5f5;"><strong>Thiết bị</strong></td><td>' + deviceName + ' (' + deviceId + ')</td></tr>',
      '<tr><td style="background:#f5f5f5;"><strong>Từ khoa/phòng</strong></td><td>' + fromDepartment + '</td></tr>',
      '<tr><td style="background:#f5f5f5;"><strong>Đến khoa/phòng</strong></td><td>' + toDepartment + '</td></tr>',
      '<tr><td style="background:#f5f5f5;"><strong>Người thực hiện</strong></td><td>' + actorName + '</td></tr>',
      note ? '<tr><td style="background:#f5f5f5;"><strong>Ghi chú/Lý do</strong></td><td>' + note + '</td></tr>' : '',
      '</table>',
      '<p style="margin-top:16px;">Vui lòng đăng nhập hệ thống <strong>Quản lý Trang thiết bị Y tế</strong> để xử lý.</p>'
    ].join('');

    MailApp.sendEmail({
      to: recipients.join(','),
      subject: subject,
      htmlBody: htmlBody
    });
  } catch (err) {
    console.error('sendTransferMail_ failed', err);
  }
}

function ensureSheet_(name, headers) {
  const ss = deviceSpreadsheet_();
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    return;
  }
  const existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), headers.length)).getValues()[0];
  headers.forEach((header, index) => {
    if (!existing[index]) sheet.getRange(1, index + 1).setValue(header);
  });
}

function deviceSpreadsheet_() {
  return SpreadsheetApp.openById(DEVICE_SPREADSHEET_ID);
}

function userSpreadsheet_() {
  return SpreadsheetApp.openById(USERS_SPREADSHEET_ID);
}

function userSheet_() {
  const ss = userSpreadsheet_();
  return sheetByGid_(ss, USERS_SHEET_GID) || ss.getSheetByName(SHEETS.users) || ss.getSheets()[0];
}

function sheetByGid_(spreadsheet, gid) {
  return spreadsheet.getSheets().find(sheet => sheet.getSheetId() === gid) || null;
}

function nextDeviceId_(offset) {
  const count = offset || Math.max(getRows_(SHEETS.devices).length + 1, 1);
  return 'TTB-2026-' + String(count).padStart(4, '0');
}

function json_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================
// HỆ THỐNG GỬI EMAIL THÔNG BÁO
// ============================

function findDeviceById_(deviceId) {
  const id = String(deviceId || '').trim();
  if (!id) return null;
  const devices = getRows_(SHEETS.devices);
  return devices.find(d => String(d.id || '').trim() === id || String(d['Seri Máy'] || '').trim() === id) || null;
}

function emailsByNames_(namesStr) {
  if (!namesStr) return [];
  const names = String(namesStr).split(/[,;\n]+/).map(n => n.trim().toLowerCase()).filter(Boolean);
  if (names.length === 0) return [];
  const users = getUserRows_().filter(u => userStatus_(u) !== 'inactive');
  const emails = [];
  names.forEach(name => {
    users.forEach(user => {
      const fullName = String(getUserField_(user, ['Họ và Tên', 'hoVaTen', 'name']) || '').trim().toLowerCase();
      if (fullName && fullName.indexOf(name) >= 0) {
        const email = userEmail_(user);
        if (email) emails.push(email);
      }
    });
  });
  return emails;
}

function getDeviceRecipients_(device) {
  const recipients = [];
  
  // 1. Admins
  const users = getUserRows_().filter(u => userStatus_(u) !== 'inactive');
  users.forEach(user => {
    if (isAdmin_(user)) {
      const email = userEmail_(user);
      if (email) recipients.push(email);
    }
  });
  
  // 2. Nhân sự khoa phòng nơi đặt thiết bị
  const dept = String(device['Nơi đặt thiết bị'] || '').trim();
  if (dept) {
    const deptEmails = emailsByDepartment_(dept);
    deptEmails.forEach(e => recipients.push(e));
  }
  
  // 3. Tìm email từ documents (Người chịu trách nhiệm, Phối hợp, Giao quản lý)
  const docs = getRows_(SHEETS.documents).filter(d => String(d.DeviceId || '').trim() === String(device.id || '').trim());
  docs.forEach(doc => {
    const responsible = String(doc['Người chịu trách nhiệm'] || '').trim();
    const collaborator = String(doc['Phối hợp thực hiện'] || '').trim();
    const deptManager = String(doc['Giao quản lý tại khoa'] || '').trim();
    
    emailsByNames_(responsible).forEach(e => recipients.push(e));
    emailsByNames_(collaborator).forEach(e => recipients.push(e));
    emailsByNames_(deptManager).forEach(e => recipients.push(e));
  });
  
  return Array.from(new Set(recipients.filter(Boolean)));
}

function sendNotificationMail_(options) {
  try {
    const recipients = (options.recipients || []).filter(Boolean);
    if (recipients.length === 0) return;
    
    const unique = Array.from(new Set(recipients));
    const htmlBody = [
      '<div style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;">',
      '<div style="background:#1565c0;color:#fff;padding:16px 24px;border-radius:8px 8px 0 0;">',
      '<h2 style="margin:0;font-size:18px;">🏥 Trung tâm Y tế Huyện Thanh Ba</h2>',
      '<p style="margin:4px 0 0;font-size:13px;opacity:0.9;">Hệ thống Quản lý Trang thiết bị Y tế</p>',
      '</div>',
      '<div style="padding:24px;border:1px solid #e0e0e0;border-top:none;border-radius:0 0 8px 8px;">',
      options.body || '',
      '</div>',
      '<p style="font-size:11px;color:#999;text-align:center;margin-top:12px;">',
      'Email tự động từ hệ thống QLTTB - Vui lòng không trả lời email này.',
      '</p>',
      '</div>'
    ].join('');
    
    MailApp.sendEmail({
      to: unique.join(','),
      subject: options.subject || '[QLTTB] Thông báo',
      htmlBody: htmlBody
    });
  } catch (err) {
    console.error('sendNotificationMail_ failed', err);
  }
}

// ============================
// QUÉT CẢNH BÁO ĐĂNG KIỂM HÀNG NGÀY
// ============================

function checkComplianceDeadlines() {
  const documents = getRows_(SHEETS.documents);
  const devices = getRows_(SHEETS.devices);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  
  const deviceMap = {};
  devices.forEach(d => { deviceMap[String(d.id || '').trim()] = d; });
  
  const alertGroups = {}; // key = deviceId, value = { device, alerts: [] }
  
  documents.forEach(doc => {
    const expDateStr = String(doc['Hạn đăng kiểm / Hạn hiệu lực'] || '').trim();
    if (!expDateStr || expDateStr === 'N/A') return;
    
    const expDate = parseDate_(expDateStr);
    if (isNaN(expDate.getTime())) return;
    
    const expMs = expDate.getTime();
    const daysLeft = Math.ceil((expMs - todayMs) / (24 * 60 * 60 * 1000));
    const prepDays = parseInt(doc['Thời gian chuẩn bị hồ sơ (ngày)'] || '45', 10) || 45;
    
    let alertLevel = null;
    let alertColor = '';
    let alertIcon = '';
    
    if (daysLeft < 0) {
      alertLevel = 'QUÁ HẠN (' + Math.abs(daysLeft) + ' ngày)';
      alertColor = '#b71c1c';
      alertIcon = '🚨';
    } else if (daysLeft <= 1) {
      alertLevel = 'KHẨN CẤP - Còn ' + daysLeft + ' ngày';
      alertColor = '#d32f2f';
      alertIcon = '🔴';
    } else if (daysLeft <= 3) {
      alertLevel = 'RẤT GẤP - Còn ' + daysLeft + ' ngày';
      alertColor = '#e65100';
      alertIcon = '🟠';
    } else if (daysLeft <= 7) {
      alertLevel = 'GẤP - Còn ' + daysLeft + ' ngày';
      alertColor = '#ef6c00';
      alertIcon = '🟡';
    } else if (daysLeft <= 15) {
      alertLevel = 'Cảnh báo - Còn ' + daysLeft + ' ngày';
      alertColor = '#f9a825';
      alertIcon = '⚠️';
    } else if (daysLeft <= 30) {
      alertLevel = 'Nhắc nhở - Còn ' + daysLeft + ' ngày';
      alertColor = '#1565c0';
      alertIcon = '📋';
    } else if (daysLeft <= prepDays) {
      alertLevel = 'Chuẩn bị hồ sơ - Còn ' + daysLeft + ' ngày (Hạn nộp trước ' + prepDays + ' ngày)';
      alertColor = '#1565c0';
      alertIcon = '📝';
    } else {
      return; // Chưa đến hạn cảnh báo
    }
    
    const devId = String(doc.DeviceId || '').trim();
    if (!alertGroups[devId]) {
      alertGroups[devId] = { device: deviceMap[devId] || { id: devId }, alerts: [] };
    }
    alertGroups[devId].alerts.push({
      doc: doc,
      daysLeft: daysLeft,
      alertLevel: alertLevel,
      alertColor: alertColor,
      alertIcon: alertIcon
    });
  });
  
  const groupKeys = Object.keys(alertGroups);
  if (groupKeys.length === 0) {
    console.log('checkComplianceDeadlines: Không có tài liệu nào sắp đến hạn.');
    return;
  }
  
  groupKeys.forEach(devId => {
    const group = alertGroups[devId];
    const device = group.device;
    const alerts = group.alerts;
    
    const recipients = getDeviceRecipients_(device);
    if (recipients.length === 0) return;
    
    const tableRows = alerts.map(a => {
      return '<tr>' +
        '<td style="padding:8px;border:1px solid #ddd;">' + a.alertIcon + ' ' + (a.doc['Loại tài liệu'] || '') + '</td>' +
        '<td style="padding:8px;border:1px solid #ddd;">' + (a.doc['Số văn bản / Số Đăng kiểm'] || '') + '</td>' +
        '<td style="padding:8px;border:1px solid #ddd;">' + (a.doc['Hạn đăng kiểm / Hạn hiệu lực'] || '') + '</td>' +
        '<td style="padding:8px;border:1px solid #ddd;font-weight:bold;color:' + a.alertColor + ';">' + a.alertLevel + '</td>' +
        '<td style="padding:8px;border:1px solid #ddd;">' + (a.doc['Trạng thái Hồ sơ'] || 'Chưa gửi') + '</td>' +
        '<td style="padding:8px;border:1px solid #ddd;">' + (a.doc['Người chịu trách nhiệm'] || '') + '</td>' +
        '</tr>';
    }).join('');
    
    const mostUrgent = alerts.reduce((min, a) => a.daysLeft < min.daysLeft ? a : min, alerts[0]);
    
    sendNotificationMail_({
      recipients: recipients,
      subject: '[QLTTB] ' + mostUrgent.alertIcon + ' Cảnh báo đăng kiểm: ' + (device['Tên Thiết bị'] || devId),
      body: [
        '<h3 style="color:' + mostUrgent.alertColor + ';">Cảnh báo Hạn Đăng kiểm / Kiểm định Thiết bị Y tế</h3>',
        '<table style="border-collapse:collapse;width:100%;margin-bottom:16px;" border="1" cellpadding="8">',
        '<tr><td style="background:#f5f5f5;width:180px;"><strong>Mã thiết bị</strong></td><td>' + devId + '</td></tr>',
        '<tr><td style="background:#f5f5f5;"><strong>Tên thiết bị</strong></td><td>' + (device['Tên Thiết bị'] || '') + '</td></tr>',
        '<tr><td style="background:#f5f5f5;"><strong>Model / Seri</strong></td><td>' + (device.Model || '') + ' / ' + (device['Seri Máy'] || '') + '</td></tr>',
        '<tr><td style="background:#f5f5f5;"><strong>Nơi đặt</strong></td><td>' + (device['Nơi đặt thiết bị'] || '') + '</td></tr>',
        '</table>',
        '<h4>Chi tiết tài liệu cần xử lý:</h4>',
        '<table style="border-collapse:collapse;width:100%;" border="1">',
        '<thead><tr style="background:#1565c0;color:#fff;">',
        '<th style="padding:8px;">Loại tài liệu</th>',
        '<th style="padding:8px;">Số văn bản</th>',
        '<th style="padding:8px;">Hạn hiệu lực</th>',
        '<th style="padding:8px;">Trạng thái</th>',
        '<th style="padding:8px;">Hồ sơ</th>',
        '<th style="padding:8px;">Người chịu TN</th>',
        '</tr></thead>',
        '<tbody>',
        tableRows,
        '</tbody></table>',
        '<p style="margin-top:16px;">Vui lòng đăng nhập hệ thống <strong>Quản lý Trang thiết bị Y tế</strong> để cập nhật hồ sơ và xử lý kịp thời.</p>'
      ].join('')
    });
  });
  
  console.log('checkComplianceDeadlines: Đã gửi cảnh báo cho ' + groupKeys.length + ' thiết bị.');
}

function createDailyTrigger() {
  // Xóa trigger cũ nếu có
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkComplianceDeadlines') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Tạo trigger mới chạy hàng ngày lúc 7:00 sáng
  ScriptApp.newTrigger('checkComplianceDeadlines')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();
  
  console.log('Đã tạo trigger hàng ngày cho checkComplianceDeadlines lúc 7:00 AM.');
  return { success: true, message: 'Đã tạo trigger quét đăng kiểm hàng ngày lúc 7:00 sáng.' };
}

function findUserRowIndex_(username) {
  const sheet = userSheet_();
  if (!sheet) return -1;
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return -1;
  const headers = values[0];
  
  const keys = ['Tên đăng nhập', 'Ten dang nhap', 'Username', 'Tài khoản', 'Tai khoan', 'username'];
  let usernameIndex = -1;
  for (let i = 0; i < headers.length; i++) {
    const normHeader = normalizeHeader_(headers[i]);
    if (keys.some(k => normalizeHeader_(k) === normHeader)) {
      usernameIndex = i;
      break;
    }
  }
  if (usernameIndex === -1) return -1;
  
  const normalized = normalize_(username);
  for (let i = 1; i < values.length; i++) {
    if (normalize_(values[i][usernameIndex]) === normalized) {
      return i + 1;
    }
  }
  return -1;
}

function updateUserRowByObject_(rowIndex, object) {
  const sheet = userSheet_();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const range = sheet.getRange(rowIndex, 1, 1, headers.length);
  const row = range.getValues()[0];
  headers.forEach((header, index) => {
    const normHeader = normalizeHeader_(header);
    const objKeys = Object.keys(object);
    const matchingKey = objKeys.find(k => normalizeHeader_(k) === normHeader);
    if (matchingKey !== undefined && object[matchingKey] !== undefined) {
      row[index] = object[matchingKey];
    }
  });
  range.setValues([row]);
}

function editUser_(payload) {
  const actor = requireAuthenticated_(payload);
  if (!actor) return authError_();
  
  const targetUsername = String(payload.username || userUsername_(actor)).trim();
  const isEditingSelf = normalize_(userUsername_(actor)) === normalize_(targetUsername);
  
  if (!isEditingSelf && !isAdmin_(actor)) {
    return { success: false, message: 'Bạn không có quyền chỉnh sửa thông tin của người dùng này.' };
  }
  
  const rowIndex = findUserRowIndex_(targetUsername);
  if (rowIndex < 2) {
    return { success: false, message: 'Không tìm thấy tài khoản người dùng cần chỉnh sửa.' };
  }
  
  // PIN update verification
  const newPin = String(payload.newPin || payload.pin || '').trim();
  if (newPin !== '') {
    if (isEditingSelf) {
      const currentPinInput = String(payload.currentPin || '').trim();
      const targetUser = findUser_(targetUsername);
      if (!targetUser) {
        return { success: false, message: 'Không tìm thấy tài khoản người dùng.' };
      }
      const actualPin = String(getUserField_(targetUser, ['Mã PIN', 'Ma PIN', 'PIN', 'pin', 'Mật khẩu', 'Mat khau', 'Password', 'password', 'Mã pin', 'MÃ PIN']) || '').trim();
      if (actualPin !== currentPinInput) {
        return { success: false, message: 'Mã PIN hiện tại không chính xác.' };
      }
    }
  }
  
  const updateData = {};
  const setIfDefined = (targetKey, sourceKeys) => {
    for (let k of sourceKeys) {
      if (payload[k] !== undefined) {
        updateData[targetKey] = String(payload[k]).trim();
        break;
      }
    }
  };

  setIfDefined('Họ và Tên', ['fullName', 'Họ và Tên', 'Họ và tên', 'name']);
  setIfDefined('Email', ['email', 'Email']);
  setIfDefined('Khoa/Phòng', ['department', 'Khoa/Phòng', 'Khoa/Phong']);
  
  if (newPin !== '') {
    updateData['Mã PIN'] = newPin;
  }
  
  if (isAdmin_(actor)) {
    setIfDefined('Quyền hạn', ['role', 'Quyền hạn', 'Quyen han']);
    setIfDefined('Trạng thái', ['status', 'Trạng thái', 'Trang thai']);
  }
  
  updateUserRowByObject_(rowIndex, updateData);
  
  // Return the updated user object (without sensitive fields)
  const updatedUser = findUser_(targetUsername);
  if (updatedUser) {
    const safeUser = { ...updatedUser };
    ['Mã PIN', 'Ma PIN', 'PIN', 'pin', 'Mật khẩu', 'Mat khau', 'Password', 'password', 'Mã pin', 'MÃ PIN'].forEach(k => delete safeUser[k]);
    return { success: true, message: 'Cập nhật thông tin người dùng thành công.', user: safeUser };
  }
  
  return { success: true, message: 'Cập nhật thông tin người dùng thành công.' };
}
