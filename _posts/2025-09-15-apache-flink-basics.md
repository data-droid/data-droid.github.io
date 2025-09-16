---
layout: post
lang: ko
title: "Part 1: Apache Flink 기초와 핵심 개념 - 진정한 스트리밍 처리의 시작"
description: "Apache Flink의 기본 구조와 핵심 개념인 DataStream API, 상태 관리, 시간 처리 등을 학습하고 실습해봅니다."
date: 2025-09-15
author: Data Droid
category: data-engineering
tags: [Apache-Flink, DataStream-API, 상태관리, 시간처리, 스트리밍처리, Python, PyFlink]
series: apache-flink-complete-guide
series_order: 1
reading_time: "35분"
difficulty: "중급"
---

# Part 1: Apache Flink 기초와 핵심 개념 - 진정한 스트리밍 처리의 시작

> Apache Flink의 기본 구조와 핵심 개념인 DataStream API, 상태 관리, 시간 처리 등을 학습하고 실습해봅니다.

## 📋 목차

1. [Apache Flink란 무엇인가?](#apache-flink란-무엇인가)
2. [Flink 아키텍처와 핵심 개념](#flink-아키텍처와-핵심-개념)
3. [DataStream API 기초](#datastream-api-기초)
4. [시간 처리와 워터마킹](#시간-처리와-워터마킹)
5. [상태 관리 기초](#상태-관리-기초)
6. [실무 프로젝트: 실시간 로그 분석](#실무-프로젝트-실시간-로그-분석)
7. [학습 요약](#학습-요약)

## 🚀 Apache Flink란 무엇인가?

### Flink의 탄생 배경

Apache Flink는 2009년 독일의 TU Berlin에서 시작된 **Stratosphere 프로젝트**에서 출발했습니다. 2014년 Apache Software Foundation의 Top-level 프로젝트가 되었으며, **진정한 스트리밍 처리**를 목표로 설계되었습니다.

#### **핵심 설계 철학**

1. **True Streaming**: 마이크로배치가 아닌 진정한 스트리밍 처리
2. **Low Latency**: 밀리초 단위의 지연시간 달성
3. **High Throughput**: 높은 처리량 유지
4. **Exactly-Once**: 정확히 한 번 처리 보장
5. **Fault Tolerance**: 강력한 장애 복구 능력

### Spark와의 근본적 차이점

```python
# Spark: 마이크로배치 방식
from pyspark.sql import SparkSession
from pyspark.streaming import StreamingContext

spark = SparkSession.builder.appName("SparkStreaming").getOrCreate()
ssc = StreamingContext(spark.sparkContext, 5)  # 5초 배치 간격

# Flink: 진정한 스트리밍 방식
from pyflink.datastream import StreamExecutionEnvironment

env = StreamExecutionEnvironment.get_execution_environment()
# 배치 간격 없음 - 이벤트 도착 즉시 처리
```

## 🏗️ Flink 아키텍처와 핵심 개념

### 클러스터 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Flink Cluster                           │
├─────────────────────────────────────────────────────────────┤
│  JobManager (Master)                                       │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │   Dispatcher    │  │  ResourceManager│                │
│  └─────────────────┘  └─────────────────┘                │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │   JobMaster     │  │  CheckpointCoord│                │
│  └─────────────────┘  └─────────────────┘                │
├─────────────────────────────────────────────────────────────┤
│  TaskManager (Worker)                                      │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │     Task 1      │  │     Task 2      │                │
│  └─────────────────┘  └─────────────────┘                │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │     Task 3      │  │     Task 4      │                │
│  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### 핵심 컴포넌트

#### **1. JobManager**
- **역할**: 작업 스케줄링과 리소스 관리
- **구성요소**:
  - Dispatcher: 작업 제출 인터페이스
  - ResourceManager: 리소스 할당 관리
  - JobMaster: 개별 작업 관리
  - CheckpointCoordinator: 체크포인트 조정

#### **2. TaskManager**
- **역할**: 실제 데이터 처리 실행
- **특징**:
  - Task Slot을 통한 병렬 처리
  - 상태 저장소 제공
  - 네트워크 통신 담당

### Flink 프로그램 구조

```python
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.table import StreamTableEnvironment

# 1. 실행 환경 생성
env = StreamExecutionEnvironment.get_execution_environment()

# 2. 데이터 소스 생성
data_stream = env.from_collection([1, 2, 3, 4, 5])

# 3. 변환 연산 적용
result_stream = data_stream.map(lambda x: x * 2)

# 4. 데이터 싱크 지정
result_stream.print()

# 5. 프로그램 실행
env.execute("Basic Flink Program")
```

## 📊 DataStream API 기초

### 기본 데이터 타입

```python
from pyflink.common.typeinfo import Types
from pyflink.datastream import StreamExecutionEnvironment

env = StreamExecutionEnvironment.get_execution_environment()

# 기본 데이터 타입들
basic_types = [
    "Hello", "World", 123, 45.67, True
]

data_stream = env.from_collection(basic_types)

# 타입 정보 명시적 지정
typed_stream = data_stream.map(
    lambda x: str(x).upper(),
    output_type=Types.STRING()
)
```

### 핵심 변환 연산

#### **1. Map 연산**
```python
# 단일 요소 변환
def multiply_by_two(x):
    return x * 2

data_stream = env.from_collection([1, 2, 3, 4, 5])
result = data_stream.map(multiply_by_two)
```

#### **2. Filter 연산**
```python
# 조건에 따른 필터링
def is_even(x):
    return x % 2 == 0

numbers = env.from_collection([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
even_numbers = numbers.filter(is_even)
```

#### **3. FlatMap 연산**
```python
# 1:N 변환
def split_words(sentence):
    return sentence.split()

text_stream = env.from_collection([
    "Hello World",
    "Apache Flink",
    "Stream Processing"
])

words = text_stream.flat_map(split_words)
```

#### **4. KeyBy 연산**
```python
from pyflink.common.typeinfo import Types

# 키별 그룹화
class LogEntry:
    def __init__(self, user_id, action, timestamp):
        self.user_id = user_id
        self.action = action
        self.timestamp = timestamp

# 샘플 로그 데이터
log_entries = [
    LogEntry("user1", "login", "2025-01-01 10:00:00"),
    LogEntry("user2", "view", "2025-01-01 10:01:00"),
    LogEntry("user1", "logout", "2025-01-01 10:02:00")
]

log_stream = env.from_collection(log_entries)
keyed_stream = log_stream.key_by(lambda log: log.user_id)
```

### 윈도우 연산

#### **1. Tumbling Window**
```python
from pyflink.datastream.window import TumblingProcessingTimeWindows
from pyflink.common.time import Time

# 고정 크기 윈도우
windowed_stream = keyed_stream.window(
    TumblingProcessingTimeWindows.of(Time.seconds(10))
).sum(lambda log: 1)  # 각 윈도우에서의 이벤트 수 계산
```

#### **2. Sliding Window**
```python
from pyflink.datastream.window import SlidingProcessingTimeWindows

# 슬라이딩 윈도우 (10초 크기, 5초 슬라이드)
sliding_window = keyed_stream.window(
    SlidingProcessingTimeWindows.of(Time.seconds(10), Time.seconds(5))
).sum(lambda log: 1)
```

#### **3. Session Window**
```python
from pyflink.datastream.window import ProcessingTimeSessionWindows

# 세션 윈도우 (5초 비활성 시간)
session_window = keyed_stream.window(
    ProcessingTimeSessionWindows.with_gap(Time.seconds(5))
).sum(lambda log: 1)
```

## ⏰ 시간 처리와 워터마킹

### 시간의 종류

#### **1. Event Time**
```python
from pyflink.common.time import Time
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.common.typeinfo import Types

env = StreamExecutionEnvironment.get_execution_environment()

# 이벤트 시간 기반 처리 설정
env.set_stream_time_characteristic(TimeCharacteristic.EventTime)

# 타임스탬프와 워터마크 설정
class TimestampedEvent:
    def __init__(self, value, timestamp):
        self.value = value
        self.timestamp = timestamp

# 워터마크 생성자 정의
class TimestampExtractor:
    def extract_timestamp(self, element, previous_timestamp):
        return element.timestamp * 1000  # 밀리초로 변환

events = env.from_collection([
    TimestampedEvent("event1", 1640995200),  # 2022-01-01 00:00:00
    TimestampedEvent("event2", 1640995260),  # 2022-01-01 00:01:00
    TimestampedEvent("event3", 1640995320),  # 2022-01-01 00:02:00
])

# 워터마크 할당
watermarked_stream = events.assign_timestamps_and_watermarks(
    TimestampExtractor()
)
```

#### **2. Processing Time**
```python
# 처리 시간 기반 처리 설정
env.set_stream_time_characteristic(TimeCharacteristic.ProcessingTime)

# 처리 시간은 자동으로 할당됨
processing_time_stream = env.from_collection([1, 2, 3, 4, 5])
```

#### **3. Ingestion Time**
```python
# 수집 시간 기반 처리 설정
env.set_stream_time_characteristic(TimeCharacteristic.IngestionTime)

# 수집 시간은 데이터가 Flink에 도착할 때 할당됨
ingestion_time_stream = env.from_collection([1, 2, 3, 4, 5])
```

### 워터마킹 전략

#### **1. Ascending Timestamps**
```python
from pyflink.datastream.functions import AscendingTimestampExtractor

class AscendingWatermarkExtractor(AscendingTimestampExtractor):
    def extract_timestamp(self, element, previous_timestamp):
        return element.timestamp * 1000

ascending_watermark = events.assign_timestamps_and_watermarks(
    AscendingWatermarkExtractor()
)
```

#### **2. Bounded Out-of-Orderness**
```python
from pyflink.datastream.functions import BoundedOutOfOrdernessTimestampExtractor
from pyflink.common.time import Time

class BoundedWatermarkExtractor(BoundedOutOfOrdernessTimestampExtractor):
    def __init__(self):
        super().__init__(Time.seconds(10))  # 10초 지연 허용
    
    def extract_timestamp(self, element, previous_timestamp):
        return element.timestamp * 1000

bounded_watermark = events.assign_timestamps_and_watermarks(
    BoundedWatermarkExtractor()
)
```

## 🗃️ 상태 관리 기초

### 상태의 종류

#### **1. ValueState**
```python
from pyflink.common.state import ValueStateDescriptor
from pyflink.common.typeinfo import Types
from pyflink.datastream import KeyedProcessFunction

class CounterFunction(KeyedProcessFunction):
    def __init__(self):
        self.count_state = None
    
    def open(self, runtime_context):
        # ValueState 초기화
        self.count_state = runtime_context.get_state(
            ValueStateDescriptor("count", Types.INT())
        )
    
    def process_element(self, value, ctx):
        # 현재 상태 값 가져오기
        current_count = self.count_state.value() or 0
        
        # 상태 업데이트
        new_count = current_count + 1
        self.count_state.update(new_count)
        
        # 결과 출력
        ctx.collect(f"Key: {value}, Count: {new_count}")

# 사용 예제
counter_stream = keyed_stream.process(CounterFunction())
```

#### **2. ListState**
```python
from pyflink.common.state import ListStateDescriptor

class ListCollector(KeyedProcessFunction):
    def __init__(self):
        self.list_state = None
    
    def open(self, runtime_context):
        self.list_state = runtime_context.get_list_state(
            ListStateDescriptor("items", Types.STRING())
        )
    
    def process_element(self, value, ctx):
        # 리스트에 값 추가
        self.list_state.add(value)
        
        # 리스트 내용 수집
        items = []
        for item in self.list_state.get():
            items.append(item)
        
        ctx.collect(f"Collected items: {items}")

list_stream = keyed_stream.process(ListCollector())
```

#### **3. MapState**
```python
from pyflink.common.state import MapStateDescriptor

class MapAggregator(KeyedProcessFunction):
    def __init__(self):
        self.map_state = None
    
    def open(self, runtime_context):
        self.map_state = runtime_context.get_map_state(
            MapStateDescriptor("counts", Types.STRING(), Types.INT())
        )
    
    def process_element(self, value, ctx):
        # 맵에서 현재 카운트 가져오기
        current_count = self.map_state.get(value) or 0
        
        # 카운트 증가
        self.map_state.put(value, current_count + 1)
        
        # 결과 출력
        ctx.collect(f"Value: {value}, Count: {current_count + 1}")

map_stream = keyed_stream.process(MapAggregator())
```

### 체크포인팅

```python
from pyflink.common import Configuration
from pyflink.common.checkpointing import CheckpointingMode

# 체크포인팅 설정
env.get_checkpoint_config().enable_checkpointing(1000)  # 1초마다 체크포인트
env.get_checkpoint_config().set_checkpointing_mode(CheckpointingMode.EXACTLY_ONCE)

# 체크포인트 디렉토리 설정
env.get_checkpoint_config().set_checkpoint_storage_dir("file:///tmp/flink-checkpoints")

# 최대 동시 체크포인트 수
env.get_checkpoint_config().set_max_concurrent_checkpoints(1)

# 최소 체크포인트 간격
env.get_checkpoint_config().set_min_pause_between_checkpoints(500)
```

## 🚀 실무 프로젝트: 실시간 로그 분석

### 프로젝트 개요

실시간 로그 분석 시스템을 구축하여 다음 기능들을 구현합니다:
- 실시간 로그 수집
- 사용자별 활동 분석
- 이상 패턴 탐지
- 실시간 알림

### 1. 로그 데이터 모델링

```python
from dataclasses import dataclass
from typing import Optional
import json

@dataclass
class LogEvent:
    user_id: str
    session_id: str
    action: str
    timestamp: int
    ip_address: str
    user_agent: str
    metadata: Optional[dict] = None
    
    def to_json(self):
        return json.dumps({
            'user_id': self.user_id,
            'session_id': self.session_id,
            'action': self.action,
            'timestamp': self.timestamp,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent,
            'metadata': self.metadata or {}
        })
    
    @classmethod
    def from_json(cls, json_str):
        data = json.loads(json_str)
        return cls(**data)
```

### 2. 실시간 로그 분석 시스템

```python
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.common.typeinfo import Types
from pyflink.common.state import ValueStateDescriptor, ListStateDescriptor
from pyflink.common.time import Time
from pyflink.datastream.functions import KeyedProcessFunction
from pyflink.datastream.window import TumblingEventTimeWindows
from pyflink.datastream.connectors import FlinkKafkaConsumer
from pyflink.common.serialization import SimpleStringSchema
from pyflink.common.typeinfo import Types

class LogAnalyzer:
    def __init__(self):
        self.env = StreamExecutionEnvironment.get_execution_environment()
        self.setup_environment()
    
    def setup_environment(self):
        # 체크포인팅 활성화
        self.env.get_checkpoint_config().enable_checkpointing(1000)
        
        # 이벤트 시간 설정
        self.env.set_stream_time_characteristic(TimeCharacteristic.EventTime)
    
    def create_kafka_source(self, topic, bootstrap_servers):
        """Kafka 소스 생성"""
        kafka_properties = {
            'bootstrap.servers': bootstrap_servers,
            'group.id': 'log-analyzer-group'
        }
        
        kafka_source = FlinkKafkaConsumer(
            topic,
            SimpleStringSchema(),
            kafka_properties
        )
        
        return self.env.add_source(kafka_source)
    
    def parse_log_events(self, log_stream):
        """로그 이벤트 파싱"""
        def parse_log(log_str):
            try:
                return LogEvent.from_json(log_str)
            except Exception as e:
                print(f"Failed to parse log: {log_str}, Error: {e}")
                return None
        
        return log_stream.map(parse_log, output_type=Types.PICKLED_BYTE_ARRAY()) \
                        .filter(lambda x: x is not None)
    
    def detect_anomalies(self, log_stream):
        """이상 패턴 탐지"""
        class AnomalyDetector(KeyedProcessFunction):
            def __init__(self):
                self.failed_login_count = None
                self.last_login_time = None
                self.suspicious_actions = None
            
            def open(self, runtime_context):
                self.failed_login_count = runtime_context.get_state(
                    ValueStateDescriptor("failed_logins", Types.INT())
                )
                self.last_login_time = runtime_context.get_state(
                    ValueStateDescriptor("last_login", Types.LONG())
                )
                self.suspicious_actions = runtime_context.get_list_state(
                    ListStateDescriptor("suspicious", Types.STRING())
                )
            
            def process_element(self, log_event, ctx):
                current_time = log_event.timestamp
                
                # 실패한 로그인 시도 추적
                if log_event.action == "login_failed":
                    current_count = self.failed_login_count.value() or 0
                    self.failed_login_count.update(current_count + 1)
                    
                    # 5분 내 5회 이상 실패 시 알림
                    if current_count >= 4:  # 0부터 시작하므로 4면 5번째
                        ctx.collect({
                            'type': 'security_alert',
                            'user_id': log_event.user_id,
                            'message': f'Multiple failed login attempts: {current_count + 1}',
                            'timestamp': current_time
                        })
                        self.failed_login_count.clear()
                
                # 성공한 로그인 시 실패 카운트 초기화
                elif log_event.action == "login_success":
                    self.failed_login_count.clear()
                    self.last_login_time.update(current_time)
                
                # 비정상적인 시간대 활동 감지
                elif log_event.action in ["view", "purchase", "download"]:
                    last_login = self.last_login_time.value()
                    if last_login and (current_time - last_login) > 86400:  # 24시간
                        ctx.collect({
                            'type': 'anomaly_alert',
                            'user_id': log_event.user_id,
                            'message': f'Activity after long inactivity: {log_event.action}',
                            'timestamp': current_time
                        })
        
        # 사용자별로 키 지정하고 이상 탐지
        return log_stream.key_by(lambda log: log.user_id) \
                        .process(AnomalyDetector())
    
    def calculate_user_metrics(self, log_stream):
        """사용자별 메트릭 계산"""
        class UserMetricsCalculator(KeyedProcessFunction):
            def __init__(self):
                self.action_counts = None
                self.session_duration = None
                self.last_action_time = None
            
            def open(self, runtime_context):
                self.action_counts = runtime_context.get_map_state(
                    MapStateDescriptor("action_counts", Types.STRING(), Types.INT())
                )
                self.session_duration = runtime_context.get_state(
                    ValueStateDescriptor("session_duration", Types.LONG())
                )
                self.last_action_time = runtime_context.get_state(
                    ValueStateDescriptor("last_action_time", Types.LONG())
                )
            
            def process_element(self, log_event, ctx):
                current_time = log_event.timestamp
                
                # 액션별 카운트 업데이트
                current_count = self.action_counts.get(log_event.action) or 0
                self.action_counts.put(log_event.action, current_count + 1)
                
                # 세션 지속 시간 계산
                last_time = self.last_action_time.value()
                if last_time:
                    duration = current_time - last_time
                    current_duration = self.session_duration.value() or 0
                    self.session_duration.update(current_duration + duration)
                
                self.last_action_time.update(current_time)
                
                # 1분마다 메트릭 출력
                if current_time % 60 == 0:
                    metrics = {
                        'user_id': log_event.user_id,
                        'timestamp': current_time,
                        'session_duration': self.session_duration.value() or 0,
                        'action_counts': dict(self.action_counts.items())
                    }
                    ctx.collect(metrics)
        
        return log_stream.key_by(lambda log: log.user_id) \
                        .process(UserMetricsCalculator())
    
    def run_analysis(self):
        """분석 파이프라인 실행"""
        # Kafka에서 로그 읽기
        log_stream = self.create_kafka_source("user-logs", "localhost:9092")
        
        # 로그 파싱
        parsed_logs = self.parse_log_events(log_stream)
        
        # 타임스탬프와 워터마크 할당
        watermarked_logs = parsed_logs.assign_timestamps_and_watermarks(
            TimestampExtractor()
        )
        
        # 이상 탐지
        anomalies = self.detect_anomalies(watermarked_logs)
        
        # 사용자 메트릭 계산
        metrics = self.calculate_user_metrics(watermarked_logs)
        
        # 결과 출력
        anomalies.print("Security Alerts")
        metrics.print("User Metrics")
        
        # 실행
        self.env.execute("Real-time Log Analysis")

# 워터마크 추출기
class TimestampExtractor(BoundedOutOfOrdernessTimestampExtractor):
    def __init__(self):
        super().__init__(Time.seconds(10))  # 10초 지연 허용
    
    def extract_timestamp(self, element, previous_timestamp):
        return element.timestamp * 1000

if __name__ == "__main__":
    analyzer = LogAnalyzer()
    analyzer.run_analysis()
```

### 3. 실행 및 테스트

```python
# 테스트 데이터 생성기
class LogGenerator:
    def __init__(self):
        import random
        import time
        self.users = ["user1", "user2", "user3", "user4", "user5"]
        self.actions = ["login", "logout", "view", "purchase", "download", "login_failed"]
        self.ip_addresses = ["192.168.1.1", "192.168.1.2", "10.0.0.1", "10.0.0.2"]
    
    def generate_log(self):
        import random
        import time
        
        return LogEvent(
            user_id=random.choice(self.users),
            session_id=f"session_{random.randint(1000, 9999)}",
            action=random.choice(self.actions),
            timestamp=int(time.time()),
            ip_address=random.choice(self.ip_addresses),
            user_agent="Mozilla/5.0 (Test Browser)"
        ).to_json()

# 테스트 실행
def test_log_analysis():
    env = StreamExecutionEnvironment.get_execution_environment()
    
    # 테스트 데이터 생성
    generator = LogGenerator()
    test_logs = [generator.generate_log() for _ in range(100)]
    
    log_stream = env.from_collection(test_logs)
    
    # 로그 파싱
    parsed_logs = log_stream.map(
        lambda x: LogEvent.from_json(x),
        output_type=Types.PICKLED_BYTE_ARRAY()
    ).filter(lambda x: x is not None)
    
    # 간단한 통계 계산
    user_actions = parsed_logs.map(
        lambda log: (log.user_id, log.action, 1)
    ).key_by(lambda x: x[0]) \
     .window(TumblingProcessingTimeWindows.of(Time.seconds(5))) \
     .sum(2)
    
    user_actions.print()
    
    env.execute("Log Analysis Test")

# 테스트 실행
if __name__ == "__main__":
    test_log_analysis()
```

## 📚 학습 요약

### 이번 파트에서 학습한 내용

1. **Apache Flink 소개**
   - Flink의 탄생 배경과 설계 철학
   - Spark와의 근본적 차이점
   - 진정한 스트리밍 처리의 개념

2. **Flink 아키텍처**
   - JobManager와 TaskManager의 역할
   - 클러스터 구성과 리소스 관리
   - 프로그램 실행 구조

3. **DataStream API**
   - 기본 데이터 타입과 변환 연산
   - Map, Filter, FlatMap, KeyBy 연산
   - 윈도우 연산 (Tumbling, Sliding, Session)

4. **시간 처리**
   - Event Time, Processing Time, Ingestion Time
   - 워터마킹 전략과 지연 데이터 처리
   - 타임스탬프 할당 방법

5. **상태 관리**
   - ValueState, ListState, MapState
   - 체크포인팅과 장애 복구
   - 상태 기반 처리 로직

6. **실무 프로젝트**
   - 실시간 로그 분석 시스템
   - 이상 패턴 탐지
   - 사용자 메트릭 계산

### 핵심 기술 스택

| 기술 | 용도 | 중요도 |
|------|------|--------|
| **DataStream API** | 스트리밍 데이터 처리 | ⭐⭐⭐⭐⭐ |
| **상태 관리** | 상태 기반 처리 | ⭐⭐⭐⭐⭐ |
| **시간 처리** | 이벤트 시간 기반 분석 | ⭐⭐⭐⭐⭐ |
| **윈도우 연산** | 시간 기반 집계 | ⭐⭐⭐⭐ |
| **체크포인팅** | 장애 복구 | ⭐⭐⭐⭐ |

### 다음 파트 미리보기

**Part 2: 고급 스트리밍 처리와 상태 관리**에서는 다음 내용을 다룹니다:
- 고급 상태 관리 패턴
- 체크포인팅과 세이브포인트 심화
- 복잡한 시간 처리 전략
- 성능 최적화 기법

---

**다음 파트**: [Part 2: 고급 스트리밍 처리와 상태 관리](/data-engineering/2025/09/16/apache-flink-advanced-streaming.html)

---

*이제 Flink의 기초를 마스터했습니다! 다음 파트에서는 더 고급 기능들을 다뤄보겠습니다.* 🚀
