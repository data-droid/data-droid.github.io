---
layout: post
lang: ko
title: "레이크하우스 테이블 포맷: Delta Lake, Apache Iceberg, Apache Hudi"
description: "현대적인 데이터 레이크하우스의 핵심인 테이블 포맷들에 대한 상세한 분석과 비교"
date: 2025-08-22
author: Data Droid
category: data-engineering
tags: [lakehouse, delta-lake, apache-iceberg, apache-hudi, table-format, data-lake]
reading_time: "20분"
difficulty: "고급"
---

# 레이크하우스 테이블 포맷: Delta Lake, Apache Iceberg, Apache Hudi

데이터 레이크하우스의 핵심은 기존 데이터 레이크의 유연성과 데이터 웨어하우스의 ACID 트랜잭션, 스키마 진화, 데이터 품질 보장 등의 기능을 결합하는 것입니다. 이를 가능하게 하는 것이 바로 **테이블 포맷(Table Format)**입니다.

현재 가장 널리 사용되는 세 가지 테이블 포맷은:

- **Delta Lake** - Databricks에서 개발한 오픈소스 프로젝트
- **Apache Iceberg** - Netflix에서 시작하여 Apache 재단으로 이전
- **Apache Hudi** - Uber에서 개발하여 Apache 재단으로 이전

## 📋 목차

1. [소개](#소개)
2. [Delta Lake](#delta-lake)
3. [Apache Iceberg](#apache-iceberg)
4. [Apache Hudi](#apache-hudi)
5. [세 플랫폼 비교](#세-플랫폼-비교)
6. [사용 사례 및 선택 가이드](#사용-사례-및-선택-가이드)
7. [결론](#결론)

## 1. 소개

**💡 테이블 포맷이란?**

테이블 포맷은 데이터 레이크에 저장된 데이터의 메타데이터를 관리하고, ACID 트랜잭션, 스키마 진화, 파티셔닝, 인덱싱 등의 기능을 제공하는 표준화된 방식입니다. 이를 통해 데이터 레이크를 데이터 웨어하우스처럼 사용할 수 있게 됩니다.

## 2. Delta Lake

### 2.1 개요

**Delta Lake**는 Databricks에서 2019년에 오픈소스로 공개한 테이블 포맷으로, Apache Spark와의 긴밀한 통합을 통해 데이터 레이크에 ACID 트랜잭션을 제공합니다.

**🔗 공식 링크**
- [공식 웹사이트](https://delta.io/)
- [GitHub 저장소](https://github.com/delta-io/delta)
- [공식 문서](https://docs.delta.io/)
- [블로그](https://delta.io/blog/)

### 2.2 핵심 특징

- **ACID 트랜잭션**: 원자성, 일관성, 격리성, 지속성 보장
- **스키마 강제**: 데이터 품질과 무결성 보장
- **스키마 진화**: 안전한 스키마 변경 지원
- **시간 여행(Time Travel)**: 과거 데이터 버전 접근
- **업서트/머지**: 효율적인 데이터 업데이트
- **오픈 포맷**: Parquet 기반으로 모든 도구와 호환

### 2.3 아키텍처

Delta Lake는 다음과 같은 계층 구조를 가집니다:

**Application Layer**
- Spark SQL
- Spark Streaming
- BI Tools

**Delta Lake Layer**
- ACID 트랜잭션
- 스키마 관리
- 메타데이터 처리

**Storage Layer**
- Parquet 파일
- 트랜잭션 로그
- 체크포인트

## 3. Apache Iceberg

### 3.1 개요

**Apache Iceberg**는 Netflix에서 시작하여 Apache 재단으로 이전한 테이블 포맷으로, 대규모 데이터셋에 대한 효율적인 스키마 진화와 파티셔닝을 지원합니다.

### 3.2 핵심 특징

- **스키마 진화**: 안전하고 효율적인 스키마 변경
- **파티션 진화**: 파티션 레이아웃 변경 지원
- **시간 여행**: 과거 스냅샷 접근
- **ACID 트랜잭션**: 원자적 쓰기 보장
- **메타데이터 계층**: 효율적인 메타데이터 관리

### 3.3 아키텍처

Iceberg는 다음과 같은 메타데이터 계층을 가집니다:

**Catalog Layer**: 테이블 메타데이터 관리
**Metadata Layer**: 스냅샷, 매니페스트, 스키마 정보
**Data Layer**: 실제 데이터 파일 (Parquet, ORC, Avro)

## 4. Apache Hudi

### 4.1 개요

**Apache Hudi**는 Uber에서 개발하여 Apache 재단으로 이전한 테이블 포맷으로, 실시간 데이터 처리와 증분 처리에 특화되어 있습니다.

### 4.2 핵심 특징

- **실시간 처리**: 스트리밍 데이터 처리 지원
- **증분 처리**: 변경된 데이터만 처리
- **ACID 트랜잭션**: 원자적 쓰기 보장
- **시간 여행**: 과거 데이터 버전 접근
- **CDC 지원**: Change Data Capture 지원

### 4.3 아키텍처

Hudi는 두 가지 테이블 타입을 지원합니다:

**Copy-on-Write (CoW)**: 쓰기 시 새로운 파일 생성
**Merge-on-Read (MoR)**: 읽기 시 데이터 병합

## 5. 세 플랫폼 비교

| 특징 | Delta Lake | Apache Iceberg | Apache Hudi |
|------|-------------|----------------|-------------|
| **개발사** | Databricks | Netflix/Apache | Uber/Apache |
| **Spark 통합** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **실시간 처리** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **스키마 진화** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **파티션 진화** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **커뮤니티** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

## 6. 사용 사례 및 선택 가이드

### Delta Lake 선택 시기
- **Spark 기반 환경**에서 작업하는 경우
- **ACID 트랜잭션**이 중요한 경우
- **Databricks 환경**을 사용하는 경우

### Apache Iceberg 선택 시기
- **대규모 데이터셋**을 다루는 경우
- **스키마 진화**가 자주 발생하는 경우
- **파티션 레이아웃 변경**이 필요한 경우

### Apache Hudi 선택 시기
- **실시간 데이터 처리**가 필요한 경우
- **증분 처리**가 중요한 경우
- **CDC(Change Data Capture)**를 구현하는 경우

## 7. 결론

세 가지 테이블 포맷은 각각의 장점과 특화 영역을 가지고 있습니다. 프로젝트의 요구사항과 기술 스택을 고려하여 적절한 포맷을 선택하는 것이 중요합니다.

**Delta Lake**: Spark 중심의 환경에서 안정적인 ACID 트랜잭션
**Apache Iceberg**: 대규모 데이터와 복잡한 스키마 진화가 필요한 경우
**Apache Hudi**: 실시간 처리와 증분 처리가 중요한 경우

---

*이 글은 데이터 엔지니어링 분야에서 레이크하우스 테이블 포맷을 이해하고자 하는 엔지니어들을 위해 작성되었습니다. 각 포맷의 공식 문서와 실습을 통해 더 깊이 있는 학습을 권장합니다.*
