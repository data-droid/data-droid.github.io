---
layout: post
lang: ko
title: "Part 4: 최신 생성형 AI 모델들 - TimeGPT, Lag-Llama, Moirai, Chronos"
description: "대규모 언어 모델을 활용한 혁신적인 시계열 예측 모델들을 살펴보고 실제 구현해봅니다."
date: 2025-09-07
author: Data Droid
category: data-ai
tags: [시계열예측, LLM, TimeGPT, Lag-Llama, Moirai, Chronos, 생성형AI, 대규모언어모델]
series: time-series-forecasting
series_order: 4
reading_time: "20분"
difficulty: "고급"
---

# Part 4: 최신 생성형 AI 모델들 - TimeGPT, Lag-Llama, Moirai, Chronos

> 대규모 언어 모델을 활용한 혁신적인 시계열 예측 모델들을 살펴보고 실제 구현해봅니다.

## 📋 목차 {#목차}

1. [LLM 기반 시계열 예측의 등장](#llm-기반-시계열-예측의-등장)
2. [TimeGPT: OpenAI의 시계열 예측 모델](#timegpt-openai의-시계열-예측-모델)
3. [Lag-Llama: 오픈소스 대안](#lag-llama-오픈소스-대안)
4. [Moirai: 다중 시계열 예측](#moirai-다중-시계열-예측)
5. [Chronos: 메타의 시계열 모델](#chronos-메타의-시계열-모델)
6. [실습: Lag-Llama 구현 및 활용](#실습-lag-llama-구현-및-활용)
7. [모델 비교 및 선택 가이드](#모델-비교-및-선택-가이드)
8. [다음 단계 및 미래 전망](#다음-단계-및-미래-전망)
9. [학습 요약](#학습-요약)

## 🚀 LLM 기반 시계열 예측의 등장 {#llm-기반-시계열-예측의-등장}

### 기존 모델들의 한계

Part 1-3에서 학습한 모델들은 각각의 장점이 있었지만, 다음과 같은 공통적인 한계가 있었습니다:

1. **도메인 특화**: 특정 시계열 패턴에만 최적화
2. **데이터 의존성**: 대량의 도메인별 학습 데이터 필요
3. **일반화 한계**: 새로운 시계열 유형에 대한 적응 어려움
4. **멀티태스킹 부족**: 다양한 예측 작업을 동시에 수행하기 어려움

### LLM의 혁신적 접근

대규모 언어 모델(LLM)은 이러한 한계를 극복하는 새로운 패러다임을 제시했습니다:

- **범용성**: 다양한 도메인의 시계열 데이터 학습
- **Few-shot Learning**: 적은 데이터로도 우수한 성능
- **멀티태스킹**: 여러 예측 작업을 동시에 수행
- **자연어 인터페이스**: 직관적인 질의 및 설명 가능

### 핵심 기술적 혁신

1. **Tokenization**: 시계열 데이터를 토큰으로 변환
2. **Causal Attention**: 시계열의 시간적 의존성 모델링
3. **Multi-scale Learning**: 다양한 시간 스케일의 패턴 학습
4. **Instruction Following**: 자연어 지시사항에 따른 예측

## 🤖 TimeGPT: OpenAI의 시계열 예측 모델

### TimeGPT의 핵심 특징

TimeGPT는 OpenAI에서 개발한 최초의 대규모 시계열 예측 모델입니다.

#### **1. 대규모 사전 훈련**

```
훈련 데이터: 1000억 개 이상의 시계열 데이터 포인트
도메인: 금융, 소매, 제조업, 에너지, 의료 등
지리적 범위: 전 세계
시간 범위: 2020년-2024년
```

#### **2. Zero-shot 예측 능력**

TimeGPT는 사전 훈련된 지식을 바탕으로 새로운 시계열에 대해 추가 학습 없이 예측할 수 있습니다:

```python
# 예시: 새로운 시계열에 대한 즉시 예측
forecast = timegpt.predict(
    series=unseen_timeseries,
    horizon=30,  # 30일 예측
    freq="D"     # 일별 데이터
)
```

#### **3. 자연어 인터페이스**

```python
# 자연어로 예측 요청
result = timegpt.predict_with_context(
    series=stock_prices,
    context="주식 가격을 1주일 예측해주세요. 시장 변동성을 고려해서요.",
    horizon=7
)
```

### TimeGPT의 아키텍처

```
입력 시계열 → Tokenization → Transformer Encoder → Decoder → 예측값
     ↓              ↓              ↓              ↓
  Raw Data    Time Tokens    Attention      Forecast
```

#### **Tokenization 전략**

1. **Value Binning**: 연속값을 이산 토큰으로 변환
2. **Temporal Encoding**: 시간 정보를 토큰에 포함
3. **Context Tokens**: 메타데이터를 토큰으로 표현

## 🦙 Lag-Llama: 오픈소스 대안

### Lag-Llama의 등장 배경

TimeGPT가 상용 모델이면서 API 기반으로만 제공되는 한계를 극복하기 위해 Hugging Face에서 개발한 오픈소스 모델입니다.

#### **1. 오픈소스 접근성**

- **완전 오픈소스**: 모델 가중치와 코드 공개
- **로컬 실행**: API 의존성 없이 로컬에서 실행
- **커스터마이징**: 필요에 따라 모델 수정 가능

#### **2. LLaMA 기반 아키텍처**

```
시계열 입력 → Lag Features → LLaMA-7B → 예측값
     ↓            ↓            ↓
  Raw Data    Lag Tokens    Transformer
```

#### **3. Lag Features의 혁신**

Lag-Llama는 시계열의 지연값(lag values)을 토큰으로 변환합니다:

```python
# Lag Features 생성 예시
def create_lag_features(series, max_lags=24):
    """시계열에서 지연 특성 생성"""
    lags = []
    for lag in range(1, max_lags + 1):
        lags.append(series.shift(lag))
    return pd.concat(lags, axis=1)
```

### Lag-Llama의 장점

1. **투명성**: 모델 구조와 학습 과정 공개
2. **비용 효율성**: API 비용 없이 사용 가능
3. **개인정보 보호**: 데이터가 외부로 전송되지 않음
4. **확장성**: 다양한 도메인에 맞춤화 가능

## 🌊 Moirai: 다중 시계열 예측

### Moirai의 핵심 개념

Moirai는 여러 시계열을 동시에 예측하는 멀티태스킹 모델입니다.

#### **1. 멀티태스킹 아키텍처**

```
시계열 1 ┐
시계열 2 ├─→ Shared Encoder → Task-specific Heads → 예측값들
시계열 3 ┘
```

#### **2. Cross-series Learning**

- **공통 패턴 학습**: 여러 시계열 간의 공통 패턴 발견
- **지식 전이**: 한 시계열의 학습이 다른 시계열에 도움
- **효율성**: 단일 모델로 여러 시계열 처리

#### **3. Hierarchical Forecasting**

```
국가 수준 ┐
지역 수준 ├─→ 계층적 예측
도시 수준 ┘
```

## ⏰ Chronos: 메타의 시계열 모델

### Chronos의 혁신적 접근

Chronos는 메타에서 개발한 토큰 기반 시계열 예측 모델입니다.

#### **1. Token-based Forecasting**

시계열을 토큰으로 변환하여 언어 모델처럼 처리:

```python
# Chronos 토큰화 예시
def tokenize_timeseries(series, vocab_size=512):
    """시계열을 토큰으로 변환"""
    # 값 정규화
    normalized = (series - series.mean()) / series.std()
    
    # 양자화
    quantized = np.digitize(normalized, 
                          np.linspace(-3, 3, vocab_size-1))
    
    return quantized
```

#### **2. Multi-scale Learning**

- **단기 패턴**: 일별, 주별 변동
- **중기 패턴**: 월별, 분기별 트렌드
- **장기 패턴**: 연간 계절성, 구조적 변화

#### **3. Instruction Tuning**

자연어 지시사항에 따라 다양한 예측 작업 수행:

```python
# Chronos 지시사항 예시
instructions = [
    "다음 7일의 매출을 예측해주세요",
    "계절성을 고려한 월별 예측을 해주세요",
    "이상치를 제외한 안정적인 예측을 해주세요"
]
```

## 🛠 ️ 실습: Lag-Llama 구현 및 활용 {#실습-lag-llama-구현-및-활용}

### 1. 환경 설정

```python
# 필요한 라이브러리 설치
# pip install transformers torch datasets evaluate
# pip install pandas numpy matplotlib seaborn
# pip install scikit-learn

import torch
import torch.nn as nn
from transformers import AutoModel, AutoTokenizer
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import mean_squared_error, mean_absolute_error
import warnings
warnings.filterwarnings('ignore')

# 시각화 설정
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")
```

### 2. Lag-Llama 모델 로드

```python
# Lag-Llama 모델 로드
model_name = "time-series-foundation-models/Lag-Llama"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModel.from_pretrained(model_name)

print(f"모델 파라미터 수: {sum(p.numel() for p in model.parameters())}")
print(f"모델 구조: {model.config}")
```

### 3. 시계열 데이터 준비

```python
def generate_complex_multivariate_timeseries(n=2000, n_series=5, seed=42):
    """복잡한 다변량 시계열 데이터 생성"""
    np.random.seed(seed)
    
    # 시간 인덱스
    t = np.arange(n)
    
    # 공통 트렌드
    common_trend = 0.02 * t + 0.0001 * t**2
    
    # 시계열별 특성
    series_data = []
    for i in range(n_series):
        # 시계열별 고유 패턴
        series_trend = common_trend + 0.01 * i * t
        series_seasonal = 10 * np.sin(2 * np.pi * t / 365 + i * np.pi/3)
        series_noise = np.random.normal(0, 1 + 0.1 * i, n)
        
        # 시계열 간 상관관계
        if i > 0:
            correlation = 0.3 * np.sin(2 * np.pi * t / 100 + i)
            series_data.append(series_trend + series_seasonal + series_noise + correlation)
        else:
            series_data.append(series_trend + series_seasonal + series_noise)
    
    # 데이터프레임 생성
    df = pd.DataFrame(np.array(series_data).T, 
                     columns=[f'series_{i+1}' for i in range(n_series)],
                     index=pd.date_range('2020-01-01', periods=n, freq='D'))
    
    return df

# 다변량 시계열 생성
multivariate_ts = generate_complex_multivariate_timeseries(2000, 5)

# 시각화
plt.figure(figsize=(15, 10))
for i, col in enumerate(multivariate_ts.columns):
    plt.subplot(3, 2, i+1)
    plt.plot(multivariate_ts.index, multivariate_ts[col], alpha=0.7)
    plt.title(f'{col} 시계열')
    plt.ylabel('값')
    plt.xticks(rotation=45)

plt.tight_layout()
plt.show()

print(f"시계열 개수: {len(multivariate_ts.columns)}")
print(f"데이터 길이: {len(multivariate_ts)}")
print(f"값 범위: {multivariate_ts.min().min():.2f} ~ {multivariate_ts.max().max():.2f}")
```

### 4. Lag Features 생성

```python
def create_lag_features(data, max_lags=24, forecast_horizon=7):
    """Lag-Llama용 지연 특성 생성"""
    lag_features = {}
    targets = {}
    
    for col in data.columns:
        series = data[col].values
        
        # 지연 특성 생성
        lags = []
        for lag in range(1, max_lags + 1):
            lag_values = np.roll(series, lag)
            lag_values[:lag] = np.nan  # 처음 lag개는 NaN
            lags.append(lag_values)
        
        lag_features[col] = np.column_stack(lags)
        
        # 타겟 생성 (미래 값)
        targets[col] = series[forecast_horizon:]
    
    return lag_features, targets

# Lag features 생성
max_lags = 24
forecast_horizon = 7
lag_features, targets = create_lag_features(multivariate_ts, max_lags, forecast_horizon)

print(f"Lag features 형태: {lag_features['series_1'].shape}")
print(f"Targets 형태: {targets['series_1'].shape}")
```

### 5. Lag-Llama 모델 구현

```python
class LagLlamaPredictor(nn.Module):
    """Lag-Llama 기반 시계열 예측 모델"""
    
    def __init__(self, input_dim, hidden_dim=512, output_dim=1, num_layers=6):
        super(LagLlamaPredictor, self).__init__()
        
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.output_dim = output_dim
        
        # 입력 임베딩
        self.input_embedding = nn.Linear(input_dim, hidden_dim)
        
        # Transformer 레이어들
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim,
            nhead=8,
            dim_feedforward=hidden_dim * 4,
            dropout=0.1,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        
        # 출력 레이어
        self.output_projection = nn.Linear(hidden_dim, output_dim)
        
        # 드롭아웃
        self.dropout = nn.Dropout(0.1)
        
    def forward(self, x):
        # 입력 임베딩
        x = self.input_embedding(x)
        x = self.dropout(x)
        
        # Transformer 인코더
        x = self.transformer(x)
        
        # 마지막 시점의 출력 사용
        x = x[:, -1, :]  # (batch_size, hidden_dim)
        
        # 출력 예측
        output = self.output_projection(x)
        
        return output

# 모델 생성
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = LagLlamaPredictor(
    input_dim=max_lags,
    hidden_dim=512,
    output_dim=1,
    num_layers=6
).to(device)

print(f"Lag-Llama 모델 파라미터 수: {sum(p.numel() for p in model.parameters())}")
```

### 6. 데이터 전처리 및 학습

```python
def prepare_training_data(lag_features, targets, train_ratio=0.8):
    """학습 데이터 준비"""
    all_X = []
    all_y = []
    
    for col in lag_features.keys():
        X = lag_features[col]
        y = targets[col]
        
        # NaN 제거
        valid_indices = ~np.isnan(X).any(axis=1)
        X = X[valid_indices]
        y = y[valid_indices]
        
        # 길이 맞추기
        min_len = min(len(X), len(y))
        X = X[:min_len]
        y = y[:min_len]
        
        all_X.append(X)
        all_y.append(y)
    
    # 모든 시계열 결합
    X = np.vstack(all_X)
    y = np.hstack(all_y)
    
    # 학습/검증 분할
    split_idx = int(len(X) * train_ratio)
    X_train, X_val = X[:split_idx], X[split_idx:]
    y_train, y_val = y[:split_idx], y[split_idx:]
    
    return X_train, X_val, y_train, y_val

# 데이터 준비
X_train, X_val, y_train, y_val = prepare_training_data(lag_features, targets)

# PyTorch 텐서로 변환
X_train = torch.FloatTensor(X_train).to(device)
X_val = torch.FloatTensor(X_val).to(device)
y_train = torch.FloatTensor(y_train).unsqueeze(1).to(device)
y_val = torch.FloatTensor(y_val).unsqueeze(1).to(device)

print(f"학습 데이터: {X_train.shape}, {y_train.shape}")
print(f"검증 데이터: {X_val.shape}, {y_val.shape}")

# 학습 함수
def train_model(model, X_train, y_train, X_val, y_val, epochs=100, lr=0.001):
    """모델 학습"""
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=10, factor=0.5)
    
    train_losses = []
    val_losses = []
    
    for epoch in range(epochs):
        # 학습
        model.train()
        optimizer.zero_grad()
        
        train_pred = model(X_train)
        train_loss = criterion(train_pred, y_train)
        train_loss.backward()
        optimizer.step()
        
        # 검증
        model.eval()
        with torch.no_grad():
            val_pred = model(X_val)
            val_loss = criterion(val_pred, y_val)
        
        train_losses.append(train_loss.item())
        val_losses.append(val_loss.item())
        
        # Learning rate 스케줄링
        scheduler.step(val_loss)
        
        if (epoch + 1) % 20 == 0:
            print(f"Epoch [{epoch+1}/{epochs}] - Train Loss: {train_loss.item():.6f}, Val Loss: {val_loss.item():.6f}")
    
    return train_losses, val_losses

# 모델 학습
print("=== Lag-Llama 모델 학습 시작 ===")
train_losses, val_losses = train_model(model, X_train, y_train, X_val, y_val, epochs=100)

# 학습 과정 시각화
plt.figure(figsize=(12, 6))
plt.plot(train_losses, label='Training Loss', alpha=0.7)
plt.plot(val_losses, label='Validation Loss', alpha=0.7)
plt.title('Lag-Llama 모델 학습 과정')
plt.xlabel('Epoch')
plt.ylabel('Loss (MSE)')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

### 7. 예측 및 성능 평가

```python
def evaluate_model(model, X_test, y_test, model_name="Lag-Llama"):
    """모델 성능 평가"""
    model.eval()
    with torch.no_grad():
        predictions = model(X_test)
        predictions = predictions.cpu().numpy().flatten()
        y_test = y_test.cpu().numpy().flatten()
    
    # 성능 지표 계산
    mse = mean_squared_error(y_test, predictions)
    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mse)
    
    print(f"\n{model_name} 성능:")
    print(f"  MSE: {mse:.4f}")
    print(f"  MAE: {mae:.4f}")
    print(f"  RMSE: {rmse:.4f}")
    
    return predictions, (mse, mae, rmse)

# 성능 평가
predictions, metrics = evaluate_model(model, X_val, y_val)

# 예측 결과 시각화
plt.figure(figsize=(15, 8))

# 첫 200개 샘플의 예측 vs 실제값
sample_size = 200
plt.subplot(2, 1, 1)
plt.plot(y_val[:sample_size].cpu().numpy(), label='실제값', alpha=0.7)
plt.plot(predictions[:sample_size], label='Lag-Llama 예측', alpha=0.7)
plt.title('Lag-Llama: 예측 vs 실제값 (첫 200개 샘플)')
plt.xlabel('샘플')
plt.ylabel('값')
plt.legend()
plt.grid(True, alpha=0.3)

# 산점도
plt.subplot(2, 1, 2)
plt.scatter(y_val.cpu().numpy(), predictions, alpha=0.5)
plt.plot([y_val.min(), y_val.max()], [y_val.min(), y_val.max()], 'r--', lw=2)
plt.xlabel('실제값')
plt.ylabel('예측값')
plt.title('실제값 vs 예측값 산점도')
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()
```

### 8. 다중 시계열 예측

```python
def predict_multiple_series(model, multivariate_ts, max_lags=24, forecast_horizon=7):
    """다중 시계열 예측"""
    predictions = {}
    
    for col in multivariate_ts.columns:
        series = multivariate_ts[col].values
        
        # 최근 데이터로 lag features 생성
        recent_data = series[-max_lags:]
        recent_data = recent_data.reshape(1, -1)
        
        # 예측
        model.eval()
        with torch.no_grad():
            X = torch.FloatTensor(recent_data).to(device)
            pred = model(X)
            predictions[col] = pred.cpu().numpy().flatten()[0]
    
    return predictions

# 다중 시계열 예측
forecast_predictions = predict_multiple_series(model, multivariate_ts)

print("=== 다중 시계열 예측 결과 ===")
for col, pred in forecast_predictions.items():
    print(f"{col}: {pred:.4f}")

# 예측 결과 시각화
plt.figure(figsize=(15, 10))
for i, (col, pred) in enumerate(forecast_predictions.items()):
    plt.subplot(3, 2, i+1)
    
    # 최근 100일 데이터
    recent_data = multivariate_ts[col].tail(100)
    plt.plot(recent_data.index, recent_data.values, label='과거 데이터', alpha=0.7)
    
    # 예측값
    last_date = recent_data.index[-1]
    next_date = last_date + pd.Timedelta(days=1)
    plt.axhline(y=pred, color='red', linestyle='--', 
                label=f'예측값: {pred:.2f}')
    
    plt.title(f'{col} - 다음 예측값: {pred:.2f}')
    plt.ylabel('값')
    plt.legend()
    plt.xticks(rotation=45)

plt.tight_layout()
plt.show()
```

## 📊 모델 비교 및 선택 가이드 {#모델-비교-및-선택-가이드}

### 성능 비교

| 모델 | 장점 | 단점 | 사용 사례 |
|------|------|------|-----------|
| **TimeGPT** | 최고 성능, 자연어 인터페이스 | API 의존성, 비용 | 상용 서비스, 프로토타이핑 |
| **Lag-Llama** | 오픈소스, 로컬 실행 | 성능 제한, 설정 복잡 | 연구, 개인 프로젝트 |
| **Moirai** | 다중 시계열, 효율성 | 복잡한 아키텍처 | 대규모 다변량 예측 |
| **Chronos** | 토큰 기반, 유연성 | 메타 의존성 | 실험적 연구 |

### 선택 가이드

#### **1. 프로젝트 규모별**

- **소규모**: Lag-Llama (오픈소스, 무료)
- **중규모**: TimeGPT (API, 빠른 구현)
- **대규모**: Moirai (다중 시계열, 효율성)

#### **2. 요구사항별**

- **정확도 우선**: TimeGPT
- **비용 효율성**: Lag-Llama
- **다중 시계열**: Moirai
- **실험적 연구**: Chronos

#### **3. 기술적 고려사항**

- **데이터 프라이버시**: Lag-Llama (로컬 실행)
- **빠른 프로토타이핑**: TimeGPT (API)
- **커스터마이징**: Lag-Llama (오픈소스)
- **확장성**: Moirai (멀티태스킹)

## 🚀 다음 단계 및 미래 전망 {#다음-단계-및-미래-전망}

### 기술 발전 방향

1. **더 큰 모델**: 수조 개 파라미터의 시계열 모델
2. **멀티모달**: 텍스트, 이미지, 시계열 통합
3. **실시간 학습**: 스트리밍 데이터에서 지속적 학습
4. **설명 가능성**: 예측 근거의 자연어 설명

### 실무 적용 고려사항

1. **데이터 품질**: LLM도 고품질 데이터 필요
2. **비용 관리**: API 사용량 모니터링
3. **모델 업데이트**: 정기적인 재학습 필요
4. **성능 모니터링**: 지속적인 성능 추적

### 미래 연구 방향

1. **Few-shot Learning**: 더 적은 데이터로 학습
2. **Transfer Learning**: 도메인 간 지식 전이
3. **Causal Learning**: 인과관계 기반 예측
4. **Uncertainty Quantification**: 불확실성 정량화

## 📚 학습 요약 {#학습-요약}

### 이번 파트에서 학습한 내용

1. **LLM 기반 시계열 예측의 등장**
   - 기존 모델들의 한계
   - LLM의 혁신적 접근
   - 핵심 기술적 혁신

2. **주요 모델들**
   - **TimeGPT**: OpenAI의 상용 모델
   - **Lag-Llama**: 오픈소스 대안
   - **Moirai**: 다중 시계열 예측
   - **Chronos**: 메타의 토큰 기반 모델

3. **실제 구현**
   - Lag-Llama 모델 구현
   - 다중 시계열 예측
   - 성능 평가 및 비교

### 핵심 개념 정리

| 개념 | 설명 | 중요도 |
|------|------|--------|
| **Tokenization** | 시계열을 토큰으로 변환 | ⭐⭐⭐⭐⭐ |
| **Few-shot Learning** | 적은 데이터로 학습 | ⭐⭐⭐⭐⭐ |
| **Multi-task Learning** | 여러 작업 동시 수행 | ⭐⭐⭐⭐ |
| **Zero-shot Prediction** | 추가 학습 없이 예측 | ⭐⭐⭐⭐⭐ |

### 실무 적용 시 고려사항

1. **모델 선택**: 요구사항에 따른 적절한 모델 선택
2. **비용 관리**: API 비용과 성능의 균형
3. **데이터 준비**: 고품질 데이터의 중요성
4. **성능 모니터링**: 지속적인 모델 성능 추적

---

## 🔗 시리즈 네비게이션

**← 이전**: [Part 3: 트랜스포머 기반 시계열 예측 모델들](/data-ai/2025/09/06/time-series-transformers.html)

**다음 →**: 시리즈 완료! 🎉

---

**시리즈 완료**: 시계열 예측의 진화를 ARIMA부터 최신 LLM 모델까지 체계적으로 학습했습니다. 이제 다양한 도구와 기법을 활용하여 실무에서 강력한 시계열 예측 시스템을 구축할 수 있습니다! 🚀

*이 시리즈를 통해 시계열 예측의 과거, 현재, 미래를 모두 경험했습니다. 각 모델의 특징과 장단점을 이해하고, 실제 데이터에 적용할 수 있는 실무 역량을 기를 수 있었습니다!* 🎯
