---
layout: post
lang: ko
title: "Part 1: Apache Iceberg 기초와 테이블 포맷 - 현대적 데이터 레이크하우스의 시작"
description: "Apache Iceberg의 핵심 개념부터 테이블 포맷, 스키마 진화, 파티셔닝 전략까지 현대적 데이터 레이크하우스의 완전한 기초를 학습합니다."
date: 2025-09-21
author: Data Droid
category: data-engineering
tags: [Apache-Iceberg, 데이터레이크하우스, 테이블포맷, 스키마진화, 파티셔닝, ACID, 트랜잭션, 빅데이터]
series: apache-iceberg-complete-guide
series_order: 1
reading_time: "45분"
difficulty: "중급"
---

# Part 1: Apache Iceberg 기초와 테이블 포맷 - 현대적 데이터 레이크하우스의 시작

> Apache Iceberg의 핵심 개념부터 테이블 포맷, 스키마 진화, 파티셔닝 전략까지 현대적 데이터 레이크하우스의 완전한 기초를 학습합니다.

## 📋 목차

1. [Apache Iceberg 소개](#apache-iceberg-소개)
2. [Iceberg 아키텍처와 핵심 개념](#iceberg-아키텍처와-핵심-개념)
3. [테이블 포맷과 메타데이터 구조](#테이블-포맷과-메타데이터-구조)
4. [스키마 진화와 호환성](#스키마-진화와-호환성)
5. [파티셔닝과 정렬 전략](#파티셔닝과-정렬-전략)
6. [트랜잭션과 ACID 보장](#트랜잭션과-acid-보장)
7. [실무 프로젝트: Iceberg 데이터 레이크 구축](#실무-프로젝트-iceberg-데이터-레이크-구축)
8. [학습 요약](#학습-요약)

## 🧊 Apache Iceberg 소개

### Iceberg란 무엇인가?

Apache Iceberg는 현대적인 데이터 레이크하우스를 위한 오픈소스 테이블 포맷입니다. 대용량 데이터를 효율적으로 저장하고 관리할 수 있는 고성능 테이블 포맷을 제공합니다.

### 데이터 레이크의 진화

| 세대 | 특징 | 주요 기술 | 한계점 |
|------|------|-----------|--------|
| **1세대** | 파일 기반 저장 | HDFS, S3 | • 스키마 진화 불가<br>• ACID 트랜잭션 없음<br>• 메타데이터 부족 |
| **2세대** | 테이블 포맷 등장 | Hive, HBase | • 제한적 스키마 진화<br>• 부분적 ACID 지원<br>• 성능 이슈 |
| **3세대** | 현대적 테이블 포맷 | Iceberg, Delta Lake, Hudi | • 완전한 스키마 진화<br>• ACID 트랜잭션<br>• 고성능 쿼리 |

### Iceberg의 핵심 가치

| 가치 | 설명 | 이점 |
|------|------|------|
| **ACID 트랜잭션** | 원자성, 일관성, 격리성, 지속성 보장 | • 데이터 일관성<br>• 동시성 제어<br>• 안전한 업데이트 |
| **스키마 진화** | 스키마 변경 시 하위 호환성 보장 | • 유연한 데이터 모델<br>• 점진적 스키마 변경<br>• 버전 관리 |
| **시간 여행** | 과거 시점의 데이터 조회 가능 | • 데이터 복구<br>• 실험 및 분석<br>• 감사 추적 |
| **고성능** | 최적화된 쿼리 성능 | • 빠른 스캔<br>• 효율적 메타데이터<br>• 병렬 처리 |

## 🏗️ Iceberg 아키텍처와 핵심 개념

### Iceberg 아키텍처 개요

Iceberg는 계층적 메타데이터 구조를 통해 대용량 데이터를 효율적으로 관리합니다.

### 핵심 컴포넌트

| 컴포넌트 | 역할 | 특징 |
|----------|------|------|
| **Catalog** | 테이블 메타데이터 관리 | • 테이블 위치 추적<br>• 버전 관리<br>• 네임스페이스 관리 |
| **Metadata Layer** | 테이블 스키마 및 파티션 정보 | • JSON/PB 포맷<br>• 버전별 스냅샷<br>• 스키마 진화 지원 |
| **Data Layer** | 실제 데이터 파일 | • Parquet/ORC/Avro 포맷<br>• 파티션별 저장<br>• 압축 및 인코딩 |

### 메타데이터 계층 구조

```python
class IcebergMetadataStructure:
    def __init__(self):
        self.metadata_layers = {}
    
    def explain_metadata_structure(self):
        """Iceberg 메타데이터 구조 설명"""
        
        structure = {
            "catalog": {
                "purpose": "테이블 메타데이터의 진입점",
                "components": [
                    "테이블 식별자",
                    "현재 메타데이터 파일 위치",
                    "테이블 속성"
                ],
                "examples": ["HiveCatalog", "HadoopCatalog", "JDBC Catalog"]
            },
            "metadata_file": {
                "purpose": "테이블 스키마 및 현재 상태 정의",
                "components": [
                    "테이블 스키마 (JSON)",
                    "현재 스냅샷 ID",
                    "파티션 스펙",
                    "속성 및 설정"
                ],
                "format": "JSON 또는 Protocol Buffers"
            },
            "manifest_list": {
                "purpose": "스냅샷의 매니페스트 파일 목록",
                "components": [
                    "매니페스트 파일 경로",
                    "파티션 범위",
                    "통계 정보",
                    "스키마 ID"
                ],
                "benefits": [
                    "빠른 스냅샷 생성",
                    "효율적인 파티션 프루닝",
                    "병렬 매니페스트 처리"
                ]
            },
            "manifest_file": {
                "purpose": "데이터 파일의 메타데이터",
                "components": [
                    "데이터 파일 경로",
                    "파티션 데이터",
                    "파일 통계 (행 수, 크기 등)",
                    "컬럼 통계"
                ],
                "benefits": [
                    "파일 레벨 프루닝",
                    "컬럼 레벨 통계",
                    "효율적인 스캔"
                ]
            },
            "data_files": {
                "purpose": "실제 데이터 저장",
                "formats": ["Parquet", "ORC", "Avro"],
                "features": [
                    "컬럼별 압축",
                    "인덱싱",
                    "통계 정보 내장"
                ]
            }
        }
        
        return structure
    
    def demonstrate_metadata_evolution(self):
        """메타데이터 진화 과정 시연"""
        
        evolution_process = {
            "step_1": {
                "action": "초기 테이블 생성",
                "metadata_created": [
                    "metadata.json (v1)",
                    "manifest-list-1.avro",
                    "manifest-1.avro"
                ],
                "snapshot_id": "snapshot-1"
            },
            "step_2": {
                "action": "데이터 추가",
                "metadata_created": [
                    "manifest-list-2.avro",
                    "manifest-2.avro (새 파일들)"
                ],
                "snapshot_id": "snapshot-2",
                "parent_snapshot": "snapshot-1"
            },
            "step_3": {
                "action": "스키마 진화",
                "metadata_created": [
                    "metadata.json (v2) - 새 스키마",
                    "manifest-list-3.avro"
                ],
                "snapshot_id": "snapshot-3",
                "schema_evolution": "컬럼 추가"
            },
            "step_4": {
                "action": "데이터 삭제/업데이트",
                "metadata_created": [
                    "manifest-list-4.avro",
                    "delete-files.avro (삭제 표시)"
                ],
                "snapshot_id": "snapshot-4",
                "operation": "copy-on-write"
            }
        }
        
        return evolution_process
```

### Iceberg vs 기존 테이블 포맷

| 특성 | Iceberg | Hive | Delta Lake | Apache Hudi |
|------|---------|------|------------|-------------|
| **ACID 트랜잭션** | ✅ 완전 지원 | ❌ 제한적 | ✅ 완전 지원 | ✅ 완전 지원 |
| **스키마 진화** | ✅ 완전 지원 | ❌ 제한적 | ✅ 완전 지원 | ✅ 완전 지원 |
| **시간 여행** | ✅ 지원 | ❌ 지원 안함 | ✅ 지원 | ✅ 지원 |
| **파티션 진화** | ✅ 지원 | ❌ 지원 안함 | ❌ 지원 안함 | ❌ 지원 안함 |
| **커밋 성능** | 🟢 빠름 | 🔴 느림 | 🟡 보통 | 🟡 보통 |
| **쿼리 성능** | 🟢 최적화됨 | 🔴 기본적 | 🟡 보통 | 🟡 보통 |
| **생태계 지원** | 🟢 광범위 | 🟢 광범위 | 🟡 Spark 중심 | 🟡 제한적 |

## 📊 테이블 포맷과 메타데이터 구조

### 테이블 포맷 상세 분석

Iceberg 테이블은 계층적 메타데이터 구조를 통해 효율적인 데이터 관리를 제공합니다.

### 메타데이터 파일 구조

```python
class IcebergTableFormat:
    def __init__(self):
        self.table_structure = {}
    
    def analyze_table_format(self):
        """테이블 포맷 상세 분석"""
        
        format_analysis = {
            "metadata_hierarchy": {
                "level_1": {
                    "name": "Catalog",
                    "purpose": "테이블 위치 및 기본 정보",
                    "content": {
                        "table_identifier": "database.table_name",
                        "current_metadata_location": "/path/to/metadata.json",
                        "table_type": "ICEBERG",
                        "properties": {
                            "write.format.default": "parquet",
                            "write.metadata.delete-after-commit.enabled": "true"
                        }
                    }
                },
                "level_2": {
                    "name": "Metadata File",
                    "purpose": "테이블 스키마 및 설정",
                    "content": {
                        "format-version": 2,
                        "table-uuid": "uuid-string",
                        "location": "/table/path",
                        "last-updated-ms": 1234567890000,
                        "last-column-id": 5,
                        "schema": {
                            "type": "struct",
                            "schema-id": 0,
                            "fields": [
                                {
                                    "id": 1,
                                    "name": "id",
                                    "required": True,
                                    "type": "long"
                                },
                                {
                                    "id": 2,
                                    "name": "name",
                                    "required": False,
                                    "type": "string"
                                }
                            ]
                        },
                        "current-schema-id": 0,
                        "schemas": [...],
                        "partition-spec": [...],
                        "default-spec-id": 0,
                        "partition-specs": [...],
                        "last-partition-id": 1000,
                        "default-sort-order-id": 0,
                        "sort-orders": [...],
                        "current-snapshot-id": 123456789,
                        "refs": {
                            "main": 123456789
                        },
                        "snapshots": [...],
                        "snapshot-log": [...],
                        "metadata-log": [...]
                    }
                },
                "level_3": {
                    "name": "Manifest List",
                    "purpose": "스냅샷의 매니페스트 파일 목록",
                    "content": {
                        "manifest_path": "/path/to/manifest-list.avro",
                        "manifest_length": 1024,
                        "partition_spec_id": 0,
                        "added_snapshot_id": 123456789,
                        "added_data_files_count": 100,
                        "existing_data_files_count": 0,
                        "deleted_data_files_count": 0,
                        "partitions": [
                            {
                                "contains_null": False,
                                "lower_bound": "2023-01-01",
                                "upper_bound": "2023-01-31"
                            }
                        ],
                        "added_rows_count": 1000000,
                        "existing_rows_count": 0,
                        "deleted_rows_count": 0
                    }
                },
                "level_4": {
                    "name": "Manifest File",
                    "purpose": "데이터 파일 메타데이터",
                    "content": {
                        "manifest_path": "/path/to/manifest.avro",
                        "manifest_length": 2048,
                        "partition_spec_id": 0,
                        "content": 0,  # DATA=0, DELETES=1
                        "sequence_number": 1,
                        "min_sequence_number": 1,
                        "snapshot_id": 123456789,
                        "added_files": [
                            {
                                "content": 0,
                                "file_path": "/data/file1.parquet",
                                "file_format": "PARQUET",
                                "partition": {
                                    "year": 2023,
                                    "month": 1
                                },
                                "record_count": 100000,
                                "file_size_in_bytes": 1024000,
                                "column_sizes": {...},
                                "value_counts": {...},
                                "null_value_counts": {...},
                                "lower_bounds": {...},
                                "upper_bounds": {...}
                            }
                        ]
                    }
                }
            }
        }
        
        return format_analysis
    
    def demonstrate_file_lifecycle(self):
        """파일 라이프사이클 시연"""
        
        lifecycle = {
            "create_table": {
                "step": 1,
                "action": "테이블 생성",
                "files_created": [
                    "metadata.json",
                    "manifest-list-1.avro (빈 리스트)",
                    "manifest-1.avro (빈 매니페스트)"
                ],
                "snapshot": "snapshot-1 (빈 스냅샷)"
            },
            "insert_data": {
                "step": 2,
                "action": "데이터 삽입",
                "files_created": [
                    "data/file-1.parquet",
                    "data/file-2.parquet",
                    "manifest-list-2.avro (새 매니페스트 포함)",
                    "manifest-2.avro (새 파일들)"
                ],
                "snapshot": "snapshot-2 (새 데이터 포함)",
                "operation": "append"
            },
            "update_data": {
                "step": 3,
                "action": "데이터 업데이트",
                "files_created": [
                    "data/file-3.parquet (새 버전)",
                    "delete/delete-1.parquet (삭제 표시)",
                    "manifest-list-3.avro",
                    "manifest-3.avro"
                ],
                "snapshot": "snapshot-3 (업데이트된 데이터)",
                "operation": "copy-on-write"
            },
            "compact_data": {
                "step": 4,
                "action": "데이터 컴팩션",
                "files_created": [
                    "data/compacted-file-1.parquet (통합된 파일)",
                    "manifest-list-4.avro",
                    "manifest-4.avro"
                ],
                "files_removed": [
                    "data/file-1.parquet",
                    "data/file-2.parquet",
                    "delete/delete-1.parquet"
                ],
                "snapshot": "snapshot-4 (컴팩션된 데이터)",
                "operation": "rewrite"
            }
        }
        
        return lifecycle
```

### 메타데이터 최적화 전략

| 최적화 영역 | 전략 | 구현 방법 | 효과 |
|-------------|------|-----------|------|
| **매니페스트 크기** | • 매니페스트 분할<br>• 압축 최적화 | • 파일당 행 수 제한<br>• gzip/snappy 압축 | • 쿼리 성능 향상<br>• 메타데이터 크기 감소 |
| **스캔 최적화** | • 파티션 프루닝<br>• 컬럼 프루닝 | • 파티션 범위 정보<br>• 컬럼 통계 정보 | • I/O 감소<br>• 쿼리 속도 향상 |
| **커밋 성능** | • 병렬 매니페스트 생성<br>• 비동기 처리 | • 멀티스레드 처리<br>• 백그라운드 작업 | • 쓰기 성능 향상<br>• 지연시간 감소 |

## 🔄 스키마 진화와 호환성

### 스키마 진화 개념

Iceberg는 스키마 변경 시에도 하위 호환성을 보장하여 기존 데이터와 새로운 데이터를 안전하게 처리할 수 있습니다.

### 스키마 진화 규칙

| 변경 유형 | 호환성 | 설명 | 예시 |
|-----------|--------|------|------|
| **컬럼 추가** | ✅ 하위 호환 | 새 컬럼은 nullable이어야 함 | `ALTER TABLE ADD COLUMN email STRING` |
| **컬럼 삭제** | ✅ 하위 호환 | 기존 데이터에서 제거됨 | `ALTER TABLE DROP COLUMN old_field` |
| **컬럼 타입 변경** | 🟡 조건부 호환 | 호환 가능한 타입만 변경 | `INT → LONG`, `STRING → BINARY` |
| **컬럼 순서 변경** | ✅ 하위 호환 | ID 기반으로 처리 | 컬럼 순서 재정렬 |
| **컬럼 필수성 변경** | 🟡 조건부 호환 | nullable → required는 불가 | `required → nullable`만 가능 |

### 스키마 진화 구현

```python
class SchemaEvolutionManager:
    def __init__(self):
        self.schema_versions = {}
        self.compatibility_rules = {}
    
    def setup_schema_evolution(self):
        """스키마 진화 설정"""
        
        evolution_config = {
            "schema_evolution_rules": {
                "add_column": {
                    "compatibility": "backward_compatible",
                    "requirements": [
                        "New column must be nullable",
                        "Default value can be specified",
                        "Column ID is automatically assigned"
                    ],
                    "example": {
                        "old_schema": {
                            "type": "struct",
                            "fields": [
                                {"id": 1, "name": "id", "type": "long", "required": True},
                                {"id": 2, "name": "name", "type": "string", "required": False}
                            ]
                        },
                        "new_schema": {
                            "type": "struct",
                            "fields": [
                                {"id": 1, "name": "id", "type": "long", "required": True},
                                {"id": 2, "name": "name", "type": "string", "required": False},
                                {"id": 3, "name": "email", "type": "string", "required": False}
                            ]
                        },
                        "evolution_type": "add_column"
                    }
                },
                "drop_column": {
                    "compatibility": "backward_compatible",
                    "requirements": [
                        "Column is marked as deleted",
                        "Data is not physically removed",
                        "Old readers can still access data"
                    ],
                    "example": {
                        "old_schema": {
                            "type": "struct",
                            "fields": [
                                {"id": 1, "name": "id", "type": "long", "required": True},
                                {"id": 2, "name": "name", "type": "string", "required": False},
                                {"id": 3, "name": "email", "type": "string", "required": False}
                            ]
                        },
                        "new_schema": {
                            "type": "struct",
                            "fields": [
                                {"id": 1, "name": "id", "type": "long", "required": True},
                                {"id": 3, "name": "email", "type": "string", "required": False}
                            ]
                        },
                        "evolution_type": "drop_column",
                        "deleted_columns": [{"id": 2, "name": "name"}]
                    }
                },
                "change_column_type": {
                    "compatibility": "conditional",
                    "requirements": [
                        "Type change must be compatible",
                        "Widening conversions only",
                        "No data loss allowed"
                    ],
                    "compatible_changes": [
                        "int → long",
                        "float → double",
                        "string → binary",
                        "decimal(precision, scale) → decimal(precision+1, scale)"
                    ],
                    "incompatible_changes": [
                        "long → int",
                        "double → float",
                        "string → int",
                        "binary → string"
                    ]
                }
            }
        }
        
        return evolution_config
    
    def demonstrate_schema_evolution_process(self):
        """스키마 진화 과정 시연"""
        
        evolution_process = {
            "initial_schema": {
                "version": 1,
                "schema": {
                    "type": "struct",
                    "schema-id": 0,
                    "fields": [
                        {
                            "id": 1,
                            "name": "user_id",
                            "required": True,
                            "type": "long"
                        },
                        {
                            "id": 2,
                            "name": "username",
                            "required": True,
                            "type": "string"
                        },
                        {
                            "id": 3,
                            "name": "created_at",
                            "required": True,
                            "type": "timestamp"
                        }
                    ]
                },
                "data_files": ["user_data_v1.parquet"]
            },
            "add_email_column": {
                "version": 2,
                "schema": {
                    "type": "struct",
                    "schema-id": 1,
                    "fields": [
                        {
                            "id": 1,
                            "name": "user_id",
                            "required": True,
                            "type": "long"
                        },
                        {
                            "id": 2,
                            "name": "username",
                            "required": True,
                            "type": "string"
                        },
                        {
                            "id": 3,
                            "name": "created_at",
                            "required": True,
                            "type": "timestamp"
                        },
                        {
                            "id": 4,
                            "name": "email",
                            "required": False,
                            "type": "string"
                        }
                    ]
                },
                "data_files": ["user_data_v1.parquet", "user_data_v2.parquet"],
                "evolution_type": "add_column"
            },
            "change_username_to_binary": {
                "version": 3,
                "schema": {
                    "type": "struct",
                    "schema-id": 2,
                    "fields": [
                        {
                            "id": 1,
                            "name": "user_id",
                            "required": True,
                            "type": "long"
                        },
                        {
                            "id": 2,
                            "name": "username",
                            "required": True,
                            "type": "binary"
                        },
                        {
                            "id": 3,
                            "name": "created_at",
                            "required": True,
                            "type": "timestamp"
                        },
                        {
                            "id": 4,
                            "name": "email",
                            "required": False,
                            "type": "string"
                        }
                    ]
                },
                "data_files": ["user_data_v1.parquet", "user_data_v2.parquet", "user_data_v3.parquet"],
                "evolution_type": "change_column_type"
            },
            "drop_email_column": {
                "version": 4,
                "schema": {
                    "type": "struct",
                    "schema-id": 3,
                    "fields": [
                        {
                            "id": 1,
                            "name": "user_id",
                            "required": True,
                            "type": "long"
                        },
                        {
                            "id": 2,
                            "name": "username",
                            "required": True,
                            "type": "binary"
                        },
                        {
                            "id": 3,
                            "name": "created_at",
                            "required": True,
                            "type": "timestamp"
                        }
                    ]
                },
                "data_files": ["user_data_v1.parquet", "user_data_v2.parquet", "user_data_v3.parquet", "user_data_v4.parquet"],
                "evolution_type": "drop_column",
                "deleted_columns": [{"id": 4, "name": "email"}]
            }
        }
        
        return evolution_process
    
    def validate_schema_compatibility(self, old_schema, new_schema):
        """스키마 호환성 검증"""
        
        compatibility_check = {
            "is_compatible": True,
            "issues": [],
            "recommendations": []
        }
        
        old_fields = {field["id"]: field for field in old_schema["fields"]}
        new_fields = {field["id"]: field for field in new_schema["fields"]}
        
        # Check for added fields
        added_fields = set(new_fields.keys()) - set(old_fields.keys())
        for field_id in added_fields:
            field = new_fields[field_id]
            if field.get("required", False):
                compatibility_check["issues"].append(
                    f"Added field '{field['name']}' (id: {field_id}) must be nullable"
                )
                compatibility_check["is_compatible"] = False
        
        # Check for removed fields
        removed_fields = set(old_fields.keys()) - set(new_fields.keys())
        if removed_fields:
            compatibility_check["recommendations"].append(
                "Consider marking fields as deprecated before removing them"
            )
        
        # Check for type changes
        common_fields = set(old_fields.keys()) & set(new_fields.keys())
        for field_id in common_fields:
            old_field = old_fields[field_id]
            new_field = new_fields[field_id]
            
            if old_field["type"] != new_field["type"]:
                if not self._is_type_compatible(old_field["type"], new_field["type"]):
                    compatibility_check["issues"].append(
                        f"Field '{old_field['name']}' type change from {old_field['type']} to {new_field['type']} is not compatible"
                    )
                    compatibility_check["is_compatible"] = False
        
        return compatibility_check
    
    def _is_type_compatible(self, old_type, new_type):
        """타입 호환성 검사"""
        
        compatible_changes = {
            "int": ["long"],
            "float": ["double"],
            "string": ["binary"],
            "decimal(10,2)": ["decimal(11,2)", "decimal(10,3)"]
        }
        
        return new_type in compatible_changes.get(old_type, [])
```

### 스키마 진화 모범 사례

| 모범 사례 | 설명 | 구현 방법 |
|-----------|------|-----------|
| **점진적 진화** | 한 번에 하나씩 변경 | • 단계별 스키마 변경<br>• 각 단계에서 테스트 |
| **하위 호환성 보장** | 기존 데이터 접근 가능 | • nullable 컬럼 추가<br>• 타입 확장만 허용 |
| **버전 관리** | 스키마 버전 추적 | • 스키마 ID 관리<br>• 변경 이력 기록 |
| **테스트 전략** | 진화 후 검증 | • 호환성 테스트<br>• 성능 테스트 |

## 📁 파티셔닝과 정렬 전략

### 파티셔닝 개념

Iceberg의 파티셔닝은 데이터를 논리적으로 분할하여 쿼리 성능을 향상시키고 관리 효율성을 높입니다.

### 파티셔닝 전략

| 전략 | 설명 | 장점 | 단점 | 사용 사례 |
|------|------|------|------|-----------|
| **Identity Partitioning** | 컬럼 값을 직접 파티션으로 사용 | • 단순함<br>• 빠른 프루닝 | • 파티션 수 제한<br>• 스키마 변경 어려움 | • 날짜별 데이터<br>• 지역별 데이터 |
| **Bucket Partitioning** | 해시 기반 파티션 | • 균등 분산<br>• 조인 최적화 | • 범위 쿼리 비효율<br>• 파티션 수 고정 | • 대용량 테이블<br>• 조인 성능 중요 |
| **Truncate Partitioning** | 문자열 자르기 | • 문자열 범위 분할<br>• 유연한 크기 | • 균등 분산 어려움<br>• 파티션 크기 불균등 | • 사용자 ID<br>• 제품 코드 |
| **Year/Month/Day** | 시간 기반 계층 파티션 | • 시간 범위 쿼리 최적화<br>• 자연스러운 분할 | • 파티션 수 증가<br>• 관리 복잡성 | • 시계열 데이터<br>• 로그 데이터 |

### 파티셔닝 구현

```python
class IcebergPartitioningStrategy:
    def __init__(self):
        self.partition_specs = {}
    
    def design_partitioning_strategy(self, table_requirements):
        """파티셔닝 전략 설계"""
        
        strategy = {
            "time_series_table": {
                "partition_spec": {
                    "spec_id": 0,
                    "fields": [
                        {
                            "source_id": 4,  # created_at 컬럼 ID
                            "field_id": 1000,
                            "name": "created_date",
                            "transform": "day"
                        },
                        {
                            "source_id": 1,  # user_id 컬럼 ID
                            "field_id": 1001,
                            "name": "user_bucket",
                            "transform": "bucket[16]"
                        }
                    ]
                },
                "benefits": [
                    "시간 범위 쿼리 최적화",
                    "사용자별 데이터 분산",
                    "병렬 처리 향상"
                ],
                "use_case": "사용자 활동 로그"
            },
            "large_analytics_table": {
                "partition_spec": {
                    "spec_id": 0,
                    "fields": [
                        {
                            "source_id": 2,  # region 컬럼 ID
                            "field_id": 1000,
                            "name": "region",
                            "transform": "identity"
                        },
                        {
                            "source_id": 3,  # category 컬럼 ID
                            "field_id": 1001,
                            "name": "category",
                            "transform": "identity"
                        }
                    ]
                },
                "benefits": [
                    "지역별 데이터 분리",
                    "카테고리별 쿼리 최적화",
                    "데이터 지역성 보장"
                ],
                "use_case": "전자상거래 주문 데이터"
            },
            "high_frequency_table": {
                "partition_spec": {
                    "spec_id": 0,
                    "fields": [
                        {
                            "source_id": 1,  # id 컬럼 ID
                            "field_id": 1000,
                            "name": "id_bucket",
                            "transform": "bucket[32]"
                        }
                    ]
                },
                "benefits": [
                    "균등한 데이터 분산",
                    "높은 동시성 지원",
                    "파티션 크기 제어"
                ],
                "use_case": "실시간 이벤트 데이터"
            }
        }
        
        return strategy
    
    def demonstrate_partition_evolution(self):
        """파티션 진화 시연"""
        
        evolution_process = {
            "initial_partition": {
                "spec_id": 0,
                "partition_spec": {
                    "fields": [
                        {
                            "source_id": 4,
                            "field_id": 1000,
                            "name": "year",
                            "transform": "year"
                        }
                    ]
                },
                "data_layout": "/table/data/year=2023/file1.parquet",
                "benefits": ["연도별 쿼리 최적화"]
            },
            "add_month_partition": {
                "spec_id": 1,
                "partition_spec": {
                    "fields": [
                        {
                            "source_id": 4,
                            "field_id": 1000,
                            "name": "year",
                            "transform": "year"
                        },
                        {
                            "source_id": 4,
                            "field_id": 1001,
                            "name": "month",
                            "transform": "month"
                        }
                    ]
                },
                "data_layout": "/table/data/year=2023/month=01/file1.parquet",
                "benefits": ["월별 세밀한 쿼리 최적화"],
                "evolution_type": "add_partition_field"
            },
            "change_to_day_partition": {
                "spec_id": 2,
                "partition_spec": {
                    "fields": [
                        {
                            "source_id": 4,
                            "field_id": 1000,
                            "name": "date",
                            "transform": "day"
                        }
                    ]
                },
                "data_layout": "/table/data/date=2023-01-15/file1.parquet",
                "benefits": ["일별 세밀한 쿼리 최적화"],
                "evolution_type": "replace_partition_field"
            }
        }
        
        return evolution_process
```

### 정렬 전략

| 정렬 전략 | 설명 | 장점 | 사용 사례 |
|-----------|------|------|-----------|
| **기본 정렬** | 데이터 삽입 순서 | • 단순함<br>• 빠른 삽입 | • 일반적인 테이블 |
| **컬럼 정렬** | 특정 컬럼 기준 정렬 | • 범위 쿼리 최적화<br>• 압축률 향상 | • 시간순 데이터<br>• ID 순 데이터 |
| **복합 정렬** | 여러 컬럼 조합 정렬 | • 복합 쿼리 최적화<br>• 고급 프루닝 | • 다차원 쿼리<br>• 분석 테이블 |

## ⚡ 트랜잭션과 ACID 보장

### ACID 트랜잭션 개념

Iceberg는 ACID (Atomicity, Consistency, Isolation, Durability) 속성을 보장하여 데이터의 일관성과 안정성을 제공합니다.

### 트랜잭션 속성

| 속성 | 설명 | Iceberg 구현 | 장점 |
|------|------|-------------|------|
| **Atomicity (원자성)** | 트랜잭션은 모두 성공하거나 모두 실패 | • 스냅샷 기반 커밋<br>• 원자적 메타데이터 업데이트 | • 부분 실패 방지<br>• 데이터 일관성 보장 |
| **Consistency (일관성)** | 트랜잭션 후 데이터베이스가 유효한 상태 | • 스키마 검증<br>• 제약 조건 검사 | • 무효한 데이터 방지<br>• 비즈니스 규칙 준수 |
| **Isolation (격리성)** | 동시 트랜잭션 간 간섭 방지 | • 낙관적 동시성 제어<br>• 스냅샷 격리 | • 동시성 향상<br>• 데드락 방지 |
| **Durability (지속성)** | 커밋된 트랜잭션은 영구 보존 | • 지속적 메타데이터 저장<br>• 복제본 관리 | • 데이터 손실 방지<br>• 장애 복구 지원 |

### 트랜잭션 구현

```python
class IcebergTransactionManager:
    def __init__(self):
        self.active_transactions = {}
        self.snapshot_manager = SnapshotManager()
    
    def demonstrate_transaction_lifecycle(self):
        """트랜잭션 라이프사이클 시연"""
        
        transaction_lifecycle = {
            "begin_transaction": {
                "step": 1,
                "action": "트랜잭션 시작",
                "process": [
                    "새 스냅샷 ID 생성",
                    "현재 스냅샷을 부모로 설정",
                    "트랜잭션 컨텍스트 생성"
                ],
                "metadata": {
                    "transaction_id": "txn-12345",
                    "parent_snapshot_id": 100,
                    "start_time": "2023-01-01T10:00:00Z",
                    "status": "ACTIVE"
                }
            },
            "modify_data": {
                "step": 2,
                "action": "데이터 수정",
                "process": [
                    "새 데이터 파일 생성",
                    "삭제할 파일 표시",
                    "매니페스트 업데이트"
                ],
                "operations": [
                    "INSERT: 1000 rows → new_file1.parquet",
                    "UPDATE: 500 rows → new_file2.parquet",
                    "DELETE: 200 rows → delete_file1.parquet"
                ],
                "metadata": {
                    "added_files": 2,
                    "deleted_files": 1,
                    "modified_rows": 1500
                }
            },
            "validate_changes": {
                "step": 3,
                "action": "변경사항 검증",
                "process": [
                    "스키마 일관성 검사",
                    "파티션 규칙 검증",
                    "제약 조건 확인"
                ],
                "validation_checks": [
                    "Schema compatibility: ✅ PASS",
                    "Partition spec: ✅ PASS",
                    "Data quality: ✅ PASS"
                ]
            },
            "commit_transaction": {
                "step": 4,
                "action": "트랜잭션 커밋",
                "process": [
                    "메타데이터 파일 업데이트",
                    "새 스냅샷 생성",
                    "매니페스트 리스트 업데이트"
                ],
                "metadata": {
                    "snapshot_id": 101,
                    "commit_time": "2023-01-01T10:05:00Z",
                    "operation": "append",
                    "summary": {
                        "added-records": 1000,
                        "deleted-records": 200,
                        "total-records": 9800
                    }
                }
            },
            "rollback_transaction": {
                "step": "rollback",
                "action": "트랜잭션 롤백",
                "process": [
                    "임시 파일 삭제",
                    "트랜잭션 컨텍스트 정리",
                    "부모 스냅샷 유지"
                ],
                "result": "모든 변경사항 취소, 원래 상태 복원"
            }
        }
        
        return transaction_lifecycle
    
    def demonstrate_concurrent_transactions(self):
        """동시 트랜잭션 처리 시연"""
        
        concurrent_scenario = {
            "initial_state": {
                "snapshot_id": 100,
                "table_state": "stable",
                "pending_transactions": 0
            },
            "transaction_a": {
                "transaction_id": "txn-A",
                "start_time": "10:00:00",
                "operation": "INSERT 1000 rows",
                "parent_snapshot": 100,
                "status": "IN_PROGRESS"
            },
            "transaction_b": {
                "transaction_id": "txn-B", 
                "start_time": "10:01:00",
                "operation": "UPDATE 500 rows",
                "parent_snapshot": 100,
                "status": "IN_PROGRESS"
            },
            "commit_sequence": {
                "txn_a_commit": {
                    "time": "10:02:00",
                    "action": "Transaction A commits",
                    "new_snapshot": 101,
                    "result": "Success - 1000 rows added"
                },
                "txn_b_commit": {
                    "time": "10:03:00",
                    "action": "Transaction B attempts commit",
                    "conflict_check": "Parent snapshot changed (100 → 101)",
                    "resolution": "Rebase and retry",
                    "new_snapshot": 102,
                    "result": "Success - 500 rows updated"
                }
            },
            "final_state": {
                "snapshot_id": 102,
                "table_state": "stable",
                "total_rows": 10500,
                "committed_transactions": 2
            }
        }
        
        return concurrent_scenario
```

### 동시성 제어 메커니즘

| 메커니즘 | 설명 | 장점 | 단점 |
|----------|------|------|------|
| **낙관적 동시성 제어** | 충돌이 적다고 가정하고 진행 | • 높은 동시성<br>• 데드락 없음 | • 충돌 시 재시도 필요<br>• 복잡한 충돌 해결 |
| **스냅샷 격리** | 트랜잭션 시작 시점의 일관된 뷰 제공 | • 읽기 성능 향상<br>• 일관된 읽기 | • 메모리 사용량 증가<br>• 스냅샷 관리 복잡성 |
| **충돌 감지** | 커밋 시 충돌 검사 및 해결 | • 데이터 일관성 보장<br>• 자동 충돌 해결 | • 재시도 오버헤드<br>• 성능 영향 |

## 🚀 실무 프로젝트: Iceberg 데이터 레이크 구축

### 프로젝트 개요

대규모 전자상거래 플랫폼을 위한 Iceberg 기반 데이터 레이크하우스를 구축합니다.

### 시스템 아키텍처

| 구성 요소 | 기술 스택 | 용량 | 역할 |
|-----------|------------|------|------|
| **스토리지** | S3, HDFS | • 100TB+ 데이터<br>• 10억+ 레코드 | • 데이터 영구 저장<br>• 버전 관리 |
| **메타데이터** | Hive Metastore, AWS Glue | • 1000+ 테이블<br>• 100+ 데이터베이스 | • 스키마 관리<br>• 테이블 메타데이터 |
| **쿼리 엔진** | Spark, Presto/Trino | • 100+ 동시 쿼리<br>• 초당 1TB+ 처리 | • SQL 쿼리 실행<br>• 분석 작업 |
| **데이터 수집** | Kafka, Flink | • 100만+ 이벤트/초<br>• 실시간 스트림 | • 데이터 수집<br>• 실시간 처리 |

### 프로젝트 구현

```python
class IcebergDataLakeProject:
    def __init__(self):
        self.project_config = {}
        self.table_manager = IcebergTableManager()
        self.schema_manager = SchemaManager()
    
    def design_data_lake_architecture(self):
        """데이터 레이크 아키텍처 설계"""
        
        architecture = {
            "data_domains": {
                "user_analytics": {
                    "tables": [
                        "user_profiles",
                        "user_behavior_events", 
                        "user_segments"
                    ],
                    "partition_strategy": "date + user_bucket",
                    "retention_policy": "7_years",
                    "access_patterns": [
                        "시간 범위 기반 분석",
                        "사용자별 행동 분석",
                        "세그먼트별 집계"
                    ]
                },
                "order_analytics": {
                    "tables": [
                        "orders",
                        "order_items",
                        "order_events"
                    ],
                    "partition_strategy": "date + region",
                    "retention_policy": "10_years",
                    "access_patterns": [
                        "일별 매출 분석",
                        "지역별 주문 분석",
                        "제품별 성과 분석"
                    ]
                },
                "product_catalog": {
                    "tables": [
                        "products",
                        "categories",
                        "inventory"
                    ],
                    "partition_strategy": "category",
                    "retention_policy": "permanent",
                    "access_patterns": [
                        "제품 검색",
                        "카테고리별 분석",
                        "재고 관리"
                    ]
                }
            },
            "table_specifications": {
                "user_profiles": {
                    "schema": {
                        "user_id": "BIGINT",
                        "username": "STRING",
                        "email": "STRING",
                        "created_at": "TIMESTAMP",
                        "updated_at": "TIMESTAMP",
                        "profile_data": "STRUCT"
                    },
                    "partitioning": [
                        {"field": "created_at", "transform": "day"},
                        {"field": "user_id", "transform": "bucket[16]"}
                    ],
                    "sorting": ["created_at", "user_id"],
                    "properties": {
                        "write.format.default": "parquet",
                        "write.parquet.compression-codec": "snappy"
                    }
                },
                "user_behavior_events": {
                    "schema": {
                        "event_id": "STRING",
                        "user_id": "BIGINT",
                        "event_type": "STRING",
                        "event_data": "STRUCT",
                        "timestamp": "TIMESTAMP",
                        "session_id": "STRING"
                    },
                    "partitioning": [
                        {"field": "timestamp", "transform": "hour"},
                        {"field": "event_type", "transform": "identity"}
                    ],
                    "sorting": ["timestamp", "user_id"],
                    "properties": {
                        "write.format.default": "parquet",
                        "write.parquet.compression-codec": "gzip"
                    }
                }
            }
        }
        
        return architecture
    
    def implement_data_pipeline(self):
        """데이터 파이프라인 구현"""
        
        pipeline = {
            "real_time_ingestion": {
                "source": "Kafka topics",
                "processing": "Apache Flink",
                "destination": "Iceberg tables",
                "flow": [
                    "Kafka → Flink → Iceberg (user_events)",
                    "Kafka → Flink → Iceberg (order_events)",
                    "Kafka → Flink → Iceberg (product_events)"
                ],
                "latency_target": "< 5 minutes"
            },
            "batch_processing": {
                "source": "External systems",
                "processing": "Apache Spark",
                "destination": "Iceberg tables",
                "jobs": [
                    "Daily user profile updates",
                    "Weekly order aggregations",
                    "Monthly product analytics"
                ],
                "schedule": "Daily at 2 AM"
            },
            "data_quality": {
                "validation_rules": [
                    "Schema validation",
                    "Data completeness checks",
                    "Referential integrity",
                    "Business rule validation"
                ],
                "monitoring": [
                    "Data freshness metrics",
                    "Quality score tracking",
                    "Anomaly detection"
                ]
            }
        }
        
        return pipeline
    
    def setup_operational_procedures(self):
        """운영 절차 설정"""
        
        procedures = {
            "schema_evolution": {
                "process": [
                    "1. 스키마 변경 요청 검토",
                    "2. 호환성 검증",
                    "3. 스테이징 환경 테스트",
                    "4. 프로덕션 적용",
                    "5. 모니터링 및 검증"
                ],
                "approval_required": "데이터 아키텍트 승인",
                "rollback_plan": "이전 스키마로 복원"
            },
            "data_retention": {
                "policies": {
                    "user_events": "7년 보관 후 삭제",
                    "order_data": "10년 보관 후 아카이브",
                    "product_catalog": "영구 보관"
                },
                "automation": "스케줄된 정리 작업",
                "compliance": "GDPR, CCPA 준수"
            },
            "performance_optimization": {
                "compaction": {
                    "frequency": "주간",
                    "criteria": "파일 수 > 100개 또는 크기 > 1GB",
                    "strategy": "자동 컴팩션"
                },
                "partition_pruning": {
                    "monitoring": "쿼리 실행 계획 분석",
                    "optimization": "파티션 전략 조정"
                }
            }
        }
        
        return procedures
```

## 📚 학습 요약

### 이번 Part에서 학습한 내용

1. **Apache Iceberg 소개**
   - Iceberg의 핵심 개념과 가치
   - 데이터 레이크의 진화 과정
   - 기존 테이블 포맷과의 비교

2. **Iceberg 아키텍처와 핵심 개념**
   - 계층적 메타데이터 구조
   - 핵심 컴포넌트와 역할
   - 메타데이터 진화 과정

3. **테이블 포맷과 메타데이터 구조**
   - 4단계 메타데이터 계층
   - 파일 라이프사이클 관리
   - 메타데이터 최적화 전략

4. **스키마 진화와 호환성**
   - 스키마 진화 규칙과 제약사항
   - 호환성 검증 방법
   - 진화 과정 시연

5. **파티셔닝과 정렬 전략**
   - 다양한 파티셔닝 전략
   - 파티션 진화 기능
   - 정렬 전략과 최적화

6. **트랜잭션과 ACID 보장**
   - ACID 속성 구현
   - 트랜잭션 라이프사이클
   - 동시성 제어 메커니즘

7. **실무 프로젝트**
   - 대규모 전자상거래 데이터 레이크 설계
   - 데이터 파이프라인 구현
   - 운영 절차 설정

### 핵심 기술 스택

| 기술 | 역할 | 중요도 | 학습 포인트 |
|------|------|--------|-------------|
| **Apache Iceberg** | 테이블 포맷 | ⭐⭐⭐⭐⭐ | 메타데이터 구조, ACID 보장 |
| **파티셔닝** | 데이터 분할 | ⭐⭐⭐⭐ | 성능 최적화, 관리 효율성 |
| **스키마 진화** | 유연한 데이터 모델 | ⭐⭐⭐⭐⭐ | 호환성, 버전 관리 |
| **트랜잭션** | 데이터 일관성 | ⭐⭐⭐⭐⭐ | ACID 속성, 동시성 제어 |
| **메타데이터** | 테이블 관리 | ⭐⭐⭐⭐ | 계층 구조, 최적화 |

### 다음 Part 미리보기

**Part 2: Apache Iceberg 고급 기능과 성능 최적화**에서는:
- 고급 파티셔닝 전략 (Evolution, Hidden Partitioning)
- 컴팩션과 정리 작업
- 쿼리 성능 최적화
- 메타데이터 관리와 버전 관리

---

**시리즈 진행**: [Apache Iceberg Complete Guide Series](/data-engineering/2025/09/21/apache-iceberg-fundamentals.html)

---

*현대적 데이터 레이크하우스의 핵심인 Apache Iceberg를 완전히 정복하세요!* 🧊
