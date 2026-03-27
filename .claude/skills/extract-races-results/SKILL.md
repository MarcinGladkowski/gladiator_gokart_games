---
name: extract-races-results
description: "Extract races results from Gmail messages and save them as JSON files with specific keys and file names."
---
 

Your task is to extract race competitions results from email messages saved in HTML files. Each email contains information about a specific race, including the qualification and the race.

* You MUST ask which race number and date you need to extract. 
* You MUST create separate directory in `resource/races/race_<race_id>_<date>` 
* You are browsing for races in local directory files in `resource/gmail`
* If user attach or provide files references look into them for data.

## Qualification

* You can find the qualification results in the email body, usually in a table format with title: mGP (2 sk.) - Měřák, sk. A
* QUALIFICATION REULTS has title "Měřák"
* QUALIFICATION GROUP has part "sk. A" or "sk. B", or "sk. C"
* Save results in JSON format:
```json
{
  "session_details": {
    "name": "mGP (2 sk.) - Měřák, sk. A",
    "date": "2026-03-12",
    "time_range": "18:00 - 18:01",
    "track": "OKRUH"
  },
  "general_results": [
    {
      "rank": 1,
      "kart_number": 4,
      "driver": "WIKTOR KALUZA",
      "laps": 6,
      "difference_to_leader": "Leader",
      "best_lap_time": "1:25.495"
    },
}
```
* The file name will be in format: `resource/races/race_<race_id>_<date>/group_a_qualifications_result.json`
* Date should be in format DD_MM_YYYY

## Race
* You can find the race results in the email body, usually in a table format with title: mGP (2 sk.) - Měřák, sk. A
* RACE RESULTS has title "Závod"
* RACE GROUP has part "sk. A" or "sk. B", or "sk. C"
* Save results in JSON format:
```json
{
  "race_details": {
    "name": "mGP (2 sk.) - Měřák, sk. A",
    "date": "2026-03-12",
    "time_range": "18:00 - 18:01",
    "track": "OKRUH"
  },
  "general_results": [
    {
      "rank": 1,
      "kart_number": 4,
      "driver": "WIKTOR KALUZA",
      "laps": 6,
      "difference_to_leader": "Leader",
      "best_lap_time": "1:25.495",
      "best_lap_time_race": true
    },
}
```
* The file name will be in format: `resource/races/race_<race_id>_<date>/group_a_race_results.json`
* Date should be in format DD_MM_YYYY
* `best_lap_time_race` is a boolean: `true` for the driver(s) who set the fastest lap in the race, `false` for all others. Compare all `best_lap_time` values to determine who holds the race best lap.