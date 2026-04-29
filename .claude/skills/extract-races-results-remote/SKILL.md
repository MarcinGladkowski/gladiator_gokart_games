---
name: extract-races-results-remote
description: "Extract races results"
---

### DESCRIPTION
Your task is to fetch and extract races results

**Run types**

* Race group A - Závod, sk. A
* Qualification session group A - Měřák, sk. A - 18:00
* Race group B - Závod, sk. B
* Qualification session group B - Měřák, sk. B - 18:00

DOT NOT TAKE ANY ACTION while any member_id, race number and date DOES NOT PROVIDED.

**User last sessions**
```sh
curl -X POST 'https://www.apex-timing.com/gokarts/functions/request_member_graphic.php' \
  -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36' \
  --data-raw 'center_id=120&member_id={member_id}'
```

Returned javascript block contains 'var graphic_all_data' which tells last sessions for driver.

**task**

Based on arguments: {member_id} and {run_type} extract {session_id} of race.
Input could contains multiple member_id: race_type pairs.
Race type MUST be recognized by key race_name. Additionaly input can contains {year} and {month}.
Originaly response contains names in Czech lang. In example April - dub. 2026

`partial response`
```
 {
                "rank": "1",
                "time_millisecond": 72780,
                "time": "1:12.780",
                "sector_1": "",
                "sector_1_millisecond": 0,
                "sector_2": "",
                "sector_2_millisecond": 0,
                "sector_3": "",
                "sector_3_millisecond": 0,
                "date": "dub. 2026",
                "session_id": "11264",
                "race_name": "Z\u00e1vod, sk. A - 18:26"
            }
```

Correct id is: {sesssion_id: 11264}


### Race details

Your next task is to extract race competitions results from curl response. Each email contains information about a specific race, including the qualification and the race.


YOU MUST use below query
```sh
curl -s -X POST 'https://www.apex-timing.com/gokarts/functions/request_member_profile.php' \
  -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36' \
  --data-raw 'type=session_results&center_id=120&session_id={session_id}'
```

Your task is to extract race competitions results from email messages saved in HTML files. Each email contains information about a specific race, including the qualification and the race.

* You MUST create separate directory in `resource/races/race_<race_id>_<date>` 
* You are browsing for races from session results fetched by curl request

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
* The file name will be in format: `resource/races/race_<race_number>_<date>/group_a_qualifications_result.json`
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