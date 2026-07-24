SemiSharp V2 – NFL Survivor Pool Decision Support Platform

Version: 0.9.4 (MVP)
Status: Active Development
License: MIT (or update as appropriate)

Overview

SemiSharp V2 is a full-stack NFL Survivor Pool decision support platform designed to help users research weekly survivor picks using multiple analytical strategies, risk modeling, sportsbook market data, and season planning.

The project is intended as a research platform for NFL Survivor Pools and demonstrates:

Full-stack application architecture
PostgreSQL data modeling
FastAPI backend
React frontend
Strategy engine framework
Historical data management
Reporting and documentation
Automated validation and deployment

Current MVP Scope

The current MVP focuses on:

Application workflow
User interface
Strategy comparison
Weekly analysis
Survivor pick management

The optimization of the strategy engine and predictive models is still under active development.

Features
User Features
Secure login
Multiple Survivor entries
Weekly matchup analysis
Multiple strategy recommendations
Weekly pick selection
Season roadmap visualization
Print Season Summary
Historical pick tracking
Analytics
Power Ratings
Home Field Advantage
Market Consensus
Sportsbook Comparison
Risk Analysis
Projected Win Probability
Future Value Strategy
Multiple Survivor Strategies
Administration
User Management
Operations Console
System Configuration
Team Health
Market Updates
Analytics Refresh
Season Management
Technology Stack
Backend
Python 3.12+
FastAPI
SQLAlchemy
PostgreSQL 16
Uvicorn
Psycopg2
Frontend
React
TypeScript
Vite
Tailwind CSS
Infrastructure
PostgreSQL
Nginx
Systemd Services
Ubuntu Linux
Requirements
Operating System

Recommended:

Ubuntu Server 24.04 LTS

Also works on:

Ubuntu Desktop
WSL2
Most Linux distributions

Windows and macOS should work but have not been fully tested.

Required Software

Install:

Git
Python 3.12+
Node.js 20+
npm
PostgreSQL 16
Nginx (recommended)

Optional:

VS Code
pgAdmin
DBeaver
Repository Structure
SemiSharp/

BackEnd/
FrontEnd/
Documentation/

Backups/
Installation
1. Clone Repository
git clone https://github.com/sasajs/semi-sharp-survivor.git

cd semi-sharp-survivor
2. Backend

Create a virtual environment.

cd BackEnd

python3 -m venv .venv

Activate:

Linux

source .venv/bin/activate

Install packages.

pip install -r requirements.txt
3. Database

Install PostgreSQL 16.

Create a database.

Example:

CREATE DATABASE semisharp;

Restore the supplied database or execute the database creation scripts.

Configure your connection using:

BackEnd/.env

Example:

DB_HOST=localhost
DB_PORT=5432
DB_NAME=semisharp
DB_USER=semisharp_app
DB_PASSWORD=your_password

Note: The repository does not include a populated production database. You will need to create or restore the database before the application can function correctly.

4. Frontend
cd FrontEnd

npm install

Build

npm run build

Development

npm run dev
Running the Application
Backend
cd BackEnd

source .venv/bin/activate

uvicorn app.main:app --reload

Default

http://localhost:8000
Frontend
cd FrontEnd

npm run dev

Default

http://localhost:5173
Validation

Fast validation

cd BackEnd

source .venv/bin/activate

curl http://127.0.0.1:8000/health

python scripts/validation/validate_analysis_api.py \
    --base-url http://127.0.0.1:8000 \
    --season 2026 \
    --week 1

Full backend validation

scripts/validation/validate_backend.sh

Full pipeline

scripts/run_full_pipeline.sh
Documentation

The project includes extensive documentation under:

Documentation/

Including:

Product Vision
Product Roadmap
Development Journal
Validation Guide
Restart Guide
UAT Documentation
Behind the Scenes
API Catalog
Database Dictionary
Current Project Status

Current release:

v0.9.4

Development priorities include:

Strategy optimization
Rules engine enhancements
Machine learning improvements
Monte Carlo planning
Future Value optimization
Expanded reporting
Contributing

Feedback is welcome.

Areas where contributions are especially helpful include:

Bug reports
UI/UX improvements
Documentation
Performance optimization
Security review
Testing
Code quality

Please open an Issue before submitting significant changes.

Known Limitations

Current MVP limitations include:

Strategy optimization is still under development.
Predictive models are not yet fully tuned.
Intended primarily for research and evaluation.
External data feeds may require local configuration.
Production credentials and proprietary data are not included.
Disclaimer

SemiSharp is a research and educational project intended to assist with analysis of NFL Survivor Pools. It is not financial or gambling advice, and no outcome or performance is guaranteed.

Contact

Developer

Steve Schilhabel

GitHub:
https://github.com/sasajs/semi-sharp-survivor

Acknowledgements

Thanks to everyone who has provided testing, feedback, and ideas throughout the development of SemiSharp. Your input has helped shape the application into its current MVP and will continue to guide future releases.
