---
layout: post
title: "Unity Catalog and dbt Deep Dive - Lakehouse Governance Best Practices"
description: "Deep dive into how to combine Unity Catalog and dbt for lakehouse governance: namespaces, permission models, environment strategy, tests vs policies, and lineage."
excerpt: "Best practices for designing lakehouse governance with Unity Catalog and dbt: architecture, permissions, environments, and lineage"
category: data-engineering
tags: [Unity-Catalog, dbt, Databricks, Lakehouse, Data-Governance, Data-Lineage, Data-Quality]
date: 2026-03-06
author: Data Droid
lang: en
reading_time: 50 min
difficulty: Advanced
---

# Unity Catalog and dbt Deep Dive - Lakehouse Governance Best Practices

> **"Between 'we can do everything in Databricks' and 'we can do everything in dbt,' there's a practical balance worth finding."**

When using Databricks, you often run into questions like:

- **We use dbt – why do we need Unity Catalog?**
- **We manage permissions with Unity Catalog – how far should we go with dbt's `schema.yml` tests and docs?**
- **How should we name catalogs/schemas/tables so environment separation stays clean?**

This post dives deep into **architecture, governance, and patterns** when using **Unity Catalog (UC)** and **dbt** together, from a practical standpoint.

---

## 📚 Table of Contents

1. [Role Split: Unity Catalog vs dbt](#role-split-unity-catalog-vs-dbt)
2. [Namespace Design: catalog.schema.table Strategy](#namespace-design-catalogschematable-strategy)
3. [Permission Model: Mapping UC Permissions to dbt Roles](#permission-model-mapping-uc-permissions-to-dbt-roles)
4. [Environment Separation: dev / staging / prod](#environment-separation-dev--staging--prod)
5. [Where dbt Tests End and Unity Catalog Policies Begin](#where-dbt-tests-end-and-unity-catalog-policies-begin)
6. [Lineage and the Catalog: Connecting dbt, UC, and BI](#lineage-and-the-catalog-connecting-dbt-uc-and-bi)
7. [Practical Pattern: Domain-Centric Lakehouse + dbt Project](#practical-pattern-domain-centric-lakehouse--dbt-project)
8. [Checklist Summary](#checklist-summary)

---

## 🎭 Role Split: Unity Catalog vs dbt {#role-split-unity-catalog-vs-dbt}

It helps to **clearly separate roles** so the two tools don’t overlap in confusing ways.

### Unity Catalog’s Domain

- **Who can see what?**
  - Catalog / schema / table / column permissions
  - Row- and column-level security, data masking
- **Where did the data come from and where does it go?**
  - Lineage, system tables, audit logs
- **Organization-wide source of truth**
  - e.g. “`prod.analytics.orders` is our official orders mart”

### dbt’s Domain

- **How should data be transformed?**
  - SQL-based modeling, Jinja macros
- **How do we enforce model quality?**
  - `schema.yml` tests, documentation, docs site
- **Data team productivity**
  - Developer experience, review/deploy/rollback workflows

> **Summary**
>
> - **Unity Catalog**: Security, governance, lineage, and official object definitions
> - **dbt**: Transformation logic, quality, and domain modeling

Treat them as **complementary**, not competing: each fills gaps the other doesn’t.

---

## 🧭 Namespace Design: `catalog.schema.table` Strategy {#namespace-design-catalogschematable-strategy}

Unity Catalog uses a three-level namespace.

```sql
-- catalog.schema.table
SELECT * FROM prod.analytics.orders;
```

### Three Common Patterns

1. **Catalog = environment, schema = domain**
   - e.g. `dev.analytics.orders`, `prod.analytics.orders`
   - Pros: Strong isolation per environment, intuitive permission model
   - Cons: More catalogs as environments grow

2. **Catalog = domain, schema = layer (raw/stg/mart)** (recommended)
   - e.g. `analytics.raw.orders_raw`, `analytics.mart.orders`
   - Environment separation handled via dbt profile / job config
   - Pros: Domain-centric design, easy for BI/ML to reference

3. **Catalog = organization/platform, schema = domain + environment**
   - e.g. `corp.analytics_prod.orders`, `corp.analytics_dev.orders`
   - Similar to legacy data warehouse naming

### What Fits dbt Best

dbt naturally works with **layer-based schemas**:

```yaml
# dbt project config example (dbt_project.yml)

models:
  my_project:
    raw:
      +schema: raw
    staging:
      +schema: stg
    marts:
      +schema: mart
```

The best fit is:

- **Catalog = domain** (e.g. analytics, marketing)
- **Schema = layer** (raw, stg, mart)

Examples:

- `analytics.raw.events_raw`
- `analytics.stg.events_staging`
- `analytics.mart.events_sessionized`

---

## 🔐 Permission Model: Mapping UC Permissions to dbt Roles {#permission-model-mapping-uc-permissions-to-dbt-roles}

### Basics of Unity Catalog Permissions

- **Principal**: User, group, or service principal
- **Object**: Catalog, schema, table, view, function, volume, etc.
- **Privileges**: `USAGE`, `SELECT`, `MODIFY`, `OWNERSHIP`, `APPLY TAG`, `EXECUTE`, etc.

```sql
-- Example: analytics catalog and mart schema
GRANT USAGE ON CATALOG analytics TO `analytics_readonly`;
GRANT USAGE ON SCHEMA analytics.mart TO `analytics_readonly`;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics.mart TO `analytics_readonly`;
```

### Aligning with dbt “Roles”

Typical dbt-side roles:

- `analytics_dev`: developers
- `analytics_ci`: CI/CD pipeline
- `analytics_reader`: reporting / analytics (read-only)

Map these to Unity Catalog groups or service principals:

```sql
-- Developer permissions
GRANT USAGE ON CATALOG analytics TO `grp_analytics_dev`;
GRANT USAGE, CREATE ON SCHEMA analytics.raw TO `grp_analytics_dev`;
GRANT USAGE, CREATE, MODIFY ON SCHEMA analytics.stg TO `grp_analytics_dev`;
GRANT USAGE, SELECT ON SCHEMA analytics.mart TO `grp_analytics_dev`;

-- Read-only
GRANT USAGE ON CATALOG analytics TO `grp_analytics_reader`;
GRANT USAGE ON SCHEMA analytics.mart TO `grp_analytics_reader`;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics.mart TO `grp_analytics_reader`;
```

> **Pattern**
>
> - **dbt execution** (CI/Job) usually uses a **machine account** like `grp_analytics_ci`
> - People (analysts, engineers) get separate groups with least-privilege access

---

## 🌱 Environment Separation: dev / staging / prod {#environment-separation-dev--staging--prod}

You can separate environments in two main ways:

1. **At the Unity Catalog level**
   - e.g. `dev_analytics`, `stg_analytics`, `prod_analytics`
2. **At the dbt profile / job level**
   - Same UC catalog, different schema / storage / cluster

### 1) Catalog-Based Environment Separation

```sql
CREATE CATALOG dev_analytics;
CREATE CATALOG prod_analytics;
```

```yaml
# profiles.yml (catalog-based)

databricks_uc:
  target: dev
  outputs:
    dev:
      type: databricks
      catalog: dev_analytics
      schema: mart
      ...
    prod:
      type: databricks
      catalog: prod_analytics
      schema: mart
      ...
```

- Pros: Strong isolation, lower risk of touching prod by mistake
- Cons: More catalogs, more permission/policy management

### 2) Shared Catalog + Schema/Storage Separation (common pattern)

```sql
-- Single analytics catalog
CREATE CATALOG analytics;

-- Per-environment schemas
CREATE SCHEMA analytics.mart_dev;
CREATE SCHEMA analytics.mart_prod;
```

```yaml
# profiles.yml (schema-based)

databricks_uc:
  target: dev
  outputs:
    dev:
      type: databricks
      catalog: analytics
      schema: mart_dev
      ...
    prod:
      type: databricks
      catalog: analytics
      schema: mart_prod
      ...
```

- Pros: Domain-centric catalog, easy for BI/ML to reference
- Cons: More schemas/tables; naming rules must be followed

> **Practical tip**
>
> - **Small teams**: Catalog = domain, schema = raw/stg/mart; separate environments via profile/workspace
> - **Larger enterprises**: Often mix in **catalog = environment** for compliance

---

## ✅ Where dbt Tests End and Unity Catalog Policies Begin {#where-dbt-tests-end-and-unity-catalog-policies-begin}

Both tools touch “quality” and “policy,” so it’s useful to draw a line: **dbt for what, UC/platform for what.**

### dbt’s Responsibility

- **Logical model quality**
  - `not_null`, `unique`, `accepted_values`, `relationships`, etc.
- **Domain rules**
  - e.g. `status IN ('COMPLETED','CANCELLED')`
  - e.g. `order_date <= current_date`
- **Documentation**
  - Column descriptions, business definitions, examples

```yaml
version: 2

models:
  - name: orders
    description: "Fact table of orders from the application"
    columns:
      - name: order_id
        tests:
          - not_null
          - unique
      - name: status
        tests:
          - accepted_values:
              values: ['CREATED', 'COMPLETED', 'CANCELLED']
```

### Unity Catalog / Platform’s Responsibility

- **Access control, masking, filtering**
  - PII, PHI, financial data, etc.
- **Audit and compliance**
  - Who accessed what, when
- **Organization-wide policy**
  - e.g. “SSN must always be masked for US residents”

```sql
-- Conceptual example: tag-based masking in UC

ALTER TABLE prod.analytics.customers
  ALTER COLUMN ssn
  SET TAGS ('classification' = 'pii');

CREATE MASKING POLICY mask_pii AS
  (value STRING) RETURNS STRING ->
    CASE
      WHEN current_role() IN ('pii_approved_role') THEN value
      ELSE '***-**-****'
    END;

APPLY MASKING POLICY mask_pii
ON prod.analytics.customers.ssn;
```

> **Summary**
>
> - **dbt**: “Is the data correct?” (logical and domain quality)
> - **Unity Catalog**: “Who can see what?” (security and compliance)

---

## 🔗 Lineage and the Catalog: Connecting dbt, UC, and BI {#lineage-and-the-catalog-connecting-dbt-uc-and-bi}

### Lineage in dbt

- **Model dependency graph** via `dbt docs` and `dbt meta`
- Developer view: “Which raw sources feed this mart table?”

### Lineage in Unity Catalog

- UC captures lineage at **engine/query level**
  - SQL Warehouse, Notebooks, Workflows, BI tools, etc.
- Organization view: “Which reports, models, or notebooks use this table/view?”

```sql
-- Conceptual example: UC lineage (actual view/API may vary by version)
SELECT *
FROM system.lineage.relations
WHERE downstream_object = 'analytics.mart.orders';
```

### Using Both Together

- **dbt**: “Code-level” lineage for developers
- **Unity Catalog**: “Platform-level” lineage for security, governance, and BI/ML owners

Treat the two lineage views as **complementary**, serving different audiences, rather than redundant.

---

## 🧩 Practical Pattern: Domain-Centric Lakehouse + dbt Project {#practical-pattern-domain-centric-lakehouse--dbt-project}

### Example Domain: `analytics` Lakehouse

**1. Unity Catalog setup**

```sql
CREATE CATALOG analytics;

CREATE SCHEMA analytics.raw;
CREATE SCHEMA analytics.stg;
CREATE SCHEMA analytics.mart;
```

**2. dbt project structure**

```text
models/
  raw/
    raw_events.sql
  staging/
    stg_events.sql
  marts/
    fct_sessions.sql
    dim_users.sql
```

```yaml
# dbt_project.yml (summary)

models:
  analytics_dbt:
    raw:
      +schema: raw
    staging:
      +schema: stg
    marts:
      +schema: mart
```

**3. Connect to UC via profiles.yml**

```yaml
analytics_dbt:
  target: dev
  outputs:
    dev:
      type: databricks
      catalog: analytics
      schema: mart_dev
      host: adb-123.45.azuredatabricks.net
      http_path: /sql/1.0/warehouses/abc
      token: "{{ env_var('DATABRICKS_TOKEN_DEV') }}"
      threads: 8
    prod:
      type: databricks
      catalog: analytics
      schema: mart
      host: adb-123.45.azuredatabricks.net
      http_path: /sql/1.0/warehouses/xyz
      token: "{{ env_var('DATABRICKS_TOKEN_PROD') }}"
      threads: 16
```

**4. Permissions / governance**

```sql
-- Developer group
GRANT USAGE ON CATALOG analytics TO `grp_analytics_dev`;
GRANT USAGE, CREATE, MODIFY ON SCHEMA analytics.raw TO `grp_analytics_dev`;
GRANT USAGE, CREATE, MODIFY ON SCHEMA analytics.stg TO `grp_analytics_dev`;
GRANT USAGE, SELECT ON SCHEMA analytics.mart TO `grp_analytics_dev`;

-- Reader group (read-only)
GRANT USAGE ON CATALOG analytics TO `grp_analytics_reader`;
GRANT USAGE ON SCHEMA analytics.mart TO `grp_analytics_reader`;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics.mart TO `grp_analytics_reader`;
```

**5. Quality and lineage**

- **dbt**: Column-level quality rules and descriptions in `schema.yml`
- **Unity Catalog**: Tags/labels for sensitivity, ownership, data domain; system tables and Lineage UI for end-to-end lineage

---

## 🧾 Checklist Summary {#checklist-summary}

**1. Role definition**

- [ ] Unity Catalog: security, permissions, lineage, compliance
- [ ] dbt: modeling, transformation logic, tests, documentation

**2. Namespace / environment strategy**

- [ ] `catalog.schema.table` designed in a domain-centric way?
- [ ] Decided whether dev/stg/prod are separated by catalog vs schema/workspace?

**3. Permission model**

- [ ] dbt execution (machine) account separate from human accounts?
- [ ] UC permissions designed around groups/roles?

**4. Quality and policy**

- [ ] Domain rules and model quality in dbt tests?
- [ ] Security, masking, and compliance in UC/platform?

**5. Lineage and observability**

- [ ] Lineage visible in both dbt and Unity Catalog?
- [ ] Change history traceable via system tables and logs?

---

> **"Unity Catalog and dbt are not replacements for each other – they fill each other’s gaps in the lakehouse."**

Use UC for **organization-wide governance and safe data access**, and dbt for **domain logic, tests, and documentation**. That way, data and governance teams can collaborate without stepping on each other’s toes.  
Use this post as a reference to design a UC + dbt pattern that fits your team.
