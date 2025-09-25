---
layout: post
lang: ko
title: "Part 4: Apache Spark 모니터링과 성능 튜닝 - 프로덕션 환경 완성"
description: "Apache Spark의 성능 모니터링, 프로파일링, 메모리 최적화, 클러스터 튜닝을 통한 프로덕션 환경 구축을 완성합니다."
date: 2025-09-13
author: Data Droid
category: data-engineering
tags: [Apache-Spark, 성능튜닝, 모니터링, 프로파일링, 메모리최적화, 클러스터관리, Python]
series: apache-spark-complete-guide
series_order: 4
reading_time: "55분"
difficulty: "전문가"
---

# Part 4: Apache Spark 모니터링과 성능 튜닝 - 프로덕션 환경 완성

> Apache Spark의 성능 모니터링, 프로파일링, 메모리 최적화, 클러스터 튜닝을 통한 프로덕션 환경 구축을 완성합니다.

## 📋 목차 {#목차}

1. [Spark UI와 메트릭 분석](#spark-ui와-메트릭-분석)
2. [성능 모니터링과 프로파일링](#성능-모니터링과-프로파일링)
3. [메모리 최적화와 캐싱 전략](#메모리-최적화와-캐싱-전략)
4. [클러스터 튜닝과 확장성](#클러스터-튜닝과-확장성)
5. [실무 프로젝트: 성능 최적화 시스템](#실무-프로젝트-성능-최적화-시스템)
6. [프로덕션 환경 구축](#프로덕션-환경-구축)
7. [학습 요약](#학습-요약)

## 🖥️ Spark UI와 메트릭 분석

### Spark UI 개요

Spark UI는 Spark 애플리케이션의 성능을 모니터링하고 분석하는 웹 기반 인터페이스입니다.

#### **핵심 탭과 기능**

1. **Jobs 탭**
   - 작업 실행 상태와 시간
   - 스테이지별 실행 정보
   - 작업 실패 원인 분석

2. **Stages 탭**
   - 각 스테이지의 상세 정보
   - 태스크 실행 분포
   - 데이터 스큐(Data Skew) 분석

3. **Storage 탭**
   - 캐시된 데이터 정보
   - 메모리 사용량
   - 디스크 저장 상태

4. **Environment 탭**
   - Spark 설정 정보
   - 시스템 환경 변수
   - JVM 설정

### 메트릭 분석 도구

```python
# Spark 메트릭 수집 및 분석
from pyspark.sql import SparkSession
import json
import time

class SparkMetricsCollector:
    def __init__(self, spark_session):
        self.spark = spark_session
        self.sc = spark_session.sparkContext
        
    def collect_job_metrics(self):
        """작업 메트릭 수집"""
        status_tracker = self.sc.statusTracker()
        
        # 실행 중인 작업 정보
        active_jobs = status_tracker.getActiveJobIds()
        
        # 작업별 메트릭 수집
        job_metrics = {}
        for job_id in active_jobs:
            job_info = status_tracker.getJobInfo(job_id)
            job_metrics[job_id] = {
                'status': job_info.status,
                'num_tasks': job_info.numTasks,
                'num_active_tasks': job_info.numActiveTasks,
                'num_completed_tasks': job_info.numCompletedTasks,
                'num_failed_tasks': job_info.numFailedTasks
            }
        
        return job_metrics
    
    def collect_stage_metrics(self):
        """스테이지 메트릭 수집"""
        status_tracker = self.sc.statusTracker()
        
        # 활성 스테이지 정보
        active_stages = status_tracker.getActiveStageIds()
        
        stage_metrics = {}
        for stage_id in active_stages:
            stage_info = status_tracker.getStageInfo(stage_id)
            stage_metrics[stage_id] = {
                'num_tasks': stage_info.numTasks,
                'num_active_tasks': stage_info.numActiveTasks,
                'num_completed_tasks': stage_info.numCompletedTasks,
                'num_failed_tasks': stage_info.numFailedTasks,
                'executor_run_time': stage_info.executorRunTime,
                'executor_cpu_time': stage_info.executorCpuTime,
                'input_bytes': stage_info.inputBytes,
                'output_bytes': stage_info.outputBytes,
                'shuffle_read_bytes': stage_info.shuffleReadBytes,
                'shuffle_write_bytes': stage_info.shuffleWriteBytes
            }
        
        return stage_metrics
    
    def collect_executor_metrics(self):
        """실행자 메트릭 수집"""
        status_tracker = self.sc.statusTracker()
        executor_infos = status_tracker.getExecutorInfos()
        
        executor_metrics = {}
        for executor_info in executor_infos:
            executor_metrics[executor_info.executorId] = {
                'host': executor_info.host,
                'total_cores': executor_info.totalCores,
                'max_memory': executor_info.maxMemory,
                'memory_used': executor_info.memoryUsed,
                'disk_used': executor_info.diskUsed,
                'active_tasks': executor_info.activeTasks,
                'completed_tasks': executor_info.completedTasks,
                'failed_tasks': executor_info.failedTasks,
                'total_duration': executor_info.totalDuration,
                'total_gc_time': executor_info.totalGCTime
            }
        
        return executor_metrics

# 사용 예제
def monitor_spark_application():
    spark = SparkSession.builder.appName("MetricsExample").getOrCreate()
    collector = SparkMetricsCollector(spark)
    
    # 주기적으로 메트릭 수집
    while True:
        job_metrics = collector.collect_job_metrics()
        stage_metrics = collector.collect_stage_metrics()
        executor_metrics = collector.collect_executor_metrics()
        
        print("=== Job Metrics ===")
        print(json.dumps(job_metrics, indent=2))
        
        print("=== Stage Metrics ===")
        print(json.dumps(stage_metrics, indent=2))
        
        print("=== Executor Metrics ===")
        print(json.dumps(executor_metrics, indent=2))
        
        time.sleep(10)  # 10초마다 수집
```

## 📊 성능 모니터링과 프로파일링 {#성능-모니터링과-프로파일링}

### 성능 프로파일링 도구

```python
# 성능 프로파일링 클래스
class SparkProfiler:
    def __init__(self, spark_session):
        self.spark = spark_session
        self.sc = spark_session.sparkContext
        
    def profile_query_execution(self, query_name, df):
        """쿼리 실행 프로파일링"""
        import time
        
        start_time = time.time()
        
        # 실행 계획 분석
        execution_plan = df.explain(True)
        
        # 쿼리 실행
        result = df.collect()
        
        end_time = time.time()
        execution_time = end_time - start_time
        
        # 메트릭 수집
        status_tracker = self.sc.statusTracker()
        executor_infos = status_tracker.getExecutorInfos()
        
        total_memory_used = sum(info.memoryUsed for info in executor_infos)
        total_gc_time = sum(info.totalGCTime for info in executor_infos)
        
        profile_result = {
            'query_name': query_name,
            'execution_time': execution_time,
            'total_memory_used': total_memory_used,
            'total_gc_time': total_gc_time,
            'execution_plan': execution_plan,
            'result_count': len(result)
        }
        
        return profile_result
    
    def analyze_data_skew(self, df, key_columns):
        """데이터 스큐 분석"""
        # 키별 데이터 분포 분석
        key_counts = df.groupBy(*key_columns).count()
        
        # 통계 정보 수집
        stats = key_counts.select(
            count("*").alias("total_keys"),
            min("count").alias("min_count"),
            max("count").alias("max_count"),
            avg("count").alias("avg_count"),
            stddev("count").alias("stddev_count")
        ).collect()[0]
        
        # 스큐 비율 계산
        skew_ratio = stats['max_count'] / stats['avg_count'] if stats['avg_count'] > 0 else 0
        
        skew_analysis = {
            'total_keys': stats['total_keys'],
            'min_count': stats['min_count'],
            'max_count': stats['max_count'],
            'avg_count': stats['avg_count'],
            'stddev_count': stats['stddev_count'],
            'skew_ratio': skew_ratio,
            'is_skewed': skew_ratio > 2.0  # 스큐 임계값
        }
        
        return skew_analysis
    
    def monitor_memory_usage(self):
        """메모리 사용량 모니터링"""
        status_tracker = self.sc.statusTracker()
        executor_infos = status_tracker.getExecutorInfos()
        
        memory_stats = {
            'total_executors': len(executor_infos),
            'total_memory_used': sum(info.memoryUsed for info in executor_infos),
            'total_max_memory': sum(info.maxMemory for info in executor_infos),
            'memory_utilization': 0,
            'executor_details': []
        }
        
        for info in executor_infos:
            executor_detail = {
                'executor_id': info.executorId,
                'host': info.host,
                'memory_used': info.memoryUsed,
                'max_memory': info.maxMemory,
                'utilization': info.memoryUsed / info.maxMemory if info.maxMemory > 0 else 0
            }
            memory_stats['executor_details'].append(executor_detail)
        
        if memory_stats['total_max_memory'] > 0:
            memory_stats['memory_utilization'] = (
                memory_stats['total_memory_used'] / memory_stats['total_max_memory']
            )
        
        return memory_stats

# 성능 분석 도구 사용 예제
def performance_analysis_example():
    spark = SparkSession.builder.appName("PerformanceAnalysis").getOrCreate()
    profiler = SparkProfiler(spark)
    
    # 샘플 데이터 생성
    data = [(i, f"user_{i}", i * 10) for i in range(10000)]
    df = spark.createDataFrame(data, ["id", "name", "value"])
    
    # 쿼리 프로파일링
    profile_result = profiler.profile_query_execution(
        "sample_aggregation",
        df.groupBy("name").agg(sum("value").alias("total_value"))
    )
    
    print("Query Profile Result:")
    print(json.dumps(profile_result, indent=2))
    
    # 데이터 스큐 분석
    skew_analysis = profiler.analyze_data_skew(df, ["name"])
    print("\nData Skew Analysis:")
    print(json.dumps(skew_analysis, indent=2))
    
    # 메모리 사용량 모니터링
    memory_stats = profiler.monitor_memory_usage()
    print("\nMemory Usage Stats:")
    print(json.dumps(memory_stats, indent=2))
```

### 성능 최적화 가이드라인

```python
# 성능 최적화 체크리스트
class PerformanceOptimizer:
    def __init__(self, spark_session):
        self.spark = spark_session
        
    def check_partitioning(self, df):
        """파티셔닝 최적화 체크"""
        num_partitions = df.rdd.getNumPartitions()
        
        # 파티션 크기 확인
        partition_sizes = df.rdd.mapPartitions(lambda x: [len(list(x))]).collect()
        
        avg_size = sum(partition_sizes) / len(partition_sizes)
        max_size = max(partition_sizes)
        min_size = min(partition_sizes)
        
        # 파티션 불균형 확인
        imbalance_ratio = max_size / avg_size if avg_size > 0 else 0
        
        recommendations = []
        
        if num_partitions < 2:
            recommendations.append("파티션 수가 너무 적습니다. 최소 2개 이상 권장")
        
        if imbalance_ratio > 2.0:
            recommendations.append(f"파티션 불균형이 심합니다 (비율: {imbalance_ratio:.2f}). repartition() 고려")
        
        if avg_size > 128 * 1024 * 1024:  # 128MB
            recommendations.append("파티션 크기가 너무 큽니다. 더 작은 파티션으로 분할 권장")
        
        return {
            'num_partitions': num_partitions,
            'avg_size': avg_size,
            'max_size': max_size,
            'min_size': min_size,
            'imbalance_ratio': imbalance_ratio,
            'recommendations': recommendations
        }
    
    def check_caching_strategy(self, df, usage_count=1):
        """캐싱 전략 체크"""
        storage_level = df.storageLevel
        
        recommendations = []
        
        if usage_count > 1 and storage_level == StorageLevel.NONE:
            recommendations.append("데이터를 여러 번 사용하므로 캐싱을 고려하세요")
        
        if storage_level.useDisk and usage_count < 3:
            recommendations.append("디스크 캐싱은 메모리 캐싱보다 느립니다. 사용 빈도를 고려하세요")
        
        return {
            'storage_level': str(storage_level),
            'usage_count': usage_count,
            'recommendations': recommendations
        }
    
    def analyze_query_plan(self, df):
        """쿼리 계획 분석"""
        plan = df.explain(True)
        
        recommendations = []
        
        # 브로드캐스트 조인 확인
        if "BroadcastHashJoin" in plan:
            recommendations.append("브로드캐스트 조인이 사용되었습니다. 작은 테이블 크기를 확인하세요")
        
        # 셔플 확인
        if "Exchange" in plan:
            recommendations.append("셔플이 발생합니다. 파티셔닝 키 최적화를 고려하세요")
        
        # 스캔 확인
        if "FileScan" in plan:
            recommendations.append("파일 스캔이 발생합니다. 파티셔닝이나 인덱싱을 고려하세요")
        
        return {
            'execution_plan': plan,
            'recommendations': recommendations
        }

# 성능 최적화 예제
def optimization_example():
    spark = SparkSession.builder.appName("OptimizationExample").getOrCreate()
    optimizer = PerformanceOptimizer(spark)
    
    # 샘플 데이터
    data = [(i, f"category_{i % 10}", i * 100) for i in range(100000)]
    df = spark.createDataFrame(data, ["id", "category", "value"])
    
    # 파티셔닝 체크
    partition_analysis = optimizer.check_partitioning(df)
    print("Partitioning Analysis:")
    print(json.dumps(partition_analysis, indent=2))
    
    # 캐싱 전략 체크
    caching_analysis = optimizer.check_caching_strategy(df, usage_count=3)
    print("\nCaching Strategy Analysis:")
    print(json.dumps(caching_analysis, indent=2))
    
    # 쿼리 계획 분석
    query_analysis = optimizer.analyze_query_plan(
        df.groupBy("category").agg(sum("value").alias("total"))
    )
    print("\nQuery Plan Analysis:")
    print(json.dumps(query_analysis, indent=2))
```

## 💾 메모리 최적화와 캐싱 전략

### 메모리 관리 최적화

```python
# 메모리 최적화 도구
class MemoryOptimizer:
    def __init__(self, spark_session):
        self.spark = spark_session
        
    def optimize_dataframe_memory(self, df):
        """DataFrame 메모리 최적화"""
        from pyspark.sql.types import IntegerType, LongType, FloatType, DoubleType
        
        optimized_df = df
        
        # 컬럼 타입 최적화
        for field in df.schema.fields:
            field_name = field.name
            field_type = field.dataType
            
            if isinstance(field_type, IntegerType):
                # 큰 정수값이 없다면 더 작은 타입으로 변경
                max_val = df.select(max(col(field_name))).collect()[0][0]
                min_val = df.select(min(col(field_name))).collect()[0][0]
                
                if -128 <= min_val <= 127 and -128 <= max_val <= 127:
                    optimized_df = optimized_df.withColumn(
                        field_name, col(field_name).cast("tinyint")
                    )
                elif -32768 <= min_val <= 32767 and -32768 <= max_val <= 32767:
                    optimized_df = optimized_df.withColumn(
                        field_name, col(field_name).cast("smallint")
                    )
            
            elif isinstance(field_type, FloatType):
                # Float를 Double로 변경하여 정밀도 향상
                optimized_df = optimized_df.withColumn(
                    field_name, col(field_name).cast("double")
                )
        
        return optimized_df
    
    def calculate_memory_usage(self, df):
        """메모리 사용량 계산"""
        # DataFrame 크기 추정
        num_rows = df.count()
        num_cols = len(df.columns)
        
        # 컬럼별 타입 크기 추정
        type_sizes = {
            'string': 50,  # 평균 문자열 길이
            'int': 4,
            'bigint': 8,
            'double': 8,
            'float': 4,
            'boolean': 1,
            'date': 8,
            'timestamp': 8
        }
        
        estimated_size = 0
        for field in df.schema.fields:
            field_type = str(field.dataType)
            base_type = field_type.split('(')[0].lower()
            
            if base_type in type_sizes:
                estimated_size += type_sizes[base_type]
            else:
                estimated_size += 8  # 기본값
        
        total_estimated_size = num_rows * num_cols * estimated_size
        
        return {
            'num_rows': num_rows,
            'num_cols': num_cols,
            'estimated_size_bytes': total_estimated_size,
            'estimated_size_mb': total_estimated_size / (1024 * 1024)
        }
    
    def optimize_caching_strategy(self, df, access_pattern):
        """캐싱 전략 최적화"""
        from pyspark import StorageLevel
        
        memory_stats = self.calculate_memory_usage(df)
        size_mb = memory_stats['estimated_size_mb']
        
        recommendations = []
        
        if access_pattern['frequency'] == 'high' and size_mb < 1000:
            recommendations.append({
                'strategy': 'MEMORY_ONLY',
                'reason': '자주 사용되고 크기가 작은 데이터'
            })
        elif access_pattern['frequency'] == 'high' and size_mb >= 1000:
            recommendations.append({
                'strategy': 'MEMORY_AND_DISK_SER',
                'reason': '자주 사용되지만 크기가 큰 데이터'
            })
        elif access_pattern['frequency'] == 'medium':
            recommendations.append({
                'strategy': 'DISK_ONLY',
                'reason': '중간 빈도 사용 데이터'
            })
        else:
            recommendations.append({
                'strategy': 'NO_CACHING',
                'reason': '낮은 빈도 사용 데이터'
            })
        
        return {
            'data_size_mb': size_mb,
            'access_frequency': access_pattern['frequency'],
            'recommendations': recommendations
        }

# 메모리 최적화 예제
def memory_optimization_example():
    spark = SparkSession.builder.appName("MemoryOptimization").getOrCreate()
    optimizer = MemoryOptimizer(spark)
    
    # 샘플 데이터 생성
    data = [(i, f"user_{i}", i * 1.5, i % 2 == 0) for i in range(100000)]
    df = spark.createDataFrame(data, ["id", "name", "score", "is_active"])
    
    # 메모리 최적화
    optimized_df = optimizer.optimize_dataframe_memory(df)
    
    # 메모리 사용량 계산
    original_memory = optimizer.calculate_memory_usage(df)
    optimized_memory = optimizer.calculate_memory_usage(optimized_df)
    
    print("Original Memory Usage:")
    print(json.dumps(original_memory, indent=2))
    
    print("\nOptimized Memory Usage:")
    print(json.dumps(optimized_memory, indent=2))
    
    # 캐싱 전략 최적화
    access_pattern = {'frequency': 'high'}
    caching_strategy = optimizer.optimize_caching_strategy(df, access_pattern)
    
    print("\nCaching Strategy:")
    print(json.dumps(caching_strategy, indent=2))
```

### 고급 캐싱 전략

```python
# 고급 캐싱 관리자
class AdvancedCacheManager:
    def __init__(self, spark_session):
        self.spark = spark_session
        self.cached_tables = {}
        
    def smart_cache(self, df, table_name, access_pattern):
        """지능형 캐싱"""
        from pyspark import StorageLevel
        
        # 데이터 크기 확인
        num_partitions = df.rdd.getNumPartitions()
        
        # 접근 패턴에 따른 캐싱 전략 결정
        if access_pattern['frequency'] == 'high':
            if access_pattern['latency_requirement'] == 'low':
                df.cache()  # MEMORY_ONLY
                storage_level = "MEMORY_ONLY"
            else:
                df.persist(StorageLevel.MEMORY_AND_DISK_SER)
                storage_level = "MEMORY_AND_DISK_SER"
        else:
            df.persist(StorageLevel.DISK_ONLY)
            storage_level = "DISK_ONLY"
        
        # 캐시 정보 저장
        self.cached_tables[table_name] = {
            'dataframe': df,
            'storage_level': storage_level,
            'access_count': 0,
            'last_accessed': time.time()
        }
        
        return df
    
    def monitor_cache_efficiency(self):
        """캐시 효율성 모니터링"""
        status_tracker = self.spark.sparkContext.statusTracker()
        executor_infos = status_tracker.getExecutorInfos()
        
        cache_stats = {
            'total_cached_data': 0,
            'memory_cached': 0,
            'disk_cached': 0,
            'cache_hit_ratio': 0
        }
        
        for info in executor_infos:
            cache_stats['total_cached_data'] += info.memoryUsed
            cache_stats['memory_cached'] += info.memoryUsed
        
        return cache_stats
    
    def cleanup_unused_cache(self, max_age_hours=24):
        """사용하지 않는 캐시 정리"""
        current_time = time.time()
        max_age_seconds = max_age_hours * 3600
        
        tables_to_remove = []
        
        for table_name, cache_info in self.cached_tables.items():
            if current_time - cache_info['last_accessed'] > max_age_seconds:
                cache_info['dataframe'].unpersist()
                tables_to_remove.append(table_name)
        
        for table_name in tables_to_remove:
            del self.cached_tables[table_name]
        
        return len(tables_to_remove)

# 고급 캐싱 예제
def advanced_caching_example():
    spark = SparkSession.builder.appName("AdvancedCaching").getOrCreate()
    cache_manager = AdvancedCacheManager(spark)
    
    # 샘플 데이터
    data = [(i, f"category_{i % 5}", i * 10) for i in range(10000)]
    df = spark.createDataFrame(data, ["id", "category", "value"])
    
    # 지능형 캐싱
    access_pattern = {
        'frequency': 'high',
        'latency_requirement': 'low'
    }
    
    cached_df = cache_manager.smart_cache(df, "sample_table", access_pattern)
    
    # 캐시 효율성 모니터링
    cache_stats = cache_manager.monitor_cache_efficiency()
    print("Cache Statistics:")
    print(json.dumps(cache_stats, indent=2))
    
    # 사용하지 않는 캐시 정리
    cleaned_count = cache_manager.cleanup_unused_cache(max_age_hours=1)
    print(f"\nCleaned {cleaned_count} unused cache entries")
```

## 🔍 고급 성능 분석 도구

### Spark History Server 활용법

```python
# Spark History Server 설정 및 활용
class HistoryServerAnalyzer:
    def __init__(self, history_server_url):
        self.history_server_url = history_server_url
        
    def analyze_completed_applications(self):
        """완료된 애플리케이션 분석"""
        import requests
        
        # History Server API를 통한 애플리케이션 목록 조회
        apps_response = requests.get(f"{self.history_server_url}/api/v1/applications")
        applications = apps_response.json()
        
        analysis_results = []
        for app in applications:
            app_id = app['id']
            
            # 애플리케이션 상세 정보 조회
            app_details = requests.get(f"{self.history_server_url}/api/v1/applications/{app_id}")
            app_info = app_details.json()
            
            # 작업 정보 조회
            jobs_response = requests.get(f"{self.history_server_url}/api/v1/applications/{app_id}/jobs")
            jobs = jobs_response.json()
            
            analysis_result = {
                'app_id': app_id,
                'app_name': app_info.get('name', 'Unknown'),
                'start_time': app_info.get('attempts', [{}])[0].get('startTime'),
                'duration': app_info.get('attempts', [{}])[0].get('duration'),
                'total_jobs': len(jobs),
                'failed_jobs': len([j for j in jobs if j.get('status') == 'FAILED']),
                'performance_issues': self._identify_performance_issues(jobs)
            }
            
            analysis_results.append(analysis_result)
        
        return analysis_results
    
    def _identify_performance_issues(self, jobs):
        """성능 문제 식별"""
        issues = []
        
        for job in jobs:
            # 느린 작업 식별 (10분 이상)
            if job.get('duration', 0) > 600000:  # 10분 = 600,000ms
                issues.append({
                    'type': 'slow_job',
                    'job_id': job.get('jobId'),
                    'duration': job.get('duration'),
                    'message': f"작업 {job.get('jobId')}가 {job.get('duration')/1000:.1f}초 소요"
                })
            
            # 실패한 작업 식별
            if job.get('status') == 'FAILED':
                issues.append({
                    'type': 'failed_job',
                    'job_id': job.get('jobId'),
                    'message': f"작업 {job.get('jobId')} 실패"
                })
        
        return issues
    
    def generate_performance_report(self, app_id):
        """성능 보고서 생성"""
        import requests
        
        # 스테이지 정보 조회
        stages_response = requests.get(f"{self.history_server_url}/api/v1/applications/{app_id}/stages")
        stages = stages_response.json()
        
        # 실행자 정보 조회
        executors_response = requests.get(f"{self.history_server_url}/api/v1/applications/{app_id}/executors")
        executors = executors_response.json()
        
        report = {
            'total_stages': len(stages),
            'total_executors': len(executors),
            'stage_analysis': self._analyze_stages(stages),
            'executor_analysis': self._analyze_executors(executors),
            'recommendations': self._generate_recommendations(stages, executors)
        }
        
        return report
    
    def _analyze_stages(self, stages):
        """스테이지 분석"""
        stage_metrics = {
            'total_tasks': sum(s.get('numTasks', 0) for s in stages),
            'failed_tasks': sum(s.get('numFailedTasks', 0) for s in stages),
            'avg_task_duration': 0,
            'slow_stages': []
        }
        
        total_duration = 0
        stage_count = 0
        
        for stage in stages:
            if stage.get('numTasks', 0) > 0:
                avg_task_duration = stage.get('executorRunTime', 0) / stage.get('numTasks', 1)
                total_duration += avg_task_duration
                stage_count += 1
                
                # 느린 스테이지 식별 (평균 태스크 시간 30초 이상)
                if avg_task_duration > 30000:
                    stage_metrics['slow_stages'].append({
                        'stage_id': stage.get('stageId'),
                        'avg_task_duration': avg_task_duration,
                        'num_tasks': stage.get('numTasks')
                    })
        
        if stage_count > 0:
            stage_metrics['avg_task_duration'] = total_duration / stage_count
        
        return stage_metrics
    
    def _analyze_executors(self, executors):
        """실행자 분석"""
        executor_metrics = {
            'total_cores': sum(e.get('totalCores', 0) for e in executors),
            'total_memory': sum(e.get('maxMemory', 0) for e in executors),
            'memory_utilization': 0,
            'gc_time_ratio': 0
        }
        
        total_used_memory = sum(e.get('memoryUsed', 0) for e in executors)
        total_gc_time = sum(e.get('totalGCTime', 0) for e in executors)
        total_executor_time = sum(e.get('totalDuration', 0) for e in executors)
        
        if executor_metrics['total_memory'] > 0:
            executor_metrics['memory_utilization'] = total_used_memory / executor_metrics['total_memory']
        
        if total_executor_time > 0:
            executor_metrics['gc_time_ratio'] = total_gc_time / total_executor_time
        
        return executor_metrics
    
    def _generate_recommendations(self, stages, executors):
        """권장사항 생성"""
        recommendations = []
        
        # 메모리 사용률이 높은 경우
        total_memory = sum(e.get('maxMemory', 0) for e in executors)
        used_memory = sum(e.get('memoryUsed', 0) for e in executors)
        if total_memory > 0 and used_memory / total_memory > 0.8:
            recommendations.append({
                'type': 'memory',
                'priority': 'high',
                'message': '메모리 사용률이 높습니다. executor-memory 증가를 고려하세요'
            })
        
        # GC 시간이 긴 경우
        total_gc_time = sum(e.get('totalGCTime', 0) for e in executors)
        total_executor_time = sum(e.get('totalDuration', 0) for e in executors)
        if total_executor_time > 0 and total_gc_time / total_executor_time > 0.1:
            recommendations.append({
                'type': 'gc',
                'priority': 'medium',
                'message': 'GC 시간이 전체 실행 시간의 10% 이상입니다. JVM 튜닝을 고려하세요'
            })
        
        # 느린 스테이지가 있는 경우
        slow_stages = [s for s in stages if s.get('executorRunTime', 0) / max(s.get('numTasks', 1), 1) > 30000]
        if slow_stages:
            recommendations.append({
                'type': 'performance',
                'priority': 'medium',
                'message': f'{len(slow_stages)}개의 스테이지가 느립니다. 파티셔닝 최적화를 고려하세요'
            })
        
        return recommendations

# History Server 활용 예제
def history_server_analysis_example():
    analyzer = HistoryServerAnalyzer("http://localhost:18080")
    
    # 완료된 애플리케이션 분석
    completed_apps = analyzer.analyze_completed_applications()
    print("=== Completed Applications Analysis ===")
    for app in completed_apps:
        print(f"App: {app['app_name']} ({app['app_id']})")
        print(f"  Duration: {app['duration']/1000:.1f}s")
        print(f"  Jobs: {app['total_jobs']} (Failed: {app['failed_jobs']})")
        if app['performance_issues']:
            print("  Performance Issues:")
            for issue in app['performance_issues']:
                print(f"    - {issue['message']}")
        print()
    
    # 특정 애플리케이션 상세 분석
    if completed_apps:
        app_id = completed_apps[0]['app_id']
        report = analyzer.generate_performance_report(app_id)
        print("=== Performance Report ===")
        print(json.dumps(report, indent=2))
```

## 🚨 실무 성능 문제 진단 및 해결

### Data Skew 문제 해결

```python
# Data Skew 진단 및 해결 도구
class DataSkewResolver:
    def __init__(self, spark_session):
        self.spark = spark_session
    
    def detect_data_skew(self, df, key_columns):
        """데이터 스큐 감지"""
        from pyspark.sql.functions import col, count, min, max, avg, stddev
        
        # 키별 데이터 분포 분석
        key_counts = df.groupBy(*key_columns).count()
        
        # 통계 계산
        stats = key_counts.select(
            count("*").alias("total_keys"),
            min("count").alias("min_count"),
            max("count").alias("max_count"),
            avg("count").alias("avg_count"),
            stddev("count").alias("stddev_count")
        ).collect()[0]
        
        skew_ratio = stats['max_count'] / stats['avg_count'] if stats['avg_count'] > 0 else 0
        
        return {
            'total_keys': stats['total_keys'],
            'min_count': stats['min_count'],
            'max_count': stats['max_count'],
            'avg_count': stats['avg_count'],
            'stddev_count': stats['stddev_count'],
            'skew_ratio': skew_ratio,
            'is_skewed': skew_ratio > 2.0,
            'severity': self._get_skew_severity(skew_ratio)
        }
    
    def _get_skew_severity(self, skew_ratio):
        """스큐 심각도 판정"""
        if skew_ratio > 10:
            return "critical"
        elif skew_ratio > 5:
            return "high"
        elif skew_ratio > 2:
            return "medium"
        else:
            return "low"
    
    def resolve_data_skew(self, df, key_columns, method="salting"):
        """데이터 스큐 해결"""
        if method == "salting":
            return self._apply_salting(df, key_columns)
        elif method == "random_repartition":
            return self._apply_random_repartition(df, key_columns)
        elif method == "adaptive_query_execution":
            return self._enable_adaptive_query_execution(df)
        else:
            raise ValueError(f"Unknown method: {method}")
    
    def _apply_salting(self, df, key_columns):
        """Salting 기법 적용"""
        from pyspark.sql.functions import col, rand, concat, lit
        
        # Salt 값 생성 (0-99 사이의 랜덤 값)
        salted_df = df.withColumn("salt", (rand() * 100).cast("int"))
        
        # 키 컬럼에 salt 추가
        salted_keys = [concat(col(key), lit("_"), col("salt")) for key in key_columns]
        salted_keys.append(col("salt"))
        
        return salted_df.select(*salted_keys, *[col(c) for c in df.columns if c not in key_columns])
    
    def _apply_random_repartition(self, df, key_columns):
        """랜덤 리파티셔닝 적용"""
        # 현재 파티션 수의 2배로 증가
        current_partitions = df.rdd.getNumPartitions()
        new_partitions = current_partitions * 2
        
        return df.repartition(new_partitions)
    
    def _enable_adaptive_query_execution(self, df):
        """적응형 쿼리 실행 활성화"""
        # Spark 설정 변경
        self.spark.conf.set("spark.sql.adaptive.enabled", "true")
        self.spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
        self.spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")
        self.spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionFactor", "5")
        self.spark.conf.set("spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes", "256MB")
        
        return df

# Data Skew 해결 예제
def data_skew_resolution_example():
    spark = SparkSession.builder.appName("DataSkewResolution").getOrCreate()
    resolver = DataSkewResolver(spark)
    
    # 스큐가 있는 데이터 생성 (일부 키에 대량의 데이터)
    data = []
    for i in range(100000):
        if i < 1000:  # 처음 1000개는 키 0에 할당 (스큐 생성)
            data.append((0, f"data_{i}"))
        else:
            data.append((i % 100, f"data_{i}"))  # 나머지는 균등 분포
    
    df = spark.createDataFrame(data, ["key", "value"])
    
    # 스큐 감지
    skew_analysis = resolver.detect_data_skew(df, ["key"])
    print("=== Data Skew Analysis ===")
    print(json.dumps(skew_analysis, indent=2))
    
    if skew_analysis['is_skewed']:
        print(f"\nData skew detected with ratio: {skew_analysis['skew_ratio']:.2f}")
        print(f"Severity: {skew_analysis['severity']}")
        
        # 스큐 해결
        resolved_df = resolver.resolve_data_skew(df, ["key"], method="salting")
        
        # 해결 후 스큐 재측정
        resolved_skew = resolver.detect_data_skew(resolved_df, ["key", "salt"])
        print("\n=== After Skew Resolution ===")
        print(json.dumps(resolved_skew, indent=2))
```

### Slow Task 분석 및 최적화

```python
# Slow Task 분석 및 최적화 도구
class SlowTaskAnalyzer:
    def __init__(self, spark_session):
        self.spark = spark_session
    
    def analyze_slow_tasks(self, df, threshold_seconds=30):
        """느린 태스크 분석"""
        from pyspark.sql.functions import col, count, min, max, avg, stddev
        
        # 파티션별 처리 시간 측정
        def measure_partition_processing(iterator):
            import time
            start_time = time.time()
            
            # 데이터 처리
            data = list(iterator)
            processed_data = [row for row in data]  # 실제 처리 로직
            
            end_time = time.time()
            processing_time = end_time - start_time
            
            return [(processing_time, len(data))]
        
        # 각 파티션의 처리 시간 측정
        partition_metrics = df.rdd.mapPartitions(measure_partition_processing).collect()
        
        if not partition_metrics:
            return {"message": "No data to analyze"}
        
        processing_times = [metric[0] for metric in partition_metrics]
        data_sizes = [metric[1] for metric in partition_metrics]
        
        slow_partitions = [
            (i, time, size) for i, (time, size) in enumerate(partition_metrics)
            if time > threshold_seconds
        ]
        
        analysis = {
            'total_partitions': len(partition_metrics),
            'slow_partitions': len(slow_partitions),
            'avg_processing_time': sum(processing_times) / len(processing_times),
            'max_processing_time': max(processing_times),
            'min_processing_time': min(processing_times),
            'stddev_processing_time': self._calculate_stddev(processing_times),
            'slow_partition_details': slow_partitions,
            'recommendations': self._generate_slow_task_recommendations(slow_partitions, partition_metrics)
        }
        
        return analysis
    
    def _calculate_stddev(self, values):
        """표준편차 계산"""
        if len(values) < 2:
            return 0
        
        mean = sum(values) / len(values)
        variance = sum((x - mean) ** 2 for x in values) / (len(values) - 1)
        return variance ** 0.5
    
    def _generate_slow_task_recommendations(self, slow_partitions, all_partitions):
        """느린 태스크 해결 권장사항 생성"""
        recommendations = []
        
        if slow_partitions:
            recommendations.append({
                'type': 'repartitioning',
                'priority': 'high',
                'message': f'{len(slow_partitions)}개의 파티션이 느립니다. repartition() 또는 coalesce()를 고려하세요'
            })
        
        # 파티션 크기 불균형 확인
        data_sizes = [size for _, size in all_partitions]
        if len(data_sizes) > 1:
            size_ratio = max(data_sizes) / min(data_sizes)
            if size_ratio > 5:
                recommendations.append({
                    'type': 'data_distribution',
                    'priority': 'medium',
                    'message': f'파티션 크기 불균형이 심합니다 (비율: {size_ratio:.2f}). 데이터 분포를 개선하세요'
                })
        
        # 전체적인 처리 시간 분산 확인
        processing_times = [time for time, _ in all_partitions]
        if len(processing_times) > 1:
            time_ratio = max(processing_times) / min(processing_times)
            if time_ratio > 10:
                recommendations.append({
                    'type': 'performance_optimization',
                    'priority': 'medium',
                    'message': f'처리 시간 분산이 큽니다 (비율: {time_ratio:.2f}). 로직 최적화를 고려하세요'
                })
        
        return recommendations
    
    def optimize_partitioning(self, df, target_partition_size_mb=128):
        """파티셔닝 최적화"""
        # 현재 데이터 크기 추정
        row_count = df.count()
        estimated_row_size_bytes = 100  # 추정값 (실제로는 더 정확한 계산 필요)
        total_size_mb = (row_count * estimated_row_size_bytes) / (1024 * 1024)
        
        # 최적 파티션 수 계산
        optimal_partitions = max(1, int(total_size_mb / target_partition_size_mb))
        current_partitions = df.rdd.getNumPartitions()
        
        if optimal_partitions != current_partitions:
            if optimal_partitions > current_partitions:
                # 파티션 수 증가
                optimized_df = df.repartition(optimal_partitions)
                action = f"repartitioned from {current_partitions} to {optimal_partitions} partitions"
            else:
                # 파티션 수 감소
                optimized_df = df.coalesce(optimal_partitions)
                action = f"coalesced from {current_partitions} to {optimal_partitions} partitions"
        else:
            optimized_df = df
            action = "no partitioning change needed"
        
        return {
            'optimized_dataframe': optimized_df,
            'original_partitions': current_partitions,
            'optimized_partitions': optimal_partitions,
            'action_taken': action,
            'estimated_total_size_mb': total_size_mb
        }

# Slow Task 분석 예제
def slow_task_analysis_example():
    spark = SparkSession.builder.appName("SlowTaskAnalysis").getOrCreate()
    analyzer = SlowTaskAnalyzer(spark)
    
    # 불균등한 데이터 생성 (일부 파티션에 더 많은 데이터)
    data = []
    for i in range(100000):
        # 처음 50%는 파티션 0에, 나머지는 균등 분포
        if i < 50000:
            data.append((0, f"heavy_data_{i}", i * 100))
        else:
            data.append((i % 10, f"light_data_{i}", i))
    
    df = spark.createDataFrame(data, ["partition_key", "data", "value"])
    
    # 느린 태스크 분석
    slow_task_analysis = analyzer.analyze_slow_tasks(df, threshold_seconds=1)
    print("=== Slow Task Analysis ===")
    print(json.dumps(slow_task_analysis, indent=2))
    
    # 파티셔닝 최적화
    optimization_result = analyzer.optimize_partitioning(df)
    print("\n=== Partitioning Optimization ===")
    print(f"Original partitions: {optimization_result['original_partitions']}")
    print(f"Optimized partitions: {optimization_result['optimized_partitions']}")
    print(f"Action taken: {optimization_result['action_taken']}")
    print(f"Estimated total size: {optimization_result['estimated_total_size_mb']:.2f} MB")
```

### Shuffle Spill 문제 해결

```python
# Shuffle Spill 문제 해결 도구
class ShuffleSpillResolver:
    def __init__(self, spark_session):
        self.spark = spark_session
    
    def detect_shuffle_spill(self, df):
        """Shuffle Spill 감지"""
        # Spark 설정에서 spill 관련 설정 확인
        spill_settings = {
            'spark.sql.adaptive.enabled': self.spark.conf.get('spark.sql.adaptive.enabled', 'false'),
            'spark.sql.adaptive.coalescePartitions.enabled': self.spark.conf.get('spark.sql.adaptive.coalescePartitions.enabled', 'false'),
            'spark.sql.adaptive.advisoryPartitionSizeInBytes': self.spark.conf.get('spark.sql.adaptive.advisoryPartitionSizeInBytes', '64MB'),
            'spark.sql.adaptive.skewJoin.enabled': self.spark.conf.get('spark.sql.adaptive.skewJoin.enabled', 'false')
        }
        
        return {
            'spill_settings': spill_settings,
            'recommendations': self._generate_spill_recommendations(spill_settings)
        }
    
    def _generate_spill_recommendations(self, settings):
        """Spill 해결 권장사항 생성"""
        recommendations = []
        
        if settings['spark.sql.adaptive.enabled'] == 'false':
            recommendations.append({
                'type': 'adaptive_query',
                'priority': 'high',
                'message': 'Adaptive Query Execution을 활성화하여 자동 최적화를 활용하세요',
                'config': 'spark.sql.adaptive.enabled=true'
            })
        
        if settings['spark.sql.adaptive.coalescePartitions.enabled'] == 'false':
            recommendations.append({
                'type': 'partition_coalescing',
                'priority': 'medium',
                'message': '파티션 결합을 활성화하여 작은 파티션들을 합치세요',
                'config': 'spark.sql.adaptive.coalescePartitions.enabled=true'
            })
        
        # 파티션 크기 설정 확인
        partition_size = settings['spark.sql.adaptive.advisoryPartitionSizeInBytes']
        if '64MB' in partition_size:
            recommendations.append({
                'type': 'partition_size',
                'priority': 'medium',
                'message': '파티션 크기를 128MB 이상으로 증가시켜 spill을 줄이세요',
                'config': 'spark.sql.adaptive.advisoryPartitionSizeInBytes=128MB'
            })
        
        if settings['spark.sql.adaptive.skewJoin.enabled'] == 'false':
            recommendations.append({
                'type': 'skew_join',
                'priority': 'medium',
                'message': 'Skew Join 최적화를 활성화하여 데이터 스큐 문제를 해결하세요',
                'config': 'spark.sql.adaptive.skewJoin.enabled=true'
            })
        
        return recommendations
    
    def configure_spill_prevention(self):
        """Spill 방지 설정 적용"""
        configurations = {
            'spark.sql.adaptive.enabled': 'true',
            'spark.sql.adaptive.coalescePartitions.enabled': 'true',
            'spark.sql.adaptive.advisoryPartitionSizeInBytes': '128MB',
            'spark.sql.adaptive.skewJoin.enabled': 'true',
            'spark.sql.adaptive.skewJoin.skewedPartitionFactor': '5',
            'spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes': '256MB',
            'spark.sql.adaptive.localShuffleReader.enabled': 'true',
            'spark.sql.adaptive.optimizer.excludedRules': '',
            'spark.sql.adaptive.nonEmptyPartitionRatioForBroadcastJoin': '0.2'
        }
        
        applied_configs = {}
        for key, value in configurations.items():
            try:
                self.spark.conf.set(key, value)
                applied_configs[key] = value
            except Exception as e:
                print(f"Failed to set {key}: {e}")
        
        return applied_configs
    
    def optimize_shuffle_operations(self, df, operation_type="join"):
        """Shuffle 작업 최적화"""
        if operation_type == "join":
            return self._optimize_join_shuffle(df)
        elif operation_type == "aggregation":
            return self._optimize_aggregation_shuffle(df)
        elif operation_type == "repartition":
            return self._optimize_repartition_shuffle(df)
        else:
            return df
    
    def _optimize_join_shuffle(self, df):
        """조인 Shuffle 최적화"""
        # 브로드캐스트 조인 힌트 추가 (작은 테이블의 경우)
        from pyspark.sql.functions import broadcast
        
        # 여기서는 예시로 self-join을 최적화
        # 실제로는 두 개의 다른 DataFrame을 조인할 때 사용
        return df.hint("broadcast")
    
    def _optimize_aggregation_shuffle(self, df):
        """집계 Shuffle 최적화"""
        # 파티션 수를 줄여서 Shuffle 비용 감소
        current_partitions = df.rdd.getNumPartitions()
        if current_partitions > 200:
            optimized_partitions = min(200, current_partitions // 2)
            return df.coalesce(optimized_partitions)
        return df
    
    def _optimize_repartition_shuffle(self, df):
        """리파티셔닝 Shuffle 최적화"""
        # 적응형 쿼리 실행을 활용하여 자동 최적화
        return df

# Shuffle Spill 해결 예제
def shuffle_spill_resolution_example():
    spark = SparkSession.builder.appName("ShuffleSpillResolution").getOrCreate()
    resolver = ShuffleSpillResolver(spark)
    
    # Shuffle Spill 감지
    spill_analysis = resolver.detect_shuffle_spill(spark.createDataFrame([(1, "test")], ["id", "value"]))
    print("=== Shuffle Spill Analysis ===")
    print(json.dumps(spill_analysis, indent=2))
    
    # Spill 방지 설정 적용
    applied_configs = resolver.configure_spill_prevention()
    print("\n=== Applied Spill Prevention Configs ===")
    for key, value in applied_configs.items():
        print(f"{key}: {value}")
    
    # 대용량 데이터로 Shuffle 테스트
    data = [(i, f"data_{i}", i % 100) for i in range(1000000)]
    df = spark.createDataFrame(data, ["id", "value", "category"])
    
    # Shuffle이 발생하는 작업 수행
    result_df = resolver.optimize_shuffle_operations(
        df.groupBy("category").agg({"id": "count", "value": "collect_list"}),
        operation_type="aggregation"
    )
    
    print("\n=== Shuffle Optimization Applied ===")
    print(f"Result partitions: {result_df.rdd.getNumPartitions()}")
```

## 🤖 모니터링 자동화

### Health Check 시스템

```python
# Health Check 시스템
class SparkHealthChecker:
    def __init__(self, spark_session):
        self.spark = spark_session
        self.health_thresholds = {
            'memory_usage_ratio': 0.85,
            'gc_time_ratio': 0.1,
            'failed_task_ratio': 0.05,
            'executor_loss_ratio': 0.1,
            'slow_task_ratio': 0.2
        }
    
    def perform_health_check(self):
        """전체 시스템 건강도 체크"""
        status_tracker = self.spark.sparkContext.statusTracker()
        executor_infos = status_tracker.getExecutorInfos()
        
        health_report = {
            'timestamp': time.time(),
            'overall_status': 'healthy',
            'checks': {
                'memory_usage': self._check_memory_usage(executor_infos),
                'gc_performance': self._check_gc_performance(executor_infos),
                'task_failure': self._check_task_failure(executor_infos),
                'executor_health': self._check_executor_health(executor_infos),
                'cluster_utilization': self._check_cluster_utilization(executor_infos)
            },
            'recommendations': [],
            'critical_alerts': []
        }
        
        # 전체 상태 결정
        failed_checks = [check for check in health_report['checks'].values() if not check['status']]
        if failed_checks:
            health_report['overall_status'] = 'unhealthy'
            health_report['critical_alerts'] = [check['message'] for check in failed_checks]
        
        # 권장사항 생성
        health_report['recommendations'] = self._generate_health_recommendations(health_report['checks'])
        
        return health_report
    
    def _check_memory_usage(self, executor_infos):
        """메모리 사용량 체크"""
        total_memory = sum(info.maxMemory for info in executor_infos)
        used_memory = sum(info.memoryUsed for info in executor_infos)
        
        if total_memory == 0:
            return {'status': False, 'message': 'No memory information available', 'value': 0}
        
        usage_ratio = used_memory / total_memory
        threshold = self.health_thresholds['memory_usage_ratio']
        
        return {
            'status': usage_ratio < threshold,
            'message': f'Memory usage: {usage_ratio:.2%} (threshold: {threshold:.2%})',
            'value': usage_ratio,
            'threshold': threshold
        }
    
    def _check_gc_performance(self, executor_infos):
        """GC 성능 체크"""
        total_duration = sum(info.totalDuration for info in executor_infos)
        total_gc_time = sum(info.totalGCTime for info in executor_infos)
        
        if total_duration == 0:
            return {'status': True, 'message': 'No duration information available', 'value': 0}
        
        gc_ratio = total_gc_time / total_duration
        threshold = self.health_thresholds['gc_time_ratio']
        
        return {
            'status': gc_ratio < threshold,
            'message': f'GC time ratio: {gc_ratio:.2%} (threshold: {threshold:.2%})',
            'value': gc_ratio,
            'threshold': threshold
        }
    
    def _check_task_failure(self, executor_infos):
        """태스크 실패율 체크"""
        total_tasks = sum(info.completedTasks + info.failedTasks for info in executor_infos)
        failed_tasks = sum(info.failedTasks for info in executor_infos)
        
        if total_tasks == 0:
            return {'status': True, 'message': 'No tasks executed yet', 'value': 0}
        
        failure_ratio = failed_tasks / total_tasks
        threshold = self.health_thresholds['failed_task_ratio']
        
        return {
            'status': failure_ratio < threshold,
            'message': f'Task failure ratio: {failure_ratio:.2%} (threshold: {threshold:.2%})',
            'value': failure_ratio,
            'threshold': threshold
        }
    
    def _check_executor_health(self, executor_infos):
        """실행자 건강도 체크"""
        total_executors = len(executor_infos)
        lost_executors = len([info for info in executor_infos if info.isActive == False])
        
        if total_executors == 0:
            return {'status': False, 'message': 'No executors available', 'value': 0}
        
        loss_ratio = lost_executors / total_executors
        threshold = self.health_thresholds['executor_loss_ratio']
        
        return {
            'status': loss_ratio < threshold,
            'message': f'Executor loss ratio: {loss_ratio:.2%} (threshold: {threshold:.2%})',
            'value': loss_ratio,
            'threshold': threshold
        }
    
    def _check_cluster_utilization(self, executor_infos):
        """클러스터 활용률 체크"""
        total_cores = sum(info.totalCores for info in executor_infos)
        active_tasks = sum(info.activeTasks for info in executor_infos)
        
        if total_cores == 0:
            return {'status': False, 'message': 'No cores available', 'value': 0}
        
        utilization = active_tasks / total_cores
        
        return {
            'status': True,  # 활용률은 높을수록 좋음
            'message': f'Cluster utilization: {utilization:.2%}',
            'value': utilization
        }
    
    def _generate_health_recommendations(self, checks):
        """건강도 권장사항 생성"""
        recommendations = []
        
        if not checks['memory_usage']['status']:
            recommendations.append({
                'category': 'memory',
                'priority': 'high',
                'action': '메모리 사용량이 높습니다. executor-memory를 증가시키거나 데이터 캐싱을 최적화하세요'
            })
        
        if not checks['gc_performance']['status']:
            recommendations.append({
                'category': 'gc',
                'priority': 'medium',
                'action': 'GC 시간이 길어지고 있습니다. JVM GC 설정을 최적화하세요'
            })
        
        if not checks['task_failure']['status']:
            recommendations.append({
                'category': 'reliability',
                'priority': 'high',
                'action': '태스크 실패율이 높습니다. 리소스 할당과 데이터 품질을 확인하세요'
            })
        
        if not checks['executor_health']['status']:
            recommendations.append({
                'category': 'infrastructure',
                'priority': 'critical',
                'action': '실행자 손실이 발생하고 있습니다. 클러스터 상태를 점검하세요'
            })
        
        return recommendations

# Health Check 예제
def health_check_example():
    spark = SparkSession.builder.appName("HealthCheck").getOrCreate()
    health_checker = SparkHealthChecker(spark)
    
    # 건강도 체크 수행
    health_report = health_checker.perform_health_check()
    
    print("=== Spark Health Check Report ===")
    print(f"Overall Status: {health_report['overall_status'].upper()}")
    print(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(health_report['timestamp']))}")
    
    print("\n=== Individual Checks ===")
    for check_name, check_result in health_report['checks'].items():
        status_icon = "✅" if check_result['status'] else "❌"
        print(f"{status_icon} {check_name}: {check_result['message']}")
    
    if health_report['critical_alerts']:
        print("\n=== Critical Alerts ===")
        for alert in health_report['critical_alerts']:
            print(f"🚨 {alert}")
    
    if health_report['recommendations']:
        print("\n=== Recommendations ===")
        for rec in health_report['recommendations']:
            priority_icon = "🔴" if rec['priority'] == 'high' else "🟡" if rec['priority'] == 'medium' else "🟢"
            print(f"{priority_icon} [{rec['priority'].upper()}] {rec['action']}")
```

## 📚 학습 요약 {#학습-요약}

### Apache Spark 시리즈 완성! 🎉

이제 **Apache Spark 완전 정복 시리즈**가 완성되었습니다:

1. **Part 1**: Spark 기초와 핵심 개념 (RDD, DataFrame, Spark SQL)
2. **Part 2**: 대용량 배치 처리와 UDF 활용 (실무 프로젝트)  
3. **Part 3**: 실시간 스트리밍 처리와 Kafka 연동 (실시간 시스템)
4. **Part 4**: 모니터링과 성능 튜닝 (프로덕션 환경)

### 실무 적용 역량

✅ **기술적 역량**
- Spark 아키텍처 완전 이해
- 배치/스트리밍 처리 마스터
- 성능 최적화 전문가
- 프로덕션 환경 구축

✅ **실무 적용**
- 대용량 데이터 처리 시스템 구축
- 실시간 분석 파이프라인 개발
- 성능 모니터링 시스템 운영
- 클러스터 관리 및 튜닝

---

**시리즈 완료**: [Apache Spark 완전 정복 시리즈 전체 보기](/data-engineering/2025/09/10/apache-spark-series-overview.html)

---

*축하합니다! 이제 Apache Spark의 모든 것을 마스터하고 빅데이터 처리 전문가가 되었습니다!* 🚀✨
