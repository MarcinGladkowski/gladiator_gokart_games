# Gladiator Gokart Games https://gladiatorgokartgames.pl/

## **Roadmap**

- [] Tests in workflow
- [] Local workflow usign devcontainers
- [] Documentation of configuring race from, sheet, download resultsd from email, parsing race results 
- [] Configure forms and pages (with sheets and for permission till to the end of season)
- [] Calculating total classification
- [] Filling past seasones
- [] Drivers profiles
- [] Add nicknames mapping

## **Application Flow**

```mermaid
flowchart TD
    subgraph ai["AI Inference — workflow_dispatch"]
        AI_IN([Single RACE/QUALI fetch: member_id · round · run_type · deploy])
        AI_PARSE[Parse round]
        AI_FETCH1["Fetch member sessions\napex-timing.com"]
        AI_EXTRACT1["Extract session_id · GPT-4o"]
        AI_VALIDATE{Valid number?}
        AI_FAIL([Fail])
        AI_FETCH2["Fetch race details\napex-timing.com"]
        AI_EXTRACT2["Extract race results · GPT-4o"]
        AI_SAVE["Save JSON to resource/races/"]
        AI_COMMIT["Commit & push"]
        AI_DEPLOY{deploy = YES?}

        AI_IN --> AI_PARSE --> AI_FETCH1 --> AI_EXTRACT1 --> AI_VALIDATE
        AI_VALIDATE -->|No| AI_FAIL
        AI_VALIDATE -->|Yes| AI_FETCH2 --> AI_EXTRACT2 --> AI_SAVE --> AI_COMMIT --> AI_DEPLOY
    end

    subgraph deploy["Deploy — push to main / workflow_dispatch"]
        D_INSTALL[npm ci]
        D_BUILD["npm run build:parse\n① parse-data.ts → results.json\n② update-total-results.ts → total_results.json"]
        D_UPLOAD[Upload Pages artifact]
        D_PAGES([GitHub Pages\ngladiatorgokartgames.pl])

        D_INSTALL --> D_BUILD --> D_UPLOAD --> D_PAGES
    end

    AI_COMMIT -->|push to main| D_INSTALL
    AI_DEPLOY -->|Yes| D_INSTALL
```

## **Enrollment Flow**

```mermaid
flowchart TD
    USER([User])
    FORM[Google Form]
    SHEET[(Google Sheet)]
    APP([GitHub Pages\ngladiatorgokartgames.pl])

    USER -->|submits enrollment| FORM
    FORM -->|saves response| SHEET
    SHEET -->|JSON via Apps Script| APP
    APP -->|displays grid & results| USER
```

## **Configuration**

### Google form

Setup with one text field and google sheet as output

### Google sheet

Expose as JSON for application: extensions -> Apps Scrips -> deploy trigger -> as Application to everyone -> add permissions
```js
function doGet() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet()
    const [header, ...rows] = sheet.getDataRange().getValues()
    const data = rows.map(row =>
      Object.fromEntries(header.map((h, i) => [h, row[i]]))
    )
    return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON)
  }
```
