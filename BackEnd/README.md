# SemiSharp BackEnd

SemiSharp is being rebuilt as a backend-first football analytics platform.

Current milestone:
- PostgreSQL database created: semisharp
- Schemas created: auth, survivor
- Users created: ADMIN, SAS, CNS, UWO
- Survivor Sweat entries created:
  - UWOSH-1 -> SAS
  - UWOSH-2 -> SAS
  - UWOSH-3 -> CNS
  - UWOSH-4 -> UWO
- Python database connection working
- Repository layer created
- User entries can be returned as GUI/API-ready structured data

Architecture rule:
The backend owns all business logic. The future Google AI Studio frontend will only call APIs and display returned JSON.

Current backend flow:
PostgreSQL -> Python Repository -> Script Test -> Future FastAPI -> Future GUI

Important:
.env is intentionally excluded from Git because it contains database credentials.
