---
layout: post
lang: ko
title: "Snowflake 아키텍처와 Databricks 비교 - 어떤 경우에 무엇을 쓸 것인가"
description: "Snowflake의 전체 플랫폼 아키텍처와 Databricks를 비교하고, 포지셔닝 차이와 사례별 추천, 함께 쓰는 패턴을 정리합니다."
date: 2026-03-09
author: Data Droid
category: data-engineering
tags: [Snowflake, Databricks, Lakehouse, Data-Warehouse, 클라우드데이터플랫폼, 데이터아키텍처]
reading_time: "45분"
difficulty: "중급"
---

# Snowflake 아키텍처와 Databricks 비교 - 어떤 경우에 무엇을 쓸 것인가

> **"Snowflake와 Databricks는 포지션이 다르다. 1:1 승자 비교보다, 언제 무엇을 쓸지 선택 기준을 갖는 것이 중요하다."**

Snowflake는 **클라우드 네이티브 데이터 웨어하우스**, Databricks는 **레이크하우스 기반 통합 데이터·AI 플랫폼**입니다. 둘 다 대용량 데이터를 다루지만, 설계 철학과 강점이 달라 **어떤 상황에서 무엇을 선택할지** 기준을 갖는 것이 실무에 도움이 됩니다.  
이 글에서는 Snowflake의 아키텍처를 먼저 정리하고, Databricks와의 포지셔닝 차이, 사례별 추천, 함께 쓰는 패턴을 살펴봅니다.

---

## 📚 목차

1. [Snowflake 플랫폼 아키텍처](#snowflake-플랫폼-아키텍처)
2. [Databricks 아키텍처 요약](#databricks-아키텍처-요약)
3. [포지셔닝·강점 비교](#포지셔닝강점-비교)
4. [사례별 추천: 언제 무엇을 쓸 것인가](#사례별-추천-언제-무엇을-쓸-것인가)
5. [함께 쓰는 패턴](#함께-쓰는-패턴)
6. [정리](#정리)

---

## 🏗️ Snowflake 플랫폼 아키텍처 {#snowflake-플랫폼-아키텍처}

### 큰 그림: 3레이어 분리

Snowflake는 처음부터 **스토리지·컴퓨팅·서비스**를 분리한 설계입니다.

```
┌─────────────────────────────────────────────────────────────┐
│  서비스 레이어 (Cloud Services)                              │
│  인증, 메타데이터, 쿼리 최적화, 웨어하우스 관리              │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│  컴퓨팅 레이어 (Virtual Warehouses)                          │
│  쿼리 실행, DML, 데이터 로드·언로드                          │
└─────────────────────────────────────────────────────────────┘
                              ↑
┌─────────────────────────────────────────────────────────────┐
│  스토리지 레이어 (S3 / Azure Blob / GCS)                     │
│  실제 데이터 저장, 자동 압축·파티셔닝                        │
└─────────────────────────────────────────────────────────────┘
```

### 1. 스토리지 레이어

- **클라우드 객체 스토리지** (S3, Azure Blob, GCS)에 데이터 저장
- **자동 압축·마이크로 파티셔닝**: 사용자가 파티션을 직접 지정할 필요 없음
- **비용**: 저장된 용량만 과금 (컴퓨팅은 별도)
- **Zero Copy Clone**: 테이블/스키마/DB 복제 시 실제 복사 없이 메타데이터만 복제 → 빠른 dev/staging 생성

```sql
-- Zero Copy Clone 예시
CREATE DATABASE analytics_dev CLONE analytics_prod;
CREATE SCHEMA analytics_dev.staging CLONE analytics_prod.staging;
```

### 2. 컴퓨팅 레이어 (가상 웨어하우스)

- **Virtual Warehouse** = 쿼리 실행 단위
- 크기: X-Small ~ 6X-Large, 멀티 클러스터 웨어하우스로 자동 스케일 아웃
- **자동 서스펜드/리즘**: 유휴 시 일정 시간 후 정지, 다음 쿼리 시 자동 재시작
- **채움 모드**: 동시 쿼리 많을 때 큐잉 또는 추가 클러스터 스핀업

```sql
-- 웨어하우스 예시
CREATE WAREHOUSE analytics_wh
  WITH
  WAREHOUSE_SIZE = 'MEDIUM'
  AUTO_SUSPEND = 300
  AUTO_RESUME = TRUE
  MIN_CLUSTER_COUNT = 1
  MAX_CLUSTER_COUNT = 4
  SCALING_POLICY = 'STANDARD';
```

### 3. 서비스 레이어 (Cloud Services)

- **메타데이터 관리**: 테이블, 스키마, DB, 권한
- **쿼리 최적화·실행 계획**: 사용자가 웨어하우스를 지정하지 않으면 적절한 것으로 자동 라우팅
- **보안·인증**: SSO, RBAC, 네트워크 정책

### 4. Snowflake의 특징적인 기능

- **데이터 공유 (Data Sharing)**  
  - 계정 간 데이터 공유 시 실제 복사 없이 공유  
  - 데이터 마켓플레이스, 프라이빗 리스팅
- **Time Travel**  
  - 특정 시점/쿼리 ID로 데이터 복구
- **Snowpark**  
  - Python, Scala, Java로 DataFrame 기반 처리를 Snowflake 내에서 실행
- **Dynamic Tables**  
  - 스트리밍/배치 기반의 선언적 파이프라인 (dbt 스타일의 incremental에 가깝게 동작)
- **Snowpipe**  
  - 이벤트 기반 자동 데이터 수집 (예: S3 이벤트 트리거)

### 5. Snowflake 아키텍처 요약

| 구분 | 설명 |
|------|------|
| **포지션** | 클라우드 네이티브 **데이터 웨어하우스** |
| **핵심 강점** | SQL 중심 분석, 데이터 공유, 운영 단순성, 자동 튜닝 |
| **처리 모델** | MPP(Massively Parallel Processing) SQL 엔진 |
| **스토리지** | 객체 스토리지 기반, 자동 압축·파티셔닝 |
| **컴퓨팅** | 가상 웨어하우스, 오토 스케일, 서스펜드/리즘 |

---

## 🔷 Databricks 아키텍처 요약 {#databricks-아키텍처-요약}

Databricks는 **레이크하우스**를 중심으로 한 통합 플랫폼입니다. (자세한 내용은 Databricks 생태계 관련 포스트 참고)

### 핵심 구성요소

- **Delta Lake**: Parquet + 트랜잭션 로그 기반 테이블 포맷 (ACID, Time Travel, CDC)
- **Apache Spark**: 배치·스트리밍·SQL·ML 통합 엔진
- **Unity Catalog**: 통합 거버넌스 (권한·계보·태그)
- **MLflow**: 실험·모델·레지스트리
- **Photon**: C++ 기반 고성능 SQL 엔진 (상용)

### Databricks 아키텍처 요약

| 구분 | 설명 |
|------|------|
| **포지션** | **레이크하우스** 기반 통합 데이터·AI 플랫폼 |
| **핵심 강점** | 배치·스트리밍·ML 통합, 코드(Spark/Python) 중심, 오픈소스 생태계 |
| **처리 모델** | Spark 기반 분산 처리 (SQL, Python, Scala, R) |
| **스토리지** | 객체 스토리지 + Delta Lake 메타데이터 |
| **컴퓨팅** | Spark 클러스터, Photon, 서버리스 SQL 웨어하우스 |

---

## ⚖️ 포지셔닝·강점 비교 {#포지셔닝강점-비교}

### 1:1 대응이 애매한 이유

- Snowflake: **"데이터 웨어하우스"** — SQL 중심 분석, BI, 리포팅, 데이터 공유
- Databricks: **"레이크하우스"** — DW + 레이크 + 스트리밍 + ML을 한 플랫폼에서

둘 다 **대용량 분석**을 지원하지만, Snowflake는 **SQL·분석 중심**, Databricks는 **코드·파이프라인·ML 중심**에 가깝습니다.

### 기능·포지션 비교표

| 구분 | Snowflake | Databricks |
|------|-----------|------------|
| **포지션** | 클라우드 네이티브 DW | 레이크하우스 통합 플랫폼 |
| **주 사용 언어** | SQL | SQL + Python/Scala/R |
| **배치 처리** | ✅ SQL 중심 | ✅ Spark (SQL, DataFrame, RDD) |
| **스트리밍** | Snowpipe, Dynamic Tables | Structured Streaming, Delta Live Tables |
| **ML/모델** | Snowpark ML, ML 모델 서빙 | MLflow, Feature Store, AutoML, Model Serving |
| **데이터 공유** | ✅ 계정 간 Zero Copy 공유, 마켓플레이스 | 외부 공유는 별도 패턴 |
| **거버넌스** | RBAC, 태그, 마스킹, 계보 | Unity Catalog (권한·계보·태그) |
| **운영 복잡도** | 상대적으로 낮음 (SQL·웨어하우스 위주) | 상대적으로 높음 (Spark·클러스터 이해 필요) |
| **오픈소스 활용** | 자체 엔진 중심 | Spark, Delta Lake, MLflow 등 |

### Snowflake가 강한 영역

- **SQL 중심 분석·BI·리포팅**
- **데이터 공유·마켓플레이스**
- **운영 단순성** (파티션/튜닝 부담 적음)
- **표준 SQL** 위주 워크로드

### Databricks가 강한 영역

- **배치·스트리밍·ML 통합**
- **코드(Spark/Python) 기반 파이프라인**
- **오픈소스 생태계** (Delta, MLflow, Flink 등과 연동)
- **레이크하우스 패턴** (raw → stg → mart + ML)

---

## 🎯 사례별 추천: 언제 무엇을 쓸 것인가 {#사례별-추천-언제-무엇을-쓸-것인가}

### Snowflake를 우선 고려할 때

- **BI·리포팅·분석이 주 업무**이고, SQL 위주로 팀이 일할 때
- **데이터 공유** (고객사, 파트너, 내부 부서)가 중요한 경우
- **운영 단순성**을 중시할 때 (파티션·튜닝을 직접 하기 부담스러울 때)
- **dbt + Snowflake** 조합으로 ELT 파이프라인을 굴릴 때

### Databricks를 우선 고려할 때

- **배치 + 스트리밍 + ML**을 한 플랫폼에서 처리하고 싶을 때
- **Spark·Python** 기반 파이프라인이 이미 있거나, 코드 중심으로 확장할 계획일 때
- **레이크하우스** (raw 레이크 + 마트 + ML) 패턴을 쓰고 싶을 때
- **Delta Lake, MLflow, dbt** 등 오픈소스와 강하게 연동하고 싶을 때

### 함께 쓰는 경우

- **Snowflake**: 분석·BI·리포팅, 데이터 공유, 고객/파트너용 데이터 제공
- **Databricks**: raw 데이터 수집·가공·스토리밍·ML, feature store·모델 학습
- **E TL/ELT**: Databricks에서 마트를 만들고, Snowflake로 복제해 BI용으로 사용하는 패턴도 가능

---

## 🔗 함께 쓰는 패턴 {#함께-쓰는-패턴}

### 패턴 1: Databricks → Snowflake (레이크 → DW)

- Databricks에서 raw·staging·mart 구축
- 일부 마트를 Snowflake로 복제 (Fivetran, Airflow, Custom ETL 등)
- Snowflake에서 BI·리포팅·데이터 공유 담당

### 패턴 2: Snowflake → Databricks (DW → ML)

- Snowflake에서 분석용 마트 관리
- ML/실험용으로 필요한 데이터를 Databricks로 추출
- Databricks에서 모델 학습·서빙

### 패턴 3: 역할 분리

- **Snowflake**: 분석·BI·데이터 공유
- **Databricks**: 스트리밍·ML·레이크하우스 파이프라인

둘 다 dbt를 연결해서 사용할 수 있으며, dbt profile에서 target만 분리하면 됩니다.

```yaml
# dbt profiles.yml 예시 (Snowflake + Databricks)

my_project:
  target: snowflake_prod
  outputs:
    snowflake_prod:
      type: snowflake
      account: xxx
      warehouse: analytics_wh
      database: analytics
      schema: mart
      ...
    databricks_prod:
      type: databricks
      catalog: analytics
      schema: mart
      ...
```

---

## 📌 정리 {#정리}

### 핵심 요약

1. **Snowflake**: 클라우드 네이티브 DW, SQL 중심, 데이터 공유·운영 단순성에 강점
2. **Databricks**: 레이크하우스, 배치·스트리밍·ML 통합, 코드·오픈소스 생태계에 강점
3. **1:1 대체 관계가 아님** — 팀의 워크로드·역량·요구사항에 따라 선택·조합

### 선택 체크리스트

- [ ] 주된 워크로드가 SQL 분석·BI인가? → Snowflake 우선 고려
- [ ] 스트리밍·ML·코드 기반 파이프라인이 필요한가? → Databricks 우선 고려
- [ ] 데이터 공유·마켓플레이스가 중요한가? → Snowflake 강점
- [ ] 오픈소스·레이크하우스 패턴을 중시하는가? → Databricks 강점
- [ ] 둘 다 필요한가? → 역할 분리 후 함께 사용 검토

---

> **"Snowflake와 Databricks는 경쟁이 아니라, 팀의 상황에 맞는 선택과 조합의 문제다."**

팀의 워크로드, 역량, 예산을 고려해 Snowflake만, Databricks만, 또는 둘을 함께 쓰는 패턴을 설계하는 것이 실무에서 가장 중요합니다.  
이 글이 선택 기준을 정하는 데 도움이 되기를 바랍니다.
