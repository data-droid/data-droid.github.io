---
layout: post
title: "LSM Tree and Bloom Filter - Core Data Structures of Modern Databases"
description: "Complete guide to LSM Tree and Bloom Filter principles and practical applications widely used in modern databases."
excerpt: "Complete guide to LSM Tree and Bloom Filter principles and practical applications"
category: data-engineering
tags: [LSM-Tree, Bloom-Filter, Database, DataStructure, NoSQL, RocksDB, LevelDB, PerformanceOptimization]
date: 2026-02-22
author: Data Droid
lang: en
reading_time: 45 min
difficulty: Intermediate
---

# 🌳 LSM Tree and Bloom Filter - Core Data Structures of Modern Databases

> **"Fast writes and efficient reads simultaneously - Modern databases powered by LSM Tree and Bloom Filter"** - Core technologies of RocksDB, Cassandra, and HBase

Traditional B-Tree-based databases have limitations in random write performance. LSM Tree (Log-Structured Merge Tree) leverages sequential writes to **improve write performance by orders of magnitude**, while Bloom Filter **dramatically reduces unnecessary disk I/O** to optimize read performance. This post provides a complete guide to both technologies, from principles to actual database implementations.

---

## 📚 Table of Contents

- [What is LSM Tree?](#what-is-lsm-tree)
- [LSM Tree Operation Principles](#lsm-tree-operation-principles)
- [Bloom Filter Fundamentals](#bloom-filter-fundamentals)
- [Bloom Filter Operation Principles](#bloom-filter-operation-principles)
- [Combining LSM Tree and Bloom Filter](#combining-lsm-tree-and-bloom-filter)
- [Real Database Implementations](#real-database-implementations)
- [Performance Optimization Strategies](#performance-optimization-strategies)
- [Learning Summary](#learning-summary)

---

## 🎯 What is LSM Tree? {#what-is-lsm-tree}

### Limitations of Traditional B-Tree

Traditional B-Tree-based databases (MySQL, PostgreSQL, etc.) have the following problems:

#### **Problem 1: Random Write Performance Degradation**

```python
# Random writes in B-Tree
# Each write must modify multiple disk locations
INSERT INTO users (id, name) VALUES (1, 'Alice');   # Modify disk location A
INSERT INTO users (id, name) VALUES (2, 'Bob');      # Modify disk location B
INSERT INTO users (id, name) VALUES (3, 'Charlie'); # Modify disk location C
# → Frequent disk head movement causes performance degradation
```

#### **Problem 2: Write Amplification**

```
B-Tree write process:
1. Read data page (disk I/O)
2. Modify page
3. Write page (disk I/O)
4. Update index page (additional disk I/O)
5. Write WAL (Write-Ahead Log) (additional disk I/O)

→ One write causes multiple disk I/Os
```

### LSM Tree's Solution

LSM Tree solves performance issues by leveraging **sequential writes**.

#### **Core Idea**

```
Traditional B-Tree:
Random writes → Disk head movement → Slow performance

LSM Tree:
1. Write sequentially to memory buffer (very fast)
2. When buffer is full, write sequentially to disk (fast)
3. Perform merge (Compaction) in background
```

### Advantages of LSM Tree

| **Feature** | **B-Tree** | **LSM Tree** |
|----------|------------|--------------|
| **Write Performance** | Random writes (slow) | Sequential writes (fast) |
| **Write Amplification** | High (multiple page modifications) | Low (sequential writes) |
| **Read Performance** | Fast (direct index access) | Relatively slow (multi-level search) |
| **Space Efficiency** | High | Medium (duplicate data exists) |
| **Compression** | Limited | Efficient (compression during merge) |

---

## 🔄 LSM Tree Operation Principles {#lsm-tree-operation-principles}

### Basic Structure

LSM Tree consists of multiple levels:

```
LSM Tree Structure:
┌─────────────────────┐
│   MemTable (L0)     │  ← Memory (most recent data)
│   (In-Memory)       │
└─────────────────────┘
         ↓ (flush)
┌─────────────────────┐
│   SSTable (L1)       │  ← Disk (small files)
│   (Sorted String)   │
└─────────────────────┘
         ↓ (merge)
┌─────────────────────┐
│   SSTable (L2)       │  ← Disk (larger files)
└─────────────────────┘
         ↓
┌─────────────────────┐
│   SSTable (L3)       │  ← Disk (largest files)
└─────────────────────┘
```

### 1. Write Path

#### **Step 1: Write to MemTable**

```python
# Simulating LSM Tree write process with Python
class MemTable:
    def __init__(self, max_size=100):
        self.data = {}  # Sorted dictionary in memory
        self.max_size = max_size
    
    def put(self, key, value):
        """Write data to memory (very fast)"""
        self.data[key] = value
        
        # Flush when MemTable is full
        if len(self.data) >= self.max_size:
            return self.flush()
        return None
    
    def flush(self):
        """Flush MemTable to disk (SSTable)"""
        # Convert sorted data to SSTable
        sorted_data = sorted(self.data.items())
        sstable = SSTable(sorted_data)
        self.data.clear()  # Reset MemTable
        return sstable

# Usage example
memtable = MemTable(max_size=5)

# Write sequentially (very fast)
memtable.put("user:1", "Alice")
memtable.put("user:2", "Bob")
memtable.put("user:3", "Charlie")
memtable.put("user:4", "David")
memtable.put("user:5", "Eve")  # → MemTable full → flush occurs
```

#### **Step 2: Write to WAL (Write-Ahead Log)**

```python
class WAL:
    """Write-Ahead Log - log for disaster recovery"""
    
    def __init__(self, log_file):
        self.log_file = log_file
    
    def append(self, key, value):
        """Write sequentially to WAL (very fast)"""
        log_entry = f"{key}:{value}\n"
        with open(self.log_file, 'a') as f:
            f.write(log_entry)
    
    def replay(self):
        """Replay WAL during disaster recovery"""
        operations = []
        with open(self.log_file, 'r') as f:
            for line in f:
                key, value = line.strip().split(':')
                operations.append((key, value))
        return operations

# Write process
wal = WAL("wal.log")
wal.append("user:1", "Alice")  # Write to WAL first
memtable.put("user:1", "Alice")  # Then write to MemTable
```

#### **Step 3: Create SSTable**

```python
class SSTable:
    """Sorted String Table - sorted data stored on disk"""
    
    def __init__(self, sorted_data):
        self.data = dict(sorted_data)
        self.min_key = min(self.data.keys())
        self.max_key = max(self.data.keys())
        self.size = len(self.data)
    
    def get(self, key):
        """Query key from SSTable"""
        return self.data.get(key)
    
    def range_query(self, start_key, end_key):
        """Range query"""
        result = {}
        for key, value in self.data.items():
            if start_key <= key <= end_key:
                result[key] = value
        return result

# MemTable flush → Create SSTable
sstable = memtable.flush()
print(f"SSTable created: {sstable.min_key} to {sstable.max_key}")
```

### 2. Read Path

LSM Tree reads must search multiple levels:

```python
class LSMTree:
    def __init__(self):
        self.memtable = MemTable()
        self.sstables = []  # List of SSTables by level
        self.wal = WAL("wal.log")
    
    def get(self, key):
        """Query key - search from most recent data"""
        
        # 1. Search MemTable first (most recent)
        if key in self.memtable.data:
            return self.memtable.data[key]
        
        # 2. Search SSTables in reverse order (newest first)
        for sstable in reversed(self.sstables):
            if sstable.min_key <= key <= sstable.max_key:
                value = sstable.get(key)
                if value is not None:
                    return value
        
        # 3. Not found
        return None

# Read example
lsm = LSMTree()
lsm.put("user:1", "Alice")
lsm.put("user:2", "Bob")

# Found immediately in MemTable (fast)
print(lsm.get("user:1"))  # "Alice"

# After MemTable flush
lsm.memtable.flush()

# Found in SSTable (relatively slow)
print(lsm.get("user:1"))  # "Alice"
```

### 3. Compaction Process

Compaction merges multiple SSTables to improve read performance:

```python
class Compactor:
    """Responsible for SSTable merging"""
    
    @staticmethod
    def compact(sstables):
        """Merge multiple SSTables into one"""
        merged_data = {}
        
        # Merge data from all SSTables (newest value takes priority)
        for sstable in reversed(sstables):  # From newest
            for key, value in sstable.data.items():
                if key not in merged_data:  # Keep only newest value
                    merged_data[key] = value
        
        # Create new sorted SSTable
        sorted_data = sorted(merged_data.items())
        return SSTable(sorted_data)
    
    @staticmethod
    def level_compact(level_sstables, next_level_sstables):
        """Merge between levels (Leveled Compaction)"""
        # Merge L1 SSTables with L2
        all_sstables = level_sstables + next_level_sstables
        return Compactor.compact(all_sstables)

# Compaction example
sstable1 = SSTable([("a", "1"), ("b", "2")])
sstable2 = SSTable([("b", "3"), ("c", "4")])  # b is updated

# Merge (newest value takes priority)
merged = Compactor.compact([sstable1, sstable2])
print(merged.data)  # {'a': '1', 'b': '3', 'c': '4'}
```

### Compaction Strategies

#### **Size-Tiered Compaction**

```
Merge SSTables of similar sizes by level
L1: [10MB, 10MB, 10MB] → merge → L2: [30MB]
L2: [30MB, 30MB, 30MB] → merge → L3: [90MB]
```

#### **Leveled Compaction**

```
Each level has maximum size limit
L1: Max 10 files, each 10MB
L2: Max 10 files, each 100MB
L3: Max 10 files, each 1GB
→ File size increases as level increases
```

---

## 🔍 Bloom Filter Fundamentals {#bloom-filter-fundamentals}

### What is Bloom Filter?

Bloom Filter is a **probabilistic data structure** that can **quickly check element existence**, but **False Positives are possible while False Negatives are impossible**.

### Why is Bloom Filter Needed?

When searching for a key in LSM Tree:

```python
# Key search without Bloom Filter
def get_without_bloom_filter(key):
    # Must search all SSTables
    for sstable in sstables:
        if key in sstable:  # Disk I/O occurs!
            return sstable.get(key)
    return None

# Problem: Non-existent keys also require searching all SSTables
# → Unnecessary disk I/O occurs
```

With Bloom Filter:

```python
# Key search with Bloom Filter
def get_with_bloom_filter(key):
    for sstable in sstables:
        if sstable.bloom_filter.might_contain(key):  # Quick check in memory
            if key in sstable:  # Disk I/O only when actually exists
                return sstable.get(key)
    return None

# Advantage: Non-existent keys are quickly rejected without disk I/O
```

### Characteristics of Bloom Filter

| **Feature** | **Description** |
|----------|----------|
| **Space Efficiency** | Very small memory usage (bit array) |
| **Speed** | O(k) - k is number of hash functions |
| **False Positive** | Possible (reports existence when not present) |
| **False Negative** | Impossible (never reports absence when present) |
| **Deletion** | Not possible by default (possible with Counting Bloom Filter) |

---

## 🧮 Bloom Filter Operation Principles {#bloom-filter-operation-principles}

### Basic Structure

```python
import mmh3  # MurmurHash3
import math

class BloomFilter:
    """Bloom Filter implementation"""
    
    def __init__(self, capacity, error_rate=0.01):
        """
        capacity: Expected number of elements
        error_rate: Acceptable False Positive rate
        """
        self.capacity = capacity
        self.error_rate = error_rate
        
        # Calculate bit array size
        # m = -n * ln(p) / (ln(2)^2)
        self.bit_array_size = int(-capacity * math.log(error_rate) / (math.log(2) ** 2))
        
        # Calculate number of hash functions
        # k = (m/n) * ln(2)
        self.hash_count = int((self.bit_array_size / capacity) * math.log(2))
        
        # Initialize bit array
        self.bit_array = [0] * self.bit_array_size
    
    def _hash(self, item, seed):
        """Hash function (using MurmurHash3)"""
        return mmh3.hash(item, seed) % self.bit_array_size
    
    def add(self, item):
        """Add element"""
        for i in range(self.hash_count):
            index = self._hash(item, i)
            self.bit_array[index] = 1
    
    def might_contain(self, item):
        """Check element existence possibility"""
        for i in range(self.hash_count):
            index = self._hash(item, i)
            if self.bit_array[index] == 0:
                return False  # Definitely does not exist
        return True  # May exist (False Positive possible)

# Usage example
bloom = BloomFilter(capacity=1000, error_rate=0.01)

# Add elements
bloom.add("user:1")
bloom.add("user:2")
bloom.add("user:3")

# Check existence
print(bloom.might_contain("user:1"))  # True
print(bloom.might_contain("user:999"))  # False (definitely not present)
print(bloom.might_contain("user:1001"))  # True or False (False Positive possible)
```

### Hash Functions and Bit Array

```
Bloom Filter operation process:

1. Add element:
   "user:1" → Hash1 → Index 5 → Bit[5] = 1
            → Hash2 → Index 12 → Bit[12] = 1
            → Hash3 → Index 23 → Bit[23] = 1

2. Check element:
   "user:1" → Hash1 → Index 5 → Bit[5] == 1? ✓
            → Hash2 → Index 12 → Bit[12] == 1? ✓
            → Hash3 → Index 23 → Bit[23] == 1? ✓
            → "May exist" (True)

   "user:999" → Hash1 → Index 7 → Bit[7] == 1? ✗
              → "Definitely does not exist" (False)
```

### False Positive Rate Calculation

```python
def calculate_false_positive_rate(n, m, k):
    """
    n: Actual number of elements
    m: Bit array size
    k: Number of hash functions
    """
    # False Positive probability = (1 - e^(-kn/m))^k
    import math
    return (1 - math.exp(-k * n / m)) ** k

# Example
n = 1000  # 1000 elements
m = 9585  # Bit array size (when error_rate=0.01)
k = 7     # Number of hash functions

fp_rate = calculate_false_positive_rate(n, m, k)
print(f"False Positive Rate: {fp_rate:.4f}")  # Approximately 0.01 (1%)
```

### Optimal Parameter Selection

```python
def optimal_bloom_filter_params(capacity, error_rate):
    """Calculate optimal Bloom Filter parameters"""
    import math
    
    # Bit array size
    m = int(-capacity * math.log(error_rate) / (math.log(2) ** 2))
    
    # Number of hash functions
    k = int((m / capacity) * math.log(2))
    
    return {
        'bit_array_size': m,
        'hash_count': k,
        'memory_bytes': m / 8,  # Convert bits to bytes
        'bits_per_element': m / capacity
    }

# Example: 1 million elements, 1% error rate
params = optimal_bloom_filter_params(1_000_000, 0.01)
print(f"Bit array size: {params['bit_array_size']:,} bits")
print(f"Number of hash functions: {params['hash_count']}")
print(f"Memory usage: {params['memory_bytes'] / 1024 / 1024:.2f} MB")
print(f"Bits per element: {params['bits_per_element']:.2f}")

# Output:
# Bit array size: 9,585,058 bits
# Number of hash functions: 7
# Memory usage: 1.14 MB
# Bits per element: 9.59
```

---

## 🔗 Combining LSM Tree and Bloom Filter {#combining-lsm-tree-and-bloom-filter}

### Integrated Architecture

```python
class SSTableWithBloomFilter:
    """SSTable with Bloom Filter"""
    
    def __init__(self, sorted_data):
        self.data = dict(sorted_data)
        self.min_key = min(self.data.keys())
        self.max_key = max(self.data.keys())
        
        # Create Bloom Filter
        self.bloom_filter = BloomFilter(
            capacity=len(self.data),
            error_rate=0.01
        )
        
        # Add all keys to Bloom Filter
        for key in self.data.keys():
            self.bloom_filter.add(key)
    
    def get(self, key):
        """Query after filtering with Bloom Filter"""
        # 1. Quick filtering with Bloom Filter
        if not self.bloom_filter.might_contain(key):
            return None  # Definitely not present → No disk I/O
        
        # 2. Actual data query (disk I/O occurs)
        return self.data.get(key)

class OptimizedLSMTree:
    """LSM Tree integrated with Bloom Filter"""
    
    def __init__(self):
        self.memtable = MemTable()
        self.sstables = []
        self.wal = WAL("wal.log")
    
    def get(self, key):
        """Optimized read - leveraging Bloom Filter"""
        
        # 1. Search MemTable (memory, fastest)
        if key in self.memtable.data:
            return self.memtable.data[key]
        
        # 2. Search SSTables (filtered with Bloom Filter)
        for sstable in reversed(self.sstables):
            # Check with Bloom Filter first (memory, fast)
            if sstable.bloom_filter.might_contain(key):
                # May actually exist → Query from disk
                value = sstable.get(key)
                if value is not None:
                    return value
        
        return None

# Performance comparison
def benchmark_read_performance():
    """Read performance benchmark"""
    import time
    
    lsm_without_bf = LSMTree()  # Without Bloom Filter
    lsm_with_bf = OptimizedLSMTree()  # With Bloom Filter
    
    # Prepare test data
    for i in range(10000):
        lsm_without_bf.put(f"key:{i}", f"value:{i}")
        lsm_with_bf.put(f"key:{i}", f"value:{i}")
    
    # Search for non-existent keys (biggest difference)
    start = time.time()
    for i in range(10000, 20000):
        lsm_without_bf.get(f"key:{i}")  # Search all SSTables
    time_without_bf = time.time() - start
    
    start = time.time()
    for i in range(10000, 20000):
        lsm_with_bf.get(f"key:{i}")  # Quick filtering with Bloom Filter
    time_with_bf = time.time() - start
    
    print(f"Without Bloom Filter: {time_without_bf:.4f} seconds")
    print(f"With Bloom Filter: {time_with_bf:.4f} seconds")
    print(f"Performance improvement: {time_without_bf / time_with_bf:.2f}x")

# benchmark_read_performance()
# Example output:
# Without Bloom Filter: 2.3456 seconds
# With Bloom Filter: 0.1234 seconds
# Performance improvement: 19.01x
```

### Performance Improvement Effects

| **Scenario** | **Without Bloom Filter** | **With Bloom Filter** | **Improvement** |
|-------------|----------------------|----------------------|----------|
| **Existing Key** | Search all levels | Search all levels | Similar |
| **Non-existent Key** | Search all levels | Immediately rejected in memory | **10-100x** |
| **Partially Existing Key** | Search some levels | Search some levels | **2-5x** |

---

## 🗄️ Real Database Implementations {#real-database-implementations}

### RocksDB

RocksDB is an LSM Tree-based storage engine developed by Facebook.

#### **RocksDB Architecture**

```
RocksDB Structure:
┌─────────────────────┐
│   MemTable          │  ← SkipList (memory)
│   (SkipList)        │
└─────────────────────┘
         ↓
┌─────────────────────┐
│   Immutable MemTable│  ← Waiting for flush
└─────────────────────┘
         ↓
┌─────────────────────┐
│   L0 SSTable        │  ← Level 0 (multiple files)
│   (Bloom Filter)    │
└─────────────────────┘
         ↓
┌─────────────────────┐
│   L1 SSTable        │  ← Level 1
│   (Bloom Filter)    │
└─────────────────────┘
         ↓
┌─────────────────────┐
│   L2+ SSTable       │  ← Level 2 and above
│   (Bloom Filter)    │
└─────────────────────┘
```

#### **RocksDB Usage Example**

```python
import rocksdb

# Open RocksDB
db = rocksdb.DB("test.db", rocksdb.Options(create_if_missing=True))

# Write (very fast - sequential write)
db.put(b"user:1", b"Alice")
db.put(b"user:2", b"Bob")
db.put(b"user:3", b"Charlie")

# Read (optimized with Bloom Filter)
value = db.get(b"user:1")
print(value)  # b"Alice"

# Batch write (even faster)
batch = rocksdb.WriteBatch()
batch.put(b"user:4", b"David")
batch.put(b"user:5", b"Eve")
db.write(batch)

# Range scan
it = db.iteritems()
it.seek(b"user:")
for key, value in it:
    print(f"{key}: {value}")
```

### Apache Cassandra

Cassandra is a distributed NoSQL database that uses LSM Tree.

#### **Cassandra's LSM Tree Implementation**

```
Cassandra Structure:
┌─────────────────────┐
│   Memtable          │  ← Memory of each node
│   (ConcurrentSkipList)│
└─────────────────────┘
         ↓
┌─────────────────────┐
│   Commit Log        │  ← WAL (disaster recovery)
└─────────────────────┘
         ↓
┌─────────────────────┐
│   SSTable (L0)      │  ← Multiple SSTables
│   (Bloom Filter)    │
└─────────────────────┘
         ↓
┌─────────────────────┐
│   Compaction        │  ← Size-Tiered Compaction
└─────────────────────┘
```

### HBase

HBase is a Hadoop-based distributed database.

#### **HBase's LSM Tree Implementation**

```
HBase Structure:
┌─────────────────────┐
│   MemStore          │  ← RegionServer memory
│   (ConcurrentSkipList)│
└─────────────────────┘
         ↓
┌─────────────────────┐
│   WAL (HLog)        │  ← Stored in HDFS
└─────────────────────┘
         ↓
┌─────────────────────┐
│   HFile (SSTable)   │  ← Stored in HDFS
│   (Bloom Filter)    │
└─────────────────────┘
```

---

## ⚡ Performance Optimization Strategies {#performance-optimization-strategies}

### 1. Bloom Filter Optimization

#### **Adaptive Bloom Filter Size**

```python
class AdaptiveBloomFilter:
    """Bloom Filter that automatically adjusts based on data size"""
    
    def __init__(self, initial_capacity=1000):
        self.capacity = initial_capacity
        self.bloom_filter = BloomFilter(initial_capacity)
        self.actual_count = 0
    
    def add(self, item):
        """Auto-expand capacity when adding elements"""
        self.bloom_filter.add(item)
        self.actual_count += 1
        
        # Expand when actual count exceeds 80% of expected capacity
        if self.actual_count >= self.capacity * 0.8:
            self._expand()
    
    def _expand(self):
        """Expand Bloom Filter"""
        old_filter = self.bloom_filter
        self.capacity *= 2
        self.bloom_filter = BloomFilter(self.capacity)
        
        # Reconstruct existing data (actually done during SSTable regeneration)
        # Simulation here
        print(f"Bloom Filter expanded to {self.capacity}")
```

#### **Block-Level Bloom Filter**

```python
class BlockBloomFilter:
    """Separate Bloom Filter for each block of SSTable"""
    
    def __init__(self, block_size=4096):
        self.block_size = block_size
        self.block_filters = {}  # Bloom Filter per block
    
    def add_to_block(self, key, block_id):
        """Add to specific block's Bloom Filter"""
        if block_id not in self.block_filters:
            self.block_filters[block_id] = BloomFilter(
                capacity=self.block_size
            )
        self.block_filters[block_id].add(key)
    
    def might_contain_in_block(self, key, block_id):
        """Check if key exists in specific block"""
        if block_id not in self.block_filters:
            return False
        return self.block_filters[block_id].might_contain(key)
```

### 2. Compaction Optimization

#### **Compaction Strategy Selection**

```python
class CompactionStrategy:
    """Compaction strategy selection"""
    
    @staticmethod
    def size_tiered_compact(sstables):
        """Size-Tiered: Merge files of similar sizes"""
        # Group SSTables by similar size range
        size_groups = {}
        for sstable in sstables:
            size_range = sstable.size // 1000  # Group by 1KB units
            if size_range not in size_groups:
                size_groups[size_range] = []
            size_groups[size_range].append(sstable)
        
        # Merge if 4 or more in each group
        merged = []
        for size_range, group in size_groups.items():
            if len(group) >= 4:
                merged.append(Compactor.compact(group))
            else:
                merged.extend(group)
        
        return merged
    
    @staticmethod
    def leveled_compact(levels):
        """Leveled: Size limit per level"""
        for level, sstables in enumerate(levels):
            max_files = 10 * (level + 1)  # More files allowed at higher levels
            if len(sstables) > max_files:
                # Merge excess files with next level
                return Compactor.level_compact(
                    sstables[:max_files],
                    levels[level + 1] if level + 1 < len(levels) else []
                )
        return levels
```

### 3. Memory Management

#### **MemTable Size Limit**

```python
class MemoryAwareMemTable(MemTable):
    """MemTable that monitors memory usage"""
    
    def __init__(self, max_size=100, max_memory_mb=100):
        super().__init__(max_size)
        self.max_memory_mb = max_memory_mb
        self.current_memory_mb = 0
    
    def put(self, key, value):
        """Check memory usage"""
        key_size = len(str(key).encode())
        value_size = len(str(value).encode())
        entry_size_mb = (key_size + value_size) / (1024 * 1024)
        
        if self.current_memory_mb + entry_size_mb > self.max_memory_mb:
            # Memory exceeded → Flush immediately
            return self.flush()
        
        self.current_memory_mb += entry_size_mb
        return super().put(key, value)
    
    def flush(self):
        """Reset memory after flush"""
        result = super().flush()
        self.current_memory_mb = 0
        return result
```

---

## 📚 Learning Summary {#learning-summary}

### Key Points

1. **Advantages of LSM Tree**
   - Excellent write performance with sequential writes
   - Reduced Write Amplification
   - Improved compression efficiency
   - Suitable for large-scale data processing

2. **Role of Bloom Filter**
   - Quickly filter non-existent keys
   - Eliminate unnecessary disk I/O
   - Significant performance improvement with small memory

3. **Real Applications**
   - RocksDB: Embedded database
   - Cassandra: Distributed NoSQL
   - HBase: Big data storage

### Performance Comparison Summary

| **Operation** | **B-Tree** | **LSM Tree (No Bloom Filter)** | **LSM Tree (With Bloom Filter)** |
|----------|------------|--------------------------------|----------------------------------|
| **Write** | Slow (random) | Very fast (sequential) | Very fast (sequential) |
| **Read (exists)** | Fast | Medium | Medium |
| **Read (not exists)** | Fast | Slow | Very fast |

### Practical Checklist

- [ ] Is it a write-heavy workload? → Consider LSM Tree
- [ ] Is read performance important? → Bloom Filter essential
- [ ] Are there memory constraints? → Adjust Bloom Filter size
- [ ] Choose Compaction strategy (Size-Tiered vs Leveled)
- [ ] Configure WAL and disaster recovery strategy
- [ ] Set up monitoring and tuning metrics

### Next Steps

- **Distributed LSM Tree**: Distributed architecture of Cassandra, HBase
- **Advanced Compaction**: Tiered Compaction, Universal Compaction
- **Performance Tuning**: Memory allocation, Compaction thread count
- **Monitoring**: Write latency, read latency, Compaction latency

---

> **"LSM Tree and Bloom Filter are core technologies that determine the performance of modern databases."**

LSM Tree is essential for workloads where write performance is important, and Bloom Filter significantly improves read performance. Many modern databases like RocksDB, Cassandra, and HBase achieve excellent performance by combining these two technologies. I hope this guide helps you understand and optimize database internal structures!
