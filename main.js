var API_TOKEN    = PropertiesService.getScriptProperties().getProperty("API_TOKEN");
var SUB_DOMAIN   = PropertiesService.getScriptProperties().getProperty("SUB_DOMAIN");
var MAIL_ADDRESS = PropertiesService.getScriptProperties().getProperty("MAIL_ADDRESS");

function main() {
  var tickets = apiRequestToZendesk('tickets.json');
  Logger.log(tickets);
}

function apiRequestToZendesk(resource) {
  var options = {
    'method': 'get',
    'contentType': 'application/json',
    'headers': {
      'Authorization': 'Basic ' + Utilities.base64Encode( MAIL_ADDRESS + '/token:' + API_TOKEN )
    }
  };
  var res = UrlFetchApp.fetch('https://' + SUB_DOMAIN + '.zendesk.com/api/v2/' + resource, options);
  return JSON.parse(res)
}
