---
layout: post
lang: ko
title: "Part 1: Change Data Capture와 Debezium 실전 구현 - 실시간 데이터 동기화의 완성"
description: "CDC의 핵심 개념부터 Debezium을 활용한 실시간 데이터 동기화 시스템 구축까지, 이벤트 드리븐 아키텍처의 완전한 가이드입니다."
date: 2025-09-19
author: Data Droid
category: data-engineering
tags: [Change-Data-Capture, CDC, Debezium, Kafka, 실시간동기화, 이벤트드리븐, 데이터파이프라인, 스키마진화]
series: change-data-capture-complete-guide
series_order: 1
reading_time: "50분"
difficulty: "고급"
---

# Part 1: Change Data Capture와 Debezium 실전 구현 - 실시간 데이터 동기화의 완성

> CDC의 핵심 개념부터 Debezium을 활용한 실시간 데이터 동기화 시스템 구축까지, 이벤트 드리븐 아키텍처의 완전한 가이드입니다.

## 📋 목차 {#목차}

1. [Change Data Capture 기초 개념](#change-data-capture-기초-개념)
2. [Debezium 아키텍처와 핵심 기능](#debezium-아키텍처와-핵심-기능)
3. [Debezium 커넥터 설정과 운영](#debezium-커넥터-설정과-운영)
4. [스키마 진화와 스키마 레지스트리](#스키마-진화와-스키마-레지스트리)
5. [실시간 데이터 변환과 라우팅](#실시간-데이터-변환과-라우팅)
6. [실무 프로젝트: 실시간 데이터 동기화 시스템](#실무-프로젝트-실시간-데이터-동기화-시스템)
7. [학습 요약](#학습-요약)

## 🔄 Change Data Capture 기초 개념 {#change-data-capture-기초-개념}

### CDC란 무엇인가?

Change Data Capture(CDC)는 데이터베이스의 변경사항을 실시간으로 감지하고 캡처하여 다른 시스템으로 전파하는 기술입니다. 전통적인 배치 처리 방식의 한계를 극복하고 실시간 데이터 동기화를 가능하게 합니다.

### 전통적인 배치 처리 vs CDC

| 특성 | 배치 처리 | CDC 방식 |
|------|-----------|----------|
| **지연시간** | 높음 (시간/일 단위) | 낮음 (초/분 단위) |
| **처리량** | 높음 (대용량 일괄 처리) | 중간 (실시간 스트림) |
| **복잡성** | 낮음 | 높음 |
| **일관성** | 최종 일관성 | 강한 일관성 가능 |
| **리소스 사용** | 주기적 높음 | 지속적 중간 |
| **실시간 처리** | 불가능 | 가능 |
| **주요 사용 사례** | • ETL 파이프라인<br>• 데이터 웨어하우스 구축<br>• 일일/주간 리포트<br>• 대용량 데이터 마이그레이션 | • 실시간 분석<br>• 이벤트 드리븐 아키텍처<br>• 데이터 레이크 실시간 동기화<br>• 마이크로서비스 간 데이터 동기화 |

### CDC 도입 ROI 평가

| 평가 기준 | 점수 | 조건 | 설명 |
|-----------|------|------|------|
| **데이터 신선도** | 40점 | 실시간/분 단위 | 즉시 처리 필요 |
| **데이터 신선도** | 20점 | 시간 단위 | 빠른 처리 필요 |
| **비즈니스 중요도** | 30점 | 3개 이상 크리티컬 프로세스 | 핵심 비즈니스 영향 |
| **컴플라이언스** | 20점 | 규제 요구사항 있음 | 감사 추적 필요 |
| **데이터 볼륨** | 10점 | 일일 1TB 이상 | 대용량 처리 |

#### ROI 권장사항

| 총점 | 권장사항 | 적용 시나리오 |
|------|----------|---------------|
| **70점 이상** | 강력 추천 | 실시간 분석, 금융 거래, IoT 데이터 |
| **40-69점** | 고려 권장 | 중간 수준의 실시간 요구사항 |
| **40점 미만** | 신중 검토 | 배치 처리로도 충분한 경우 |

```python
class BatchProcessingVsCDC:
    def calculate_roi_score(self, requirements):
        """CDC 도입 ROI 점수 계산"""
        score = 0
        if requirements.get("max_latency") in ["realtime", "minutes"]:
            score += 40
        elif requirements.get("max_latency") == "hourly":
            score += 20
        
        if len(requirements.get("critical_processes", [])) > 3:
            score += 30
        
        if requirements.get("compliance", False):
            score += 20
        
        if "TB" in requirements.get("daily_volume", ""):
            score += 10
        
        return score
```

### 주요 CDC 도구 비교

| 도구 | 타입 | 지원 DB |
|------|------|---------|
| **Debezium** | Open Source | MySQL, PostgreSQL, MongoDB, SQL Server, Oracle, DB2 |
| **Kafka Connect** | Apache Kafka 생태계 | JDBC 호환 모든 DB, Elasticsearch, HDFS, S3 |
| **Maxwell** | Open Source | MySQL |
| **AWS DMS** | Managed Service | MySQL, PostgreSQL, Oracle, SQL Server, MongoDB |

#### 주요 장점 비교

| 도구 | 주요 장점 |
|------|-----------|
| **Debezium** | • 풍부한 DB 지원<br>• Kafka 생태계 통합<br>• 스키마 진화 지원<br>• 확장성과 안정성 |
| **Kafka Connect** | • Kafka 네이티브 통합<br>• 풍부한 커넥터 생태계<br>• 확장 가능한 아키텍처 |
| **Maxwell** | • 간단한 설정<br>• MySQL 특화 최적화<br>• 가벼운 리소스 사용 |
| **AWS DMS** | • 완전 관리형 서비스<br>• AWS 생태계 통합<br>• 고가용성<br>• 모니터링 내장 |

#### 주요 단점과 사용 사례

| 도구 | 주요 단점 | 최적 사용 사례 |
|------|-----------|----------------|
| **Debezium** | • 설정 복잡성<br>• Kafka 의존성<br>• 운영 오버헤드 | • 대규모 이벤트 스트리밍<br>• 마이크로서비스 아키텍처<br>• 데이터 레이크 실시간 동기화 |
| **Kafka Connect** | • JDBC 기반 지연시간<br>• 복잡한 설정<br>• 모니터링 복잡성 | • Kafka 중심 아키텍처<br>• 다양한 시스템 통합<br>• 기존 ETL 파이프라인 현대화 |
| **Maxwell** | • MySQL만 지원<br>• 제한된 확장성<br>• 작은 커뮤니티 | • MySQL 전용 환경<br>• 간단한 CDC 요구사항<br>• 프로토타입 개발 |
| **AWS DMS** | • AWS 벤더 락인<br>• 비용<br>• 커스터마이징 제한 | • AWS 중심 아키텍처<br>• 관리 부담 최소화<br>• 엔터프라이즈 환경 |

### CDC 도구 선택 기준

| 조건 | 권장 도구 | 선택 이유 |
|------|-----------|-----------|
| **MySQL + 낮은 복잡성** | Maxwell | 간단한 설정, MySQL 특화 최적화 |
| **AWS 관리형 서비스** | AWS DMS | 완전 관리형, AWS 생태계 통합 |
| **대규모 + 고복잡성** | Debezium | 풍부한 기능, 확장성, 스키마 진화 |
| **기타 경우** | Kafka Connect | 범용성, 커넥터 생태계 |

#### 선택 기준별 가중치

| 기준 | 가중치 | 설명 |
|------|--------|------|
| **데이터베이스 타입** | 높음 | 지원 범위와 최적화 수준 |
| **규모** | 높음 | 처리량과 확장성 요구사항 |
| **복잡성** | 중간 | 설정과 운영의 복잡도 |
| **예산** | 중간 | 라이선스 비용과 관리 비용 |
| **팀 전문성** | 낮음 | 학습 곡선과 운영 능력 |

```python
class CDCToolsComparison:
    def select_optimal_tool(self, requirements):
        """요구사항에 따른 최적 도구 선택"""
        if (requirements.get("database") == "mysql" and 
            requirements.get("complexity") == "low"):
            return "maxwell"
        elif requirements.get("budget") == "aws_managed":
            return "aws_dms"
        elif (requirements.get("scale") == "large" and 
              requirements.get("complexity") == "high"):
            return "debezium"
        else:
            return "kafka_connect"
```

## 🔧 Debezium 아키텍처와 핵심 기능 {#debezium-아키텍처와-핵심-기능}

### Debezium 아키텍처 개요

Debezium은 Apache Kafka Connect 프레임워크를 기반으로 구축된 오픈소스 CDC 플랫폼입니다. 다양한 데이터베이스의 변경사항을 실시간으로 캡처하여 Kafka 토픽으로 전송합니다.

### 핵심 컴포넌트

Debezium의 핵심 컴포넌트는 다음과 같습니다:

- **Debezium Connectors**: 각 데이터베이스별로 특화된 커넥터
- **Kafka Connect Framework**: 커넥터 실행 및 관리 프레임워크
- **Schema Registry**: 스키마 진화 및 호환성 관리
- **Change Data Capture Engine**: 변경사항 감지 및 캡처 엔진

### 데이터베이스별 변경 감지 메커니즘

| 데이터베이스 | 변경 감지 방식 | 주요 기능 | 스냅샷 모드 |
|--------------|----------------|-----------|-------------|
| **MySQL** | 바이너리 로그 (Binlog) | • GTID 지원<br>• 글로벌 트랜잭션 식별자 | 초기 스냅샷 + 증분 동기화 |
| **PostgreSQL** | Write-Ahead Log (WAL) | • 논리적 복제 슬롯<br>• 네이티브 복제 프로토콜 | 초기 스냅샷 + 스트리밍 |
| **MongoDB** | Operations Log (Oplog) | • Change Streams (3.6+)<br>• 재시작 지점 추적 | 초기 스냅샷 + Oplog 추적 |

### Kafka Connect 아키텍처

| 모드 | 설명 | 주요 특징 |
|------|------|-----------|
| **Distributed Mode** | 분산 모드 | • 고가용성 보장<br>• 수평 확장 가능<br>• 장애 복구 자동화 |
| **Standalone Mode** | 단일 노드 모드 | • 개발/테스트 환경<br>• 간단한 설정<br>• 단일 프로세스 실행 |

### Kafka Topics 구조

| 토픽 타입 | 용도 | 주요 내용 |
|-----------|------|-----------|
| **change_events** | 데이터베이스 변경 이벤트 | 실제 데이터 변경사항 |
| **schema_changes** | 스키마 변경 이벤트 | 테이블/컬럼 구조 변경 |
| **heartbeat** | 연결 상태 확인 | 커넥터 상태 모니터링 |
| **transaction_metadata** | 트랜잭션 메타데이터 | 트랜잭션 경계 정보 |

```python
class DebeziumArchitecture:
    def create_debezium_configuration(self, database_type, connection_config):
        """Debezium 설정 생성"""
        
        base_config = {
            "name": f"{database_type}-connector",
            "config": {
                "connector.class": f"io.debezium.connector.{database_type.title()}.MySqlConnector",
                "tasks.max": "1",
                "database.hostname": connection_config["host"],
                "database.port": connection_config["port"],
                "database.user": connection_config["user"],
                "database.password": connection_config["password"],
                "database.server.id": "184054",
                "topic.prefix": connection_config["server_name"],
                "schema.history.internal.kafka.bootstrap.servers": "kafka:9092",
                "schema.history.internal.kafka.topic": f"schema-changes.{connection_config['server_name']}",
                "include.schema.changes": "true",
                "snapshot.mode": "initial"
            }
        }
        
        if database_type == "mysql":
            base_config["config"].update({
                "connector.class": "io.debezium.connector.mysql.MySqlConnector",
                "database.server.id": "184054",
                "database.include.list": ",".join(connection_config.get("databases", [])),
                "table.include.list": ",".join(connection_config.get("tables", [])),
                "binlog.buffer.size": "8192",
                "max.batch.size": "2048",
                "max.queue.size": "8192",
                "poll.interval.ms": "1000",
                "snapshot.locking.mode": "minimal"
            })
        
        elif database_type == "postgresql":
            base_config["config"].update({
                "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
                "database.dbname": connection_config["database"],
                "database.slot.name": f"debezium_{connection_config['server_name']}",
                "plugin.name": "pgoutput",
                "publication.name": f"debezium_publication_{connection_config['server_name']}",
                "slot.drop.on.stop": "false",
                "publication.autocreate.mode": "filtered"
            })
        
        elif database_type == "mongodb":
            base_config["config"].update({
                "connector.class": "io.debezium.connector.mongodb.MongoDbConnector",
                "mongodb.hosts": connection_config["hosts"],
                "mongodb.name": connection_config["server_name"],
                "collection.include.list": ",".join(connection_config.get("collections", [])),
                "capture.mode": "change_streams_update_full",
                "snapshot.mode": "initial"
            })
        
        return base_config
```

### 이벤트 스트리밍 패턴

| 패턴 | 개념 | 주요 장점 | 구현 방식 |
|------|------|-----------|-----------|
| **Event Sourcing** | 모든 상태 변경을 이벤트로 저장 | • 완전한 변경 이력 추적<br>• 시간 여행 가능<br>• 감사 로그 자동 생성<br>• 분산 시스템 간 일관성 | • Kafka 토픽을 이벤트 스토어로 활용<br>• 주기적 스냅샷으로 성능 최적화<br>• 읽기 모델 생성<br>• 이벤트 재생으로 상태 복원 |
| **CQRS** | 명령과 조회의 책임 분리 | • 독립적 스케일링<br>• 최적화된 읽기/쓰기 모델<br>• 복잡성 분리<br>• 성능 향상 | • Debezium으로 명령 이벤트 캡처<br>• 읽기 전용 데이터베이스 구축<br>• 이벤트를 읽기 모델로 변환<br>• 최종 일관성 보장 |
| **Saga** | 분산 트랜잭션 관리 | • 분산 환경에서 트랜잭션 처리<br>• 장애 복구 가능<br>• 확장성 보장 | • 이벤트 기반 조율 (Choreography)<br>• 중앙 오케스트레이터 (Orchestration)<br>• 보상 트랜잭션 처리<br>• Saga 상태 관리 |

```python
class EventStreamingPatterns:
    def implement_event_sourcing_pattern(self):
        """Event Sourcing 패턴 구현 예제"""
        
        # 이벤트 스토어 설정
        event_store_config = {
            "kafka_topics": {
                "order_events": "orders.ecommerce.orders",
                "customer_events": "orders.ecommerce.customers",
                "product_events": "orders.ecommerce.products"
            },
            "event_serialization": "Avro",
            "snapshot_frequency": "every_1000_events",
            "retention_policy": "7_days"
        }
        
        # 이벤트 재생 예제
        def replay_events_for_state(self, entity_id, from_timestamp):
            """특정 엔티티의 상태를 이벤트 재생으로 복원"""
            events = self.get_events(entity_id, from_timestamp)
            state = {}
            for event in events:
                state = self.apply_event(state, event)
            return state
        
        return event_store_config
    
    def implement_cqrs_pattern(self):
        """CQRS 패턴 구현 예제"""
        
        # 명령 측 (Command Side)
        command_side_config = {
            "write_model": {
                "database": "mysql_orders",
                "tables": ["orders", "order_items"],
                "optimization": "for_writes"
            },
            "event_publishing": {
                "debezium_connector": "mysql-orders-connector",
                "topics": ["orders.ecommerce.orders"]
            }
        }
        
        # 조회 측 (Query Side)
        query_side_config = {
            "read_models": {
                "elasticsearch": {
                    "indexes": ["orders_read_model", "customers_read_model"],
                    "optimization": "for_reads",
                    "projections": ["order_summary", "customer_profile"]
                },
                "redis": {
                    "caches": ["order_cache", "customer_cache"],
                    "ttl": "1_hour"
                }
            }
        }
        
        return {
            "command_side": command_side_config,
            "query_side": query_side_config
        }
    
    def implement_saga_pattern(self):
        """Saga 패턴 구현 예제"""
        
        # Choreography 패턴
        choreography_saga = {
            "order_processing_saga": {
                "steps": [
                    {
                        "service": "order_service",
                        "action": "create_order",
                        "compensation": "cancel_order",
                        "event": "OrderCreated"
                    },
                    {
                        "service": "inventory_service", 
                        "action": "reserve_inventory",
                        "compensation": "release_inventory",
                        "event": "InventoryReserved"
                    },
                    {
                        "service": "payment_service",
                        "action": "process_payment",
                        "compensation": "refund_payment",
                        "event": "PaymentProcessed"
                    }
                ],
                "compensation_strategy": "reverse_order"
            }
        }
        
        # Orchestration 패턴
        orchestration_saga = {
            "saga_orchestrator": {
                "state_machine": {
                    "states": ["STARTED", "INVENTORY_RESERVED", "PAYMENT_PROCESSED", "COMPLETED"],
                    "transitions": {
                        "STARTED": "INVENTORY_RESERVED",
                        "INVENTORY_RESERVED": "PAYMENT_PROCESSED",
                        "PAYMENT_PROCESSED": "COMPLETED"
                    },
                    "compensation_states": ["INVENTORY_RELEASED", "PAYMENT_REFUNDED", "CANCELLED"]
                }
            }
        }
        
        return {
            "choreography": choreography_saga,
            "orchestration": orchestration_saga
        }
```

## ⚙️ Debezium 커넥터 설정과 운영

### MySQL 커넥터 설정

```python
class MySQLConnectorSetup:
    def __init__(self):
        self.config_templates = {}
    
    def setup_mysql_connector(self, environment_config):
        """MySQL 커넥터 설정"""
        
        # MySQL 서버 설정
        mysql_server_config = {
            "binlog_format": "ROW",
            "binlog_row_image": "FULL",
            "log_bin": "mysql-bin",
            "server_id": environment_config["server_id"],
            "gtid_mode": "ON",
            "enforce_gtid_consistency": "ON"
        }
        
        # Debezium MySQL 커넥터 설정
        connector_config = {
            "name": f"mysql-connector-{environment_config['server_name']}",
            "config": {
                "connector.class": "io.debezium.connector.mysql.MySqlConnector",
                "database.hostname": environment_config["mysql_host"],
                "database.port": environment_config["mysql_port"],
                "database.user": environment_config["mysql_user"],
                "database.password": environment_config["mysql_password"],
                "database.server.id": str(environment_config["server_id"]),
                "topic.prefix": environment_config["server_name"],
                
                # 데이터베이스 및 테이블 필터링
                "database.include.list": ",".join(environment_config.get("included_databases", [])),
                "table.include.list": ",".join(environment_config.get("included_tables", [])),
                "database.exclude.list": ",".join(environment_config.get("excluded_databases", [])),
                "table.exclude.list": ",".join(environment_config.get("excluded_tables", [])),
                
                # 성능 최적화 설정
                "binlog.buffer.size": "32768",
                "max.batch.size": "4096",
                "max.queue.size": "16384",
                "poll.interval.ms": "500",
                "snapshot.locking.mode": "minimal",
                "snapshot.fetch.size": "2048",
                
                # 스키마 및 메타데이터 설정
                "schema.history.internal.kafka.bootstrap.servers": environment_config["kafka_bootstrap_servers"],
                "schema.history.internal.kafka.topic": f"schema-changes.{environment_config['server_name']}",
                "include.schema.changes": "true",
                "schema.name.adjustment.mode": "avro",
                
                # 스냅샷 설정
                "snapshot.mode": "initial",
                "snapshot.lock.timeout.ms": "10000",
                "snapshot.delay.ms": "0",
                
                # 트랜잭션 메타데이터
                "provide.transaction.metadata": "true",
                "transaction.topic": f"transactions.{environment_config['server_name']}",
                
                # 하트비트 설정
                "heartbeat.interval.ms": "30000",
                "heartbeat.topics.prefix": f"heartbeats.{environment_config['server_name']}"
            }
        }
        
        return {
            "mysql_server_config": mysql_server_config,
            "connector_config": connector_config
        }
    
    def setup_advanced_mysql_config(self, high_performance_config):
        """고성능 MySQL 커넥터 설정"""
        
        advanced_config = {
            "name": f"mysql-high-perf-connector-{high_performance_config['server_name']}",
            "config": {
                "connector.class": "io.debezium.connector.mysql.MySqlConnector",
                "database.hostname": high_performance_config["mysql_host"],
                "database.port": high_performance_config["mysql_port"],
                "database.user": high_performance_config["mysql_user"],
                "database.password": high_performance_config["mysql_password"],
                "database.server.id": str(high_performance_config["server_id"]),
                "topic.prefix": high_performance_config["server_name"],
                
                # 고성능 설정
                "binlog.buffer.size": "65536",
                "max.batch.size": "8192",
                "max.queue.size": "32768",
                "poll.interval.ms": "100",
                "max.queue.size.in.bytes": "104857600",  # 100MB
                
                # 병렬 처리 설정
                "tasks.max": str(high_performance_config.get("max_tasks", 1)),
                "database.connectionTimeZone": "UTC",
                
                # 메모리 최적화
                "binlog.read.buffered.bytes": "1048576",
                "inconsistent.schema.handling.mode": "warn",
                
                # 필터링 최적화
                "database.include.list": ",".join(high_performance_config.get("included_databases", [])),
                "table.include.list": ",".join(high_performance_config.get("included_tables", [])),
                
                # 스키마 설정
                "schema.history.internal.kafka.bootstrap.servers": high_performance_config["kafka_bootstrap_servers"],
                "schema.history.internal.kafka.topic": f"schema-changes.{high_performance_config['server_name']}",
                "include.schema.changes": "true",
                
                # 트랜잭션 설정
                "provide.transaction.metadata": "true",
                "transaction.topic": f"transactions.{high_performance_config['server_name']}",
                
                # 하트비트
                "heartbeat.interval.ms": "10000",
                "heartbeat.topics.prefix": f"heartbeats.{high_performance_config['server_name']}"
            }
        }
        
        return advanced_config
```

### PostgreSQL 커넥터 설정

```python
class PostgreSQLConnectorSetup:
    def __init__(self):
        self.config_templates = {}
    
    def setup_postgresql_connector(self, environment_config):
        """PostgreSQL 커넥터 설정"""
        
        # PostgreSQL 서버 설정
        postgresql_server_config = {
            "wal_level": "logical",
            "max_wal_senders": "10",
            "max_replication_slots": "10",
            "hot_standby": "on"
        }
        
        # Debezium PostgreSQL 커넥터 설정
        connector_config = {
            "name": f"postgresql-connector-{environment_config['server_name']}",
            "config": {
                "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
                "database.hostname": environment_config["postgres_host"],
                "database.port": environment_config["postgres_port"],
                "database.user": environment_config["postgres_user"],
                "database.password": environment_config["postgres_password"],
                "database.dbname": environment_config["database_name"],
                "database.server.name": environment_config["server_name"],
                
                # 복제 슬롯 설정
                "database.slot.name": f"debezium_{environment_config['server_name']}",
                "slot.drop.on.stop": "false",
                "slot.streaming.resume.lsn": "0/0",
                
                # Publication 설정
                "plugin.name": "pgoutput",
                "publication.name": f"debezium_publication_{environment_config['server_name']}",
                "publication.autocreate.mode": "filtered",
                
                # 스키마 및 테이블 필터링
                "schema.include.list": ",".join(environment_config.get("included_schemas", [])),
                "table.include.list": ",".join(environment_config.get("included_tables", [])),
                "schema.exclude.list": ",".join(environment_config.get("excluded_schemas", [])),
                "table.exclude.list": ",".join(environment_config.get("excluded_tables", [])),
                
                # 성능 설정
                "max.batch.size": "4096",
                "max.queue.size": "16384",
                "poll.interval.ms": "500",
                "status.update.interval.ms": "10000",
                
                # 스키마 히스토리
                "schema.history.internal.kafka.bootstrap.servers": environment_config["kafka_bootstrap_servers"],
                "schema.history.internal.kafka.topic": f"schema-changes.{environment_config['server_name']}",
                "include.schema.changes": "true",
                
                # 스냅샷 설정
                "snapshot.mode": "initial",
                "snapshot.lock.timeout.ms": "10000",
                "snapshot.delay.ms": "0",
                "snapshot.include.collection.list": ",".join(environment_config.get("snapshot_tables", [])),
                
                # 트랜잭션 메타데이터
                "provide.transaction.metadata": "true",
                "transaction.topic": f"transactions.{environment_config['server_name']}",
                
                # 하트비트
                "heartbeat.interval.ms": "30000",
                "heartbeat.topics.prefix": f"heartbeats.{environment_config['server_name']}",
                
                # 데이터 타입 매핑
                "decimal.handling.mode": "precise",
                "time.precision.mode": "adaptive",
                "binary.handling.mode": "base64"
            }
        }
        
        return {
            "postgresql_server_config": postgresql_server_config,
            "connector_config": connector_config
        }
```

### MongoDB 커넥터 설정

```python
class MongoDBConnectorSetup:
    def __init__(self):
        self.config_templates = {}
    
    def setup_mongodb_connector(self, environment_config):
        """MongoDB 커넥터 설정"""
        
        # MongoDB 서버 설정
        mongodb_server_config = {
            "replication": "enabled",
            "oplog_size": "1GB",
            "enable_majority_read_concern": "true"
        }
        
        # Debezium MongoDB 커넥터 설정
        connector_config = {
            "name": f"mongodb-connector-{environment_config['server_name']}",
            "config": {
                "connector.class": "io.debezium.connector.mongodb.MongoDbConnector",
                "mongodb.hosts": environment_config["mongodb_hosts"],
                "mongodb.name": environment_config["server_name"],
                "mongodb.user": environment_config.get("mongodb_user"),
                "mongodb.password": environment_config.get("mongodb_password"),
                "mongodb.ssl.enabled": environment_config.get("ssl_enabled", "false"),
                
                # 데이터베이스 및 컬렉션 필터링
                "database.include.list": ",".join(environment_config.get("included_databases", [])),
                "collection.include.list": ",".join(environment_config.get("included_collections", [])),
                "database.exclude.list": ",".join(environment_config.get("excluded_databases", [])),
                "collection.exclude.list": ",".join(environment_config.get("excluded_collections", [])),
                
                # 캡처 모드 설정
                "capture.mode": "change_streams_update_full",
                "capture.scope": "deployment",
                
                # 성능 설정
                "max.batch.size": "2048",
                "max.queue.size": "8192",
                "poll.interval.ms": "1000",
                "max.queue.size.in.bytes": "52428800",  # 50MB
                
                # 스키마 히스토리
                "schema.history.internal.kafka.bootstrap.servers": environment_config["kafka_bootstrap_servers"],
                "schema.history.internal.kafka.topic": f"schema-changes.{environment_config['server_name']}",
                "include.schema.changes": "true",
                
                # 스냅샷 설정
                "snapshot.mode": "initial",
                "snapshot.delay.ms": "0",
                
                # 하트비트
                "heartbeat.interval.ms": "30000",
                "heartbeat.topics.prefix": f"heartbeats.{environment_config['server_name']}",
                
                # MongoDB 특화 설정
                "connect.timeout.ms": "30000",
                "socket.timeout.ms": "30000",
                "server.selection.timeout.ms": "30000",
                "cursor.max.await.time.ms": "1000",
                
                # 필드 설정
                "field.renames": ",".join(environment_config.get("field_renames", [])),
                "field.exclude.list": ",".join(environment_config.get("field_excludes", [])),
                
                # 트랜잭션 메타데이터
                "provide.transaction.metadata": "true",
                "transaction.topic": f"transactions.{environment_config['server_name']}"
            }
        }
        
        return {
            "mongodb_server_config": mongodb_server_config,
            "connector_config": connector_config
        }
```

## 📊 스키마 진화와 스키마 레지스트리 {#스키마-진화와-스키마-레지스트리}

### 스키마 진화 개념

스키마 진화는 데이터베이스 스키마가 시간에 따라 변경되면서도 기존 데이터와의 호환성을 유지하는 기능입니다. Debezium은 스키마 변경을 자동으로 감지하고 Kafka로 전파합니다.

#### 스키마 진화의 중요성

- **하위 호환성**: 기존 소비자가 새로운 스키마를 처리할 수 있음
- **상위 호환성**: 새로운 소비자가 기존 스키마를 처리할 수 있음
- **점진적 배포**: 서비스 중단 없이 스키마 변경 가능
- **데이터 일관성**: 변경 과정에서 데이터 손실 방지

### 스키마 레지스트리 통합

```python
class SchemaRegistryIntegration:
    def __init__(self):
        self.schema_configs = {}
    
    def setup_confluent_schema_registry(self, registry_config):
        """Confluent Schema Registry 설정"""
        
        schema_registry_config = {
            "schema.registry.url": registry_config["schema_registry_url"],
            "key.converter": "io.confluent.connect.avro.AvroConverter",
            "key.converter.schema.registry.url": registry_config["schema_registry_url"],
            "value.converter": "io.confluent.connect.avro.AvroConverter",
            "value.converter.schema.registry.url": registry_config["schema_registry_url"],
            "value.converter.auto.register.schemas": "true",
            "value.converter.use.latest.version": "true",
            "transforms": "unwrap",
            "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
            "transforms.unwrap.drop.tombstones": "false",
            "transforms.unwrap.delete.handling.mode": "drop",
            "transforms.unwrap.add.fields": "op,ts_ms,source.ts_ms,source.db,source.table"
        }
        
        return schema_registry_config
```

### 스키마 진화 시나리오

| 시나리오 | 설명 | 호환성 | 처리 방식 | 예시 |
|----------|------|--------|-----------|------|
| **컬럼 추가** | 새로운 컬럼 추가 | FORWARD | 새로운 컬럼은 null 또는 기본값으로 처리 | `ALTER TABLE users ADD COLUMN phone VARCHAR(20)` |
| **컬럼 삭제** | 컬럼 삭제 | BACKWARD | 기존 데이터에서 해당 컬럼 제거 | `ALTER TABLE users DROP COLUMN old_field` |
| **컬럼 이름 변경** | 컬럼 이름 변경 | NONE | 새로운 컬럼 추가 후 기존 컬럼 제거 | `ALTER TABLE users RENAME COLUMN old_name TO new_name` |
| **컬럼 타입 변경** | 컬럼 타입 변경 | FORWARD_TRANSITIVE | 타입 호환성 확인 후 변환 | `ALTER TABLE users MODIFY COLUMN age INT` |
| **테이블 추가** | 새로운 테이블 추가 | FORWARD | 자동으로 새로운 토픽 생성 | `CREATE TABLE new_table (...)` |
| **테이블 삭제** | 테이블 삭제 | BACKWARD | 기존 토픽은 유지하되 새로운 이벤트 중단 | `DROP TABLE old_table` |

### 스키마 호환성 전략

| 전략 | 설명 | 사용 사례 | 필드 추가 | 필드 제거 | 타입 변경 | 안전성 |
|------|------|-----------|-----------|-----------|-----------|--------|
| **Backward Compatibility** | 이전 버전과 호환 | 소비자 업데이트 전에 생산자 업데이트 | ✅ 선택적 필드만 | ❌ 금지 | ✅ 확장 가능한 타입만 | 높음 |
| **Forward Compatibility** | 미래 버전과 호환 | 생산자 업데이트 전에 소비자 업데이트 | ❌ 금지 | ✅ 선택적 필드만 | ✅ 축소 가능한 타입만 | 높음 |
| **Full Compatibility** | 양방향 호환 | 가장 안전한 전략 | ✅ 선택적 필드만 | ✅ 선택적 필드만 | ✅ 호환 가능한 타입만 | 최고 |
| **No Compatibility** | 호환성 없음 | 개발 환경 또는 마이그레이션 | ✅ 모든 변경 허용 | ✅ 모든 변경 허용 | ✅ 모든 변경 허용 | 낮음 |

### Schema Registry 호환성 레벨

| 호환성 레벨 | 설명 | 사용 시기 | 업데이트 순서 |
|-------------|------|-----------|---------------|
| **BACKWARD** | 이전 버전과 호환 | 소비자 업데이트 전에 생산자 업데이트 | 소비자 → 생산자 |
| **FORWARD** | 미래 버전과 호환 | 생산자 업데이트 전에 소비자 업데이트 | 생산자 → 소비자 |
| **FULL** | 양방향 호환 | 가장 안전한 전략 | 순서 무관 |
| **NONE** | 호환성 검사 없음 | 개발 환경 또는 마이그레이션 | 제한 없음 |

### 스키마 검증 규칙

| 규칙 | 설명 | 예시 |
|------|------|------|
| **필드 추가** | 새 필드는 optional이어야 함 | `"email": {"type": "string", "optional": true}` |
| **필드 제거** | 기존 필드 제거 시 호환성 확인 | deprecated 마킹 후 단계적 제거 |
| **타입 변경** | 타입 변경 시 호환 가능한 타입만 허용 | int32 → int64 (가능), string → int (불가능) |
| **기본값 설정** | 새 필드에 적절한 기본값 설정 | `"default": null` 또는 적절한 기본값 |

### 스키마 진화 전략

| 전략 유형 | 설명 | 예시 | 처리 방식 |
|-----------|------|------|-----------|
| **Additive Changes** | 안전한 변경 (호환성 유지) | • 새로운 optional 필드 추가<br>• 새로운 테이블 추가<br>• enum 값 추가 | 즉시 적용 가능 |
| **Breaking Changes** | 호환성 파괴 변경 | • 필수 필드 추가<br>• 필드 타입 변경<br>• 필드 삭제<br>• enum 값 제거 | 새로운 스키마 버전으로 처리 |

```python
class SchemaCompatibilityStrategies:
    def implement_schema_compatibility_strategies(self):
        """스키마 호환성 전략 구현"""
        
        # Schema Registry 설정
        schema_registry_config = {
            "url": "http://schema-registry:8081",
            "compatibility_levels": {
                "BACKWARD": "이전 버전과 호환 (소비자 먼저 업데이트)",
                "FORWARD": "미래 버전과 호환 (생산자 먼저 업데이트)", 
                "FULL": "양방향 호환 (가장 안전)",
                "NONE": "호환성 검사 없음 (개발 환경)"
            },
            "validation_rules": {
                "field_addition": "새 필드는 optional이어야 함",
                "field_removal": "기존 필드 제거 시 호환성 확인",
                "type_changes": "타입 변경 시 호환 가능한 타입만 허용",
                "default_values": "새 필드에 적절한 기본값 설정"
            }
        }
        
        return schema_registry_config
    
    def validate_schema_compatibility(self, old_schema, new_schema):
        """스키마 호환성 검증"""
        
        compatibility_results = {
            "is_compatible": True,
            "compatibility_level": "UNKNOWN",
            "issues": [],
            "recommendations": []
        }
        
        # 필드 변경 검증
        old_fields = set(old_schema.get("fields", {}).keys())
        new_fields = set(new_schema.get("fields", {}).keys())
        
        # 추가된 필드 검증
        added_fields = new_fields - old_fields
        for field in added_fields:
            field_def = new_schema["fields"][field]
            if not field_def.get("optional", False):
                compatibility_results["issues"].append(
                    f"새 필드 '{field}'가 required입니다. optional로 변경하세요."
                )
                compatibility_results["is_compatible"] = False
        
        # 제거된 필드 검증
        removed_fields = old_fields - new_fields
        if removed_fields:
            compatibility_results["issues"].append(
                f"제거된 필드: {list(removed_fields)}. 이는 breaking change입니다."
            )
            compatibility_results["is_compatible"] = False
        
        # 타입 변경 검증
        common_fields = old_fields & new_fields
        for field in common_fields:
            old_type = old_schema["fields"][field].get("type")
            new_type = new_schema["fields"][field].get("type")
            
            if old_type != new_type:
                if not self._is_type_compatible(old_type, new_type):
                    compatibility_results["issues"].append(
                        f"필드 '{field}' 타입이 {old_type}에서 {new_type}로 변경됨"
                    )
                    compatibility_results["is_compatible"] = False
        
        # 호환성 레벨 결정
        if compatibility_results["is_compatible"]:
            if added_fields and not removed_fields:
                compatibility_results["compatibility_level"] = "BACKWARD"
            elif removed_fields and not added_fields:
                compatibility_results["compatibility_level"] = "FORWARD"
            elif not added_fields and not removed_fields:
                compatibility_results["compatibility_level"] = "FULL"
        else:
            compatibility_results["compatibility_level"] = "NONE"
        
        # 권장사항 생성
        if not compatibility_results["is_compatible"]:
            compatibility_results["recommendations"] = [
                "새 필드는 optional로 설정하세요",
                "필드 제거 대신 deprecated 마킹을 고려하세요",
                "타입 변경 시 호환 가능한 타입으로 변환하세요",
                "필요시 새로운 스키마 버전을 생성하세요"
            ]
        
        return compatibility_results
    
    def _is_type_compatible(self, old_type, new_type):
        """타입 호환성 검사"""
        compatible_types = {
            "int32": ["int64", "float", "double"],
            "int64": ["float", "double"],
            "float": ["double"],
            "string": ["bytes"],
            "bytes": ["string"]
        }
        
        return new_type in compatible_types.get(old_type, [])
    
    def create_schema_evolution_plan(self, current_schema, target_schema):
        """스키마 진화 계획 생성"""
        
        evolution_plan = {
            "phases": [],
            "estimated_duration": "unknown",
            "risk_level": "low"
        }
        
        # Phase 1: 안전한 변경
        safe_changes = []
        old_fields = set(current_schema.get("fields", {}).keys())
        new_fields = set(target_schema.get("fields", {}).keys())
        
        added_fields = new_fields - old_fields
        for field in added_fields:
            if target_schema["fields"][field].get("optional", False):
                safe_changes.append(f"필드 '{field}' 추가 (optional)")
        
        if safe_changes:
            evolution_plan["phases"].append({
                "phase": 1,
                "type": "safe_changes",
                "description": "안전한 변경 (호환성 유지)",
                "changes": safe_changes,
                "duration": "1-2주"
            })
        
        # Phase 2: Breaking Changes (필요시)
        breaking_changes = []
        removed_fields = old_fields - new_fields
        if removed_fields:
            breaking_changes.append(f"필드 제거: {list(removed_fields)}")
            evolution_plan["risk_level"] = "high"
        
        if breaking_changes:
            evolution_plan["phases"].append({
                "phase": 2,
                "type": "breaking_changes",
                "description": "Breaking Changes (새 버전 필요)",
                "changes": breaking_changes,
                "duration": "2-4주",
                "notes": "소비자 업데이트 필요"
            })
        
        return evolution_plan
```

## 🔄 실시간 데이터 변환과 라우팅 {#실시간-데이터-변환과-라우팅}

### 데이터 변환 파이프라인

```python
class DataTransformationPipeline:
    def __init__(self):
        self.transformation_configs = {}
    
    def setup_single_message_transform(self, transform_config):
        """Single Message Transform (SMT) 설정"""
        
        smt_config = {
            "transforms": ",".join(transform_config["transforms"]),
            
            # 레코드 언래핑
            "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
            "transforms.unwrap.drop.tombstones": "false",
            "transforms.unwrap.delete.handling.mode": "drop",
            "transforms.unwrap.add.fields": "op,ts_ms,source.ts_ms,source.db,source.table",
            "transforms.unwrap.add.headers": "op,source.ts_ms",
            
            # 필드 이름 변환
            "transforms.rename.type": "org.apache.kafka.connect.transforms.ReplaceField$Value",
            "transforms.rename.renames": ",".join(transform_config.get("field_renames", [])),
            
            # 토픽 라우팅
            "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
            "transforms.route.regex": transform_config["topic_regex"],
            "transforms.route.replacement": transform_config["topic_replacement"],
            
            # 필터링
            "transforms.filter.type": "org.apache.kafka.connect.transforms.Filter",
            "transforms.filter.condition": transform_config.get("filter_condition", ""),
            
            # 필드 추가
            "transforms.addfield.type": "org.apache.kafka.connect.transforms.InsertField$Value",
            "transforms.addfield.static.field": "processed_at",
            "transforms.addfield.static.value": "$(date:yyyy-MM-dd'T'HH:mm:ss'Z')"
        }
        
        return smt_config
    
    def implement_custom_transformation(self, custom_logic):
        """커스텀 변환 로직 구현"""
        
        custom_transform_config = {
            "transforms": "custom",
            "transforms.custom.type": "com.company.debezium.CustomTransform",
            "transforms.custom.config": {
                "business_rules": custom_logic["business_rules"],
                "data_validation": custom_logic["validation_rules"],
                "enrichment": custom_logic["enrichment_config"],
                "masking": custom_logic["masking_rules"]
            }
        }
        
        return custom_transform_config
    
    def setup_topic_routing(self, routing_config):
        """토픽 라우팅 설정"""
        
        routing_strategies = {
            "database_based_routing": {
                "description": "데이터베이스별 토픽 분리",
                "configuration": {
                    "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
                    "transforms.route.regex": "([^.]+)\\.([^.]+)\\.([^.]+)",
                    "transforms.route.replacement": "$1-$2-$3"
                },
                "result": "server.database.table -> server-database-table"
            },
            
            "table_based_routing": {
                "description": "테이블별 토픽 분리",
                "configuration": {
                    "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
                    "transforms.route.regex": "([^.]+)\\.([^.]+)\\.([^.]+)",
                    "transforms.route.replacement": "$3"
                },
                "result": "server.database.table -> table"
            },
            
            "operation_based_routing": {
                "description": "연산 타입별 토픽 분리",
                "configuration": {
                    "transforms.route.type": "com.company.debezium.OperationRouter",
                    "transforms.route.insert.topic": "inserts",
                    "transforms.route.update.topic": "updates",
                    "transforms.route.delete.topic": "deletes"
                },
                "result": "INSERT -> inserts, UPDATE -> updates, DELETE -> deletes"
            },
            
            "conditional_routing": {
                "description": "조건부 토픽 라우팅",
                "configuration": {
                    "transforms.route.type": "com.company.debezium.ConditionalRouter",
                    "transforms.route.conditions": {
                        "high_priority": "priority == 'HIGH'",
                        "low_priority": "priority == 'LOW'"
                    },
                    "transforms.route.default.topic": "normal"
                },
                "result": "조건에 따른 동적 토픽 라우팅"
            }
        }
        
        return routing_strategies[routing_config["strategy"]]
    
    def implement_data_enrichment(self, enrichment_config):
        """데이터 풍부화 구현"""
        
        enrichment_pipeline = {
            "lookup_enrichment": {
                "description": "외부 데이터 소스 조회",
                "implementation": {
                    "transforms.enrich.type": "com.company.debezium.LookupTransform",
                    "transforms.enrich.lookup.source": "redis",
                    "transforms.enrich.lookup.key.field": "user_id",
                    "transforms.enrich.lookup.value.fields": "user_name,user_email,user_role"
                }
            },
            
            "calculation_enrichment": {
                "description": "계산된 필드 추가",
                "implementation": {
                    "transforms.calc.type": "com.company.debezium.CalculationTransform",
                    "transforms.calc.formulas": {
                        "total_amount": "price * quantity",
                        "discount_amount": "total_amount * discount_rate",
                        "final_amount": "total_amount - discount_amount"
                    }
                }
            },
            
            "geolocation_enrichment": {
                "description": "지리적 정보 풍부화",
                "implementation": {
                    "transforms.geo.type": "com.company.debezium.GeolocationTransform",
                    "transforms.geo.latitude.field": "lat",
                    "transforms.geo.longitude.field": "lng",
                    "transforms.geo.output.fields": "country,region,city,timezone"
                }
            }
        }
        
        return enrichment_pipeline
```

## 🚀 실무 프로젝트: 실시간 데이터 동기화 시스템 {#실무-프로젝트-실시간-데이터-동기화-시스템}

### 프로젝트 개요

대규모 이커머스 플랫폼을 위한 실시간 데이터 동기화 시스템을 구축합니다. MySQL 주문 데이터베이스의 변경사항을 실시간으로 캡처하여 Elasticsearch 검색 엔진, Redis 캐시, 그리고 데이터 레이크로 동기화합니다.

#### 프로젝트 목표

- **실시간 검색**: 주문 데이터 변경사항을 즉시 Elasticsearch에 반영
- **캐시 동기화**: Redis 캐시의 실시간 업데이트로 응답 속도 향상
- **데이터 레이크**: 분석용 데이터를 Parquet 형태로 저장
- **모니터링**: 전체 파이프라인의 실시간 모니터링 및 알림

#### 기술적 도전과제

- **대용량 처리**: 일일 100만 건 이상의 주문 처리
- **낮은 지연시간**: 5초 이내의 데이터 동기화
- **고가용성**: 99.9% 이상의 시스템 가용성
- **데이터 일관성**: 모든 시스템 간의 데이터 일관성 보장

### 1. 시스템 아키텍처

#### 소스 데이터베이스

| 데이터베이스 | 용도 | 테이블 | 일일 볼륨 | 지연시간 요구사항 |
|--------------|------|--------|-----------|-------------------|
| **MySQL Orders** | 주문 데이터 저장 | orders, order_items, customers, products | 1M 트랜잭션 | < 5초 |
| **MySQL Inventory** | 재고 데이터 저장 | inventory, warehouses, stock_movements | 500K 업데이트 | < 1초 |

#### Kafka 클러스터 구성

| 구성 요소 | 설정값 | 설명 |
|-----------|--------|------|
| **브로커 수** | 3개 | 고가용성 보장 |
| **파티션 수** | 12개 | 병렬 처리 성능 |
| **데이터 보관** | 7일 | 스트리밍 데이터 보관 |
| **토픽** | 4개 | 주문, 아이템, 고객, 재고 이벤트 |

#### 대상 시스템

| 시스템 | 용도 | 인덱스/데이터 타입 | 업데이트 빈도 |
|--------|------|-------------------|---------------|
| **Elasticsearch** | 실시간 검색 및 분석 | orders, customers, products | 실시간 |
| **Redis** | 캐시 및 세션 저장 | customer_sessions, product_cache | 실시간 |
| **Data Lake** | 데이터 분석 및 ML | Parquet 형식 | 시간별 배치 |

```python
class RealTimeDataSyncSystem:
    def __init__(self):
        self.components = {}
        self.data_flows = {}
    
    def design_system_architecture(self):
        """시스템 아키텍처 설계"""
        return {
            "source_databases": ["mysql_orders", "mysql_inventory"],
            "kafka_cluster": {"brokers": 3, "partitions": 12},
            "target_systems": ["elasticsearch", "redis", "data_lake"]
        }
```
    
    def implement_order_sync_pipeline(self):
        """주문 동기화 파이프라인 구현"""
        
        # MySQL 주문 데이터베이스 커넥터
        orders_connector_config = {
            "name": "mysql-orders-connector",
            "config": {
                "connector.class": "io.debezium.connector.mysql.MySqlConnector",
                "database.hostname": "mysql-orders-cluster",
                "database.port": "3306",
                "database.user": "debezium_user",
                "database.password": "secure_password",
                "database.server.id": "184054",
                "topic.prefix": "orders.ecommerce",
                
                # 테이블 필터링
                "table.include.list": "ecommerce.orders,ecommerce.order_items,ecommerce.customers",
                "database.include.list": "ecommerce",
                
                # 성능 최적화
                "binlog.buffer.size": "32768",
                "max.batch.size": "4096",
                "max.queue.size": "16384",
                "poll.interval.ms": "100",
                
                # 스키마 설정
                "schema.history.internal.kafka.bootstrap.servers": "kafka:9092",
                "schema.history.internal.kafka.topic": "schema-changes.orders.ecommerce",
                "include.schema.changes": "true",
                
                # 데이터 변환
                "transforms": "unwrap,route,addTimestamp",
                "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
                "transforms.unwrap.drop.tombstones": "false",
                "transforms.unwrap.delete.handling.mode": "drop",
                "transforms.unwrap.add.fields": "op,ts_ms,source.ts_ms",
                
                # 토픽 라우팅
                "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
                "transforms.route.regex": "orders\\.ecommerce\\.([^.]+)",
                "transforms.route.replacement": "orders.$1",
                
                # 타임스탬프 추가
                "transforms.addTimestamp.type": "org.apache.kafka.connect.transforms.InsertField$Value",
                "transforms.addTimestamp.static.field": "processed_at",
                "transforms.addTimestamp.static.value": "$(date:yyyy-MM-dd'T'HH:mm:ss'Z')",
                
                # 트랜잭션 메타데이터
                "provide.transaction.metadata": "true",
                "transaction.topic": "transactions.orders.ecommerce"
            }
        }
        
        return orders_connector_config
    
    def implement_elasticsearch_sink(self):
        """Elasticsearch 싱크 구현"""
        
        elasticsearch_sink_config = {
            "name": "elasticsearch-orders-sink",
            "config": {
                "connector.class": "io.confluent.connect.elasticsearch.ElasticsearchSinkConnector",
                "topics": "orders.orders,orders.order_items,orders.customers",
                "connection.url": "http://elasticsearch-cluster:9200",
                
                # 인덱스 설정
                "type.name": "_doc",
                "key.ignore": "false",
                "schema.ignore": "true",
                
                # 성능 설정
                "batch.size": "1000",
                "max.in.flight.requests": "5",
                "flush.timeout.ms": "30000",
                "max.retries": "3",
                "retry.backoff.ms": "1000",
                
                # 인덱스 매핑
                "transforms": "route,addTimestamp",
                "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
                "transforms.route.regex": "orders\\.([^.]+)",
                "transforms.route.replacement": "$1-index",
                
                # 타임스탬프 추가
                "transforms.addTimestamp.type": "org.apache.kafka.connect.transforms.InsertField$Value",
                "transforms.addTimestamp.static.field": "indexed_at",
                "transforms.addTimestamp.static.value": "$(date:yyyy-MM-dd'T'HH:mm:ss'Z')",
                
                # 에러 처리
                "errors.tolerance": "all",
                "errors.log.enable": "true",
                "errors.log.include.messages": "true"
            }
        }
        
        return elasticsearch_sink_config
    
    def implement_redis_sink(self):
        """Redis 싱크 구현"""
        
        redis_sink_config = {
            "name": "redis-cache-sink",
            "config": {
                "connector.class": "com.company.connect.redis.RedisSinkConnector",
                "topics": "orders.customers,orders.products",
                "redis.hosts": "redis-cluster:6379",
                "redis.password": "redis_password",
                
                # 데이터 매핑
                "key.converter": "org.apache.kafka.connect.storage.StringConverter",
                "value.converter": "org.apache.kafka.connect.json.JsonConverter",
                "value.converter.schemas.enable": "false",
                
                # 캐시 전략
                "cache.strategy": "write_through",
                "cache.ttl": "3600",  # 1 hour
                "cache.key.field": "id",
                "cache.prefix": "cache:",
                
                # 성능 설정
                "batch.size": "500",
                "flush.timeout.ms": "10000",
                "max.retries": "3",
                
                # 데이터 변환
                "transforms": "extractKey,addMetadata",
                "transforms.extractKey.type": "org.apache.kafka.connect.transforms.ExtractField$Key",
                "transforms.extractKey.field": "id",
                
                "transforms.addMetadata.type": "org.apache.kafka.connect.transforms.InsertField$Value",
                "transforms.addMetadata.static.field": "cached_at",
                "transforms.addMetadata.static.value": "$(date:yyyy-MM-dd'T'HH:mm:ss'Z')"
            }
        }
        
        return redis_sink_config
    
    def implement_data_lake_sink(self):
        """데이터 레이크 싱크 구현"""
        
        data_lake_sink_config = {
            "name": "s3-data-lake-sink",
            "config": {
                "connector.class": "io.confluent.connect.s3.S3SinkConnector",
                "topics": "orders.orders,orders.order_items,orders.customers",
                "s3.bucket.name": "ecommerce-data-lake",
                "s3.region": "us-west-2",
                "s3.part.size": "5242880",  # 5MB
                "flush.size": "10000",
                "rotate.interval.ms": "3600000",  # 1 hour
                
                # 파일 포맷
                "format.class": "io.confluent.connect.s3.format.parquet.ParquetFormat",
                "parquet.compression.codec": "snappy",
                
                # 파티셔닝
                "partitioner.class": "io.confluent.connect.storage.partitioner.TimeBasedPartitioner",
                "partition.duration.ms": "3600000",  # 1 hour
                "path.format": "YYYY/MM/dd/HH",
                "locale": "en_US",
                "timezone": "UTC",
                
                # 스키마 진화
                "schema.compatibility": "BACKWARD",
                "value.converter": "io.confluent.connect.avro.AvroConverter",
                "value.converter.schema.registry.url": "http://schema-registry:8081",
                
                # 에러 처리
                "errors.tolerance": "all",
                "errors.log.enable": "true"
            }
        }
        
        return data_lake_sink_config
    
    def setup_monitoring_and_alerting(self):
        """모니터링 및 알림 설정"""
        
        monitoring_config = {
            "kafka_connect_metrics": {
                "connector_status": "RUNNING, PAUSED, FAILED",
                "task_status": "RUNNING, FAILED, UNASSIGNED",
                "throughput_metrics": "records_per_second, bytes_per_second",
                "latency_metrics": "offset_lag, consumer_lag"
            },
            
            "debezium_metrics": {
                "binlog_position": "MySQL binlog position tracking",
                "snapshot_progress": "Initial snapshot progress",
                "transaction_metrics": "Transaction processing metrics",
                "error_metrics": "Error counts and types"
            },
            
            "alerting_rules": {
                "connector_failure": {
                    "condition": "connector_status == 'FAILED'",
                    "severity": "critical",
                    "notification": ["slack", "email", "pagerduty"]
                },
                
                "high_latency": {
                    "condition": "offset_lag > 10000",
                    "severity": "warning",
                    "notification": ["slack", "email"]
                },
                
                "low_throughput": {
                    "condition": "records_per_second < 100",
                    "severity": "warning",
                    "notification": ["slack"]
                },
                
                "snapshot_stalled": {
                    "condition": "snapshot_progress_stalled > 10min",
                    "severity": "warning",
                    "notification": ["slack", "email"]
                }
            },
            
            "dashboard_metrics": {
                "system_overview": [
                    "Total connectors running",
                    "Total records processed",
                    "Average processing latency",
                    "Error rate percentage"
                ],
                
                "per_connector_metrics": [
                    "Records per second",
                    "Bytes per second",
                    "Offset lag",
                    "Last processed timestamp"
                ],
                
                "target_system_health": [
                    "Elasticsearch indexing rate",
                    "Redis cache hit rate",
                    "S3 upload success rate"
                ]
            }
        }
        
        return monitoring_config
```

### 2. 시스템 배포 및 실행

```python
def deploy_realtime_sync_system():
    """실시간 동기화 시스템 배포"""
    sync_system = RealTimeDataSyncSystem()
    
    print("🚀 Starting Real-time Data Sync System Deployment...")
    
    # 1. 아키텍처 설계
    architecture = sync_system.design_system_architecture()
    print("✅ System architecture designed")
    
    # 2. 커넥터 설정
    orders_connector = sync_system.implement_order_sync_pipeline()
    elasticsearch_sink = sync_system.implement_elasticsearch_sink()
    redis_sink = sync_system.implement_redis_sink()
    data_lake_sink = sync_system.implement_data_lake_sink()
    print("✅ Connector configurations created")
    
    # 3. 모니터링 설정
    monitoring = sync_system.setup_monitoring_and_alerting()
    print("✅ Monitoring and alerting configured")
    
    # 4. 배포 검증
    print("✅ System deployment completed successfully!")
    
    return {
        "architecture": architecture,
        "connectors": {
            "orders_source": orders_connector,
            "elasticsearch_sink": elasticsearch_sink,
            "redis_sink": redis_sink,
            "data_lake_sink": data_lake_sink
        },
        "monitoring": monitoring
    }

if __name__ == "__main__":
    system = deploy_realtime_sync_system()
```

## 📚 학습 요약 {#학습-요약}

### 이번 파트에서 학습한 내용

1. **Change Data Capture 기초 개념**
   - CDC의 개념과 필요성
   - 배치 처리 vs CDC 방식 비교
   - 주요 CDC 도구들 비교 (Debezium, Kafka Connect, Maxwell, AWS DMS)
   - CDC 도입 ROI 계산

2. **Debezium 아키텍처와 핵심 기능**
   - Debezium 아키텍처 이해
   - 데이터베이스별 변경 감지 메커니즘
   - 이벤트 스트리밍 패턴 (이벤트 소싱, CQRS, Saga)

3. **Debezium 커넥터 설정과 운영**
   - MySQL 커넥터 고급 설정
   - PostgreSQL 커넥터 설정
   - MongoDB 커넥터 설정
   - 성능 최적화 전략

4. **스키마 진화와 스키마 레지스트리**
   - 스키마 진화 개념과 시나리오
   - Confluent Schema Registry 통합
   - 스키마 호환성 전략

5. **실시간 데이터 변환과 라우팅**
   - Single Message Transform (SMT) 활용
   - 커스텀 변환 로직 구현
   - 토픽 라우팅 전략
   - 데이터 풍부화 구현

6. **실무 프로젝트**
   - 대규모 이커머스 플랫폼 실시간 동기화 시스템
   - MySQL → Elasticsearch/Redis/Data Lake 파이프라인
   - 모니터링과 알림 시스템

### 핵심 기술 스택

| 기술 | 용도 | 중요도 |
|------|------|--------|
| **Debezium** | CDC 플랫폼 | ⭐⭐⭐⭐⭐ |
| **Apache Kafka** | 이벤트 스트리밍 | ⭐⭐⭐⭐⭐ |
| **Kafka Connect** | 커넥터 프레임워크 | ⭐⭐⭐⭐ |
| **Schema Registry** | 스키마 관리 | ⭐⭐⭐⭐ |
| **Elasticsearch** | 검색 엔진 | ⭐⭐⭐⭐ |

### 다음 파트 예고

**Part 2: Kafka Connect와 프로덕션 CDC 운영**에서는:
- Kafka Connect 고급 아키텍처와 확장성
- 커스텀 커넥터 개발
- 대규모 CDC 파이프라인 운영 전략
- 성능 최적화와 병목 해결
- 데이터 일관성 보장과 검증
- 모니터링과 장애 복구 전략
- 엔터프라이즈급 CDC 운영 시스템 구축

---

**시리즈 진행**: [Change Data Capture 완전 정복 시리즈](/data-engineering/2025/09/19/change-data-capture-debezium-guide.html)

---

*실시간 데이터 동기화의 힘으로 현대적인 이벤트 드리븐 아키텍처를 구축하세요!* 🚀
