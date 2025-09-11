---
layout: post
lang: ko
title: "Apache Kafka Python 가이드: 실시간 스트리밍과 데이터 처리"
description: "Python을 활용한 Apache Kafka 실시간 스트리밍 개발과 데이터 처리 기법을 학습하고 실제 프로젝트에 적용해봅니다."
date: 2025-09-09
author: Data Droid
category: data-engineering
tags: [Apache-Kafka, Python, 실시간스트리밍, 데이터처리, kafka-python, confluent-kafka, faust]
reading_time: "25분"
difficulty: "고급"
---

# Apache Kafka Python 가이드: 실시간 스트리밍과 데이터 처리

> Python을 활용한 Apache Kafka 실시간 스트리밍 개발과 데이터 처리 기법을 학습하고 실제 프로젝트에 적용해봅니다.

## 📋 목차

1. [Python Kafka 라이브러리 선택](#python-kafka-라이브러리-선택)
2. [kafka-python 기본 사용법](#kafka-python-기본-사용법)
3. [confluent-kafka 고성능 처리](#confluent-kafka-고성능-처리)
4. [Faust 스트리밍 처리](#faust-스트리밍-처리)
5. [실습: Python 기반 스트리밍 시스템](#실습-python-기반-스트리밍-시스템)
6. [성능 최적화와 모니터링](#성능-최적화와-모니터링)
7. [학습 요약](#학습-요약)

## 🐍 Python Kafka 라이브러리 선택

### 주요 라이브러리 비교

| 라이브러리 | 특징 | 장점 | 단점 | 사용 사례 |
|-----------|------|------|------|-----------|
| **kafka-python** | 순수 Python 구현 | 설치 간단, 이해하기 쉬움 | 성능 제한 | 학습, 프로토타입 |
| **confluent-kafka** | C 라이브러리 래핑 | 고성능, 안정성 | 설치 복잡 | 프로덕션 환경 |
| **faust** | 스트리밍 전용 | 간단한 스트리밍 | 제한적 기능 | 스트리밍 처리 |
| **aiokafka** | 비동기 처리 | 비동기 지원 | 복잡성 | 고성능 비동기 |

### 설치 방법

```bash
# kafka-python 설치
pip install kafka-python

# confluent-kafka 설치 (권장)
pip install confluent-kafka

# faust 설치
pip install faust[rocksdb]

# aiokafka 설치
pip install aiokafka

# 추가 의존성
pip install pandas numpy asyncio
```

## ⚡ kafka-python 기본 사용법

### 1. 프로듀서 구현

```python
from kafka import KafkaProducer
from kafka.errors import KafkaError
import json
import time
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PythonKafkaProducer:
    def __init__(self, bootstrap_servers='localhost:9092'):
        self.producer = KafkaProducer(
            bootstrap_servers=[bootstrap_servers],
            value_serializer=lambda v: json.dumps(v).encode('utf-8'),
            key_serializer=lambda k: k.encode('utf-8') if k else None,
            # 성능 최적화 설정
            batch_size=16384,  # 16KB
            linger_ms=5,       # 5ms 대기
            compression_type='snappy',  # 압축
            acks='all',        # 모든 복제본 확인
            retries=3,         # 재시도 횟수
            retry_backoff_ms=100,  # 재시도 간격
            # 안전성 설정
            enable_idempotence=True,  # 멱등성 보장
            max_in_flight_requests_per_connection=5,
            request_timeout_ms=30000,
        )
    
    def send_message(self, topic, key, value):
        """메시지 전송"""
        try:
            future = self.producer.send(topic, key=key, value=value)
            record_metadata = future.get(timeout=10)
            logger.info(f"Message sent to {record_metadata.topic} "
                       f"partition {record_metadata.partition} "
                       f"offset {record_metadata.offset}")
            return True
        except KafkaError as e:
            logger.error(f"Failed to send message: {e}")
            return False
    
    def send_batch(self, topic, messages):
        """배치 메시지 전송"""
        futures = []
        for key, value in messages:
            future = self.producer.send(topic, key=key, value=value)
            futures.append(future)
        
        # 모든 메시지 전송 완료 대기
        for future in futures:
            try:
                future.get(timeout=10)
            except KafkaError as e:
                logger.error(f"Batch send failed: {e}")
                return False
        return True
    
    def close(self):
        """프로듀서 종료"""
        self.producer.flush()  # 남은 메시지 전송
        self.producer.close()

# 사용 예제
if __name__ == "__main__":
    producer = PythonKafkaProducer()
    
    # 단일 메시지 전송
    producer.send_message(
        topic="user-events",
        key="user123",
        value={"action": "login", "timestamp": time.time()}
    )
    
    # 배치 메시지 전송
    messages = [
        ("user123", {"action": "view", "page": "/home"}),
        ("user456", {"action": "purchase", "amount": 99.99}),
        ("user789", {"action": "logout", "timestamp": time.time()})
    ]
    producer.send_batch("user-events", messages)
    
    producer.close()
```

### 2. 컨슈머 구현

```python
from kafka import KafkaConsumer
from kafka.errors import KafkaError
import json
import logging
from typing import Dict, Any, Callable

class PythonKafkaConsumer:
    def __init__(self, bootstrap_servers='localhost:9092', group_id='python-consumer'):
        self.consumer = KafkaConsumer(
            bootstrap_servers=[bootstrap_servers],
            group_id=group_id,
            value_deserializer=lambda m: json.loads(m.decode('utf-8')),
            key_deserializer=lambda m: m.decode('utf-8') if m else None,
            # 오프셋 관리
            auto_offset_reset='earliest',  # earliest, latest, none
            enable_auto_commit=False,      # 수동 오프셋 커밋
            # 성능 설정
            max_poll_records=500,          # 한 번에 처리할 레코드 수
            session_timeout_ms=30000,      # 세션 타임아웃
            heartbeat_interval_ms=3000,    # 하트비트 간격
            # 재시도 설정
            retry_backoff_ms=100,
            request_timeout_ms=30000,
        )
        self.message_handler = None
    
    def subscribe(self, topics):
        """토픽 구독"""
        self.consumer.subscribe(topics)
        logger.info(f"Subscribed to topics: {topics}")
    
    def set_message_handler(self, handler: Callable[[str, Any], None]):
        """메시지 처리 핸들러 설정"""
        self.message_handler = handler
    
    def start_consuming(self):
        """메시지 소비 시작"""
        try:
            while True:
                message_batch = self.consumer.poll(timeout_ms=1000)
                
                for topic_partition, messages in message_batch.items():
                    for message in messages:
                        self._process_message(message)
                
                # 오프셋 커밋
                self.consumer.commit()
                
        except KeyboardInterrupt:
            logger.info("Consumer stopped by user")
        except Exception as e:
            logger.error(f"Consumer error: {e}")
        finally:
            self.consumer.close()
    
    def _process_message(self, message):
        """메시지 처리"""
        try:
            logger.info(f"Received message: {message.key} -> {message.value}")
            
            if self.message_handler:
                self.message_handler(message.key, message.value)
            else:
                # 기본 처리
                self._default_handler(message.key, message.value)
                
        except Exception as e:
            logger.error(f"Error processing message: {e}")
    
    def _default_handler(self, key, value):
        """기본 메시지 핸들러"""
        print(f"Key: {key}, Value: {value}")

# 사용 예제
def custom_message_handler(key, value):
    """커스텀 메시지 핸들러"""
    print(f"Processing: {key} -> {value}")
    # 여기에 실제 처리 로직 구현

if __name__ == "__main__":
    consumer = PythonKafkaConsumer()
    consumer.subscribe(['user-events', 'order-events'])
    consumer.set_message_handler(custom_message_handler)
    consumer.start_consuming()
```

## 🚀 confluent-kafka 고성능 처리

### 1. 고성능 프로듀서

```python
from confluent_kafka import Producer, Consumer, KafkaError
import json
import time
import threading
from collections import defaultdict

class ConfluentKafkaProducer:
    def __init__(self, config):
        self.producer = Producer(config)
        self.delivery_callback_count = 0
        self.delivery_callback_errors = 0
    
    def delivery_callback(self, err, msg):
        """전송 결과 콜백"""
        if err is not None:
            self.delivery_callback_errors += 1
            print(f'Message delivery failed: {err}')
        else:
            self.delivery_callback_count += 1
            print(f'Message delivered to {msg.topic()} [{msg.partition()}] at offset {msg.offset()}')
    
    def produce_message(self, topic, key, value):
        """메시지 전송"""
        try:
            self.producer.produce(
                topic,
                key=key,
                value=json.dumps(value).encode('utf-8'),
                callback=self.delivery_callback
            )
            # 비동기 전송이므로 주기적으로 flush 필요
            self.producer.poll(0)
        except BufferError as e:
            print(f'Producer queue is full: {e}')
            self.producer.flush()
            raise
    
    def flush(self):
        """남은 메시지 전송"""
        self.producer.flush()

# 설정 예제
producer_config = {
    'bootstrap.servers': 'localhost:9092',
    'compression.type': 'snappy',
    'batch.size': 16384,
    'linger.ms': 5,
    'acks': 'all',
    'retries': 3,
    'enable.idempotence': True,
    'max.in.flight.requests.per.connection': 5,
}

producer = ConfluentKafkaProducer(producer_config)
```

### 2. 고성능 컨슈머

```python
class ConfluentKafkaConsumer:
    def __init__(self, config):
        self.consumer = Consumer(config)
        self.running = True
    
    def subscribe(self, topics):
        """토픽 구독"""
        self.consumer.subscribe(topics)
    
    def consume_messages(self, timeout=1.0):
        """메시지 소비"""
        try:
            while self.running:
                msg = self.consumer.poll(timeout=timeout)
                
                if msg is None:
                    continue
                
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        # 파티션 끝에 도달
                        continue
                    else:
                        print(f"Consumer error: {msg.error()}")
                        continue
                
                # 메시지 처리
                self.process_message(msg)
                
        except KeyboardInterrupt:
            print("Consumer interrupted by user")
        finally:
            self.close()
    
    def process_message(self, msg):
        """메시지 처리"""
        try:
            key = msg.key().decode('utf-8') if msg.key() else None
            value = json.loads(msg.value().decode('utf-8'))
            
            print(f"Received message: {key} -> {value}")
            
            # 여기에 실제 처리 로직 구현
            
        except Exception as e:
            print(f"Error processing message: {e}")
    
    def close(self):
        """컨슈머 종료"""
        self.running = False
        self.consumer.close()

# 설정 예제
consumer_config = {
    'bootstrap.servers': 'localhost:9092',
    'group.id': 'python-consumer-group',
    'auto.offset.reset': 'earliest',
    'enable.auto.commit': False,
    'max.poll.records': 500,
    'session.timeout.ms': 30000,
    'heartbeat.interval.ms': 3000,
}

consumer = ConfluentKafkaConsumer(consumer_config)
consumer.subscribe(['user-events'])
consumer.consume_messages()
```

## 🌊 Faust 스트리밍 처리

### 1. Faust 기본 설정

```python
import faust
from faust import Record
import asyncio
from typing import Optional

# Faust 앱 설정
app = faust.App(
    'kafka-streaming-app',
    broker='kafka://localhost:9092',
    store='rocksdb://',  # 상태 저장소
    value_serializer='json',
)

# 데이터 모델 정의
class UserEvent(Record):
    user_id: str
    action: str
    timestamp: float
    metadata: Optional[dict] = None

class OrderEvent(Record):
    order_id: str
    user_id: str
    amount: float
    items: list
    timestamp: float

# 토픽 정의
user_events_topic = app.topic('user-events', value_type=UserEvent)
order_events_topic = app.topic('order-events', value_type=OrderEvent)
processed_events_topic = app.topic('processed-events', value_type=UserEvent)

# 테이블 정의 (상태 저장소)
user_activity_table = app.Table('user-activity', default=int)
order_summary_table = app.Table('order-summary', default=dict)
```

### 2. 스트림 처리 예제

```python
@app.agent(user_events_topic)
async def process_user_events(events):
    """사용자 이벤트 처리"""
    async for event in events:
        # 이벤트 처리
        print(f"Processing user event: {event.user_id} - {event.action}")
        
        # 상태 업데이트
        user_activity_table[event.user_id] += 1
        
        # 이벤트 변환
        processed_event = UserEvent(
            user_id=event.user_id,
            action=f"processed_{event.action}",
            timestamp=event.timestamp,
            metadata={"processed_by": "faust"}
        )
        
        # 결과 전송
        await processed_events_topic.send(value=processed_event)

@app.agent(order_events_topic)
async def process_order_events(orders):
    """주문 이벤트 처리"""
    async for order in orders:
        print(f"Processing order: {order.order_id} - ${order.amount}")
        
        # 주문 요약 업데이트
        if order.user_id not in order_summary_table:
            order_summary_table[order.user_id] = {
                'total_orders': 0,
                'total_amount': 0.0,
                'last_order_time': 0.0
            }
        
        summary = order_summary_table[order.user_id]
        summary['total_orders'] += 1
        summary['total_amount'] += order.amount
        summary['last_order_time'] = order.timestamp
        
        # 주문 금액별 분류
        if order.amount > 100:
            await app.topic('high-value-orders').send(value=order)
        else:
            await app.topic('regular-orders').send(value=order)

# 윈도우 집계
@app.timer(interval=60.0)  # 1분마다 실행
async def aggregate_metrics():
    """메트릭 집계"""
    print("=== User Activity Summary ===")
    for user_id, count in user_activity_table.items():
        print(f"User {user_id}: {count} events")
    
    print("=== Order Summary ===")
    for user_id, summary in order_summary_table.items():
        print(f"User {user_id}: {summary['total_orders']} orders, ${summary['total_amount']:.2f}")

if __name__ == '__main__':
    app.main()
```

### 3. 고급 스트림 처리

```python
from faust import Stream, Table
from faust.types import StreamT

# 스트림 조인
@app.agent(user_events_topic)
async def join_user_orders(events):
    """사용자 이벤트와 주문 조인"""
    async for event in events:
        # 사용자 주문 정보 조회
        order_summary = order_summary_table.get(event.user_id, {})
        
        # 조인된 데이터 처리
        enriched_event = {
            'user_id': event.user_id,
            'action': event.action,
            'timestamp': event.timestamp,
            'user_orders': order_summary.get('total_orders', 0),
            'user_spent': order_summary.get('total_amount', 0.0)
        }
        
        print(f"Enriched event: {enriched_event}")

# 윈도우 집계
@app.agent(user_events_topic)
async def window_aggregation(events):
    """시간 윈도우 집계"""
    async for event in events:
        # 5분 윈도우로 집계
        window = event.timestamp // 300  # 5분 = 300초
        
        # 윈도우별 카운트
        window_key = f"window_{window}"
        user_activity_table[window_key] += 1
        
        # 윈도우가 완료되면 결과 전송
        if window_key not in processed_windows:
            processed_windows.add(window_key)
            await app.topic('window-results').send(
                value={'window': window, 'count': user_activity_table[window_key]}
            )

processed_windows = set()
```

## 🛠️ 실습: Python 기반 스트리밍 시스템

### 1. 실시간 로그 처리 시스템

```python
import asyncio
import json
import time
import logging
from datetime import datetime
from typing import Dict, Any
import pandas as pd

class LogProcessingSystem:
    def __init__(self):
        self.producer = ConfluentKafkaProducer(producer_config)
        self.consumer = ConfluentKafkaConsumer(consumer_config)
        self.log_stats = defaultdict(int)
    
    async def start_log_collector(self):
        """로그 수집기 시작"""
        while True:
            # 로그 파일에서 읽기 (실제로는 파일 모니터링)
            log_line = self.simulate_log_line()
            if log_line:
                self.producer.produce_message('raw-logs', None, log_line)
            
            await asyncio.sleep(0.1)  # 100ms 간격
    
    def simulate_log_line(self):
        """로그 라인 시뮬레이션"""
        import random
        levels = ['INFO', 'WARN', 'ERROR', 'DEBUG']
        actions = ['login', 'logout', 'purchase', 'view', 'search']
        
        return {
            'timestamp': datetime.now().isoformat(),
            'level': random.choice(levels),
            'message': f"User {random.randint(1, 1000)} performed {random.choice(actions)}",
            'ip': f"192.168.1.{random.randint(1, 255)}",
            'user_agent': 'Mozilla/5.0...'
        }
    
    async def start_log_processor(self):
        """로그 처리기 시작"""
        self.consumer.subscribe(['raw-logs'])
        
        while True:
            try:
                msg = self.consumer.consume_messages(timeout=1.0)
                if msg:
                    await self.process_log_message(msg)
            except Exception as e:
                logging.error(f"Error processing log: {e}")
    
    async def process_log_message(self, log_data):
        """로그 메시지 처리"""
        try:
            # 로그 레벨별 통계
            level = log_data.get('level', 'UNKNOWN')
            self.log_stats[level] += 1
            
            # 에러 로그 특별 처리
            if level == 'ERROR':
                await self.handle_error_log(log_data)
            
            # 사용자 행동 분석
            if 'performed' in log_data.get('message', ''):
                await self.analyze_user_behavior(log_data)
            
            # 메트릭 업데이트
            await self.update_metrics(log_data)
            
        except Exception as e:
            logging.error(f"Error processing log message: {e}")
    
    async def handle_error_log(self, log_data):
        """에러 로그 처리"""
        print(f"ERROR detected: {log_data['message']}")
        # 에러 알림 전송
        await self.send_alert('ERROR', log_data)
    
    async def analyze_user_behavior(self, log_data):
        """사용자 행동 분석"""
        message = log_data.get('message', '')
        if 'login' in message:
            print("User login detected")
        elif 'purchase' in message:
            print("Purchase activity detected")
    
    async def send_alert(self, level, log_data):
        """알림 전송"""
        alert = {
            'type': 'log_alert',
            'level': level,
            'message': log_data['message'],
            'timestamp': log_data['timestamp']
        }
        self.producer.produce_message('alerts', level, alert)
    
    async def update_metrics(self, log_data):
        """메트릭 업데이트"""
        metrics = {
            'timestamp': time.time(),
            'level_counts': dict(self.log_stats),
            'total_logs': sum(self.log_stats.values())
        }
        self.producer.produce_message('log-metrics', 'metrics', metrics)
    
    async def start_system(self):
        """시스템 시작"""
        tasks = [
            asyncio.create_task(self.start_log_collector()),
            asyncio.create_task(self.start_log_processor())
        ]
        
        try:
            await asyncio.gather(*tasks)
        except KeyboardInterrupt:
            print("System stopped by user")
        finally:
            self.producer.flush()
            self.consumer.close()

# 실행
if __name__ == "__main__":
    system = LogProcessingSystem()
    asyncio.run(system.start_system())
```

### 2. 이벤트 기반 마이크로서비스

```python
class EventDrivenMicroservice:
    def __init__(self, service_name):
        self.service_name = service_name
        self.consumer = ConfluentKafkaConsumer(consumer_config)
        self.producer = ConfluentKafkaProducer(producer_config)
        self.running = True
    
    async def start_service(self):
        """서비스 시작"""
        topics = ['user-events', 'order-events', 'payment-events']
        self.consumer.subscribe(topics)
        
        print(f"{self.service_name} started, listening to {topics}")
        
        while self.running:
            try:
                msg = self.consumer.consume_messages(timeout=1.0)
                if msg:
                    await self.handle_event(msg)
            except Exception as e:
                logging.error(f"Error in {self.service_name}: {e}")
    
    async def handle_event(self, event_data):
        """이벤트 처리"""
        event_type = event_data.get('type')
        
        if event_type == 'user_event':
            await self.handle_user_event(event_data)
        elif event_type == 'order_event':
            await self.handle_order_event(event_data)
        elif event_type == 'payment_event':
            await self.handle_payment_event(event_data)
    
    async def handle_user_event(self, event):
        """사용자 이벤트 처리"""
        print(f"Processing user event: {event}")
        # 사용자 이벤트 처리 로직
        await self.send_event('user-processed', event)
    
    async def handle_order_event(self, event):
        """주문 이벤트 처리"""
        print(f"Processing order event: {event}")
        # 주문 이벤트 처리 로직
        await self.send_event('order-processed', event)
    
    async def handle_payment_event(self, event):
        """결제 이벤트 처리"""
        print(f"Processing payment event: {event}")
        # 결제 이벤트 처리 로직
        await self.send_event('payment-processed', event)
    
    async def send_event(self, topic, event_data):
        """이벤트 전송"""
        self.producer.produce_message(topic, event_data.get('id'), event_data)
    
    def stop(self):
        """서비스 중지"""
        self.running = False
        self.consumer.close()
        self.producer.flush()

# 서비스 실행
if __name__ == "__main__":
    service = EventDrivenMicroservice("event-processor")
    asyncio.run(service.start_service())
```

## 📊 성능 최적화와 모니터링

### 1. 성능 모니터링

```python
import psutil
import time
from collections import defaultdict
import threading

class KafkaPerformanceMonitor:
    def __init__(self):
        self.metrics = defaultdict(list)
        self.running = True
        self.monitor_thread = None
    
    def start_monitoring(self):
        """모니터링 시작"""
        self.monitor_thread = threading.Thread(target=self._monitor_loop)
        self.monitor_thread.start()
    
    def _monitor_loop(self):
        """모니터링 루프"""
        while self.running:
            # 시스템 메트릭 수집
            cpu_percent = psutil.cpu_percent()
            memory_percent = psutil.virtual_memory().percent
            disk_io = psutil.disk_io_counters()
            network_io = psutil.net_io_counters()
            
            # 메트릭 저장
            timestamp = time.time()
            self.metrics['cpu'].append((timestamp, cpu_percent))
            self.metrics['memory'].append((timestamp, memory_percent))
            self.metrics['disk_read'].append((timestamp, disk_io.read_bytes))
            self.metrics['disk_write'].append((timestamp, disk_io.write_bytes))
            self.metrics['network_sent'].append((timestamp, network_io.bytes_sent))
            self.metrics['network_recv'].append((timestamp, network_io.bytes_recv))
            
            # 오래된 메트릭 정리 (1시간 이상)
            cutoff_time = timestamp - 3600
            for metric_name in self.metrics:
                self.metrics[metric_name] = [
                    (t, v) for t, v in self.metrics[metric_name] if t > cutoff_time
                ]
            
            time.sleep(10)  # 10초마다 수집
    
    def get_metrics_summary(self):
        """메트릭 요약 반환"""
        summary = {}
        for metric_name, values in self.metrics.items():
            if values:
                recent_values = [v for t, v in values[-10:]]  # 최근 10개
                summary[metric_name] = {
                    'current': recent_values[-1] if recent_values else 0,
                    'average': sum(recent_values) / len(recent_values) if recent_values else 0,
                    'max': max(recent_values) if recent_values else 0,
                    'min': min(recent_values) if recent_values else 0
                }
        return summary
    
    def stop_monitoring(self):
        """모니터링 중지"""
        self.running = False
        if self.monitor_thread:
            self.monitor_thread.join()

# 사용 예제
monitor = KafkaPerformanceMonitor()
monitor.start_monitoring()

# 1분 후 메트릭 확인
time.sleep(60)
summary = monitor.get_metrics_summary()
print("Performance Summary:", summary)

monitor.stop_monitoring()
```

### 2. 에러 처리와 재시도

```python
import asyncio
from functools import wraps
import random

def retry_with_backoff(max_retries=3, base_delay=1, max_delay=60):
    """재시도 데코레이터"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            for attempt in range(max_retries):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise e
                    
                    # 지수 백오프
                    delay = min(base_delay * (2 ** attempt), max_delay)
                    jitter = random.uniform(0, delay * 0.1)
                    await asyncio.sleep(delay + jitter)
                    
                    print(f"Retry {attempt + 1}/{max_retries} after {delay:.2f}s: {e}")
            
            return None
        return wrapper
    return decorator

class ResilientKafkaProducer:
    def __init__(self, config):
        self.producer = ConfluentKafkaProducer(config)
        self.dead_letter_queue = []
    
    @retry_with_backoff(max_retries=3)
    async def produce_with_retry(self, topic, key, value):
        """재시도가 있는 메시지 전송"""
        try:
            self.producer.produce_message(topic, key, value)
            return True
        except Exception as e:
            print(f"Failed to produce message: {e}")
            raise e
    
    async def produce_message(self, topic, key, value):
        """메시지 전송 (재시도 포함)"""
        try:
            await self.produce_with_retry(topic, key, value)
        except Exception as e:
            # 최종 실패 시 데드 레터 큐에 추가
            self.dead_letter_queue.append({
                'topic': topic,
                'key': key,
                'value': value,
                'error': str(e),
                'timestamp': time.time()
            })
            print(f"Message sent to dead letter queue: {e}")
    
    def get_dead_letter_queue(self):
        """데드 레터 큐 반환"""
        return self.dead_letter_queue
    
    def retry_dead_letter_queue(self):
        """데드 레터 큐 재시도"""
        retry_count = 0
        for item in self.dead_letter_queue[:]:
            try:
                self.producer.produce_message(
                    item['topic'], 
                    item['key'], 
                    item['value']
                )
                self.dead_letter_queue.remove(item)
                retry_count += 1
            except Exception as e:
                print(f"Failed to retry dead letter: {e}")
        
        print(f"Retried {retry_count} messages from dead letter queue")
```

## 📚 학습 요약

### 이번 포스트에서 학습한 내용

1. **Python Kafka 라이브러리 선택**
   - kafka-python, confluent-kafka, faust, aiokafka 비교
   - 각 라이브러리의 특징과 사용 사례

2. **kafka-python 기본 사용법**
   - 프로듀서와 컨슈머 구현
   - 배치 처리와 오프셋 관리

3. **confluent-kafka 고성능 처리**
   - 고성능 프로듀서/컨슈머 구현
   - 비동기 처리와 콜백 활용

4. **Faust 스트리밍 처리**
   - 스트림 처리와 상태 저장소
   - 윈도우 집계와 조인 연산

5. **실무급 스트리밍 시스템 구축**
   - 실시간 로그 처리 시스템
   - 이벤트 기반 마이크로서비스

6. **성능 최적화와 모니터링**
   - 성능 모니터링 시스템
   - 에러 처리와 재시도 전략

### 핵심 개념 정리

| 개념 | 설명 | 중요도 |
|------|------|--------|
| **라이브러리 선택** | 프로젝트 요구사항에 맞는 라이브러리 선택 | ⭐⭐⭐⭐⭐ |
| **비동기 처리** | 고성능을 위한 비동기 프로그래밍 | ⭐⭐⭐⭐⭐ |
| **스트리밍 처리** | 실시간 데이터 변환과 집계 | ⭐⭐⭐⭐⭐ |
| **모니터링** | 시스템 상태 추적과 성능 최적화 | ⭐⭐⭐⭐ |

### 실무 적용 시 고려사항

1. **라이브러리 선택**: 프로젝트 요구사항과 성능 요구사항 고려
2. **비동기 처리**: asyncio를 활용한 고성능 처리
3. **에러 처리**: 재시도 전략과 데드 레터 큐 활용
4. **모니터링**: 실시간 메트릭 수집과 알림 시스템

---

*이 가이드를 통해 Python으로 Apache Kafka를 활용한 고성능 스트리밍 시스템을 구축할 수 있습니다!* 🚀
