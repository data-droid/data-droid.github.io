---
layout: post
lang: en
title: "Part 2: Apache Flink Advanced Streaming Processing and State Management - Production-grade Real-time Systems"
description: "Learn advanced state management, checkpointing, savepoints, and complex time processing strategies in Apache Flink, and implement advanced patterns that can be applied directly to real-world scenarios."
date: 2025-09-16
author: Data Droid
category: data-engineering
tags: [Apache-Flink, Advanced-State-Management, Checkpointing, Savepoints, Time-Processing, Streaming-Optimization, Python, PyFlink]
series: apache-flink-complete-guide
series_order: 2
reading_time: "40 min"
difficulty: "Advanced"
---

# Part 2: Apache Flink Advanced Streaming Processing and State Management - Production-grade Real-time Systems

> Learn advanced state management, checkpointing, savepoints, and complex time processing strategies in Apache Flink, and implement advanced patterns that can be applied directly to real-world scenarios.

## 📋 Table of Contents

1. [Advanced State Management Patterns](#advanced-state-management-patterns)
2. [Deep Dive into Checkpointing and Savepoints](#deep-dive-into-checkpointing-and-savepoints)
3. [Complex Time Processing Strategies](#complex-time-processing-strategies)
4. [Performance Optimization Techniques](#performance-optimization-techniques)
5. [Real-world Project: Real-time Recommendation System](#real-world-project-real-time-recommendation-system)
6. [Learning Summary](#learning-summary)

## 🗃️ Advanced State Management Patterns

### State Backend

Flink provides various state backends to meet different performance and durability requirements.

#### **1. MemoryStateBackend**
```python
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.datastream.state import MemoryStateBackend

env = StreamExecutionEnvironment.get_execution_environment()

# Memory state backend configuration (for development/testing)
env.set_state_backend(MemoryStateBackend())

# Configuration options
backend = MemoryStateBackend(
    max_state_size=5 * 1024 * 1024,  # 5MB
    asynchronous_snapshots=True
)
env.set_state_backend(backend)
```

#### **2. FsStateBackend**
```python
from pyflink.datastream.state import FsStateBackend

# File system state backend configuration
backend = FsStateBackend(
    checkpoint_data_uri="file:///tmp/flink-checkpoints",
    savepoint_data_uri="file:///tmp/flink-savepoints",
    asynchronous_snapshots=True
)
env.set_state_backend(backend)
```

#### **3. RocksDBStateBackend**
```python
from pyflink.datastream.state import RocksDBStateBackend

# RocksDB state backend configuration (recommended for production)
backend = RocksDBStateBackend(
    checkpoint_data_uri="file:///tmp/flink-checkpoints",
    savepoint_data_uri="file:///tmp/flink-savepoints",
    enable_incremental_checkpointing=True
)
env.set_state_backend(backend)

# RocksDB optimization settings
backend.set_predefined_options(RocksDBConfigurableOptions.PREDEFINED_OPTION_DEFAULT)
backend.set_rocksdb_options(RocksDBConfigurableOptions.ROCKSDB_OPTIONS_FILE)
```

### Advanced State Management Patterns

#### **1. State TTL (Time-To-Live)**
```python
from pyflink.common.state import StateTtlConfig, ValueStateDescriptor
from pyflink.common.time import Time
from pyflink.common.typeinfo import Types

class TTLStateExample(KeyedProcessFunction):
    def __init__(self):
        self.user_session_state = None
    
    def open(self, runtime_context):
        # TTL configuration
        ttl_config = StateTtlConfig.new_builder(Time.hours(24)) \
            .set_update_type(StateTtlConfig.UpdateType.OnCreateAndWrite) \
            .set_state_visibility(StateTtlConfig.StateVisibility.NeverReturnExpired) \
            .cleanup_full_snapshot() \
            .build()
        
        # State descriptor with TTL
        state_descriptor = ValueStateDescriptor("user_session", Types.STRING())
        state_descriptor.enable_time_to_live(ttl_config)
        
        self.user_session_state = runtime_context.get_state(state_descriptor)
    
    def process_element(self, value, ctx):
        # Use state
        current_session = self.user_session_state.value()
        if current_session is None:
            # Create new session
            new_session = f"session_{ctx.timestamp()}"
            self.user_session_state.update(new_session)
            ctx.collect(f"New session created: {new_session}")
        else:
            ctx.collect(f"Existing session: {current_session}")
```

#### **2. State Snapshot and Recovery**
```python
from pyflink.common.state import CheckpointedFunction, ListState

class StatefulFunction(KeyedProcessFunction, CheckpointedFunction):
    def __init__(self):
        self.buffered_elements = []
        self.buffered_elements_state = None
    
    def open(self, runtime_context):
        # State initialization is done in checkpointed_function
        pass
    
    def initialize_state(self, context):
        """Initialize state from checkpoint"""
        self.buffered_elements_state = context.get_operator_state(
            ListStateDescriptor("buffered-elements", Types.STRING())
        )
        
        # Restore previous state
        if context.is_restored():
            for element in self.buffered_elements_state.get():
                self.buffered_elements.append(element)
    
    def snapshot_state(self, context):
        """Create state snapshot"""
        self.buffered_elements_state.clear()
        for element in self.buffered_elements:
            self.buffered_elements_state.add(element)
    
    def process_element(self, value, ctx):
        # Add element to buffer
        self.buffered_elements.append(value)
        
        # Process based on conditions
        if len(self.buffered_elements) >= 10:
            # Batch processing
            result = self.process_batch(self.buffered_elements)
            ctx.collect(result)
            self.buffered_elements.clear()
    
    def process_batch(self, elements):
        return f"Processed batch of {len(elements)} elements"
```

#### **3. State Partitioning and Merging**
```python
class PartitionableStateFunction(KeyedProcessFunction, CheckpointedFunction):
    def __init__(self):
        self.partitioned_data = {}
        self.partitioned_state = None
    
    def initialize_state(self, context):
        """Initialize partitionable state"""
        self.partitioned_state = context.get_union_list_state(
            ListStateDescriptor("partitioned-data", Types.STRING())
        )
        
        # Restore state
        if context.is_restored():
            for data in self.partitioned_state.get():
                self.partitioned_data[data] = data
    
    def snapshot_state(self, context):
        """State snapshot"""
        self.partitioned_state.clear()
        for data in self.partitioned_data.values():
            self.partitioned_state.add(data)
    
    def process_element(self, value, ctx):
        # Process partitioned data
        partition_key = value % 4  # Partition into 4 parts
        
        if partition_key not in self.partitioned_data:
            self.partitioned_data[partition_key] = []
        
        self.partitioned_data[partition_key].append(value)
        
        # Aggregate by partition
        if len(self.partitioned_data[partition_key]) >= 5:
            result = sum(self.partitioned_data[partition_key])
            ctx.collect(f"Partition {partition_key}: {result}")
            self.partitioned_data[partition_key].clear()
```

## 🔄 Deep Dive into Checkpointing and Savepoints

### Advanced Checkpointing Configuration

```python
from pyflink.common.checkpointing import CheckpointingMode, ExternalizedCheckpointCleanup
from pyflink.common.time import Time

class AdvancedCheckpointingSetup:
    def __init__(self, env):
        self.env = env
        self.setup_checkpointing()
    
    def setup_checkpointing(self):
        checkpoint_config = self.env.get_checkpoint_config()
        
        # Enable basic checkpointing
        checkpoint_config.enable_checkpointing(1000)  # Every 1 second
        
        # Set exactly-once mode
        checkpoint_config.set_checkpointing_mode(CheckpointingMode.EXACTLY_ONCE)
        
        # Externalized checkpoint configuration (persist after job cancellation)
        checkpoint_config.enable_externalized_checkpoints(
            ExternalizedCheckpointCleanup.RETAIN_ON_CANCELLATION
        )
        
        # Maximum concurrent checkpoints
        checkpoint_config.set_max_concurrent_checkpoints(1)
        
        # Minimum pause between checkpoints
        checkpoint_config.set_min_pause_between_checkpoints(500)
        
        # Checkpoint timeout
        checkpoint_config.set_checkpoint_timeout(60000)  # 60 seconds
        
        # Failure tolerance number
        checkpoint_config.set_tolerable_checkpoint_failure_number(3)
        
        # Unaligned checkpoint configuration
        checkpoint_config.set_unaligned_checkpoints(True)
        checkpoint_config.set_unaligned_checkpoints_enabled(True)
```

### Savepoint Management

```python
import requests
import json

class SavepointManager:
    def __init__(self, flink_rest_url="http://localhost:8081"):
        self.rest_url = flink_rest_url
    
    def create_savepoint(self, job_id, savepoint_path):
        """Create savepoint"""
        url = f"{self.rest_url}/jobs/{job_id}/savepoints"
        
        payload = {
            "target-directory": savepoint_path,
            "cancel-job": False
        }
        
        response = requests.post(url, json=payload)
        
        if response.status_code == 202:
            trigger_id = response.json()["request-id"]
            return self.wait_for_completion(trigger_id)
        else:
            raise Exception(f"Failed to create savepoint: {response.text}")
    
    def wait_for_completion(self, trigger_id, max_wait_time=300):
        """Wait for savepoint completion"""
        import time
        
        start_time = time.time()
        while time.time() - start_time < max_wait_time:
            url = f"{self.rest_url}/jobs/savepoints/{trigger_id}"
            response = requests.get(url)
            
            if response.status_code == 200:
                result = response.json()
                if result["status"]["id"] == "COMPLETED":
                    return result["operation"]["location"]
                elif result["status"]["id"] == "FAILED":
                    raise Exception(f"Savepoint failed: {result}")
            
            time.sleep(2)
        
        raise Exception("Savepoint creation timeout")
    
    def restore_from_savepoint(self, savepoint_path, jar_path):
        """Restore from savepoint"""
        url = f"{self.rest_url}/jars/upload"
        
        # Upload JAR file
        with open(jar_path, 'rb') as f:
            files = {'jarfile': f}
            response = requests.post(url, files=files)
        
        if response.status_code == 200:
            jar_id = response.json()["filename"].split("/")[-1]
            
            # Start job from savepoint
            start_url = f"{self.rest_url}/jars/{jar_id}/run"
            payload = {
                "savepointPath": savepoint_path
            }
            
            start_response = requests.post(start_url, json=payload)
            return start_response.status_code == 200
        else:
            raise Exception(f"Failed to upload JAR: {response.text}")
    
    def list_savepoints(self):
        """List savepoints"""
        # In actual implementation, scan file system or query metadata store
        return []

# Usage example
def manage_savepoints_example():
    manager = SavepointManager()
    
    try:
        # Create savepoint
        savepoint_location = manager.create_savepoint(
            "job-id-123",
            "file:///tmp/flink-savepoints/"
        )
        print(f"Savepoint created: {savepoint_location}")
        
        # Restore from savepoint
        success = manager.restore_from_savepoint(
            savepoint_location,
            "/path/to/job.jar"
        )
        print(f"Restore success: {success}")
        
    except Exception as e:
        print(f"Error: {e}")
```

### Checkpoint Monitoring

```python
class CheckpointMonitor:
    def __init__(self, flink_rest_url="http://localhost:8081"):
        self.rest_url = flink_rest_url
    
    def get_checkpoint_metrics(self, job_id):
        """Get checkpoint metrics"""
        url = f"{self.rest_url}/jobs/{job_id}/checkpoints"
        response = requests.get(url)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"Failed to get checkpoint metrics: {response.text}")
    
    def analyze_checkpoint_performance(self, job_id):
        """Analyze checkpoint performance"""
        metrics = self.get_checkpoint_metrics(job_id)
        
        checkpoints = metrics.get("latest", {}).get("completed", [])
        
        if not checkpoints:
            return {"message": "No completed checkpoints found"}
        
        # Performance analysis
        durations = [cp["duration"] for cp in checkpoints]
        sizes = [cp["size"] for cp in checkpoints]
        
        analysis = {
            "total_checkpoints": len(checkpoints),
            "avg_duration_ms": sum(durations) / len(durations),
            "max_duration_ms": max(durations),
            "min_duration_ms": min(durations),
            "avg_size_bytes": sum(sizes) / len(sizes),
            "max_size_bytes": max(sizes),
            "min_size_bytes": min(sizes)
        }
        
        # Performance recommendations
        recommendations = []
        
        if analysis["avg_duration_ms"] > 10000:  # More than 10 seconds
            recommendations.append({
                "type": "performance",
                "message": "Checkpoint duration is long and may affect performance. Consider reducing state size or optimizing backend."
            })
        
        if analysis["avg_size_bytes"] > 100 * 1024 * 1024:  # More than 100MB
            recommendations.append({
                "type": "storage",
                "message": "Checkpoint size is large. Consider cleaning unnecessary state or setting TTL."
            })
        
        analysis["recommendations"] = recommendations
        
        return analysis

# Monitoring example
def checkpoint_monitoring_example():
    monitor = CheckpointMonitor()
    
    try:
        analysis = monitor.analyze_checkpoint_performance("job-id-123")
        print("=== Checkpoint Performance Analysis ===")
        print(json.dumps(analysis, indent=2))
    except Exception as e:
        print(f"Error: {e}")
```

## ⏰ Complex Time Processing Strategies

### Multi-time Window Processing

```python
from pyflink.datastream.window import TumblingEventTimeWindows, SlidingEventTimeWindows
from pyflink.datastream.functions import AllWindowFunction
from pyflink.common.time import Time
from pyflink.common.typeinfo import Types

class MultiTimeWindowProcessor(AllWindowFunction):
    def __init__(self):
        self.window_results = {}
    
    def apply(self, window, inputs, out):
        """Process data in multi-time windows"""
        window_start = window.start
        window_end = window.end
        
        # Aggregate by window
        window_key = f"{window_start}_{window_end}"
        
        if window_key not in self.window_results:
            self.window_results[window_key] = {
                "count": 0,
                "sum": 0,
                "min": float('inf'),
                "max": float('-inf')
            }
        
        for element in inputs:
            value = element[1]  # Assuming (timestamp, value) format
            self.window_results[window_key]["count"] += 1
            self.window_results[window_key]["sum"] += value
            self.window_results[window_key]["min"] = min(
                self.window_results[window_key]["min"], value
            )
            self.window_results[window_key]["max"] = max(
                self.window_results[window_key]["max"], value
            )
        
        # Output result
        result = self.window_results[window_key].copy()
        result["window_start"] = window_start
        result["window_end"] = window_end
        out.collect(result)

class AdvancedTimeProcessing:
    def __init__(self, env):
        self.env = env
    
    def setup_multi_window_processing(self, data_stream):
        """Setup multi-window processing"""
        # 1-minute window
        one_minute_window = data_stream.window_all(
            TumblingEventTimeWindows.of(Time.minutes(1))
        ).apply(MultiTimeWindowProcessor(), output_type=Types.PICKLED_BYTE_ARRAY())
        
        # 5-minute window
        five_minute_window = data_stream.window_all(
            TumblingEventTimeWindows.of(Time.minutes(5))
        ).apply(MultiTimeWindowProcessor(), output_type=Types.PICKLED_BYTE_ARRAY())
        
        # 1-minute sliding window (30-second slide)
        sliding_window = data_stream.window_all(
            SlidingEventTimeWindows.of(Time.minutes(1), Time.seconds(30))
        ).apply(MultiTimeWindowProcessor(), output_type=Types.PICKLED_BYTE_ARRAY())
        
        return {
            "one_minute": one_minute_window,
            "five_minute": five_minute_window,
            "sliding": sliding_window
        }
```

### Dynamic Watermark Generation

```python
from pyflink.datastream.functions import ProcessFunction
from pyflink.common.time import Time

class DynamicWatermarkGenerator(ProcessFunction):
    def __init__(self, max_delay_seconds=60):
        self.max_delay_seconds = max_delay_seconds
        self.current_watermark = 0
        self.element_count = 0
        self.delay_statistics = []
    
    def process_element(self, element, ctx):
        """Generate dynamic watermarks"""
        event_time = element.timestamp
        processing_time = ctx.timer_service().current_processing_time()
        
        # Calculate delay
        delay = processing_time - event_time
        self.delay_statistics.append(delay)
        
        # Adjust watermark based on average delay of recent 100 elements
        if len(self.delay_statistics) > 100:
            self.delay_statistics.pop(0)
        
        if self.delay_statistics:
            avg_delay = sum(self.delay_statistics) / len(self.delay_statistics)
            dynamic_delay = max(avg_delay * 1.5, self.max_delay_seconds * 1000)
            
            # Generate dynamic watermark
            new_watermark = event_time - dynamic_delay
            if new_watermark > self.current_watermark:
                self.current_watermark = new_watermark
                ctx.timer_service().register_event_time_timer(new_watermark)
        
        # Process element
        ctx.collect(element)
    
    def on_timer(self, timestamp, ctx, out):
        """Timer-based watermark generation"""
        # Periodically generate watermarks
        current_time = ctx.timer_service().current_processing_time()
        next_watermark = current_time - (self.max_delay_seconds * 1000)
        
        if next_watermark > self.current_watermark:
            self.current_watermark = next_watermark
            ctx.timer_service().register_processing_time_timer(current_time + 1000)
```

### Time-based State Management

```python
from pyflink.common.state import ValueStateDescriptor
from pyflink.datastream.functions import KeyedProcessFunction

class TimeBasedStateManager(KeyedProcessFunction):
    def __init__(self):
        self.user_activity_state = None
        self.last_activity_time = None
        self.session_timeout_ms = 30 * 60 * 1000  # 30 minutes
    
    def open(self, runtime_context):
        self.user_activity_state = runtime_context.get_state(
            ValueStateDescriptor("user_activity", Types.STRING())
        )
        self.last_activity_time = runtime_context.get_state(
            ValueStateDescriptor("last_activity_time", Types.LONG())
        )
    
    def process_element(self, element, ctx):
        """Time-based state management"""
        current_time = ctx.timestamp()
        user_id = element.user_id
        
        # Check previous activity time
        last_time = self.last_activity_time.value()
        
        if last_time is None or (current_time - last_time) > self.session_timeout_ms:
            # Start new session
            new_session = f"session_{current_time}"
            self.user_activity_state.update(new_session)
            
            # Register session timeout timer
            timeout_timer = current_time + self.session_timeout_ms
            ctx.timer_service().register_event_time_timer(timeout_timer)
            
            ctx.collect(f"New session started for user {user_id}: {new_session}")
        else:
            # Update existing session
            current_session = self.user_activity_state.value()
            ctx.collect(f"Activity in existing session: {current_session}")
        
        # Update last activity time
        self.last_activity_time.update(current_time)
    
    def on_timer(self, timestamp, ctx, out):
        """Handle session timeout"""
        # Process session termination
        session = self.user_activity_state.value()
        if session:
            out.collect(f"Session timeout: {session}")
            self.user_activity_state.clear()
            self.last_activity_time.clear()
```

## ⚡ Performance Optimization Techniques

### Parallelism Optimization

```python
from pyflink.datastream import StreamExecutionEnvironment
from pyflink.datastream.connectors import FlinkKafkaConsumer
from pyflink.common.serialization import SimpleStringSchema

class ParallelismOptimizer:
    def __init__(self, env):
        self.env = env
    
    def optimize_kafka_parallelism(self, topic, bootstrap_servers):
        """Optimize Kafka parallelism"""
        kafka_properties = {
            'bootstrap.servers': bootstrap_servers,
            'group.id': 'optimized-consumer-group'
        }
        
        kafka_source = FlinkKafkaConsumer(
            topic,
            SimpleStringSchema(),
            kafka_properties
        )
        
        # Set parallelism to match partition count
        kafka_source.set_parallelism(4)  # Match Kafka partition count
        
        return self.env.add_source(kafka_source)
    
    def optimize_processing_parallelism(self, data_stream):
        """Optimize processing parallelism"""
        # Set key-based parallelism
        keyed_stream = data_stream.key_by(lambda x: x[0])  # Key by first field
        
        # Set parallel processing
        optimized_stream = keyed_stream.map(
            lambda x: self.expensive_operation(x),
            output_type=Types.STRING()
        ).set_parallelism(8)  # Set high parallelism
        
        return optimized_stream
    
    def expensive_operation(self, data):
        """Simulate expensive operation"""
        import time
        time.sleep(0.01)  # 10ms processing time
        return f"processed_{data}"

class MemoryOptimizer:
    def __init__(self, env):
        self.env = env
    
    def setup_memory_optimization(self):
        """Setup memory optimization"""
        # JVM heap memory settings
        self.env.get_config().set_global_job_parameters({
            "taskmanager.memory.process.size": "2048m",
            "taskmanager.memory.managed.size": "1024m"
        })
        
        # Network buffer settings
        self.env.get_config().set_global_job_parameters({
            "taskmanager.network.memory.fraction": "0.2",
            "taskmanager.network.memory.min": "128mb",
            "taskmanager.network.memory.max": "1gb"
        })
        
        # State backend optimization
        from pyflink.datastream.state import RocksDBStateBackend
        backend = RocksDBStateBackend(
            checkpoint_data_uri="file:///tmp/flink-checkpoints",
            enable_incremental_checkpointing=True
        )
        
        # RocksDB memory settings
        backend.set_rocksdb_options({
            "write_buffer_size": "64MB",
            "max_write_buffer_number": "3",
            "block_cache_size": "256MB"
        })
        
        self.env.set_state_backend(backend)
    
    def optimize_data_serialization(self, data_stream):
        """Optimize data serialization"""
        # Kryo serialization settings
        self.env.get_config().set_global_job_parameters({
            "taskmanager.runtime.kryo.default.serializers": "true"
        })
        
        # Use Arrow-based serialization
        optimized_stream = data_stream.map(
            lambda x: x,  # No transformation
            output_type=Types.PICKLED_BYTE_ARRAY()  # Optimized type
        )
        
        return optimized_stream
```

### Network Optimization

```python
class NetworkOptimizer:
    def __init__(self, env):
        self.env = env
    
    def setup_network_optimization(self):
        """Setup network optimization"""
        # Network stack optimization
        self.env.get_config().set_global_job_parameters({
            "taskmanager.network.netty.num-arenas": "4",
            "taskmanager.network.netty.server.numThreads": "4",
            "taskmanager.network.netty.client.numThreads": "4",
            "taskmanager.network.netty.server.backlog": "0"
        })
        
        # Buffer size optimization
        self.env.get_config().set_global_job_parameters({
            "taskmanager.network.memory.buffers-per-channel": "2",
            "taskmanager.network.memory.floating-buffers-per-gate": "8"
        })
    
    def optimize_shuffle_network(self, data_stream):
        """Optimize shuffle network"""
        # Optimize data partitioning
        optimized_stream = data_stream.partition_custom(
            lambda key, num_partitions: hash(key) % num_partitions,
            lambda x: x[0]  # Key extraction function
        )
        
        return optimized_stream

class LatencyOptimizer:
    def __init__(self, env):
        self.env = env
    
    def setup_low_latency_config(self):
        """Setup low latency configuration"""
        # Minimize buffer timeout
        self.env.get_config().set_global_job_parameters({
            "taskmanager.network.netty.server.backlog": "0",
            "taskmanager.network.netty.client.connectTimeoutSec": "10"
        })
        
        # Adjust checkpointing interval
        self.env.get_checkpoint_config().enable_checkpointing(100)  # 100ms
        
        # Enable unaligned checkpoints
        self.env.get_checkpoint_config().set_unaligned_checkpoints(True)
    
    def optimize_processing_latency(self, data_stream):
        """Optimize processing latency"""
        # Set streaming mode
        self.env.set_buffer_timeout(1)  # 1ms buffer timeout
        
        # Set immediate processing
        optimized_stream = data_stream.map(
            lambda x: x,
            output_type=Types.STRING()
        ).set_buffer_timeout(0)  # Process immediately without buffering
        
        return optimized_stream
```

## 🚀 Real-world Project: Real-time Recommendation System

### Project Overview

Build a real-time recommendation system that analyzes user behavior data and provides personalized recommendations.

### 1. Data Model Definition

```python
from dataclasses import dataclass
from typing import List, Dict, Optional
import json

@dataclass
class UserEvent:
    user_id: str
    item_id: str
    event_type: str  # view, click, purchase, like
    timestamp: int
    session_id: str
    metadata: Dict
    
    def to_json(self):
        return json.dumps({
            'user_id': self.user_id,
            'item_id': self.item_id,
            'event_type': self.event_type,
            'timestamp': self.timestamp,
            'session_id': self.session_id,
            'metadata': self.metadata
        })
    
    @classmethod
    def from_json(cls, json_str):
        data = json.loads(json_str)
        return cls(**data)

@dataclass
class UserProfile:
    user_id: str
    interests: Dict[str, float]  # Interest by category
    behavior_patterns: Dict[str, int]  # Behavior patterns
    last_updated: int
    
    def update_interest(self, category: str, weight: float):
        """Update interest"""
        if category not in self.interests:
            self.interests[category] = 0.0
        
        # Update using exponential moving average
        alpha = 0.1
        self.interests[category] = (1 - alpha) * self.interests[category] + alpha * weight
    
    def get_top_interests(self, top_k: int = 5):
        """Return top interests"""
        return sorted(
            self.interests.items(),
            key=lambda x: x[1],
            reverse=True
        )[:top_k]

@dataclass
class Recommendation:
    user_id: str
    item_id: str
    score: float
    reason: str
    timestamp: int
```

### 2. Real-time User Profiling

```python
from pyflink.datastream.functions import KeyedProcessFunction
from pyflink.common.state import ValueStateDescriptor, MapStateDescriptor
from pyflink.common.typeinfo import Types

class RealTimeUserProfiler(KeyedProcessFunction):
    def __init__(self):
        self.user_profile_state = None
        self.item_categories = {}  # Item-category mapping
    
    def open(self, runtime_context):
        self.user_profile_state = runtime_context.get_state(
            ValueStateDescriptor("user_profile", Types.STRING())
        )
    
    def process_element(self, user_event, ctx):
        """Update user profile in real-time"""
        user_id = user_event.user_id
        
        # Load current profile
        profile_json = self.user_profile_state.value()
        if profile_json:
            profile = UserProfile.from_json(profile_json)
        else:
            profile = UserProfile(
                user_id=user_id,
                interests={},
                behavior_patterns={},
                last_updated=user_event.timestamp
            )
        
        # Process by event type
        self.update_profile_from_event(profile, user_event)
        
        # Save profile
        self.user_profile_state.update(profile.to_json())
        
        # Output updated profile
        ctx.collect(profile)
    
    def update_profile_from_event(self, profile: UserProfile, event: UserEvent):
        """Update profile based on event"""
        # Get item category (in practice, query from separate service)
        category = self.get_item_category(event.item_id)
        
        # Weight by event type
        event_weights = {
            'view': 0.1,
            'click': 0.3,
            'like': 0.5,
            'purchase': 1.0
        }
        
        weight = event_weights.get(event.event_type, 0.1)
        
        # Update interest
        profile.update_interest(category, weight)
        
        # Update behavior pattern
        pattern_key = f"{event.event_type}_{category}"
        profile.behavior_patterns[pattern_key] = \
            profile.behavior_patterns.get(pattern_key, 0) + 1
        
        profile.last_updated = event.timestamp
    
    def get_item_category(self, item_id: str) -> str:
        """Get item category"""
        # In practice, query from database or cache
        categories = ['electronics', 'books', 'clothing', 'home', 'sports']
        return categories[hash(item_id) % len(categories)]
    
    def to_json(self):
        return json.dumps({
            'user_id': self.user_id,
            'interests': self.interests,
            'behavior_patterns': self.behavior_patterns,
            'last_updated': self.last_updated
        })
    
    @classmethod
    def from_json(cls, json_str):
        data = json.loads(json_str)
        return cls(**data)
```

### 3. Collaborative Filtering-based Recommendation Engine

```python
class CollaborativeFilteringEngine(KeyedProcessFunction):
    def __init__(self):
        self.user_item_matrix = None
        self.item_item_similarity = None
        self.user_similarity = None
    
    def open(self, runtime_context):
        self.user_item_matrix = runtime_context.get_map_state(
            MapStateDescriptor("user_item_matrix", Types.STRING(), Types.FLOAT())
        )
        self.item_item_similarity = runtime_context.get_map_state(
            MapStateDescriptor("item_similarity", Types.STRING(), Types.FLOAT())
        )
        self.user_similarity = runtime_context.get_map_state(
            MapStateDescriptor("user_similarity", Types.STRING(), Types.FLOAT())
        )
    
    def process_element(self, user_event, ctx):
        """Generate collaborative filtering-based recommendations"""
        user_id = user_event.user_id
        item_id = user_event.item_id
        
        # Update user-item matrix
        matrix_key = f"{user_id}:{item_id}"
        current_rating = self.user_item_matrix.get(matrix_key) or 0.0
        
        # Calculate rating from event
        event_rating = self.calculate_rating_from_event(user_event)
        new_rating = (current_rating + event_rating) / 2
        
        self.user_item_matrix.put(matrix_key, new_rating)
        
        # Generate item-based recommendations
        item_recommendations = self.generate_item_based_recommendations(user_id, item_id)
        
        # Generate user-based recommendations
        user_recommendations = self.generate_user_based_recommendations(user_id)
        
        # Combine recommendation results
        final_recommendations = self.combine_recommendations(
            item_recommendations, user_recommendations
        )
        
        for rec in final_recommendations:
            ctx.collect(rec)
    
    def calculate_rating_from_event(self, event: UserEvent) -> float:
        """Calculate rating from event"""
        rating_map = {
            'view': 1.0,
            'click': 2.0,
            'like': 3.0,
            'purchase': 5.0
        }
        return rating_map.get(event.event_type, 1.0)
    
    def generate_item_based_recommendations(self, user_id: str, item_id: str, top_k: int = 10):
        """Generate item-based recommendations"""
        # Find similar items
        similar_items = self.find_similar_items(item_id, top_k)
        
        recommendations = []
        for similar_item, similarity in similar_items:
            # Only recommend items user hasn't interacted with
            matrix_key = f"{user_id}:{similar_item}"
            if not self.user_item_matrix.get(matrix_key):
                score = similarity * 0.8  # Item-based weight
                recommendations.append(Recommendation(
                    user_id=user_id,
                    item_id=similar_item,
                    score=score,
                    reason="Similar to items you liked",
                    timestamp=int(time.time())
                ))
        
        return sorted(recommendations, key=lambda x: x.score, reverse=True)[:top_k]
    
    def generate_user_based_recommendations(self, user_id: str, top_k: int = 10):
        """Generate user-based recommendations"""
        # Find similar users
        similar_users = self.find_similar_users(user_id, top_k)
        
        recommendations = []
        for similar_user, similarity in similar_users:
            # Items liked by similar users that current user hasn't interacted with
            user_items = self.get_user_items(similar_user)
            current_user_items = self.get_user_items(user_id)
            
            for item_id in user_items:
                if item_id not in current_user_items:
                    score = similarity * 0.6  # User-based weight
                    recommendations.append(Recommendation(
                        user_id=user_id,
                        item_id=item_id,
                        score=score,
                        reason="Users with similar tastes liked this",
                        timestamp=int(time.time())
                    ))
        
        return sorted(recommendations, key=lambda x: x.score, reverse=True)[:top_k]
    
    def find_similar_items(self, item_id: str, top_k: int):
        """Find similar items"""
        # In practice, use more sophisticated similarity calculation algorithms
        similar_items = []
        
        # Calculate similarity with all items (simple example)
        for other_item in self.get_all_items():
            if other_item != item_id:
                similarity = self.calculate_item_similarity(item_id, other_item)
                similar_items.append((other_item, similarity))
        
        return sorted(similar_items, key=lambda x: x[1], reverse=True)[:top_k]
    
    def calculate_item_similarity(self, item1: str, item2: str) -> float:
        """Calculate item similarity (cosine similarity)"""
        # In practice, calculate based on user-item matrix
        return abs(hash(item1) - hash(item2)) / (hash(item1) + hash(item2) + 1)
    
    def get_all_items(self):
        """Return all items list"""
        # In practice, query from database
        return [f"item_{i}" for i in range(1000)]
    
    def get_user_items(self, user_id: str):
        """Return items user has interacted with"""
        items = []
        for key in self.user_item_matrix.keys():
            if key.startswith(f"{user_id}:"):
                item_id = key.split(":")[1]
                items.append(item_id)
        return items
    
    def combine_recommendations(self, item_recs, user_recs):
        """Combine recommendation results"""
        combined = {}
        
        # Add item-based recommendations
        for rec in item_recs:
            combined[rec.item_id] = rec
        
        # Add user-based recommendations (adjust scores)
        for rec in user_recs:
            if rec.item_id in combined:
                # Average scores if already exists
                combined[rec.item_id].score = (combined[rec.item_id].score + rec.score) / 2
            else:
                combined[rec.item_id] = rec
        
        return list(combined.values())
```

### 4. Real-time Recommendation System Integration

```python
class RealTimeRecommendationSystem:
    def __init__(self):
        self.env = StreamExecutionEnvironment.get_execution_environment()
        self.setup_environment()
    
    def setup_environment(self):
        """Setup environment"""
        # Enable checkpointing
        self.env.get_checkpoint_config().enable_checkpointing(1000)
        
        # State backend setup
        from pyflink.datastream.state import RocksDBStateBackend
        backend = RocksDBStateBackend(
            checkpoint_data_uri="file:///tmp/recommendation-checkpoints"
        )
        self.env.set_state_backend(backend)
    
    def create_kafka_source(self, topic, bootstrap_servers):
        """Create Kafka source"""
        from pyflink.datastream.connectors import FlinkKafkaConsumer
        from pyflink.common.serialization import SimpleStringSchema
        
        kafka_properties = {
            'bootstrap.servers': bootstrap_servers,
            'group.id': 'recommendation-system'
        }
        
        kafka_source = FlinkKafkaConsumer(
            topic,
            SimpleStringSchema(),
            kafka_properties
        )
        
        return self.env.add_source(kafka_source)
    
    def parse_user_events(self, event_stream):
        """Parse user events"""
        def parse_event(event_str):
            try:
                return UserEvent.from_json(event_str)
            except Exception as e:
                print(f"Failed to parse event: {event_str}, Error: {e}")
                return None
        
        return event_stream.map(parse_event, output_type=Types.PICKLED_BYTE_ARRAY()) \
                          .filter(lambda x: x is not None)
    
    def run_recommendation_system(self):
        """Run recommendation system"""
        # Read user events from Kafka
        event_stream = self.create_kafka_source("user-events", "localhost:9092")
        
        # Parse events
        parsed_events = self.parse_user_events(event_stream)
        
        # Assign timestamps and watermarks
        from pyflink.datastream.functions import BoundedOutOfOrdernessTimestampExtractor
        from pyflink.common.time import Time
        
        class EventTimestampExtractor(BoundedOutOfOrdernessTimestampExtractor):
            def __init__(self):
                super().__init__(Time.seconds(10))
            
            def extract_timestamp(self, element, previous_timestamp):
                return element.timestamp * 1000
        
        watermarked_events = parsed_events.assign_timestamps_and_watermarks(
            EventTimestampExtractor()
        )
        
        # Real-time user profiling
        user_profiles = watermarked_events.key_by(lambda event: event.user_id) \
                                        .process(RealTimeUserProfiler())
        
        # Collaborative filtering-based recommendations
        recommendations = watermarked_events.key_by(lambda event: event.user_id) \
                                          .process(CollaborativeFilteringEngine())
        
        # Output results
        user_profiles.print("User Profiles")
        recommendations.print("Recommendations")
        
        # Execute
        self.env.execute("Real-time Recommendation System")

# System execution
if __name__ == "__main__":
    system = RealTimeRecommendationSystem()
    system.run_recommendation_system()
```

## 📚 Learning Summary

### What We Learned in This Part

1. **Advanced State Management Patterns**
   - State backends (Memory, Fs, RocksDB)
   - State TTL and automatic cleanup
   - State snapshots and recovery
   - State partitioning and merging

2. **Checkpointing and Savepoints**
   - Advanced checkpointing configuration
   - Savepoint creation and restoration
   - Checkpoint performance monitoring
   - Failure recovery strategies

3. **Complex Time Processing**
   - Multi-time window processing
   - Dynamic watermark generation
   - Time-based state management
   - Late data processing

4. **Performance Optimization**
   - Parallelism optimization
   - Memory optimization
   - Network optimization
   - Latency optimization

5. **Real-world Project**
   - Real-time recommendation system
   - User profiling
   - Collaborative filtering
   - Personalized recommendations

### Core Technology Stack

| Technology | Purpose | Importance |
|------------|---------|------------|
| **Advanced State Management** | Complex state processing | ⭐⭐⭐⭐⭐ |
| **Checkpointing** | Failure recovery and stability | ⭐⭐⭐⭐⭐ |
| **Time Processing** | Accurate time-based analysis | ⭐⭐⭐⭐⭐ |
| **Performance Optimization** | Production environment optimization | ⭐⭐⭐⭐ |
| **Real-time Recommendations** | Personalized services | ⭐⭐⭐⭐ |

### Next Part Preview

**Part 3: Real-time Analytics and CEP (Complex Event Processing)** will cover:
- Complex event processing patterns
- Real-time aggregation and window functions
- CEP pattern matching
- Real-time dashboard construction

---

**Next Part**: [Part 3: Real-time Analytics and CEP](/en/data-engineering/2025/09/17/apache-flink-real-time-analytics.html)

---

*Now you've mastered Flink's advanced features! In the next part, we'll dive into the world of complex event processing.* 🚀
