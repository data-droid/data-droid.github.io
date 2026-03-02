---
layout: post
lang: ko
title: "Databricks 생태계 완전 정리 - 오픈소스 기반과 거버넌스까지"
description: "Databricks가 데이터 수집·저장·분석·머신러닝·거버넌스를 어떻게 통합하고 있는지, 어떤 오픈소스를 기반으로 하는지, 그리고 dbt·Unity Catalog와의 연계를 중심으로 정리합니다."
date: 2026-03-02
author: Data Droid
category: data-engineering
tags: [Databricks, Lakehouse, Delta-Lake, Apache-Spark, MLflow, Unity-Catalog, dbt, 데이터거버넌스]
reading_time: "45분"
difficulty: "중급"
---

# Databricks 생태계 완전 정리 - 오픈소스 기반과 거버넌스까지

> **"Databricks는 레이크하우스를 중심으로 데이터 수집부터 분석·ML·거버넌스까지 올인원 플랫폼을 제공하지만, 그 밑바닥에는 잘 알려진 오픈소스들이 있다."**

이 글에서는 Databricks를 단순히 "관리형 Spark"가 아니라, **어떤 오픈소스를 기반으로 한 통합 데이터·AI 플랫폼인지** 관점에서 정리합니다.  
또한 **데이터 거버넌스(특히 Unity Catalog)**와 **dbt와의 역할 분담**까지 함께 살펴봅니다.

---

## 📚 큰 그림: Databricks 레이어 구조

먼저 Databricks를 **레이어별로** 나누어 보면 이해가 쉽습니다.

```
사용자 레벨 (User & Tools)
 ├─ Notebooks, Dashboards, SQL Editor
 ├─ Databricks SQL / Databricks Workflows
 ├─ 파트너 도구: dbt, Power BI, Tableau, Looker, Fivetran, Airflow 등
 └─ REST / SDK / JDBC/ODBC

엔진 & 런타임 레벨 (Runtime & Engines)
 ├─ Apache Spark (Databricks Runtime에 최적화)
 ├─ Photon (C++ 기반 벡터화 쿼리 엔진, 상용)
 ├─ ML Runtime (Spark + ML 라이브러리 번들)
 └─ Databricks Model Serving / Vector Search

스토리지 & 메타데이터 레벨 (Storage & Metadata)
 ├─ Delta Lake (오픈소스 테이블 포맷)
 ├─ Unity Catalog (카탈로그 & 권한 & 계보, 최근 오픈소스화)
 └─ 클라우드 스토리지 (S3, ADLS, GCS 등)

워크플로우 & 품질 레벨 (Orchestration & Quality)
 ├─ Databricks Workflows (잡/파이프라인 스케줄링)
 ├─ Delta Live Tables / Lakeflow (선언적 파이프라인, 데이터 품질)
 └─ dbt, Airflow, Dagster 등 외부 오케스트레이터와 통합

ML & MLOps 레벨 (ML & MLOps)
 ├─ MLflow (실험, 모델, 레지스트리 - 오픈소스)
 ├─ Feature Store, AutoML
 └─ Model Serving, Monitoring
```

이제 각 레이어별로 **어떤 오픈소스를 기반**으로 하는지, Databricks가 그 위에 **어떤 기능을 추가**했는지 살펴보겠습니다.

---

## 🔧 핵심 오픈소스 3대장: Spark, Delta Lake, MLflow

### 1. Apache Spark - 분산 처리 엔진

- Databricks의 출발점이자 핵심 엔진
- 배치, 스트리밍, SQL, ML, 그래프를 하나의 엔진으로 처리
- Databricks는 **Databricks Runtime(DXR)** 에서 Spark를 최적화(성능 패치, 안정성, 커넥터 등)

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

**Spark 오픈소스 vs Databricks 차이**

- **오픈소스 Spark**: 순정 엔진, 클러스터·옵션·튜닝을 직접 해야 함
- **Databricks Runtime**:
  - 자동 클러스터 스케일링, 자동 옵티마이저 튜닝
  - Photon과 결합된 고성능 SQL
  - Unity Catalog와 통합된 권한 관리

### 2. Delta Lake - 레이크하우스 테이블 포맷

- Databricks가 주도한 **오픈소스 테이블 포맷**
- 파일 포맷(Parquet) 위에 **트랜잭션 로그 + 메타데이터 레이어**를 올린 구조
- ACID, Time Travel, Schema Evolution, CDC, Change Data Feed 등을 제공

```sql
-- Databricks SQL 예시
CREATE TABLE sales_delta
USING DELTA
LOCATION '/mnt/datalake/sales_delta' AS
SELECT * FROM raw_sales;

-- Time Travel
SELECT * FROM sales_delta VERSION AS OF 5;

-- CDC / Change Data Feed
SELECT * FROM table_changes('sales_delta', 5, 10);
```

**Delta Lake 오픈소스 vs Databricks 기능**

- **오픈소스 Delta Lake**
  - 기본 ACID, Time Travel, Schema Evolution
  - 다양한 엔진(Spark, Flink, Trino, Snowflake 등)에서 읽기 가능
- **Databricks**
  - Photon + Delta 조합으로 고성능 쿼리
  - Delta Live Tables / Lakeflow에서 품질 규칙과 함께 사용
  - Unity Catalog 기반 중앙 거버넌스, 계보, 태깅

### 3. MLflow - ML 라이프사이클 관리

- 실험 관리, 모델 등록, 아티팩트 관리, 서빙까지 전체 ML 라이프사이클 담당
- 완전한 오픈소스 프로젝트이며, Databricks는 이를 **매니지드 서비스로 제공**

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

**MLflow 오픈소스 vs Databricks**

- **오픈소스**: 직접 서버 띄우고 백엔드 스토리지/아티팩트 스토리지 구성 필요
- **Databricks**:
  - 워크스페이스와 통합된 실험/모델/등록
  - Unity Catalog와 통합된 모델 레지스트리(권한·계보·감사)
  - Model Serving, Feature Store와 연결

---

## 🧭 Unity Catalog와 데이터 거버넌스

### Unity Catalog란?

- Databricks의 **통합 데이터 & AI 거버넌스 계층**
- 카탈로그, 스키마, 테이블, 뷰, 모델, 피처 등 **모든 오브젝트에 권한·계보·태그**를 부여
- 최근에는 **오픈소스로 공개**되어, 멀티 엔진/멀티 포맷 카탈로그로 발전 중

```sql
-- Unity Catalog 네임스페이스 예시
-- catalog.schema.table

CREATE CATALOG prod;
CREATE SCHEMA prod.sales;

CREATE TABLE prod.sales.orders
USING DELTA
LOCATION 's3://lakehouse/prod/sales/orders';

GRANT SELECT ON TABLE prod.sales.orders TO `analyst_role`;
```

### Unity Catalog의 핵심 기능

- **중앙 권한 관리**
  - 카탈로그/스키마/테이블/컬럼 레벨 권한
  - SQL, Python, R, Scala를 모두 같은 정책으로 관리
- **데이터 계보(Lineage)**
  - 어떤 테이블이 어떤 소스에서 어떻게 만들어졌는지 자동 추적
  - BI 리포트/ML 모델까지 계보를 연결
- **데이터 품질/정책 통합**
  - Delta Live Tables / Lakeflow의 quality expectations를 UC 메타데이터로 관리
  - 정책 변경 이력과 감사 로그를 시스템 테이블로 조회

```sql
-- 예: Unity Catalog 시스템 테이블에서 감사 로그 조회
SELECT *
FROM system.access.audit
WHERE principal = 'analyst_role'
  AND object_name = 'prod.sales.orders'
  AND action_name = 'SELECT';
```

---

## 🧱 Databricks와 dbt: 역할 분담

### Databricks가 잘하는 일

- **플랫폼 레벨**
  - 클러스터/워크스페이스 관리, 스토리지 통합, 거버넌스(UC)
- **엔진 레벨**
  - Spark Runtime, Photon, Delta Lake
- **워크플로우**
  - Databricks Workflows, Delta Live Tables / Lakeflow

### dbt가 잘하는 일

- **모델링과 변환 로직(T in ELT)**
  - SQL 기반 모델 정의
  - Jinja + macro를 활용한 재사용 가능한 모델 패턴
- **테스트 & 문서화**
  - schema.yml을 통한 test/description 관리
  - docs 사이트 자동 생성
- **환경 관리**
  - dev/staging/prod 환경별 설정 분리

```yaml
# dbt 모델 예시: models/sales/orders_daily.sql

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
        COUNT(*)       AS order_count,
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
    description: "일자별 주문 수 및 매출 집계 테이블"
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

### Databricks + dbt 통합 패턴

- **데이터 레이어**
  - S3/ADLS/GCS + Delta Lake + Unity Catalog
- **변환 레이어**
  - Databricks SQL Warehouse or All-Purpose Cluster를 dbt의 target으로 사용
- **거버넌스**
  - dbt가 생성하는 테이블/뷰를 Unity Catalog에 등록
  - 권한·계보·태그는 Unity Catalog에서 관리

```yaml
# dbt profiles.yml 예시 (Databricks)

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

## 🧪 파이프라인 & 품질: Delta Live Tables / Lakeflow

Databricks는 최근 **Lakeflow / Delta Live Tables(DLT)**를 통해 파이프라인을 **선언적으로 정의**하고, **데이터 품질 기대치(expectations)**를 직접 테이블 메타데이터로 관리하는 방향으로 진화하고 있습니다.

### 선언적 파이프라인

```python
import dlt
from pyspark.sql.functions import *

@dlt.table(
    name="raw_orders",
    comment="원시 주문 데이터",
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
    comment="검증 및 정제된 주문 데이터",
)
@dlt.expect("valid_amount", "amount >= 0")
@dlt.expect_or_drop("valid_status", "status IN ('CREATED','COMPLETED','CANCELLED')")
def clean_orders():
    return (
        dlt.read("raw_orders")
           .withColumn("order_ts", to_timestamp("order_time"))
    )
```

### Unity Catalog와 품질 규칙의 통합

- DLT/Lakeflow의 **expectations**가 Unity Catalog의 테이블 메타데이터로 저장
- 품질 규칙이 **버전 관리 가능**하고 **감사 및 추적 가능**
- 거버넌스 팀이 **정책으로 품질 규칙을 관리**할 수 있는 구조

---

## 🛡 거버넌스 관점에서 본 Databricks

Databricks의 거버넌스는 단순 권한 제어를 넘어서 **엔드투엔드 거버넌스**를 지향합니다.

### 1. 데이터 거버넌스

- Unity Catalog: 카탈로그·스키마·테이블·컬럼 단위 권한
- 데이터 계보: 파이프라인·리포트·모델까지 추적
- 정책 기반 접근 제어(태그/라벨 기반 마스킹 등)

### 2. ML 거버넌스

- MLflow + Unity Catalog 통합
- 모델 레지스트리, 버전, 스테이지(prod/staging/dev)
- Feature Store와 함께 재사용 가능한 피처 관리

### 3. 감사 & 규제 준수

- 시스템 테이블에서 **접근 로그/정책 변경/파이프라인 변경 이력 조회**
- 금융·헬스케어 등 규제 산업에서도 레이크하우스 사용 가능하도록 설계

---

## 📌 정리: Databricks를 어떻게 바라볼 것인가?

### Databricks는…

1. **오픈소스 위에 구축된 상용 레이크하우스 플랫폼**
   - Apache Spark, Delta Lake, MLflow, (오픈소스화된) Unity Catalog
2. **엔터프라이즈급 거버넌스를 갖춘 데이터·AI 운영 플랫폼**
   - 권한, 계보, 품질, 감사까지 한 곳에서 관리
3. **dbt·Airflow·Fivetran 등과 공존하는 생태계의 허브**
   - Databricks는 "플랫폼", dbt는 "모델링 & 변환 DSL"에 집중

### 글을 마치며

- Databricks를 그냥 "Spark Notebook 서비스"로 보면 절반만 보는 것입니다.
- **어떤 오픈소스들을 어떻게 조합해서, 어떤 문제(거버넌스·운영·생산성)를 풀고 있는지** 관점에서 보면 훨씬 이해가 잘 됩니다.
- 실제 프로젝트에서는 **조합**이 중요합니다.
  - Databricks + dbt + Fivetran + Power BI
  - Databricks + Airflow/Dagster + MLflow + Feature Store

향후에는 Unity Catalog의 오픈소스화와 Iceberg/Delta/Hudi 같은 테이블 포맷 간 상호운용성이 더 중요해질 것입니다.  
이 글이 Databricks 생태계를 전체 그림에서 이해하는 데 도움이 되었다면 좋겠습니다.

