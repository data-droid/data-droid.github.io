---
layout: post
lang: ko
title: "Part 2: Apache Spark 대용량 배치 처리와 UDF 활용 - 실무 프로젝트"
description: "Apache Spark의 고급 배치 처리 기법, UDF 작성, 그리고 Docker와 Kubernetes를 활용한 프로덕션 환경 구축까지 다룹니다."
date: 2025-09-12
author: Data Droid
category: data-engineering
tags: [Apache-Spark, UDF, 배치처리, Docker, Kubernetes, Airflow, 성능최적화, Python]
series: apache-spark-complete-guide
series_order: 2
reading_time: "45분"
difficulty: "고급"
---

# Part 2: Apache Spark 대용량 배치 처리와 UDF 활용 - 실무 프로젝트

> Apache Spark의 고급 배치 처리 기법, UDF 작성, 그리고 Docker와 Kubernetes를 활용한 프로덕션 환경 구축까지 다룹니다.

## 📋 목차

1. [UDF (User Defined Function) 완전 정리](#udf-user-defined-function-완전-정리)
2. [고급 집계와 윈도우 함수](#고급-집계와-윈도우-함수)
3. [파티셔닝 전략과 성능 최적화](#파티셔닝-전략과-성능-최적화)
4. [실무 프로젝트: 전자상거래 데이터 분석](#실무-프로젝트-전자상거래-데이터-분석)
5. [Docker와 Kubernetes 배포](#docker와-kubernetes-배포)
6. [Airflow 스케줄링](#airflow-스케줄링)
7. [학습 요약](#학습-요약)

## 🔧 UDF (User Defined Function) 완전 정리

### UDF란?

UDF는 Spark에서 제공하지 않는 커스텀 함수를 작성하여 데이터 변환에 사용하는 방법입니다.

### UDF 작성 방법

#### **1. 기본 UDF 작성**

```python
from pyspark.sql.functions import udf
from pyspark.sql.types import StringType, IntegerType, FloatType, BooleanType

# 간단한 문자열 처리 UDF
@udf(returnType=StringType())
def clean_text(text):
    if text is None:
        return None
    return text.strip().lower().replace("  ", " ")

# 수학 계산 UDF
@udf(returnType=FloatType())
def calculate_discount(price, discount_rate):
    if price is None or discount_rate is None:
        return None
    return float(price * (1 - discount_rate))

# 조건부 처리 UDF
@udf(returnType=StringType())
def categorize_price(price):
    if price is None:
        return "Unknown"
    elif price < 100:
        return "Low"
    elif price < 500:
        return "Medium"
    else:
        return "High"

# 사용 예제
df = spark.createDataFrame([
    ("  Product A  ", 150.0, 0.1),
    ("Product B", 75.0, 0.2),
    (None, 600.0, 0.15)
], ["product_name", "price", "discount_rate"])

df.withColumn("clean_name", clean_text("product_name")) \
  .withColumn("final_price", calculate_discount("price", "discount_rate")) \
  .withColumn("price_category", categorize_price("price")) \
  .show()
```

#### **2. 복잡한 UDF - JSON 파싱**

```python
from pyspark.sql.types import MapType, StringType
import json

@udf(returnType=MapType(StringType(), StringType()))
def parse_json_metadata(json_str):
    try:
        if json_str is None:
            return {}
        data = json.loads(json_str)
        # 문자열로 변환하여 반환
        return {str(k): str(v) for k, v in data.items()}
    except:
        return {}

# 사용 예제
json_data = spark.createDataFrame([
    ('{"category": "electronics", "brand": "Samsung", "rating": 4.5}'),
    ('{"category": "clothing", "brand": "Nike", "rating": 4.2}'),
    ('invalid json')
], ["metadata"])

json_data.withColumn("parsed_metadata", parse_json_metadata("metadata")).show(truncate=False)
```

#### **3. 고급 UDF - 머신러닝 모델 적용**

```python
from pyspark.sql.types import ArrayType, FloatType
import numpy as np
from sklearn.ensemble import IsolationForest

# 전역 모델 변수
model = None

def initialize_model():
    global model
    # 간단한 이상 탐지 모델 초기화
    model = IsolationForest(contamination=0.1, random_state=42)
    # 더미 데이터로 훈련
    dummy_data = np.random.randn(1000, 3)
    model.fit(dummy_data)

@udf(returnType=FloatType())
def anomaly_score(features_array):
    global model
    if model is None:
        initialize_model()
    
    if features_array is None or len(features_array) != 3:
        return 0.0
    
    try:
        features = np.array(features_array).reshape(1, -1)
        score = model.decision_function(features)[0]
        return float(score)
    except:
        return 0.0

# 사용 예제
features_data = spark.createDataFrame([
    ([1.2, 3.4, 2.1],),
    ([10.5, 15.2, 8.9],),
    ([0.1, 0.3, 0.2],)
], ["features"])

features_data.withColumn("anomaly_score", anomaly_score("features")).show()
```

### UDF 최적화 팁

#### **1. Vectorized UDF 사용**

```python
import pandas as pd
from pyspark.sql.functions import pandas_udf
from pyspark.sql.types import FloatType

# Pandas UDF는 더 빠른 성능을 제공
@pandas_udf(returnType=FloatType())
def fast_calculation(series: pd.Series) -> pd.Series:
    # 벡터화된 연산으로 성능 향상
    return series * 2 + 1

# 사용
df.withColumn("fast_result", fast_calculation("value")).show()
```

#### **2. UDF 캐싱과 재사용**

```python
# UDF를 함수로 정의하여 재사용
def create_text_processor():
    @udf(returnType=StringType())
    def process_text(text):
        return text.upper() if text else None
    return process_text

# 여러 DataFrame에서 재사용
text_processor = create_text_processor()
df1.withColumn("processed", text_processor("text1")).show()
df2.withColumn("processed", text_processor("text2")).show()
```

## 📊 고급 집계와 윈도우 함수

### 고급 윈도우 함수

```python
from pyspark.sql.window import Window
from pyspark.sql.functions import (
    row_number, rank, dense_rank, lag, lead, 
    first_value, last_value, nth_value,
    cume_dist, percent_rank, ntile
)

# 복잡한 윈도우 스펙 정의
window_spec = Window.partitionBy("category").orderBy("sales_amount")

# 다양한 윈도우 함수 적용
df_advanced = df.withColumn("row_num", row_number().over(window_spec)) \
    .withColumn("rank", rank().over(window_spec)) \
    .withColumn("dense_rank", dense_rank().over(window_spec)) \
    .withColumn("prev_sales", lag("sales_amount", 1).over(window_spec)) \
    .withColumn("next_sales", lead("sales_amount", 1).over(window_spec)) \
    .withColumn("first_sales", first_value("sales_amount").over(window_spec)) \
    .withColumn("last_sales", last_value("sales_amount").over(window_spec)) \
    .withColumn("cumulative_dist", cume_dist().over(window_spec)) \
    .withColumn("percentile_rank", percent_rank().over(window_spec)) \
    .withColumn("quartile", ntile(4).over(window_spec))
```

### 고급 집계 함수

```python
from pyspark.sql.functions import (
    collect_list, collect_set, array_agg,
    stddev, variance, skewness, kurtosis,
    corr, covar_pop, covar_samp
)

# 통계적 집계
stats_df = df.groupBy("category") \
    .agg(
        count("*").alias("count"),
        avg("price").alias("avg_price"),
        stddev("price").alias("stddev_price"),
        variance("price").alias("variance_price"),
        skewness("price").alias("skewness_price"),
        kurtosis("price").alias("kurtosis_price"),
        collect_list("product_name").alias("all_products"),
        collect_set("brand").alias("unique_brands")
    )
```

## ⚡ 파티셔닝 전략과 성능 최적화

### 파티셔닝 전략

```python
# 1. 컬럼 기반 파티셔닝
df.write.mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("path/to/partitioned_data")

# 2. 버킷팅
df.write.mode("overwrite") \
    .bucketBy(10, "user_id") \
    .sortBy("timestamp") \
    .saveAsTable("bucketed_table")

# 3. 동적 파티셔닝
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.advisoryPartitionSizeInBytes", "128MB")
```

### 성능 최적화 설정

```python
# 메모리 최적화
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# 캐싱 전략
df.cache()  # 메모리 캐싱
df.persist(StorageLevel.MEMORY_AND_DISK)  # 메모리+디스크 캐싱

# 브로드캐스트 조인
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "10MB")
```

## 🛒 실무 프로젝트: 전자상거래 데이터 분석

### 프로젝트 구조

```
ecommerce-analysis/
├── src/
│   ├── data_processing.py
│   ├── analytics.py
│   └── utils.py
├── config/
│   ├── spark_config.py
│   └── app_config.yaml
├── tests/
│   └── test_data_processing.py
├── Dockerfile
├── requirements.txt
├── kubernetes/
│   ├── spark-job.yaml
│   └── airflow-dag.py
└── README.md
```

### 1. 데이터 처리 모듈

```python
# src/data_processing.py
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *
from pyspark.sql.window import Window
import logging

class EcommerceDataProcessor:
    def __init__(self, spark_session):
        self.spark = spark_session
        self.logger = logging.getLogger(__name__)
        
    def load_data(self, data_path):
        """데이터 로드"""
        self.logger.info(f"Loading data from {data_path}")
        
        # 다양한 데이터 소스 로드
        orders_df = self.spark.read.parquet(f"{data_path}/orders")
        products_df = self.spark.read.parquet(f"{data_path}/products")
        customers_df = self.spark.read.parquet(f"{data_path}/customers")
        
        return orders_df, products_df, customers_df
    
    def clean_data(self, orders_df, products_df, customers_df):
        """데이터 정제"""
        self.logger.info("Cleaning data...")
        
        # 중복 제거
        orders_clean = orders_df.dropDuplicates(["order_id"])
        products_clean = products_df.dropDuplicates(["product_id"])
        customers_clean = customers_df.dropDuplicates(["customer_id"])
        
        # NULL 값 처리
        orders_clean = orders_clean.fillna({"quantity": 1, "discount": 0})
        products_clean = products_clean.fillna({"price": 0, "category": "Unknown"})
        
        return orders_clean, products_clean, customers_clean
    
    def enrich_data(self, orders_df, products_df, customers_df):
        """데이터 풍부화"""
        self.logger.info("Enriching data...")
        
        # 조인을 통한 데이터 풍부화
        enriched_df = orders_df \
            .join(products_df, "product_id", "left") \
            .join(customers_df, "customer_id", "left")
        
        # 계산된 컬럼 추가
        enriched_df = enriched_df.withColumn(
            "total_amount", 
            col("quantity") * col("price") * (1 - col("discount"))
        )
        
        # 고객 등급 계산 UDF
        @udf(returnType=StringType())
        def calculate_customer_tier(total_spent):
            if total_spent >= 10000:
                return "VIP"
            elif total_spent >= 5000:
                return "Gold"
            elif total_spent >= 1000:
                return "Silver"
            else:
                return "Bronze"
        
        # 고객별 총 구매액 계산
        customer_totals = enriched_df.groupBy("customer_id") \
            .agg(sum("total_amount").alias("total_spent"))
        
        enriched_df = enriched_df.join(customer_totals, "customer_id", "left") \
            .withColumn("customer_tier", calculate_customer_tier("total_spent"))
        
        return enriched_df
```

### 2. 고급 분석 모듈

```python
# src/analytics.py
from pyspark.sql.functions import *
from pyspark.sql.window import Window
import pandas as pd

class EcommerceAnalytics:
    def __init__(self, spark_session):
        self.spark = spark_session
    
    def sales_analysis(self, df):
        """매출 분석"""
        # 일별 매출 트렌드
        daily_sales = df.groupBy("order_date") \
            .agg(
                sum("total_amount").alias("daily_revenue"),
                countDistinct("customer_id").alias("daily_customers"),
                avg("total_amount").alias("avg_order_value")
            ) \
            .orderBy("order_date")
        
        # 제품별 매출 분석
        product_sales = df.groupBy("product_id", "product_name", "category") \
            .agg(
                sum("quantity").alias("total_quantity"),
                sum("total_amount").alias("total_revenue"),
                countDistinct("customer_id").alias("unique_customers")
            ) \
            .orderBy(desc("total_revenue"))
        
        return daily_sales, product_sales
    
    def customer_analysis(self, df):
        """고객 분석"""
        # 고객별 구매 패턴
        customer_patterns = df.groupBy("customer_id", "customer_tier") \
            .agg(
                count("*").alias("total_orders"),
                sum("total_amount").alias("total_spent"),
                avg("total_amount").alias("avg_order_value"),
                min("order_date").alias("first_purchase"),
                max("order_date").alias("last_purchase")
            )
        
        # RFM 분석 (Recency, Frequency, Monetary)
        rfm_analysis = df.groupBy("customer_id") \
            .agg(
                datediff(current_date(), max("order_date")).alias("recency"),
                count("*").alias("frequency"),
                sum("total_amount").alias("monetary")
            )
        
        return customer_patterns, rfm_analysis
    
    def advanced_analytics(self, df):
        """고급 분석"""
        # 코호트 분석
        cohort_analysis = df.select("customer_id", "order_date") \
            .withColumn("cohort_month", date_format("order_date", "yyyy-MM")) \
            .groupBy("cohort_month") \
            .agg(countDistinct("customer_id").alias("cohort_size"))
        
        # 상품 추천을 위한 협업 필터링 기초
        window_spec = Window.partitionBy("customer_id").orderBy(desc("order_date"))
        
        customer_product_matrix = df.select("customer_id", "product_id", "total_amount") \
            .withColumn("rank", row_number().over(window_spec)) \
            .filter(col("rank") <= 10)  # 최근 10개 구매 상품
        
        return cohort_analysis, customer_product_matrix
```

### 3. 설정 파일

```python
# config/spark_config.py
def get_spark_config():
    return {
        "spark.app.name": "EcommerceAnalysis",
        "spark.master": "local[*]",
        "spark.sql.adaptive.enabled": "true",
        "spark.sql.adaptive.coalescePartitions.enabled": "true",
        "spark.sql.adaptive.advisoryPartitionSizeInBytes": "128MB",
        "spark.sql.adaptive.skewJoin.enabled": "true",
        "spark.serializer": "org.apache.spark.serializer.KryoSerializer",
        "spark.sql.execution.arrow.pyspark.enabled": "true",
        "spark.sql.adaptive.skewJoin.skewedPartitionFactor": "5",
        "spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes": "256MB"
    }
```

```yaml
# config/app_config.yaml
data:
  input_path: "/data/input"
  output_path: "/data/output"
  checkpoint_path: "/data/checkpoint"

processing:
  batch_size: 10000
  parallelism: 4
  cache_enabled: true

output:
  format: "parquet"
  compression: "snappy"
  partition_by: ["year", "month"]
```

## 🐳 Docker와 Kubernetes 배포

### 1. Dockerfile

```dockerfile
# Dockerfile
FROM openjdk:8-jdk-alpine

# Python 설치
RUN apk add --no-cache python3 py3-pip

# Spark 설치
ENV SPARK_VERSION=3.4.0
ENV HADOOP_VERSION=3
ENV SPARK_HOME=/opt/spark
ENV PATH=$PATH:$SPARK_HOME/bin

RUN wget -q https://archive.apache.org/dist/spark/spark-${SPARK_VERSION}/spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz && \
    tar xzf spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz && \
    mv spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION} ${SPARK_HOME} && \
    rm spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz

# Python 의존성 설치
COPY requirements.txt /app/
WORKDIR /app
RUN pip3 install -r requirements.txt

# 애플리케이션 코드 복사
COPY src/ /app/src/
COPY config/ /app/config/

# 실행 권한 부여
RUN chmod +x /app/src/main.py

# 포트 노출
EXPOSE 4040 8080

# 실행 명령
CMD ["python3", "/app/src/main.py"]
```

### 2. Kubernetes Job 설정

```yaml
# kubernetes/spark-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: ecommerce-analysis-job
  namespace: data-engineering
spec:
  template:
    spec:
      containers:
      - name: spark-driver
        image: ecommerce-analysis:latest
        command: ["python3", "/app/src/main.py"]
        env:
        - name: SPARK_MASTER
          value: "k8s://https://kubernetes.default.svc.cluster.local:443"
        - name: SPARK_APP_NAME
          value: "ecommerce-analysis"
        - name: SPARK_DRIVER_HOST
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
        - name: SPARK_DRIVER_PORT
          value: "7077"
        - name: SPARK_UI_PORT
          value: "4040"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        volumeMounts:
        - name: data-volume
          mountPath: /data
        - name: config-volume
          mountPath: /app/config
      volumes:
      - name: data-volume
        persistentVolumeClaim:
          claimName: data-pvc
      - name: config-volume
        configMap:
          name: app-config
      restartPolicy: Never
  backoffLimit: 3
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
  namespace: data-engineering
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 100Gi
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: data-engineering
data:
  app_config.yaml: |
    data:
      input_path: "/data/input"
      output_path: "/data/output"
    processing:
      batch_size: 10000
      parallelism: 4
```

### 3. Spark Application 실행

```python
# src/main.py
import os
import sys
import logging
from pyspark.sql import SparkSession
from data_processing import EcommerceDataProcessor
from analytics import EcommerceAnalytics
from config.spark_config import get_spark_config

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
            .config(conf=get_spark_config()) \
            .getOrCreate()
        
        logger.info("Spark session created successfully")
        
        # 데이터 처리기 초기화
        processor = EcommerceDataProcessor(spark)
        analytics = EcommerceAnalytics(spark)
        
        # 데이터 경로 설정
        input_path = os.getenv("INPUT_PATH", "/data/input")
        output_path = os.getenv("OUTPUT_PATH", "/data/output")
        
        # 데이터 로드 및 처리
        logger.info("Loading data...")
        orders_df, products_df, customers_df = processor.load_data(input_path)
        
        logger.info("Cleaning data...")
        orders_clean, products_clean, customers_clean = processor.clean_data(
            orders_df, products_df, customers_df
        )
        
        logger.info("Enriching data...")
        enriched_df = processor.enrich_data(
            orders_clean, products_clean, customers_clean
        )
        
        # 분석 수행
        logger.info("Performing sales analysis...")
        daily_sales, product_sales = analytics.sales_analysis(enriched_df)
        
        logger.info("Performing customer analysis...")
        customer_patterns, rfm_analysis = analytics.customer_analysis(enriched_df)
        
        logger.info("Performing advanced analytics...")
        cohort_analysis, customer_product_matrix = analytics.advanced_analytics(enriched_df)
        
        # 결과 저장
        logger.info("Saving results...")
        enriched_df.write.mode("overwrite").parquet(f"{output_path}/enriched_data")
        daily_sales.write.mode("overwrite").parquet(f"{output_path}/daily_sales")
        product_sales.write.mode("overwrite").parquet(f"{output_path}/product_sales")
        customer_patterns.write.mode("overwrite").parquet(f"{output_path}/customer_patterns")
        rfm_analysis.write.mode("overwrite").parquet(f"{output_path}/rfm_analysis")
        
        logger.info("Job completed successfully!")
        
    except Exception as e:
        logger.error(f"Job failed with error: {str(e)}")
        sys.exit(1)
    
    finally:
        if 'spark' in locals():
            spark.stop()

if __name__ == "__main__":
    main()
```

## 🔄 Airflow 스케줄링

### Airflow DAG

```python
# kubernetes/airflow-dag.py
from datetime import datetime, timedelta
from airflow import DAG
from airflow.kubernetes import KubernetesPodOperator
from airflow.operators.dummy import DummyOperator
from airflow.operators.python import PythonOperator

# 기본 인수
default_args = {
    'owner': 'data-engineering',
    'depends_on_past': False,
    'start_date': datetime(2025, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

# DAG 정의
dag = DAG(
    'ecommerce_analysis_pipeline',
    default_args=default_args,
    description='전자상거래 데이터 분석 파이프라인',
    schedule_interval='0 2 * * *',  # 매일 오전 2시 실행
    catchup=False,
    tags=['ecommerce', 'spark', 'analytics'],
)

# 시작 작업
start_task = DummyOperator(
    task_id='start_pipeline',
    dag=dag,
)

# 데이터 검증 작업
def validate_input_data():
    import os
    input_path = "/data/input"
    required_files = ["orders", "products", "customers"]
    
    for file_name in required_files:
        file_path = f"{input_path}/{file_name}"
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Required file not found: {file_path}")
    
    print("Input data validation completed successfully")

validate_task = PythonOperator(
    task_id='validate_input_data',
    python_callable=validate_input_data,
    dag=dag,
)

# Spark 분석 작업
spark_analysis_task = KubernetesPodOperator(
    task_id='spark_ecommerce_analysis',
    namespace='data-engineering',
    image='ecommerce-analysis:latest',
    name='spark-analysis-pod',
    cmds=['python3', '/app/src/main.py'],
    env_vars={
        'INPUT_PATH': '/data/input',
        'OUTPUT_PATH': '/data/output',
        'SPARK_MASTER': 'k8s://https://kubernetes.default.svc.cluster.local:443',
        'SPARK_APP_NAME': 'ecommerce-analysis',
    },
    resources={
        'request_memory': '2Gi',
        'request_cpu': '1',
        'limit_memory': '4Gi',
        'limit_cpu': '2',
    },
    volumes=[
        {
            'name': 'data-volume',
            'persistentVolumeClaim': {
                'claimName': 'data-pvc'
            }
        }
    ],
    volume_mounts=[
        {
            'name': 'data-volume',
            'mountPath': '/data'
        }
    ],
    get_logs=True,
    is_delete_operator_pod=True,
    dag=dag,
)

# 결과 검증 작업
def validate_output_data():
    import os
    output_path = "/data/output"
    required_outputs = [
        "enriched_data",
        "daily_sales", 
        "product_sales",
        "customer_patterns",
        "rfm_analysis"
    ]
    
    for output_name in required_outputs:
        output_dir = f"{output_path}/{output_name}"
        if not os.path.exists(output_dir):
            raise FileNotFoundError(f"Output directory not found: {output_dir}")
        
        # 파일이 있는지 확인
        files = os.listdir(output_dir)
        if not files:
            raise ValueError(f"Output directory is empty: {output_dir}")
    
    print("Output data validation completed successfully")

validate_output_task = PythonOperator(
    task_id='validate_output_data',
    python_callable=validate_output_data,
    dag=dag,
)

# 알림 작업
def send_completion_notification():
    print("Ecommerce analysis pipeline completed successfully!")
    # 실제 환경에서는 Slack, Email 등으로 알림 전송
    # slack_webhook_url = os.getenv('SLACK_WEBHOOK_URL')
    # send_slack_notification(slack_webhook_url, "Pipeline completed successfully")

notification_task = PythonOperator(
    task_id='send_completion_notification',
    python_callable=send_completion_notification,
    dag=dag,
)

# 종료 작업
end_task = DummyOperator(
    task_id='end_pipeline',
    dag=dag,
)

# 작업 의존성 정의
start_task >> validate_task >> spark_analysis_task >> validate_output_task >> notification_task >> end_task
```

### 배포 스크립트

```bash
#!/bin/bash
# deploy.sh

echo "Building Docker image..."
docker build -t ecommerce-analysis:latest .

echo "Loading image to Kubernetes cluster..."
kind load docker-image ecommerce-analysis:latest

echo "Applying Kubernetes manifests..."
kubectl apply -f kubernetes/spark-job.yaml

echo "Deploying Airflow DAG..."
kubectl cp kubernetes/airflow-dag.py airflow-web-0:/opt/airflow/dags/

echo "Deployment completed!"
```

## 📚 학습 요약

### 이번 파트에서 학습한 내용

1. **UDF (User Defined Function)**
   - 기본 UDF 작성과 활용
   - 복잡한 UDF (JSON 파싱, ML 모델 적용)
   - UDF 최적화 기법

2. **고급 집계와 윈도우 함수**
   - 다양한 윈도우 함수 활용
   - 통계적 집계 함수
   - RFM 분석 등 고급 분석

3. **성능 최적화**
   - 파티셔닝 전략
   - 메모리 최적화 설정
   - 캐싱 전략

4. **실무 프로젝트**
   - 전자상거래 데이터 분석 시스템
   - 모듈화된 코드 구조
   - 에러 처리와 로깅

5. **프로덕션 배포**
   - Docker 컨테이너화
   - Kubernetes Job 배포
   - Airflow 스케줄링

### 핵심 기술 스택

| 기술 | 용도 | 중요도 |
|------|------|--------|
| **UDF** | 커스텀 데이터 변환 | ⭐⭐⭐⭐⭐ |
| **윈도우 함수** | 고급 분석 | ⭐⭐⭐⭐⭐ |
| **Docker** | 컨테이너화 | ⭐⭐⭐⭐ |
| **Kubernetes** | 오케스트레이션 | ⭐⭐⭐⭐ |
| **Airflow** | 워크플로우 관리 | ⭐⭐⭐⭐ |

### 다음 파트 미리보기

**Part 3: 실시간 스트리밍 처리**에서는 다음 내용을 다룹니다:
- Spark Streaming과 Structured Streaming
- Kafka 연동과 실시간 데이터 처리
- 워터마킹과 지연 데이터 처리
- 실시간 분석 대시보드 구축

---

**다음 파트**: [Part 3: 실시간 스트리밍 처리와 Kafka 연동](/data-engineering/2025/09/13/apache-spark-streaming.html)

---

*이제 대용량 배치 처리와 프로덕션 배포까지 마스터했습니다! 다음 파트에서는 실시간 스트리밍 처리의 세계로 들어가겠습니다.* 🚀
