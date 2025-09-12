---
layout: post
lang: en
title: "Part 3: Apache Spark Real-time Streaming Processing and Kafka Integration - Real-world Project"
description: "Build real-time data processing and analysis systems using Apache Spark Streaming, Structured Streaming, and Kafka integration."
date: 2025-09-12
author: Data Droid
category: data-engineering
tags: [Apache-Spark, Spark-Streaming, Kafka, Real-time-Processing, Streaming, Watermarking, Python]
series: apache-spark-complete-guide
series_order: 3
reading_time: "50 min"
difficulty: "Advanced"
---

# Part 3: Apache Spark Real-time Streaming Processing and Kafka Integration - Real-world Project

> Build real-time data processing and analysis systems using Apache Spark Streaming, Structured Streaming, and Kafka integration.

## 📖 Table of Contents

1. [Spark Streaming Basics](#spark-streaming-basics)
2. [Structured Streaming Complete Guide](#structured-streaming-complete-guide)
3. [Kafka Integration and Real-time Data Processing](#kafka-integration-and-real-time-data-processing)
4. [Watermarking and Late Data Processing](#watermarking-and-late-data-processing)
5. [Real-world Project: Real-time Log Analysis System](#real-world-project-real-time-log-analysis-system)
6. [Real-time Dashboard Construction](#real-time-dashboard-construction)
7. [Learning Summary](#learning-summary)

## 🔄 Spark Streaming Basics

### What is Spark Streaming?

Spark Streaming is an extension module of Spark that processes real-time data using **micro-batch** approach.

#### **Core Concepts**
- **DStream (Discretized Stream)**: Continuous data stream divided into small batches
- **Batch Interval**: Time interval for processing each batch
- **Checkpoint**: State storage for failure recovery

### Basic DStream Operations

```python
from pyspark import SparkContext
from pyspark.streaming import StreamingContext

# Create StreamingContext (5-second batch interval)
sc = SparkContext("local[2]", "StreamingExample")
ssc = StreamingContext(sc, 5)  # 5-second batch interval

# Create text stream (socket connection)
lines = ssc.socketTextStream("localhost", 9999)

# Basic transformation operations
words = lines.flatMap(lambda line: line.split(" "))
pairs = words.map(lambda word: (word, 1))
word_counts = pairs.reduceByKey(lambda x, y: x + y)

# Output
word_counts.pprint()

# Start streaming
ssc.start()
ssc.awaitTermination()
```

### Advanced DStream Operations

```python
# Window operations
windowed_counts = word_counts.reduceByKeyAndWindow(
    lambda x, y: x + y,  # reduce function
    lambda x, y: x - y,  # inverse reduce function
    30,  # window length (30 seconds)
    10   # sliding interval (10 seconds)
)

# Stateful operations
def update_function(new_values, running_count):
    if running_count is None:
        running_count = 0
    return sum(new_values, running_count)

running_counts = word_counts.updateStateByKey(update_function)

# Join operations
reference_data = sc.parallelize([("spark", "framework"), ("kafka", "broker")])
reference_dstream = ssc.queueStream([reference_data])
joined_stream = word_counts.transform(lambda rdd: rdd.join(reference_data))

# Output
windowed_counts.pprint()
running_counts.pprint()
joined_stream.pprint()
```

## 📊 Structured Streaming Complete Guide

### What is Structured Streaming?

Structured Streaming is a **high-level streaming API** based on the Spark SQL engine.

#### **Core Features**
- **Exactly-once processing**
- **Watermarking** support
- **Event Time** processing
- **Structured data** processing

### Basic Structured Streaming

```python
from pyspark.sql import SparkSession
from pyspark.sql.functions import *
from pyspark.sql.types import *

# Create SparkSession
spark = SparkSession.builder \
    .appName("StructuredStreamingExample") \
    .config("spark.sql.adaptive.enabled", "true") \
    .getOrCreate()

# Read streaming data
streaming_df = spark \
    .readStream \
    .format("socket") \
    .option("host", "localhost") \
    .option("port", 9999) \
    .load()

# Data transformation
words_df = streaming_df.select(
    explode(split(streaming_df.value, " ")).alias("word")
)

# Aggregation
word_counts = words_df.groupBy("word").count()

# Start streaming query
query = word_counts \
    .writeStream \
    .outputMode("complete") \
    .format("console") \
    .trigger(processingTime="10 seconds") \
    .start()

query.awaitTermination()
```

### Various Data Sources

```python
# 1. Kafka stream
kafka_df = spark \
    .readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "user-events") \
    .option("startingOffsets", "latest") \
    .load()

# 2. File stream
file_df = spark \
    .readStream \
    .format("json") \
    .option("path", "/path/to/streaming/data") \
    .option("maxFilesPerTrigger", 1) \
    .schema(schema) \
    .load()

# 3. Rate stream (for testing)
rate_df = spark \
    .readStream \
    .format("rate") \
    .option("rowsPerSecond", 100) \
    .load()
```

### Advanced Streaming Operations

```python
# Event time processing
from pyspark.sql.types import TimestampType

# Define schema
schema = StructType([
    StructField("timestamp", TimestampType(), True),
    StructField("user_id", StringType(), True),
    StructField("action", StringType(), True),
    StructField("value", DoubleType(), True)
])

# Read streaming data
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

# Event time-based window aggregation
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

# Output
query = windowed_events \
    .writeStream \
    .outputMode("append") \
    .format("console") \
    .option("truncate", False) \
    .start()
```

## 🔗 Kafka Integration and Real-time Data Processing

### Kafka Setup and Connection

```python
# Kafka producer setup
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

# Generate and send real-time data
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
        time.sleep(0.1)  # 100ms interval
    
    producer.close()

# Execute data generation
# generate_user_events()
```

### Reading Kafka Data in Spark

```python
# Read Kafka stream
kafka_df = spark \
    .readStream \
    .format("kafka") \
    .option("kafka.bootstrap.servers", "localhost:9092") \
    .option("subscribe", "user-events") \
    .option("startingOffsets", "earliest") \
    .option("failOnDataLoss", "false") \
    .load()

# JSON parsing
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

# Timestamp conversion
events_df = parsed_df.withColumn(
    "event_time", 
    from_unixtime(col("timestamp") / 1000).cast(TimestampType())
)
```

### Real-time Data Analysis

```python
# Real-time user activity analysis
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

# Real-time aggregation by action
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

# Anomaly detection (real-time)
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
    .filter(col("event_count") > 50)  # More than 50 events in 5 minutes

# Output setup
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

## 💧 Watermarking and Late Data Processing

### What is Watermarking?

Watermarking is a mechanism for processing **late data**.

#### **Watermarking Concepts**
- **Event Time**: Time when data actually occurred
- **Processing Time**: Time when data is processed in the system
- **Watermark**: Maximum delay time for receiving late data

### Watermarking Implementation

```python
# Window aggregation using watermarking
from pyspark.sql.functions import current_timestamp

# Set watermark (allow 10-minute delay from event time)
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

# Test late data
def test_late_data():
    """Function to simulate late data"""
    import time
    from datetime import datetime, timedelta
    
    producer = create_kafka_producer()
    
    # Normal data
    normal_event = {
        'timestamp': int(time.time() * 1000),
        'user_id': 'user_001',
        'action': 'click',
        'value': 10.0
    }
    
    # Late data (5 minutes ago)
    late_event = {
        'timestamp': int((time.time() - 300) * 1000),  # 5 minutes ago
        'user_id': 'user_002',
        'action': 'click',
        'value': 20.0
    }
    
    # Very late data (15 minutes ago)
    very_late_event = {
        'timestamp': int((time.time() - 900) * 1000),  # 15 minutes ago
        'user_id': 'user_003',
        'action': 'click',
        'value': 30.0
    }
    
    # Send data
    producer.send('user-events', key=normal_event['user_id'], value=normal_event)
    producer.send('user-events', key=late_event['user_id'], value=late_event)
    producer.send('user-events', key=very_late_event['user_id'], value=very_late_event)
    
    producer.close()

# Execute watermarking query
watermark_query = windowed_events_with_watermark \
    .writeStream \
    .outputMode("append") \
    .format("console") \
    .option("truncate", False) \
    .start()
```

### Late Data Processing Strategies

```python
# 1. Adaptive watermark
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

# 2. Separate late data processing
# Normal data
normal_data = events_df \
    .withWatermark("event_time", "5 minutes") \
    .filter(col("event_time") >= current_timestamp() - expr("INTERVAL 10 MINUTES"))

# Late data
late_data = events_df \
    .withWatermark("event_time", "5 minutes") \
    .filter(col("event_time") < current_timestamp() - expr("INTERVAL 10 MINUTES"))

# 3. Late data alerts
late_data_alert = late_data \
    .groupBy("user_id") \
    .agg(
        count("*").alias("late_event_count"),
        min("event_time").alias("earliest_late_event")
    ) \
    .filter(col("late_event_count") > 5)

# Late data alert query
late_alert_query = late_data_alert \
    .writeStream \
    .outputMode("update") \
    .format("console") \
    .option("truncate", False) \
    .start()
```

## 🛠️ Real-world Project: Real-time Log Analysis System

### Project Structure

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

### 1. Log Processor

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
        
        # Define log patterns
        self.log_patterns = {
            'apache': r'^(\S+) (\S+) (\S+) \[([\w:/]+\s[+\-]\d{4})\] "(\S+) (\S+) (\S+)" (\d{3}) (\S+)',
            'nginx': r'^(\S+) - (\S+) \[([\w:/]+\s[+\-]\d{4})\] "(\S+) (\S+) (\S+)" (\d{3}) (\S+) "([^"]*)" "([^"]*)"',
            'json': r'^{.*}$'
        }
    
    def parse_apache_log(self, log_line):
        """Parse Apache log"""
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
        """Parse JSON log"""
        try:
            return json.loads(log_line)
        except:
            return None
    
    def create_log_schema(self):
        """Define log schema"""
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
        """Process log stream"""
        # JSON parsing
        parsed_df = kafka_df.select(
            from_json(col("value").cast("string"), self.create_log_schema()).alias("data")
        ).select("data.*")
        
        # Data cleaning
        cleaned_df = parsed_df \
            .withColumn("timestamp", to_timestamp(col("timestamp"))) \
            .withColumn("response_time", col("response_time").cast(DoubleType())) \
            .withColumn("status_code", col("status_code").cast(IntegerType())) \
            .filter(col("timestamp").isNotNull())
        
        return cleaned_df
    
    def extract_metrics(self, logs_df):
        """Extract metrics from logs"""
        # Response time distribution
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
        
        # Error rate calculation
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
        
        # Request patterns by IP
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

### 2. Anomaly Detector

```python
# src/anomaly_detector.py
from pyspark.sql.functions import *
from pyspark.sql.window import Window
import numpy as np

class AnomalyDetector:
    def __init__(self, spark_session):
        self.spark = spark_session
    
    def detect_response_time_anomalies(self, metrics_df):
        """Detect response time anomalies"""
        # Calculate moving average and standard deviation
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
        """Detect error rate spikes"""
        window_spec = Window.partitionBy("service").orderBy("window")
        
        spike_df = error_rate_df \
            .withColumn("prev_error_rate", lag("error_rate", 1).over(window_spec)) \
            .withColumn("error_rate_change", 
                col("error_rate") - col("prev_error_rate")
            ) \
            .filter(col("error_rate_change") > 10)  # More than 10% increase
        
        return spike_df
    
    def detect_suspicious_ips(self, ip_patterns_df):
        """Detect suspicious IPs"""
        # High request frequency
        high_frequency = ip_patterns_df.filter(col("request_count") > 1000)
        
        # Multiple service usage
        multi_service = ip_patterns_df.filter(size(col("services_used")) > 5)
        
        # Combine suspicious patterns
        suspicious_ips = high_frequency.intersect(multi_service)
        
        return suspicious_ips
    
    def detect_ddos_attacks(self, logs_df):
        """Detect DDoS attacks"""
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

### 3. Metrics Calculator

```python
# src/metrics_calculator.py
from pyspark.sql.functions import *
from pyspark.sql.window import Window

class MetricsCalculator:
    def __init__(self, spark_session):
        self.spark = spark_session
    
    def calculate_sla_metrics(self, logs_df):
        """Calculate SLA metrics"""
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
        """Calculate business metrics"""
        # Activity by user
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
        
        # Service popularity
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
        """Calculate system health"""
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

### 4. Main Application

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
        # Create Spark session
        spark = SparkSession.builder \
            .appName("RealTimeLogAnalysis") \
            .config("spark.sql.adaptive.enabled", "true") \
            .config("spark.sql.adaptive.coalescePartitions.enabled", "true") \
            .config("spark.sql.streaming.checkpointLocation", "/tmp/checkpoint") \
            .getOrCreate()
        
        logger.info("Spark session created successfully")
        
        # Initialize components
        log_processor = LogProcessor(spark)
        anomaly_detector = AnomalyDetector(spark)
        metrics_calculator = MetricsCalculator(spark)
        
        # Read Kafka stream
        kafka_df = spark \
            .readStream \
            .format("kafka") \
            .option("kafka.bootstrap.servers", "localhost:9092") \
            .option("subscribe", "logs") \
            .option("startingOffsets", "latest") \
            .load()
        
        # Process logs
        processed_logs = log_processor.process_log_stream(kafka_df)
        
        # Calculate metrics
        response_metrics, error_rate, ip_patterns = log_processor.extract_metrics(processed_logs)
        sla_metrics = metrics_calculator.calculate_sla_metrics(processed_logs)
        user_activity, service_popularity = metrics_calculator.calculate_business_metrics(processed_logs)
        system_health = metrics_calculator.calculate_system_health(processed_logs)
        
        # Anomaly detection
        response_anomalies = anomaly_detector.detect_response_time_anomalies(response_metrics)
        error_spikes = anomaly_detector.detect_error_rate_spikes(error_rate)
        suspicious_ips = anomaly_detector.detect_suspicious_ips(ip_patterns)
        ddos_attacks = anomaly_detector.detect_ddos_attacks(processed_logs)
        
        # Start queries
        queries = []
        
        # Output metrics
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
        
        # Anomaly detection alerts
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
        
        # Wait for all queries
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

## 📊 Real-time Dashboard Construction

### Grafana Dashboard Setup

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

### Export Metrics to Prometheus

```python
# Metrics export function
def export_metrics_to_prometheus(metrics_df):
    """Export metrics to Prometheus"""
    import requests
    import time
    
    while True:
        # Collect latest metrics
        latest_metrics = metrics_df.collect()
        
        for metric in latest_metrics:
            # Convert to Prometheus metric format
            prometheus_metric = {
                'metric_name': 'spark_streaming_metric',
                'labels': {
                    'service': metric['service'],
                    'window': str(metric['window'])
                },
                'value': metric['avg_response_time'],
                'timestamp': int(time.time() * 1000)
            }
            
            # Send to Prometheus Pushgateway
            requests.post(
                'http://localhost:9091/metrics/job/spark_streaming',
                data=prometheus_metric
            )
        
        time.sleep(10)  # Send every 10 seconds
```

## 📚 Learning Summary

### What We Learned in This Part

1. **Spark Streaming Basics**
   - DStream and micro-batch processing
   - Basic transformation operations and window operations
   - Stateful operations

2. **Structured Streaming**
   - High-level streaming API
   - Event time processing
   - Various data sources

3. **Kafka Integration**
   - Kafka producer/consumer setup
   - Real-time data generation and processing
   - JSON parsing and schema handling

4. **Watermarking and Late Data**
   - Understanding watermarking mechanisms
   - Late data processing strategies
   - Adaptive watermarking

5. **Real-world Project**
   - Real-time log analysis system
   - Anomaly detection and alerts
   - Metrics calculation and monitoring

6. **Real-time Dashboard**
   - Grafana dashboard construction
   - Prometheus metrics export
   - Real-time monitoring

### Core Technology Stack

| Technology | Purpose | Importance |
|------------|---------|------------|
| **Spark Streaming** | Micro-batch processing | ⭐⭐⭐⭐ |
| **Structured Streaming** | High-level streaming | ⭐⭐⭐⭐⭐ |
| **Kafka** | Message broker | ⭐⭐⭐⭐⭐ |
| **Watermarking** | Late data processing | ⭐⭐⭐⭐ |
| **Grafana** | Real-time dashboard | ⭐⭐⭐⭐ |

### Next Part Preview

**Part 4: Monitoring and Performance Tuning** will cover:
- Spark UI and metrics analysis
- Performance monitoring and profiling
- Memory optimization and caching strategies
- Cluster tuning and scalability

---

**Next Part**: [Part 4: Monitoring and Performance Tuning](/en/data-engineering/2025/09/14/apache-spark-monitoring-tuning.html)

---

*You've now mastered real-time streaming processing! In the final part, we'll complete the series with performance tuning and monitoring.* 🚀
