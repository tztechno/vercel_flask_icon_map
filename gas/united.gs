function doGet(e) {
  const action = e.parameter.action;

  switch(action) {
    case 'summarize':
      return summarizeImageLinks();
    case 'getData':
      return getImageData();
    default:
      return ContentService.createTextOutput('Invalid action. Use ?action=summarize or ?action=getData').setMimeType(ContentService.MimeType.TEXT);
  }
}

function summarizeImageLinks() {
  try {
    summarizeImageLinksToSheet();
    return ContentService.createTextOutput('画像リンクの抽出が完了しました。スプレッドシートを確認してください。');
  } catch (error) {
    return ContentService.createTextOutput('エラーが発生しました: ' + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  }
}

function summarizeImageLinksToSheet() {
  const folderId = '1D-_iJIQLPoI4NUfS2ER5U-H3_pTEYSXu';
  const spreadsheetId = '1DKXdh0BlQC3zTBdmAlLIWeRMXkNPYkpqmDzmLoUa_ec';
  const sheetName = 'image2';

  let sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  if (!sheet) {
    sheet = SpreadsheetApp.openById(spreadsheetId).insertSheet(sheetName);
  }
  sheet.clear();
  sheet.appendRow(['path']);

  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFilesByType(MimeType.JPEG);
  let dataToAppend = [];

  while (files.hasNext()) {
    const file = files.next();
    const link = `https://drive.google.com/uc?export=view&id=${file.getId()}`;
    dataToAppend.push([link]);
  }

  if (dataToAppend.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, dataToAppend.length, 1).setValues(dataToAppend);
  }

  Logger.log('処理が完了しました。合計 ' + dataToAppend.length + ' 個の画像リンクが抽出されました。');
}

function getData() {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("image2");
    var data = sheet.getDataRange().getValues();
    var result = [];

    for (var i = 1; i < data.length; i++) {
        var path = data[i][0];
        if (path) {
            // Google DriveのファイルIDを抽出
            var fileId = path.match(/id=(.+)/)[1];
            // 直接表示可能なURLを生成
            var directUrl = "https://drive.google.com/uc?export=view&id=" + fileId;
            result.push({ path: directUrl });
        }
    }

  return ContentService.createTextOutput(JSON.stringify(points)).setMimeType(ContentService.MimeType.JSON);
}