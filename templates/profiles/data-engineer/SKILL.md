---
name: data-engineer
description: |
  Data pipelines, SQL, analytics, and ETL workflows toolkit.

  Use this profile when working on:
  - SQL queries and database operations
  - Data pipelines and ETL processes
  - Analytics and reporting
  - Data modeling and schema design
  - Pandas, DuckDB, or similar data tools
  - CSV/Excel/Parquet file processing
  - Data quality and validation

  Includes DuckDB for local SQL analytics and document processing skills.
license: MIT
cxms:
  version: ">=1.6"
  deployment_levels: [standard, max]
  profile_version: "1.0.0"
anthropic_skills:
  - xlsx
  - pdf
---

# Data Engineer Profile

This profile configures Claude Code for data engineering tasks including SQL, pipelines, and analytics.

## Included Tools

### Global Packages
- **duckdb** - Embedded SQL database for analytics

### MCP Servers
- **@anthropic/postgres** - PostgreSQL database access
- **@anthropic/sqlite** - SQLite database access

### Anthropic Skills
- **xlsx** - Excel spreadsheet processing
- **pdf** - PDF document processing

## When This Profile Activates

The profile guidance loads when Claude detects data engineering context:
- SQL files or queries
- Data pipeline code (Airflow, Prefect, etc.)
- Pandas/Polars dataframe operations
- Database schema files
- ETL scripts

## Usage

```bash
# Install globally (one-time)
cxms profile install data-engineer

# Apply to a project
cxms init --profile data-engineer

# Combine with devops for data platform work
cxms init --profile data-engineer,devops
```
