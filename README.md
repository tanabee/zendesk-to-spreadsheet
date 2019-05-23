## About

Zendesk ticket list exporter using Zendesk API. You can see ticket list on Google Spreadsheet.
 
## Environment

- Google Apps Script (Installable triggers with Google Spreadsheet)

## Installation

1. Open https://docs.google.com/spreadsheets/d/1WeALWBWMPyluRfznTMZvt34Rrkr0ZTaOz3a1WzJNNNA/edit?usp=sharing
- File > Make a copy... 
- Tools > Script editor (Then it opens Google Apps Script editor) 
- File > Project properties
- Script properties > Add rows
    - API_TOKEN: Zendesk API token (You can get token: https://[subdomain].zendesk.com/agent/admin/api/settings)
    - MAIL_ADDRESS: Zendesk login mail address (admin user)
    - SUB_DOMAIN: Zendesk subdomain
- Save
- Select function
    - select main function
- Select play button
- Trigger setting
    - daily
    - function: fetchTickets
