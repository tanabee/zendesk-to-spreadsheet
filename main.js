var properties   = PropertiesService.getScriptProperties(),
    API_TOKEN    = properties.getProperty("API_TOKEN"),
    SUB_DOMAIN   = properties.getProperty("SUB_DOMAIN"),
    MAIL_ADDRESS = properties.getProperty("MAIL_ADDRESS"),
    RUNTIME = 5,// 実行時間（分）
    TRIGGER = 'TRIGGER',
    START_INDEX = 'START_INDEX';

function doGet(e) {
  if (!e.parameter.id) {
    return HtmlService.createHtmlOutput('<h1>チケット ID を指定してください: [url]?id=[チケットID]</h1>');
  }
  var tickets = SpreadsheetApp
                  .getActiveSpreadsheet()
                  .getSheetByName("tickets")
                  .getDataRange()
                  .getValues()
                  .filter(function (row) {
                    return row[0] === Number(e.parameter.id);
                  });
  if (tickets.length === 0) {
    return  HtmlService.createHtmlOutput('<h1>指定したチケットは存在しません</h1>');
  }
  var ticket = tickets[0];

  var comments = SpreadsheetApp
                  .getActiveSpreadsheet()
                  .getSheetByName("comments")
                  .getDataRange()
                  .getValues()
                  .filter(function (row) {
                    return row[1] === ticket[0];
                  });

  var template = HtmlService.createTemplateFromFile('template');;
  template.header = ticket[2];
  template.contents = ticket[5] + ': ' + ticket[3];
  return template.evaluate();
}

// チケット一覧の取得
function fetchTickets() {

  var tickets = [];
  var page = 1;

  // チケット一覧を取得（ページ数分まわす）
  do {
    var response = apiRequestToZendesk('tickets.json', '?sort_by=created_at&sort_order=desc&page=' + page);
    tickets = tickets.concat(response.tickets.map(function (ticket) {
      return [
        ticket.id,
        ticket.brand_id,
        ticket.subject,
        ticket.description,
        ticket.tags.join(','),
        toDate(ticket.created_at),
        toDate(ticket.updated_at),
      ];
    }));
    page++;
  } while (response.next_page != null);

  // スプレッドシートに保存
  tickets.unshift(['ID', 'Brand ID', 'Subject', 'Description', 'Tags', 'Created at', 'Updated at']);
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("tickets")
    .getRange('A1:G' + tickets.length)
    .setValues(tickets);

  // チケットコメント一覧を取得するトリガーをセットして終了
  registerTrigger(TRIGGER, 'fetchTicketComments');
}

// チケット内のコメント一覧の取得
function fetchTicketComments() {

  // RUNTIME を超過した時に処理を中断するために開始時間を取る
  const startTime = new Date();

  var tickets = SpreadsheetApp
                  .getActiveSpreadsheet()
                  .getSheetByName("tickets")
                  .getDataRange()
                  .getValues(),
      comments = SpreadsheetApp
                  .getActiveSpreadsheet()
                  .getSheetByName("comments")
                  .getDataRange()
                  .getValues(),
      startIndex = parseInt(properties.getProperty(START_INDEX)) || 0;

  // 先頭行の除去
  tickets.shift();
  comments.shift();
  var commentIds = comments.map(function (row) {
    return row[0];
  });

  for (var i = startIndex; i < tickets.length; i++) {
    var ticket = tickets[i],
        ticketId = ticket[0],
        page = 1;

    // 特定のチケットのコメント一覧を取得
    do {
      var response = apiRequestToZendesk('tickets/' + ticketId + '/comments.json', '?sort_by=created_at&sort_order=desc&page=' + page);
      var newComments = response.comments
        .filter(function (comment) {
          return commentIds.indexOf(comment.id) === -1;
        })
        .map(function (comment) {
        return [
          comment.id,
          ticketId,
          comment.author_id,
          comment.body,
          toDate(comment.created_at),
        ];
      });
      comments = comments.concat(newComments);
      page++;
    } while (response.next_page != null);

    console.log(i);

    // RUNTIME を超えたら break;
    if ((new Date() - startTime) / (1000 * 60) > RUNTIME) {
      startIndex = i+1;
      break;
    }

    // 最後まで処理したら次回の開始 index を 0 にセット
    if (i === tickets.length-1) {
      startIndex = 0;
    }
  }

  // スプレッドシートに保存
  comments.unshift(['ID', 'Ticket ID', 'Author ID', 'Body', 'Created at']);
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("comments")
    .getRange('A1:E' + comments.length)
    .setValues(comments);

  properties.setProperty(START_INDEX, startIndex);
  deleteTrigger(TRIGGER);

  // RUNTIME で中断した場合は、再取得用のトリガーセット
  if (startIndex !== 0) {
    registerTrigger(TRIGGER, 'fetchTicketComments');
  }
}

// Zendesk へ API リクエスト
function apiRequestToZendesk(resource, query) {
  var options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Basic ' + Utilities.base64Encode( MAIL_ADDRESS + '/token:' + API_TOKEN )
    }
  };
  var res = UrlFetchApp.fetch('https://' + SUB_DOMAIN + '.zendesk.com/api/v2/' + resource + query, options);
  return JSON.parse(res);
}

// スプレッドシートで日付として認識させるため 'YYYY-MM-DDTHH:MM:SSZ' 形式から 'YYYY-MM-DD HH:MM:SS' 形式に変換
function toDate(str) {
  return str.replace('T', ' ').replace('Z', '');
}
