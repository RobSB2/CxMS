# Data Engineer Extension

**Profile:** data-engineer
**Version:** 1.0.0
**Purpose:** Role-specific guidance for data engineering tasks

---

## Role Context

You are assisting a **data engineer**. Prioritize:
- Data quality and validation at every step
- Idempotent and reproducible pipelines
- Clear documentation of data lineage
- Performance optimization for large datasets
- Security and access control for sensitive data

## Available Tools

### DuckDB (Local SQL Analytics)

**Status:** Installed globally
**Usage:** Fast analytical queries on local files

```bash
# Query CSV directly
duckdb -c "SELECT * FROM 'data.csv' LIMIT 10"

# Query Parquet files
duckdb -c "SELECT * FROM 'data/*.parquet' WHERE date > '2024-01-01'"

# Create persistent database
duckdb mydata.db

# Export query results
duckdb -c "COPY (SELECT * FROM data) TO 'output.parquet' (FORMAT PARQUET)"
```

**DuckDB SQL Patterns:**
```sql
-- Read multiple file formats
SELECT * FROM read_csv_auto('*.csv');
SELECT * FROM read_parquet('data/*.parquet');
SELECT * FROM read_json_auto('events.json');

-- Window functions for analytics
SELECT
    date,
    value,
    AVG(value) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg
FROM metrics;

-- Pivot tables
PIVOT sales ON product USING SUM(amount);

-- Export to different formats
COPY (SELECT * FROM results) TO 'out.csv' (HEADER, DELIMITER ',');
COPY (SELECT * FROM results) TO 'out.parquet' (FORMAT PARQUET);
```

### MCP Database Servers

**PostgreSQL (@anthropic/postgres):**
- Production database access
- Schema inspection and queries
- Migration validation

**SQLite (@anthropic/sqlite):**
- Local development databases
- Embedded analytics
- Quick prototyping

## Pre-Approved Operations

| Operation | Command Pattern | Notes |
|-----------|-----------------|-------|
| Run DuckDB queries | `duckdb` | Local analytics |
| Read data files | CSV, Parquet, JSON | Any format |
| Python data scripts | `python`, `python3` | Pandas, etc. |
| Database queries | Via MCP servers | Read-only by default |
| Export data | To CSV, Parquet, JSON | Local files |

## SQL Best Practices

### Query Structure
```sql
-- Always use CTEs for readability
WITH
    raw_data AS (
        SELECT * FROM source_table
        WHERE date >= '2024-01-01'
    ),
    cleaned AS (
        SELECT
            id,
            TRIM(name) as name,
            COALESCE(value, 0) as value
        FROM raw_data
        WHERE id IS NOT NULL
    ),
    aggregated AS (
        SELECT
            DATE_TRUNC('month', date) as month,
            SUM(value) as total
        FROM cleaned
        GROUP BY 1
    )
SELECT * FROM aggregated
ORDER BY month;
```

### Data Quality Checks
```sql
-- Null check
SELECT
    COUNT(*) as total_rows,
    COUNT(column_name) as non_null,
    COUNT(*) - COUNT(column_name) as null_count
FROM table_name;

-- Uniqueness check
SELECT column_name, COUNT(*) as cnt
FROM table_name
GROUP BY column_name
HAVING COUNT(*) > 1;

-- Range validation
SELECT MIN(value), MAX(value), AVG(value)
FROM table_name;

-- Referential integrity
SELECT a.id
FROM table_a a
LEFT JOIN table_b b ON a.foreign_key = b.id
WHERE b.id IS NULL;
```

### Performance Patterns
```sql
-- Use appropriate indexes
CREATE INDEX idx_date ON events(date);
CREATE INDEX idx_user_date ON events(user_id, date);

-- Partition large tables
CREATE TABLE events_partitioned (
    id INT,
    date DATE,
    data JSON
) PARTITION BY RANGE (date);

-- Avoid SELECT *
SELECT id, name, value  -- Only needed columns
FROM large_table;

-- Use EXPLAIN for optimization
EXPLAIN ANALYZE SELECT ...;
```

## Data Pipeline Patterns

### ETL Structure
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Extract   │───▶│  Transform  │───▶│    Load     │
│             │    │             │    │             │
│ - Sources   │    │ - Clean     │    │ - Validate  │
│ - APIs      │    │ - Enrich    │    │ - Insert    │
│ - Files     │    │ - Aggregate │    │ - Upsert    │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Idempotent Pipeline Pattern
```python
def process_data(date: str):
    """Idempotent: can be run multiple times safely."""

    # 1. Extract with date filter
    raw = extract_for_date(date)

    # 2. Transform
    cleaned = transform(raw)

    # 3. Delete existing data for this date
    delete_existing(date)

    # 4. Load fresh data
    load(cleaned)

    # 5. Validate
    assert validate_row_counts(date)
```

### Data Validation Framework
```python
def validate_data(df):
    """Run all validations, return issues."""
    issues = []

    # Schema validation
    expected_cols = ['id', 'date', 'value']
    missing = set(expected_cols) - set(df.columns)
    if missing:
        issues.append(f"Missing columns: {missing}")

    # Null checks
    null_counts = df.isnull().sum()
    critical_nulls = null_counts[null_counts > 0]
    if not critical_nulls.empty:
        issues.append(f"Null values: {critical_nulls.to_dict()}")

    # Range checks
    if df['value'].min() < 0:
        issues.append("Negative values found")

    # Uniqueness
    dupes = df[df.duplicated(subset=['id'])]
    if not dupes.empty:
        issues.append(f"Duplicate IDs: {len(dupes)}")

    return issues
```

## Schema Documentation Pattern

```markdown
## Table: events

**Description:** User activity events
**Owner:** data-team
**Update Frequency:** Real-time streaming

### Columns

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| id | UUID | No | Primary key |
| user_id | UUID | No | FK to users.id |
| event_type | VARCHAR(50) | No | Event category |
| timestamp | TIMESTAMP | No | Event time (UTC) |
| properties | JSONB | Yes | Event metadata |

### Indexes
- `idx_events_user_id` on (user_id)
- `idx_events_timestamp` on (timestamp)
- `idx_events_type_time` on (event_type, timestamp)

### Partitioning
- Partitioned by month on `timestamp`
- Retention: 24 months

### Sample Query
```sql
SELECT event_type, COUNT(*)
FROM events
WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY event_type;
```
```

## File Format Guidance

| Format | Use When | Pros | Cons |
|--------|----------|------|------|
| **CSV** | Interchange, small data | Universal, human-readable | No types, slow for large files |
| **Parquet** | Analytics, large data | Columnar, compressed, fast | Binary, needs tooling |
| **JSON** | APIs, nested data | Flexible schema | Verbose, slow to parse |
| **Avro** | Streaming, schema evolution | Schema included, compact | Needs schema registry |

## Quick Reference

| Task | Tool/Command |
|------|--------------|
| Query CSV | `duckdb -c "SELECT * FROM 'file.csv'"` |
| Query Parquet | `duckdb -c "SELECT * FROM 'file.parquet'"` |
| Convert formats | `COPY (SELECT...) TO 'out.parquet'` |
| Profile data | `SUMMARIZE table_name;` (DuckDB) |
| Check schema | `DESCRIBE table_name;` |
| Explain query | `EXPLAIN ANALYZE SELECT...;` |
