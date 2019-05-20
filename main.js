var API_TOKEN    = PropertiesService.getScriptProperties().getProperty("API_TOKEN");
var SUB_DOMAIN   = PropertiesService.getScriptProperties().getProperty("SUB_DOMAIN");
var MAIL_ADDRESS = PropertiesService.getScriptProperties().getProperty("MAIL_ADDRESS");

function main() {
  var response = apiRequestToZendesk('tickets.json', '?sort_by=created_at&sort_order=desc');
  var tickets = response.tickets.map(function (ticket) {
    return [
      ticket.id,
      ticket.brand_id,
      ticket.subject,
      ticket.description,
      ticket.tags.join(','),
      ticket.created_at,
      ticket.updated_at,
    ];
  });
  Logger.log(tickets);
  SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName("tickets")
    .getRange('A1:G' + tickets.length)
    .setValues(tickets);
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
  return JSON.parse(res)
}
