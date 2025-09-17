---
layout: post
lang: ko
title: "Part 3: Apache Flink 실시간 분석과 CEP - 복잡한 이벤트 처리의 완성"
description: "Apache Flink의 CEP (Complex Event Processing), 실시간 집계, 윈도우 함수, 패턴 매칭을 학습하고 실시간 대시보드와 알림 시스템을 구축합니다."
date: 2025-09-17
author: Data Droid
category: data-engineering
tags: [Apache-Flink, CEP, 실시간분석, 패턴매칭, 윈도우함수, 실시간대시보드, Python, PyFlink]
series: apache-flink-complete-guide
series_order: 3
reading_time: "45분"
difficulty: "고급"
---

# Part 3: Apache Flink 실시간 분석과 CEP - 복잡한 이벤트 처리의 완성

> Apache Flink의 CEP (Complex Event Processing), 실시간 집계, 윈도우 함수, 패턴 매칭을 학습하고 실시간 대시보드와 알림 시스템을 구축합니다.

## 📋 목차

1. [CEP (Complex Event Processing) 기초](#cep-complex-event-processing-기초)
2. [고급 패턴 매칭](#고급-패턴-매칭)
3. [실시간 집계와 윈도우 함수](#실시간-집계와-윈도우-함수)
4. [실시간 대시보드 구축](#실시간-대시보드-구축)
5. [실무 프로젝트: 실시간 금융 모니터링 시스템](#실무-프로젝트-실시간-금융-모니터링-시스템)
6. [학습 요약](#학습-요약)

## 🎯 CEP (Complex Event Processing) 기초

### CEP란 무엇인가?

CEP는 **복잡한 이벤트 처리**를 의미하며, 실시간으로 들어오는 여러 이벤트들을 분석하여 의미 있는 패턴이나 상황을 감지하는 기술입니다.

#### **CEP의 핵심 개념**

1. **이벤트 스트림**: 연속적으로 들어오는 데이터
2. **패턴 매칭**: 특정 조건을 만족하는 이벤트 시퀀스
3. **시간 윈도우**: 이벤트 분석 시간 범위
4. **상태 관리**: 패턴 매칭을 위한 상태 저장

### Flink CEP 기본 구조

```python
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.datastream.cep import CEP, Pattern, PatternStream
from pyflink.datastream.functions import KeyedProcessFunction
from pyflink.common.typeinfo import Types
from pyflink.common.time import Time

class CEPBasics:
    def __init__(self, env):
        self.env = env
    
    def setup_basic_cep_pattern(self, data_stream):
        """기본 CEP 패턴 설정"""
        # 1. 패턴 정의
        pattern = Pattern.begin("start") \
            .where(lambda value: value.action == "login") \
            .followed_by("middle") \
            .where(lambda value: value.action == "view") \
            .followed_by("end") \
            .where(lambda value: value.action == "purchase") \
            .within(Time.minutes(10))  # 10분 내 패턴 매칭
        
        # 2. 패턴 스트림 생성
        pattern_stream = CEP.pattern(
            data_stream.key_by(lambda event: event.user_id),
            pattern
        )
        
        # 3. 패턴 매칭 결과 처리
        result_stream = pattern_stream.select(
            lambda pattern: self.process_pattern(pattern)
        )
        
        return result_stream
    
    def process_pattern(self, pattern):
        """패턴 매칭 결과 처리"""
        start_event = pattern["start"][0]
        middle_event = pattern["middle"][0]
        end_event = pattern["end"][0]
        
        return {
            "user_id": start_event.user_id,
            "pattern_type": "login_to_purchase",
            "duration": end_event.timestamp - start_event.timestamp,
            "timestamp": end_event.timestamp
        }
```

### 고급 패턴 정의

```python
class AdvancedPatternDefinitions:
    def __init__(self):
        pass
    
    def create_sequence_pattern(self):
        """순차 패턴 정의"""
        pattern = Pattern.begin("first") \
            .where(lambda e: e.action == "login") \
            .followed_by("second") \
            .where(lambda e: e.action == "browse") \
            .followed_by("third") \
            .where(lambda e: e.action == "add_to_cart") \
            .followed_by("fourth") \
            .where(lambda e: e.action == "checkout") \
            .within(Time.hours(1))
        
        return pattern
    
    def create_or_pattern(self):
        """OR 패턴 정의"""
        pattern = Pattern.begin("start") \
            .where(lambda e: e.action == "login") \
            .followed_by("action") \
            .where(lambda e: e.action == "view" or e.action == "click") \
            .followed_by("end") \
            .where(lambda e: e.action == "purchase") \
            .within(Time.minutes(30))
        
        return pattern
    
    def create_not_pattern(self):
        """NOT 패턴 정의 (특정 이벤트가 없어야 함)"""
        pattern = Pattern.begin("start") \
            .where(lambda e: e.action == "login") \
            .followed_by("middle") \
            .where(lambda e: e.action == "view") \
            .not_followed_by("blocked") \
            .where(lambda e: e.action == "logout") \
            .followed_by("end") \
            .where(lambda e: e.action == "purchase") \
            .within(Time.minutes(15))
        
        return pattern
    
    def create_times_pattern(self):
        """반복 패턴 정의"""
        pattern = Pattern.begin("repeated") \
            .where(lambda e: e.action == "click") \
            .times(3)  # 정확히 3번 반복
            .followed_by("end") \
            .where(lambda e: e.action == "purchase") \
            .within(Time.minutes(5))
        
        return pattern
    
    def create_greedy_pattern(self):
        """탐욕적 매칭 패턴"""
        pattern = Pattern.begin("greedy") \
            .where(lambda e: e.action == "view") \
            .one_or_more() \
            .greedy()  # 가능한 한 많이 매칭
            .followed_by("end") \
            .where(lambda e: e.action == "purchase") \
            .within(Time.minutes(10))
        
        return pattern
```

## 🔍 고급 패턴 매칭

### 조건부 패턴 매칭

```python
from pyflink.datastream.cep import IterativeCondition, SimpleCondition

class ConditionalPatternMatching:
    def __init__(self):
        pass
    
    def create_conditional_pattern(self):
        """조건부 패턴 정의"""
        # 복잡한 조건이 있는 패턴
        pattern = Pattern.begin("start") \
            .where(self.UserLoginCondition()) \
            .followed_by("middle") \
            .where(self.PriceRangeCondition(100, 1000)) \
            .followed_by("end") \
            .where(self.PurchaseCondition()) \
            .within(Time.minutes(20))
        
        return pattern
    
    class UserLoginCondition(SimpleCondition):
        """사용자 로그인 조건"""
        def filter(self, value):
            return value.action == "login" and value.user_id.startswith("premium_")
    
    class PriceRangeCondition(SimpleCondition):
        """가격 범위 조건"""
        def __init__(self, min_price, max_price):
            self.min_price = min_price
            self.max_price = max_price
        
        def filter(self, value):
            price = value.metadata.get("price", 0)
            return self.min_price <= price <= self.max_price
    
    class PurchaseCondition(SimpleCondition):
        """구매 조건"""
        def filter(self, value):
            return value.action == "purchase" and value.metadata.get("amount", 0) > 0
```

### 동적 패턴 매칭

```python
class DynamicPatternMatching:
    def __init__(self):
        self.pattern_cache = {}
    
    def create_dynamic_pattern(self, user_id, pattern_type):
        """동적 패턴 생성"""
        cache_key = f"{user_id}_{pattern_type}"
        
        if cache_key not in self.pattern_cache:
            if pattern_type == "high_value":
                pattern = self.create_high_value_pattern()
            elif pattern_type == "frequent":
                pattern = self.create_frequent_pattern()
            else:
                pattern = self.create_default_pattern()
            
            self.pattern_cache[cache_key] = pattern
        
        return self.pattern_cache[cache_key]
    
    def create_high_value_pattern(self):
        """고가치 구매 패턴"""
        return Pattern.begin("login") \
            .where(lambda e: e.action == "login") \
            .followed_by("browse") \
            .where(lambda e: e.action == "view") \
            .followed_by("purchase") \
            .where(lambda e: e.action == "purchase" and 
                          e.metadata.get("amount", 0) > 1000) \
            .within(Time.minutes(30))
    
    def create_frequent_pattern(self):
        """빈번한 구매 패턴"""
        return Pattern.begin("first_purchase") \
            .where(lambda e: e.action == "purchase") \
            .followed_by("second_purchase") \
            .where(lambda e: e.action == "purchase") \
            .followed_by("third_purchase") \
            .where(lambda e: e.action == "purchase") \
            .within(Time.hours(2))
    
    def create_default_pattern(self):
        """기본 패턴"""
        return Pattern.begin("login") \
            .where(lambda e: e.action == "login") \
            .followed_by("action") \
            .where(lambda e: e.action in ["view", "click"]) \
            .followed_by("purchase") \
            .where(lambda e: e.action == "purchase") \
            .within(Time.minutes(60))
```

### 패턴 결과 후처리

```python
class PatternPostProcessing:
    def __init__(self):
        pass
    
    def process_pattern_result(self, pattern):
        """패턴 결과 후처리"""
        # 패턴에서 이벤트 추출
        events = self.extract_events(pattern)
        
        # 비즈니스 로직 적용
        result = self.apply_business_logic(events)
        
        # 알림 생성
        alert = self.generate_alert(result)
        
        return {
            "pattern_result": result,
            "alert": alert,
            "timestamp": int(time.time())
        }
    
    def extract_events(self, pattern):
        """패턴에서 이벤트 추출"""
        events = {}
        for name, event_list in pattern.items():
            if event_list:
                events[name] = event_list[0]  # 첫 번째 이벤트
        return events
    
    def apply_business_logic(self, events):
        """비즈니스 로직 적용"""
        # 사용자 세션 분석
        session_duration = self.calculate_session_duration(events)
        
        # 구매 행동 분석
        purchase_behavior = self.analyze_purchase_behavior(events)
        
        # 위험도 평가
        risk_score = self.calculate_risk_score(events)
        
        return {
            "session_duration": session_duration,
            "purchase_behavior": purchase_behavior,
            "risk_score": risk_score
        }
    
    def generate_alert(self, result):
        """알림 생성"""
        alerts = []
        
        # 위험도 기반 알림
        if result["risk_score"] > 0.8:
            alerts.append({
                "type": "high_risk",
                "message": "High risk transaction detected",
                "severity": "critical"
            })
        
        # 구매 패턴 기반 알림
        if result["purchase_behavior"]["is_abnormal"]:
            alerts.append({
                "type": "abnormal_purchase",
                "message": "Abnormal purchase pattern detected",
                "severity": "warning"
            })
        
        return alerts
    
    def calculate_session_duration(self, events):
        """세션 지속 시간 계산"""
        if "login" in events and "purchase" in events:
            return events["purchase"].timestamp - events["login"].timestamp
        return 0
    
    def analyze_purchase_behavior(self, events):
        """구매 행동 분석"""
        if "purchase" in events:
            purchase = events["purchase"]
            amount = purchase.metadata.get("amount", 0)
            
            # 정상적인 구매 패턴인지 확인
            is_abnormal = amount > 5000 or amount < 10  # 예시 조건
            
            return {
                "amount": amount,
                "is_abnormal": is_abnormal,
                "category": purchase.metadata.get("category", "unknown")
            }
        
        return {"is_abnormal": False}
    
    def calculate_risk_score(self, events):
        """위험도 점수 계산"""
        risk_factors = []
        
        # 빠른 구매 (로그인 후 5분 이내)
        if self.is_quick_purchase(events):
            risk_factors.append(0.3)
        
        # 높은 금액
        if self.is_high_amount(events):
            risk_factors.append(0.4)
        
        # 비정상적인 시간대
        if self.is_unusual_time(events):
            risk_factors.append(0.2)
        
        return sum(risk_factors)
    
    def is_quick_purchase(self, events):
        """빠른 구매 여부 확인"""
        if "login" in events and "purchase" in events:
            duration = events["purchase"].timestamp - events["login"].timestamp
            return duration < 300  # 5분 이내
        return False
    
    def is_high_amount(self, events):
        """높은 금액 여부 확인"""
        if "purchase" in events:
            amount = events["purchase"].metadata.get("amount", 0)
            return amount > 2000
        return False
    
    def is_unusual_time(self, events):
        """비정상적인 시간대 여부 확인"""
        if "purchase" in events:
            purchase_time = datetime.fromtimestamp(events["purchase"].timestamp)
            hour = purchase_time.hour
            return hour < 6 or hour > 23  # 새벽 시간대
        return False
```

## 📊 실시간 집계와 윈도우 함수

### 고급 윈도우 연산

```python
from pyflink.datastream.window import TumblingEventTimeWindows, SlidingEventTimeWindows, SessionEventTimeWindows
from pyflink.datastream.functions import WindowFunction, AllWindowFunction

class AdvancedWindowOperations:
    def __init__(self):
        pass
    
    def setup_advanced_windows(self, data_stream):
        """고급 윈도우 설정"""
        # 1. 튬블링 윈도우 (고정 크기)
        tumbling_window = data_stream.key_by(lambda x: x.user_id) \
            .window(TumblingEventTimeWindows.of(Time.minutes(5))) \
            .apply(self.AdvancedWindowFunction(), output_type=Types.PICKLED_BYTE_ARRAY())
        
        # 2. 슬라이딩 윈도우 (겹치는 윈도우)
        sliding_window = data_stream.key_by(lambda x: x.user_id) \
            .window(SlidingEventTimeWindows.of(Time.minutes(10), Time.minutes(2))) \
            .apply(self.AdvancedWindowFunction(), output_type=Types.PICKLED_BYTE_ARRAY())
        
        # 3. 세션 윈도우 (활동 기반)
        session_window = data_stream.key_by(lambda x: x.user_id) \
            .window(SessionEventTimeWindows.with_gap(Time.minutes(5))) \
            .apply(self.AdvancedWindowFunction(), output_type=Types.PICKLED_BYTE_ARRAY())
        
        return {
            "tumbling": tumbling_window,
            "sliding": sliding_window,
            "session": session_window
        }
    
    class AdvancedWindowFunction(WindowFunction):
        """고급 윈도우 함수"""
        def apply(self, key, window, inputs, out):
            # 윈도우 내 데이터 분석
            analysis_result = self.analyze_window_data(inputs)
            
            # 결과 생성
            result = {
                "user_id": key,
                "window_start": window.start,
                "window_end": window.end,
                "event_count": len(inputs),
                "analysis": analysis_result,
                "timestamp": window.end
            }
            
            out.collect(result)
        
        def analyze_window_data(self, inputs):
            """윈도우 내 데이터 분석"""
            if not inputs:
                return {"error": "No data in window"}
            
            # 기본 통계
            actions = [event.action for event in inputs]
            action_counts = {}
            for action in actions:
                action_counts[action] = action_counts.get(action, 0) + 1
            
            # 시간 분석
            timestamps = [event.timestamp for event in inputs]
            duration = max(timestamps) - min(timestamps)
            
            # 금액 분석 (구매 이벤트가 있는 경우)
            amounts = [event.metadata.get("amount", 0) for event in inputs 
                      if event.action == "purchase"]
            total_amount = sum(amounts)
            avg_amount = total_amount / len(amounts) if amounts else 0
            
            return {
                "action_distribution": action_counts,
                "session_duration": duration,
                "total_purchase_amount": total_amount,
                "average_purchase_amount": avg_amount,
                "purchase_count": len(amounts)
            }
```

### 실시간 집계 엔진

```python
class RealTimeAggregationEngine:
    def __init__(self):
        self.aggregation_state = {}
    
    def setup_real_time_aggregations(self, data_stream):
        """실시간 집계 설정"""
        # 1. 사용자별 실시간 집계
        user_aggregations = data_stream.key_by(lambda x: x.user_id) \
            .window(TumblingEventTimeWindows.of(Time.minutes(1))) \
            .aggregate(
                self.UserAggregateFunction(),
                self.UserWindowFunction(),
                output_type=Types.PICKLED_BYTE_ARRAY()
            )
        
        # 2. 글로벌 실시간 집계
        global_aggregations = data_stream.window_all(
            TumblingEventTimeWindows.of(Time.minutes(1))
        ).aggregate(
            self.GlobalAggregateFunction(),
            self.GlobalWindowFunction(),
            output_type=Types.PICKLED_BYTE_ARRAY()
        )
        
        return {
            "user_aggregations": user_aggregations,
            "global_aggregations": global_aggregations
        }
    
    class UserAggregateFunction:
        """사용자 집계 함수"""
        def create_accumulator(self):
            return {
                "event_count": 0,
                "total_amount": 0.0,
                "action_counts": {},
                "first_timestamp": None,
                "last_timestamp": None
            }
        
        def add(self, accumulator, value):
            accumulator["event_count"] += 1
            
            if value.action == "purchase":
                amount = value.metadata.get("amount", 0)
                accumulator["total_amount"] += amount
            
            accumulator["action_counts"][value.action] = \
                accumulator["action_counts"].get(value.action, 0) + 1
            
            if accumulator["first_timestamp"] is None:
                accumulator["first_timestamp"] = value.timestamp
            
            accumulator["last_timestamp"] = value.timestamp
            
            return accumulator
        
        def get_result(self, accumulator):
            return accumulator
    
    class UserWindowFunction(WindowFunction):
        """사용자 윈도우 함수"""
        def apply(self, key, window, input, out):
            result = input[0] if input else self.create_empty_result()
            
            # 윈도우 메타데이터 추가
            result.update({
                "user_id": key,
                "window_start": window.start,
                "window_end": window.end,
                "window_duration": window.end - window.start
            })
            
            # 파생 지표 계산
            result["events_per_minute"] = result["event_count"] / max(
                (result["last_timestamp"] - result["first_timestamp"]) / 60, 1
            )
            
            result["average_purchase_amount"] = (
                result["total_amount"] / result["action_counts"].get("purchase", 1)
                if result["action_counts"].get("purchase", 0) > 0 else 0
            )
            
            out.collect(result)
        
        def create_empty_result(self):
            return {
                "event_count": 0,
                "total_amount": 0.0,
                "action_counts": {},
                "first_timestamp": None,
                "last_timestamp": None,
                "events_per_minute": 0.0,
                "average_purchase_amount": 0.0
            }
    
    class GlobalAggregateFunction:
        """글로벌 집계 함수"""
        def create_accumulator(self):
            return {
                "total_events": 0,
                "unique_users": set(),
                "total_revenue": 0.0,
                "action_distribution": {},
                "timestamp_range": [None, None]
            }
        
        def add(self, accumulator, value):
            accumulator["total_events"] += 1
            accumulator["unique_users"].add(value.user_id)
            
            if value.action == "purchase":
                amount = value.metadata.get("amount", 0)
                accumulator["total_revenue"] += amount
            
            accumulator["action_distribution"][value.action] = \
                accumulator["action_distribution"].get(value.action, 0) + 1
            
            if accumulator["timestamp_range"][0] is None:
                accumulator["timestamp_range"][0] = value.timestamp
            
            accumulator["timestamp_range"][1] = value.timestamp
            
            return accumulator
        
        def get_result(self, accumulator):
            # set을 list로 변환 (직렬화 가능하도록)
            accumulator["unique_users"] = list(accumulator["unique_users"])
            return accumulator
    
    class GlobalWindowFunction(AllWindowFunction):
        """글로벌 윈도우 함수"""
        def apply(self, window, input, out):
            result = input[0] if input else self.create_empty_global_result()
            
            # 윈도우 메타데이터 추가
            result.update({
                "window_start": window.start,
                "window_end": window.end,
                "window_duration": window.end - window.start
            })
            
            # 파생 지표 계산
            result["events_per_second"] = result["total_events"] / max(
                result["window_duration"] / 1000, 1
            )
            
            result["revenue_per_user"] = (
                result["total_revenue"] / len(result["unique_users"])
                if result["unique_users"] else 0
            )
            
            result["conversion_rate"] = (
                result["action_distribution"].get("purchase", 0) / 
                result["total_events"] if result["total_events"] > 0 else 0
            )
            
            out.collect(result)
        
        def create_empty_global_result(self):
            return {
                "total_events": 0,
                "unique_users": [],
                "total_revenue": 0.0,
                "action_distribution": {},
                "timestamp_range": [None, None],
                "events_per_second": 0.0,
                "revenue_per_user": 0.0,
                "conversion_rate": 0.0
            }
```

## 📈 실시간 대시보드 구축

### Grafana 연동 대시보드

```python
import requests
import json
from datetime import datetime

class GrafanaDashboardManager:
    def __init__(self, grafana_url, api_key):
        self.grafana_url = grafana_url
        self.api_key = api_key
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def create_real_time_dashboard(self, dashboard_config):
        """실시간 대시보드 생성"""
        dashboard = {
            "dashboard": {
                "title": dashboard_config["title"],
                "panels": self.create_panels(dashboard_config["metrics"]),
                "time": {
                    "from": "now-1h",
                    "to": "now"
                },
                "refresh": "5s",
                "timezone": "browser"
            },
            "overwrite": True
        }
        
        response = requests.post(
            f"{self.grafana_url}/api/dashboards/db",
            headers=self.headers,
            json=dashboard
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to create dashboard: {response.text}")
    
    def create_panels(self, metrics_config):
        """패널 생성"""
        panels = []
        
        for i, metric in enumerate(metrics_config):
            panel = {
                "id": i + 1,
                "title": metric["title"],
                "type": metric["type"],
                "targets": [
                    {
                        "expr": metric["query"],
                        "refId": "A"
                    }
                ],
                "gridPos": {
                    "h": 8,
                    "w": 12,
                    "x": (i % 2) * 12,
                    "y": (i // 2) * 8
                },
                "yAxes": [
                    {
                        "label": metric.get("y_axis_label", ""),
                        "min": 0
                    }
                ]
            }
            
            # 패널 타입별 특별 설정
            if metric["type"] == "stat":
                panel["fieldConfig"] = {
                    "defaults": {
                        "color": {"mode": "thresholds"},
                        "thresholds": {
                            "steps": [
                                {"color": "green", "value": None},
                                {"color": "yellow", "value": metric.get("warning_threshold", 100)},
                                {"color": "red", "value": metric.get("critical_threshold", 200)}
                            ]
                        }
                    }
                }
            elif metric["type"] == "table":
                panel["targets"][0]["format"] = "table"
            
            panels.append(panel)
        
        return panels
    
    def setup_flink_metrics_dashboard(self):
        """Flink 메트릭 대시보드 설정"""
        metrics_config = [
            {
                "title": "Total Events per Second",
                "type": "stat",
                "query": "flink_taskmanager_job_task_operator_numRecordsInPerSecond",
                "y_axis_label": "Events/sec",
                "warning_threshold": 1000,
                "critical_threshold": 5000
            },
            {
                "title": "Average Latency",
                "type": "stat",
                "query": "flink_taskmanager_job_task_operator_latency",
                "y_axis_label": "ms",
                "warning_threshold": 100,
                "critical_threshold": 500
            },
            {
                "title": "Backpressure",
                "type": "stat",
                "query": "flink_taskmanager_job_task_backPressuredTimeMsPerSecond",
                "y_axis_label": "ms/sec",
                "warning_threshold": 100,
                "critical_threshold": 500
            },
            {
                "title": "Checkpoint Duration",
                "type": "stat",
                "query": "flink_jobmanager_job_lastCheckpointDuration",
                "y_axis_label": "ms",
                "warning_threshold": 10000,
                "critical_threshold": 30000
            },
            {
                "title": "Memory Usage",
                "type": "stat",
                "query": "flink_taskmanager_Status_JVM_Memory_Heap_Used",
                "y_axis_label": "bytes",
                "warning_threshold": 1073741824,  # 1GB
                "critical_threshold": 2147483648   # 2GB
            },
            {
                "title": "Event Timeline",
                "type": "timeseries",
                "query": "flink_taskmanager_job_task_operator_numRecordsInPerSecond",
                "y_axis_label": "Events/sec"
            }
        ]
        
        return self.create_real_time_dashboard({
            "title": "Apache Flink Real-time Metrics",
            "metrics": metrics_config
        })
    
    def create_business_metrics_dashboard(self):
        """비즈니스 메트릭 대시보드 설정"""
        metrics_config = [
            {
                "title": "Total Revenue",
                "type": "stat",
                "query": "sum(purchase_amount)",
                "y_axis_label": "$",
                "warning_threshold": 10000,
                "critical_threshold": 50000
            },
            {
                "title": "Conversion Rate",
                "type": "stat",
                "query": "purchase_events / total_events * 100",
                "y_axis_label": "%",
                "warning_threshold": 2.0,
                "critical_threshold": 5.0
            },
            {
                "title": "Active Users",
                "type": "stat",
                "query": "count(distinct user_id)",
                "y_axis_label": "Users",
                "warning_threshold": 100,
                "critical_threshold": 500
            },
            {
                "title": "Average Session Duration",
                "type": "stat",
                "query": "avg(session_duration)",
                "y_axis_label": "seconds",
                "warning_threshold": 300,
                "critical_threshold": 600
            },
            {
                "title": "Revenue Trend",
                "type": "timeseries",
                "query": "sum(purchase_amount)",
                "y_axis_label": "$"
            },
            {
                "title": "Top Categories",
                "type": "table",
                "query": "topk(10, sum(purchase_amount) by category)",
                "y_axis_label": "Revenue"
            }
        ]
        
        return self.create_real_time_dashboard({
            "title": "Business Metrics Dashboard",
            "metrics": metrics_config
        })
```

### 실시간 알림 시스템

```python
class RealTimeAlertingSystem:
    def __init__(self):
        self.alert_rules = {}
        self.alert_history = []
    
    def setup_alert_rules(self):
        """알림 규칙 설정"""
        self.alert_rules = {
            "high_latency": {
                "condition": lambda metrics: metrics.get("latency", 0) > 500,
                "severity": "critical",
                "message": "High latency detected: {latency}ms",
                "notification_channels": ["email", "slack"]
            },
            "low_throughput": {
                "condition": lambda metrics: metrics.get("throughput", 0) < 100,
                "severity": "warning",
                "message": "Low throughput detected: {throughput} events/sec",
                "notification_channels": ["slack"]
            },
            "high_error_rate": {
                "condition": lambda metrics: metrics.get("error_rate", 0) > 0.05,
                "severity": "critical",
                "message": "High error rate detected: {error_rate}%",
                "notification_channels": ["email", "slack", "pagerduty"]
            },
            "memory_usage_high": {
                "condition": lambda metrics: metrics.get("memory_usage", 0) > 0.8,
                "severity": "warning",
                "message": "High memory usage: {memory_usage}%",
                "notification_channels": ["slack"]
            },
            "checkpoint_failure": {
                "condition": lambda metrics: metrics.get("checkpoint_failures", 0) > 0,
                "severity": "critical",
                "message": "Checkpoint failures detected: {checkpoint_failures}",
                "notification_channels": ["email", "pagerduty"]
            }
        }
    
    def evaluate_alerts(self, metrics):
        """알림 평가"""
        active_alerts = []
        
        for rule_name, rule in self.alert_rules.items():
            if rule["condition"](metrics):
                alert = {
                    "rule_name": rule_name,
                    "severity": rule["severity"],
                    "message": rule["message"].format(**metrics),
                    "timestamp": datetime.now().isoformat(),
                    "metrics": metrics,
                    "notification_channels": rule["notification_channels"]
                }
                
                # 중복 알림 방지 (5분 내 동일한 알림 제한)
                if not self.is_duplicate_alert(alert):
                    active_alerts.append(alert)
                    self.send_notifications(alert)
                    self.alert_history.append(alert)
        
        return active_alerts
    
    def is_duplicate_alert(self, alert):
        """중복 알림 확인"""
        recent_time = datetime.now().timestamp() - 300  # 5분 전
        
        for historical_alert in reversed(self.alert_history):
            if historical_alert["timestamp"] < recent_time:
                break
            
            if (historical_alert["rule_name"] == alert["rule_name"] and
                historical_alert["severity"] == alert["severity"]):
                return True
        
        return False
    
    def send_notifications(self, alert):
        """알림 전송"""
        for channel in alert["notification_channels"]:
            if channel == "email":
                self.send_email_alert(alert)
            elif channel == "slack":
                self.send_slack_alert(alert)
            elif channel == "pagerduty":
                self.send_pagerduty_alert(alert)
    
    def send_email_alert(self, alert):
        """이메일 알림 전송"""
        # 실제 구현에서는 SMTP 또는 이메일 서비스 API 사용
        print(f"EMAIL ALERT [{alert['severity'].upper()}]: {alert['message']}")
    
    def send_slack_alert(self, alert):
        """Slack 알림 전송"""
        # 실제 구현에서는 Slack Webhook API 사용
        color = "danger" if alert["severity"] == "critical" else "warning"
        message = {
            "attachments": [
                {
                    "color": color,
                    "title": f"Flink Alert: {alert['rule_name']}",
                    "text": alert["message"],
                    "fields": [
                        {"title": "Severity", "value": alert["severity"], "short": True},
                        {"title": "Timestamp", "value": alert["timestamp"], "short": True}
                    ]
                }
            ]
        }
        print(f"SLACK ALERT: {message}")
    
    def send_pagerduty_alert(self, alert):
        """PagerDuty 알림 전송"""
        # 실제 구현에서는 PagerDuty API 사용
        print(f"PAGERDUTY ALERT [{alert['severity'].upper()}]: {alert['message']}")
```

## 🚀 실무 프로젝트: 실시간 금융 모니터링 시스템

### 프로젝트 개요

금융 거래 데이터를 실시간으로 분석하여 이상 거래 패턴을 감지하고, 리스크를 평가하는 시스템을 구축합니다.

### 1. 금융 데이터 모델

```python
from dataclasses import dataclass
from typing import Dict, Optional
from enum import Enum
import json

class TransactionType(Enum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    TRANSFER = "transfer"
    PAYMENT = "payment"
    INVESTMENT = "investment"

class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class FinancialTransaction:
    transaction_id: str
    user_id: str
    account_id: str
    transaction_type: TransactionType
    amount: float
    currency: str
    timestamp: int
    merchant_id: Optional[str]
    location: Dict[str, float]  # latitude, longitude
    metadata: Dict
    
    def to_json(self):
        return json.dumps({
            'transaction_id': self.transaction_id,
            'user_id': self.user_id,
            'account_id': self.account_id,
            'transaction_type': self.transaction_type.value,
            'amount': self.amount,
            'currency': self.currency,
            'timestamp': self.timestamp,
            'merchant_id': self.merchant_id,
            'location': self.location,
            'metadata': self.metadata
        })
    
    @classmethod
    def from_json(cls, json_str):
        data = json.loads(json_str)
        data['transaction_type'] = TransactionType(data['transaction_type'])
        return cls(**data)

@dataclass
class RiskAssessment:
    transaction_id: str
    risk_level: RiskLevel
    risk_score: float
    risk_factors: list
    timestamp: int
    recommendation: str
    
    def to_json(self):
        return json.dumps({
            'transaction_id': self.transaction_id,
            'risk_level': self.risk_level.value,
            'risk_score': self.risk_score,
            'risk_factors': self.risk_factors,
            'timestamp': self.timestamp,
            'recommendation': self.recommendation
        })
```

### 2. 실시간 이상 거래 감지

```python
from pyflink.datastream.functions import KeyedProcessFunction
from pyflink.common.state import ValueStateDescriptor, MapStateDescriptor, ListStateDescriptor
from pyflink.common.typeinfo import Types
import math

class FraudDetectionEngine(KeyedProcessFunction):
    def __init__(self):
        self.user_transaction_history = None
        self.user_behavior_profile = None
        self.location_history = None
        self.velocity_checker = None
    
    def open(self, runtime_context):
        # 사용자 거래 히스토리
        self.user_transaction_history = runtime_context.get_list_state(
            ListStateDescriptor("transaction_history", Types.STRING())
        )
        
        # 사용자 행동 프로파일
        self.user_behavior_profile = runtime_context.get_state(
            ValueStateDescriptor("behavior_profile", Types.STRING())
        )
        
        # 위치 히스토리
        self.location_history = runtime_context.get_list_state(
            ListStateDescriptor("location_history", Types.STRING())
        )
        
        # 속도 검사기
        self.velocity_checker = runtime_context.get_map_state(
            MapStateDescriptor("velocity_checker", Types.STRING(), Types.INT())
        )
    
    def process_element(self, transaction, ctx):
        """실시간 이상 거래 감지"""
        user_id = transaction.user_id
        
        # 1. 속도 검사 (Velocity Check)
        velocity_risk = self.check_velocity(transaction)
        
        # 2. 위치 기반 검사 (Location-based Check)
        location_risk = self.check_location_anomaly(transaction)
        
        # 3. 금액 기반 검사 (Amount-based Check)
        amount_risk = self.check_amount_anomaly(transaction)
        
        # 4. 패턴 기반 검사 (Pattern-based Check)
        pattern_risk = self.check_pattern_anomaly(transaction)
        
        # 5. 시간 기반 검사 (Time-based Check)
        time_risk = self.check_time_anomaly(transaction)
        
        # 종합 위험도 계산
        risk_score = self.calculate_comprehensive_risk_score([
            velocity_risk, location_risk, amount_risk, pattern_risk, time_risk
        ])
        
        # 위험도 레벨 결정
        risk_level = self.determine_risk_level(risk_score)
        
        # 위험 평가 결과 생성
        risk_assessment = RiskAssessment(
            transaction_id=transaction.transaction_id,
            risk_level=risk_level,
            risk_score=risk_score,
            risk_factors=self.collect_risk_factors([
                velocity_risk, location_risk, amount_risk, pattern_risk, time_risk
            ]),
            timestamp=transaction.timestamp,
            recommendation=self.generate_recommendation(risk_level, risk_score)
        )
        
        # 상태 업데이트
        self.update_user_state(transaction)
        
        # 결과 출력
        ctx.collect(risk_assessment)
        
        # 높은 위험도인 경우 즉시 알림
        if risk_level in [RiskLevel.HIGH, RiskLevel.CRITICAL]:
            self.send_immediate_alert(risk_assessment, transaction)
    
    def check_velocity(self, transaction):
        """속도 검사 (단시간 내 다수 거래)"""
        current_time = transaction.timestamp
        transaction_type = transaction.transaction_type.value
        
        # 시간 윈도우별 거래 횟수 확인
        time_windows = [300, 900, 3600]  # 5분, 15분, 1시간
        velocity_risks = []
        
        for window in time_windows:
            window_key = f"{transaction_type}_{window}"
            recent_count = self.velocity_checker.get(window_key) or 0
            
            # 윈도우별 임계값 설정
            thresholds = {
                "withdrawal": [5, 10, 20],
                "transfer": [10, 20, 50],
                "payment": [20, 50, 100]
            }
            
            threshold = thresholds.get(transaction_type, [10, 20, 50])[time_windows.index(window)]
            
            if recent_count >= threshold:
                velocity_risks.append({
                    "type": "high_velocity",
                    "window": window,
                    "count": recent_count,
                    "threshold": threshold,
                    "risk_score": min((recent_count / threshold) * 0.5, 1.0)
                })
            
            # 카운터 업데이트 (실제로는 시간 기반 정리 필요)
            self.velocity_checker.put(window_key, recent_count + 1)
        
        return velocity_risks
    
    def check_location_anomaly(self, transaction):
        """위치 기반 이상 검사"""
        location_risks = []
        
        # 새로운 위치인지 확인
        transaction_location = transaction.location
        location_history = list(self.location_history.get())
        
        if not location_history:
            # 첫 거래인 경우
            self.location_history.add(json.dumps(transaction_location))
            return []
        
        # 거리 계산
        distances = []
        for historical_location_str in location_history:
            historical_location = json.loads(historical_location_str)
            distance = self.calculate_distance(transaction_location, historical_location)
            distances.append(distance)
        
        min_distance = min(distances) if distances else float('inf')
        
        # 이상적인 위치 판정
        if min_distance > 100:  # 100km 이상
            location_risks.append({
                "type": "unusual_location",
                "distance_from_last": min_distance,
                "risk_score": min(min_distance / 1000, 1.0)
            })
        
        # 위치 히스토리 업데이트
        self.location_history.add(json.dumps(transaction_location))
        
        return location_risks
    
    def check_amount_anomaly(self, transaction):
        """금액 기반 이상 검사"""
        amount_risks = []
        
        # 사용자 평균 거래 금액과 비교
        user_profile = self.get_user_behavior_profile()
        
        if user_profile and "average_amount" in user_profile:
            avg_amount = user_profile["average_amount"]
            std_amount = user_profile.get("std_amount", avg_amount * 0.5)
            
            # Z-score 계산
            z_score = abs(transaction.amount - avg_amount) / std_amount
            
            if z_score > 3:  # 3시그마 이상
                amount_risks.append({
                    "type": "unusual_amount",
                    "amount": transaction.amount,
                    "average_amount": avg_amount,
                    "z_score": z_score,
                    "risk_score": min(z_score / 5, 1.0)
                })
        
        return amount_risks
    
    def check_pattern_anomaly(self, transaction):
        """패턴 기반 이상 검사"""
        pattern_risks = []
        
        # 거래 시간 패턴 확인
        transaction_time = datetime.fromtimestamp(transaction.timestamp)
        hour = transaction_time.hour
        
        user_profile = self.get_user_behavior_profile()
        
        if user_profile and "typical_hours" in user_profile:
            typical_hours = user_profile["typical_hours"]
            
            if hour not in typical_hours:
                pattern_risks.append({
                    "type": "unusual_time",
                    "hour": hour,
                    "typical_hours": typical_hours,
                    "risk_score": 0.3
                })
        
        # 거래 유형 패턴 확인
        if user_profile and "transaction_types" in user_profile:
            typical_types = user_profile["transaction_types"]
            
            if transaction.transaction_type.value not in typical_types:
                pattern_risks.append({
                    "type": "unusual_transaction_type",
                    "transaction_type": transaction.transaction_type.value,
                    "typical_types": typical_types,
                    "risk_score": 0.4
                })
        
        return pattern_risks
    
    def check_time_anomaly(self, transaction):
        """시간 기반 이상 검사"""
        time_risks = []
        
        transaction_time = datetime.fromtimestamp(transaction.timestamp)
        
        # 새벽 시간대 거래 (2AM - 6AM)
        if 2 <= transaction_time.hour <= 6:
            time_risks.append({
                "type": "late_night_transaction",
                "hour": transaction_time.hour,
                "risk_score": 0.2
            })
        
        # 주말 거래 패턴 확인
        if transaction_time.weekday() >= 5:  # 토요일, 일요일
            user_profile = self.get_user_behavior_profile()
            
            if user_profile and not user_profile.get("weekend_activity", False):
                time_risks.append({
                    "type": "weekend_unusual_activity",
                    "weekday": transaction_time.weekday(),
                    "risk_score": 0.3
                })
        
        return time_risks
    
    def calculate_comprehensive_risk_score(self, risk_factors):
        """종합 위험도 점수 계산"""
        if not risk_factors:
            return 0.0
        
        # 각 위험 요소의 최대 점수 사용
        max_risks = []
        for risk_list in risk_factors:
            if risk_list:
                max_risk_score = max([risk["risk_score"] for risk in risk_list])
                max_risks.append(max_risk_score)
        
        # 가중 평균 계산
        if max_risks:
            return sum(max_risks) / len(max_risks)
        
        return 0.0
    
    def determine_risk_level(self, risk_score):
        """위험도 레벨 결정"""
        if risk_score >= 0.8:
            return RiskLevel.CRITICAL
        elif risk_score >= 0.6:
            return RiskLevel.HIGH
        elif risk_score >= 0.3:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW
    
    def collect_risk_factors(self, risk_factors):
        """위험 요소 수집"""
        all_factors = []
        for risk_list in risk_factors:
            all_factors.extend(risk_list)
        return all_factors
    
    def generate_recommendation(self, risk_level, risk_score):
        """권장사항 생성"""
        if risk_level == RiskLevel.CRITICAL:
            return "Immediate transaction blocking recommended"
        elif risk_level == RiskLevel.HIGH:
            return "Additional verification required"
        elif risk_level == RiskLevel.MEDIUM:
            return "Monitor closely, consider manual review"
        else:
            return "Low risk, normal processing"
    
    def update_user_state(self, transaction):
        """사용자 상태 업데이트"""
        # 거래 히스토리 추가
        self.user_transaction_history.add(transaction.to_json())
        
        # 행동 프로파일 업데이트
        self.update_behavior_profile(transaction)
    
    def update_behavior_profile(self, transaction):
        """행동 프로파일 업데이트"""
        profile = self.get_user_behavior_profile() or {}
        
        # 평균 거래 금액 업데이트
        if "total_amount" not in profile:
            profile["total_amount"] = 0
            profile["transaction_count"] = 0
        
        profile["total_amount"] += transaction.amount
        profile["transaction_count"] += 1
        profile["average_amount"] = profile["total_amount"] / profile["transaction_count"]
        
        # 거래 유형 추가
        if "transaction_types" not in profile:
            profile["transaction_types"] = set()
        
        profile["transaction_types"].add(transaction.transaction_type.value)
        
        # 전형적인 거래 시간 업데이트
        transaction_time = datetime.fromtimestamp(transaction.timestamp)
        if "typical_hours" not in profile:
            profile["typical_hours"] = []
        
        if transaction_time.hour not in profile["typical_hours"]:
            profile["typical_hours"].append(transaction_time.hour)
        
        # 프로파일 저장
        self.user_behavior_profile.update(json.dumps(profile))
    
    def get_user_behavior_profile(self):
        """사용자 행동 프로파일 조회"""
        profile_json = self.user_behavior_profile.value()
        if profile_json:
            profile = json.loads(profile_json)
            # set을 list로 변환 (직렬화 가능하도록)
            if "transaction_types" in profile:
                profile["transaction_types"] = list(profile["transaction_types"])
            return profile
        return None
    
    def calculate_distance(self, loc1, loc2):
        """두 위치 간 거리 계산 (Haversine formula)"""
        lat1, lon1 = loc1["latitude"], loc1["longitude"]
        lat2, lon2 = loc2["latitude"], loc2["longitude"]
        
        R = 6371  # 지구 반지름 (km)
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = (math.sin(dlat/2) * math.sin(dlat/2) +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(dlon/2) * math.sin(dlon/2))
        
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        distance = R * c
        
        return distance
    
    def send_immediate_alert(self, risk_assessment, transaction):
        """즉시 알림 전송"""
        alert = {
            "type": "fraud_alert",
            "severity": risk_assessment.risk_level.value,
            "transaction_id": transaction.transaction_id,
            "user_id": transaction.user_id,
            "amount": transaction.amount,
            "risk_score": risk_assessment.risk_score,
            "recommendation": risk_assessment.recommendation,
            "timestamp": risk_assessment.timestamp
        }
        
        # 실제 구현에서는 알림 시스템으로 전송
        print(f"IMMEDIATE ALERT: {alert}")
```

### 3. 실시간 금융 모니터링 시스템 통합

```python
class RealTimeFinancialMonitoringSystem:
    def __init__(self):
        self.env = StreamExecutionEnvironment.get_execution_environment()
        self.setup_environment()
        self.alerting_system = RealTimeAlertingSystem()
        self.dashboard_manager = None
    
    def setup_environment(self):
        """환경 설정"""
        # 체크포인팅 활성화
        self.env.get_checkpoint_config().enable_checkpointing(1000)
        
        # 상태 백엔드 설정
        from pyflink.datastream.state import RocksDBStateBackend
        backend = RocksDBStateBackend(
            checkpoint_data_uri="file:///tmp/financial-monitoring-checkpoints"
        )
        self.env.set_state_backend(backend)
        
        # 이벤트 시간 설정
        self.env.set_stream_time_characteristic(TimeCharacteristic.EventTime)
    
    def create_kafka_source(self, topic, bootstrap_servers):
        """Kafka 소스 생성"""
        from pyflink.datastream.connectors import FlinkKafkaConsumer
        from pyflink.common.serialization import SimpleStringSchema
        
        kafka_properties = {
            'bootstrap.servers': bootstrap_servers,
            'group.id': 'financial-monitoring-system'
        }
        
        kafka_source = FlinkKafkaConsumer(
            topic,
            SimpleStringSchema(),
            kafka_properties
        )
        
        return self.env.add_source(kafka_source)
    
    def parse_financial_transactions(self, transaction_stream):
        """금융 거래 파싱"""
        def parse_transaction(transaction_str):
            try:
                return FinancialTransaction.from_json(transaction_str)
            except Exception as e:
                print(f"Failed to parse transaction: {transaction_str}, Error: {e}")
                return None
        
        return transaction_stream.map(parse_transaction, output_type=Types.PICKLED_BYTE_ARRAY()) \
                               .filter(lambda x: x is not None)
    
    def setup_real_time_aggregations(self, transaction_stream):
        """실시간 집계 설정"""
        # 1분 윈도우로 실시간 집계
        real_time_metrics = transaction_stream.window_all(
            TumblingEventTimeWindows.of(Time.minutes(1))
        ).aggregate(
            self.FinancialMetricsAggregateFunction(),
            self.FinancialMetricsWindowFunction(),
            output_type=Types.PICKLED_BYTE_ARRAY()
        )
        
        return real_time_metrics
    
    class FinancialMetricsAggregateFunction:
        """금융 메트릭 집계 함수"""
        def create_accumulator(self):
            return {
                "total_transactions": 0,
                "total_amount": 0.0,
                "high_risk_transactions": 0,
                "unique_users": set(),
                "transaction_types": {},
                "hourly_distribution": {}
            }
        
        def add(self, accumulator, value):
            accumulator["total_transactions"] += 1
            accumulator["total_amount"] += value.amount
            
            if hasattr(value, 'risk_level') and value.risk_level in ['high', 'critical']:
                accumulator["high_risk_transactions"] += 1
            
            accumulator["unique_users"].add(value.user_id)
            
            transaction_type = value.transaction_type.value
            accumulator["transaction_types"][transaction_type] = \
                accumulator["transaction_types"].get(transaction_type, 0) + 1
            
            hour = datetime.fromtimestamp(value.timestamp).hour
            accumulator["hourly_distribution"][hour] = \
                accumulator["hourly_distribution"].get(hour, 0) + 1
            
            return accumulator
        
        def get_result(self, accumulator):
            # set을 list로 변환
            accumulator["unique_users"] = list(accumulator["unique_users"])
            return accumulator
    
    class FinancialMetricsWindowFunction(AllWindowFunction):
        """금융 메트릭 윈도우 함수"""
        def apply(self, window, input, out):
            metrics = input[0] if input else self.create_empty_metrics()
            
            # 윈도우 메타데이터 추가
            metrics.update({
                "window_start": window.start,
                "window_end": window.end,
                "timestamp": window.end
            })
            
            # 파생 지표 계산
            metrics["average_transaction_amount"] = (
                metrics["total_amount"] / metrics["total_transactions"]
                if metrics["total_transactions"] > 0 else 0
            )
            
            metrics["risk_rate"] = (
                metrics["high_risk_transactions"] / metrics["total_transactions"]
                if metrics["total_transactions"] > 0 else 0
            )
            
            metrics["transactions_per_user"] = (
                metrics["total_transactions"] / len(metrics["unique_users"])
                if metrics["unique_users"] else 0
            )
            
            out.collect(metrics)
        
        def create_empty_metrics(self):
            return {
                "total_transactions": 0,
                "total_amount": 0.0,
                "high_risk_transactions": 0,
                "unique_users": [],
                "transaction_types": {},
                "hourly_distribution": {},
                "average_transaction_amount": 0.0,
                "risk_rate": 0.0,
                "transactions_per_user": 0.0
            }
    
    def run_financial_monitoring_system(self):
        """금융 모니터링 시스템 실행"""
        # Kafka에서 거래 데이터 읽기
        transaction_stream = self.create_kafka_source("financial-transactions", "localhost:9092")
        
        # 거래 파싱
        parsed_transactions = self.parse_financial_transactions(transaction_stream)
        
        # 타임스탬프와 워터마크 할당
        from pyflink.datastream.functions import BoundedOutOfOrdernessTimestampExtractor
        from pyflink.common.time import Time
        
        class TransactionTimestampExtractor(BoundedOutOfOrdernessTimestampExtractor):
            def __init__(self):
                super().__init__(Time.seconds(30))  # 30초 지연 허용
            
            def extract_timestamp(self, element, previous_timestamp):
                return element.timestamp * 1000
        
        watermarked_transactions = parsed_transactions.assign_timestamps_and_watermarks(
            TransactionTimestampExtractor()
        )
        
        # 이상 거래 감지
        risk_assessments = watermarked_transactions.key_by(lambda tx: tx.user_id) \
                                                   .process(FraudDetectionEngine())
        
        # 실시간 메트릭 계산
        real_time_metrics = self.setup_real_time_aggregations(watermarked_transactions)
        
        # 결과 출력
        risk_assessments.print("Risk Assessments")
        real_time_metrics.print("Real-time Metrics")
        
        # 실행
        self.env.execute("Real-time Financial Monitoring System")

# 시스템 실행
if __name__ == "__main__":
    system = RealTimeFinancialMonitoringSystem()
    system.run_financial_monitoring_system()
```

## 📚 학습 요약

### 이번 파트에서 학습한 내용

1. **CEP (Complex Event Processing)**
   - CEP의 기본 개념과 패턴 정의
   - 고급 패턴 매칭 (순차, OR, NOT, 반복 패턴)
   - 조건부 패턴 매칭과 동적 패턴 생성
   - 패턴 결과 후처리

2. **실시간 집계와 윈도우 함수**
   - 고급 윈도우 연산 (튬블링, 슬라이딩, 세션)
   - 실시간 집계 엔진 구축
   - 사용자별 및 글로벌 집계
   - 파생 지표 계산

3. **실시간 대시보드 구축**
   - Grafana 연동 대시보드
   - 실시간 알림 시스템
   - 다중 채널 알림 (이메일, Slack, PagerDuty)
   - 중복 알림 방지

4. **실무 프로젝트**
   - 실시간 금융 모니터링 시스템
   - 이상 거래 감지 엔진
   - 다중 위험 요소 평가
   - 종합 위험도 점수 계산

### 핵심 기술 스택

| 기술 | 용도 | 중요도 |
|------|------|--------|
| **CEP 패턴 매칭** | 복잡한 이벤트 처리 | ⭐⭐⭐⭐⭐ |
| **실시간 집계** | 실시간 메트릭 계산 | ⭐⭐⭐⭐⭐ |
| **윈도우 함수** | 시간 기반 분석 | ⭐⭐⭐⭐⭐ |
| **실시간 대시보드** | 모니터링과 시각화 | ⭐⭐⭐⭐ |
| **알림 시스템** | 이상 상황 대응 | ⭐⭐⭐⭐ |

### 다음 파트 미리보기

**Part 4: 프로덕션 배포와 성능 최적화**에서는 다음 내용을 다룹니다:
- Kubernetes를 활용한 Flink 클러스터 배포
- 성능 튜닝과 모니터링
- 장애 복구와 운영 전략
- Flink Metrics와 Grafana 연동

---

**다음 파트**: [Part 4: 프로덕션 배포와 성능 최적화](/data-engineering/2025/09/18/apache-flink-production-deployment.html)

---

*이제 Flink의 실시간 분석과 CEP를 마스터했습니다! 마지막 파트에서는 프로덕션 환경에서의 배포와 운영을 다뤄보겠습니다.* 🚀
