## About

Export Zendesk inquiry data to a spreadsheet using the Zendesk API.
 
## Environment

- Google Apps Script (Installable triggers with Google Spreadsheet)

## Installation

1. Open https://docs.google.com/spreadsheets/d/1WeALWBWMPyluRfznTMZvt34Rrkr0ZTaOz3a1WzJNNNA/copy
- Select Make a copy
- Tools > Script editor (Then it opens Google Apps Script editor) 
- File > Project properties
- Script properties > Add rows
    - API_TOKEN: Zendesk API token (You can get token: https://[subdomain].zendesk.com/agent/admin/api/settings)
    - MAIL_ADDRESS: Zendesk login mail address (admin user)
    - SUB_DOMAIN: Zendesk subdomain
- Save
- Select function
    - select fetchTickets function
- Select play button
- Edit > Current project's triggers
- Add Trigger
- Trigger setting
    - Choose which function to run: fetchTickets
    - Select event source: Time-driven
    - Select type of time based trigger: Day timer daily
- Save
- Done!

## Limitations

When you use it, you should consider the following limitations.

- Spreadsheet limitation: https://support.google.com/drive/answer/37603?hl=en
- Apps Script Quotas (Script runtime) : https://developers.google.com/apps-script/guides/services/quotas
- Zendesk API Rate limits: https://developer.zendesk.com/rest_api/docs/support/introduction#rate-limits
