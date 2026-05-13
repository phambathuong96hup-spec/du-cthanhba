var SHEET_DATA = 'Tasks';
var SHEET_COMPLIANCE = 'Compliance';
var SHEET_STAFF = 'Users';
var SHEET_LOGS = 'SystemLogs';

var SPREADSHEET_ID = '10yRv_RD5ersJzD9xd-UDkZ8-hoiHxRBW6bz71qtMqoQ';
var API_KEY = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");

function getSS() {
  return SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
}

function doGet(e) {
  try {
    var params = e.parameter;
    if (params.action == 'read_compliance') return readSheetData(SHEET_COMPLIANCE);
    return readSheetData(SHEET_DATA);
  } catch (err) {
    logSystem("ERROR", "doGet Failed: " + err.toString());
    return responseJSON({ status: 'error', message: 'Lỗi hệ thống' });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();

  if (!lock.tryLock(30000)) {
    return responseJSON({ status: 'error', message: 'Hệ thống đang bận xử lý, vui lòng thử lại sau vài giây!' });
  }

  try {
    var ss = getSS();
    var postData = JSON.parse(e.postData.contents);
    var action = e.parameter.action;

    if (action == 'ask_ai') {
      return handleAIRequest(postData.question, postData.history || "", ss);
    }

    if (action == 'login') {
      var staffData = ss.getSheetByName(SHEET_STAFF).getDataRange().getValues();
      for (var i = 1; i < staffData.length; i++) {
        if (String(staffData[i][0]).toLowerCase() == String(postData.username).toLowerCase() &&
          String(staffData[i][1]) == String(postData.pin)) {
          var sessionToken = Utilities.getUuid();
          CacheService.getScriptCache().put("session_" + sessionToken, JSON.stringify({
            username: staffData[i][0], name: staffData[i][2], role: staffData[i][3]
          }), 21600);
          return responseJSON({
            status: 'success', username: staffData[i][0], name: staffData[i][2], role: staffData[i][3], token: sessionToken
          });
        }
      }
      return responseJSON({ status: 'error', message: 'Sai thông tin đăng nhập!' });
    }

    if (action == 'change_pin') {
      var sheet = ss.getSheetByName(SHEET_STAFF);
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).toLowerCase() == String(postData.username).toLowerCase() &&
          String(data[i][1]) == String(postData.oldPin)) {
          sheet.getRange(i + 1, 2).setValue(postData.newPin);
          logSystem("INFO", "User " + postData.username + " đổi PIN thành công.");
          return responseJSON({ status: 'success', message: 'Đổi PIN thành công!' });
        }
      }
      return responseJSON({ status: 'error', message: 'PIN cũ không đúng!' });
    }

    // ======================================================
    // ACTION: ADD - Tạo công việc mới + Thông báo Calendar
    // ======================================================
    if (action == 'add') {
      if (!isAdminRequest_(ss, postData)) return responseJSON({ status: 'error', message: 'Không có quyền!' });

      // Hỗ trợ cả 2 tên field: type và taskType
      var taskType = postData.type || postData.taskType || '';

      ss.getSheetByName(SHEET_DATA).appendRow([
        Utilities.getUuid().slice(0, 8),  // [0] ID
        postData.taskName,                // [1] Tên
        'Todo',                           // [2] Trạng thái
        postData.priority || '',          // [3] Ưu tiên
        postData.deadline,                // [4] Deadline
        postData.notes,                   // [5] Ghi chú
        new Date(),                       // [6] Ngày tạo
        postData.assignee,                // [7] Người thực hiện
        "'0%",                            // [8] Tiến độ
        "",                               // [9] Deadline 2
        taskType,                         // [10] Loại
        postData.group,                   // [11] Tổ
        postData.difficulty,              // [12] Độ khó
        ""                                // [13] File
      ]);

      // --- Gửi thông báo: Email trực tiếp + Calendar event tại deadline ---
      try {
        var teamEmails = getEmailMap(ss);
        var assignees = String(postData.assignee || '').split(',');
        var deadlineVal = parseValidDate_(postData.deadline);
        var deadlineText = deadlineVal
          ? Utilities.formatDate(deadlineVal, "GMT+7", "dd/MM/yyyy")
          : "Chưa có";

        var appUrl = "https://phambathuong96hup-spec.github.io/du-cthanhba/webapp/quan-ly-cong-viec/";
        var emailSubject = "🚨 [VIỆC MỚI] " + postData.taskName;
        var safeTaskName = escapeHtml_(postData.taskName || '');
        var safeGroup = escapeHtml_(postData.group || '');
        var safeNotes = escapeHtml_(postData.notes || '');
        var safeAssignee = escapeHtml_(postData.assignee || '');
        var emailBody =
          "<div style='font-family:Arial,sans-serif;max-width:600px'>" +
          "<h2 style='color:#e74c3c'>🚨 Bạn được giao việc mới!</h2>" +
          "<table style='border-collapse:collapse;width:100%'>" +
          "<tr><td style='padding:8px;font-weight:bold;width:130px'>📋 Tên công việc:</td><td style='padding:8px'>" + safeTaskName + "</td></tr>" +
          "<tr style='background:#f9f9f9'><td style='padding:8px;font-weight:bold'>📂 Tổ:</td><td style='padding:8px'>" + safeGroup + "</td></tr>" +
          "<tr><td style='padding:8px;font-weight:bold'>⏰ Deadline:</td><td style='padding:8px;color:#e74c3c'><b>" + escapeHtml_(deadlineText) + "</b></td></tr>" +
          "<tr style='background:#f9f9f9'><td style='padding:8px;font-weight:bold'>📝 Ghi chú:</td><td style='padding:8px'>" + safeNotes + "</td></tr>" +
          "<tr><td style='padding:8px;font-weight:bold'>👥 Người thực hiện:</td><td style='padding:8px'>" + safeAssignee + "</td></tr>" +
          "</table>" +
          "<br><a href='" + appUrl + "' style='background:#3498db;color:white;padding:10px 20px;text-decoration:none;border-radius:5px'>🔗 Mở bảng quản lý</a>" +
          "</div>";

        var guestsList = [];
        assignees.forEach(function (name) {
          var email = teamEmails[name.trim()];
          if (email) {
            // Gửi email trực tiếp ngay lập tức (đáng tin cậy nhất)
            try {
              MailApp.sendEmail({ to: email, subject: emailSubject, htmlBody: emailBody });
            } catch (mailErr) {
              logSystem("WARN", "Mail to " + email + " failed: " + mailErr.toString());
            }
            guestsList.push(email);
          }
        });


        // === SỰ KIỆN 1: Thông báo NGAY LẬP TỨC trên điện thoại ===
        if (guestsList.length > 0) {
          var calendar = CalendarApp.getDefaultCalendar();
          var now = new Date();
          var nowEnd = new Date(now.getTime() + 15 * 60000); // 15 phút
          var calDesc = "Công việc: " + postData.taskName + "\nDeadline: " + deadlineText + "\nGhi chú: " + (postData.notes || '') + "\n\n" + appUrl;

          var immediateEvent = calendar.createEvent(
            "🚨 [VIỆC MỚI] " + postData.taskName, now, nowEnd, {
            description: calDesc,
            guests: guestsList.join(','),
            sendInvites: true
          });
          immediateEvent.addPopupReminder(0); // Popup NGAY trên điện thoại

          // === SỰ KIỆN 2: Nhắc deadline (nếu có) ===
          if (deadlineVal) {
            var eventStart = new Date(deadlineVal);
            eventStart.setHours(8, 0, 0, 0); // 8:00 sáng ngày deadline
            var eventEnd = new Date(eventStart.getTime() + 60 * 60000);
            var dlEvent = calendar.createEvent(
              "⏰ [DEADLINE] " + postData.taskName, eventStart, eventEnd, {
              description: calDesc,
              guests: guestsList.join(','),
              sendInvites: false  // Đã gửi invite ở event 1 rồi
            });
            dlEvent.addEmailReminder(1440); // Email nhắc 1 ngày trước
            dlEvent.addPopupReminder(60);   // Popup 1 giờ trước deadline
          }
        }
      } catch (calErr) {
        logSystem("WARN", "Notify failed: " + calErr.toString());
      }

      logSystem("INFO", "Admin giao việc: " + postData.taskName + " cho " + postData.assignee);
      return responseJSON({ status: 'success', message: 'Giao việc thành công!' });
    }

    if (action == 'edit_task') {
      if (!isAdminRequest_(ss, postData)) return responseJSON({ status: 'error', message: 'Không có quyền!' });
      var sheet = ss.getSheetByName(SHEET_DATA);
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) == postData.id) {
          sheet.getRange(i + 1, 2).setValue(postData.taskName);
          sheet.getRange(i + 1, 5).setValue(postData.deadline);
          sheet.getRange(i + 1, 6).setValue(postData.notes);
          sheet.getRange(i + 1, 8).setValue(postData.assignee);
          sheet.getRange(i + 1, 11).setValue(postData.type || postData.taskType || data[i][10]);
          sheet.getRange(i + 1, 12).setValue(postData.group || data[i][11]);
          sheet.getRange(i + 1, 13).setValue(postData.difficulty);
          logSystem("INFO", "Admin cập nhật công việc ID: " + postData.id);
          return responseJSON({ status: 'success', message: 'Đã cập nhật thông tin công việc!' });
        }
      }
      return responseJSON({ status: 'error', message: 'Không tìm thấy ID công việc' });
    }

    if (action == 'delete_task') {
      if (!isAdminRequest_(ss, postData)) return responseJSON({ status: 'error', message: 'Không có quyền!' });
      var sheet = ss.getSheetByName(SHEET_DATA);
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) == postData.id) {
          var taskName = data[i][1];
          sheet.deleteRow(i + 1);
          logSystem("INFO", 'Admin đã xóa công việc: ' + taskName + ' (ID: ' + postData.id + ')');
          return responseJSON({ status: 'success', message: 'Đã xóa công việc "' + taskName + '" thành công!' });
        }
      }
      return responseJSON({ status: 'error', message: 'Không tìm thấy ID công việc' });
    }

    if (action == 'update_progress') {
      var sheet = ss.getSheetByName(SHEET_DATA);
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) == postData.id) {
          if (!isAdminRequest_(ss, postData) && (!isUserIdentityRequest_(postData) || !isAssignedTo_(data[i][7], postData.user_fullname))) {
            return responseJSON({ status: 'error', message: 'Không phải việc của bạn!' });
          }
          var progressValue = Math.max(0, Math.min(100, Number(postData.progress)));
          if (isNaN(progressValue)) return responseJSON({ status: 'error', message: 'Tiến độ không hợp lệ!' });
          sheet.getRange(i + 1, 9).setValue("'" + progressValue + "%");
          var currentStatus = data[i][2];
          if (currentStatus !== 'Waiting') {
            if (isAdminRequest_(ss, postData)) {
              // Admin: set trạng thái trực tiếp
              var newStatus = progressValue == 100 ? "Done" : (progressValue > 0 ? "Doing" : "Todo");
              sheet.getRange(i + 1, 3).setValue(newStatus);
            } else if (progressValue < 100) {
              // User: chỉ đổi Todo/Doing. Progress 100% phải qua report_done
              sheet.getRange(i + 1, 3).setValue(progressValue > 0 ? "Doing" : "Todo");
            }
            // User set 100% -> chỉ cập nhật số %, không đổi status (phải submit report)
          }
          return responseJSON({ status: 'success', message: 'Đã cập nhật tiến độ!' });
        }
      }
      return responseJSON({ status: 'error', message: 'Không tìm thấy Task ID' });
    }

    if (action == 'report_done') {
      var sheet = ss.getSheetByName(SHEET_DATA);
      var data = sheet.getDataRange().getValues();
      var uploadedLinks = [];
      var reportRowIndex = -1;

      for (var reportIdx = 1; reportIdx < data.length; reportIdx++) {
        if (String(data[reportIdx][0]) == postData.id) {
          reportRowIndex = reportIdx;
          break;
        }
      }

      if (reportRowIndex < 1) return responseJSON({ status: 'error', message: 'Không tìm thấy ID công việc.' });
      if (!isUserIdentityRequest_(postData) || !isAssignedTo_(data[reportRowIndex][7], postData.user_fullname)) {
        return responseJSON({ status: 'error', message: 'Không phải việc của bạn!' });
      }

      if (postData.files && postData.files.length > 0) {
        try {
          var folderName = "MinhChung_KhoaDuoc";
          var folders = DriveApp.getFoldersByName(folderName);
          var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

          postData.files.forEach(function (fileObj) {
            var encodedData = fileObj.fileData.includes(',') ? fileObj.fileData.split(',')[1] : fileObj.fileData;
            var decoded = Utilities.base64Decode(encodedData);
            var blob = Utilities.newBlob(decoded, fileObj.mimeType || "application/octet-stream", fileObj.fileName);
            var file = folder.createFile(blob);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            uploadedLinks.push(file.getUrl());
          });
        } catch (e) {
          logSystem("ERROR", "Upload Multi-File Failed: " + e.toString());
          return responseJSON({ status: 'error', message: 'Lỗi lưu file: ' + e.toString() });
        }
      }

      var finalLinkString = uploadedLinks.join("\n");

      for (var i = reportRowIndex; i <= reportRowIndex; i++) {
        if (String(data[i][0]) == postData.id) {
          sheet.getRange(i + 1, 3).setValue("Waiting");
          sheet.getRange(i + 1, 9).setValue("'100%");
          if (finalLinkString) sheet.getRange(i + 1, 14).setValue(finalLinkString);

          var emailLinks = uploadedLinks.map(function (url, idx) {
            return '<a href="' + url + '">Xem tài liệu ' + (idx + 1) + '</a>';
          }).join(" | ");
          var adminEmails = getAdminEmails(ss);

          if (adminEmails) {
            try {
              MailApp.sendEmail({
                to: adminEmails,
                subject: "🔔 [BÁO CÁO] " + postData.user_fullname + " đã xong: " + data[i][1],
                htmlBody: "<p>Chào Admin,</p>" +
                  "<p>Nhân viên <b>" + escapeHtml_(postData.user_fullname) + "</b> báo cáo hoàn thành: <b>" + escapeHtml_(data[i][1]) + "</b>.</p>" +
                  "<p>Minh chứng (" + uploadedLinks.length + " file): " + (emailLinks || 'Không có file') + "</p>" +
                  "<p>Vui lòng vào App để duyệt.</p>"
              });
            } catch (e) { logSystem("ERROR", "Send Admin Mail Failed: " + e.toString()); }
          }
          return responseJSON({ status: 'success', message: "Đã gửi báo cáo và " + uploadedLinks.length + " file minh chứng!" });
        }
      }
      return responseJSON({ status: 'error', message: 'Không tìm thấy ID công việc.' });
    }

    if (action == 'approve_done') {
      if (!isAdminRequest_(ss, postData)) return responseJSON({ status: 'error', message: '⛔ Chỉ Admin mới được duyệt!' });
      var sheet = ss.getSheetByName(SHEET_DATA);
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) == postData.id) {
          sheet.getRange(i + 1, 3).setValue("Done");
          sheet.getRange(i + 1, 9).setValue("'100%");
          sendNotificationEmail(ss, String(data[i][7]),
            "✅ [ĐÃ DUYỆT] " + data[i][1],
            "<p>Admin đã duyệt hoàn thành công việc: <b>" + escapeHtml_(data[i][1]) + "</b>.</p>");
          return responseJSON({ status: 'success', message: 'Đã duyệt!' });
        }
      }
      return responseJSON({ status: 'error', message: 'Không tìm thấy ID công việc' });
    }

    if (action == 'reject_done') {
      if (!isAdminRequest_(ss, postData)) return responseJSON({ status: 'error', message: '⛔ Chỉ Admin mới được trả về!' });
      var sheet = ss.getSheetByName(SHEET_DATA);
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]) == postData.id) {
          sheet.getRange(i + 1, 3).setValue("Doing");
          sheet.getRange(i + 1, 9).setValue("'90%");
          sendNotificationEmail(ss, String(data[i][7]),
            "❌ [YÊU CẦU LẠI] " + data[i][1],
            "<p>Báo cáo công việc <b>" + escapeHtml_(data[i][1]) + "</b> chưa đạt yêu cầu. Vui lòng kiểm tra lại.</p>");
          return responseJSON({ status: 'success', message: 'Đã trả về!' });
        }
      }
      return responseJSON({ status: 'error', message: 'Không tìm thấy ID công việc' });
    }

    if (action == 'send_email_manual') {
      if (!isAdminRequest_(ss, postData)) return responseJSON({ status: 'error', message: 'Không có quyền!' });
      var emails = getEmailMap(ss);
      var people = postData.assignee.split(',');
      var count = 0;
      people.forEach(function (p) {
        p = p.trim();
        if (emails[p]) {
          try {
            MailApp.sendEmail({
              to: emails[p],
              subject: "🔔 NHẮC VIỆC: " + postData.taskName,
              htmlBody: "<p>Nhắc nhở: <b>" + escapeHtml_(postData.taskName) + "</b>. Hạn: " + escapeHtml_(postData.deadline) + "</p>"
            });
            count++;
          } catch (e) { }
        }
      });
      return responseJSON({ status: 'success', message: "Đã gửi " + count + " email." });
    }

    if (action == 'send_bulk_email') {
      if (!isAdminRequest_(ss, postData)) return responseJSON({ status: 'error', message: 'Không có quyền!' });
      var sheet = ss.getSheetByName(SHEET_DATA);
      var data = sheet.getDataRange().getValues();
      var emails = getEmailMap(ss);
      var userTasksMap = {};

      data.forEach(function (row) {
        if (row[2] !== 'Done' && row[2] !== 'Waiting' && row[0]) {
          var assignees = String(row[7]).split(',');
          assignees.forEach(function (p) {
            p = p.trim();
            if (emails[p]) {
              if (!userTasksMap[p]) userTasksMap[p] = [];
              userTasksMap[p].push(row[1]);
            }
          });
        }
      });

      var count = 0;
      for (var p in userTasksMap) {
        try {
          var taskListHtml = userTasksMap[p].map(function (t) { return "<li><b>" + escapeHtml_(t) + "</b></li>"; }).join('');
          MailApp.sendEmail({
            to: emails[p],
            subject: "🔔 NHẮC VIỆC TỒN ĐỌNG",
            htmlBody: "<p>Chào <b>" + escapeHtml_(p) + "</b>,</p><p>Bạn hiện đang có các công việc tồn đọng chưa hoàn thành sau đây:</p><ul>" + taskListHtml + "</ul><p>Vui lòng sắp xếp thời gian hoàn thành sớm nhé.</p>"
          });
          count++;
        } catch (e) { }
      }
      return responseJSON({ status: 'success', message: "Đã gửi nhắc nhở hàng loạt cho " + count + " nhân sự." });
    }

    if (action == 'add_compliance') {
      if (!isAdminRequest_(ss, postData)) return responseJSON({ status: 'error', message: 'Không có quyền!' });
      ss.getSheetByName(SHEET_COMPLIANCE).appendRow([
        Utilities.getUuid().slice(0, 8), postData.date ? new Date(postData.date) : new Date(),
        postData.person, postData.type, postData.fault, postData.note
      ]);
      return responseJSON({ status: 'success', message: 'Đã ghi nhận!' });
    }

    if (action == 'update_compliance') {
      if (!isAdminRequest_(ss, postData)) return responseJSON({ status: 'error', message: 'Không có quyền!' });
      var complianceSheet = ss.getSheetByName(SHEET_COMPLIANCE);
      var complianceRow = findRowById_(complianceSheet, postData.id);
      if (complianceRow < 2) return responseJSON({ status: 'error', message: 'Không tìm thấy ghi nhận!' });
      complianceSheet.getRange(complianceRow, 2, 1, 5).setValues([[
        postData.date ? new Date(postData.date) : new Date(),
        postData.person,
        postData.type,
        postData.fault,
        postData.note
      ]]);
      return responseJSON({ status: 'success', message: 'Đã cập nhật ghi nhận!' });
    }

    if (action == 'delete_compliance') {
      if (!isAdminRequest_(ss, postData)) return responseJSON({ status: 'error', message: 'Không có quyền!' });
      var deleteComplianceSheet = ss.getSheetByName(SHEET_COMPLIANCE);
      var deleteComplianceRow = findRowById_(deleteComplianceSheet, postData.id);
      if (deleteComplianceRow < 2) return responseJSON({ status: 'error', message: 'Không tìm thấy ghi nhận!' });
      deleteComplianceSheet.deleteRow(deleteComplianceRow);
      return responseJSON({ status: 'success', message: 'Đã xóa ghi nhận!' });
    }

    return responseJSON({ status: 'error', message: 'Action not found' });

  } catch (err) {
    logSystem("ERROR", "doPost Failed: " + err.toString());
    return responseJSON({ status: 'error', message: 'Server Error: ' + err.toString() });
  } finally {
    lock.releaseLock();
  }
}

// ==========================================
// AI
// ==========================================
function handleAIRequest(userQuestion, chatHistory, ss) {
  try {
    var taskData = ss.getSheetByName(SHEET_DATA).getDataRange().getValues();
    var minimalContext = "VIỆC TỒN ĐỌNG:\n";
    var count = 0;
    for (var i = 1; i < taskData.length; i++) {
      var row = taskData[i];
      if (row[2] !== 'Done') {
        var dl = row[4] ? formatDateVN(new Date(row[4])) : "Không hạn";
        minimalContext += "- " + row[1] + " (NV: " + row[7] + ", Hạn: " + dl + ", Trạng thái: " + row[2] + ")\n";
        count++; if (count > 40) break;
      }
    }

    var systemPrompt = "Bạn là Lily, trợ lý Khoa Dược. Dữ liệu: " + minimalContext +
      ". Nếu gửi nhắc nhở, trả JSON: {\"action\": \"SEND_EMAIL\", \"target_name\": \"...\", \"task_names\": \"...\", \"reason\": \"...\"}.";
    var fullPrompt = systemPrompt + "\nLỊCH SỬ:\n" + chatHistory + "\nUser: " + userQuestion;

    var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;
    var payload = { "contents": [{ "parts": [{ "text": fullPrompt }] }] };
    var response = UrlFetchApp.fetch(url, {
      "method": "post", "contentType": "application/json",
      "payload": JSON.stringify(payload), "muteHttpExceptions": true
    });

    if (response.getResponseCode() !== 200) {
      logSystem("ERROR", "Lỗi Gemini API: " + response.getContentText());
      return responseJSON({ status: 'success', answer: "AI đang bận hoặc có lỗi kết nối mạng. Vui lòng thử lại sau." });
    }

    var json = JSON.parse(response.getContentText());
    if (!json.candidates) return responseJSON({ status: 'success', answer: "AI không thể tạo câu trả lời." });
    var aiText = json.candidates[0].content.parts[0].text.trim();

    var cleanJson = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
    if (cleanJson.startsWith("{") && cleanJson.includes("SEND_EMAIL")) {
      try {
        var cmd = JSON.parse(cleanJson);
        return responseJSON({ status: 'success', answer: executeAISendEmail(cmd.target_name, cmd.task_names, cmd.reason, ss) });
      } catch (e) { }
    }
    return responseJSON({ status: 'success', answer: aiText });
  } catch (e) {
    return responseJSON({ status: 'success', answer: "Lỗi nội bộ AI: " + e.toString() });
  }
}

function executeAISendEmail(targetName, taskNames, reason, ss) {
  var emails = getEmailMap(ss);
  if (!emails[targetName]) return "⚠️ Không tìm thấy email của " + targetName;
  try {
    MailApp.sendEmail({
      to: emails[targetName], subject: "[Lily AI] Nhắc nhở",
      htmlBody: "<p>Chào " + escapeHtml_(targetName) + ",</p><p>Check: <b>" + escapeHtml_(taskNames) + "</b>.</p><p>Lý do: " + escapeHtml_(reason) + "</p>"
    });
    return "✅ Đã gửi mail nhắc " + targetName + ".";
  } catch (e) { return "Lỗi gửi mail."; }
}

// ==========================================
// AUTO CHECK DEADLINES (Time-based trigger)
// ==========================================
function autoCheckDeadlines() {
  try {
    var ss = getSS();
    var sheet = ss.getSheetByName(SHEET_DATA);
    var data = sheet.getDataRange().getValues();
    var emails = getEmailMap(ss);

    var today = new Date(); today.setHours(0, 0, 0, 0);
    var userTasksMap = {};

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (row[2] !== 'Done' && row[2] !== 'Waiting') {
        var assignees = String(row[7]).split(',');
        assignees.forEach(function (person) {
          var name = person.trim();
          if (!name) return;
          if (!userTasksMap[name]) userTasksMap[name] = [];

          var deadlineDate = row[9] ? new Date(row[9]) : (row[4] ? new Date(row[4]) : null);
          var daysLeft = 999;
          var category = 1;

          if (deadlineDate) {
            deadlineDate.setHours(0, 0, 0, 0);
            var diffTime = deadlineDate.getTime() - today.getTime();
            daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (daysLeft < 0) category = 2;
            else if (daysLeft <= 1) category = 0;
            else category = 1;
          }

          userTasksMap[name].push({
            taskName: row[1],
            deadline: row[4] ? formatDateVN(deadlineDate) : "Không hạn",
            daysLeft: daysLeft, category: category, priority: row[3]
          });
        });
      }
    }

    var countEmails = 0;
    for (var userName in userTasksMap) {
      var userEmail = emails[userName];
      var tasks = userTasksMap[userName];
      if (userEmail && tasks.length > 0) {
        tasks.sort(function (a, b) {
          if (a.category !== b.category) return a.category - b.category;
          return a.daysLeft - b.daysLeft;
        });
        sendDailyReportEmail(userEmail, userName, tasks);
        countEmails++;
      }
    }
    logSystem("AUTO_RUN", "Đã gửi báo cáo cho " + countEmails + " nhân viên.");
  } catch (e) { logSystem("ERROR", "Auto Check Failed: " + e.toString()); }
}

function sendDailyReportEmail(email, name, tasks) {
  var rowsHtml = "";
  tasks.forEach(function (t) {
    var rowStyle = "", statusText = "";
    if (t.category === 2) {
      rowStyle = "color: #6f42c1; font-style: italic;"; statusText = "Quá hạn " + Math.abs(t.daysLeft) + " ngày";
    } else if (t.category === 0) {
      rowStyle = "color: #dc3545; font-weight: bold;"; statusText = t.daysLeft === 0 ? "Hạn hôm nay" : "Còn 1 ngày";
    } else {
      rowStyle = "color: #333;"; statusText = "Còn " + t.daysLeft + " ngày";
    }
    if (t.deadline === "Không hạn") statusText = "----";
    rowsHtml += "<tr style=\"border-bottom: 1px solid #eee;\">" +
      "<td style=\"padding:10px; " + rowStyle + "\">" + t.taskName + "</td>" +
      "<td style=\"padding:10px; text-align:center;\">" + t.deadline + "</td>" +
      "<td style=\"padding:10px; text-align:center; " + rowStyle + "\">" + statusText + "</td></tr>";
  });

  var htmlBody =
    "<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #ddd;border-radius:8px;\">" +
    "<div style=\"background-color:#2c3e50;padding:15px;color:white;text-align:center;border-radius:8px 8px 0 0;\">" +
    "<h3 style=\"margin:0;\">NHẮC VIỆC HÀNG NGÀY</h3><p style=\"margin:5px 0 0;font-size:14px;\">Xin chào, " + name + "</p></div>" +
    "<div style=\"padding:20px;\"><p>Danh sách công việc tồn đọng ngày " + formatDateVN(new Date()) + ":</p>" +
    "<table style=\"width:100%;border-collapse:collapse;font-size:14px;\">" +
    "<thead><tr style=\"background-color:#f8f9fa;color:#666;\">" +
    "<th style=\"padding:10px;text-align:left;\">Công việc</th>" +
    "<th style=\"padding:10px;\">Deadline</th>" +
    "<th style=\"padding:10px;\">Tình trạng</th></tr></thead>" +
    "<tbody>" + rowsHtml + "</tbody></table>" +
    "<p style=\"margin-top:20px;font-size:12px;color:#999;text-align:center;\">(Đỏ: Gấp | Tím: Quá hạn - Xếp cuối)</p>" +
    "</div></div>";

  MailApp.sendEmail({
    to: email,
    subject: "[DeepMed] Nhắc việc ngày " + formatDateVN(new Date()),
    htmlBody: htmlBody
  });
}

// ==========================================
// HELPERS
// ==========================================
function sendNotificationEmail(ss, assigneesStr, subject, htmlBody) {
  var emails = getEmailMap(ss);
  assigneesStr.split(',').forEach(function (name) {
    if (emails[name.trim()]) {
      try { MailApp.sendEmail({ to: emails[name.trim()], subject: subject, htmlBody: htmlBody }); } catch (e) { }
    }
  });
}

function getAdminEmails(ss) {
  var data = ss.getSheetByName(SHEET_STAFF).getDataRange().getValues();
  var admins = [];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][3]).trim() === 'Admin' && data[i][4]) admins.push(data[i][4]);
  }
  return admins.join(',');
}

function getEmailMap(ss) {
  var data = ss.getSheetByName(SHEET_STAFF).getDataRange().getValues();
  var emails = {};
  for (var k = 1; k < data.length; k++) {
    if (data[k][2] && data[k][4]) {
      emails[String(data[k][2]).trim()] = String(data[k][4]).trim();
    }
  }
  return emails;
}

function getUserRecordByUsername_(ss, username) {
  if (!username) return null;
  var data = ss.getSheetByName(SHEET_STAFF).getDataRange().getValues();
  var needle = String(username).trim().toLowerCase();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toLowerCase() === needle) {
      return {
        username: data[i][0],
        name: data[i][2],
        role: String(data[i][3] || '').trim(),
        email: data[i][4]
      };
    }
  }
  return null;
}

function getSessionUser_(postData) {
  if (!postData || !postData.token) return null;
  var cached = CacheService.getScriptCache().get("session_" + String(postData.token));
  if (!cached) return null;
  try {
    var user = JSON.parse(cached);
    if (postData.username && String(user.username).trim().toLowerCase() !== String(postData.username).trim().toLowerCase()) {
      return null;
    }
    return user;
  } catch (e) {
    return null;
  }
}

function isAdminRequest_(ss, postData) {
  var user = getSessionUser_(postData);
  return !!user && user.role === 'Admin';
}

function isUserIdentityRequest_(postData) {
  var user = getSessionUser_(postData);
  return !!user && String(user.name || '').trim() === String(postData && postData.user_fullname || '').trim();
}

function isAssignedTo_(assigneesStr, fullName) {
  var needle = String(fullName || '').trim();
  if (!needle) return false;
  return String(assigneesStr || '')
    .split(',')
    .map(function (name) { return name.trim(); })
    .some(function (name) { return name === needle; });
}

function parseValidDate_(value) {
  if (!value) return null;
  var date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function escapeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readSheetData(sheetName) {
  var ss = getSS();
  var s = ss.getSheetByName(sheetName);
  if (!s || s.getLastRow() <= 1) return responseJSON({ status: 'success', data: [] });

  var data = s.getRange(2, 1, s.getLastRow() - 1, Math.max(s.getLastColumn(), 14)).getValues();

  if (sheetName === SHEET_DATA) {
    var today = new Date(); today.setHours(0, 0, 0, 0);
    for (var i = 0; i < data.length; i++) {
      if (data[i][2] === 'Todo' && data[i][6] && new Date(data[i][6]) < today) {
        data[i][2] = 'Doing';
      }
    }
  }
  return responseJSON({ status: 'success', data: data });
}

function findRowById_(sheet, id) {
  if (!sheet || !id || sheet.getLastRow() <= 1) return -1;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues();
  var needle = String(id).trim();
  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === needle) return i + 2;
  }
  return -1;
}

function logSystem(type, message) {
  try {
    var ss = getSS();
    var sheet = ss.getSheetByName(SHEET_LOGS);
    if (!sheet) { sheet = ss.insertSheet(SHEET_LOGS); sheet.appendRow(["Timestamp", "Type", "Message"]); }
    sheet.appendRow([new Date(), type, message]);
  } catch (e) { Logger.log(e); }
}

function formatDateVN(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "dd/MM/yyyy");
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// CẤP QUYỀN (Chạy thủ công 1 lần sau deploy)
// ==========================================
function xinQuyenDrive() {
  DriveApp.getFiles();
  MailApp.getRemainingDailyQuota();
  CalendarApp.getDefaultCalendar(); // Cấp quyền Calendar
  console.log("Đã cấp quyền thành công!");
}

function kichHoatQuyenAI() {
  UrlFetchApp.fetch("https://www.google.com");
  console.log("Đã cấp quyền Internet thành công!");
}
