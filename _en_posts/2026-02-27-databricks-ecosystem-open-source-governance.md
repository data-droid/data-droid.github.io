---
layout: post
title: "Databricks Ecosystem Deep Dive - Open Source Foundations and Governance"
description: "A deep dive into how Databricks unifies data ingestion, storage, analytics, ML, and governance on top of open source projects like Apache Spark, Delta Lake, MLflow, and Unity Catalog, plus how it works with dbt."
excerpt: "Databricks lakehouse ecosystem, core open source projects, Unity Catalog, dbt, and governance in one guide"
category: data-engineering
tags: [Databricks, Lakehouse, Delta-Lake, Apache-Spark, MLflow, Unity-Catalog, dbt, Data-Governance]
date: 2026-03-02
author: Data Droid
lang: en
reading_time: 45 min
difficulty: Intermediate
---

# Databricks Ecosystem Deep Dive - Open Source Foundations and Governance

> **"Databricks looks like an all-in-one platform for data ingestion, storage, analytics, ML, and governance – but under the hood it’s powered by well-known open source projects."**

This post looks at Databricks not just as a “managed Spark service”, but as a **unified data & AI platform built on top of open source**.  
We’ll also cover **data governance (especially Unity Catalog)** and how Databricks **works together with dbt** rather than replacing it.

---

## 📚 Big Picture: Layered View of the Databricks Platform

It’s easiest to understand Databricks by looking at it layer by layer.

```
User Layer (User & Tools)
 ├─ Notebooks, Dashboards, SQL Editor
 ├─ Databricks SQL / Databricks Workflows
 ├─ Partner tools: dbt, Power BI, Tableau, Looker, Fivetran, Airflow, etc.
 └─ REST / SDK / JDBC / ODBC

Engine & Runtime Layer
 ├─ Apache Spark (optimized in Databricks Runtime)
 ├─ Photon (C++ vectorized query engine, commercial)
 ├─ ML Runtime (Spark + curated ML libraries)
 └─ Databricks Model Serving / Vector Search

Storage & Metadata Layer
 ├─ Delta Lake (open source table format)
 ├─ Unity Catalog (catalog, permissions, lineage – now open source)
 └─ Cloud storage (S3, ADLS, GCS, etc.)

Orchestration & Quality Layer
 ├─ Databricks Workflows (job / pipeline scheduling)
 ├─ Delta Live Tables / Lakeflow (declarative pipelines, data quality)
 └─ Integration with dbt, Airflow, Dagster and others

ML & MLOps Layer
 ├─ MLflow (experiments, models, registry – open source)
 ├─ Feature Store, AutoML
 └─ Model Serving, Monitoring
```

Now let’s see **which open source projects power each layer**, and **what Databricks adds on top**.

---

## 🔧 The Big Three Open Source Pillars: Spark, Delta Lake, MLflow

### 1. Apache Spark – The Distributed Compute Engine

- The original core of Databricks and still the main engine
- Handles batch, streaming, SQL, ML, and graph workloads in a single engine
- Databricks optimizes Spark in **Databricks Runtime (DBR)** with performance patches, stability fixes, and connectors

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .appName("DatabricksExample") \
    .getOrCreate()

df = spark.read.format("delta").load("/mnt/datalake/sales")

agg = (
    df.groupBy("country")
      .agg({"amount": "sum"})
      .withColumnRenamed("sum(amount)", "total_sales")
)
```

**Open Source Spark vs Databricks Runtime**

- **Open source Spark**: You run the vanilla engine, manage clusters, configs, tuning, and connectors yourself.
- **Databricks Runtime** adds:
  - Auto scaling clusters, auto optimizer tuning
  - Photon-powered high‑performance SQL
  - Native integration with Unity Catalog for permissions

### 2. Delta Lake – Lakehouse Table Format

- Open source table format **originated by Databricks**
- Adds a **transaction log and metadata layer** on top of Parquet files
- Provides ACID, Time Travel, Schema Evolution, CDC, and Change Data Feed

```sql
-- Databricks SQL example
CREATE TABLE sales_delta
USING DELTA
LOCATION '/mnt/datalake/sales_delta' AS
SELECT * FROM raw_sales;

-- Time Travel
SELECT * FROM sales_delta VERSION AS OF 5;

-- CDC / Change Data Feed
SELECT * FROM table_changes('sales_delta', 5, 10);
```

**Open Source Delta Lake vs Databricks**

- **Open source Delta Lake**
  - Core ACID, Time Travel, Schema Evolution
  - Readable from many engines (Spark, Flink, Trino, Snowflake, etc.)
- **On Databricks**
  - Photon + Delta for very fast SQL
  - Deep integration with Delta Live Tables / Lakeflow for data quality rules
  - Centralized governance, lineage, and tagging via Unity Catalog

### 3. MLflow – ML Lifecycle Management

- Covers the full ML lifecycle: experiments, metrics, artifacts, models, registry
- A fully open source project; Databricks runs it as a **managed control plane**

```python
import mlflow
import mlflow.sklearn

with mlflow.start_run() as run:
    model = train_model(train_df)
    metrics = evaluate(model, test_df)

    mlflow.log_params({"max_depth": 5, "n_estimators": 100})
    mlflow.log_metrics(metrics)

    mlflow.sklearn.log_model(model, "model")
```

**Open Source MLflow vs Databricks**

- **Open source**: You host the tracking server, back-end DB, and artifact storage yourself.
- **On Databricks**:
  - Experiments, runs, and models are integrated into the workspace
  - Model registry is tied into Unity Catalog (permissions, lineage, audit)
  - First‑class integrations with Feature Store and Model Serving

---

## 🧭 Unity Catalog and Data Governance

### What is Unity Catalog?

- Databricks’ **unified governance layer** for data and AI
- Attaches **permissions, lineage, and tags** to catalogs, schemas, tables, views, models, and features
- Recently **open sourced**, evolving into a multi‑engine, multi‑format catalog

```sql
-- Unity Catalog namespace example
-- catalog.schema.table

CREATE CATALOG prod;
CREATE SCHEMA prod.sales;

CREATE TABLE prod.sales.orders
USING DELTA
LOCATION 's3://lakehouse/prod/sales/orders';

GRANT SELECT ON TABLE prod.sales.orders TO `analyst_role`;
```

### Core Capabilities of Unity Catalog

- **Centralized access control**
  - Permissions at catalog / schema / table / column level
  - One security model across SQL, Python, R, and Scala
- **Data lineage**
  - Automatic tracking of how tables are produced from sources
  - Lineage can extend all the way to BI dashboards and ML models
- **Data quality and policy integration**
  - Quality expectations from Delta Live Tables / Lakeflow stored as UC metadata
  - Policy changes and audit logs exposed via system tables

```sql
-- Example: Query audit logs from Unity Catalog system tables
SELECT *
FROM system.access.audit
WHERE principal = 'analyst_role'
  AND object_name = 'prod.sales.orders'
  AND action_name = 'SELECT';
```

---

## 🧱 Databricks and dbt: Clear Separation of Responsibilities

### What Databricks Is Good At

- **Platform layer**
  - Cluster and workspace management, storage integration, governance (UC)
- **Engine layer**
  - Spark Runtime, Photon, Delta Lake
- **Workflow layer**
  - Databricks Workflows, Delta Live Tables / Lakeflow

### What dbt Is Good At

- **Modeling and transformation logic (the T in ELT)**
  - SQL-based model definitions
  - Reusable patterns via Jinja and macros
- **Testing and documentation**
  - Tests and descriptions via `schema.yml`
  - Auto-generated docs site
- **Environment management**
  - Clean separation of dev / staging / prod

```sql
-- dbt model example: models/sales/orders_daily.sql

{{ config(materialized='table') }}

WITH base AS (
    SELECT
        order_id,
        user_id,
        total_amount,
        order_date
    FROM {{ ref('raw_orders') }}
    WHERE status = 'COMPLETED'
),
daily AS (
    SELECT
        order_date,
        COUNT(*)         AS order_count,
        SUM(total_amount) AS total_revenue
    FROM base
    GROUP BY order_date
)

SELECT * FROM daily;
```

```yaml
# tests & docs: models/sales/schema.yml

version: 2

models:
  - name: orders_daily
    description: "Daily order counts and revenue"
    columns:
      - name: order_date
        tests:
          - not_null
      - name: order_count
        tests:
          - not_null
          - greater_than: 0
      - name: total_revenue
        tests:
          - not_null
```

### Databricks + dbt Integration Pattern

- **Data layer**
  - S3/ADLS/GCS + Delta Lake + Unity Catalog
- **Transform layer**
  - Databricks SQL Warehouse or all‑purpose clusters as dbt targets
- **Governance**
  - dbt‑created tables/views are registered in Unity Catalog
  - Permissions, lineage, and tags are managed in Unity Catalog

```yaml
# dbt profiles.yml example (Databricks)

databricks_lakehouse:
  target: prod
  outputs:
    prod:
      type: databricks
      catalog: prod            # Unity Catalog
      schema: analytics
      host: adb-123.45.azuredatabricks.net
      http_path: /sql/1.0/warehouses/xxxx
      token: "{{ env_var('DATABRICKS_TOKEN') }}"
      threads: 8
```

---

## 🧪 Pipelines & Quality: Delta Live Tables / Lakeflow

Databricks is moving toward **declarative pipelines** via **Lakeflow / Delta Live Tables (DLT)**, where **data quality expectations** become first‑class metadata on tables.

### Declarative Pipelines

```python
import dlt
from pyspark.sql.functions import *

@dlt.table(
    name="raw_orders",
    comment="Raw order data",
)
def raw_orders():
    return (
        spark.readStream
             .format("cloudFiles")
             .option("cloudFiles.format", "json")
             .load("/mnt/raw/orders")
    )

@dlt.table(
    name="clean_orders",
    comment="Validated and cleaned order data",
)
@dlt.expect("valid_amount", "amount >= 0")
@dlt.expect_or_drop("valid_status", "status IN ('CREATED','COMPLETED','CANCELLED')")
def clean_orders():
    return (
        dlt.read("raw_orders")
           .withColumn("order_ts", to_timestamp("order_time"))
    )
```

### Integrating Expectations with Unity Catalog

- DLT/Lakeflow **expectations** are stored as Unity Catalog table metadata
- Quality rules become **versioned, auditable, and discoverable**
- Governance teams can manage quality as **policy**, not hidden code

---

## 🛡 Databricks Through a Governance Lens

Databricks governance is designed as **end‑to‑end governance**, not just basic table permissions.

### 1. Data Governance

- Unity Catalog: fine‑grained permissions (catalog / schema / table / column)
- Lineage: from raw sources through pipelines to reports and ML models
- Policy‑based access control (tag/label‑based masking, etc.)

### 2. ML Governance

- MLflow integrated with Unity Catalog
- Model registry with versions and stages (prod / staging / dev)
- Feature Store for reusable, governed features

### 3. Audit & Compliance

- System tables expose **access logs, policy changes, and pipeline definition changes**
- Designed to support regulated industries (financial services, healthcare, etc.)

---

## 📌 How to Think About Databricks

### Databricks is…

1. **A commercial lakehouse platform built on open source**
   - Apache Spark, Delta Lake, MLflow, and open‑sourced Unity Catalog
2. **An enterprise‑grade data & AI operations platform**
   - Central place for permissions, lineage, quality, and audit
3. **A hub in a larger ecosystem with dbt, Airflow, Fivetran, etc.**
   - Databricks is the “platform”; dbt is the “modeling & transformation DSL”

### Closing Thoughts

- If you see Databricks only as a “Spark notebook service”, you’re missing half the story.
- The real question is **which open source components are combined in which way to solve which problems** – especially governance, operations, and productivity.
- In real projects, **combinations** matter:
  - Databricks + dbt + Fivetran + Power BI
  - Databricks + Airflow/Dagster + MLflow + Feature Store

Going forward, the open sourcing of Unity Catalog and interoperability across table formats like Iceberg/Delta/Hudi will matter even more.  
Hopefully this guide helps you see the Databricks ecosystem as a whole, rather than just one tool in isolation.

