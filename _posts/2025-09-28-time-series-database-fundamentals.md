---
layout: post
title: "Part 1: Time Series Database 기초와 아키텍처 - 시계열 데이터의 핵심 이해"
date: 2025-09-28 10:00:00 +0900
category: data-engineering
tags: [Time-Series-Database, TDB, InfluxDB, TimescaleDB, 시계열데이터, IoT, 모니터링, 실시간분석]
author: Data Droid
lang: ko
series: time-series-database-mastery
series_order: 1
reading_time: "45분"
difficulty: "중급"
excerpt: "시계열 데이터의 특성부터 주요 TDB 솔루션 비교, 아키텍처 이해, 그리고 실무 프로젝트까지 Time Series Database의 모든 기초를 완전히 정복합니다."
---

# Part 1: Time Series Database 기초와 아키텍처 - 시계열 데이터의 핵심 이해

> 시계열 데이터의 특성부터 주요 TDB 솔루션 비교, 아키텍처 이해, 그리고 실무 프로젝트까지 Time Series Database의 모든 기초를 완전히 정복합니다.

## 📋 목차 {#목차}

1. [시계열 데이터와 TDB 개요](#시계열-데이터와-tdb-개요)
2. [주요 TDB 솔루션 비교 분석](#주요-tdb-솔루션-비교-분석)
3. [TDB 아키텍처와 저장 방식](#tdb-아키텍처와-저장-방식)
4. [TDB 성능 특성과 최적화 원리](#tdb-성능-특성과-최적화-원리)
5. [실무 프로젝트: IoT 센서 데이터 수집 시스템](#실무-프로젝트-iot-센서-데이터-수집-시스템)
6. [학습 요약](#학습-요약)

---

## 🕐 시계열 데이터와 TDB 개요 {#시계열-데이터와-tdb-개요}

### 시계열 데이터의 특성

시계열 데이터는 시간 순서대로 기록된 데이터로, 다음과 같은 고유한 특성을 가집니다.

| 특성 | 설명 | 예시 | 영향 |
|------|------|------|------|
| **시간 기반 정렬** | 데이터가 시간 순서로 생성됨 | 센서 데이터, 로그, 지표 | 순차적 접근 최적화 가능 |
| **고빈도 생성** | 짧은 간격으로 대량 생성 | IoT 센서 (초당 수천 개), 웹 로그 | 높은 쓰기 처리량 필요 |
| **불변성** | 한번 기록된 데이터는 변경되지 않음 | 센서 측정값, 거래 기록 | 읽기 전용 최적화 가능 |
| **압축 가능성** | 연속된 값들이 유사한 패턴 | 온도, 압력, CPU 사용률 | 효율적 압축 알고리즘 적용 |
| **보존 정책** | 오래된 데이터는 삭제 또는 아카이브 | 최근 30일 데이터만 유지 | 자동화된 데이터 라이프사이클 |

### 전통적 데이터베이스의 한계

| 문제점 | 설명 | 시계열 데이터에서의 영향 |
|--------|------|-------------------------|
| **인덱스 오버헤드** | 시간별 인덱스 관리 비용 | 초당 수만 건 쓰기 시 성능 저하 |
| **저장 공간 비효율** | 행 기반 저장 방식 | 압축률 낮음, 저장 비용 증가 |
| **쿼리 복잡성** | 시간 범위 쿼리의 복잡한 구문 | 개발 생산성 저하 |
| **확장성 한계** | 단일 노드 중심 설계 | 대용량 시계열 데이터 처리 한계 |

### TDB의 핵심 장점

| 특성 | TDB | 전통적 DB | 개선 효과 |
|------|-----|-----------|-----------|
| **쓰기 최적화** | 시간 기반 순차 쓰기 | 랜덤 쓰기 패턴 | 10-100x 처리량 향상 |
| **압축 효율** | 10:1 ~ 100:1 | 2:1 ~ 3:1 | 5-30x 저장 공간 절약 |
| **쿼리 성능** | 시간 범위 쿼리 최적화 | 복잡한 SQL 필요 | 10-100x 응답 속도 향상 |
| **저장 효율** | 열 기반 압축 저장 | 행 기반 저장 | 높은 압축률 달성 |
| **데이터 생명주기** | 자동화된 보존 정책 | 수동 관리 필요 | 운영 효율성 향상 |

#### 성능 비교 분석

| 메트릭 | 전통적 DB | TDB | 개선율 |
|--------|-----------|-----|--------|
| **쓰기 처리량** | 1K-10K writes/sec | 100K-1M writes/sec | **10-100x** |
| **압축률** | 2:1 ~ 3:1 | 10:1 ~ 100:1 | **5-30x** |
| **쿼리 응답시간** | 복잡한 SQL, 느린 응답 | 간단한 시간 범위 쿼리, 빠른 응답 | **10-100x** |
| **저장 비용** | 높은 저장 비용 | 압축으로 비용 절약 | **50-90% 절약** |
| **운영 복잡도** | 수동 관리 필요 | 자동화된 관리 | **운영 효율성 대폭 향상** |

---

## 🔍 주요 TDB 솔루션 비교 분석 {#주요-tdb-솔루션-비교-분석}

### TDB 솔루션 분류

| 분류 | 솔루션 | 특징 | 사용 사례 |
|------|--------|------|-----------|
| **전용 TDB** | InfluxDB, TimescaleDB | 시계열 전용 설계 | IoT, 모니터링, 금융 데이터 |
| **확장형 DB** | ClickHouse, Apache Druid | 분석 DB + 시계열 | 대용량 분석, 실시간 대시보드 |
| **메트릭 중심** | Prometheus, VictoriaMetrics | 메트릭 수집/저장 | 시스템 모니터링, 알림 |
| **클라우드 서비스** | AWS Timestream, Azure Time Series | 관리형 서비스 | 클라우드 기반 애플리케이션 |

### 상세 솔루션 비교

#### 1. InfluxDB

| 항목 | InfluxDB 1.x | InfluxDB 2.x | 특징 |
|------|--------------|--------------|------|
| **라이센스** | 오픈소스 + 상용 | 오픈소스 + 상용 | 상용 버전은 클러스터링 지원 |
| **데이터 모델** | Line Protocol | Line Protocol | 태그 + 필드 구조 |
| **압축** | TSM (Time Structured Merge) | TSM | 열 기반 압축 |
| **쿼리 언어** | InfluxQL | Flux | Flux는 더 강력한 데이터 처리 |
| **클러스터링** | 상용 버전만 | 상용 버전만 | 수평 확장 지원 |

```python
class InfluxDBExample:
    def __init__(self):
        self.client = InfluxDBClient(
            host='localhost',
            port=8086,
            username='admin',
            password='password'
        )
    
    def write_sensor_data(self, sensor_data):
        """센서 데이터 쓰기 예시"""
        
        # Line Protocol 형식
        line_protocol = [
            {
                "measurement": "sensor_data",
                "tags": {
                    "sensor_id": sensor_data['sensor_id'],
                    "location": sensor_data['location'],
                    "type": sensor_data['type']
                },
                "fields": {
                    "temperature": sensor_data['temperature'],
                    "humidity": sensor_data['humidity'],
                    "pressure": sensor_data['pressure']
                },
                "time": sensor_data['timestamp']
            }
        ]
        
        return self.client.write_points(line_protocol)
    
    def query_time_range(self, start_time, end_time):
        """시간 범위 쿼리 예시"""
        
        query = f"""
        SELECT mean(temperature), mean(humidity)
        FROM sensor_data
        WHERE time >= '{start_time}' AND time <= '{end_time}'
        GROUP BY time(1h), location
        """
        
        return self.client.query(query)
```

#### 2. TimescaleDB

| 항목 | TimescaleDB | 특징 |
|------|-------------|------|
| **기반** | PostgreSQL 확장 | SQL 호환성 유지 |
| **하이퍼테이블** | 자동 파티셔닝 | 시간 기반 자동 분할 |
| **압축** | 열 기반 압축 | PostgreSQL 압축 활용 |
| **쿼리** | 표준 SQL + 시계열 함수 | 기존 SQL 지식 활용 가능 |
| **확장성** | PostgreSQL 클러스터링 | 수평/수직 확장 |

```sql
-- TimescaleDB 사용 예시
-- 1. 하이퍼테이블 생성
CREATE TABLE sensor_data (
    time TIMESTAMPTZ NOT NULL,
    sensor_id INTEGER NOT NULL,
    temperature DOUBLE PRECISION,
    humidity DOUBLE PRECISION,
    location TEXT
);

SELECT create_hypertable('sensor_data', 'time');

-- 2. 데이터 삽입
INSERT INTO sensor_data VALUES 
    (NOW(), 1, 25.5, 60.0, 'room1'),
    (NOW(), 2, 26.0, 58.0, 'room2');

-- 3. 시계열 쿼리
SELECT 
    time_bucket('1 hour', time) AS hour,
    location,
    avg(temperature) as avg_temp,
    max(temperature) as max_temp
FROM sensor_data 
WHERE time > NOW() - INTERVAL '24 hours'
GROUP BY hour, location
ORDER BY hour;
```

#### 3. Prometheus

| 항목 | Prometheus | 특징 |
|------|------------|------|
| **목적** | 메트릭 수집/저장/쿼리 | 모니터링 전용 |
| **데이터 모델** | 메트릭 + 라벨 | 시계열 + 메타데이터 |
| **저장** | 로컬 SSD 최적화 | 단일 노드 저장 |
| **쿼리** | PromQL | 시계열 쿼리 전용 |
| **확장성** | Federation, Remote Storage | 분산 아키텍처 |

```yaml
# Prometheus 설정 예시
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
    scrape_interval: 5s
    metrics_path: /metrics

  - job_name: 'application-metrics'
    static_configs:
      - targets: ['app:8080']
    scrape_interval: 10s
```

### 솔루션 선택 가이드

| 사용 사례 | 추천 솔루션 | 이유 |
|-----------|-------------|------|
| **IoT 센서 데이터** | InfluxDB, TimescaleDB | 높은 쓰기 처리량, 압축 효율 |
| **시스템 모니터링** | Prometheus | 메트릭 수집 최적화, 알림 통합 |
| **금융 데이터** | TimescaleDB | ACID 보장, SQL 호환성 |
| **대용량 분석** | ClickHouse, Druid | 열 기반 저장, 빠른 집계 |
| **클라우드 기반** | AWS Timestream, Azure TS | 관리형 서비스, 자동 확장 |

---

## 🏗️ TDB 아키텍처와 저장 방식 {#tdb-아키텍처와-저장-방식}

### TDB 아키텍처 패턴

#### 1. 단일 노드 아키텍처

| 구성요소 | 역할 | 특징 |
|----------|------|------|
| **Ingestion Layer** | 데이터 수집 | HTTP API, 메시지 큐 연결 |
| **Storage Engine** | 데이터 저장 | 압축, 인덱싱, WAL |
| **Query Engine** | 쿼리 처리 | 시간 범위 최적화 |
| **Retention Manager** | 데이터 생명주기 | 자동 삭제/아카이브 |

#### 단일 노드 TDB 구성요소

| 계층 | 구성요소 | 설명 |
|------|----------|------|
| **Ingestion** | HTTP API | REST API for data ingestion |
| | Message Queue | Kafka, RabbitMQ integration |
| | Batch Processing | Bulk data import |
| **Storage** | WAL | Write-Ahead Logging |
| | Compression | Columnar compression |
| | Indexing | Time-based indexing |
| **Query** | Optimization | Time range query optimization |
| | Aggregation | Built-in aggregation functions |
| | Caching | Query result caching |
    
#### 데이터 처리 흐름

| 단계 | 처리 과정 | 설명 | 최적화 요소 |
|------|-----------|------|-------------|
| **1단계** | 데이터 수신 (Ingestion Layer) | HTTP API, 메시지 큐를 통한 데이터 수집 | 배치 처리, 연결 풀링 |
| **2단계** | 형식 검증 및 전처리 | 데이터 유효성 검사, 형식 변환 | 빠른 검증 알고리즘 |
| **3단계** | WAL에 쓰기 로그 기록 | Write-Ahead Logging으로 내구성 보장 | 순차 쓰기 최적화 |
| **4단계** | 메모리 버퍼에 임시 저장 | 빠른 응답을 위한 메모리 캐싱 | 버퍼 크기 최적화 |
| **5단계** | 배치 단위로 디스크에 플러시 | 효율적인 디스크 I/O | 배치 크기 조정 |
| **6단계** | 압축 및 인덱싱 수행 | 저장 공간 절약 및 쿼리 최적화 | 압축 알고리즘 선택 |
| **7단계** | 쿼리 엔진에서 접근 가능 | 사용자 쿼리 처리 준비 완료 | 인덱스 최적화 |


#### 2. 분산 아키텍처

| 구성요소 | 역할 | 특징 |
|----------|------|------|
| **Load Balancer** | 요청 분산 | 여러 노드에 부하 분산 |
| **Coordinator** | 클러스터 관리 | 메타데이터, 라우팅 |
| **Storage Nodes** | 데이터 저장 | 샤딩된 데이터 저장 |
| **Query Coordinator** | 분산 쿼리 | 여러 노드 결과 병합 |

### 저장 방식 비교

#### 1. 행 기반 vs 열 기반 저장

| 방식 | 장점 | 단점 | 사용 사례 |
|------|------|------|-----------|
| **행 기반** | 단일 레코드 접근 빠름 | 압축률 낮음, 집계 느림 | OLTP, 트랜잭션 |
| **열 기반** | 압축률 높음, 집계 빠름 | 단일 레코드 접근 느림 | OLAP, 분석, 시계열 |

#### 저장 구조 비교

| 저장 방식 | 데이터 구조 | 압축률 | 쿼리 성능 | 특징 |
|-----------|-------------|--------|-----------|------|
| **행 기반** | `[timestamp1, sensor_id1, temp1, humidity1]`<br>`[timestamp2, sensor_id2, temp2, humidity2]`<br>`[timestamp3, sensor_id3, temp3, humidity3]` | 2:1 ~ 5:1 | 단일 레코드: 빠름<br>집계: 느림 | 각 행이 연속 저장 |
| **열 기반** | `timestamps: [timestamp1, timestamp2, timestamp3]`<br>`sensor_ids: [sensor_id1, sensor_id2, sensor_id3]`<br>`temperatures: [temp1, temp2, temp3]`<br>`humidities: [humidity1, humidity2, humidity3]` | 10:1 ~ 100:1 | 단일 레코드: 느림<br>집계: 빠름 | 각 컬럼이 연속 저장 |

#### 2. 압축 알고리즘

| 알고리즘 | 압축률 | 속도 | 용도 |
|----------|--------|------|------|
| **LZ4** | 중간 | 매우 빠름 | 실시간 압축 |
| **ZSTD** | 높음 | 빠름 | 균형잡힌 성능 |
| **GZIP** | 높음 | 느림 | 높은 압축률 필요 |
| **Delta Compression** | 매우 높음 | 빠름 | 시계열 전용 |

#### 압축 알고리즘 상세 비교

| 알고리즘 | 원리 | 예시 | 압축률 | 속도 | 최적 용도 |
|----------|------|------|--------|------|-----------|
| **Delta Compression** | 연속된 값의 차이만 저장 | 원본: [100, 102, 101, 103, 102]<br>압축: [100, +2, -1, +2, -1] | 50:1 ~ 1000:1 | 빠름 | 시계열 데이터 |
| **LZ4** | 중복 패턴 압축 | 일반적인 압축 알고리즘 | 3:1 ~ 10:1 | 매우 빠름 | 실시간 압축 |
    
#### 압축 효율성 분석

| 데이터 특성 | 압축률 영향 | 설명 |
|-------------|-------------|------|
| **변동성 (Volatility)** | 낮을수록 압축률 향상 | 연속된 값이 유사하면 압축 효율 증가 |
| **패턴 (Pattern)** | 반복 패턴이 있으면 압축률 향상 | 주기적 또는 예측 가능한 패턴 |
| **정밀도 (Precision)** | 정밀도가 낮을수록 압축률 향상 | 소수점 자릿수가 적으면 압축 효율 증가 |

#### 추천 압축 알고리즘

| 데이터 특성 | 추천 알고리즘 | 이유 |
|-------------|---------------|------|
| **낮은 변동성** | Delta Compression | 연속 값의 차이가 작아 압축률 최고 |
| **높은 변동성** | LZ4 or ZSTD | 일반적인 압축으로 적절한 효율 |
| **실시간 처리** | LZ4 | 빠른 압축/해제 속도 |
| **저장 최적화** | ZSTD or GZIP | 높은 압축률로 저장 공간 절약 |

---

## ⚡ TDB 성능 특성과 최적화 원리 {#tdb-성능-특성과-최적화-원리}

### 쓰기 성능 최적화

#### 1. 배치 쓰기 (Batch Writing)

| 방식 | 설명 | 성능 향상 | 구현 예시 |
|------|------|-----------|-----------|
| **메모리 버퍼** | 임시 메모리에 배치 저장 | 10-100x | WAL + 메모리 큐 |
| **압축 배치** | 여러 포인트 압축 후 저장 | 5-20x | 압축 알고리즘 적용 |
| **인덱스 지연** | 배치 단위로 인덱스 업데이트 | 3-10x | 배치 인덱싱 |

#### 최적화된 쓰기 처리 전략

| 최적화 방식 | 설명 | 장점 | 성능 향상 |
|-------------|------|------|-----------|
| **메모리 버퍼링** | 메모리 버퍼에 배치 저장 | 디스크 I/O 횟수 감소, 압축 효율성 향상, 인덱스 업데이트 최적화 | 10-100x |
| **압축 배칭** | 여러 포인트를 함께 압축 | 압축률 향상, 압축 오버헤드 감소, 저장 공간 절약 | 5-20x |
| **인덱스 지연** | 인덱스 업데이트 지연 | 쓰기 지연시간 감소, 인덱스 조각화 방지, 배치 처리 효율성 | 3-10x |


#### 2. 압축 최적화

#### 시계열 특화 압축 전략

| 압축 기법 | 설명 | 적용 시나리오 |
|-----------|------|---------------|
| **Delta Encoding** | 연속 값의 차이 저장 | 천천히 변화하는 센서 데이터 |
| **Run Length Encoding** | 연속된 동일 값 압축 | 상수 값이 많은 데이터 |
| **Dictionary Compression** | 반복되는 값 사전 압축 | 반복 패턴이 있는 데이터 |
    
#### 압축 효과 분석

| 데이터 패턴 | 최적 압축 기법 | 효과 |
|-------------|---------------|------|
| **상수 값 (Constant Values)** | RLE (Run Length Encoding) | 연속된 동일 값 압축 |
| **선형 트렌드 (Linear Trends)** | Delta Encoding | 연속 값의 차이 저장 |
| **반복 패턴 (Repetitive Patterns)** | Dictionary Compression | 반복되는 값 사전 압축 |
| **랜덤 값 (Random Values)** | 일반 압축 (LZ4, ZSTD) | 일반적인 압축 알고리즘 |

#### 실제 데이터 타입별 압축률

| 데이터 타입 | 압축률 | 특징 |
|-------------|--------|------|
| **온도 센서** | 20:1 ~ 50:1 | 천천히 변화, 높은 압축률 |
| **CPU 사용률** | 10:1 ~ 30:1 | 중간 변동성, 적당한 압축률 |
| **네트워크 트래픽** | 5:1 ~ 15:1 | 높은 변동성, 낮은 압축률 |
| **에러 로그** | 2:1 ~ 5:1 | 랜덤성 높음, 낮은 압축률 |


### 읽기 성능 최적화

#### 1. 인덱싱 전략

| 인덱스 타입 | 설명 | 성능 특성 | 사용 사례 |
|-------------|------|-----------|-----------|
| **시간 인덱스** | 시간 범위 기반 | 시간 쿼리 최적화 | 범위 쿼리 |
| **태그 인덱스** | 메타데이터 기반 | 필터링 최적화 | 다차원 쿼리 |
| **복합 인덱스** | 시간 + 태그 | 복합 조건 최적화 | 복잡한 쿼리 |

#### 인덱스 타입별 특성

| 인덱스 타입 | 구조 | 장점 | 메모리 사용량 | 유지보수 |
|-------------|------|------|---------------|----------|
| **Time Index** | B+ Tree on timestamp | 시간 범위 쿼리 O(log n) | 중간 | 낮음 |
| **Tag Index** | Inverted index on tags | 태그 필터링 O(1) | 높음 | 높음 |
| **Composite Index** | Multi-column index | 복합 조건 최적화 | 매우 높음 | 매우 높음 |
    
#### 쿼리 패턴 기반 인덱싱 추천

| 쿼리 패턴 | 주요 인덱스 | 보조 인덱스 | 최적화 전략 |
|-----------|-------------|-------------|-------------|
| **시간 범위 쿼리** | Time index | Tag index for filtering | 파티셔닝 + 시간 인덱스 |
| **태그 필터링** | Tag index | Time index for range | 태그 카디널리티 고려 |
| **집계 쿼리** | Time index + pre-aggregation | Materialized views | 시간 윈도우 기반 집계 |


#### 2. 쿼리 최적화

#### 쿼리 최적화 기법

| 최적화 기법 | 설명 | 효과 |
|-------------|------|------|
| **Predicate Pushdown** | 조건을 스토리지 레이어로 푸시 | 불필요한 데이터 스캔 방지 |
| **Column Pruning** | 필요한 컬럼만 읽기 | I/O 최적화 |
| **Time Range Optimization** | 시간 범위 기반 파티션 프루닝 | 관련 파티션만 스캔 |
| **Parallel Execution** | 여러 파티션 병렬 처리 | 처리 속도 향상 |
    
#### 쿼리 최적화 전략

| 쿼리 타입 | 최적화 전략 | 예시 쿼리 | 성능 향상 |
|-----------|-------------|-----------|-----------|
| **시간 범위 쿼리** | 파티션 프루닝 + 인덱스 활용 | `SELECT avg(temperature) FROM sensor_data WHERE time >= '2025-01-01' AND time < '2025-01-02'` | **10-100x** |
| **집계 쿼리** | Pre-aggregation + 캐싱 | `SELECT time_bucket('1h', time), avg(temperature) FROM sensor_data GROUP BY time_bucket('1h', time)` | **5-50x** |

#### 최적화 기법 설명

| 기법 | 설명 | 효과 |
|------|------|------|
| **파티션 프루닝** | 해당 날짜 파티션만 스캔 | 불필요한 데이터 스캔 제거 |
| **Pre-aggregation** | 시간 윈도우 기반 미리 계산 | 실시간 집계 연산 최소화 |
| **캐싱** | 자주 사용되는 결과 저장 | 반복 쿼리 응답 시간 단축 |


---

## 🚀 실무 프로젝트: IoT 센서 데이터 수집 시스템 {#실무-프로젝트-iot-센서-데이터-수집-시스템}

### 프로젝트 개요

대규모 IoT 센서 네트워크에서 실시간으로 데이터를 수집, 저장, 분석하는 시스템을 구축합니다.

#### 시스템 요구사항

| 요구사항 | 사양 | 목표 |
|----------|------|------|
| **센서 수** | 10,000개 센서 | 전 세계 분산 배치 |
| **데이터 생성량** | 1M 포인트/초 | 실시간 처리 |
| **데이터 보존** | 1년간 저장 | 장기 트렌드 분석 |
| **응답 시간** | < 100ms | 실시간 대시보드 |
| **가용성** | 99.9% | 24/7 운영 |

### 시스템 아키텍처

#### 시스템 아키텍처 구성

| 계층 | 구성요소 | 기술 스택 | 특징 |
|------|----------|-----------|------|
| **데이터 수집** | MQTT Broker, Message Queue, Data Ingestion | Eclipse Mosquitto, Apache Kafka, InfluxDB | 수평 확장 가능 |
| **데이터 저장** | Time Series DB, Data Compression, Retention Policy | InfluxDB Cluster, TSM Compression, Automated Cleanup | 압축률 50:1 달성 |
| **데이터 처리** | Real-time Analytics, Alert Engine, Data Aggregation | Apache Flink, Custom Alert Rules, Time Window Functions | < 100ms 응답시간 |
| **데이터 시각화** | Dashboard, Real-time Charts, Alert Management | Grafana, WebSocket, Push Notifications | 실시간 모니터링 |
    
#### 데이터 모델 설계

**Measurement**: `sensor_data`

| 구분 | 필드명 | 설명 | 데이터 타입 |
|------|--------|------|-------------|
| **Tags** | sensor_id | 고유 센서 식별자 | String |
| | location | 센서 위치 (건물, 층, 구역) | String |
| | sensor_type | 센서 유형 (온도, 습도, 압력) | String |
| | manufacturer | 제조사 | String |
| | firmware_version | 펌웨어 버전 | String |
| **Fields** | value | 측정값 | Float |
| | quality | 데이터 품질 점수 (0-100) | Integer |
| | battery_level | 배터리 잔량 (%) | Float |
| | signal_strength | 신호 강도 (dBm) | Float |

#### 데이터 보존 정책

| 데이터 타입 | 보존 기간 | 용도 |
|-------------|-----------|------|
| **원시 데이터** | 30일 | 실시간 분석, 디버깅 |
| **시간별 집계** | 1년 | 트렌드 분석, 성능 모니터링 |
| **일별 집계** | 5년 | 장기 트렌드, 비즈니스 인텔리전스 |


### 데이터 수집 파이프라인 구현

#### 파이프라인 구성요소

| 구성요소 | 역할 | 기술 스택 |
|----------|------|-----------|
| **MQTT Broker** | 센서 데이터 수집 | Eclipse Mosquitto |
| **Kafka Producer** | 메시지 큐잉 | Apache Kafka |
| **InfluxDB Client** | 시계열 데이터 저장 | InfluxDB |

#### 파이프라인 설정

| 구성요소 | 설정 | 값 |
|----------|------|-----|
| **MQTT** | Broker Host | mqtt-broker.company.com:1883 |
| | Topics | sensors/+/temperature, sensors/+/humidity, sensors/+/pressure |
| | QoS | 1 |
| **Kafka** | Bootstrap Servers | kafka1:9092, kafka2:9092 |
| | Topic | sensor-data-raw |
| | Partitions | 10 |
| | Replication Factor | 3 |
| **InfluxDB** | Host | influxdb-cluster.company.com:8086 |
| | Database | iot_sensors |
| | Retention Policy | 30_days |
| | Batch Size | 5000 |
| | Flush Interval | 1000ms |

#### 센서 데이터 검증 규칙

| 검증 항목 | 규칙 | 임계값 |
|-----------|------|--------|
| **온도 센서** | 값 범위 | -50°C ~ 100°C |
| **습도 센서** | 값 범위 | 0% ~ 100% |
| **압력 센서** | 값 범위 | 800hPa ~ 1200hPa |
| **데이터 품질** | 품질 점수 | ≥ 80 |
| **배터리 레벨** | 배터리 잔량 | ≥ 10% |
| **신호 강도** | 신호 강도 | ≥ -80dBm |


### 실시간 분석 및 알림 시스템

#### 집계 윈도우 설정

| 윈도우 크기 | 시간(초) | 용도 |
|-------------|----------|------|
| **1분** | 60 | 실시간 모니터링 |
| **5분** | 300 | 단기 트렌드 분석 |
| **1시간** | 3600 | 중기 패턴 분석 |
| **1일** | 86400 | 장기 트렌드 분석 |

#### 알림 규칙 설정

| 규칙명 | 조건 | 심각도 | 알림 채널 | 쿨다운 |
|--------|------|--------|-----------|--------|
| **온도 이상** | temperature > 35 OR temperature < -10 | CRITICAL | email, sms, slack | 5분 |
| **배터리 부족** | battery_level < 20 | WARNING | email | 1시간 |
| **데이터 품질** | quality < 80 | WARNING | slack | 30분 |
| **센서 오프라인** | no_data_received > 300초 | CRITICAL | email, sms | 10분 |

#### 실시간 분석 처리 흐름

| 처리 단계 | 설명 | 출력 |
|-----------|------|------|
| **즉시 알림** | 실시간 조건 검사 | 알림 이벤트 |
| **집계 메트릭** | 시간 윈도우 기반 계산 | 평균, 최대/최소, 분산 |
| **트렌드 분석** | 패턴 및 이상 탐지 | 트렌드 지표 |

#### 집계 메트릭 종류

| 메트릭 | 계산 방법 | 윈도우 크기 |
|--------|-----------|-------------|
| **이동 평균** | 연속 값들의 평균 | 1분, 5분 |
| **최대/최소** | 시간 범위 내 극값 | 1시간 |
| **분산** | 값들의 변동성 | 5분 |


### 성능 모니터링과 최적화

#### 성능 임계값 설정

| 메트릭 | 임계값 | 단위 | 설명 |
|--------|--------|------|------|
| **Ingestion Rate** | 1,000,000 | points/second | 데이터 수집 처리량 |
| **Query Response Time** | 0.1 | seconds | 쿼리 응답 시간 |
| **Storage Utilization** | 0.8 | 80% | 저장 공간 사용률 |
| **Memory Usage** | 0.85 | 85% | 메모리 사용률 |
| **CPU Usage** | 0.8 | 80% | CPU 사용률 |

#### 성능 모니터링 메트릭

| 모니터링 영역 | 메트릭 | 설명 |
|---------------|--------|------|
| **Ingestion** | Current Rate, Peak Rate, Failed Writes, Queue Depth | 데이터 수집 성능 |
| **Query** | Response Time, Throughput, Slow Queries, Cache Hit Rate | 쿼리 성능 |
| **Storage** | Disk Usage, Compression Ratio, Retention Effectiveness, Index Size | 저장 효율성 |
| **Resource** | Memory Usage, CPU Usage, Network I/O, Disk I/O | 시스템 리소스 |

#### 자동 최적화 전략

| 최적화 타입 | 조건 | 액션 | 예상 개선 효과 |
|-------------|------|------|---------------|
| **쓰기 최적화** | 처리량 임계값 초과 | 배치 크기 증가, 압축 강화 | 20-30% 처리량 향상 |
| **쿼리 최적화** | 응답 시간 임계값 초과 | 인덱스 추가, Pre-aggregation | 50-70% 응답 시간 단축 |
| **저장 최적화** | 저장 공간 임계값 초과 | 보존 정책 조정, 압축 강화 | 30-50% 저장 공간 절약 |


---

## 📚 학습 요약 {#학습-요약}

### 핵심 개념 정리

1. **시계열 데이터의 특성**
   - 시간 기반 정렬, 고빈도 생성, 불변성
   - 압축 가능성, 보존 정책 필요성
   - 전통적 데이터베이스의 한계 극복

2. **주요 TDB 솔루션**
   - **InfluxDB**: 시계열 전용, 높은 성능
   - **TimescaleDB**: PostgreSQL 기반, SQL 호환
   - **Prometheus**: 메트릭 중심, 모니터링 최적화
   - **클라우드 서비스**: 관리형 솔루션

3. **TDB 아키텍처**
   - 단일 노드 vs 분산 아키텍처
   - 행 기반 vs 열 기반 저장
   - 압축 알고리즘과 인덱싱 전략

4. **성능 최적화**
   - 배치 쓰기와 압축 최적화
   - 시간 기반 인덱싱과 쿼리 최적화
   - 실시간 분석과 알림 시스템

5. **실무 적용**
   - IoT 센서 데이터 수집 시스템
   - 실시간 분석과 대시보드
   - 성능 모니터링과 자동 최적화

### 다음 단계

**Part 2에서는 다룰 내용:**
- TDB 고급 기능과 최적화 기법
- 분산 TDB 클러스터 구축
- 압축 알고리즘과 데이터 보존 정책
- 대규모 모니터링 시스템 실무 프로젝트

**핵심 학습 포인트:**
- ✅ 시계열 데이터의 고유한 특성 이해
- ✅ 주요 TDB 솔루션의 장단점 비교
- ✅ TDB 아키텍처와 저장 방식 이해
- ✅ 성능 최적화 원리와 실무 적용
- ✅ IoT 센서 데이터 수집 시스템 구축

Time Series Database의 기초를 완전히 정복했습니다! 🎉
