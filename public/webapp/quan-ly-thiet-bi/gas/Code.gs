const SHEETS = {
  devices: 'Devices',
  users: 'Users',
  repairs: 'Repairs',
  transfers: 'Transfers',
  gsp: 'GSP',
  legacy: 'Trang thiết bị 2026'
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
  'Số đăng kiểm',
  'Ngày cấp/ Ngày Đăng kiểm',
  'Hạn đăng kiểm',
  'Hãng SX',
  'Nước SX',
  'Năm SX',
  'Năm SD',
  'Giá',
  'Nguồn',
  'Phân loại',
  'Công ty cung ứng',
  'Ghi chú',
  'Ngày tạo',
  'Ngày cập nhật'
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

function doGet(e) {
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
  switch (action) {
    case 'getDevices':
      return getRows_(SHEETS.devices);
    case 'getUsers':
      return getUserRows_()
        .filter(row => String(row['Trạng thái'] || 'active').toLowerCase() !== 'inactive')
        .map(row => {
           const safeRow = { ...row };
           delete safeRow['Mã PIN']; // BẢO MẬT: Không trả về mã PIN
           delete safeRow['Mật khẩu']; // Tương thích dữ liệu cũ, nếu còn
           return safeRow;
        });
    case 'login':
      return login_(payload);
    case 'getRepairs':
      return getRows_(SHEETS.repairs);
    case 'getTransfers':
      return getRows_(SHEETS.transfers);
    case 'getDepartments':
      return getDepartments_();
    case 'addDevice':
      return addDevice_(payload);
    case 'editDevice':
      return editDevice_(payload);
    case 'reportRepair':
      return reportRepair_(payload);
    case 'approveRepair':
      return approveRepair_(payload);
    case 'updateDocStatus':
      return updateDocStatus_(payload);
    case 'createTransfer':
      return createTransfer_(payload);
    case 'receiveTransfer':
      return receiveTransfer_(payload);
    case 'rejectTransfer':
      return rejectTransfer_(payload);
    case 'cancelTransfer':
      return cancelTransfer_(payload);
    case 'transferDevice':
      return createTransfer_(payload);
    case 'addGSP':
      return addGSP_(payload);
    case 'getGSP':
      return getRows_(SHEETS.gsp);
    case 'migrateLegacyDevices':
      return migrateLegacyDevices_();
    default:
      return { success: false, message: 'Action không hợp lệ: ' + action };
  }
}

function login_(payload) {
  const users = getUserRows_();
  const username = String(payload.username || '').trim();
  const pin = String(payload.pin || payload.password || '').trim();
  
  const user = users.find(u => {
    const account = getUserField_(u, ['Tên đăng nhập', 'Ten dang nhap', 'Username', 'Tài khoản', 'Tai khoan']);
    const email = getUserField_(u, ['Email']);
    const userPin = getUserField_(u, ['Mã PIN', 'Ma PIN', 'PIN', 'Mật khẩu', 'Mat khau']);
    return (normalize_(account) === normalize_(username) || normalize_(email) === normalize_(username)) && String(userPin).trim() === pin;
  });
  
  if (user) {
    if (String(user['Trạng thái']).toLowerCase() === 'inactive') {
      return { success: false, message: 'Tài khoản đã bị khóa.' };
    }
    const safeUser = { ...user };
    delete safeUser['Mã PIN'];
    delete safeUser['Mật khẩu'];
    return { success: true, user: safeUser };
  }
  return { success: false, message: 'Tên đăng nhập hoặc mã PIN không chính xác.' };
}

function setupSheets() {
  ensureSheet_(SHEETS.devices, DEVICE_HEADERS);
  ensureSheet_(SHEETS.repairs, REPAIR_HEADERS);
  ensureSheet_(SHEETS.transfers, TRANSFER_HEADERS);
  ensureSheet_(SHEETS.gsp, GSP_HEADERS);
}

function migrateLegacyDevices() {
  return migrateLegacyDevices_();
}

function migrateLegacyDevices_() {
  const ss = deviceSpreadsheet_();
  const sheet = sheetByGid_(ss, LEGACY_DEVICE_SHEET_GID) || ss.getSheetByName(SHEETS.legacy) || ss.getSheets()[0];
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 5) return { success: false, message: 'Không tìm thấy dữ liệu Excel nguồn.' };

  const current = getRows_(SHEETS.devices);
  if (current.length > 0) return { success: false, message: 'Sheet Devices đã có dữ liệu. Xóa dữ liệu nếu muốn import lại.' };

  let department = '';
  let imported = 0;
  const statusMap = {
    18: '1 - Mới chưa sử dụng',
    19: '2 - Mới mang ra sử dụng',
    20: '3 - Sửa chữa nhỏ',
    21: '4 - Sửa chữa lớn',
    22: '5 - Hỏng'
  };

  values.slice(5).forEach(row => {
    const stt = String(row[0] || '').trim();
    const name = String(row[1] || '').trim();
    if (stt && !/^\d+(\.\d+)?$/.test(stt)) {
      department = stt;
      return;
    }
    if (!/^\d+(\.\d+)?$/.test(stt) || !name) return;

    let classify = '';
    Object.keys(statusMap).forEach(idx => {
      if (String(row[Number(idx)] || '').trim()) classify = statusMap[idx];
    });

    appendObject_(SHEETS.devices, {
      id: nextDeviceId_(imported + 1),
      'Tên Thiết bị': name,
      'Đơn vị tính': row[2],
      'Số lượng': row[3] || 1,
      'Model': row[4],
      'Seri Máy': row[5] || nextDeviceId_(imported + 1),
      'Nơi đặt thiết bị': department || row[23] || 'Chưa phân bổ',
      'Hiện trạng thực tế': row[6],
      'Số đăng kiểm': row[7],
      'Ngày cấp/ Ngày Đăng kiểm': row[8],
      'Hạn đăng kiểm': row[9],
      'Hãng SX': row[10],
      'Nước SX': row[11],
      'Năm SX': row[12],
      'Năm SD': row[13],
      'Giá': row[14],
      'Nguồn': row[15],
      'Phân loại': classify,
      'Công ty cung ứng': row[23],
      'Ghi chú': row[24],
      'Ngày tạo': new Date(),
      'Ngày cập nhật': new Date()
    });
    imported += 1;
  });

  return { success: true, message: 'Đã import ' + imported + ' thiết bị từ sheet nguồn.' };
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
  if (!isAdmin_(actor) && normalize_(actor['Khoa/Phòng']) !== normalize_(fromDepartment)) {
    return { success: false, message: 'Chỉ tài khoản thuộc khoa đang giữ thiết bị mới được tạo yêu cầu chuyển.' };
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
    RequestedBy: actor['Tên đăng nhập'] || '',
    RequestedByName: actor['Họ và Tên'] || '',
    RequestedByEmail: actor.Email || actor['Email'] || '',
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
  if (!isAdmin_(actor) && normalize_(actor['Khoa/Phòng']) !== normalize_(transfer.ToDepartment)) {
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
    ReceivedBy: actor['Tên đăng nhập'] || '',
    ReceivedByName: actor['Họ và Tên'] || '',
    ReceivedByEmail: actor.Email || actor['Email'] || '',
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
  if (!isAdmin_(actor) && normalize_(actor['Khoa/Phòng']) !== normalize_(transfer.ToDepartment)) {
    return { success: false, message: 'Chỉ tài khoản thuộc khoa nhận mới được từ chối yêu cầu.' };
  }

  const now = new Date();
  updateRowByObject_(SHEETS.transfers, rowIndex, {
    Status: 'REJECTED',
    RejectedBy: actor['Tên đăng nhập'] || '',
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
  if (!isAdmin_(actor) && String(actor['Tên đăng nhập']) !== String(transfer.RequestedBy)) {
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
  appendObject_(SHEETS.repairs, {
    'Thời gian': new Date(),
    'Mã Máy/Thiết bị': payload.deviceId || payload.serial || '',
    'Người báo lỗi': payload.userName || payload.name || '',
    'Email người báo': payload.userEmail || payload.email || '',
    'Mô tả lỗi': payload.description || '',
    'Trạng Thái': 'Chờ duyệt'
  });
  return { success: true, message: 'Đã ghi nhận báo hỏng.' };
}

function approveRepair_(payload) {
  const rows = getRows_(SHEETS.repairs);
  const idx = rows.findIndex(row => String(row['Thời gian']) === String(payload.rowId));
  if (idx < 0) return { success: false, message: 'Không tìm thấy phiếu sửa chữa.' };
  updateRowByObject_(SHEETS.repairs, idx + 2, {
    'Trạng Thái': payload.status || 'Đã duyệt',
    'Người duyệt': payload.approver || '',
    'Ghi chú xử lý': payload.note || ''
  });
  return { success: true, message: 'Đã cập nhật phiếu sửa chữa.' };
}

function updateDocStatus_(payload) {
  const rowIndex = findDeviceRow_(payload.serial);
  if (rowIndex < 2) return { success: false, message: 'Không tìm thấy thiết bị.' };
  updateRowByObject_(SHEETS.devices, rowIndex, {
    'Hiện trạng thực tế': payload.status,
    'Ngày cập nhật': new Date()
  });
  return { success: true, message: 'Đã cập nhật trạng thái hồ sơ.' };
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
  return getUserRows_().find(user => normalize_(user['Tên đăng nhập']) === normalized) || null;
}

function isAdmin_(user) {
  return normalize_(user['Quyền hạn']) === 'admin';
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
    .filter(user => String(user['Trạng thái'] || 'active').toLowerCase() !== 'inactive')
    .filter(user => normalize_(user['Khoa/Phòng']) === normalize_(department) || isAdmin_(user))
    .map(user => user.Email || user['Email'])
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
    const actorName = data.actor ? (data.actor['Họ và Tên'] || data.actor['Tên đăng nhập']) : '';
    const note = data.note || '';
    const transferId = data.transferId || transfer.TransferId || '';
    let subject = '';
    let recipients = [];

    if (data.type === 'request') {
      subject = '[QLTTB] Yêu cầu nhận luân chuyển thiết bị ' + deviceId;
      recipients = emailsByDepartment_(toDepartment);
    } else if (data.type === 'received') {
      subject = '[QLTTB] Đã nhận luân chuyển thiết bị ' + deviceId;
      recipients = emailsByDepartment_(fromDepartment).concat(emailsByDepartment_(toDepartment));
    } else if (data.type === 'rejected') {
      subject = '[QLTTB] Từ chối nhận luân chuyển thiết bị ' + deviceId;
      recipients = emailsByDepartment_(fromDepartment);
    }

    recipients = Array.from(new Set(recipients));
    if (recipients.length === 0) return;

    const htmlBody = [
      '<p><strong>Mã yêu cầu:</strong> ' + transferId + '</p>',
      '<p><strong>Thiết bị:</strong> ' + deviceName + ' (' + deviceId + ')</p>',
      '<p><strong>Từ khoa/phòng:</strong> ' + fromDepartment + '</p>',
      '<p><strong>Đến khoa/phòng:</strong> ' + toDepartment + '</p>',
      '<p><strong>Người thực hiện:</strong> ' + actorName + '</p>',
      note ? '<p><strong>Ghi chú/Lý do:</strong> ' + note + '</p>' : '',
      '<p>Vui lòng đăng nhập hệ thống Quản lý trang thiết bị để xử lý.</p>'
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
