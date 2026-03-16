# Gokart challenge results website

## Functional requiremnts

* The service must represent all results for all drivers.
* The service has results for each race separately and for full seasones (years) since 2024.
* Data presented on tables must be easily filtered by drivers nickname.
* The menu must be splitted by total results, year and race under the year. Race contains qualifications sessions and races for groups. Each racing group and qualifications has 13 drivers.
* In each competitions drivers are split into groups after qualifications session
    * e.g. Qalifiacatuions group A, B
    * e.g. Race group A, B

## Technical requirements

* Usign PWA approach
* Needs to be easily serve on localhost and deployed as PWA on github pages
* No backend. The results MUST be parsed from PDF files on build process.
* Webpage must be interactive.
* Using newest technology stack

## Data source 

### file descriptions

#### Total results
* file name: @resource/total_results.pdf
* Contains:
    * Pozycja: current position
    * Ksywa: nickname
    * Score: percentage calculation of effectivness
    * Results number: races count
    * 2026-03-12: score of specific race

### Race results
* file name: @resource/races/{date}
    * group_{group_name}_race.csv
    * group_{group_name}_qualifications.csv