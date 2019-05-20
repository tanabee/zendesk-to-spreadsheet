var properties   = PropertiesService.getScriptProperties(),
    API_TOKEN    = properties.getProperty("API_TOKEN"),
    SUB_DOMAIN   = properties.getProperty("SUB_DOMAIN"),
    MAIL_ADDRESS = properties.getProperty("MAIL_ADDRESS"),
    RUNTIME = 5,// 実行時間（分）
    TRIGGER = 'TRIGGER',
    START_INDEX = 'START_INDEX';

function fetchTickets() {
  /*
  var tickets = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("tickets")
    .getDataRange()
    .getValues();
  var latestTicketId = tickets[1][0];// データの先頭行の 1 列目
  */

  var tickets = [];
  var page = 1;
  do {
    var response = apiRequestToZendesk('tickets.json', '?sort_by=created_at&sort_order=desc&page=' + page);
    tickets = tickets.concat(response.tickets.map(function (ticket) {
      return [
        ticket.id,
        ticket.brand_id,
        ticket.subject,
        ticket.description,
        ticket.tags.join(','),
        ticket.created_at,
        ticket.updated_at,
      ];
    }));
    page++;
  } while (response.next_page != null);
  tickets.unshift(['ID', 'Brand ID', 'Subject', 'Description', 'Tags', 'Created at', 'Updated at']);
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("tickets")
    .getRange('A1:G' + tickets.length)
    .setValues(tickets);

  registerTrigger(TRIGGER, 'fetchTicketComments');
}

function fetchTicketComments() {
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

  tickets.shift();
  comments.shift();

  for (var i = startIndex; i < tickets.length; i++) {
    var ticket = tickets[i],
        ticketId = ticket[0],
        page = 1;

    do {
      var response = apiRequestToZendesk('tickets/' + ticketId + '/comments.json', '?sort_by=created_at&sort_order=desc&page=' + page);
      comments = comments.concat(response.comments.map(function (comment) {
        return [
          comment.id,
          ticketId,
          comment.author_id,
          comment.body,
          comment.created_at,
        ];
      }));
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

  if (startIndex !== 0) {
    registerTrigger(TRIGGER, 'fetchTicketComments');
  }
}

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
