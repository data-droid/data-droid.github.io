---
layout: post
lang: ko
title: "LSM Tree와 Bloom Filter - 현대 데이터베이스의 핵심 자료구조"
description: "최신 데이터베이스에서 널리 사용되는 LSM Tree와 Bloom Filter의 원리부터 실무 적용까지 완전 정복합니다."
date: 2026-02-22
author: Data Droid
category: data-engineering
tags: [LSM-Tree, Bloom-Filter, 데이터베이스, 자료구조, NoSQL, RocksDB, LevelDB, 성능최적화]
reading_time: "45분"
difficulty: "중급"
---

# 🌳 LSM Tree와 Bloom Filter - 현대 데이터베이스의 핵심 자료구조

> **"빠른 쓰기와 효율적인 읽기를 동시에 - LSM Tree와 Bloom Filter가 만드는 현대적 데이터베이스"** - RocksDB, Cassandra, HBase의 핵심 기술

전통적인 B-Tree 기반 데이터베이스는 랜덤 쓰기 성능에 한계가 있습니다. LSM Tree(Log-Structured Merge Tree)는 순차 쓰기를 활용하여 **쓰기 성능을 수십 배 향상**시키고, Bloom Filter는 **불필요한 디스크 I/O를 대폭 줄여** 읽기 성능을 최적화합니다. 이 포스트에서는 두 기술의 원리부터 실제 데이터베이스 구현까지 완전히 정복합니다.

---

## 📚 목차

- [LSM Tree란?](#lsm-tree란)
- [LSM Tree 동작 원리](#lsm-tree-동작-원리)
- [Bloom Filter 기초](#bloom-filter-기초)
- [Bloom Filter 동작 원리](#bloom-filter-동작-원리)
- [LSM Tree와 Bloom Filter의 조합](#lsm-tree와-bloom-filter의-조합)
- [실제 데이터베이스 구현](#실제-데이터베이스-구현)
- [성능 최적화 전략](#성능-최적화-전략)
- [학습 요약](#학습-요약)

---

## 🎯 LSM Tree란? {#lsm-tree란}

### 전통적인 B-Tree의 한계

전통적인 B-Tree 기반 데이터베이스(MySQL, PostgreSQL 등)는 다음과 같은 문제가 있습니다:

#### **문제 1: 랜덤 쓰기 성능 저하**

```python
# B-Tree의 랜덤 쓰기
# 각 쓰기마다 디스크의 여러 위치를 수정해야 함
INSERT INTO users (id, name) VALUES (1, 'Alice');   # 디스크 위치 A 수정
INSERT INTO users (id, name) VALUES (2, 'Bob');      # 디스크 위치 B 수정
INSERT INTO users (id, name) VALUES (3, 'Charlie'); # 디스크 위치 C 수정
# → 디스크 헤드 이동이 많아 성능 저하
```

#### **문제 2: Write Amplification**

```
B-Tree 쓰기 과정:
1. 데이터 페이지 읽기 (디스크 I/O)
2. 페이지 수정
3. 페이지 쓰기 (디스크 I/O)
4. 인덱스 페이지 업데이트 (추가 디스크 I/O)
5. WAL(Write-Ahead Log) 쓰기 (추가 디스크 I/O)

→ 하나의 쓰기가 여러 번의 디스크 I/O를 유발
```

### LSM Tree의 해결책

LSM Tree는 **순차 쓰기(Sequential Write)**를 활용하여 성능 문제를 해결합니다.

#### **핵심 아이디어**

```
전통적인 B-Tree:
랜덤 쓰기 → 디스크 헤드 이동 → 느린 성능

LSM Tree:
1. 메모리 버퍼에 순차적으로 쓰기 (매우 빠름)
2. 버퍼가 가득 차면 디스크에 순차 쓰기 (빠름)
3. 백그라운드에서 병합(Compaction) 수행
```

### LSM Tree의 장점

| **특징** | **B-Tree** | **LSM Tree** |
|----------|------------|--------------|
| **쓰기 성능** | 랜덤 쓰기 (느림) | 순차 쓰기 (빠름) |
| **쓰기 증폭** | 높음 (여러 페이지 수정) | 낮음 (순차 쓰기) |
| **읽기 성능** | 빠름 (인덱스 직접) | 상대적으로 느림 (여러 레벨 검색) |
| **공간 효율** | 높음 | 중간 (중복 데이터 존재) |
| **압축** | 제한적 | 효율적 (병합 시 압축) |

---

## 🔄 LSM Tree 동작 원리 {#lsm-tree-동작-원리}

### 기본 구조

LSM Tree는 여러 레벨(Level)로 구성됩니다:

```
LSM Tree 구조:
┌─────────────────────┐
│   MemTable (L0)     │  ← 메모리 (가장 최신 데이터)
│   (In-Memory)       │
└─────────────────────┘
         ↓ (플러시)
┌─────────────────────┐
│   SSTable (L1)       │  ← 디스크 (작은 파일들)
│   (Sorted String)   │
└─────────────────────┘
         ↓ (병합)
┌─────────────────────┐
│   SSTable (L2)       │  ← 디스크 (더 큰 파일들)
└─────────────────────┘
         ↓
┌─────────────────────┐
│   SSTable (L3)       │  ← 디스크 (가장 큰 파일들)
└─────────────────────┘
```

### 1. 쓰기 과정 (Write Path)

#### **Step 1: MemTable에 쓰기**

```python
# Python으로 LSM Tree 쓰기 과정 시뮬레이션
class MemTable:
    def __init__(self, max_size=100):
        self.data = {}  # 메모리 내 정렬된 딕셔너리
        self.max_size = max_size
    
    def put(self, key, value):
        """메모리에 데이터 쓰기 (매우 빠름)"""
        self.data[key] = value
        
        # MemTable이 가득 차면 플러시
        if len(self.data) >= self.max_size:
            return self.flush()
        return None
    
    def flush(self):
        """MemTable을 디스크(SSTable)로 플러시"""
        # 정렬된 데이터를 SSTable로 변환
        sorted_data = sorted(self.data.items())
        sstable = SSTable(sorted_data)
        self.data.clear()  # MemTable 초기화
        return sstable

# 사용 예시
memtable = MemTable(max_size=5)

# 순차적으로 쓰기 (매우 빠름)
memtable.put("user:1", "Alice")
memtable.put("user:2", "Bob")
memtable.put("user:3", "Charlie")
memtable.put("user:4", "David")
memtable.put("user:5", "Eve")  # → MemTable 가득 참 → 플러시 발생
```

#### **Step 2: WAL(Write-Ahead Log) 쓰기**

```python
class WAL:
    """쓰기 전 로그 - 장애 복구를 위한 로그"""
    
    def __init__(self, log_file):
        self.log_file = log_file
    
    def append(self, key, value):
        """WAL에 순차적으로 쓰기 (매우 빠름)"""
        log_entry = f"{key}:{value}\n"
        with open(self.log_file, 'a') as f:
            f.write(log_entry)
    
    def replay(self):
        """장애 복구 시 WAL 재생"""
        operations = []
        with open(self.log_file, 'r') as f:
            for line in f:
                key, value = line.strip().split(':')
                operations.append((key, value))
        return operations

# 쓰기 과정
wal = WAL("wal.log")
wal.append("user:1", "Alice")  # WAL에 먼저 쓰기
memtable.put("user:1", "Alice")  # 그 다음 MemTable에 쓰기
```

#### **Step 3: SSTable 생성**

```python
class SSTable:
    """Sorted String Table - 디스크에 저장되는 정렬된 데이터"""
    
    def __init__(self, sorted_data):
        self.data = dict(sorted_data)
        self.min_key = min(self.data.keys())
        self.max_key = max(self.data.keys())
        self.size = len(self.data)
    
    def get(self, key):
        """SSTable에서 키 조회"""
        return self.data.get(key)
    
    def range_query(self, start_key, end_key):
        """범위 쿼리"""
        result = {}
        for key, value in self.data.items():
            if start_key <= key <= end_key:
                result[key] = value
        return result

# MemTable 플러시 → SSTable 생성
sstable = memtable.flush()
print(f"SSTable created: {sstable.min_key} to {sstable.max_key}")
```

### 2. 읽기 과정 (Read Path)

LSM Tree의 읽기는 여러 레벨을 검색해야 합니다:

```python
class LSMTree:
    def __init__(self):
        self.memtable = MemTable()
        self.sstables = []  # 레벨별 SSTable 리스트
        self.wal = WAL("wal.log")
    
    def get(self, key):
        """키 조회 - 최신 데이터부터 검색"""
        
        # 1. MemTable에서 먼저 검색 (가장 최신)
        if key in self.memtable.data:
            return self.memtable.data[key]
        
        # 2. SSTable들을 최신 순서로 검색
        for sstable in reversed(self.sstables):
            if sstable.min_key <= key <= sstable.max_key:
                value = sstable.get(key)
                if value is not None:
                    return value
        
        # 3. 찾지 못함
        return None

# 읽기 예시
lsm = LSMTree()
lsm.put("user:1", "Alice")
lsm.put("user:2", "Bob")

# MemTable에서 바로 찾음 (빠름)
print(lsm.get("user:1"))  # "Alice"

# MemTable 플러시 후
lsm.memtable.flush()

# SSTable에서 찾음 (상대적으로 느림)
print(lsm.get("user:1"))  # "Alice"
```

### 3. Compaction (병합) 과정

Compaction은 여러 SSTable을 병합하여 읽기 성능을 향상시킵니다:

```python
class Compactor:
    """SSTable 병합 담당"""
    
    @staticmethod
    def compact(sstables):
        """여러 SSTable을 하나로 병합"""
        merged_data = {}
        
        # 모든 SSTable의 데이터를 병합 (최신 값 우선)
        for sstable in reversed(sstables):  # 최신부터
            for key, value in sstable.data.items():
                if key not in merged_data:  # 최신 값만 유지
                    merged_data[key] = value
        
        # 정렬된 새 SSTable 생성
        sorted_data = sorted(merged_data.items())
        return SSTable(sorted_data)
    
    @staticmethod
    def level_compact(level_sstables, next_level_sstables):
        """레벨 간 병합 (Leveled Compaction)"""
        # L1의 SSTable들을 L2와 병합
        all_sstables = level_sstables + next_level_sstables
        return Compactor.compact(all_sstables)

# Compaction 예시
sstable1 = SSTable([("a", "1"), ("b", "2")])
sstable2 = SSTable([("b", "3"), ("c", "4")])  # b가 업데이트됨

# 병합 (최신 값 우선)
merged = Compactor.compact([sstable1, sstable2])
print(merged.data)  # {'a': '1', 'b': '3', 'c': '4'}
```

### Compaction 전략

#### **Size-Tiered Compaction**

```
레벨별로 비슷한 크기의 SSTable들을 병합
L1: [10MB, 10MB, 10MB] → 병합 → L2: [30MB]
L2: [30MB, 30MB, 30MB] → 병합 → L3: [90MB]
```

#### **Leveled Compaction**

```
각 레벨은 최대 크기 제한
L1: 최대 10개 파일, 각 10MB
L2: 최대 10개 파일, 각 100MB
L3: 최대 10개 파일, 각 1GB
→ 레벨이 올라갈수록 파일 크기 증가
```

---

## 🔍 Bloom Filter 기초 {#bloom-filter-기초}

### Bloom Filter란?

Bloom Filter는 **확률적 자료구조(Probabilistic Data Structure)**로, **원소의 존재 여부를 빠르게 확인**할 수 있지만, **False Positive(거짓 양성)는 가능하지만 False Negative(거짓 음성)는 불가능**합니다.

### 왜 Bloom Filter가 필요한가?

LSM Tree에서 키를 찾을 때:

```python
# Bloom Filter 없이 키 검색
def get_without_bloom_filter(key):
    # 모든 SSTable을 검색해야 함
    for sstable in sstables:
        if key in sstable:  # 디스크 I/O 발생!
            return sstable.get(key)
    return None

# 문제: 존재하지 않는 키도 모든 SSTable을 검색해야 함
# → 불필요한 디스크 I/O 발생
```

Bloom Filter를 사용하면:

```python
# Bloom Filter로 키 검색
def get_with_bloom_filter(key):
    for sstable in sstables:
        if sstable.bloom_filter.might_contain(key):  # 메모리에서 빠르게 확인
            if key in sstable:  # 실제로 존재할 때만 디스크 I/O
                return sstable.get(key)
    return None

# 장점: 존재하지 않는 키는 디스크 I/O 없이 빠르게 거부
```

### Bloom Filter의 특징

| **특징** | **설명** |
|----------|----------|
| **공간 효율** | 매우 작은 메모리 사용 (비트 배열) |
| **속도** | O(k) - k는 해시 함수 개수 |
| **False Positive** | 가능 (존재하지 않는데 존재한다고 판단) |
| **False Negative** | 불가능 (존재하는데 없다고 판단하지 않음) |
| **삭제** | 기본적으로 불가능 (Counting Bloom Filter로 가능) |

---

## 🧮 Bloom Filter 동작 원리 {#bloom-filter-동작-원리}

### 기본 구조

```python
import mmh3  # MurmurHash3
import math

class BloomFilter:
    """Bloom Filter 구현"""
    
    def __init__(self, capacity, error_rate=0.01):
        """
        capacity: 예상 원소 개수
        error_rate: 허용 가능한 False Positive 비율
        """
        self.capacity = capacity
        self.error_rate = error_rate
        
        # 비트 배열 크기 계산
        # m = -n * ln(p) / (ln(2)^2)
        self.bit_array_size = int(-capacity * math.log(error_rate) / (math.log(2) ** 2))
        
        # 해시 함수 개수 계산
        # k = (m/n) * ln(2)
        self.hash_count = int((self.bit_array_size / capacity) * math.log(2))
        
        # 비트 배열 초기화
        self.bit_array = [0] * self.bit_array_size
    
    def _hash(self, item, seed):
        """해시 함수 (MurmurHash3 사용)"""
        return mmh3.hash(item, seed) % self.bit_array_size
    
    def add(self, item):
        """원소 추가"""
        for i in range(self.hash_count):
            index = self._hash(item, i)
            self.bit_array[index] = 1
    
    def might_contain(self, item):
        """원소 존재 가능성 확인"""
        for i in range(self.hash_count):
            index = self._hash(item, i)
            if self.bit_array[index] == 0:
                return False  # 확실히 존재하지 않음
        return True  # 존재할 가능성이 있음 (False Positive 가능)

# 사용 예시
bloom = BloomFilter(capacity=1000, error_rate=0.01)

# 원소 추가
bloom.add("user:1")
bloom.add("user:2")
bloom.add("user:3")

# 존재 확인
print(bloom.might_contain("user:1"))  # True
print(bloom.might_contain("user:999"))  # False (확실히 없음)
print(bloom.might_contain("user:1001"))  # True or False (False Positive 가능)
```

### 해시 함수와 비트 배열

```
Bloom Filter 동작 과정:

1. 원소 추가:
   "user:1" → Hash1 → Index 5 → Bit[5] = 1
            → Hash2 → Index 12 → Bit[12] = 1
            → Hash3 → Index 23 → Bit[23] = 1

2. 원소 확인:
   "user:1" → Hash1 → Index 5 → Bit[5] == 1? ✓
            → Hash2 → Index 12 → Bit[12] == 1? ✓
            → Hash3 → Index 23 → Bit[23] == 1? ✓
            → "존재할 가능성 있음" (True)

   "user:999" → Hash1 → Index 7 → Bit[7] == 1? ✗
              → "확실히 존재하지 않음" (False)
```

### False Positive 확률 계산

```python
def calculate_false_positive_rate(n, m, k):
    """
    n: 실제 원소 개수
    m: 비트 배열 크기
    k: 해시 함수 개수
    """
    # False Positive 확률 = (1 - e^(-kn/m))^k
    import math
    return (1 - math.exp(-k * n / m)) ** k

# 예시
n = 1000  # 1000개 원소
m = 9585  # 비트 배열 크기 (error_rate=0.01일 때)
k = 7     # 해시 함수 개수

fp_rate = calculate_false_positive_rate(n, m, k)
print(f"False Positive Rate: {fp_rate:.4f}")  # 약 0.01 (1%)
```

### 최적 파라미터 선택

```python
def optimal_bloom_filter_params(capacity, error_rate):
    """최적의 Bloom Filter 파라미터 계산"""
    import math
    
    # 비트 배열 크기
    m = int(-capacity * math.log(error_rate) / (math.log(2) ** 2))
    
    # 해시 함수 개수
    k = int((m / capacity) * math.log(2))
    
    return {
        'bit_array_size': m,
        'hash_count': k,
        'memory_bytes': m / 8,  # 비트를 바이트로 변환
        'bits_per_element': m / capacity
    }

# 예시: 100만 개 원소, 1% 오류율
params = optimal_bloom_filter_params(1_000_000, 0.01)
print(f"비트 배열 크기: {params['bit_array_size']:,} bits")
print(f"해시 함수 개수: {params['hash_count']}")
print(f"메모리 사용량: {params['memory_bytes'] / 1024 / 1024:.2f} MB")
print(f"원소당 비트 수: {params['bits_per_element']:.2f}")

# 출력:
# 비트 배열 크기: 9,585,058 bits
# 해시 함수 개수: 7
# 메모리 사용량: 1.14 MB
# 원소당 비트 수: 9.59
```

---

## 🔗 LSM Tree와 Bloom Filter의 조합 {#lsm-tree와-bloom-filter의-조합}

### 통합 아키텍처

```python
class SSTableWithBloomFilter:
    """Bloom Filter가 포함된 SSTable"""
    
    def __init__(self, sorted_data):
        self.data = dict(sorted_data)
        self.min_key = min(self.data.keys())
        self.max_key = max(self.data.keys())
        
        # Bloom Filter 생성
        self.bloom_filter = BloomFilter(
            capacity=len(self.data),
            error_rate=0.01
        )
        
        # 모든 키를 Bloom Filter에 추가
        for key in self.data.keys():
            self.bloom_filter.add(key)
    
    def get(self, key):
        """Bloom Filter로 필터링 후 조회"""
        # 1. Bloom Filter로 빠른 필터링
        if not self.bloom_filter.might_contain(key):
            return None  # 확실히 없음 → 디스크 I/O 없음
        
        # 2. 실제 데이터 조회 (디스크 I/O 발생)
        return self.data.get(key)

class OptimizedLSMTree:
    """Bloom Filter가 통합된 LSM Tree"""
    
    def __init__(self):
        self.memtable = MemTable()
        self.sstables = []
        self.wal = WAL("wal.log")
    
    def get(self, key):
        """최적화된 읽기 - Bloom Filter 활용"""
        
        # 1. MemTable 검색 (메모리, 가장 빠름)
        if key in self.memtable.data:
            return self.memtable.data[key]
        
        # 2. SSTable 검색 (Bloom Filter로 필터링)
        for sstable in reversed(self.sstables):
            # Bloom Filter로 먼저 확인 (메모리, 빠름)
            if sstable.bloom_filter.might_contain(key):
                # 실제로 존재할 가능성이 있음 → 디스크에서 조회
                value = sstable.get(key)
                if value is not None:
                    return value
        
        return None

# 성능 비교
def benchmark_read_performance():
    """읽기 성능 벤치마크"""
    import time
    
    lsm_without_bf = LSMTree()  # Bloom Filter 없음
    lsm_with_bf = OptimizedLSMTree()  # Bloom Filter 있음
    
    # 테스트 데이터 준비
    for i in range(10000):
        lsm_without_bf.put(f"key:{i}", f"value:{i}")
        lsm_with_bf.put(f"key:{i}", f"value:{i}")
    
    # 존재하지 않는 키 검색 (가장 큰 차이)
    start = time.time()
    for i in range(10000, 20000):
        lsm_without_bf.get(f"key:{i}")  # 모든 SSTable 검색
    time_without_bf = time.time() - start
    
    start = time.time()
    for i in range(10000, 20000):
        lsm_with_bf.get(f"key:{i}")  # Bloom Filter로 빠르게 필터링
    time_with_bf = time.time() - start
    
    print(f"Bloom Filter 없음: {time_without_bf:.4f}초")
    print(f"Bloom Filter 있음: {time_with_bf:.4f}초")
    print(f"성능 향상: {time_without_bf / time_with_bf:.2f}배")

# benchmark_read_performance()
# 출력 예시:
# Bloom Filter 없음: 2.3456초
# Bloom Filter 있음: 0.1234초
# 성능 향상: 19.01배
```

### 성능 향상 효과

| **시나리오** | **Bloom Filter 없음** | **Bloom Filter 있음** | **향상** |
|-------------|----------------------|----------------------|----------|
| **존재하는 키** | 모든 레벨 검색 | 모든 레벨 검색 | 비슷 |
| **존재하지 않는 키** | 모든 레벨 검색 | 메모리에서 즉시 거부 | **10-100배** |
| **부분 존재 키** | 일부 레벨만 검색 | 일부 레벨만 검색 | **2-5배** |

---

## 🗄️ 실제 데이터베이스 구현 {#실제-데이터베이스-구현}

### RocksDB

RocksDB는 Facebook에서 개발한 LSM Tree 기반 스토리지 엔진입니다.

#### **RocksDB 아키텍처**

```
RocksDB 구조:
┌─────────────────────┐
│   MemTable          │  ← SkipList (메모리)
│   (SkipList)        │
└─────────────────────┘
         ↓
┌─────────────────────┐
│   Immutable MemTable│  ← 플러시 대기 중
└─────────────────────┘
         ↓
┌─────────────────────┐
│   L0 SSTable        │  ← Level 0 (여러 파일)
│   (Bloom Filter)    │
└─────────────────────┘
         ↓
┌─────────────────────┐
│   L1 SSTable        │  ← Level 1
│   (Bloom Filter)    │
└─────────────────────┘
         ↓
┌─────────────────────┐
│   L2+ SSTable       │  ← Level 2 이상
│   (Bloom Filter)    │
└─────────────────────┘
```

#### **RocksDB 사용 예시**

```python
import rocksdb

# RocksDB 열기
db = rocksdb.DB("test.db", rocksdb.Options(create_if_missing=True))

# 쓰기 (매우 빠름 - 순차 쓰기)
db.put(b"user:1", b"Alice")
db.put(b"user:2", b"Bob")
db.put(b"user:3", b"Charlie")

# 읽기 (Bloom Filter로 최적화)
value = db.get(b"user:1")
print(value)  # b"Alice"

# 배치 쓰기 (더 빠름)
batch = rocksdb.WriteBatch()
batch.put(b"user:4", b"David")
batch.put(b"user:5", b"Eve")
db.write(batch)

# 범위 스캔
it = db.iteritems()
it.seek(b"user:")
for key, value in it:
    print(f"{key}: {value}")
```

### Apache Cassandra

Cassandra는 분산 NoSQL 데이터베이스로 LSM Tree를 사용합니다.

#### **Cassandra의 LSM Tree 구현**

```
Cassandra 구조:
┌─────────────────────┐
│   Memtable          │  ← 각 노드의 메모리
│   (ConcurrentSkipList)│
└─────────────────────┘
         ↓
┌─────────────────────┐
│   Commit Log        │  ← WAL (장애 복구)
└─────────────────────┘
         ↓
┌─────────────────────┐
│   SSTable (L0)      │  ← 여러 SSTable
│   (Bloom Filter)    │
└─────────────────────┘
         ↓
┌─────────────────────┐
│   Compaction        │  ← Size-Tiered Compaction
└─────────────────────┘
```

### HBase

HBase는 Hadoop 기반 분산 데이터베이스입니다.

#### **HBase의 LSM Tree 구현**

```
HBase 구조:
┌─────────────────────┐
│   MemStore          │  ← RegionServer 메모리
│   (ConcurrentSkipList)│
└─────────────────────┘
         ↓
┌─────────────────────┐
│   WAL (HLog)        │  ← HDFS에 저장
└─────────────────────┘
         ↓
┌─────────────────────┐
│   HFile (SSTable)   │  ← HDFS에 저장
│   (Bloom Filter)    │
└─────────────────────┘
```

---

## ⚡ 성능 최적화 전략 {#성능-최적화-전략}

### 1. Bloom Filter 최적화

#### **적응형 Bloom Filter 크기**

```python
class AdaptiveBloomFilter:
    """데이터 크기에 따라 자동 조정되는 Bloom Filter"""
    
    def __init__(self, initial_capacity=1000):
        self.capacity = initial_capacity
        self.bloom_filter = BloomFilter(initial_capacity)
        self.actual_count = 0
    
    def add(self, item):
        """원소 추가 시 용량 자동 확장"""
        self.bloom_filter.add(item)
        self.actual_count += 1
        
        # 실제 개수가 예상 용량의 80%를 넘으면 확장
        if self.actual_count >= self.capacity * 0.8:
            self._expand()
    
    def _expand(self):
        """Bloom Filter 확장"""
        old_filter = self.bloom_filter
        self.capacity *= 2
        self.bloom_filter = BloomFilter(self.capacity)
        
        # 기존 데이터 재구성 (실제로는 SSTable 재생성 시 수행)
        # 여기서는 시뮬레이션
        print(f"Bloom Filter expanded to {self.capacity}")
```

#### **블록 레벨 Bloom Filter**

```python
class BlockBloomFilter:
    """SSTable의 각 블록마다 별도의 Bloom Filter"""
    
    def __init__(self, block_size=4096):
        self.block_size = block_size
        self.block_filters = {}  # 블록별 Bloom Filter
    
    def add_to_block(self, key, block_id):
        """특정 블록의 Bloom Filter에 추가"""
        if block_id not in self.block_filters:
            self.block_filters[block_id] = BloomFilter(
                capacity=self.block_size
            )
        self.block_filters[block_id].add(key)
    
    def might_contain_in_block(self, key, block_id):
        """특정 블록에 키가 존재하는지 확인"""
        if block_id not in self.block_filters:
            return False
        return self.block_filters[block_id].might_contain(key)
```

### 2. Compaction 최적화

#### **Compaction 전략 선택**

```python
class CompactionStrategy:
    """Compaction 전략 선택"""
    
    @staticmethod
    def size_tiered_compact(sstables):
        """Size-Tiered: 비슷한 크기 파일들 병합"""
        # 같은 크기 범위의 SSTable들을 그룹화
        size_groups = {}
        for sstable in sstables:
            size_range = sstable.size // 1000  # 1KB 단위로 그룹화
            if size_range not in size_groups:
                size_groups[size_range] = []
            size_groups[size_range].append(sstable)
        
        # 각 그룹에서 4개 이상이면 병합
        merged = []
        for size_range, group in size_groups.items():
            if len(group) >= 4:
                merged.append(Compactor.compact(group))
            else:
                merged.extend(group)
        
        return merged
    
    @staticmethod
    def leveled_compact(levels):
        """Leveled: 레벨별 크기 제한"""
        for level, sstables in enumerate(levels):
            max_files = 10 * (level + 1)  # 레벨이 높을수록 더 많은 파일 허용
            if len(sstables) > max_files:
                # 초과 파일들을 다음 레벨과 병합
                return Compactor.level_compact(
                    sstables[:max_files],
                    levels[level + 1] if level + 1 < len(levels) else []
                )
        return levels
```

### 3. 메모리 관리

#### **MemTable 크기 제한**

```python
class MemoryAwareMemTable(MemTable):
    """메모리 사용량을 모니터링하는 MemTable"""
    
    def __init__(self, max_size=100, max_memory_mb=100):
        super().__init__(max_size)
        self.max_memory_mb = max_memory_mb
        self.current_memory_mb = 0
    
    def put(self, key, value):
        """메모리 사용량 체크"""
        key_size = len(str(key).encode())
        value_size = len(str(value).encode())
        entry_size_mb = (key_size + value_size) / (1024 * 1024)
        
        if self.current_memory_mb + entry_size_mb > self.max_memory_mb:
            # 메모리 초과 → 즉시 플러시
            return self.flush()
        
        self.current_memory_mb += entry_size_mb
        return super().put(key, value)
    
    def flush(self):
        """플러시 후 메모리 초기화"""
        result = super().flush()
        self.current_memory_mb = 0
        return result
```

---

## 📚 학습 요약 {#학습-요약}

### 핵심 포인트

1. **LSM Tree의 장점**
   - 순차 쓰기로 뛰어난 쓰기 성능
   - Write Amplification 감소
   - 압축 효율 향상
   - 대용량 데이터 처리에 적합

2. **Bloom Filter의 역할**
   - 존재하지 않는 키를 빠르게 필터링
   - 불필요한 디스크 I/O 제거
   - 작은 메모리로 큰 성능 향상

3. **실제 적용**
   - RocksDB: 임베디드 데이터베이스
   - Cassandra: 분산 NoSQL
   - HBase: 빅데이터 스토리지

### 성능 비교 요약

| **작업** | **B-Tree** | **LSM Tree (Bloom Filter 없음)** | **LSM Tree (Bloom Filter 있음)** |
|----------|------------|--------------------------------|----------------------------------|
| **쓰기** | 느림 (랜덤) | 매우 빠름 (순차) | 매우 빠름 (순차) |
| **읽기 (존재)** | 빠름 | 중간 | 중간 |
| **읽기 (부재)** | 빠름 | 느림 | 매우 빠름 |

### 실무 체크리스트

- [ ] 쓰기 중심 워크로드인가? → LSM Tree 고려
- [ ] 읽기 성능이 중요한가? → Bloom Filter 필수
- [ ] 메모리 제약이 있는가? → Bloom Filter 크기 조정
- [ ] Compaction 전략 선택 (Size-Tiered vs Leveled)
- [ ] WAL 설정 및 장애 복구 전략
- [ ] 모니터링 및 튜닝 지표 설정

### 다음 단계

- **분산 LSM Tree**: Cassandra, HBase의 분산 아키텍처
- **고급 Compaction**: Tiered Compaction, Universal Compaction
- **성능 튜닝**: 메모리 할당, Compaction 스레드 수
- **모니터링**: 쓰기 지연, 읽기 지연, Compaction 지연

---

> **"LSM Tree와 Bloom Filter는 현대 데이터베이스의 성능을 결정하는 핵심 기술입니다."**

쓰기 성능이 중요한 워크로드에서는 LSM Tree가 필수적이며, Bloom Filter는 읽기 성능을 크게 향상시킵니다. RocksDB, Cassandra, HBase 등 많은 현대적 데이터베이스가 이 두 기술을 조합하여 뛰어난 성능을 달성하고 있습니다. 이 가이드가 데이터베이스 내부 구조를 이해하고 최적화하는 데 도움이 되기를 바랍니다!
