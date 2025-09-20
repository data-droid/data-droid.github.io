---
layout: post
lang: en
title: "Part 1: Change Data Capture and Debezium Practical Implementation - Complete Real-time Data Synchronization"
description: "From CDC core concepts to building real-time data synchronization systems with Debezium, a complete guide to event-driven architecture."
date: 2025-09-19
author: Data Droid
category: data-engineering
tags: [Change-Data-Capture, CDC, Debezium, Kafka, Real-time-Sync, Event-Driven, Data-Pipeline, Schema-Evolution]
series: change-data-capture-complete-guide
series_order: 1
reading_time: "50 minutes"
difficulty: "Advanced"
---

# Part 1: Change Data Capture and Debezium Practical Implementation - Complete Real-time Data Synchronization

> From CDC core concepts to building real-time data synchronization systems with Debezium, a complete guide to event-driven architecture.

## 📋 Table of Contents

1. [Change Data Capture Basic Concepts](#change-data-capture-basic-concepts)
2. [Debezium Architecture and Core Features](#debezium-architecture-and-core-features)
3. [Debezium Connector Configuration and Operations](#debezium-connector-configuration-and-operations)
4. [Schema Evolution and Schema Registry](#schema-evolution-and-schema-registry)
5. [Real-time Data Transformation and Routing](#real-time-data-transformation-and-routing)
6. [Practical Project: Real-time Data Synchronization System](#practical-project-real-time-data-synchronization-system)
7. [Learning Summary](#learning-summary)

## 🔄 Change Data Capture Basic Concepts

### What is CDC?

Change Data Capture (CDC) is a technology that detects and captures database changes in real-time and propagates them to other systems. It overcomes the limitations of traditional batch processing and enables real-time data synchronization.

### Traditional Batch Processing vs CDC

| Characteristics | Batch Processing | CDC Approach |
|-----------------|------------------|--------------|
| **Latency** | High (hours/days) | Low (seconds/minutes) |
| **Throughput** | High (bulk processing) | Medium (real-time stream) |
| **Complexity** | Low | High |
| **Consistency** | Eventually consistent | Strong consistency possible |
| **Resource Usage** | Periodically high | Continuously medium |
| **Real-time Processing** | Impossible | Possible |
| **Main Use Cases** | • ETL pipelines<br>• Data warehouse construction<br>• Daily/weekly reports<br>• Large-scale data migration | • Real-time analytics<br>• Event-driven architecture<br>• Data lake real-time sync<br>• Microservice data synchronization |

### CDC Adoption ROI Evaluation

| Evaluation Criteria | Score | Conditions | Description |
|---------------------|-------|------------|-------------|
| **Business Requirements** | 9 | Real-time data processing required | Essential for competitive advantage |
| **Technical Infrastructure** | 8 | Kafka ecosystem available | Strong foundation for implementation |
| **Team Expertise** | 7 | Experience with streaming technologies | Requires learning investment |
| **Data Volume** | 9 | High-frequency changes | CDC provides significant benefits |
| **Compliance Requirements** | 8 | Audit trail and data lineage needed | CDC ensures complete change tracking |
| **System Integration** | 8 | Multiple downstream systems | CDC reduces integration complexity |

### ROI Recommendation

| Total Score | Recommendation | Priority |
|-------------|----------------|----------|
| **49/60** | **Highly Recommended** | **High Priority** |

### CDC Tool Selection Criteria

| Conditions | Recommended Tool | Reason |
|------------|------------------|---------|
| **Open source preferred** | Debezium | Most mature open-source CDC solution |
| **Cloud-native required** | AWS DMS | Fully managed service |
| **High performance needed** | Maxwell | Optimized for MySQL |
| **Enterprise features required** | Confluent Platform | Comprehensive enterprise solution |

### Selection Criteria Weights

| Criteria | Weight |
|----------|--------|
| **Performance** | 25% |
| **Reliability** | 20% |
| **Community Support** | 15% |
| **Documentation** | 15% |
| **Cost** | 10% |
| **Ease of Use** | 10% |
| **Integration** | 5% |

## 🏗️ Debezium Architecture and Core Features

### Debezium Architecture Overview

Debezium is built on Apache Kafka and Kafka Connect, providing a distributed platform for capturing database changes.

### Core Components

Debezium consists of several key components that work together to provide reliable change data capture:

- **Debezium Connectors**: Database-specific connectors that capture changes
- **Kafka Connect Framework**: Provides the infrastructure for running connectors
- **Schema Registry**: Manages schema evolution and compatibility
- **Kafka Brokers**: Distribute change events across the cluster
- **Consumer Applications**: Process and react to change events

### Database-Specific Change Detection Mechanisms

| Database | Mechanism | Advantages | Limitations |
|----------|-----------|------------|-------------|
| **MySQL** | Binary Log (Binlog) | • High performance<br>• Complete change history<br>• Minimal impact on DB | • Requires binary logging enabled<br>• Binlog retention management |
| **PostgreSQL** | Write-Ahead Log (WAL) | • ACID compliance<br>• Logical replication<br>• Real-time streaming | • WAL segment management<br>• Replication slot monitoring |
| **MongoDB** | Oplog | • Native change stream<br>• Automatic failover<br>• Sharded cluster support | • Oplog size limitations<br>• Memory usage considerations |

### Event Streaming Patterns

| Pattern | Description | Use Case | Implementation |
|---------|-------------|----------|----------------|
| **Event Sourcing** | Store all changes as events | Audit trails, replay capabilities | Event store with Kafka topics |
| **CQRS** | Separate read and write models | High-performance read operations | Write model via CDC, read model via projections |
| **Saga** | Distributed transaction management | Microservice coordination | Event-driven transaction coordination |

```python
class EventStreamingPatterns:
    def implement_event_sourcing_pattern(self):
        """Event Sourcing pattern implementation example"""
        
        # Event store configuration
        event_store_config = {
            "kafka_topics": {
                "order_events": "orders.ecommerce.orders",
                "customer_events": "orders.ecommerce.customers",
                "product_events": "orders.ecommerce.products"
            },
            "event_serialization": "Avro",
            "snapshot_frequency": "every_1000_events",
            "retention_policy": "7_days"
        }
        
        # Event replay example
        def replay_events_for_state(self, entity_id, from_timestamp):
            """Restore entity state by replaying events"""
            events = self.get_events(entity_id, from_timestamp)
            state = {}
            for event in events:
                state = self.apply_event(state, event)
            return state
        
        return event_store_config
    
    def implement_cqrs_pattern(self):
        """CQRS pattern implementation example"""
        
        # Command side (Write Model)
        command_side_config = {
            "write_model": {
                "database": "mysql_orders",
                "tables": ["orders", "order_items"],
                "optimization": "for_writes"
            },
            "event_publishing": {
                "debezium_connector": "mysql-orders-connector",
                "topics": ["orders.ecommerce.orders"]
            }
        }
        
        # Query side (Read Model)
        query_side_config = {
            "read_models": {
                "elasticsearch": {
                    "indexes": ["orders_read_model", "customers_read_model"],
                    "optimization": "for_reads",
                    "projections": ["order_summary", "customer_profile"]
                },
                "redis": {
                    "caches": ["order_cache", "customer_cache"],
                    "ttl": "1_hour"
                }
            }
        }
        
        return {
            "command_side": command_side_config,
            "query_side": query_side_config
        }
    
    def implement_saga_pattern(self):
        """Saga pattern implementation example"""
        
        # Choreography pattern
        choreography_saga = {
            "order_processing_saga": {
                "steps": [
                    {
                        "service": "order_service",
                        "action": "create_order",
                        "compensation": "cancel_order",
                        "event": "OrderCreated"
                    },
                    {
                        "service": "inventory_service", 
                        "action": "reserve_inventory",
                        "compensation": "release_inventory",
                        "event": "InventoryReserved"
                    },
                    {
                        "service": "payment_service",
                        "action": "process_payment",
                        "compensation": "refund_payment",
                        "event": "PaymentProcessed"
                    }
                ],
                "compensation_strategy": "reverse_order"
            }
        }
        
        # Orchestration pattern
        orchestration_saga = {
            "saga_orchestrator": {
                "state_machine": {
                    "states": ["STARTED", "INVENTORY_RESERVED", "PAYMENT_PROCESSED", "COMPLETED"],
                    "transitions": {
                        "STARTED": "INVENTORY_RESERVED",
                        "INVENTORY_RESERVED": "PAYMENT_PROCESSED",
                        "PAYMENT_PROCESSED": "COMPLETED"
                    },
                    "compensation_states": ["INVENTORY_RELEASED", "PAYMENT_REFUNDED", "CANCELLED"]
                }
            }
        }
        
        return {
            "choreography": choreography_saga,
            "orchestration": orchestration_saga
        }
```

## ⚙️ Debezium Connector Configuration and Operations

### MySQL Connector Advanced Configuration

```python
class DebeziumConnectorManager:
    def __init__(self):
        self.kafka_connect_url = "http://kafka-connect:8083"
        self.connector_configs = {}
    
    def configure_mysql_connector(self, database_config):
        """Configure MySQL connector with advanced settings"""
        
        mysql_connector_config = {
            "name": f"mysql-{database_config['database_name']}-connector",
            "config": {
                "connector.class": "io.debezium.connector.mysql.MySqlConnector",
                "database.hostname": database_config["hostname"],
                "database.port": str(database_config["port"]),
                "database.user": database_config["username"],
                "database.password": database_config["password"],
                "database.server.id": str(database_config["server_id"]),
                "topic.prefix": f"{database_config['database_name']}.{database_config['schema_name']}",
                
                # Table filtering
                "table.include.list": ",".join(database_config["include_tables"]),
                "database.include.list": database_config["database_name"],
                
                # Performance optimization
                "binlog.buffer.size": "32768",
                "max.batch.size": "4096",
                "max.queue.size": "16384",
                "poll.interval.ms": "100",
                
                # Schema management
                "schema.history.internal.kafka.bootstrap.servers": "kafka:9092",
                "schema.history.internal.kafka.topic": f"schema-changes.{database_config['database_name']}",
                "include.schema.changes": "true",
                
                # Data transformation
                "transforms": "unwrap,route,addTimestamp",
                "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
                "transforms.unwrap.drop.tombstones": "false",
                "transforms.unwrap.delete.handling.mode": "drop",
                "transforms.unwrap.add.fields": "op,ts_ms,source.ts_ms,source.db,source.table",
                
                # Topic routing
                "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
                "transforms.route.regex": f"{database_config['database_name']}\\.{database_config['schema_name']}\\.([^.]+)",
                "transforms.route.replacement": f"{database_config['database_name']}.$1",
                
                # Field addition
                "transforms.addTimestamp.type": "org.apache.kafka.connect.transforms.InsertField$Value",
                "transforms.addTimestamp.static.field": "processed_at",
                "transforms.addTimestamp.static.value": "$(date:yyyy-MM-dd'T'HH:mm:ss'Z')",
                
                # Transaction metadata
                "provide.transaction.metadata": "true",
                "transaction.topic": f"transactions.{database_config['database_name']}"
            }
        }
        
        return mysql_connector_config
```

### PostgreSQL Connector Configuration

```python
def configure_postgresql_connector(self, database_config):
    """Configure PostgreSQL connector with WAL settings"""
    
    postgresql_connector_config = {
        "name": f"postgresql-{database_config['database_name']}-connector",
        "config": {
            "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
            "database.hostname": database_config["hostname"],
            "database.port": str(database_config["port"]),
            "database.user": database_config["username"],
            "database.password": database_config["password"],
            "database.dbname": database_config["database_name"],
            "database.server.name": f"{database_config['database_name']}_server",
            
            # WAL configuration
            "slot.name": f"debezium_{database_config['database_name']}",
            "publication.name": f"debezium_publication_{database_config['database_name']}",
            "plugin.name": "pgoutput",
            
            # Table filtering
            "table.include.list": ",".join(database_config["include_tables"]),
            "schema.include.list": database_config["schema_name"],
            
            # Performance settings
            "max.queue.size": "8192",
            "max.batch.size": "2048",
            "poll.interval.ms": "1000",
            
            # Schema management
            "schema.history.internal.kafka.bootstrap.servers": "kafka:9092",
            "schema.history.internal.kafka.topic": f"schema-changes.{database_config['database_name']}",
            "include.schema.changes": "true"
        }
    }
    
    return postgresql_connector_config
```

### MongoDB Connector Configuration

```python
def configure_mongodb_connector(self, database_config):
    """Configure MongoDB connector with replica set settings"""
    
    mongodb_connector_config = {
        "name": f"mongodb-{database_config['database_name']}-connector",
        "config": {
            "connector.class": "io.debezium.connector.mongodb.MongoDbConnector",
            "mongodb.hosts": database_config["connection_string"],
            "mongodb.user": database_config["username"],
            "mongodb.password": database_config["password"],
            "mongodb.name": database_config["database_name"],
            
            # Collection filtering
            "collection.include.list": ",".join(database_config["include_collections"]),
            "database.include.list": database_config["database_name"],
            
            # Oplog settings
            "mongodb.poll.interval.ms": "1000",
            "mongodb.connect.timeout.ms": "30000",
            "mongodb.socket.timeout.ms": "30000",
            
            # Schema management
            "schema.history.internal.kafka.bootstrap.servers": "kafka:9092",
            "schema.history.internal.kafka.topic": f"schema-changes.{database_config['database_name']}",
            "include.schema.changes": "true"
        }
    }
    
    return mongodb_connector_config
```

### Connector Management Operations

```python
class ConnectorOperations:
    def __init__(self, kafka_connect_url):
        self.kafka_connect_url = kafka_connect_url
    
    def deploy_connector(self, connector_config):
        """Deploy a new connector"""
        
        import requests
        import json
        
        response = requests.post(
            f"{self.kafka_connect_url}/connectors",
            headers={"Content-Type": "application/json"},
            data=json.dumps(connector_config)
        )
        
        if response.status_code == 201:
            print(f"✅ Connector '{connector_config['name']}' deployed successfully")
            return response.json()
        else:
            print(f"❌ Failed to deploy connector: {response.text}")
            return None
    
    def get_connector_status(self, connector_name):
        """Get connector status and health"""
        
        import requests
        
        response = requests.get(f"{self.kafka_connect_url}/connectors/{connector_name}/status")
        
        if response.status_code == 200:
            status = response.json()
            return {
                "name": status["name"],
                "state": status["connector"]["state"],
                "tasks": [
                    {
                        "id": task["id"],
                        "state": task["state"],
                        "worker_id": task["worker_id"]
                    }
                    for task in status["tasks"]
                ]
            }
        else:
            print(f"❌ Failed to get connector status: {response.text}")
            return None
    
    def restart_connector(self, connector_name):
        """Restart a connector"""
        
        import requests
        
        response = requests.post(f"{self.kafka_connect_url}/connectors/{connector_name}/restart")
        
        if response.status_code == 204:
            print(f"✅ Connector '{connector_name}' restarted successfully")
            return True
        else:
            print(f"❌ Failed to restart connector: {response.text}")
            return False
```

## 📊 Schema Evolution and Schema Registry

### Schema Evolution Concept

Schema evolution is the ability to modify database schemas over time while maintaining backward and forward compatibility. This is crucial for long-running CDC systems where the source schema may change.

#### Importance of Schema Evolution

- **Backward Compatibility**: New consumers can read data written by old producers
- **Forward Compatibility**: Old consumers can read data written by new producers
- **Gradual Deployment**: Allows phased rollout of schema changes
- **Data Consistency**: Ensures data integrity across schema versions

### Schema Registry Integration

```python
class SchemaRegistryManager:
    def __init__(self, registry_url):
        self.registry_url = registry_url
    
    def configure_schema_registry(self, registry_config):
        """Configure Schema Registry for Debezium"""
        
        schema_registry_config = {
            "schema_registry_url": registry_config["url"],
            "key.converter": "io.confluent.connect.avro.AvroConverter",
            "key.converter.schema.registry.url": registry_config["url"],
            "value.converter": "io.confluent.connect.avro.AvroConverter",
            "value.converter.schema.registry.url": registry_config["url"],
            "value.converter.auto.register.schemas": "true",
            "value.converter.use.latest.version": "true",
            "transforms": "unwrap",
            "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
            "transforms.unwrap.drop.tombstones": "false",
            "transforms.unwrap.delete.handling.mode": "drop",
            "transforms.unwrap.add.fields": "op,ts_ms,source.ts_ms,source.db,source.table"
        }
        
        return schema_registry_config
```

### Schema Evolution Scenarios

| Scenario | Description | Compatibility | Handling | Example |
|----------|-------------|---------------|----------|---------|
| **Column Addition** | Add new column | FORWARD | New column handled as null or default value | `ALTER TABLE users ADD COLUMN phone VARCHAR(20)` |
| **Column Deletion** | Drop column | BACKWARD | Remove column from existing data | `ALTER TABLE users DROP COLUMN old_field` |
| **Column Rename** | Rename column | NONE | Add new column then remove old column | `ALTER TABLE users RENAME COLUMN old_name TO new_name` |
| **Column Type Change** | Change column type | FORWARD_TRANSITIVE | Convert after type compatibility check | `ALTER TABLE users MODIFY COLUMN age INT` |
| **Table Addition** | Add new table | FORWARD | Automatically create new topic | `CREATE TABLE new_table (...)` |
| **Table Deletion** | Drop table | BACKWARD | Keep existing topic but stop new events | `DROP TABLE old_table` |

### Schema Compatibility Strategies

| Strategy | Description | Use Case | Field Addition | Field Removal | Type Change | Safety |
|----------|-------------|----------|----------------|---------------|-------------|---------|
| **Backward Compatibility** | Compatible with previous versions | Producer update before consumer update | ✅ Optional fields only | ❌ Prohibited | ✅ Expandable types only | High |
| **Forward Compatibility** | Compatible with future versions | Consumer update before producer update | ❌ Prohibited | ✅ Optional fields only | ✅ Reducible types only | High |
| **Full Compatibility** | Bidirectional compatibility | Safest strategy | ✅ Optional fields only | ✅ Optional fields only | ✅ Compatible types only | Highest |
| **No Compatibility** | No compatibility | Development environment or migration | ✅ All changes allowed | ✅ All changes allowed | ✅ All changes allowed | Low |

### Schema Registry Compatibility Levels

| Compatibility Level | Description | Usage | Update Order |
|---------------------|-------------|-------|--------------|
| **BACKWARD** | Compatible with previous versions | Consumer update before producer update | Consumer → Producer |
| **FORWARD** | Compatible with future versions | Producer update before consumer update | Producer → Consumer |
| **FULL** | Bidirectional compatibility | Safest strategy | Order independent |
| **NONE** | No compatibility check | Development environment or migration | No restrictions |

### Schema Validation Rules

| Rule | Description | Example |
|------|-------------|---------|
| **Field Addition** | New fields must be optional | `"email": {"type": "string", "optional": true}` |
| **Field Removal** | Check compatibility when removing existing fields | Mark as deprecated then remove gradually |
| **Type Changes** | Only allow compatible type changes | int32 → int64 (allowed), string → int (not allowed) |
| **Default Values** | Set appropriate default values for new fields | `"default": null` or appropriate default value |

### Schema Evolution Strategies

| Strategy Type | Description | Examples | Handling |
|---------------|-------------|----------|----------|
| **Additive Changes** | Safe changes (maintain compatibility) | • Add new optional fields<br>• Add new tables<br>• Add enum values | Can be applied immediately |
| **Breaking Changes** | Compatibility-breaking changes | • Add required fields<br>• Change field types<br>• Remove fields<br>• Remove enum values | Handle with new schema version |

```python
class SchemaCompatibilityStrategies:
    def implement_schema_compatibility_strategies(self):
        """Implement schema compatibility strategies"""
        
        # Schema Registry configuration
        schema_registry_config = {
            "url": "http://schema-registry:8081",
            "compatibility_levels": {
                "BACKWARD": "Compatible with previous versions (consumer update first)",
                "FORWARD": "Compatible with future versions (producer update first)", 
                "FULL": "Bidirectional compatibility (safest)",
                "NONE": "No compatibility check (development environment)"
            },
            "validation_rules": {
                "field_addition": "New fields must be optional",
                "field_removal": "Check compatibility when removing existing fields",
                "type_changes": "Only allow compatible type changes",
                "default_values": "Set appropriate default values for new fields"
            }
        }
        
        return schema_registry_config
    
    def validate_schema_compatibility(self, old_schema, new_schema):
        """Validate schema compatibility"""
        
        compatibility_results = {
            "is_compatible": True,
            "compatibility_level": "UNKNOWN",
            "issues": [],
            "recommendations": []
        }
        
        # Field change validation
        old_fields = set(old_schema.get("fields", {}).keys())
        new_fields = set(new_schema.get("fields", {}).keys())
        
        # Added field validation
        added_fields = new_fields - old_fields
        for field in added_fields:
            field_def = new_schema["fields"][field]
            if not field_def.get("optional", False):
                compatibility_results["issues"].append(
                    f"New field '{field}' is required. Change to optional."
                )
                compatibility_results["is_compatible"] = False
        
        # Removed field validation
        removed_fields = old_fields - new_fields
        if removed_fields:
            compatibility_results["issues"].append(
                f"Removed fields: {list(removed_fields)}. This is a breaking change."
            )
            compatibility_results["is_compatible"] = False
        
        # Type change validation
        common_fields = old_fields & new_fields
        for field in common_fields:
            old_type = old_schema["fields"][field].get("type")
            new_type = new_schema["fields"][field].get("type")
            
            if old_type != new_type:
                if not self._is_type_compatible(old_type, new_type):
                    compatibility_results["issues"].append(
                        f"Field '{field}' type changed from {old_type} to {new_type}"
                    )
                    compatibility_results["is_compatible"] = False
        
        # Determine compatibility level
        if compatibility_results["is_compatible"]:
            if added_fields and not removed_fields:
                compatibility_results["compatibility_level"] = "BACKWARD"
            elif removed_fields and not added_fields:
                compatibility_results["compatibility_level"] = "FORWARD"
            elif not added_fields and not removed_fields:
                compatibility_results["compatibility_level"] = "FULL"
        else:
            compatibility_results["compatibility_level"] = "NONE"
        
        # Generate recommendations
        if not compatibility_results["is_compatible"]:
            compatibility_results["recommendations"] = [
                "Set new fields as optional",
                "Consider marking as deprecated instead of removing fields",
                "Convert to compatible types when changing field types",
                "Create new schema version if necessary"
            ]
        
        return compatibility_results
    
    def _is_type_compatible(self, old_type, new_type):
        """Check type compatibility"""
        compatible_types = {
            "int32": ["int64", "float", "double"],
            "int64": ["float", "double"],
            "float": ["double"],
            "string": ["bytes"],
            "bytes": ["string"]
        }
        
        return new_type in compatible_types.get(old_type, [])
    
    def create_schema_evolution_plan(self, current_schema, target_schema):
        """Create schema evolution plan"""
        
        evolution_plan = {
            "phases": [],
            "estimated_duration": "unknown",
            "risk_level": "low"
        }
        
        # Phase 1: Safe changes
        safe_changes = []
        old_fields = set(current_schema.get("fields", {}).keys())
        new_fields = set(target_schema.get("fields", {}).keys())
        
        added_fields = new_fields - old_fields
        for field in added_fields:
            if target_schema["fields"][field].get("optional", False):
                safe_changes.append(f"Add field '{field}' (optional)")
        
        if safe_changes:
            evolution_plan["phases"].append({
                "phase": 1,
                "type": "safe_changes",
                "description": "Safe changes (maintain compatibility)",
                "changes": safe_changes,
                "duration": "1-2 weeks"
            })
        
        # Phase 2: Breaking Changes (if needed)
        breaking_changes = []
        removed_fields = old_fields - new_fields
        if removed_fields:
            breaking_changes.append(f"Remove fields: {list(removed_fields)}")
            evolution_plan["risk_level"] = "high"
        
        if breaking_changes:
            evolution_plan["phases"].append({
                "phase": 2,
                "type": "breaking_changes",
                "description": "Breaking Changes (new version required)",
                "changes": breaking_changes,
                "duration": "2-4 weeks",
                "notes": "Consumer update required"
            })
        
        return evolution_plan
```

## 🔄 Real-time Data Transformation and Routing

### Data Transformation Pipeline

```python
class DataTransformationPipeline:
    def __init__(self):
        self.transformation_configs = {}
    
    def setup_single_message_transform(self, transform_config):
        """Setup Single Message Transform (SMT)"""
        
        smt_config = {
            "transforms": ",".join(transform_config["transforms"]),
            
            # Record unwrapping
            "transforms.unwrap.type": "io.debezium.transforms.ExtractNewRecordState",
            "transforms.unwrap.drop.tombstones": "false",
            "transforms.unwrap.delete.handling.mode": "drop",
            "transforms.unwrap.add.fields": "op,ts_ms,source.ts_ms,source.db,source.table",
            "transforms.unwrap.add.headers": "op,source.ts_ms",
            
            # Field name transformation
            "transforms.rename.type": "org.apache.kafka.connect.transforms.ReplaceField$Value",
            "transforms.rename.renames": ",".join(transform_config.get("field_renames", [])),
            
            # Topic routing
            "transforms.route.type": "org.apache.kafka.connect.transforms.RegexRouter",
            "transforms.route.regex": transform_config["topic_regex"],
            "transforms.route.replacement": transform_config["topic_replacement"],
            
            # Filtering
            "transforms.filter.type": "org.apache.kafka.connect.transforms.Filter",
            "transforms.filter.condition": transform_config.get("filter_condition", ""),
            
            # Field addition
            "transforms.addfield.type": "org.apache.kafka.connect.transforms.InsertField$Value",
            "transforms.addfield.static.field": "processed_at",
            "transforms.addfield.static.value": "$(date:yyyy-MM-dd'T'HH:mm:ss'Z')"
        }
        
        return smt_config
```

### Topic Routing Strategies

| Strategy | Description | Use Case | Configuration |
|----------|-------------|----------|---------------|
| **Database-based** | Route by database name | Multi-tenant applications | `transforms.route.regex: "([^.]+)\\.([^.]+)\\.([^.]+)"` |
| **Table-based** | Route by table name | Service-specific topics | `transforms.route.regex: "db\\.schema\\.([^.]+)"` |
| **Operation-based** | Route by operation type | Separate INSERT/UPDATE/DELETE | Custom SMT implementation |
| **Conditional** | Route based on data conditions | Data classification | Filter + Router combination |

### Data Enrichment Implementation

```python
class DataEnrichmentProcessor:
    def __init__(self):
        self.enrichment_configs = {}
    
    def setup_lookup_enrichment(self, lookup_config):
        """Setup lookup-based data enrichment"""
        
        enrichment_config = {
            "transforms": "lookup",
            "transforms.lookup.type": "org.apache.kafka.connect.transforms.Lookup",
            "transforms.lookup.lookup.table": lookup_config["lookup_table"],
            "transforms.lookup.lookup.key": lookup_config["lookup_key"],
            "transforms.lookup.lookup.value": lookup_config["lookup_value"]
        }
        
        return enrichment_config
    
    def setup_calculation_enrichment(self, calc_config):
        """Setup calculation-based enrichment"""
        
        enrichment_config = {
            "transforms": "calculate",
            "transforms.calculate.type": "org.apache.kafka.connect.transforms.Calculate",
            "transforms.calculate.expression": calc_config["expression"],
            "transforms.calculate.target.field": calc_config["target_field"]
        }
        
        return enrichment_config
```

## 🚀 Practical Project: Real-time Data Synchronization System

### Project Overview

Build a real-time data synchronization system for a large-scale e-commerce platform. Capture changes from MySQL order database in real-time and synchronize to Elasticsearch search engine, Redis cache, and data lake.

#### Project Goals

- **Real-time Data Sync**: Achieve sub-second latency for order data synchronization
- **Multi-target Support**: Synchronize to Elasticsearch, Redis, and S3 Data Lake
- **High Availability**: Ensure 99.9% uptime with automatic failover
- **Scalability**: Handle 100,000+ orders per day with horizontal scaling

#### Technical Challenges

- **Schema Evolution**: Handle frequent schema changes in order system
- **Data Consistency**: Ensure eventual consistency across all targets
- **Performance**: Optimize throughput for high-volume order processing
- **Monitoring**: Comprehensive monitoring and alerting system

### System Architecture

| Component | Technology | Purpose | Configuration |
|-----------|------------|---------|---------------|
| **Source Database** | MySQL 8.0 | Order management system | • Binary logging enabled<br>• GTID enabled<br>• Read replicas configured |
| **Kafka Cluster** | Apache Kafka 3.0 | Event streaming platform | • 3 brokers<br>• Replication factor: 3<br>• Retention: 7 days |
| **Target Systems** | Elasticsearch, Redis, S3 | Search, cache, analytics | • Elasticsearch cluster: 3 nodes<br>• Redis cluster: 6 nodes<br>• S3 with Parquet format |

### 1. System Configuration

```python
class RealTimeSyncSystem:
    def __init__(self):
        self.system_config = {
            "source_database": {
                "type": "mysql",
                "hostname": "mysql-orders-cluster",
                "port": 3306,
                "database": "ecommerce",
                "username": "debezium_user",
                "password": "secure_password",
                "server_id": 184054
            },
            "kafka_cluster": {
                "bootstrap_servers": "kafka-1:9092,kafka-2:9092,kafka-3:9092",
                "schema_registry_url": "http://schema-registry:8081",
                "replication_factor": 3,
                "partitions": 12
            },
            "target_systems": {
                "elasticsearch": {
                    "hosts": ["es-1:9200", "es-2:9200", "es-3:9200"],
                    "index_prefix": "orders_",
                    "batch_size": 1000
                },
                "redis": {
                    "host": "redis-cluster",
                    "port": 6379,
                    "db": 0,
                    "key_prefix": "order:"
                },
                "s3": {
                    "bucket": "ecommerce-data-lake",
                    "path_prefix": "orders/",
                    "format": "parquet",
                    "compression": "snappy"
                }
            }
        }
    
    def design_system_architecture(self):
        """Design the complete system architecture"""
        
        architecture = {
            "source_database": {
                "mysql_orders": {
                    "tables": ["orders", "order_items", "customers", "products"],
                    "binlog_format": "ROW",
                    "gtid_mode": "ON",
                    "read_replicas": 2
                }
            },
            "kafka_cluster": {
                "topics": {
                    "orders.ecommerce.orders": {"partitions": 6, "replication_factor": 3},
                    "orders.ecommerce.order_items": {"partitions": 6, "replication_factor": 3},
                    "orders.ecommerce.customers": {"partitions": 3, "replication_factor": 3},
                    "orders.ecommerce.products": {"partitions": 3, "replication_factor": 3}
                },
                "connectors": {
                    "mysql_orders_connector": {
                        "tasks_max": 4,
                        "poll_interval_ms": 100,
                        "max_batch_size": 4096
                    }
                }
            },
            "target_systems": {
                "elasticsearch": {
                    "indices": {
                        "orders_read_model": {"shards": 3, "replicas": 1},
                        "customers_read_model": {"shards": 2, "replicas": 1}
                    }
                },
                "redis": {
                    "keys": {
                        "order_cache": {"ttl": 3600},
                        "customer_cache": {"ttl": 1800}
                    }
                },
                "s3": {
                    "partitions": ["year", "month", "day"],
                    "file_size": "128MB"
                }
            }
        }
        
        return architecture
```

### 2. System Deployment and Execution

```python
def deploy_realtime_sync_system(self):
    """Deploy the complete real-time synchronization system"""
    
    deployment_steps = [
        {
            "step": 1,
            "name": "Deploy MySQL Connector",
            "description": "Deploy Debezium MySQL connector for order database",
            "configuration": {
                "connector_name": "mysql-orders-connector",
                "database_hostname": "mysql-orders-cluster",
                "database_port": 3306,
                "database_user": "debezium_user",
                "database_password": "secure_password",
                "database_server_id": 184054,
                "topic_prefix": "orders.ecommerce",
                "table_include_list": "ecommerce.orders,ecommerce.order_items,ecommerce.customers",
                "transforms": "unwrap,route,addTimestamp",
                "max_batch_size": 4096,
                "poll_interval_ms": 100
            }
        },
        {
            "step": 2,
            "name": "Configure Elasticsearch Sink",
            "description": "Configure Elasticsearch sink connector for search optimization",
            "configuration": {
                "connector_name": "elasticsearch-sink-orders",
                "topics": "orders.ecommerce.orders,orders.ecommerce.order_items",
                "connection_url": "http://es-1:9200,http://es-2:9200,http://es-3:9200",
                "type_name": "_doc",
                "key_ignore": "false",
                "schema_ignore": "true",
                "batch_size": 1000,
                "flush_timeout_ms": 5000
            }
        },
        {
            "step": 3,
            "name": "Configure Redis Sink",
            "description": "Configure Redis sink connector for caching",
            "configuration": {
                "connector_name": "redis-sink-orders",
                "topics": "orders.ecommerce.orders",
                "redis_host": "redis-cluster",
                "redis_port": 6379,
                "redis_database": 0,
                "key_prefix": "order:",
                "key_field": "id",
                "ttl": 3600
            }
        },
        {
            "step": 4,
            "name": "Configure S3 Sink",
            "description": "Configure S3 sink connector for data lake storage",
            "configuration": {
                "connector_name": "s3-sink-orders",
                "topics": "orders.ecommerce.orders,orders.ecommerce.order_items",
                "s3_bucket_name": "ecommerce-data-lake",
                "s3_region": "us-west-2",
                "flush_size": 10000,
                "rotate_interval_ms": 300000,
                "format_class": "io.confluent.connect.s3.format.parquet.ParquetFormat",
                "compression_type": "snappy",
                "partitioner_class": "io.confluent.connect.storage.partitioner.TimeBasedPartitioner",
                "path_format": "'year'=YYYY/'month'=MM/'day'=dd/"
            }
        }
    ]
    
    return deployment_steps
```

### 3. Monitoring and Alerting Configuration

```python
class MonitoringSystem:
    def __init__(self):
        self.monitoring_config = {}
    
    def setup_monitoring_metrics(self):
        """Setup comprehensive monitoring metrics"""
        
        monitoring_metrics = {
            "kafka_connect_metrics": {
                "connector_status": {
                    "metric_name": "kafka_connect_connector_status",
                    "alert_condition": "status != 'RUNNING'",
                    "severity": "critical"
                },
                "task_status": {
                    "metric_name": "kafka_connect_task_status",
                    "alert_condition": "status != 'RUNNING'",
                    "severity": "critical"
                },
                "throughput": {
                    "metric_name": "kafka_connect_source_record_poll_rate",
                    "alert_condition": "rate < 1000",
                    "severity": "warning"
                },
                "latency": {
                    "metric_name": "kafka_connect_source_record_poll_total",
                    "alert_condition": "latency > 5000ms",
                    "severity": "warning"
                }
            },
            "debezium_metrics": {
                "binlog_position": {
                    "metric_name": "debezium_mysql_binlog_position",
                    "alert_condition": "position_lag > 1000",
                    "severity": "warning"
                },
                "snapshot_progress": {
                    "metric_name": "debezium_mysql_snapshot_progress",
                    "alert_condition": "progress < 100% for 30min",
                    "severity": "warning"
                },
                "transaction_metrics": {
                    "metric_name": "debezium_mysql_transaction_count",
                    "alert_condition": "count = 0 for 10min",
                    "severity": "critical"
                },
                "error_metrics": {
                    "metric_name": "debezium_mysql_error_count",
                    "alert_condition": "count > 0",
                    "severity": "critical"
                }
            }
        }
        
        return monitoring_metrics
    
    def setup_alerting_rules(self):
        """Setup alerting rules for the system"""
        
        alerting_rules = {
            "connector_failure": {
                "condition": "kafka_connect_connector_status != 'RUNNING'",
                "severity": "critical",
                "notification_channels": ["slack", "email", "pagerduty"],
                "message": "Kafka Connect connector is not running"
            },
            "high_latency": {
                "condition": "kafka_connect_source_record_poll_latency > 5000ms",
                "severity": "warning",
                "notification_channels": ["slack"],
                "message": "High latency detected in data processing"
            },
            "low_throughput": {
                "condition": "kafka_connect_source_record_poll_rate < 1000 records/sec",
                "severity": "warning",
                "notification_channels": ["slack"],
                "message": "Low throughput detected in data processing"
            },
            "snapshot_stalled": {
                "condition": "debezium_mysql_snapshot_progress < 100% for 30min",
                "severity": "warning",
                "notification_channels": ["slack", "email"],
                "message": "Debezium snapshot appears to be stalled"
            }
        }
        
        return alerting_rules
    
    def setup_dashboard_metrics(self):
        """Setup dashboard metrics for monitoring"""
        
        dashboard_metrics = {
            "system_overview": {
                "connector_health": "kafka_connect_connector_status",
                "task_health": "kafka_connect_task_status",
                "total_throughput": "kafka_connect_source_record_poll_rate",
                "average_latency": "kafka_connect_source_record_poll_latency"
            },
            "per_connector": {
                "records_processed": "kafka_connect_source_record_poll_total",
                "records_failed": "kafka_connect_source_record_poll_errors",
                "connector_uptime": "kafka_connect_connector_uptime",
                "last_poll_time": "kafka_connect_source_record_poll_time"
            },
            "target_system_health": {
                "elasticsearch_indexing_rate": "elasticsearch_documents_indexed_rate",
                "redis_operations_rate": "redis_commands_processed_rate",
                "s3_upload_rate": "s3_objects_uploaded_rate"
            }
        }
        
        return dashboard_metrics
```

## 📚 Learning Summary

### What We Learned in This Part

1. **Change Data Capture Fundamentals**
   - CDC concepts and importance
   - Comparison with batch processing
   - ROI evaluation and tool selection

2. **Debezium Architecture and Core Features**
   - Debezium platform architecture
   - Database-specific change detection mechanisms
   - Event streaming patterns (Event Sourcing, CQRS, Saga)

3. **Debezium Connector Configuration and Operations**
   - MySQL, PostgreSQL, MongoDB connector setup
   - Advanced configuration for performance optimization
   - Connector management and monitoring

4. **Schema Evolution and Schema Registry**
   - Schema evolution concepts and importance
   - Schema Registry integration
   - Compatibility strategies and validation

5. **Real-time Data Transformation and Routing**
   - Single Message Transform (SMT) utilization
   - Custom transformation logic implementation
   - Topic routing strategies

6. **Practical Project**
   - Large-scale e-commerce platform real-time synchronization system
   - MySQL → Elasticsearch/Redis/Data Lake pipeline
   - Monitoring and alerting system

### Core Technology Stack

| Technology | Purpose | Importance |
|------------|---------|------------|
| **Debezium** | CDC Platform | ⭐⭐⭐⭐⭐ |
| **Apache Kafka** | Event Streaming | ⭐⭐⭐⭐⭐ |
| **Kafka Connect** | Connector Framework | ⭐⭐⭐⭐ |
| **Schema Registry** | Schema Management | ⭐⭐⭐⭐ |
| **Elasticsearch** | Search Engine | ⭐⭐⭐⭐ |

### Next Part Preview

**Part 2: Kafka Connect and Production CDC Operations** will cover:
- Advanced Kafka Connect architecture and scalability
- Custom connector development
- Large-scale CDC pipeline operation strategies
- Performance optimization and bottleneck resolution
- Data consistency assurance and validation
- Monitoring and disaster recovery strategies
- Enterprise-grade CDC operation system construction

---

**Series Progress**: [Change Data Capture Complete Guide Series](/en/data-engineering/2025/09/19/change-data-capture-debezium-guide.html)

---

*Build modern event-driven architecture with the power of real-time data synchronization!* 🚀
