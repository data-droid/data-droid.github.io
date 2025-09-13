---
layout: post
lang: ko
title: "Part 3: Apache Spark 실시간 스트리밍 처리와 Kafka 연동 - 실무 프로젝트"
description: "Apache Spark Streaming, Structured Streaming, Kafka 연동을 통한 실시간 데이터 처리와 분석 시스템을 구축합니다."
date: 2025-09-12
author: Data Droid
category: data-engineering
tags: [Apache-Spark, Spark-Streaming, Kafka, 실시간처리, 스트리밍, 워터마킹, Python]
series: apache-spark-complete-guide
series_order: 3
reading_time: "50분"
difficulty: "고급"
---

# Part 3: Apache Spark 실시간 스트리밍 처리와 Kafka 연동 - 실무 프로젝트

> Apache Spark Streaming, Structured Streaming, Kafka 연동을 통한 실시간 데이터 처리와 분석 시스템을 구축합니다.

## 📋 목차

1. [Spark Streaming 기초](#spark-streaming-기초)
2. [Structured Streaming 완전 정리](#structured-streaming-완전-정리)
3. [Kafka 연동과 실시간 데이터 처리](#kafka-연동과-실시간-데이터-처리)
4. [워터마킹과 지연 데이터 처리](#워터마킹과-지연-데이터-처리)
5. [실무 프로젝트: 실시간 로그 분석 시스템](#실무-프로젝트-실시간-로그-분석-시스템)
6. [실시간 대시보드 구축](#실시간-대시보드-구축)
7. [학습 요약](#학습-요약)

## 🔄 Spark Streaming 기초

### Spark Streaming이란?

Spark Streaming은 Spark의 확장 모듈로, **마이크로 배치(Micro-batch)** 방식으로 실시간 데이터를 처리합니다.

#### **핵심 개념**
- **DStream (Discretized Stream)**: 연속적인 데이터 스트림을 작은 배치로 나눈 것
- **배치 간격 (Batch Interval)**: 각 배치를 처리하는 시간 간격
- **체크포인트 (Checkpoint)**: 장애 복구를 위한 상태 저장

### DStream 기본 연산

```python
from pyspark import SparkContext
from pyspark.streaming import StreamingContext

# StreamingContext 생성 (5초 배치 간격)
sc = SparkContext("local[2]", "StreamingExample")
ssc = StreamingContext(sc, 5)  # 5초 배치 간격

# 텍스트 스트림 생성 (소켓 연결)
lines = ssc.socketTextStream("localhost", 9999)

# 기본 변환 연산
words = lines.flatMap(lambda line: line.split(" "))
pairs = words.map(lambda word: (word, 1))
word_counts = pairs.reduceByKey(lambda x, y: x + y)

# 출력
word_counts.pprint()

# 스트리밍 시작
ssc.start()
ssc.awaitTermination()
```

### DStream 고급 연산

```python
# 윈도우 연산
windowed_counts = word_counts.reduceByKeyAndWindow(
    lambda x, y: x + y,  # reduce 함수
    lambda x, y: x - y,  # inverse reduce 함수
    30,  # 윈도우 길이 (30초)
    10   # 슬라이딩 간격 (10초)
)

# 상태 유지 연산
def update_function(new_values, running_count):
    if running_count is None:
        running_count = 0
    return sum(new_values, running_count)

running_counts = word_counts.updateStateByKey(update_function)

# 조인 연산
reference_data = sc.parallelize([("spark", "framework"), ("kafka", "broker")])
reference_dstream = ssc.queueStream([reference_data])
joined_stream = word_counts.transform(lambda rdd: rdd.join(reference_data))

# 출력
windowed_counts.pprint()
running_counts.pprint()
joined_stream.pprint()
```

## 📊 Structured Streaming 완전 정리

### Structured Streaming이란?

Structured Streaming은 Spark SQL 엔진을 기반으로 한 **고수준 스트리밍 API**입니다.

#### **핵심 특징**
- **정확히 한 번 처리 (Exactly-once processing)**
- **워터마킹 (Watermarking)** 지원
- **이벤트 시간 (Event Time)** 처리
- **구조화된 데이터** 처리

### 기본 구조화된 스트리밍

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *

# SparkSession 생성
spark = SparkSession.builder \
    .appName("StructuredStreamingExample") \
    .config("spark.sql.adaptive.enabled", "true") \
    .getOrCreate()

# 스트리밍 데이터 읽기
streaming_df = spark \
    .readStream \
    .format("socket") \
    .option("host", "localhost") \
    .option("port", 9999) \
    .load()

# 데이터 변환
words_df = streaming_df.select(
    explode(split(streaming_df.value, " ")).alias("word")
)

# 집계
word_counts = words_df.groupBy("word").count()

# 스트리밍 쿼리 시작
query = word_counts \
    .writeStream \
    .outputMode("complete") \
    .format("console") \
    .trigger(processingTime="10 seconds") \
    .start()

query.awaitTermination()
```

### 다양한 데이터 소스

```python
# 1. Kafka 스트림
kafka_df = spark \
    .readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "user-events") \
    .option("startingOffsets", "latest") \
    .load()

# 2. 파일 스트림
file_df = spark \
    .readStream \
    .format("json") \
    .option("path", "/path/to/streaming/data") \
    .option("maxFilesPerTrigger", 1) \
    .schema(schema) \
    .load()

# 3. Rate 스트림 (테스트용)
rate_df = spark \
    .readStream \
    .format("rate") \
    .option("rowsPerSecond", 100) \
    .load()
```

### 고급 스트리밍 연산

```python
# 이벤트 시간 처리
from pyspark.sql.types import TimestampType

# 스키마 정의
schema = StructType([
    StructField("timestamp", TimestampType(), True),
    StructField("user_id", StringType(), True),
    StructField("action", StringType(), True),
    StructField("value", DoubleType(), True)
])

# 스트리밍 데이터 읽기
events_df = spark \
    .readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "events") \
    .load() \
    .select(
        from_json(col("value").cast("string"), schema).alias("data")
    ) \
    .select("data.*")

# 이벤트 시간 기반 윈도우 집계
windowed_events = events_df \
    .withWatermark("timestamp", "10 minutes") \
    .groupBy(
        window("timestamp", "5 minutes", "1 minute"),
        "user_id"
    ) \
    .agg(
        count("*").alias("event_count"),
        sum("value").alias("total_value"),
        avg("value").alias("avg_value")
    )

# 출력
query = windowed_events \
    .writeStream \
    .outputMode("append") \
    .format("console") \
    .option("truncate", False) \
    .start()
```

## 🔗 Kafka 연동과 실시간 데이터 처리

### Kafka 설정과 연결

```python
# Kafka 프로듀서 설정
from kafka import KafkaProducer
import json
import time
import random

def create_kafka_producer():
    return KafkaProducer(
        bootstrap_servers=['localhost:9092'],
        value_serializer=lambda x: json.dumps(x).encode('utf-8'),
        key_serializer=lambda x: x.encode('utf-8') if x else None
    )

# 실시간 데이터 생성 및 전송
def generate_user_events():
    producer = create_kafka_producer()
    
    actions = ['login', 'logout', 'purchase', 'view', 'click']
    user_ids = ['user_001', 'user_002', 'user_003', 'user_004', 'user_005']
    
    for i in range(1000):
        event = {
            'timestamp': int(time.time() * 1000),
            'user_id': random.choice(user_ids),
            'action': random.choice(actions),
            'value': random.uniform(1.0, 100.0),
            'session_id': f'session_{i}',
            'ip_address': f'192.168.1.{random.randint(1, 254)}'
        }
        
        producer.send('user-events', key=event['user_id'], value=event)
        time.sleep(0.1)  # 100ms 간격
    
    producer.close()

# 데이터 생성 실행
# generate_user_events()
```

### Spark에서 Kafka 데이터 읽기

```python
# Kafka 스트림 읽기
kafka_df = spark \
    .readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "user-events") \
    .option("startingOffsets", "earliest") \
    .option("failOnDataLoss", "false") \
    .load()

# JSON 파싱
from pyspark.sql.types import StructType, StructField, StringType, LongType, DoubleType

event_schema = StructType([
    StructField("timestamp", LongType(), True),
    StructField("user_id", StringType(), True),
    StructField("action", StringType(), True),
    StructField("value", DoubleType(), True),
    StructField("session_id", StringType(), True),
    StructField("ip_address", StringType(), True)
])

parsed_df = kafka_df.select(
    col("key").cast("string").alias("kafka_key"),
    from_json(col("value").cast("string"), event_schema).alias("data")
).select("kafka_key", "data.*")

# 타임스탬프 변환
events_df = parsed_df.withColumn(
    "event_time", 
    from_unixtime(col("timestamp") / 1000).cast(TimestampType())
)
```

### 실시간 데이터 분석

```python
# 실시간 사용자 활동 분석
user_activity = events_df \
    .withWatermark("event_time", "5 minutes") \
    .groupBy(
        window("event_time", "1 minute", "30 seconds"),
        "user_id"
    ) \
    .agg(
        count("*").alias("total_events"),
        countDistinct("action").alias("unique_actions"),
        sum("value").alias("total_value"),
        collect_list("action").alias("actions_sequence")
    )

# 액션별 실시간 집계
action_metrics = events_df \
    .withWatermark("event_time", "5 minutes") \
    .groupBy(
        window("event_time", "2 minutes", "1 minute"),
        "action"
    ) \
    .agg(
        count("*").alias("action_count"),
        countDistinct("user_id").alias("unique_users"),
        avg("value").alias("avg_value"),
        max("value").alias("max_value"),
        min("value").alias("min_value")
    )

# 이상 탐지 (실시간)
anomaly_detection = events_df \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window("event_time", "5 minutes", "2 minutes"),
        "user_id"
    ) \
    .agg(
        count("*").alias("event_count"),
        sum("value").alias("total_value")
    ) \
    .filter(col("event_count") > 50)  # 5분에 50개 이상 이벤트

# 출력 설정
user_activity_query = user_activity \
    .writeStream \
    .outputMode("append") \
    .format("console") \
    .option("truncate", False) \
    .start()

action_metrics_query = action_metrics \
    .writeStream \
    .outputMode("append") \
    .format("console") \
    .option("truncate", False) \
    .start()

anomaly_query = anomaly_detection \
    .writeStream \
    .outputMode("append") \
    .format("console") \
    .option("truncate", False) \
    .start()
```

## 💧 워터마킹과 지연 데이터 처리

### 워터마킹이란?

워터마킹은 **지연 데이터(late data)**를 처리하기 위한 메커니즘입니다.

#### **워터마킹 개념**
- **이벤트 시간 (Event Time)**: 데이터가 실제로 발생한 시간
- **처리 시간 (Processing Time)**: 데이터가 시스템에서 처리되는 시간
- **워터마크**: 지연 데이터를 받을 수 있는 최대 지연 시간

### 워터마킹 구현

```python
# 워터마킹을 사용한 윈도우 집계
from pyspark.sql.functions import current_timestamp

# 워터마크 설정 (이벤트 시간으로부터 10분 지연 허용)
windowed_events_with_watermark = events_df \
    .withWatermark("event_time", "10 minutes") \
    .groupBy(
        window("event_time", "5 minutes"),
        "action"
    ) \
    .agg(
        count("*").alias("count"),
        sum("value").alias("total_value")
    )

# 지연 데이터 테스트
def test_late_data():
    """지연 데이터를 시뮬레이션하는 함수"""
    import time
    from datetime import datetime, timedelta
    
    producer = create_kafka_producer()
    
    # 정상 데이터
    normal_event = {
        'timestamp': int(time.time() * 1000),
        'user_id': 'user_001',
        'action': 'click',
        'value': 10.0
    }
    
    # 지연 데이터 (5분 전 데이터)
    late_event = {
        'timestamp': int((time.time() - 300) * 1000),  # 5분 전
        'user_id': 'user_002',
        'action': 'click',
        'value': 20.0
    }
    
    # 매우 지연된 데이터 (15분 전 데이터)
    very_late_event = {
        'timestamp': int((time.time() - 900) * 1000),  # 15분 전
        'user_id': 'user_003',
        'action': 'click',
        'value': 30.0
    }
    
    # 데이터 전송
    producer.send('user-events', key=normal_event['user_id'], value=normal_event)
    producer.send('user-events', key=late_event['user_id'], value=late_event)
    producer.send('user-events', key=very_late_event['user_id'], value=very_late_event)
    
    producer.close()

# 워터마킹 쿼리 실행
watermark_query = windowed_events_with_watermark \
    .writeStream \
    .outputMode("append") \
    .format("console") \
    .option("truncate", False) \
    .start()
```

### 지연 데이터 처리 전략

```python
# 1. 적응형 워터마크
adaptive_watermark = events_df \
    .withWatermark("event_time", "5 minutes") \
    .groupBy(
        window("event_time", "2 minutes"),
        "user_id"
    ) \
    .agg(
        count("*").alias("event_count"),
        max("event_time").alias("latest_event_time")
    )

# 2. 지연 데이터 별도 처리
# 정상 데이터
normal_data = events_df \
    .withWatermark("event_time", "5 minutes") \
    .filter(col("event_time") >= current_timestamp() - expr("INTERVAL 10 MINUTES"))

# 지연 데이터
late_data = events_df \
    .withWatermark("event_time", "5 minutes") \
    .filter(col("event_time") < current_timestamp() - expr("INTERVAL 10 MINUTES"))

# 3. 지연 데이터 알림
late_data_alert = late_data \
    .groupBy("user_id") \
    .agg(
        count("*").alias("late_event_count"),
        min("event_time").alias("earliest_late_event")
    ) \
    .filter(col("late_event_count") > 5)

# 지연 데이터 알림 쿼리
late_alert_query = late_data_alert \
    .writeStream \
    .outputMode("update") \
    .format("console") \
    .option("truncate", False) \
    .start()
```

## 🛠️ 실무 프로젝트: 실시간 로그 분석 시스템

### 프로젝트 구조

```
real-time-log-analysis/
├── src/
│   ├── log_processor.py
│   ├── anomaly_detector.py
│   ├── metrics_calculator.py
│   └── main.py
├── config/
│   ├── kafka_config.py
│   └── streaming_config.yaml
├── docker/
│   ├── docker-compose.yml
│   └── kafka-setup.sh
├── monitoring/
│   ├── grafana-dashboard.json
│   └── prometheus-config.yml
└── README.md
```

### 1. 로그 프로세서

```python
# src/log_processor.py
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
import re
import json

class LogProcessor:
    def __init__(self, spark_session):
        self.spark = spark_session
        
        # 로그 패턴 정의
        self.log_patterns = {
            'apache': r'^(\S+) (\S+) (\S+) \[([\w:/]+\s[+\-]\d{4})\] "(\S+) (\S+) (\S+)" (\d{3}) (\S+)',
            'nginx': r'^(\S+) - (\S+) \[([\w:/]+\s[+\-]\d{4})\] "(\S+) (\S+) (\S+)" (\d{3}) (\S+) "([^"]*)" "([^"]*)"',
            'json': r'^{.*}$'
        }
    
    def parse_apache_log(self, log_line):
        """Apache 로그 파싱"""
        match = re.match(self.log_patterns['apache'], log_line)
        if match:
            return {
                'ip': match.group(1),
                'identity': match.group(2),
                'user': match.group(3),
                'timestamp': match.group(4),
                'method': match.group(5),
                'url': match.group(6),
                'protocol': match.group(7),
                'status': int(match.group(8)),
                'size': match.group(9)
            }
        return None
    
    def parse_json_log(self, log_line):
        """JSON 로그 파싱"""
        try:
            return json.loads(log_line)
        except:
            return None
    
    def create_log_schema(self):
        """로그 스키마 정의"""
        return StructType([
            StructField("timestamp", TimestampType(), True),
            StructField("level", StringType(), True),
            StructField("service", StringType(), True),
            StructField("message", StringType(), True),
            StructField("ip_address", StringType(), True),
            StructField("user_id", StringType(), True),
            StructField("request_id", StringType(), True),
            StructField("response_time", DoubleType(), True),
            StructField("status_code", IntegerType(), True),
            StructField("error_code", StringType(), True)
        ])
    
    def process_log_stream(self, kafka_df):
        """로그 스트림 처리"""
        # JSON 파싱
        parsed_df = kafka_df.select(
            from_json(col("value").cast("string"), self.create_log_schema()).alias("data")
        ).select("data.*")
        
        # 데이터 정제
        cleaned_df = parsed_df \
            .withColumn("timestamp", to_timestamp(col("timestamp"))) \
            .withColumn("response_time", col("response_time").cast(DoubleType())) \
            .withColumn("status_code", col("status_code").cast(IntegerType())) \
            .filter(col("timestamp").isNotNull())
        
        return cleaned_df
    
    def extract_metrics(self, logs_df):
        """로그에서 메트릭 추출"""
        # 응답 시간 분포
        response_time_metrics = logs_df \
            .withWatermark("timestamp", "5 minutes") \
            .groupBy(
                window("timestamp", "1 minute"),
                "service"
            ) \
            .agg(
                count("*").alias("request_count"),
                avg("response_time").alias("avg_response_time"),
                max("response_time").alias("max_response_time"),
                min("response_time").alias("min_response_time"),
                stddev("response_time").alias("stddev_response_time")
            )
        
        # 에러율 계산
        error_rate = logs_df \
            .withWatermark("timestamp", "5 minutes") \
            .groupBy(
                window("timestamp", "1 minute"),
                "service"
            ) \
            .agg(
                count("*").alias("total_requests"),
                sum(when(col("status_code") >= 400, 1).otherwise(0)).alias("error_count")
            ) \
            .withColumn("error_rate", col("error_count") / col("total_requests") * 100)
        
        # IP별 요청 패턴
        ip_patterns = logs_df \
            .withWatermark("timestamp", "10 minutes") \
            .groupBy(
                window("timestamp", "5 minutes"),
                "ip_address"
            ) \
            .agg(
                count("*").alias("request_count"),
                countDistinct("user_id").alias("unique_users"),
                collect_set("service").alias("services_used")
            )
        
        return response_time_metrics, error_rate, ip_patterns
```

### 2. 이상 탐지기

```python
# src/anomaly_detector.py
from pyspark.sql.functions import *
from pyspark.sql.window import Window
import numpy as np

class AnomalyDetector:
    def __init__(self, spark_session):
        self.spark = spark_session
    
    def detect_response_time_anomalies(self, metrics_df):
        """응답 시간 이상 탐지"""
        # 이동 평균과 표준편차 계산
        window_spec = Window.partitionBy("service").orderBy("window")
        
        anomaly_df = metrics_df \
            .withColumn("avg_avg_response_time", avg("avg_response_time").over(
                window_spec.rowsBetween(-10, -1)
            )) \
            .withColumn("stddev_avg_response_time", stddev("avg_response_time").over(
                window_spec.rowsBetween(-10, -1)
            )) \
            .withColumn("z_score", 
                (col("avg_response_time") - col("avg_avg_response_time")) / 
                col("stddev_avg_response_time")
            ) \
            .filter(
                (col("z_score") > 2) | (col("z_score") < -2)
            )
        
        return anomaly_df
    
    def detect_error_rate_spikes(self, error_rate_df):
        """에러율 급증 탐지"""
        window_spec = Window.partitionBy("service").orderBy("window")
        
        spike_df = error_rate_df \
            .withColumn("prev_error_rate", lag("error_rate", 1).over(window_spec)) \
            .withColumn("error_rate_change", 
                col("error_rate") - col("prev_error_rate")
            ) \
            .filter(col("error_rate_change") > 10)  # 10% 이상 증가
        
        return spike_df
    
    def detect_suspicious_ips(self, ip_patterns_df):
        """의심스러운 IP 탐지"""
        # 높은 요청 빈도
        high_frequency = ip_patterns_df.filter(col("request_count") > 1000)
        
        # 많은 서비스 사용
        multi_service = ip_patterns_df.filter(size(col("services_used")) > 5)
        
        # 의심스러운 패턴 결합
        suspicious_ips = high_frequency.intersect(multi_service)
        
        return suspicious_ips
    
    def detect_ddos_attacks(self, logs_df):
        """DDoS 공격 탐지"""
        ddos_df = logs_df \
            .withWatermark("timestamp", "5 minutes") \
            .groupBy(
                window("timestamp", "1 minute"),
                "ip_address"
            ) \
            .agg(
                count("*").alias("request_count"),
                countDistinct("user_id").alias("unique_users")
            ) \
            .filter(
                (col("request_count") > 100) & (col("unique_users") < 5)
            )
        
        return ddos_df
```

### 3. 메트릭 계산기

```python
# src/metrics_calculator.py
from pyspark.sql.functions import *
from pyspark.sql.window import Window

class MetricsCalculator:
    def __init__(self, spark_session):
        self.spark = spark_session
    
    def calculate_sla_metrics(self, logs_df):
        """SLA 메트릭 계산"""
        sla_df = logs_df \
            .withWatermark("timestamp", "5 minutes") \
            .groupBy(
                window("timestamp", "1 minute"),
                "service"
            ) \
            .agg(
                count("*").alias("total_requests"),
                sum(when(col("response_time") <= 1.0, 1).otherwise(0)).alias("fast_requests"),
                sum(when(col("status_code") == 200, 1).otherwise(0)).alias("successful_requests")
            ) \
            .withColumn("availability", col("successful_requests") / col("total_requests") * 100) \
            .withColumn("performance", col("fast_requests") / col("total_requests") * 100)
        
        return sla_df
    
    def calculate_business_metrics(self, logs_df):
        """비즈니스 메트릭 계산"""
        # 사용자별 활동
        user_activity = logs_df \
            .withWatermark("timestamp", "10 minutes") \
            .groupBy(
                window("timestamp", "5 minutes"),
                "user_id"
            ) \
            .agg(
                count("*").alias("activity_count"),
                countDistinct("service").alias("services_used"),
                avg("response_time").alias("avg_response_time")
            )
        
        # 서비스별 인기도
        service_popularity = logs_df \
            .withWatermark("timestamp", "5 minutes") \
            .groupBy(
                window("timestamp", "1 minute"),
                "service"
            ) \
            .agg(
                count("*").alias("request_count"),
                countDistinct("user_id").alias("unique_users")
            )
        
        return user_activity, service_popularity
    
    def calculate_system_health(self, logs_df):
        """시스템 건강도 계산"""
        health_df = logs_df \
            .withWatermark("timestamp", "5 minutes") \
            .groupBy(
                window("timestamp", "1 minute")
            ) \
            .agg(
                count("*").alias("total_requests"),
                countDistinct("service").alias("active_services"),
                countDistinct("user_id").alias("active_users"),
                avg("response_time").alias("avg_response_time"),
                sum(when(col("status_code") >= 400, 1).otherwise(0)).alias("error_count")
            ) \
            .withColumn("error_rate", col("error_count") / col("total_requests") * 100) \
            .withColumn("health_score", 
                when(col("error_rate") < 1, 100)
                .when(col("error_rate") < 5, 80)
                .when(col("error_rate") < 10, 60)
                .otherwise(40)
            )
        
        return health_df
```

### 4. 메인 애플리케이션

```python
# src/main.py
import os
import logging
from pyspark.sql import SparkSession
from log_processor import LogProcessor
from anomaly_detector import AnomalyDetector
from metrics_calculator import MetricsCalculator

def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )

def main():
    setup_logging()
    logger = logging.getLogger(__name__)
    
    try:
        # Spark 세션 생성
        spark = SparkSession.builder \
            .appName("RealTimeLogAnalysis") \
            .config("spark.sql.adaptive.enabled", "true") \
            .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
            .config("spark.sql.streaming.checkpointLocation", "/tmp/checkpoint") \
            .getOrCreate()
        
        logger.info("Spark session created successfully")
        
        # 컴포넌트 초기화
        log_processor = LogProcessor(spark)
        anomaly_detector = AnomalyDetector(spark)
        metrics_calculator = MetricsCalculator(spark)
        
        # Kafka 스트림 읽기
        kafka_df = spark \
            .readStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", "localhost:9092") \
            .option("subscribe", "logs") \
            .option("startingOffsets", "latest") \
            .load()
        
        # 로그 처리
        processed_logs = log_processor.process_log_stream(kafka_df)
        
        # 메트릭 계산
        response_metrics, error_rate, ip_patterns = log_processor.extract_metrics(processed_logs)
        sla_metrics = metrics_calculator.calculate_sla_metrics(processed_logs)
        user_activity, service_popularity = metrics_calculator.calculate_business_metrics(processed_logs)
        system_health = metrics_calculator.calculate_system_health(processed_logs)
        
        # 이상 탐지
        response_anomalies = anomaly_detector.detect_response_time_anomalies(response_metrics)
        error_spikes = anomaly_detector.detect_error_rate_spikes(error_rate)
        suspicious_ips = anomaly_detector.detect_suspicious_ips(ip_patterns)
        ddos_attacks = anomaly_detector.detect_ddos_attacks(processed_logs)
        
        # 쿼리 시작
        queries = []
        
        # 메트릭 출력
        queries.append(
            response_metrics.writeStream
            .outputMode("append")
            .format("console")
            .option("truncate", False)
            .start()
        )
        
        queries.append(
            error_rate.writeStream
            .outputMode("append")
            .format("console")
            .option("truncate", False)
            .start()
        )
        
        queries.append(
            system_health.writeStream
            .outputMode("append")
            .format("console")
            .option("truncate", False)
            .start()
        )
        
        # 이상 탐지 알림
        queries.append(
            response_anomalies.writeStream
            .outputMode("append")
            .format("console")
            .option("truncate", False)
            .start()
        )
        
        queries.append(
            error_spikes.writeStream
            .outputMode("append")
            .format("console")
            .option("truncate", False)
            .start()
        )
        
        queries.append(
            suspicious_ips.writeStream
            .outputMode("append")
            .format("console")
            .option("truncate", False)
            .start()
        )
        
        # 모든 쿼리 대기
        for query in queries:
            query.awaitTermination()
        
    except Exception as e:
        logger.error(f"Application failed with error: {str(e)}")
        raise
    
    finally:
        if 'spark' in locals():
            spark.stop()

if __name__ == "__main__":
    main()
```

## 📊 실시간 대시보드 구축

### Grafana 대시보드 설정

```json
{
  "dashboard": {
    "title": "Real-time Log Analysis Dashboard",
    "panels": [
      {
        "title": "System Health Score",
        "type": "stat",
        "targets": [
          {
            "expr": "avg(health_score)",
            "legendFormat": "Health Score"
          }
        ]
      },
      {
        "title": "Response Time Trends",
        "type": "graph",
        "targets": [
          {
            "expr": "avg(avg_response_time) by (service)",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "avg(error_rate) by (service)",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "Request Volume",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(request_count)",
            "legendFormat": "Total Requests"
          }
        ]
      },
      {
        "title": "Anomaly Alerts",
        "type": "table",
        "targets": [
          {
            "expr": "anomaly_count",
            "legendFormat": "Anomalies"
          }
        ]
      }
    ]
  }
}
```

### Prometheus 메트릭 내보내기

```python
# 메트릭 내보내기 함수
def export_metrics_to_prometheus(metrics_df):
    """Prometheus로 메트릭 내보내기"""
    import requests
    import time
    
    while True:
        # 최신 메트릭 수집
        latest_metrics = metrics_df.collect()
        
        for metric in latest_metrics:
            # Prometheus 메트릭 형식으로 변환
            prometheus_metric = {
                'metric_name': 'spark_streaming_metric',
                'labels': {
                    'service': metric['service'],
                    'window': str(metric['window'])
                },
                'value': metric['avg_response_time'],
                'timestamp': int(time.time() * 1000)
            }
            
            # Prometheus Pushgateway로 전송
            requests.post(
                'http://localhost:9091/metrics/job/spark_streaming',
                data=prometheus_metric
            )
        
        time.sleep(10)  # 10초마다 전송
```

## ⚡ 실시간 분석 지연시간 최적화

### 지연시간 분석 도구

```python
# 실시간 지연시간 분석 및 최적화 도구
class StreamingLatencyOptimizer:
    def __init__(self, spark_session):
        self.spark = spark_session
        
    def analyze_processing_latency(self, streaming_df, latency_threshold_ms=1000):
        """처리 지연시간 분석"""
        from pyspark.sql.functions import col, current_timestamp, unix_timestamp, when
        
        # 이벤트 시간과 처리 시간 사이의 지연 계산
        latency_df = streaming_df.withColumn(
            "processing_latency_ms",
            (unix_timestamp(current_timestamp()) - unix_timestamp("timestamp")) * 1000
        )
        
        # 지연시간 통계 계산
        latency_stats = latency_df.select(
            col("processing_latency_ms"),
            when(col("processing_latency_ms") > latency_threshold_ms, 1).otherwise(0).alias("is_slow")
        ).agg({
            "processing_latency_ms": "avg",
            "processing_latency_ms": "max",
            "processing_latency_ms": "min",
            "is_slow": "sum"
        }).collect()[0]
        
        total_records = latency_df.count()
        
        return {
            'avg_latency_ms': latency_stats[0],
            'max_latency_ms': latency_stats[1],
            'min_latency_ms': latency_stats[2],
            'slow_records_count': latency_stats[3],
            'slow_records_ratio': latency_stats[3] / total_records if total_records > 0 else 0,
            'total_records': total_records,
            'latency_threshold_ms': latency_threshold_ms
        }
    
    def optimize_streaming_configuration(self, current_config):
        """스트리밍 설정 최적화"""
        optimized_config = current_config.copy()
        
        # 배치 간격 최적화 (지연시간에 따라 조정)
        if current_config.get('batch_interval_seconds', 10) > 5:
            optimized_config['batch_interval_seconds'] = 1  # 1초로 단축
        
        # 백프레셔 설정 최적화
        optimized_config.update({
            'spark.sql.streaming.rateLimit.enabled': 'true',
            'spark.sql.streaming.rateLimit.maxOffsetsPerTrigger': '10000',
            'spark.sql.streaming.rateLimit.maxRecordsPerSecond': '5000'
        })
        
        # 체크포인트 최적화
        optimized_config.update({
            'spark.sql.streaming.checkpointLocation': '/tmp/optimized_checkpoint',
            'spark.sql.streaming.minBatchesToRetain': '1',  # 최소 배치 유지
            'spark.sql.streaming.stateStore.providerClass': 'org.apache.spark.sql.execution.streaming.state.HDFSBackedStateStoreProvider'
        })
        
        # 메모리 최적화
        optimized_config.update({
            'spark.sql.streaming.stateStore.maintenanceInterval': '10s',  # 상태 정리 간격 단축
            'spark.sql.streaming.stateStore.minDeltasForSnapshot': '10'   # 스냅샷 생성 빈도 증가
        })
        
        return optimized_config
    
    def implement_adaptive_batching(self, streaming_df, target_latency_ms=500):
        """적응형 배칭 구현"""
        from pyspark.sql.functions import col, window, count, max as spark_max
        
        # 윈도우 크기를 동적으로 조정하는 함수
        def create_adaptive_window(df, base_window_size="10 seconds"):
            # 현재 시스템 부하에 따라 윈도우 크기 조정
            current_load = self._get_system_load()
            
            if current_load > 0.8:  # 높은 부하
                window_size = "30 seconds"
            elif current_load > 0.5:  # 중간 부하
                window_size = "20 seconds"
            else:  # 낮은 부하
                window_size = "10 seconds"
            
            return df.withWatermark("timestamp", window_size)
        
        return create_adaptive_window(streaming_df)
    
    def _get_system_load(self):
        """시스템 부하 측정"""
        status_tracker = self.spark.sparkContext.statusTracker()
        executor_infos = status_tracker.getExecutorInfos()
        
        if not executor_infos:
            return 0.0
        
        total_memory = sum(info.maxMemory for info in executor_infos)
        used_memory = sum(info.memoryUsed for info in executor_infos)
        
        return used_memory / total_memory if total_memory > 0 else 0.0
    
    def optimize_watermark_strategy(self, streaming_df, data_lateness_hours=2):
        """워터마크 전략 최적화"""
        from pyspark.sql.functions import col, window, count, max as spark_max
        
        # 데이터 지연 패턴에 따른 적응형 워터마크
        watermark_delay = f"{data_lateness_hours} hours"
        
        # 지연시간이 긴 데이터를 위한 추가 처리
        optimized_df = streaming_df.withWatermark("timestamp", watermark_delay)
        
        return optimized_df
    
    def implement_latency_monitoring(self, streaming_df):
        """지연시간 모니터링 구현"""
        from pyspark.sql.functions import col, current_timestamp, unix_timestamp, window, count, avg
        
        # 실시간 지연시간 메트릭 생성
        latency_metrics = streaming_df.withColumn(
            "processing_latency_ms",
            (unix_timestamp(current_timestamp()) - unix_timestamp("timestamp")) * 1000
        ).withWatermark("timestamp", "10 minutes").groupBy(
            window("timestamp", "1 minute"),
            "service"
        ).agg(
            count("*").alias("record_count"),
            avg("processing_latency_ms").alias("avg_latency_ms")
        )
        
        return latency_metrics

# 지연시간 최적화 예제
def streaming_latency_optimization_example():
    spark = SparkSession.builder.appName("StreamingLatencyOptimization").getOrCreate()
    optimizer = StreamingLatencyOptimizer(spark)
    
    # 스트리밍 데이터 생성 (Kafka에서 읽는 것으로 가정)
    streaming_df = spark.readStream \
        .format("kafka") \
        .option("kafka.bootstrap.servers", "localhost:9092") \
        .option("subscribe", "logs") \
        .load()
    
    # JSON 파싱
    from pyspark.sql.functions import col, from_json
    from pyspark.sql.types import StructType, StructField, StringType, TimestampType
    
    schema = StructType([
        StructField("timestamp", TimestampType(), True),
        StructField("service", StringType(), True),
        StructField("message", StringType(), True)
    ])
    
    parsed_df = streaming_df.select(
        from_json(col("value").cast("string"), schema).alias("data")
    ).select("data.*")
    
    # 지연시간 분석
    latency_analysis = optimizer.analyze_processing_latency(parsed_df)
    print("=== Streaming Latency Analysis ===")
    print(f"Average Latency: {latency_analysis['avg_latency_ms']:.2f}ms")
    print(f"Max Latency: {latency_analysis['max_latency_ms']:.2f}ms")
    print(f"Slow Records Ratio: {latency_analysis['slow_records_ratio']:.2%}")
    
    # 설정 최적화
    current_config = {
        'batch_interval_seconds': 10,
        'checkpoint_location': '/tmp/checkpoint'
    }
    
    optimized_config = optimizer.optimize_streaming_configuration(current_config)
    print("\n=== Optimized Configuration ===")
    for key, value in optimized_config.items():
        print(f"{key}: {value}")
    
    # 지연시간 모니터링 설정
    latency_metrics = optimizer.implement_latency_monitoring(parsed_df)
    
    # 스트리밍 쿼리 시작
    query = latency_metrics.writeStream \
        .outputMode("update") \
        .format("console") \
        .option("truncate", False) \
        .start()
    
    return query
```

### 고급 지연시간 최적화 기법

```python
# 고급 지연시간 최적화 클래스
class AdvancedLatencyOptimizer:
    def __init__(self, spark_session):
        self.spark = spark_session
    
    def implement_parallel_processing(self, streaming_df, parallelism_factor=2):
        """병렬 처리 구현"""
        # 파티션 수를 증가시켜 병렬 처리 향상
        current_partitions = streaming_df.rdd.getNumPartitions()
        optimized_partitions = current_partitions * parallelism_factor
        
        return streaming_df.repartition(optimized_partitions)
    
    def optimize_memory_usage_for_low_latency(self, spark_session):
        """저지연을 위한 메모리 최적화"""
        # 저지연 처리를 위한 메모리 설정
        memory_configs = {
            'spark.sql.streaming.stateStore.maintenanceInterval': '5s',
            'spark.sql.streaming.stateStore.minDeltasForSnapshot': '5',
            'spark.sql.streaming.stateStore.compression.enabled': 'true',
            'spark.sql.streaming.stateStore.compression.codec': 'lz4',
            'spark.sql.streaming.stateStore.rocksdb.compression': 'true',
            'spark.sql.streaming.stateStore.rocksdb.blockSizeKB': '64',
            'spark.sql.streaming.stateStore.rocksdb.blockCacheSizeMB': '128'
        }
        
        for key, value in memory_configs.items():
            spark_session.conf.set(key, value)
        
        return memory_configs
    
    def implement_backpressure_control(self, streaming_df):
        """백프레셔 제어 구현"""
        from pyspark.sql.functions import col, lag, when
        
        # 데이터 처리 속도를 모니터링하고 조절
        backpressure_df = streaming_df.withColumn(
            "processing_rate",
            col("timestamp").cast("long") - lag(col("timestamp").cast("long"), 1).over(
                window(col("timestamp"), "1 minute")
            )
        ).withColumn(
            "should_throttle",
            when(col("processing_rate") > 1000, True).otherwise(False)  # 1초당 1000개 이상이면 스로틀링
        )
        
        return backpressure_df
    
    def optimize_serialization_for_low_latency(self, spark_session):
        """저지연을 위한 직렬화 최적화"""
        serialization_configs = {
            'spark.serializer': 'org.apache.spark.serializer.KryoSerializer',
            'spark.sql.execution.arrow.pyspark.enabled': 'true',
            'spark.sql.execution.arrow.maxRecordsPerBatch': '10000',
            'spark.sql.execution.arrow.pyspark.fallback.enabled': 'true'
        }
        
        for key, value in serialization_configs.items():
            spark_session.conf.set(key, value)
        
        return serialization_configs
    
    def implement_caching_for_streaming(self, streaming_df):
        """스트리밍을 위한 캐싱 전략"""
        from pyspark import StorageLevel
        
        # 자주 사용되는 데이터를 메모리에 캐싱
        cached_df = streaming_df.persist(StorageLevel.MEMORY_AND_DISK_SER)
        
        return cached_df

# 고급 지연시간 최적화 예제
def advanced_latency_optimization_example():
    spark = SparkSession.builder.appName("AdvancedLatencyOptimization").getOrCreate()
    optimizer = AdvancedLatencyOptimizer(spark)
    
    # 스트리밍 데이터 생성
    data = [(f"service_{i % 5}", f"message_{i}", time.time()) for i in range(1000)]
    df = spark.createDataFrame(data, ["service", "message", "timestamp"])
    
    # 병렬 처리 최적화
    parallel_df = optimizer.implement_parallel_processing(df)
    print(f"Parallel processing partitions: {parallel_df.rdd.getNumPartitions()}")
    
    # 메모리 최적화
    memory_configs = optimizer.optimize_memory_usage_for_low_latency(spark)
    print("\n=== Memory Optimization Configs ===")
    for key, value in memory_configs.items():
        print(f"{key}: {value}")
    
    # 직렬화 최적화
    serialization_configs = optimizer.optimize_serialization_for_low_latency(spark)
    print("\n=== Serialization Optimization Configs ===")
    for key, value in serialization_configs.items():
        print(f"{key}: {value}")
    
    # 캐싱 전략 적용
    cached_df = optimizer.implement_caching_for_streaming(df)
    
    return cached_df
```

### 실시간 지연시간 모니터링 대시보드

```python
# 실시간 지연시간 모니터링 대시보드
class RealTimeLatencyDashboard:
    def __init__(self, spark_session):
        self.spark = spark_session
        
    def create_latency_monitoring_dashboard(self, streaming_df):
        """지연시간 모니터링 대시보드 생성"""
        from pyspark.sql.functions import col, current_timestamp, unix_timestamp, window, count, avg, max as spark_max, min as spark_min
        
        # 실시간 지연시간 메트릭 계산
        latency_metrics = streaming_df.withColumn(
            "processing_latency_ms",
            (unix_timestamp(current_timestamp()) - unix_timestamp("timestamp")) * 1000
        ).withWatermark("timestamp", "5 minutes").groupBy(
            window("timestamp", "30 seconds"),
            "service"
        ).agg(
            count("*").alias("record_count"),
            avg("processing_latency_ms").alias("avg_latency_ms"),
            spark_max("processing_latency_ms").alias("max_latency_ms"),
            spark_min("processing_latency_ms").alias("min_latency_ms")
        )
        
        # 지연시간 알림 생성
        alerts = latency_metrics.withColumn(
            "alert_level",
            when(col("avg_latency_ms") > 2000, "CRITICAL")
            .when(col("avg_latency_ms") > 1000, "WARNING")
            .when(col("avg_latency_ms") > 500, "INFO")
            .otherwise("OK")
        )
        
        return {
            'metrics': latency_metrics,
            'alerts': alerts
        }
    
    def export_latency_metrics_to_grafana(self, metrics_df):
        """Grafana용 지연시간 메트릭 내보내기"""
        import requests
        import json
        import time
        
        def export_to_grafana():
            while True:
                try:
                    # 최신 메트릭 수집
                    latest_metrics = metrics_df.collect()
                    
                    for metric in latest_metrics:
                        # Grafana 데이터 포인트 형식
                        grafana_data = {
                            "time": int(time.time() * 1000),
                            "value": metric['avg_latency_ms'],
                            "tags": {
                                "service": metric['service'],
                                "window": str(metric['window'])
                            }
                        }
                        
                        # Grafana API로 전송
                        response = requests.post(
                            'http://localhost:3000/api/datasources/proxy/1/write',
                            json=grafana_data,
                            headers={'Content-Type': 'application/json'}
                        )
                        
                        if response.status_code == 200:
                            print(f"Latency metric exported: {metric['service']} - {metric['avg_latency_ms']:.2f}ms")
                        else:
                            print(f"Failed to export metric: {response.status_code}")
                    
                    time.sleep(30)  # 30초마다 전송
                    
                except Exception as e:
                    print(f"Error exporting metrics: {e}")
                    time.sleep(60)  # 에러 시 1분 대기
        
        return export_to_grafana
    
    def create_latency_alerting_system(self, alerts_df):
        """지연시간 알림 시스템 생성"""
        def process_alerts():
            while True:
                try:
                    # 최신 알림 수집
                    latest_alerts = alerts_df.collect()
                    
                    for alert in latest_alerts:
                        if alert['alert_level'] in ['WARNING', 'CRITICAL']:
                            # 알림 메시지 생성
                            alert_message = {
                                'level': alert['alert_level'],
                                'service': alert['service'],
                                'avg_latency_ms': alert['avg_latency_ms'],
                                'max_latency_ms': alert['max_latency_ms'],
                                'timestamp': str(alert['window']),
                                'message': f"Service {alert['service']} has high latency: {alert['avg_latency_ms']:.2f}ms"
                            }
                            
                            # Slack, 이메일, SMS 등으로 알림 전송
                            self._send_alert(alert_message)
                    
                    time.sleep(60)  # 1분마다 알림 체크
                    
                except Exception as e:
                    print(f"Error processing alerts: {e}")
                    time.sleep(120)  # 에러 시 2분 대기
        
        return process_alerts
    
    def _send_alert(self, alert_message):
        """알림 전송 (Slack 예시)"""
        import requests
        
        slack_webhook_url = "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
        
        slack_message = {
            "text": f"🚨 Spark Streaming Latency Alert",
            "attachments": [
                {
                    "color": "danger" if alert_message['level'] == 'CRITICAL' else "warning",
                    "fields": [
                        {"title": "Service", "value": alert_message['service'], "short": True},
                        {"title": "Average Latency", "value": f"{alert_message['avg_latency_ms']:.2f}ms", "short": True},
                        {"title": "Max Latency", "value": f"{alert_message['max_latency_ms']:.2f}ms", "short": True},
                        {"title": "Alert Level", "value": alert_message['level'], "short": True}
                    ]
                }
            ]
        }
        
        try:
            response = requests.post(slack_webhook_url, json=slack_message)
            if response.status_code == 200:
                print(f"Alert sent successfully: {alert_message['message']}")
            else:
                print(f"Failed to send alert: {response.status_code}")
        except Exception as e:
            print(f"Error sending alert: {e}")

# 실시간 지연시간 모니터링 예제
def real_time_latency_monitoring_example():
    spark = SparkSession.builder.appName("RealTimeLatencyMonitoring").getOrCreate()
    dashboard = RealTimeLatencyDashboard(spark)
    
    # 스트리밍 데이터 생성
    data = [(f"service_{i % 3}", f"message_{i}", time.time()) for i in range(1000)]
    df = spark.createDataFrame(data, ["service", "message", "timestamp"])
    
    # 지연시간 모니터링 대시보드 생성
    dashboard_data = dashboard.create_latency_monitoring_dashboard(df)
    
    # 메트릭 내보내기 함수
    export_function = dashboard.export_latency_metrics_to_grafana(dashboard_data['metrics'])
    
    # 알림 처리 함수
    alert_function = dashboard.create_latency_alerting_system(dashboard_data['alerts'])
    
    print("=== Real-time Latency Monitoring Dashboard Created ===")
    print("Metrics and alerts are being processed in real-time")
    
    # 실제 환경에서는 별도 스레드에서 실행
    # import threading
    # threading.Thread(target=export_function, daemon=True).start()
    # threading.Thread(target=alert_function, daemon=True).start()
    
    return dashboard_data
```

## 📚 학습 요약

### 이번 파트에서 학습한 내용

1. **Spark Streaming 기초**
   - DStream과 마이크로 배치 처리
   - 기본 변환 연산과 윈도우 연산
   - 상태 유지 연산

2. **Structured Streaming**
   - 고수준 스트리밍 API
   - 이벤트 시간 처리
   - 다양한 데이터 소스

3. **Kafka 연동**
   - Kafka 프로듀서/컨슈머 설정
   - 실시간 데이터 생성과 처리
   - JSON 파싱과 스키마 처리

4. **워터마킹과 지연 데이터**
   - 워터마크 메커니즘 이해
   - 지연 데이터 처리 전략
   - 적응형 워터마크

5. **실무 프로젝트**
   - 실시간 로그 분석 시스템
   - 이상 탐지와 알림
   - 메트릭 계산과 모니터링

6. **실시간 대시보드**
   - Grafana 대시보드 구축
   - Prometheus 메트릭 내보내기
   - 실시간 모니터링

7. **실시간 분석 지연시간 최적화**
   - 지연시간 분석 도구
   - 고급 지연시간 최적화 기법
   - 실시간 지연시간 모니터링 대시보드

### 핵심 기술 스택

| 기술 | 용도 | 중요도 |
|------|------|--------|
| **Spark Streaming** | 마이크로 배치 처리 | ⭐⭐⭐⭐ |
| **Structured Streaming** | 고수준 스트리밍 | ⭐⭐⭐⭐⭐ |
| **Kafka** | 메시지 브로커 | ⭐⭐⭐⭐⭐ |
| **워터마킹** | 지연 데이터 처리 | ⭐⭐⭐⭐ |
| **Grafana** | 실시간 대시보드 | ⭐⭐⭐⭐ |

### 다음 파트 미리보기

**Part 4: 모니터링과 성능 튜닝**에서는 다음 내용을 다룹니다:
- Spark UI와 메트릭 분석
- 성능 모니터링과 프로파일링
- 메모리 최적화와 캐싱 전략
- 클러스터 튜닝과 확장성

---

**다음 파트**: [Part 4: 모니터링과 성능 튜닝](/data-engineering/2025/09/14/apache-spark-monitoring-tuning.html)

---

*이제 실시간 스트리밍 처리까지 마스터했습니다! 마지막 파트에서는 성능 튜닝과 모니터링으로 완성도를 높이겠습니다.* 🚀
