---
layout: post
lang: en
title: "Part 2: Apache Spark Large-scale Batch Processing and UDF Usage - Real-world Project"
description: "Advanced batch processing techniques in Apache Spark, UDF writing, and production environment setup using Docker and Kubernetes."
date: 2025-09-12
author: Data Droid
category: data-engineering
tags: [Apache-Spark, UDF, Batch-Processing, Docker, Kubernetes, Airflow, Performance-Optimization, Python]
series: apache-spark-complete-guide
series_order: 2
reading_time: "45 min"
difficulty: "Advanced"
---

# Part 2: Apache Spark Large-scale Batch Processing and UDF Usage - Real-world Project

> Advanced batch processing techniques in Apache Spark, UDF writing, and production environment setup using Docker and Kubernetes.

## 📖 Table of Contents

1. [UDF (User Defined Function) Complete Guide](#udf-user-defined-function-complete-guide)
2. [Advanced Aggregation and Window Functions](#advanced-aggregation-and-window-functions)
3. [Partitioning Strategy and Performance Optimization](#partitioning-strategy-and-performance-optimization)
4. [Real-world Project: E-commerce Data Analysis](#real-world-project-e-commerce-data-analysis)
5. [Docker and Kubernetes Deployment](#docker-and-kubernetes-deployment)
6. [Airflow Scheduling](#airflow-scheduling)
7. [Learning Summary](#learning-summary)

## 🔧 UDF (User Defined Function) Complete Guide

### What is UDF?

UDF is a method to write custom functions that are not provided by Spark for data transformation.

### UDF Writing Methods

#### **1. Basic UDF Writing**

```python
from pyspark.sql.functions import udf
from pyspark.sql.types import StringType, IntegerType, FloatType, BooleanType

# Simple string processing UDF
@udf(returnType=StringType())
def clean_text(text):
    if text is None:
        return None
    return text.strip().lower().replace("  ", " ")

# Mathematical calculation UDF
@udf(returnType=FloatType())
def calculate_discount(price, discount_rate):
    if price is None or discount_rate is None:
        return None
    return float(price * (1 - discount_rate))

# Conditional processing UDF
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

# Usage example
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

#### **2. Complex UDF - JSON Parsing**

```python
from pyspark.sql.types import MapType, StringType
import json

@udf(returnType=MapType(StringType(), StringType()))
def parse_json_metadata(json_str):
    try:
        if json_str is None:
            return {}
        data = json.loads(json_str)
        # Convert to strings for return
        return {str(k): str(v) for k, v in data.items()}
    except:
        return {}

# Usage example
json_data = spark.createDataFrame([
    ('{"category": "electronics", "brand": "Samsung", "rating": 4.5}'),
    ('{"category": "clothing", "brand": "Nike", "rating": 4.2}'),
    ('invalid json')
], ["metadata"])

json_data.withColumn("parsed_metadata", parse_json_metadata("metadata")).show(truncate=False)
```

#### **3. Advanced UDF - Machine Learning Model Application**

```python
from pyspark.sql.types import ArrayType, FloatType
import numpy as np
from sklearn.ensemble import IsolationForest

# Global model variable
model = None

def initialize_model():
    global model
    # Initialize simple anomaly detection model
    model = IsolationForest(contamination=0.1, random_state=42)
    # Train with dummy data
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

# Usage example
features_data = spark.createDataFrame([
    ([1.2, 3.4, 2.1],),
    ([10.5, 15.2, 8.9],),
    ([0.1, 0.3, 0.2],)
], ["features"])

features_data.withColumn("anomaly_score", anomaly_score("features")).show()
```

### UDF Optimization Tips

#### **1. Using Vectorized UDF**

```python
import pandas as pd
from pyspark.sql.functions import pandas_udf
from pyspark.sql.types import FloatType

# Pandas UDF provides faster performance
@pandas_udf(returnType=FloatType())
def fast_calculation(series: pd.Series) -> pd.Series:
    # Vectorized operations for performance improvement
    return series * 2 + 1

# Usage
df.withColumn("fast_result", fast_calculation("value")).show()
```

#### **2. UDF Caching and Reuse**

```python
# Define UDF as function for reuse
def create_text_processor():
    @udf(returnType=StringType())
    def process_text(text):
        return text.upper() if text else None
    return process_text

# Reuse across multiple DataFrames
text_processor = create_text_processor()
df1.withColumn("processed", text_processor("text1")).show()
df2.withColumn("processed", text_processor("text2")).show()
```

## 📊 Advanced Aggregation and Window Functions

### Advanced Window Functions

```python
from pyspark.sql.window import Window
from pyspark.sql.functions import (
    row_number, rank, dense_rank, lag, lead, 
    first_value, last_value, nth_value,
    cume_dist, percent_rank, ntile
)

# Define complex window specification
window_spec = Window.partitionBy("category").orderBy("sales_amount")

# Apply various window functions
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

### Advanced Aggregation Functions

```python
from pyspark.sql.functions import (
    collect_list, collect_set, array_agg,
    stddev, variance, skewness, kurtosis,
    corr, covar_pop, covar_samp
)

# Statistical aggregation
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

## ⚡ Partitioning Strategy and Performance Optimization

### Partitioning Strategy

```python
# 1. Column-based partitioning
df.write.mode("overwrite") \
    .partitionBy("year", "month") \
    .parquet("path/to/partitioned_data")

# 2. Bucketing
df.write.mode("overwrite") \
    .bucketBy(10, "user_id") \
    .sortBy("timestamp") \
    .saveAsTable("bucketed_table")

# 3. Dynamic partitioning
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.advisoryPartitionSizeInBytes", "128MB")
```

### Performance Optimization Settings

```python
# Memory optimization
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
spark.conf.set("spark.sql.adaptive.skewJoin.enabled", "true")

# Caching strategy
df.cache()  # Memory caching
df.persist(StorageLevel.MEMORY_AND_DISK)  # Memory+disk caching

# Broadcast join
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", "10MB")
```

## 🛒 Real-world Project: E-commerce Data Analysis

### Project Structure

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

### 1. Data Processing Module

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
        """Load data"""
        self.logger.info(f"Loading data from {data_path}")
        
        # Load from various data sources
        orders_df = self.spark.read.parquet(f"{data_path}/orders")
        products_df = self.spark.read.parquet(f"{data_path}/products")
        customers_df = self.spark.read.parquet(f"{data_path}/customers")
        
        return orders_df, products_df, customers_df
    
    def clean_data(self, orders_df, products_df, customers_df):
        """Clean data"""
        self.logger.info("Cleaning data...")
        
        # Remove duplicates
        orders_clean = orders_df.dropDuplicates(["order_id"])
        products_clean = products_df.dropDuplicates(["product_id"])
        customers_clean = customers_df.dropDuplicates(["customer_id"])
        
        # Handle NULL values
        orders_clean = orders_clean.fillna({"quantity": 1, "discount": 0})
        products_clean = products_clean.fillna({"price": 0, "category": "Unknown"})
        
        return orders_clean, products_clean, customers_clean
    
    def enrich_data(self, orders_df, products_df, customers_df):
        """Enrich data"""
        self.logger.info("Enriching data...")
        
        # Data enrichment through joins
        enriched_df = orders_df \
            .join(products_df, "product_id", "left") \
            .join(customers_df, "customer_id", "left")
        
        # Add calculated columns
        enriched_df = enriched_df.withColumn(
            "total_amount", 
            col("quantity") * col("price") * (1 - col("discount"))
        )
        
        # Customer tier calculation UDF
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
        
        # Calculate total purchase amount by customer
        customer_totals = enriched_df.groupBy("customer_id") \
            .agg(sum("total_amount").alias("total_spent"))
        
        enriched_df = enriched_df.join(customer_totals, "customer_id", "left") \
            .withColumn("customer_tier", calculate_customer_tier("total_spent"))
        
        return enriched_df
```

### 2. Advanced Analytics Module

```python
# src/analytics.py
from pyspark.sql.functions import *
from pyspark.sql.window import Window
import pandas as pd

class EcommerceAnalytics:
    def __init__(self, spark_session):
        self.spark = spark_session
    
    def sales_analysis(self, df):
        """Sales analysis"""
        # Daily sales trend
        daily_sales = df.groupBy("order_date") \
            .agg(
                sum("total_amount").alias("daily_revenue"),
                countDistinct("customer_id").alias("daily_customers"),
                avg("total_amount").alias("avg_order_value")
            ) \
            .orderBy("order_date")
        
        # Sales analysis by product
        product_sales = df.groupBy("product_id", "product_name", "category") \
            .agg(
                sum("quantity").alias("total_quantity"),
                sum("total_amount").alias("total_revenue"),
                countDistinct("customer_id").alias("unique_customers")
            ) \
            .orderBy(desc("total_revenue"))
        
        return daily_sales, product_sales
    
    def customer_analysis(self, df):
        """Customer analysis"""
        # Purchase patterns by customer
        customer_patterns = df.groupBy("customer_id", "customer_tier") \
            .agg(
                count("*").alias("total_orders"),
                sum("total_amount").alias("total_spent"),
                avg("total_amount").alias("avg_order_value"),
                min("order_date").alias("first_purchase"),
                max("order_date").alias("last_purchase")
            )
        
        # RFM analysis (Recency, Frequency, Monetary)
        rfm_analysis = df.groupBy("customer_id") \
            .agg(
                datediff(current_date(), max("order_date")).alias("recency"),
                count("*").alias("frequency"),
                sum("total_amount").alias("monetary")
            )
        
        return customer_patterns, rfm_analysis
    
    def advanced_analytics(self, df):
        """Advanced analytics"""
        # Cohort analysis
        cohort_analysis = df.select("customer_id", "order_date") \
            .withColumn("cohort_month", date_format("order_date", "yyyy-MM")) \
            .groupBy("cohort_month") \
            .agg(countDistinct("customer_id").alias("cohort_size"))
        
        # Collaborative filtering foundation for product recommendation
        window_spec = Window.partitionBy("customer_id").orderBy(desc("order_date"))
        
        customer_product_matrix = df.select("customer_id", "product_id", "total_amount") \
            .withColumn("rank", row_number().over(window_spec)) \
            .filter(col("rank") <= 10)  # Recent 10 purchased products
        
        return cohort_analysis, customer_product_matrix
```

### 3. Configuration Files

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

## 🐳 Docker and Kubernetes Deployment

### 1. Dockerfile

```dockerfile
# Dockerfile
FROM openjdk:8-jdk-alpine

# Install Python
RUN apk add --no-cache python3 py3-pip

# Install Spark
ENV SPARK_VERSION=3.4.0
ENV HADOOP_VERSION=3
ENV SPARK_HOME=/opt/spark
ENV PATH=$PATH:$SPARK_HOME/bin

RUN wget -q https://archive.apache.org/dist/spark/spark-${SPARK_VERSION}/spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz && \
    tar xzf spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz && \
    mv spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION} ${SPARK_HOME} && \
    rm spark-${SPARK_VERSION}-bin-hadoop${HADOOP_VERSION}.tgz

# Install Python dependencies
COPY requirements.txt /app/
WORKDIR /app
RUN pip3 install -r requirements.txt

# Copy application code
COPY src/ /app/src/
COPY config/ /app/config/

# Grant execution permission
RUN chmod +x /app/src/main.py

# Expose ports
EXPOSE 4040 8080

# Execute command
CMD ["python3", "/app/src/main.py"]
```

### 2. Kubernetes Job Configuration

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

### 3. Spark Application Execution

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
        # Create Spark session
        spark = SparkSession.builder \
            .config(conf=get_spark_config()) \
            .getOrCreate()
        
        logger.info("Spark session created successfully")
        
        # Initialize data processor
        processor = EcommerceDataProcessor(spark)
        analytics = EcommerceAnalytics(spark)
        
        # Set data paths
        input_path = os.getenv("INPUT_PATH", "/data/input")
        output_path = os.getenv("OUTPUT_PATH", "/data/output")
        
        # Load and process data
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
        
        # Perform analysis
        logger.info("Performing sales analysis...")
        daily_sales, product_sales = analytics.sales_analysis(enriched_df)
        
        logger.info("Performing customer analysis...")
        customer_patterns, rfm_analysis = analytics.customer_analysis(enriched_df)
        
        logger.info("Performing advanced analytics...")
        cohort_analysis, customer_product_matrix = analytics.advanced_analytics(enriched_df)
        
        # Save results
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

## 🔄 Airflow Scheduling

### Airflow DAG

```python
# kubernetes/airflow-dag.py
from datetime import datetime, timedelta
from airflow import DAG
from airflow.kubernetes import KubernetesPodOperator
from airflow.operators.dummy import DummyOperator
from airflow.operators.python import PythonOperator

# Default arguments
default_args = {
    'owner': 'data-engineering',
    'depends_on_past': False,
    'start_date': datetime(2025, 1, 1),
    'email_on_failure': True,
    'email_on_retry': False,
    'retries': 3,
    'retry_delay': timedelta(minutes=5),
}

# Define DAG
dag = DAG(
    'ecommerce_analysis_pipeline',
    default_args=default_args,
    description='E-commerce data analysis pipeline',
    schedule_interval='0 2 * * *',  # Run daily at 2 AM
    catchup=False,
    tags=['ecommerce', 'spark', 'analytics'],
)

# Start task
start_task = DummyOperator(
    task_id='start_pipeline',
    dag=dag,
)

# Data validation task
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

# Spark analysis task
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

# Output validation task
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
        
        # Check if files exist
        files = os.listdir(output_dir)
        if not files:
            raise ValueError(f"Output directory is empty: {output_dir}")
    
    print("Output data validation completed successfully")

validate_output_task = PythonOperator(
    task_id='validate_output_data',
    python_callable=validate_output_data,
    dag=dag,
)

# Notification task
def send_completion_notification():
    print("Ecommerce analysis pipeline completed successfully!")
    # In real environment, send notifications via Slack, Email, etc.
    # slack_webhook_url = os.getenv('SLACK_WEBHOOK_URL')
    # send_slack_notification(slack_webhook_url, "Pipeline completed successfully")

notification_task = PythonOperator(
    task_id='send_completion_notification',
    python_callable=send_completion_notification,
    dag=dag,
)

# End task
end_task = DummyOperator(
    task_id='end_pipeline',
    dag=dag,
)

# Define task dependencies
start_task >> validate_task >> spark_analysis_task >> validate_output_task >> notification_task >> end_task
```

### Deployment Script

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

## 📚 Learning Summary

### What We Learned in This Part

1. **UDF (User Defined Function)**
   - Basic UDF writing and usage
   - Complex UDF (JSON parsing, ML model application)
   - UDF optimization techniques

2. **Advanced Aggregation and Window Functions**
   - Various window function usage
   - Statistical aggregation functions
   - Advanced analysis like RFM analysis

3. **Performance Optimization**
   - Partitioning strategies
   - Memory optimization settings
   - Caching strategies

4. **Real-world Project**
   - E-commerce data analysis system
   - Modularized code structure
   - Error handling and logging

5. **Production Deployment**
   - Docker containerization
   - Kubernetes Job deployment
   - Airflow scheduling

### Core Technology Stack

| Technology | Purpose | Importance |
|------------|---------|------------|
| **UDF** | Custom data transformation | ⭐⭐⭐⭐⭐ |
| **Window Functions** | Advanced analysis | ⭐⭐⭐⭐⭐ |
| **Docker** | Containerization | ⭐⭐⭐⭐ |
| **Kubernetes** | Orchestration | ⭐⭐⭐⭐ |
| **Airflow** | Workflow management | ⭐⭐⭐⭐ |

### Next Part Preview

**Part 3: Real-time Streaming Processing** will cover:
- Spark Streaming and Structured Streaming
- Kafka integration and real-time data processing
- Watermarking and late data processing
- Real-time analysis dashboard construction

---

**Next Part**: [Part 3: Real-time Streaming Processing and Kafka Integration](/en/data-engineering/2025/09/13/apache-spark-streaming.html)

---

*You've now mastered large-scale batch processing and production deployment! In the next part, we'll enter the world of real-time streaming processing.* 🚀
