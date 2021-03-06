var properties   = PropertiesService.getScriptProperties(),
    API_TOKEN    = properties.getProperty("API_TOKEN"),
    SUB_DOMAIN   = properties.getProperty("SUB_DOMAIN"),
    MAIL_ADDRESS = properties.getProperty("MAIL_ADDRESS"),
    RUNTIME = 5,// 実行時間（分）
    KEY_START_INDEX = 'START_INDEX';

// チケット一覧の取得
function fetchTickets() {

  var tickets = getSpreadSheetValues("tickets"),
      ticketIds = tickets.map(function (row) { return row[0]; }),
      page = 1;

  // チケット一覧を取得（ページ数分まわす）
  do {
    var response = apiRequestToZendesk('tickets.json', '?sort_by=created_at&sort_order=desc&page=' + page),
        fetchedTickets = response.tickets
          .map(function (ticket) {
            return [
              ticket.id,
              ticket.brand_id,
              ticket.subject,
              ticket.description,
              ticket.tags.join(','),
              toDate(ticket.created_at),
              toDate(ticket.updated_at),
            ];
          }),
        newTickets = fetchedTickets.filter(function (ticket) {
          return ticketIds.indexOf(ticket[0]) === -1;
        });

    // 既存のチケットを上書き
    fetchedTickets.forEach(function (ticket) {
      const index = ticketIds.indexOf(ticket[0]);
      if (index === -1) return;
      tickets[index] = ticket;
    });

    tickets = newTickets.concat(tickets);
    page++;
  } while (response.next_page != null);

  // スプレッドシートに保存
  tickets.unshift(['ID', 'Brand ID', 'Subject', 'Description', 'Tags', 'Created at', 'Updated at']);
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("tickets")
    .getRange('A1:G' + tickets.length)
    .setValues(tickets);

  // チケットコメント一覧を取得するトリガーをセットして終了
  registerTrigger('fetchTicketComments');
}

// チケット内のコメント一覧の取得
function fetchTicketComments() {

  // RUNTIME を超過した時に処理を中断するために開始時間を取る
  const startTime = new Date();

  var tickets = getSpreadSheetValues("tickets")
      comments = getSpreadSheetValues("comments")
      startIndex = parseInt(properties.getProperty(KEY_START_INDEX)) || 0,
      commentIds = comments.map(function (row) { return row[0]; });

  for (var i = startIndex; i < tickets.length; i++) {
    var ticketId = tickets[i][0],
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
      comments = newComments.concat(comments);
      page++;
    } while (response.next_page != null);

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

  properties.setProperty(KEY_START_INDEX, startIndex);
  deleteTrigger();

  // RUNTIME で中断した場合は、再取得用のトリガーセット
  if (startIndex !== 0) {
    registerTrigger('fetchTicketComments');
  }
}

// HTTP リクエストに対して該当チケットのやり取りの HTML を返す
function doGet(e) {
  // リクエストにチケット ID がない場合
  if (!e.parameter.id) {
    return HtmlService.createHtmlOutput('<h1>チケット ID を指定してください: [url]?id=[チケットID]</h1>');
  }

  var tickets = getSpreadSheetValues("tickets")
                  .filter(function (row) {
                    return row[0] === Number(e.parameter.id);
                  });
  // 該当チケットがない場合
  if (tickets.length === 0) {
    return  HtmlService.createHtmlOutput('<h1>指定したチケットは存在しません</h1>');
  }

  var ticket = tickets[0],
      // 該当チケットのコメント一覧を取得して HTML 形式の配列に変換
      comments = getSpreadSheetValues("comments")
        .filter(function (row) {
          return row[1] === ticket[0];
        })
        .sort(function (a, b) {
          return (a[4] > b[4]) ? 1 : -1;
        })
        .map(function (row) {
          return '<p><strong>' + row[2] + ':' + row[4] + '</strong><br>' + row[3].replace(/\n/g, '<br>');
        }),
      contents = [ '<p><strong>' + ticket[5] + '</strong><br>' + ticket[3].replace(/\n/g, '<br>') + '</p>' ].concat(comments),
      html = HtmlService
        .createTemplateFromFile('template')
        .getRawContent()
        .replace('__HEADER__', ticket[2])
        .replace('__CONTENTS__', contents.join(''));

  return HtmlService.createHtmlOutput(html);
}

// Zendesk へ API リクエスト
function apiRequestToZendesk(resource, query) {
  var url = [ 'https://', SUB_DOMAIN, '.zendesk.com/api/v2/', resource, query ].join(''),
      options = {
        'method': 'get',
        'contentType': 'application/json',
        'headers': {
          'Authorization': 'Basic ' + Utilities.base64Encode( MAIL_ADDRESS + '/token:' + API_TOKEN )
        }
      },
      res = UrlFetchApp.fetch(url, options);
  return JSON.parse(res);
}

// スプレッドシートで日付として認識させるため 'YYYY-MM-DDTHH:MM:SSZ' 形式から 'YYYY-MM-DD HH:MM:SS' 形式に変換
function toDate(str) {
  return str.replace('T', ' ').replace('Z', '');
}

// シート名からスプレッドシートの値取得
function getSpreadSheetValues(sheetName) {
  var values = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(sheetName)
    .getDataRange()
    .getValues();
  values.shift();// ヘッダの除去
  return values;
}
