---
layout: post
lang: ko
title: "Unity Catalog와 dbt Deep Dive - 레이크하우스 거버넌스 베스트 프랙티스"
description: "Unity Catalog와 dbt를 함께 사용할 때의 아키텍처, 권한 모델, 네이밍 전략, 환경 분리, 테스트/계보 통합까지 실무 관점에서 깊게 정리합니다."
date: 2026-03-06
author: Data Droid
category: data-engineering
tags: [Unity-Catalog, dbt, Databricks, Lakehouse, Data-Governance, Data-Lineage, Data-Quality]
reading_time: "50분"
difficulty: "고급"
---

# Unity Catalog와 dbt Deep Dive - 레이크하우스 거버넌스 베스트 프랙티스

> **"모든 것을 Databricks로 할 수 있다"와 "모든 것을 dbt로 할 수 있다" 사이에, 현실적인 균형점을 찾아가는 이야기.**

Databricks를 쓰다 보면 다음과 같은 질문을 자주 만나게 됩니다.

- **dbt를 쓰는데 Unity Catalog가 왜 필요하지?**
- **Unity Catalog로 권한을 관리하는데, dbt의 `schema.yml` 테스트와 문서는 어디까지 써야 하지?**
- **카탈로그/스키마/테이블 네이밍을 어떻게 잡으면 환경 분리가 깔끔할까?**

이 글에서는 **Unity Catalog(UC)**와 **dbt**를 함께 쓸 때의 **아키텍처, 거버넌스, 패턴**을 실무 관점에서 깊게 정리해봅니다.

---

## 📚 목차

1. [역할 분담: Unity Catalog vs dbt](#역할-분담-unity-catalog-vs-dbt)
2. [네임스페이스 설계: catalog.schema.table 전략](#네임스페이스-설계-catalogschematable-전략)
3. [권한 모델: UC 권한과 dbt 역할 매핑](#권한-모델-uc-권한과-dbt-역할-매핑)
4. [환경 분리 전략: dev / staging / prod](#환경-분리-전략-dev--staging--prod)
5. [dbt 테스트와 Unity Catalog 정책의 경계](#dbt-테스트와-unity-catalog-정책의-경계)
6. [계보(Lineage)와 카탈로그: dbt, UC, BI를 잇는 선](#계보lineage와-카탈로그-dbt-uc-bi를-잇는-선)
7. [실무 패턴: 도메인 중심 레이크하우스 + dbt 프로젝트](#실무-패턴-도메인-중심-레이크하우스--dbt-프로젝트)
8. [체크리스트 요약](#체크리스트-요약)

---

## 🎭 역할 분담: Unity Catalog vs dbt {#역할-분담-unity-catalog-vs-dbt}

먼저 **둘이 싸우지 않게** 역할을 분리해서 보는 게 중요합니다.

### Unity Catalog의 관점

- **무엇(What)을 누가(Who) 볼 수 있는가?**
  - 카탈로그/스키마/테이블/컬럼 권한
  - Row/Column 레벨 보안, 데이터 마스킹
- **데이터가 어디서 어디로 흘렀는가?**
  - 계보(Lineage), 시스템 테이블, 감사 로그
- **조직 전체의 공용 언어**
  - “`prod.analytics.orders`가 우리 조직에서 공식 주문 마트야”

### dbt의 관점

- **데이터를 어떻게(How) 변환할 것인가?**
  - SQL 기반 모델링, Jinja 매크로
- **모델의 품질을 어떻게 보장할 것인가?**
  - `schema.yml` 테스트, 문서화, docs 사이트
- **데이터 팀 내부 생산성**
  - 개발자 경험(DX), 리뷰/배포/롤백 파이프라인

> **요약**
>
> - **Unity Catalog**: 보안·거버넌스·계보·공식 오브젝트 정의
> - **dbt**: 변환 로직·품질·도메인 모델링

두 도구는 **경쟁 관계가 아니라 서로의 빈 공간을 채우는 관계**로 보는 것이 좋습니다.

---

## 🧭 네임스페이스 설계: `catalog.schema.table` 전략 {#네임스페이스-설계-catalogschematable-전략}

Unity Catalog는 3레벨 네임스페이스를 사용합니다.

```sql
-- catalog.schema.table
SELECT * FROM prod.analytics.orders;
```

### 자주 쓰이는 패턴 3가지

1. **카탈로그 = 환경, 스키마 = 도메인**
   - 예: `dev.analytics.orders`, `prod.analytics.orders`
   - 장점: 환경별로 완전히 분리, 권한 관리 직관적
   - 단점: 환경이 늘어날수록 카탈로그가 많아짐

2. **카탈로그 = 도메인, 스키마 = 레이어(raw/stg/mart)** (추천)
   - 예: `analytics.raw.orders_raw`, `analytics.mart.orders`
   - 환경은 dbt profile / Job 레벨에서 분리
   - 장점: 도메인 중심 설계, BI/ML에서 참조하기 쉬움

3. **카탈로그 = 조직/플랫폼, 스키마 = 도메인+환경**
   - 예: `corp.analytics_prod.orders`, `corp.analytics_dev.orders`
   - 레거시 DW에서 많이 쓰던 패턴과 유사

### dbt와 잘 맞는 패턴

dbt는 보통 아래와 같이 **레이어별 스키마**를 쓰는 것이 자연스럽습니다.

```yaml
# dbt 프로젝트 설정 예시 (dbt_project.yml)

models:
  my_project:
    raw:
      +schema: raw
    staging:
      +schema: stg
    marts:
      +schema: mart
```

이 패턴과 가장 잘 맞는 것은:

- **카탈로그 = 도메인(analytics, marketing 등)**
- **스키마 = 레이어(raw, stg, mart 등)**

예)

- `analytics.raw.events_raw`
- `analytics.stg.events_staging`
- `analytics.mart.events_sessionized`

---

## 🔐 권한 모델: UC 권한과 dbt 역할 매핑 {#권한-모델-uc-권한과-dbt-역할-매핑}

### Unity Catalog 권한의 기본 축

- Principal: 사용자 / 그룹 / 서비스 프린시펄
- Object: catalog / schema / table / view / function / volume …
- 권한: `USAGE`, `SELECT`, `MODIFY`, `OWNERSHIP`, `APPLY TAG`, `EXECUTE` 등

```sql
-- 예: analytics 카탈로그와 mart 스키마에 대한 권한
GRANT USAGE ON CATALOG analytics TO `analytics_readonly`;
GRANT USAGE ON SCHEMA analytics.mart TO `analytics_readonly`;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics.mart TO `analytics_readonly`;
```

### dbt 역할과 어떻게 맞출까?

dbt 쪽에는 보통 이런 “역할”이 있습니다.

- `analytics_dev`: 개발자용
- `analytics_ci`: CI/CD 파이프라인용
- `analytics_reader`: 리포팅/분석용

이걸 Unity Catalog 그룹/서비스 프린시펄과 매핑합니다.

```sql
-- dbt 개발자가 쓸 수 있는 권한
GRANT USAGE ON CATALOG analytics TO `grp_analytics_dev`;
GRANT USAGE, CREATE ON SCHEMA analytics.raw TO `grp_analytics_dev`;
GRANT USAGE, CREATE, MODIFY ON SCHEMA analytics.stg TO `grp_analytics_dev`;
GRANT USAGE, SELECT ON SCHEMA analytics.mart TO `grp_analytics_dev`;

-- 리더 전용(읽기만)
GRANT USAGE ON CATALOG analytics TO `grp_analytics_reader`;
GRANT USAGE ON SCHEMA analytics.mart TO `grp_analytics_reader`;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics.mart TO `grp_analytics_reader`;
```

> **패턴**
>
> - **dbt가 쓰는 계정/토큰**은 보통 `grp_analytics_ci` 같은 **머신 계정**에 매핑
> - 사람(분석가, 엔지니어)은 별도의 그룹에 매핑해 최소 권한 원칙 적용

---

## 🌱 환경 분리 전략: dev / staging / prod {#환경-분리-전략-dev--staging--prod}

환경 분리는 크게 두 축으로 나눌 수 있습니다.

1. **Unity Catalog 레벨 분리**
   - 예: `dev_analytics`, `stg_analytics`, `prod_analytics`
2. **dbt profile / Job 레벨 분리**
   - 같은 UC 카탈로그를 쓰되, 다른 스키마/스토리지/클러스터를 사용

### 1) 카탈로그 기반 환경 분리

```sql
CREATE CATALOG dev_analytics;
CREATE CATALOG prod_analytics;
```

```yaml
# profiles.yml (카탈로그 기반)

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

- 장점: 환경 간 완전 격리, 실수로 prod를 건드릴 가능성↓
- 단점: 카탈로그 수 증가, 권한/정책 관리 복잡도↑

### 2) 카탈로그 공유 + 스키마/스토리지 기반 분리 (자주 쓰는 패턴)

```sql
-- 하나의 analytics 카탈로그
CREATE CATALOG analytics;

-- 환경별 스키마
CREATE SCHEMA analytics.mart_dev;
CREATE SCHEMA analytics.mart_prod;
```

```yaml
# profiles.yml (스키마 기반)

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

- 장점: 도메인 중심 카탈로그 유지, BI/ML에서 참조하기 쉬움
- 단점: 스키마/테이블 이름이 많아지고, 규칙을 잘 지켜야 함

> **실무 팁**
>
> - 소규모 팀: **카탈로그 = 도메인, 스키마 = raw/stg/mart, 환경은 profile/워크스페이스로 분리**
> - 대규모 엔터프라이즈: 규제 요구사항에 따라 **카탈로그 = 환경** 패턴을 섞어 쓰는 경우 많음

---

## ✅ dbt 테스트와 Unity Catalog 정책의 경계 {#dbt-테스트와-unity-catalog-정책의-경계}

둘 다 “품질/정책”을 다루기 때문에, **어디까지 dbt, 어디서부터 UC/플랫폼**인지 정리할 필요가 있습니다.

### dbt가 책임지는 영역

- **모델의 논리적 품질**
  - `not_null`, `unique`, `accepted_values`, `relationships` 등
- **도메인 규칙**
  - 예: `status IN ('COMPLETED','CANCELLED')`
  - 예: `order_date <= current_date`
- **문서화**
  - 컬럼 설명, 비즈니스 정의, 예시

```yaml
version: 2

models:
  - name: orders
    description: "애플리케이션에서 발생한 주문의 사실 테이블"
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

### Unity Catalog/플랫폼이 책임지는 영역

- **접근 제어 / 마스킹 / 필터링**
  - PII, PHI, 재무 데이터 등
- **감사와 규제 준수**
  - 누가 언제 어떤 데이터에 접근했는지
- **조직 차원의 정책**
  - “미국 거주자의 SSN은 항상 마스킹되어야 한다”

```sql
-- 예: UC에서 태그 기반 마스킹 정책 적용 (개념적 예시)

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

> **정리**
>
> - **dbt**: “데이터가 맞는 값인가?” (논리·도메인 품질)
> - **Unity Catalog**: “누가 무엇을 볼 수 있는가?” (보안·규제)

---

## 🔗 계보(Lineage)와 카탈로그: dbt, UC, BI를 잇는 선 {#계보lineage와-카탈로그-dbt-uc-bi를-잇는-선}

### dbt에서 보는 계보

- `dbt docs`와 `dbt meta`를 통해 **모델 간 의존성 그래프** 확인
- “이 마트 테이블이 어떤 raw 소스에서 왔는지”를 개발자 관점에서 파악

### Unity Catalog에서 보는 계보

- Unity Catalog는 **엔진/쿼리 레벨**에서 계보를 수집
  - SQL Warehouse, Notebooks, Workflows, BI 도구 등
- “이 테이블/뷰를 참조하는 리포트/모델/노트북은 무엇인가?”를 조직 관점에서 파악

```sql
-- 개념적 예: UC 계보 조회 (실제 API/뷰는 버전에 따라 다름)
SELECT *
FROM system.lineage.relations
WHERE downstream_object = 'analytics.mart.orders';
```

### 둘을 함께 쓰는 패턴

- **dbt**
  - 개발자에게 “코드 단위”의 계보 제공
- **Unity Catalog**
  - 보안/거버넌스 팀과 BI/ML 오너에게 “플랫폼 단위”의 계보 제공

두 가지 계보가 서로 다른 타깃 유저를 가진다고 이해하면, 중복이 아니라 **보완 관계**로 받아들이기 쉽습니다.

---

## 🧩 실무 패턴: 도메인 중심 레이크하우스 + dbt 프로젝트 {#실무-패턴-도메인-중심-레이크하우스--dbt-프로젝트}

### 예시 도메인: `analytics` 레이크하우스

1. **Unity Catalog 설계**

```sql
CREATE CATALOG analytics;

CREATE SCHEMA analytics.raw;
CREATE SCHEMA analytics.stg;
CREATE SCHEMA analytics.mart;
```

2. **dbt 프로젝트 구조**

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
# dbt_project.yml (요약)

models:
  analytics_dbt:
    raw:
      +schema: raw
    staging:
      +schema: stg
    marts:
      +schema: mart
```

3. **profiles.yml에서 UC와 연결**

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

4. **권한/거버넌스 레이어**

```sql
-- 개발자 그룹
GRANT USAGE ON CATALOG analytics TO `grp_analytics_dev`;
GRANT USAGE, CREATE, MODIFY ON SCHEMA analytics.raw TO `grp_analytics_dev`;
GRANT USAGE, CREATE, MODIFY ON SCHEMA analytics.stg TO `grp_analytics_dev`;
GRANT USAGE, SELECT ON SCHEMA analytics.mart TO `grp_analytics_dev`;

-- 리더 그룹 (읽기 전용)
GRANT USAGE ON CATALOG analytics TO `grp_analytics_reader`;
GRANT USAGE ON SCHEMA analytics.mart TO `grp_analytics_reader`;
GRANT SELECT ON ALL TABLES IN SCHEMA analytics.mart TO `grp_analytics_reader`;
```

5. **품질 & 계보**

- dbt: `schema.yml`로 **컬럼 수준 품질 규칙**과 설명 관리
- Unity Catalog:
  - 태그/라벨로 **민감도, 소유자, 데이터 도메인** 표시
  - 시스템 테이블/Lineage UI로 **엔드투엔드 계보** 관리

---

## 🧾 체크리스트 요약 {#체크리스트-요약}

**1. 역할 정의**

- [ ] Unity Catalog: 보안, 권한, 계보, 규제
- [ ] dbt: 모델링, 변환 로직, 테스트, 문서화

**2. 네임스페이스/환경 전략**

- [ ] `catalog.schema.table` 패턴을 도메인 중심으로 설계했는가?
- [ ] dev/stg/prod 환경을 카탈로그로 나눌지, 스키마/워크스페이스로 나눌지 결정했는가?

**3. 권한 모델**

- [ ] dbt 실행 계정(머신 계정)과 사람 계정을 분리했는가?
- [ ] 그룹/역할 단위로 UC 권한을 설계했는가?

**4. 품질 & 정책**

- [ ] 도메인 규칙/모델 품질은 dbt 테스트로 관리하는가?
- [ ] 보안/마스킹/규제 관련 정책은 UC/플랫폼에서 관리하는가?

**5. 계보 & 관측 가능성**

- [ ] dbt와 Unity Catalog 양쪽에서 계보를 확인할 수 있는가?
- [ ] 시스템 테이블과 로그를 이용해 변경 이력을 추적할 수 있는가?

---

> **"Unity Catalog와 dbt는 서로를 대체하는 도구가 아니라, 레이크하우스에서 서로의 빈 공간을 채워주는 도구입니다."**

UC를 통해 **조직 차원의 거버넌스와 안전한 데이터 접근**을 설계하고, dbt를 통해 **도메인 로직·테스트·문서화**를 정교하게 다듬으면, 데이터 팀과 거버넌스 팀이 서로의 목표를 침범하지 않으면서도 잘 협업할 수 있습니다.  
이 글을 참고해 팀에 맞는 UC + dbt 패턴을 설계해보면 좋겠습니다.

