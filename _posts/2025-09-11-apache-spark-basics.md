---
layout: post
lang: ko
title: "Part 1: Apache Spark 기초와 핵심 개념 - RDD부터 DataFrame까지"
description: "Apache Spark의 기본 구조와 핵심 개념인 RDD, DataFrame, Spark SQL을 학습하고 실습해봅니다."
date: 2025-09-11
author: Data Droid
category: data-engineering
tags: [Apache-Spark, RDD, DataFrame, Spark-SQL, 빅데이터처리, Python, PySpark]
series: apache-spark-complete-guide
series_order: 1
reading_time: "30분"
difficulty: "중급"
---

# Part 1: Apache Spark 기초와 핵심 개념 - RDD부터 DataFrame까지

> Apache Spark의 기본 구조와 핵심 개념인 RDD, DataFrame, Spark SQL을 학습하고 실습해봅니다.

## 📋 목차 {#목차}

1. [Spark 아키텍처 이해](#spark-아키텍처-이해)
2. [RDD (Resilient Distributed Dataset)](#rdd-resilient-distributed-dataset)
3. [DataFrame과 Dataset](#dataframe과-dataset)
4. [Spark SQL](#spark-sql)
5. [실습: 기본 데이터 처리](#실습-기본-데이터-처리)
6. [학습 요약](#학습-요약)

## 🏗 ️ Spark 아키텍처 이해 {#spark-아키텍처-이해}

### 핵심 컴포넌트

Apache Spark는 분산 컴퓨팅을 위한 통합 분석 엔진입니다. 다음과 같은 핵심 컴포넌트로 구성됩니다:

#### **1. Driver Program**
- **역할**: 애플리케이션의 메인 함수 실행
- **기능**: SparkContext 생성, 작업 스케줄링, 결과 수집
- **위치**: 클라이언트 노드에서 실행

#### **2. Cluster Manager**
- **Standalone**: Spark 자체 클러스터 매니저
- **YARN**: Hadoop 생태계의 리소스 매니저
- **Mesos**: 범용 클러스터 매니저
- **Kubernetes**: 컨테이너 오케스트레이션

#### **3. Worker Node**
- **Executor**: 실제 작업을 수행하는 JVM 프로세스
- **Task**: Executor에서 실행되는 개별 작업 단위
- **Cache**: 메모리 기반 데이터 저장소

### SparkContext와 SparkSession

```python
from pyspark import SparkContext, SparkConf
from pyspark.sql import SparkSession

# SparkContext 생성 (RDD용)
conf = SparkConf().setAppName("MyApp").setMaster("local[*]")
sc = SparkContext(conf=conf)

# SparkSession 생성 (DataFrame/SQL용)
spark = SparkSession.builder \
    .appName("MyApp") \
    .master("local[*]") \
    .config("spark.sql.adaptive.enabled", "true") \
    .getOrCreate()

# SparkContext 접근
sc_from_session = spark.sparkContext
```

## 🔄 RDD (Resilient Distributed Dataset) {#rdd-resilient-distributed-dataset}

### RDD란?

RDD는 Spark의 기본 데이터 추상화입니다. **불변(immutable)**, **분산(distributed)**, **탄력적(resilient)**한 데이터셋입니다.

#### **RDD의 특성**
1. **불변성**: 생성 후 수정 불가, 변환을 통해 새로운 RDD 생성
2. **분산성**: 여러 노드에 걸쳐 분산 저장
3. **탄력성**: 장애 발생 시 자동 복구 (Lineage 기반)
4. **지연 실행**: Action 호출 시까지 실제 연산 지연

### RDD 생성 방법

```python
# 1. 컬렉션에서 RDD 생성
data = [1, 2, 3, 4, 5]
rdd = sc.parallelize(data, numSlices=4)  # 4개 파티션으로 분할

# 2. 외부 파일에서 RDD 생성
rdd_text = sc.textFile("hdfs://path/to/file.txt")
rdd_csv = sc.textFile("hdfs://path/to/file.csv")

# 3. 다른 RDD에서 변환
rdd_transformed = rdd.map(lambda x: x * 2)
```

### RDD 기본 연산

#### **Transformation (변환)**
```python
# Map: 각 요소에 함수 적용
rdd = sc.parallelize([1, 2, 3, 4, 5])
doubled = rdd.map(lambda x: x * 2)
print(doubled.collect())  # [2, 4, 6, 8, 10]

# Filter: 조건에 맞는 요소만 선택
evens = rdd.filter(lambda x: x % 2 == 0)
print(evens.collect())  # [2, 4]

# FlatMap: 각 요소를 여러 요소로 확장
words = sc.parallelize(["hello world", "spark tutorial"])
word_list = words.flatMap(lambda x: x.split(" "))
print(word_list.collect())  # ['hello', 'world', 'spark', 'tutorial']

# Distinct: 중복 제거
data = [1, 2, 2, 3, 3, 3]
rdd = sc.parallelize(data)
unique = rdd.distinct()
print(unique.collect())  # [1, 2, 3]
```

#### **Action (액션)**
```python
# Collect: 모든 데이터를 드라이버로 수집
rdd = sc.parallelize([1, 2, 3, 4, 5])
result = rdd.collect()
print(result)  # [1, 2, 3, 4, 5]

# Count: 요소 개수 반환
count = rdd.count()
print(count)  # 5

# First: 첫 번째 요소 반환
first = rdd.first()
print(first)  # 1

# Take: 처음 n개 요소 반환
first_three = rdd.take(3)
print(first_three)  # [1, 2, 3]

# Reduce: 요소들을 하나로 축약
sum_result = rdd.reduce(lambda x, y: x + y)
print(sum_result)  # 15

# Fold: 초기값을 사용한 축약
sum_with_zero = rdd.fold(0, lambda x, y: x + y)
print(sum_with_zero)  # 15
```

### 고급 RDD 연산

#### **그룹화와 집계**
```python
# GroupByKey: 키별로 그룹화
data = [("apple", 1), ("banana", 2), ("apple", 3), ("banana", 4)]
rdd = sc.parallelize(data)
grouped = rdd.groupByKey()
print(grouped.mapValues(list).collect())
# [('apple', [1, 3]), ('banana', [2, 4])]

# ReduceByKey: 키별로 값들을 축약
reduced = rdd.reduceByKey(lambda x, y: x + y)
print(reduced.collect())  # [('apple', 4), ('banana', 6)]

# AggregateByKey: 복잡한 집계
# 초기값, 시퀀스 함수, 결합 함수
aggregated = rdd.aggregateByKey(
    (0, 0),  # 초기값: (합계, 개수)
    lambda acc, val: (acc[0] + val, acc[1] + 1),  # 시퀀스 함수
    lambda acc1, acc2: (acc1[0] + acc2[0], acc1[1] + acc2[1])  # 결합 함수
)
print(aggregated.collect())
# [('apple', (4, 2)), ('banana', (6, 2))]
```

#### **조인 연산**
```python
# 두 RDD 생성
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

# Cartesian Product (카테시안 곱)
cartesian = rdd1.cartesian(rdd2)
print(cartesian.collect())
# [('apple', ('apple', 'red')), ('apple', ('banana', 'yellow')), ...]
```

## 📊 DataFrame과 Dataset {#dataframe과-dataset}

### DataFrame 소개

DataFrame은 RDD의 진화된 형태로, **구조화된 데이터**를 효율적으로 처리할 수 있습니다.

#### **DataFrame의 장점**
1. **최적화된 실행**: Catalyst Optimizer가 쿼리 최적화
2. **스키마 정보**: 컬럼 타입과 이름 정보 포함
3. **풍부한 API**: SQL, Python, Scala, R 지원
4. **메모리 효율성**: Tungsten 엔진으로 메모리 최적화

### DataFrame 생성

```python
# 1. RDD에서 DataFrame 생성
from pyspark.sql.types import StructType, StructField, StringType, IntegerType

# 스키마 정의
schema = StructType([
    StructField("name", StringType(), True),
    StructField("age", IntegerType(), True),
    StructField("city", StringType(), True)
])

# 데이터 생성
data = [("Alice", 25, "Seoul"), ("Bob", 30, "Busan"), ("Charlie", 35, "Seoul")]
rdd = sc.parallelize(data)
df = spark.createDataFrame(rdd, schema)
df.show()

# 2. 직접 DataFrame 생성
df = spark.createDataFrame([
    ("Alice", 25, "Seoul"),
    ("Bob", 30, "Busan"),
    ("Charlie", 35, "Seoul")
], ["name", "age", "city"])

# 3. 외부 파일에서 로드
df_csv = spark.read.csv("path/to/file.csv", header=True, inferSchema=True)
df_json = spark.read.json("path/to/file.json")
df_parquet = spark.read.parquet("path/to/file.parquet")
```

### DataFrame 기본 연산

```python
# 기본 정보 확인
df.printSchema()  # 스키마 출력
df.show()  # 데이터 출력
df.show(5)  # 처음 5행 출력
df.count()  # 행 개수
df.columns  # 컬럼 목록
df.dtypes  # 컬럼 타입

# 컬럼 선택
df.select("name", "age").show()
df.select(df.name, df.age + 1).show()

# 조건 필터링
df.filter(df.age > 25).show()
df.filter("age > 25").show()  # SQL 스타일

# 정렬
df.orderBy("age").show()
df.orderBy(df.age.desc()).show()

# 그룹화와 집계
df.groupBy("city").count().show()
df.groupBy("city").agg({"age": "avg", "name": "count"}).show()
```

### 고급 DataFrame 연산

#### **윈도우 함수**
```python
from pyspark.sql.window import Window
from pyspark.sql.functions import row_number, rank, dense_rank, lag, lead

# 윈도우 정의
window_spec = Window.partitionBy("city").orderBy("age")

# 윈도우 함수 적용
df.withColumn("row_num", row_number().over(window_spec)) \
  .withColumn("rank", rank().over(window_spec)) \
  .withColumn("dense_rank", dense_rank().over(window_spec)) \
  .withColumn("prev_age", lag("age", 1).over(window_spec)) \
  .withColumn("next_age", lead("age", 1).over(window_spec)) \
  .show()
```

#### **조인 연산**
```python
# 두 DataFrame 생성
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

### Spark SQL 소개

Spark SQL은 구조화된 데이터 처리를 위한 Spark 모듈입니다. SQL 쿼리와 DataFrame API를 통합합니다.

### 테이블 뷰 생성

```python
# DataFrame을 임시 뷰로 등록
df.createOrReplaceTempView("people")

# SQL 쿼리 실행
result = spark.sql("""
    SELECT city, COUNT(*) as count, AVG(age) as avg_age
    FROM people
    WHERE age > 25
    GROUP BY city
    ORDER BY count DESC
""")
result.show()
```

### 고급 SQL 기능

```python
# 복잡한 쿼리 예제
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

# CTE (Common Table Expression) 사용
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

## 🛠 ️ 실습: 기본 데이터 처리 {#실습-기본-데이터-처리}

### 실습 1: 로그 데이터 분석

```python
# 로그 데이터 생성
log_data = [
    "2025-09-11 10:30:45 INFO User login successful user_id=12345",
    "2025-09-11 10:31:12 ERROR Database connection failed",
    "2025-09-11 10:31:45 INFO User login successful user_id=67890",
    "2025-09-11 10:32:01 WARN High memory usage detected",
    "2025-09-11 10:32:15 INFO User logout user_id=12345"
]

# RDD로 로그 분석
rdd_logs = sc.parallelize(log_data)

# 로그 레벨별 통계
log_levels = rdd_logs.map(lambda line: line.split()[2])  # 로그 레벨 추출
level_counts = log_levels.map(lambda level: (level, 1)).reduceByKey(lambda x, y: x + y)
print("로그 레벨별 통계:")
for level, count in level_counts.collect():
    print(f"{level}: {count}")

# 에러 로그만 필터링
error_logs = rdd_logs.filter(lambda line: "ERROR" in line)
print("\n에러 로그:")
error_logs.foreach(print)
```

### 실습 2: 구조화된 데이터 처리

```python
# 판매 데이터 생성
sales_data = [
    ("2025-09-11", "Alice", "Laptop", 1200, "Seoul"),
    ("2025-09-11", "Bob", "Mouse", 25, "Busan"),
    ("2025-09-11", "Charlie", "Keyboard", 80, "Seoul"),
    ("2025-09-12", "Alice", "Monitor", 300, "Seoul"),
    ("2025-09-12", "Bob", "Laptop", 1200, "Busan"),
    ("2025-09-12", "David", "Headphone", 150, "Daegu")
]

# DataFrame 생성
df_sales = spark.createDataFrame(sales_data, ["date", "customer", "product", "price", "city"])
df_sales.show()

# 고객별 총 구매액 계산
customer_total = df_sales.groupBy("customer") \
    .agg({"price": "sum"}) \
    .withColumnRenamed("sum(price)", "total_spent") \
    .orderBy("total_spent", ascending=False)
customer_total.show()

# 도시별 평균 구매액
city_avg = df_sales.groupBy("city") \
    .agg({"price": "avg"}) \
    .withColumnRenamed("avg(price)", "avg_price") \
    .orderBy("avg_price", ascending=False)
city_avg.show()

# 고가 제품 구매 고객 (1000원 이상)
high_value_customers = df_sales.filter(df_sales.price >= 1000) \
    .select("customer", "product", "price") \
    .distinct()
high_value_customers.show()
```

### 실습 3: 복잡한 분석

```python
# 윈도우 함수를 사용한 고급 분석
from pyspark.sql.window import Window
from pyspark.sql.functions import row_number, rank, lag, sum as spark_sum

# 고객별 구매 순위 (도시별)
window_spec = Window.partitionBy("city").orderBy(df_sales.price.desc())

df_ranked = df_sales.withColumn("rank_in_city", rank().over(window_spec)) \
    .withColumn("row_number_in_city", row_number().over(window_spec))

print("도시별 구매 순위:")
df_ranked.show()

# 고객별 누적 구매액 계산
window_cumulative = Window.partitionBy("customer").orderBy("date")

df_cumulative = df_sales.withColumn("cumulative_spent", 
    spark_sum("price").over(window_cumulative))

print("\n고객별 누적 구매액:")
df_cumulative.show()

# 전일 대비 구매액 변화
window_lag = Window.partitionBy("customer").orderBy("date")

df_with_lag = df_sales.withColumn("prev_day_total", 
    lag(spark_sum("price").over(window_lag), 1).over(window_lag))

print("\n전일 대비 구매액 변화:")
df_with_lag.show()
```

## 📚 학습 요약 {#학습-요약}

### 이번 파트에서 학습한 내용

1. **Spark 아키텍처 이해**
   - Driver, Cluster Manager, Worker Node
   - SparkContext와 SparkSession

2. **RDD (Resilient Distributed Dataset)**
   - RDD의 특성과 생성 방법
   - Transformation과 Action 연산
   - 고급 연산 (그룹화, 조인)

3. **DataFrame과 Dataset**
   - 구조화된 데이터 처리
   - 윈도우 함수와 조인 연산
   - 최적화된 실행 엔진

4. **Spark SQL**
   - SQL 쿼리와 DataFrame API 통합
   - 복잡한 분석 쿼리 작성

5. **실습 프로젝트**
   - 로그 데이터 분석
   - 구조화된 데이터 처리
   - 고급 분석 기법

### 핵심 개념 정리

| 개념 | 설명 | 중요도 |
|------|------|--------|
| **RDD** | 분산 데이터셋의 기본 추상화 | ⭐⭐⭐⭐ |
| **DataFrame** | 구조화된 데이터 처리 | ⭐⭐⭐⭐⭐ |
| **Spark SQL** | SQL 기반 분석 | ⭐⭐⭐⭐ |
| **Transformation/Action** | 지연 실행 모델 | ⭐⭐⭐⭐⭐ |

### 다음 파트 미리보기

**Part 2: 대용량 배치 처리**에서는 다음 내용을 다룹니다:
- UDF (User Defined Function) 작성
- 고급 집계와 윈도우 함수
- 파티셔닝 전략과 성능 최적화
- 실무 프로젝트: 대용량 데이터 처리

---

**다음 파트**: [Part 2: 대용량 배치 처리와 UDF 활용](/data-engineering/2025/09/12/apache-spark-batch-processing.html)

---

*이제 Spark의 기본기를 마스터했습니다! 다음 파트에서는 더 고급 기법들을 배워보겠습니다.* 🚀
