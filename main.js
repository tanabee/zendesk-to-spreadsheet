var API_TOKEN    = PropertiesService.getScriptProperties().getProperty("API_TOKEN");
var SUB_DOMAIN   = PropertiesService.getScriptProperties().getProperty("SUB_DOMAIN");
var MAIL_ADDRESS = PropertiesService.getScriptProperties().getProperty("MAIL_ADDRESS");

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
}

function fetchTicketComments() {
  var tickets = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("tickets")
    .getDataRange()
    .getValues();
  tickets.shift();
  //var latestTicketId = tickets[0][0];// データの先頭行の 1 列目

  var comments = [];

  tickets.forEach(function (ticket) {
    var ticketId = ticket[0];
    var page = 1;
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
  });

  comments.unshift(['ID', 'Ticket ID', 'Author ID', 'Body', 'Created at']);
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("comments")
    .getRange('A1:E' + comments.length)
    .setValues(comments);
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
