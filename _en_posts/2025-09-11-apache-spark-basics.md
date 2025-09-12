---
layout: post
lang: en
title: "Part 1: Apache Spark Basics and Core Concepts - From RDD to DataFrame"
description: "Learn Apache Spark's basic structure and core concepts including RDD, DataFrame, and Spark SQL through hands-on practice."
date: 2025-09-11
author: Data Droid
category: data-engineering
tags: [Apache-Spark, RDD, DataFrame, Spark-SQL, Big-Data-Processing, Python, PySpark]
series: apache-spark-complete-guide
series_order: 1
reading_time: "30 min"
difficulty: "Intermediate"
---

# Part 1: Apache Spark Basics and Core Concepts - From RDD to DataFrame

> Learn Apache Spark's basic structure and core concepts including RDD, DataFrame, and Spark SQL through hands-on practice.

## 📖 Table of Contents

1. [Understanding Spark Architecture](#understanding-spark-architecture)
2. [RDD (Resilient Distributed Dataset)](#rdd-resilient-distributed-dataset)
3. [DataFrame and Dataset](#dataframe-and-dataset)
4. [Spark SQL](#spark-sql)
5. [Hands-on: Basic Data Processing](#hands-on-basic-data-processing)
6. [Learning Summary](#learning-summary)

## 🏗️ Understanding Spark Architecture

### Core Components

Apache Spark is a unified analytics engine for large-scale data processing. It consists of the following core components:

#### **1. Driver Program**
- **Role**: Executes the main function of the application
- **Function**: Creates SparkContext, schedules tasks, collects results
- **Location**: Runs on client node

#### **2. Cluster Manager**
- **Standalone**: Spark's own cluster manager
- **YARN**: Resource manager in Hadoop ecosystem
- **Mesos**: General-purpose cluster manager
- **Kubernetes**: Container orchestration

#### **3. Worker Node**
- **Executor**: JVM process that performs actual work
- **Task**: Individual work unit executed in executor
- **Cache**: Memory-based data storage

### SparkContext and SparkSession

```python
from pyspark import SparkContext, SparkConf
from pyspark.sql import SparkSession

# Create SparkContext (for RDD)
conf = SparkConf().setAppName("MyApp").setMaster("local[*]")
sc = SparkContext(conf=conf)

# Create SparkSession (for DataFrame/SQL)
spark = SparkSession.builder \
    .appName("MyApp") \
    .master("local[*]") \
    .config("spark.sql.adaptive.enabled", "true") \
    .getOrCreate()

# Access SparkContext
sc_from_session = spark.sparkContext
```

## 🔄 RDD (Resilient Distributed Dataset)

### What is RDD?

RDD is Spark's fundamental data abstraction. It is an **immutable**, **distributed**, and **resilient** dataset.

#### **RDD Characteristics**
1. **Immutability**: Cannot be modified after creation, creates new RDDs through transformations
2. **Distributed**: Stored across multiple nodes
3. **Resilient**: Automatic recovery from failures (based on Lineage)
4. **Lazy Evaluation**: Delays actual computation until Action is called

### RDD Creation Methods

```python
# 1. Create RDD from collection
data = [1, 2, 3, 4, 5]
rdd = sc.parallelize(data, numSlices=4)  # Split into 4 partitions

# 2. Create RDD from external files
rdd_text = sc.textFile("hdfs://path/to/file.txt")
rdd_csv = sc.textFile("hdfs://path/to/file.csv")

# 3. Transform from another RDD
rdd_transformed = rdd.map(lambda x: x * 2)
```

### Basic RDD Operations

#### **Transformation**
```python
# Map: Apply function to each element
rdd = sc.parallelize([1, 2, 3, 4, 5])
doubled = rdd.map(lambda x: x * 2)
print(doubled.collect())  # [2, 4, 6, 8, 10]

# Filter: Select elements that meet condition
evens = rdd.filter(lambda x: x % 2 == 0)
print(evens.collect())  # [2, 4]

# FlatMap: Expand each element to multiple elements
words = sc.parallelize(["hello world", "spark tutorial"])
word_list = words.flatMap(lambda x: x.split(" "))
print(word_list.collect())  # ['hello', 'world', 'spark', 'tutorial']

# Distinct: Remove duplicates
data = [1, 2, 2, 3, 3, 3]
rdd = sc.parallelize(data)
unique = rdd.distinct()
print(unique.collect())  # [1, 2, 3]
```

#### **Action**
```python
# Collect: Collect all data to driver
rdd = sc.parallelize([1, 2, 3, 4, 5])
result = rdd.collect()
print(result)  # [1, 2, 3, 4, 5]

# Count: Return number of elements
count = rdd.count()
print(count)  # 5

# First: Return first element
first = rdd.first()
print(first)  # 1

# Take: Return first n elements
first_three = rdd.take(3)
print(first_three)  # [1, 2, 3]

# Reduce: Reduce elements to one
sum_result = rdd.reduce(lambda x, y: x + y)
print(sum_result)  # 15

# Fold: Reduce with initial value
sum_with_zero = rdd.fold(0, lambda x, y: x + y)
print(sum_with_zero)  # 15
```

### Advanced RDD Operations

#### **Grouping and Aggregation**
```python
# GroupByKey: Group by key
data = [("apple", 1), ("banana", 2), ("apple", 3), ("banana", 4)]
rdd = sc.parallelize(data)
grouped = rdd.groupByKey()
print(grouped.mapValues(list).collect())
# [('apple', [1, 3]), ('banana', [2, 4])]

# ReduceByKey: Reduce values by key
reduced = rdd.reduceByKey(lambda x, y: x + y)
print(reduced.collect())  # [('apple', 4), ('banana', 6)]

# AggregateByKey: Complex aggregation
# Initial value, sequence function, combine function
aggregated = rdd.aggregateByKey(
    (0, 0),  # Initial value: (sum, count)
    lambda acc, val: (acc[0] + val, acc[1] + 1),  # Sequence function
    lambda acc1, acc2: (acc1[0] + acc2[0], acc1[1] + acc2[1])  # Combine function
)
print(aggregated.collect())
# [('apple', (4, 2)), ('banana', (6, 2))]
```

#### **Join Operations**
```python
# Create two RDDs
rdd1 = sc.parallelize([("apple", 1), ("banana", 2)])
rdd2 = sc.parallelize([("apple", "red"), ("banana", "yellow")])

# Inner Join
inner_join = rdd1.join(rdd2)
print(inner_join.collect())
# [('apple', (1, 'red')), ('banana', (2, 'yellow'))]

# Left Outer Join
left_join = rdd1.leftOuterJoin(rdd2)
print(left_join.collect())
# [('apple', (1, 'red')), ('banana', (2, 'yellow'))]

# Cartesian Product
cartesian = rdd1.cartesian(rdd2)
print(cartesian.collect())
# [('apple', ('apple', 'red')), ('apple', ('banana', 'yellow')), ...]
```

## 📊 DataFrame and Dataset

### DataFrame Introduction

DataFrame is an evolved form of RDD that can efficiently process **structured data**.

#### **DataFrame Advantages**
1. **Optimized Execution**: Catalyst Optimizer optimizes queries
2. **Schema Information**: Includes column type and name information
3. **Rich API**: Supports SQL, Python, Scala, R
4. **Memory Efficiency**: Memory optimization with Tungsten engine

### DataFrame Creation

```python
# 1. Create DataFrame from RDD
from pyspark.sql.types import StructType, StructField, StringType, IntegerType

# Define schema
schema = StructType([
    StructField("name", StringType(), True),
    StructField("age", IntegerType(), True),
    StructField("city", StringType(), True)
])

# Create data
data = [("Alice", 25, "Seoul"), ("Bob", 30, "Busan"), ("Charlie", 35, "Seoul")]
rdd = sc.parallelize(data)
df = spark.createDataFrame(rdd, schema)
df.show()

# 2. Create DataFrame directly
df = spark.createDataFrame([
    ("Alice", 25, "Seoul"),
    ("Bob", 30, "Busan"),
    ("Charlie", 35, "Seoul")
], ["name", "age", "city"])

# 3. Load from external files
df_csv = spark.read.csv("path/to/file.csv", header=True, inferSchema=True)
df_json = spark.read.json("path/to/file.json")
df_parquet = spark.read.parquet("path/to/file.parquet")
```

### Basic DataFrame Operations

```python
# Basic information
df.printSchema()  # Print schema
df.show()  # Show data
df.show(5)  # Show first 5 rows
df.count()  # Row count
df.columns  # Column list
df.dtypes  # Column types

# Column selection
df.select("name", "age").show()
df.select(df.name, df.age + 1).show()

# Conditional filtering
df.filter(df.age > 25).show()
df.filter("age > 25").show()  # SQL style

# Sorting
df.orderBy("age").show()
df.orderBy(df.age.desc()).show()

# Grouping and aggregation
df.groupBy("city").count().show()
df.groupBy("city").agg({"age": "avg", "name": "count"}).show()
```

### Advanced DataFrame Operations

#### **Window Functions**
```python
from pyspark.sql.window import Window
from pyspark.sql.functions import row_number, rank, dense_rank, lag, lead

# Define window
window_spec = Window.partitionBy("city").orderBy("age")

# Apply window functions
df.withColumn("row_num", row_number().over(window_spec)) \
  .withColumn("rank", rank().over(window_spec)) \
  .withColumn("dense_rank", dense_rank().over(window_spec)) \
  .withColumn("prev_age", lag("age", 1).over(window_spec)) \
  .withColumn("next_age", lead("age", 1).over(window_spec)) \
  .show()
```

#### **Join Operations**
```python
# Create two DataFrames
df1 = spark.createDataFrame([(1, "Alice"), (2, "Bob")], ["id", "name"])
df2 = spark.createDataFrame([(1, "Engineer"), (2, "Manager")], ["id", "job"])

# Inner Join
df1.join(df2, "id").show()

# Left Join
df1.join(df2, "id", "left").show()

# Cross Join
df1.crossJoin(df2).show()
```

## 🔍 Spark SQL

### Spark SQL Introduction

Spark SQL is a Spark module for structured data processing. It integrates SQL queries with DataFrame API.

### Creating Table Views

```python
# Register DataFrame as temporary view
df.createOrReplaceTempView("people")

# Execute SQL query
result = spark.sql("""
    SELECT city, COUNT(*) as count, AVG(age) as avg_age
    FROM people
    WHERE age > 25
    GROUP BY city
    ORDER BY count DESC
""")
result.show()
```

### Advanced SQL Features

```python
# Complex query example
spark.sql("""
    SELECT 
        name,
        age,
        city,
        ROW_NUMBER() OVER (PARTITION BY city ORDER BY age DESC) as rank_in_city,
        AVG(age) OVER (PARTITION BY city) as avg_age_in_city
    FROM people
    WHERE age > 20
""").show()

# Using CTE (Common Table Expression)
spark.sql("""
    WITH city_stats AS (
        SELECT city, COUNT(*) as count, AVG(age) as avg_age
        FROM people
        GROUP BY city
    )
    SELECT p.name, p.age, p.city, cs.avg_age
    FROM people p
    JOIN city_stats cs ON p.city = cs.city
    WHERE p.age > cs.avg_age
""").show()
```

## 🛠️ Hands-on: Basic Data Processing

### Practice 1: Log Data Analysis

```python
# Create log data
log_data = [
    "2025-09-11 10:30:45 INFO User login successful user_id=12345",
    "2025-09-11 10:31:12 ERROR Database connection failed",
    "2025-09-11 10:31:45 INFO User login successful user_id=67890",
    "2025-09-11 10:32:01 WARN High memory usage detected",
    "2025-09-11 10:32:15 INFO User logout user_id=12345"
]

# Analyze logs with RDD
rdd_logs = sc.parallelize(log_data)

# Statistics by log level
log_levels = rdd_logs.map(lambda line: line.split()[2])  # Extract log level
level_counts = log_levels.map(lambda level: (level, 1)).reduceByKey(lambda x, y: x + y)
print("Statistics by log level:")
for level, count in level_counts.collect():
    print(f"{level}: {count}")

# Filter only error logs
error_logs = rdd_logs.filter(lambda line: "ERROR" in line)
print("\nError logs:")
error_logs.foreach(print)
```

### Practice 2: Structured Data Processing

```python
# Create sales data
sales_data = [
    ("2025-09-11", "Alice", "Laptop", 1200, "Seoul"),
    ("2025-09-11", "Bob", "Mouse", 25, "Busan"),
    ("2025-09-11", "Charlie", "Keyboard", 80, "Seoul"),
    ("2025-09-12", "Alice", "Monitor", 300, "Seoul"),
    ("2025-09-12", "Bob", "Laptop", 1200, "Busan"),
    ("2025-09-12", "David", "Headphone", 150, "Daegu")
]

# Create DataFrame
df_sales = spark.createDataFrame(sales_data, ["date", "customer", "product", "price", "city"])
df_sales.show()

# Calculate total purchase amount by customer
customer_total = df_sales.groupBy("customer") \
    .agg({"price": "sum"}) \
    .withColumnRenamed("sum(price)", "total_spent") \
    .orderBy("total_spent", ascending=False)
customer_total.show()

# Average purchase amount by city
city_avg = df_sales.groupBy("city") \
    .agg({"price": "avg"}) \
    .withColumnRenamed("avg(price)", "avg_price") \
    .orderBy("avg_price", ascending=False)
city_avg.show()

# High-value product customers (1000 or more)
high_value_customers = df_sales.filter(df_sales.price >= 1000) \
    .select("customer", "product", "price") \
    .distinct()
high_value_customers.show()
```

### Practice 3: Complex Analysis

```python
# Advanced analysis using window functions
from pyspark.sql.window import Window
from pyspark.sql.functions import row_number, rank, lag, sum as spark_sum

# Purchase ranking by customer (by city)
window_spec = Window.partitionBy("city").orderBy(df_sales.price.desc())

df_ranked = df_sales.withColumn("rank_in_city", rank().over(window_spec)) \
    .withColumn("row_number_in_city", row_number().over(window_spec))

print("Purchase ranking by city:")
df_ranked.show()

# Calculate cumulative purchase amount by customer
window_cumulative = Window.partitionBy("customer").orderBy("date")

df_cumulative = df_sales.withColumn("cumulative_spent", 
    spark_sum("price").over(window_cumulative))

print("\nCumulative purchase amount by customer:")
df_cumulative.show()

# Purchase amount change compared to previous day
window_lag = Window.partitionBy("customer").orderBy("date")

df_with_lag = df_sales.withColumn("prev_day_total", 
    lag(spark_sum("price").over(window_lag), 1).over(window_lag))

print("\nPurchase amount change compared to previous day:")
df_with_lag.show()
```

## 📚 Learning Summary

### What We Learned in This Part

1. **Understanding Spark Architecture**
   - Driver, Cluster Manager, Worker Node
   - SparkContext and SparkSession

2. **RDD (Resilient Distributed Dataset)**
   - RDD characteristics and creation methods
   - Transformation and Action operations
   - Advanced operations (grouping, joins)

3. **DataFrame and Dataset**
   - Structured data processing
   - Window functions and join operations
   - Optimized execution engine

4. **Spark SQL**
   - Integration of SQL queries and DataFrame API
   - Writing complex analysis queries

5. **Practice Projects**
   - Log data analysis
   - Structured data processing
   - Advanced analysis techniques

### Key Concepts Summary

| Concept | Description | Importance |
|---------|-------------|------------|
| **RDD** | Basic abstraction of distributed dataset | ⭐⭐⭐⭐ |
| **DataFrame** | Structured data processing | ⭐⭐⭐⭐⭐ |
| **Spark SQL** | SQL-based analysis | ⭐⭐⭐⭐ |
| **Transformation/Action** | Lazy evaluation model | ⭐⭐⭐⭐⭐ |

### Next Part Preview

**Part 2: Large-scale Batch Processing** will cover:
- Writing UDF (User Defined Function)
- Advanced aggregation and window functions
- Partitioning strategies and performance optimization
- Practical project: Large-scale data processing

---

**Next Part**: [Part 2: Large-scale Batch Processing and UDF Usage](/en/data-engineering/2025/09/12/apache-spark-batch-processing.html)

---

*You've now mastered Spark basics! In the next part, we'll learn more advanced techniques.* 🚀
