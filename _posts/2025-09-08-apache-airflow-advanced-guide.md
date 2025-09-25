---
layout: post
lang: ko
title: "Apache Airflow 심화 가이드: DAG 최적화부터 모니터링까지"
description: "실무에서 자주 사용되는 Apache Airflow의 고급 기능과 모범 사례를 학습하고 실제 프로젝트에 적용해봅니다."
date: 2025-09-08
author: Data Droid
category: data-engineering
tags: [Apache-Airflow, 데이터파이프라인, 워크플로우, DAG, 스케줄링, 모니터링, 데이터엔지니어링]
reading_time: "25분"
difficulty: "고급"
---

# Apache Airflow 심화 가이드: DAG 최적화부터 모니터링까지

> 실무에서 자주 사용되는 Apache Airflow의 고급 기능과 모범 사례를 학습하고 실제 프로젝트에 적용해봅니다.

## 📋 목차 {#목차}

1. [Airflow 아키텍처 심화 이해](#airflow-아키텍처-심화-이해)
2. [DAG 최적화 전략](#dag-최적화-전략)
3. [고급 스케줄링과 트리거](#고급-스케줄링과-트리거)
4. [에러 처리와 재시도 전략](#에러-처리와-재시도-전략)
5. [모니터링과 알림 시스템](#모니터링과-알림-시스템)
6. [실습: 실무급 데이터 파이프라인 구축](#실습-실무급-데이터-파이프라인-구축)
7. [성능 튜닝과 확장성](#성능-튜닝과-확장성)
8. [보안과 권한 관리](#보안과-권한-관리)
9. [학습 요약](#학습-요약)

## 🏗 ️ Airflow 아키텍처 심화 이해 {#airflow-아키텍처-심화-이해}

### 핵심 컴포넌트 분석

Apache Airflow는 다음과 같은 핵심 컴포넌트들로 구성됩니다:

#### **1. Scheduler**
- **역할**: DAG 파싱, Task 인스턴스 생성, 실행 스케줄링
- **동작 원리**: 메타데이터베이스에서 DAG 상태를 주기적으로 확인
- **성능 최적화**: 병렬 처리, DAG 파싱 캐싱

#### **2. Executor**
- **LocalExecutor**: 단일 머신에서 순차 실행
- **CeleryExecutor**: 분산 환경에서 병렬 실행
- **KubernetesExecutor**: 쿠버네티스 클러스터에서 실행
- **LocalKubernetesExecutor**: 하이브리드 실행 방식

#### **3. Webserver**
- **UI 제공**: DAG 모니터링, 로그 확인, 수동 실행
- **REST API**: 외부 시스템과의 연동
- **인증/권한**: 보안 관리

#### **4. Metadata Database**
- **PostgreSQL/MySQL**: 메타데이터 저장
- **연결 정보**: Connection, Variable, XCom
- **실행 히스토리**: Task 인스턴스, 로그 정보

### 메타데이터베이스 스키마 이해

```sql
-- 주요 테이블 구조
-- dag: DAG 메타데이터
-- dag_run: DAG 실행 인스턴스
-- task_instance: Task 실행 인스턴스
-- log: 실행 로그
-- connection: 데이터베이스 연결 정보
-- variable: 전역 변수
-- xcom: Task 간 데이터 전달
```

## ⚡ DAG 최적화 전략 {#dag-최적화-전략}

### 1. DAG 구조 최적화

#### **효율적인 Task 정의**

```python
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.sensors.filesystem import FileSensor
from airflow.utils.task_group import TaskGroup

# 기본 DAG 설정
default_args = {
    'owner': 'data-team',
    'depends_on_past': False,
    'start_date': datetime(2025, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'catchup': False,  # 과거 실행 건너뛰기
    'max_active_runs': 1,  # 동시 실행 제한
}

# DAG 정의
dag = DAG(
    'advanced_data_pipeline',
    default_args=default_args,
    description='고급 데이터 파이프라인',
    schedule_interval='0 2 * * *',  # 매일 오전 2시
    max_active_runs=1,
    tags=['data-engineering', 'etl'],
)

# Task Group을 활용한 구조화
with TaskGroup("data_extraction", tooltip="데이터 추출") as extraction_group:
    # 파일 존재 확인
    file_sensor = FileSensor(
        task_id='check_source_file',
        filepath='/data/input/sales_data.csv',
        poke_interval=30,
        timeout=300,
    )
    
    # 데이터 검증
    validate_data = PythonOperator(
        task_id='validate_data',
        python_callable=validate_source_data,
        op_kwargs={'file_path': '/data/input/sales_data.csv'},
    )

# 메인 처리 로직
with TaskGroup("data_processing", tooltip="데이터 처리") as processing_group:
    # 데이터 변환
    transform_data = PythonOperator(
        task_id='transform_data',
        python_callable=transform_sales_data,
        pool='data_processing_pool',  # 리소스 풀 사용
        pool_slots=2,
    )
    
    # 데이터 로드
    load_data = PythonOperator(
        task_id='load_data',
        python_callable=load_to_warehouse,
        trigger_rule='all_success',
    )

# 의존성 설정
extraction_group >> processing_group
```

### 2. 리소스 관리 최적화

#### **Pool과 Queue 활용**

```python
# airflow.cfg 설정
[celery]
worker_concurrency = 16
worker_precheck = True

# Pool 정의
from airflow.models import Pool

# 리소스 풀 생성
Pool.create(
    pool_name='data_processing_pool',
    slots=4,
    description='데이터 처리 전용 풀'
)

Pool.create(
    pool_name='heavy_computation_pool',
    slots=2,
    description='무거운 연산 전용 풀'
)

# Task에서 Pool 사용
heavy_task = PythonOperator(
    task_id='heavy_computation',
    python_callable=heavy_computation_function,
    pool='heavy_computation_pool',
    pool_slots=1,
)
```

### 3. 메모리 사용량 최적화

```python
# 대용량 데이터 처리 시 청크 단위 처리
def process_large_dataset(**context):
    """대용량 데이터를 청크 단위로 처리"""
    chunk_size = 10000
    
    for chunk in pd.read_csv(
        '/data/large_dataset.csv', 
        chunksize=chunk_size
    ):
        # 청크별 처리
        processed_chunk = process_chunk(chunk)
        
        # 중간 결과 저장
        save_intermediate_result(processed_chunk)
        
        # 메모리 정리
        del processed_chunk
        gc.collect()

# XCom 대신 파일 기반 데이터 전달
def save_large_data(**context):
    """대용량 데이터를 파일로 저장"""
    large_data = context['task_instance'].xcom_pull(task_ids='previous_task')
    
    # 파일로 저장
    with open('/tmp/large_data.pkl', 'wb') as f:
        pickle.dump(large_data, f)
    
    return '/tmp/large_data.pkl'

def load_large_data(**context):
    """파일에서 대용량 데이터 로드"""
    file_path = context['task_instance'].xcom_pull(task_ids='save_task')
    
    with open(file_path, 'rb') as f:
        return pickle.load(f)
```

## ⏰ 고급 스케줄링과 트리거

### 1. 동적 스케줄링

```python
# 조건부 스케줄링
def should_run_dag(**context):
    """DAG 실행 조건 확인"""
    # 특정 조건에서만 실행
    if datetime.now().weekday() in [0, 2, 4]:  # 월, 수, 금
        return True
    return False

# 조건부 DAG
dag = DAG(
    'conditional_dag',
    schedule_interval='0 9 * * *',
    catchup=False,
)

# 조건부 실행
conditional_task = BranchPythonOperator(
    task_id='check_conditions',
    python_callable=should_run_dag,
    dag=dag,
)

# 동적 Task 생성
def create_dynamic_tasks(**context):
    """실행 시점에 동적으로 Task 생성"""
    # 외부 시스템에서 Task 목록 조회
    task_list = get_external_task_list()
    
    for task_info in task_list:
        task = PythonOperator(
            task_id=f"dynamic_task_{task_info['id']}",
            python_callable=execute_dynamic_task,
            op_kwargs={'task_info': task_info},
        )
        yield task
```

### 2. 외부 트리거 활용

```python
# REST API를 통한 외부 트리거
from airflow.api_connexion.endpoints import dag_run_endpoint
from airflow.models import DagRun

# 외부 시스템에서 DAG 실행
def trigger_dag_externally(dag_id, conf=None):
    """외부에서 DAG 실행"""
    dag_run = DagRun.create(
        dag_id=dag_id,
        execution_date=datetime.now(),
        state='running',
        conf=conf,
    )
    return dag_run

# 웹훅을 통한 트리거
from airflow.operators.http_operator import SimpleHttpOperator

webhook_trigger = SimpleHttpOperator(
    task_id='webhook_trigger',
    http_conn_id='webhook_connection',
    endpoint='trigger',
    method='POST',
    data='{"dag_id": "target_dag"}',
    dag=dag,
)
```

### 3. 스케줄 최적화

```python
# Cron 표현식 활용
from airflow.timetables.trigger import CronTriggerTimetable

# 복잡한 스케줄링
custom_schedule = CronTriggerTimetable(
    cron='0 2 * * 1-5',  # 평일 오전 2시
    timezone='Asia/Seoul'
)

dag = DAG(
    'business_hours_dag',
    timetable=custom_schedule,
    catchup=False,
)

# 데이터 기반 스케줄링
def get_next_run_time(**context):
    """데이터 상태에 따라 다음 실행 시간 결정"""
    last_processed = get_last_processed_time()
    data_available = check_data_availability()
    
    if data_available:
        return datetime.now()
    else:
        return datetime.now() + timedelta(hours=1)
```

## 🚨 에러 처리와 재시도 전략

### 1. 고급 재시도 로직

```python
# 지수 백오프 재시도
from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults
import random

class SmartRetryOperator(BaseOperator):
    """지능형 재시도 연산자"""
    
    @apply_defaults
    def __init__(
        self,
        max_retries=3,
        base_delay=60,
        max_delay=300,
        exponential_base=2,
        jitter=True,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.max_retries = max_retries
        self.base_delay = base_delay
        self.max_delay = max_delay
        self.exponential_base = exponential_base
        self.jitter = jitter
    
    def execute(self, context):
        """실행 로직"""
        try:
            return self._execute_logic(context)
        except Exception as e:
            if self._should_retry(e, context):
                self._schedule_retry(context)
            else:
                raise e
    
    def _should_retry(self, exception, context):
        """재시도 여부 판단"""
        # 특정 예외만 재시도
        retryable_exceptions = (ConnectionError, TimeoutError)
        return isinstance(exception, retryable_exceptions)
    
    def _schedule_retry(self, context):
        """재시도 스케줄링"""
        retry_count = context['task_instance'].try_number - 1
        delay = min(
            self.base_delay * (self.exponential_base ** retry_count),
            self.max_delay
        )
        
        if self.jitter:
            delay += random.uniform(0, delay * 0.1)
        
        # 재시도 예약
        from airflow.models import TaskInstance
        ti = context['task_instance']
        ti.state = 'up_for_retry'
        ti.next_method = 'retry'
        ti.next_kwargs = {'delay': delay}
```

### 2. 에러 알림 시스템

```python
# 슬랙 알림
from airflow.providers.slack.operators.slack_webhook import SlackWebhookOperator

def send_slack_alert(context):
    """슬랙으로 에러 알림"""
    task_instance = context['task_instance']
    
    message = f"""
    🚨 Airflow Task 실패 알림
    
    DAG: {task_instance.dag_id}
    Task: {task_instance.task_id}
    실행 시간: {task_instance.start_date}
    에러: {context.get('exception', 'Unknown error')}
    로그: {task_instance.log_url}
    """
    
    return SlackWebhookOperator(
        task_id='slack_alert',
        http_conn_id='slack_webhook',
        message=message,
    )

# 이메일 알림
from airflow.operators.email_operator import EmailOperator

email_alert = EmailOperator(
    task_id='email_alert',
    to=['data-team@company.com'],
    subject='Airflow Task 실패 - {{ task_instance.dag_id }}',
    html_content="""
    <h2>Task 실패 알림</h2>
    <p><strong>DAG:</strong> {task_instance.dag_id}</p>
    <p><strong>Task:</strong> {task_instance.task_id}</p>
    <p><strong>실행 시간:</strong> {task_instance.start_date}</p>
    <p><strong>에러:</strong> {context.get('exception', 'Unknown error')}</p>
    """,
    trigger_rule='one_failed',
)
```

### 3. Circuit Breaker 패턴

```python
class CircuitBreakerOperator(BaseOperator):
    """서킷 브레이커 패턴 구현"""
    
    def __init__(
        self,
        failure_threshold=5,
        recovery_timeout=300,
        expected_exception=Exception,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.expected_exception = expected_exception
    
    def execute(self, context):
        """서킷 브레이커 로직"""
        circuit_state = self._get_circuit_state()
        
        if circuit_state == 'OPEN':
            if self._should_attempt_reset():
                circuit_state = 'HALF_OPEN'
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = self._execute_task(context)
            self._record_success()
            return result
        except self.expected_exception as e:
            self._record_failure()
            raise e
    
    def _get_circuit_state(self):
        """서킷 상태 확인"""
        # 메타데이터베이스에서 상태 조회
        # 구현 생략
        pass
```

## 📊 모니터링과 알림 시스템 {#모니터링과-알림-시스템}

### 1. 커스텀 메트릭 수집

```python
# Prometheus 메트릭 수집
from airflow.configuration import conf
from airflow.stats import Stats

def collect_custom_metrics(**context):
    """커스텀 메트릭 수집"""
    task_instance = context['task_instance']
    
    # 실행 시간 메트릭
    execution_time = (task_instance.end_date - task_instance.start_date).total_seconds()
    Stats.gauge('task_execution_time', execution_time, tags={
        'dag_id': task_instance.dag_id,
        'task_id': task_instance.task_id
    })
    
    # 메모리 사용량 메트릭
    import psutil
    memory_usage = psutil.Process().memory_info().rss / 1024 / 1024  # MB
    Stats.gauge('task_memory_usage', memory_usage, tags={
        'dag_id': task_instance.dag_id,
        'task_id': task_instance.task_id
    })
    
    # 데이터 처리량 메트릭
    processed_records = context.get('processed_records', 0)
    Stats.gauge('processed_records', processed_records, tags={
        'dag_id': task_instance.dag_id,
        'task_id': task_instance.task_id
    })

# 메트릭 수집 Task
metrics_task = PythonOperator(
    task_id='collect_metrics',
    python_callable=collect_custom_metrics,
    trigger_rule='all_done',  # 성공/실패 관계없이 실행
)
```

### 2. 대시보드 구축

```python
# Grafana 대시보드용 쿼리
def get_dag_performance_metrics():
    """DAG 성능 메트릭 조회"""
    query = """
    SELECT 
        dag_id,
        COUNT(*) as total_runs,
        AVG(EXTRACT(EPOCH FROM (end_date - start_date))) as avg_duration,
        COUNT(CASE WHEN state = 'success' THEN 1 END) as success_count,
        COUNT(CASE WHEN state = 'failed' THEN 1 END) as failed_count
    FROM dag_run 
    WHERE start_date >= NOW() - INTERVAL '7 days'
    GROUP BY dag_id
    ORDER BY avg_duration DESC
    """
    return query

# Airflow UI 커스텀 뷰
from airflow.plugins_manager import AirflowPlugin
from flask import Blueprint, render_template

class CustomViewPlugin(AirflowPlugin):
    name = "custom_view_plugin"
    
    def __init__(self):
        self.appbuilder_views = [
            {
                "name": "Custom Dashboard",
                "category": "Custom",
                "view": CustomDashboardView(),
            }
        ]

class CustomDashboardView:
    @expose("/custom-dashboard")
    def custom_dashboard(self):
        """커스텀 대시보드"""
        # 메트릭 데이터 조회
        metrics = get_dag_performance_metrics()
        
        return self.render_template(
            "custom_dashboard.html",
            metrics=metrics
        )
```

### 3. 실시간 모니터링

```python
# 실시간 알림 시스템
from airflow.models import BaseOperator
from airflow.utils.decorators import apply_defaults

class RealTimeMonitorOperator(BaseOperator):
    """실시간 모니터링 연산자"""
    
    @apply_defaults
    def __init__(
        self,
        monitoring_interval=60,
        alert_thresholds=None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.monitoring_interval = monitoring_interval
        self.alert_thresholds = alert_thresholds or {}
    
    def execute(self, context):
        """실시간 모니터링 실행"""
        while True:
            try:
                # 시스템 상태 확인
                system_health = self._check_system_health()
                
                # 임계값 확인
                alerts = self._check_thresholds(system_health)
                
                # 알림 발송
                for alert in alerts:
                    self._send_alert(alert)
                
                # 대기
                time.sleep(self.monitoring_interval)
                
            except KeyboardInterrupt:
                break
            except Exception as e:
                self.log.error(f"모니터링 오류: {e}")
                time.sleep(self.monitoring_interval)
    
    def _check_system_health(self):
        """시스템 상태 확인"""
        return {
            'cpu_usage': psutil.cpu_percent(),
            'memory_usage': psutil.virtual_memory().percent,
            'disk_usage': psutil.disk_usage('/').percent,
            'active_dags': self._count_active_dags(),
            'failed_tasks': self._count_failed_tasks(),
        }
    
    def _check_thresholds(self, health_data):
        """임계값 확인"""
        alerts = []
        
        if health_data['cpu_usage'] > self.alert_thresholds.get('cpu', 80):
            alerts.append({
                'type': 'cpu_high',
                'message': f"CPU 사용률이 높습니다: {health_data['cpu_usage']}%"
            })
        
        if health_data['memory_usage'] > self.alert_thresholds.get('memory', 85):
            alerts.append({
                'type': 'memory_high',
                'message': f"메모리 사용률이 높습니다: {health_data['memory_usage']}%"
            })
        
        return alerts
```

## 🛠 ️ 실습: 실무급 데이터 파이프라인 구축 {#실습-실무급-데이터-파이프라인-구축}

### 1. 환경 설정

```bash
# Airflow 설치 및 설정
pip install apache-airflow[postgres,celery,redis,slack]
pip install apache-airflow-providers-postgres
pip install apache-airflow-providers-slack
pip install apache-airflow-providers-http

# 데이터베이스 설정
export AIRFLOW__CORE__SQL_ALCHEMY_CONN="postgresql://airflow:airflow@localhost/airflow"
export AIRFLOW__CORE__EXECUTOR="CeleryExecutor"
export AIRFLOW__CELERY__BROKER_URL="redis://localhost:6379/0"
export AIRFLOW__CELERY__RESULT_BACKEND="redis://localhost:6379/0"

# Airflow 초기화
airflow db init
airflow users create \
    --username admin \
    --firstname Admin \
    --lastname User \
    --role Admin \
    --email admin@example.com
```

### 2. 실무급 ETL 파이프라인

```python
# dags/advanced_etl_pipeline.py
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.sensors.filesystem import FileSensor
from airflow.utils.task_group import TaskGroup
from airflow.models import Variable
from airflow.hooks.postgres_hook import PostgresHook
from airflow.providers.slack.operators.slack_webhook import SlackWebhookOperator

# 설정값 로드
BATCH_SIZE = int(Variable.get("batch_size", default_var=1000))
MAX_RETRIES = int(Variable.get("max_retries", default_var=3))

default_args = {
    'owner': 'data-engineering-team',
    'depends_on_past': False,
    'start_date': datetime(2025, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': MAX_RETRIES,
    'retry_delay': timedelta(minutes=5),
    'retry_exponential_backoff': True,
    'max_retry_delay': timedelta(minutes=30),
    'catchup': False,
    'max_active_runs': 1,
}

dag = DAG(
    'advanced_etl_pipeline',
    default_args=default_args,
    description='고급 ETL 파이프라인 - 데이터 추출, 변환, 로드',
    schedule_interval='0 2 * * *',
    max_active_runs=1,
    tags=['etl', 'data-engineering', 'production'],
    doc_md=__doc__,
)

# 데이터 추출 그룹
with TaskGroup("data_extraction", tooltip="데이터 추출") as extraction_group:
    
    # 소스 파일 확인
    check_source_files = FileSensor(
        task_id='check_source_files',
        filepath=[
            '/data/input/sales_data.csv',
            '/data/input/customer_data.csv',
            '/data/input/product_data.csv'
        ],
        poke_interval=30,
        timeout=300,
        mode='reschedule',
    )
    
    # 데이터 품질 검증
    validate_data_quality = PythonOperator(
        task_id='validate_data_quality',
        python_callable=validate_data_quality,
        op_kwargs={
            'source_files': [
                '/data/input/sales_data.csv',
                '/data/input/customer_data.csv',
                '/data/input/product_data.csv'
            ]
        },
        pool='data_validation_pool',
    )
    
    # 데이터 추출
    extract_data = PythonOperator(
        task_id='extract_data',
        python_callable=extract_data_from_sources,
        op_kwargs={'batch_size': BATCH_SIZE},
        pool='data_extraction_pool',
    )

# 데이터 변환 그룹
with TaskGroup("data_transformation", tooltip="데이터 변환") as transformation_group:
    
    # 데이터 정제
    clean_data = PythonOperator(
        task_id='clean_data',
        python_callable=clean_and_validate_data,
        op_kwargs={'batch_size': BATCH_SIZE},
        pool='data_processing_pool',
    )
    
    # 데이터 변환
    transform_data = PythonOperator(
        task_id='transform_data',
        python_callable=transform_business_logic,
        op_kwargs={'batch_size': BATCH_SIZE},
        pool='data_processing_pool',
    )
    
    # 데이터 집계
    aggregate_data = PythonOperator(
        task_id='aggregate_data',
        python_callable=create_aggregated_metrics,
        pool='data_processing_pool',
    )

# 데이터 로드 그룹
with TaskGroup("data_loading", tooltip="데이터 로드") as loading_group:
    
    # 스테이징 테이블 로드
    load_to_staging = PythonOperator(
        task_id='load_to_staging',
        python_callable=load_to_staging_tables,
        pool='data_loading_pool',
    )
    
    # 데이터 웨어하우스 로드
    load_to_warehouse = PythonOperator(
        task_id='load_to_warehouse',
        python_callable=load_to_data_warehouse,
        pool='data_loading_pool',
    )
    
    # 데이터 검증
    validate_loaded_data = PythonOperator(
        task_id='validate_loaded_data',
        python_callable=validate_loaded_data,
        trigger_rule='all_success',
    )

# 알림 및 모니터링
with TaskGroup("monitoring", tooltip="모니터링") as monitoring_group:
    
    # 성공 알림
    success_notification = SlackWebhookOperator(
        task_id='success_notification',
        http_conn_id='slack_webhook',
        message="""
        ✅ ETL 파이프라인 성공적으로 완료
        
        실행 시간: {{ ds }}
        처리된 레코드 수: {ti.xcom_pull(task_ids='extract_data')}
        """,
        trigger_rule='all_success',
    )
    
    # 실패 알림
    failure_notification = SlackWebhookOperator(
        task_id='failure_notification',
        http_conn_id='slack_webhook',
        message="""
        ❌ ETL 파이프라인 실패
        
        실행 시간: {{ ds }}
        실패한 Task: {{ ti.task_id }}
        에러 로그: {{ ti.log_url }}
        """,
        trigger_rule='one_failed',
    )

# 의존성 설정
extraction_group >> transformation_group >> loading_group
[loading_group, monitoring_group]

# DAG 문서화
dag.doc_md = """
# 고급 ETL 파이프라인

이 DAG는 실무급 데이터 파이프라인을 구현합니다.

## 주요 기능
- 데이터 품질 검증
- 배치 처리 최적화
- 에러 처리 및 재시도
- 실시간 모니터링
- 알림 시스템

## 실행 주기
매일 오전 2시 실행

## 모니터링
- Slack 알림
- 성능 메트릭 수집
- 에러 추적
"""
```

### 3. 핵심 함수 구현

```python
# plugins/etl_functions.py
import pandas as pd
import numpy as np
from datetime import datetime
from airflow.hooks.postgres_hook import PostgresHook
from airflow.models import Variable
import logging

logger = logging.getLogger(__name__)

def validate_data_quality(source_files, **context):
    """데이터 품질 검증"""
    logger.info("데이터 품질 검증 시작")
    
    validation_results = {}
    
    for file_path in source_files:
        try:
            # 파일 존재 확인
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"파일을 찾을 수 없습니다: {file_path}")
            
            # 데이터 로드
            df = pd.read_csv(file_path)
            
            # 기본 검증
            validation_result = {
                'file_path': file_path,
                'row_count': len(df),
                'column_count': len(df.columns),
                'null_count': df.isnull().sum().sum(),
                'duplicate_count': df.duplicated().sum(),
                'file_size_mb': os.path.getsize(file_path) / (1024 * 1024),
            }
            
            # 데이터 타입 검증
            validation_result['data_types'] = df.dtypes.to_dict()
            
            # 이상치 검증 (IQR 방법)
            numeric_columns = df.select_dtypes(include=[np.number]).columns
            outliers = {}
            for col in numeric_columns:
                Q1 = df[col].quantile(0.25)
                Q3 = df[col].quantile(0.75)
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR
                outliers[col] = len(df[(df[col] < lower_bound) | (df[col] > upper_bound)])
            
            validation_result['outliers'] = outliers
            
            validation_results[file_path] = validation_result
            
            logger.info(f"검증 완료: {file_path} - {len(df)}행")
            
        except Exception as e:
            logger.error(f"검증 실패: {file_path} - {str(e)}")
            raise e
    
    # 검증 결과를 XCom에 저장
    context['task_instance'].xcom_push(key='validation_results', value=validation_results)
    
    return validation_results

def extract_data_from_sources(batch_size, **context):
    """데이터 소스에서 데이터 추출"""
    logger.info("데이터 추출 시작")
    
    # 검증 결과 로드
    validation_results = context['task_instance'].xcom_pull(
        task_ids='validate_data_quality',
        key='validation_results'
    )
    
    extracted_data = {}
    total_records = 0
    
    for file_path, validation in validation_results.items():
        try:
            # 배치 단위로 데이터 로드
            df = pd.read_csv(file_path)
            
            # 데이터 전처리
            df = preprocess_data(df)
            
            extracted_data[file_path] = df
            total_records += len(df)
            
            logger.info(f"추출 완료: {file_path} - {len(df)}행")
            
        except Exception as e:
            logger.error(f"추출 실패: {file_path} - {str(e)}")
            raise e
    
    # 추출 결과를 XCom에 저장
    context['task_instance'].xcom_push(key='extracted_data', value=extracted_data)
    context['task_instance'].xcom_push(key='total_records', value=total_records)
    
    logger.info(f"데이터 추출 완료 - 총 {total_records}개 레코드")
    
    return total_records

def clean_and_validate_data(batch_size, **context):
    """데이터 정제 및 검증"""
    logger.info("데이터 정제 시작")
    
    # 추출된 데이터 로드
    extracted_data = context['task_instance'].xcom_pull(
        task_ids='extract_data',
        key='extracted_data'
    )
    
    cleaned_data = {}
    
    for file_path, df in extracted_data.items():
        try:
            # 결측값 처리
            df_cleaned = handle_missing_values(df)
            
            # 중복 제거
            df_cleaned = remove_duplicates(df_cleaned)
            
            # 이상치 처리
            df_cleaned = handle_outliers(df_cleaned)
            
            # 데이터 타입 변환
            df_cleaned = convert_data_types(df_cleaned)
            
            cleaned_data[file_path] = df_cleaned
            
            logger.info(f"정제 완료: {file_path} - {len(df_cleaned)}행")
            
        except Exception as e:
            logger.error(f"정제 실패: {file_path} - {str(e)}")
            raise e
    
    # 정제 결과를 XCom에 저장
    context['task_instance'].xcom_push(key='cleaned_data', value=cleaned_data)
    
    return cleaned_data

def transform_business_logic(batch_size, **context):
    """비즈니스 로직 적용한 데이터 변환"""
    logger.info("데이터 변환 시작")
    
    # 정제된 데이터 로드
    cleaned_data = context['task_instance'].xcom_pull(
        task_ids='clean_data',
        key='cleaned_data'
    )
    
    transformed_data = {}
    
    for file_path, df in cleaned_data.items():
        try:
            # 파일별 비즈니스 로직 적용
            if 'sales_data' in file_path:
                df_transformed = transform_sales_data(df)
            elif 'customer_data' in file_path:
                df_transformed = transform_customer_data(df)
            elif 'product_data' in file_path:
                df_transformed = transform_product_data(df)
            else:
                df_transformed = df
            
            transformed_data[file_path] = df_transformed
            
            logger.info(f"변환 완료: {file_path} - {len(df_transformed)}행")
            
        except Exception as e:
            logger.error(f"변환 실패: {file_path} - {str(e)}")
            raise e
    
    # 변환 결과를 XCom에 저장
    context['task_instance'].xcom_push(key='transformed_data', value=transformed_data)
    
    return transformed_data

def load_to_data_warehouse(**context):
    """데이터 웨어하우스에 로드"""
    logger.info("데이터 웨어하우스 로드 시작")
    
    # 변환된 데이터 로드
    transformed_data = context['task_instance'].xcom_pull(
        task_ids='transform_data',
        key='transformed_data'
    )
    
    # 데이터베이스 연결
    postgres_hook = PostgresHook(postgres_conn_id='data_warehouse_conn')
    
    for file_path, df in transformed_data.items():
        try:
            # 테이블명 결정
            table_name = determine_table_name(file_path)
            
            # 데이터 로드
            postgres_hook.insert_rows(
                table=table_name,
                rows=df.values.tolist(),
                target_fields=df.columns.tolist(),
                replace=True
            )
            
            logger.info(f"로드 완료: {table_name} - {len(df)}행")
            
        except Exception as e:
            logger.error(f"로드 실패: {file_path} - {str(e)}")
            raise e
    
    logger.info("데이터 웨어하우스 로드 완료")

# 유틸리티 함수들
def preprocess_data(df):
    """데이터 전처리"""
    # 컬럼명 정규화
    df.columns = df.columns.str.lower().str.replace(' ', '_')
    
    # 날짜 컬럼 처리
    date_columns = df.select_dtypes(include=['object']).columns
    for col in date_columns:
        if 'date' in col.lower() or 'time' in col.lower():
            df[col] = pd.to_datetime(df[col], errors='coerce')
    
    return df

def handle_missing_values(df):
    """결측값 처리"""
    # 숫자형 컬럼: 평균값으로 대체
    numeric_columns = df.select_dtypes(include=[np.number]).columns
    df[numeric_columns] = df[numeric_columns].fillna(df[numeric_columns].mean())
    
    # 범주형 컬럼: 최빈값으로 대체
    categorical_columns = df.select_dtypes(include=['object']).columns
    df[categorical_columns] = df[categorical_columns].fillna(df[categorical_columns].mode().iloc[0])
    
    return df

def remove_duplicates(df):
    """중복 제거"""
    return df.drop_duplicates()

def handle_outliers(df):
    """이상치 처리 (IQR 방법)"""
    numeric_columns = df.select_dtypes(include=[np.number]).columns
    
    for col in numeric_columns:
        Q1 = df[col].quantile(0.25)
        Q3 = df[col].quantile(0.75)
        IQR = Q3 - Q1
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        # 이상치를 경계값으로 대체
        df[col] = df[col].clip(lower=lower_bound, upper=upper_bound)
    
    return df

def convert_data_types(df):
    """데이터 타입 변환"""
    # 날짜 컬럼 처리
    date_columns = df.select_dtypes(include=['object']).columns
    for col in date_columns:
        if 'date' in col.lower() or 'time' in col.lower():
            df[col] = pd.to_datetime(df[col], errors='coerce')
    
    # 숫자형 컬럼 처리
    numeric_columns = df.select_dtypes(include=['object']).columns
    for col in numeric_columns:
        if df[col].dtype == 'object':
            # 숫자로 변환 가능한지 확인
            if df[col].str.replace('.', '').str.replace('-', '').str.isnumeric().all():
                df[col] = pd.to_numeric(df[col], errors='coerce')
    
    return df

def determine_table_name(file_path):
    """파일 경로에서 테이블명 결정"""
    filename = os.path.basename(file_path)
    table_name = filename.replace('.csv', '').replace('_data', '')
    return f"staging_{table_name}"

# 비즈니스 로직 변환 함수들
def transform_sales_data(df):
    """매출 데이터 변환"""
    # 매출 금액 계산
    if 'quantity' in df.columns and 'unit_price' in df.columns:
        df['total_amount'] = df['quantity'] * df['unit_price']
    
    # 할인율 적용
    if 'discount_rate' in df.columns:
        df['final_amount'] = df['total_amount'] * (1 - df['discount_rate'] / 100)
    
    return df

def transform_customer_data(df):
    """고객 데이터 변환"""
    # 고객 등급 계산
    if 'total_purchase' in df.columns:
        df['customer_grade'] = pd.cut(
            df['total_purchase'],
            bins=[0, 1000, 5000, 10000, float('inf')],
            labels=['Bronze', 'Silver', 'Gold', 'Platinum']
        )
    
    return df

def transform_product_data(df):
    """상품 데이터 변환"""
    # 카테고리 정규화
    if 'category' in df.columns:
        df['category'] = df['category'].str.upper().str.strip()
    
    return df
```

## 📚 학습 요약 {#학습-요약}

### 이번 포스트에서 학습한 내용

1. **Airflow 아키텍처 심화 이해**
   - 핵심 컴포넌트 분석
   - 메타데이터베이스 스키마
   - Executor 종류와 특징

2. **DAG 최적화 전략**
   - 효율적인 Task 정의
   - 리소스 관리 최적화
   - 메모리 사용량 최적화

3. **고급 스케줄링과 트리거**
   - 동적 스케줄링
   - 외부 트리거 활용
   - 스케줄 최적화

4. **에러 처리와 재시도 전략**
   - 고급 재시도 로직
   - 에러 알림 시스템
   - Circuit Breaker 패턴

5. **모니터링과 알림 시스템**
   - 커스텀 메트릭 수집
   - 대시보드 구축
   - 실시간 모니터링

6. **실무급 데이터 파이프라인 구축**
   - 완전한 ETL 파이프라인
   - 데이터 품질 검증
   - 에러 처리 및 알림

### 핵심 개념 정리

| 개념 | 설명 | 중요도 |
|------|------|--------|
| **DAG 최적화** | 성능과 리소스 효율성 향상 | ⭐⭐⭐⭐⭐ |
| **에러 처리** | 안정적인 파이프라인 운영 | ⭐⭐⭐⭐⭐ |
| **모니터링** | 실시간 상태 추적 | ⭐⭐⭐⭐⭐ |
| **스케줄링** | 유연한 실행 제어 | ⭐⭐⭐⭐ |

### 실무 적용 시 고려사항

1. **성능 최적화**: Pool, Queue, 메모리 관리
2. **안정성**: 에러 처리, 재시도, Circuit Breaker
3. **모니터링**: 메트릭 수집, 알림, 대시보드
4. **확장성**: 분산 환경, 리소스 관리

---

*이 가이드를 통해 Apache Airflow의 고급 기능들을 마스터하고, 실무에서 안정적이고 효율적인 데이터 파이프라인을 구축할 수 있습니다!* 🚀
