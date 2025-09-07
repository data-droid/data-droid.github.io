---
layout: post
lang: ko
title: "Part 2: 딥러닝 기반 시계열 예측 - N-BEATS와 DeepAR"
description: "딥러닝 기반 시계열 예측 모델의 핵심을 배우고 N-BEATS와 DeepAR을 실제 코드로 구현해보세요."
date: 2025-09-01
author: Data Droid
category: data-ai
tags: [시계열예측, 딥러닝, N-BEATS, DeepAR, PyTorch, 머신러닝]
series: time-series-forecasting
series_order: 2
reading_time: "30분"
difficulty: "중급"
---

# Part 2: 딥러닝 기반 시계열 예측 - N-BEATS와 DeepAR

> 딥러닝 기반 시계열 예측 모델의 핵심을 배우고 N-BEATS와 DeepAR을 실제 코드로 구현해보세요.

## 📋 목차

1. [딥러닝 기반 시계열 예측의 등장](#딥러닝-기반-시계열-예측의-등장)
2. [N-BEATS: 해석 가능한 딥러닝 시계열 모델](#n-beats-해석-가능한-딥러닝-시계열-모델)
3. [DeepAR: 확률적 시계열 예측](#deepar-확률적-시계열-예측)
4. [실습: N-BEATS와 DeepAR 구현](#실습-n-beats와-deepar-구현)
5. [모델 성능 비교 및 분석](#모델-성능-비교-및-분석)
6. [다음 단계 및 확장](#다음-단계-및-확장)
7. [학습 요약](#학습-요약)

## 🚀 딥러닝 기반 시계열 예측의 등장

### 전통적 방법의 한계

Part 1에서 학습한 ARIMA와 Prophet은 훌륭한 모델이지만, 다음과 같은 한계가 있습니다:

1. **선형성 가정**: 복잡한 비선형 패턴을 학습하기 어려움
2. **수동 특성 엔지니어링**: 도메인 지식에 의존적
3. **장기 의존성**: 먼 과거의 정보를 효과적으로 활용하지 못함
4. **불확실성 정량화**: 예측의 신뢰 구간을 정확히 추정하기 어려움

### 딥러닝의 혁신

딥러닝은 이러한 한계를 극복하고 시계열 예측에 새로운 가능성을 열었습니다:

- **비선형 패턴 학습**: 복잡한 관계를 자동으로 발견
- **자동 특성 추출**: 도메인 지식 없이도 패턴 학습
- **장기 의존성 모델링**: LSTM, Transformer 등을 통한 시퀀스 학습
- **확률적 예측**: 불확실성을 정량화하여 신뢰 구간 제공

## 🏗️ N-BEATS: 해석 가능한 딥러닝 시계열 모델

### N-BEATS의 핵심 아이디어

N-BEATS (Neural Basis Expansion Analysis for Time Series)는 2019년 Element AI에서 개발한 딥러닝 시계열 예측 모델입니다.

#### **1. 블록 기반 아키텍처**

```
입력 시계열 → Backcast 블록 → Forecast 블록 → 최종 예측
     ↓              ↓              ↓
  Lookback      과거 재구성     미래 예측
```

#### **2. 해석 가능한 블록 구조**

각 블록은 다음과 같은 구성 요소를 가집니다:

- **Linear Layer**: 입력을 고차원으로 변환
- **ReLU Activation**: 비선형성 추가
- **Linear Layer**: 원래 차원으로 복원
- **Residual Connection**: 그래디언트 흐름 개선

#### **3. 이중 출력 구조**

- **Backcast**: 입력 시계열을 재구성하여 패턴 학습
- **Forecast**: 미래 값을 예측

### N-BEATS의 장점

1. **해석 가능성**: 각 블록이 학습하는 패턴을 분석 가능
2. **확장성**: 다양한 시계열 길이에 적용 가능
3. **효율성**: 빠른 학습과 예측
4. **안정성**: 그래디언트 소실 문제 해결

## 🔮 DeepAR: 확률적 시계열 예측

### DeepAR의 핵심 개념

DeepAR은 Amazon에서 개발한 확률적 시계열 예측 모델로, **확률 분포를 직접 모델링**합니다.

#### **1. 확률적 접근법**

전통적 모델들이 점 예측을 하는 반면, DeepAR은:
- **확률 분포 학습**: 정규분포, 음이항분포 등
- **불확실성 정량화**: 예측의 신뢰 구간 제공
- **앙상블 효과**: 여러 샘플을 통한 안정적 예측

#### **2. LSTM 기반 아키텍처**

```
시계열 입력 → LSTM 셀 → 확률 분포 파라미터 → 샘플링 → 예측
     ↓           ↓              ↓              ↓
  Lookback    상태 업데이트    μ, σ 학습     확률적 예측
```

#### **3. 조건부 확률 모델링**

DeepAR은 다음 확률을 모델링합니다:

```
P(y_{t+1} | y_1, y_2, ..., y_t, x_1, x_2, ..., x_t)
```

여기서 `x_t`는 외부 변수(휴일, 계절 등)를 의미합니다.

### DeepAR의 장점

1. **불확실성 정량화**: 예측의 신뢰도를 정확히 측정
2. **외부 변수 활용**: 계절성, 휴일 등 추가 정보 반영
3. **다변량 시계열**: 여러 시계열을 동시에 모델링
4. **실시간 학습**: 새로운 데이터로 지속적 업데이트

## 🛠️ 실습: N-BEATS와 DeepAR 구현

### 1. 환경 설정 및 라이브러리 설치

```python
# 필요한 라이브러리 설치
# pip install torch torchvision torchaudio
# pip install pandas numpy matplotlib seaborn scikit-learn

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import mean_squared_error, mean_absolute_error
import warnings
warnings.filterwarnings('ignore')

# PyTorch 설정
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
print(f"Using device: {device}")

# 시각화 설정
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")
```

### 2. 복잡한 시계열 데이터 생성

```python
def generate_complex_timeseries(n=2000, seed=42):
    """복잡한 시계열 데이터 생성 (딥러닝 모델용)"""
    np.random.seed(seed)
    
    # 시간 인덱스
    t = np.arange(n)
    
    # 비선형 트렌드
    trend = 0.05 * t + 0.0001 * t**2 + 0.0000001 * t**3
    
    # 다중 주기 계절성
    seasonality_1 = 15 * np.sin(2 * np.pi * t / 365)  # 연간
    seasonality_2 = 8 * np.sin(2 * np.pi * t / 7)     # 주간
    seasonality_3 = 3 * np.sin(2 * np.pi * t / 24)    # 일간
    seasonality_4 = 5 * np.sin(2 * np.pi * t / 12)    # 월간
    
    # 구조적 변화 (여러 번 발생)
    structural_changes = np.zeros(n)
    change_points = [n//4, n//2, 3*n//4]
    for i, cp in enumerate(change_points):
        structural_changes[cp:] += (i+1) * 2 * np.sin(2 * np.pi * t[cp:] / 200)
    
    # 비선형 상호작용
    interaction = 0.1 * np.sin(2 * np.pi * t / 100) * np.cos(2 * np.pi * t / 50)
    
    # 시간에 따라 변하는 노이즈
    noise = np.random.normal(0, 1 + 0.02 * t, n)
    
    # 이상치 추가
    outliers = np.random.choice(n, size=n//40, replace=False)
    noise[outliers] += np.random.normal(0, 15, len(outliers))
    
    # 전체 시계열
    ts = trend + seasonality_1 + seasonality_2 + seasonality_3 + seasonality_4 + structural_changes + interaction + noise
    
    return pd.Series(ts, index=pd.date_range('2020-01-01', periods=n, freq='D'))

# 복잡한 시계열 생성
complex_ts = generate_complex_timeseries(2000)

# 시각화
plt.figure(figsize=(15, 12))

plt.subplot(4, 1, 1)
plt.plot(complex_ts.index, complex_ts.values, alpha=0.7)
plt.title('복잡한 시계열 데이터 (전체)')
plt.ylabel('값')

plt.subplot(4, 1, 2)
plt.plot(complex_ts.index[:200], complex_ts.values[:200], alpha=0.7)
plt.title('첫 200일 데이터 (확대)')
plt.ylabel('값')

plt.subplot(4, 1, 3)
plt.plot(complex_ts.index[800:1000], complex_ts.values[800:1000], alpha=0.7)
plt.title('800-1000일 데이터 (확대)')
plt.ylabel('값')

plt.subplot(4, 1, 4)
plt.plot(complex_ts.index[-200:], complex_ts.values[-200:], alpha=0.7)
plt.title('마지막 200일 데이터 (확대)')
plt.ylabel('값')

plt.tight_layout()
plt.show()

print(f"시계열 길이: {len(complex_ts)}")
print(f"값 범위: {complex_ts.min():.2f} ~ {complex_ts.max():.2f}")
print(f"평균: {complex_ts.mean():.2f}")
print(f"표준편차: {complex_ts.std():.2f}")
```

### 3. 데이터 전처리 및 시퀀스 생성

```python
def create_sequences(data, lookback, forecast_horizon):
    """시계열 데이터를 시퀀스로 변환"""
    sequences = []
    targets = []
    
    for i in range(len(data) - lookback - forecast_horizon + 1):
        seq = data[i:i + lookback]
        target = data[i + lookback:i + lookback + forecast_horizon]
        sequences.append(seq)
        targets.append(target)
    
    return np.array(sequences), np.array(targets)

def normalize_data(data):
    """데이터 정규화"""
    mean = np.mean(data)
    std = np.std(data)
    normalized = (data - mean) / std
    return normalized, mean, std

def denormalize_data(normalized_data, mean, std):
    """정규화된 데이터를 원래 스케일로 복원"""
    return normalized_data * std + mean

# 데이터 정규화
ts_normalized, mean_val, std_val = normalize_data(complex_ts.values)

# 시퀀스 생성
lookback = 100  # 과거 100일 데이터 사용
forecast_horizon = 30  # 30일 예측
sequences, targets = create_sequences(ts_normalized, lookback, forecast_horizon)

print(f"시퀀스 개수: {len(sequences)}")
print(f"입력 형태: {sequences.shape}")
print(f"타겟 형태: {targets.shape}")

# PyTorch 텐서로 변환
sequences_tensor = torch.FloatTensor(sequences).to(device)
targets_tensor = torch.FloatTensor(targets).to(device)

# 데이터셋 분할 (학습:검증:테스트 = 7:2:1)
total_samples = len(sequences)
train_size = int(total_samples * 0.7)
val_size = int(total_samples * 0.2)
test_size = total_samples - train_size - val_size

train_sequences = sequences_tensor[:train_size]
train_targets = targets_tensor[:train_size]
val_sequences = sequences_tensor[train_size:train_size + val_size]
val_targets = targets_tensor[train_size:train_size + val_size]
test_sequences = sequences_tensor[train_size + val_size:]
test_targets = targets_tensor[train_size + val_size:]

print(f"학습 데이터: {len(train_sequences)}")
print(f"검증 데이터: {len(val_sequences)}")
print(f"테스트 데이터: {len(test_sequences)}")

# DataLoader 생성
batch_size = 32
train_dataset = TensorDataset(train_sequences, train_targets)
train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)

val_dataset = TensorDataset(val_sequences, val_targets)
val_loader = DataLoader(val_dataset, batch_size=batch_size, shuffle=False)

test_dataset = TensorDataset(test_sequences, test_targets)
test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)
```

### 4. N-BEATS 모델 구현

```python
class NBEATSBlock(nn.Module):
    """N-BEATS 블록 구현"""
    def __init__(self, input_dim, hidden_dim, output_dim):
        super(NBEATSBlock, self).__init__()
        
        self.fc1 = nn.Linear(input_dim, hidden_dim)
        self.fc2 = nn.Linear(hidden_dim, hidden_dim)
        self.fc3 = nn.Linear(hidden_dim, hidden_dim)
        self.fc4 = nn.Linear(hidden_dim, output_dim)
        
        self.relu = nn.ReLU()
        self.dropout = nn.Dropout(0.1)
        
    def forward(self, x):
        # 입력을 고차원으로 변환
        h1 = self.relu(self.fc1(x))
        h1 = self.dropout(h1)
        
        h2 = self.relu(self.fc2(h1))
        h2 = self.dropout(h2)
        
        h3 = self.relu(self.fc3(h2))
        h3 = self.dropout(h3)
        
        # 출력 생성
        output = self.fc4(h3)
        
        return output

class NBEATS(nn.Module):
    """N-BEATS 모델 구현"""
    def __init__(self, lookback, forecast_horizon, hidden_dim=128, num_blocks=3):
        super(NBEATS, self).__init__()
        
        self.lookback = lookback
        self.forecast_horizon = forecast_horizon
        self.num_blocks = num_blocks
        
        # N-BEATS 블록들
        self.blocks = nn.ModuleList([
            NBEATSBlock(lookback, hidden_dim, lookback + forecast_horizon)
            for _ in range(num_blocks)
        ])
        
        # 최종 예측을 위한 선형 레이어
        self.final_layer = nn.Linear(lookback, forecast_horizon)
        
    def forward(self, x):
        # 입력: (batch_size, lookback)
        batch_size = x.size(0)
        
        # 각 블록을 통과하며 residual connection
        residual = x
        for i, block in enumerate(self.blocks):
            # 블록 출력
            block_output = block(residual)
            
            # Backcast와 Forecast 분리
            backcast = block_output[:, :self.lookback]
            forecast = block_output[:, self.lookback:]
            
            # Residual connection
            residual = residual - backcast
            
            # 첫 번째 블록이 아닌 경우에만 forecast 누적
            if i == 0:
                total_forecast = forecast
            else:
                total_forecast = total_forecast + forecast
        
        # 최종 예측
        final_forecast = self.final_layer(x) + total_forecast
        
        return final_forecast

# N-BEATS 모델 생성
nbeats_model = NBEATS(
    lookback=lookback,
    forecast_horizon=forecast_horizon,
    hidden_dim=128,
    num_blocks=3
).to(device)

print(f"N-BEATS 모델 파라미터 수: {sum(p.numel() for p in nbeats_model.parameters())}")

# 손실 함수와 옵티마이저
criterion = nn.MSELoss()
optimizer = optim.Adam(nbeats_model.parameters(), lr=0.001)
scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=10, factor=0.5)

# 학습 함수
def train_epoch(model, dataloader, criterion, optimizer):
    model.train()
    total_loss = 0
    
    for sequences, targets in dataloader:
        optimizer.zero_grad()
        
        # Forward pass
        outputs = model(sequences)
        loss = criterion(outputs, targets)
        
        # Backward pass
        loss.backward()
        optimizer.step()
        
        total_loss += loss.item()
    
    return total_loss / len(dataloader)

def validate_epoch(model, dataloader, criterion):
    model.eval()
    total_loss = 0
    
    with torch.no_grad():
        for sequences, targets in dataloader:
            outputs = model(sequences)
            loss = criterion(outputs, targets)
            total_loss += loss.item()
    
    return total_loss / len(dataloader)

# N-BEATS 모델 학습
print("=== N-BEATS 모델 학습 시작 ===")
num_epochs = 100
train_losses = []
val_losses = []

for epoch in range(num_epochs):
    train_loss = train_epoch(nbeats_model, train_loader, criterion, optimizer)
    val_loss = validate_epoch(nbeats_model, val_loader, criterion)
    
    train_losses.append(train_loss)
    val_losses.append(val_loss)
    
    # Learning rate 스케줄링
    scheduler.step(val_loss)
    
    if (epoch + 1) % 10 == 0:
        print(f"Epoch [{epoch+1}/{num_epochs}] - Train Loss: {train_loss:.6f}, Val Loss: {val_loss:.6f}")
    
    # Early stopping
    if len(val_losses) > 20 and val_losses[-1] > val_losses[-20]:
        print(f"Early stopping at epoch {epoch+1}")
        break

# 학습 과정 시각화
plt.figure(figsize=(12, 6))
plt.plot(train_losses, label='Training Loss', alpha=0.7)
plt.plot(val_losses, label='Validation Loss', alpha=0.7)
plt.title('N-BEATS 모델 학습 과정')
plt.xlabel('Epoch')
plt.ylabel('Loss (MSE)')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()

print(f"최종 검증 손실: {val_losses[-1]:.6f}")
```

### 5. DeepAR 모델 구현

```python
class DeepAR(nn.Module):
    """DeepAR 모델 구현"""
    def __init__(self, input_dim, hidden_dim, num_layers, output_dim):
        super(DeepAR, self).__init__()
        
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers
        self.output_dim = output_dim
        
        # LSTM 레이어
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True,
            dropout=0.1
        )
        
        # 확률 분포 파라미터를 위한 출력 레이어
        self.fc_mu = nn.Linear(hidden_dim, output_dim)
        self.fc_sigma = nn.Linear(hidden_dim, output_dim)
        
        # 활성화 함수
        self.softplus = nn.Softplus()
        
    def forward(self, x, hidden=None):
        # LSTM 순전파
        lstm_out, hidden = self.lstm(x, hidden)
        
        # 마지막 시점의 출력 사용
        last_output = lstm_out[:, -1, :]
        
        # 확률 분포 파라미터 계산
        mu = self.fc_mu(last_output)
        sigma = self.softplus(self.fc_sigma(last_output)) + 1e-6  # 안정성을 위한 작은 값 추가
        
        return mu, sigma, hidden
    
    def init_hidden(self, batch_size):
        """은닉 상태 초기화"""
        return (torch.zeros(self.num_layers, batch_size, self.hidden_dim).to(device),
                torch.zeros(self.num_layers, batch_size, self.hidden_dim).to(device))

# DeepAR 모델 생성
deepar_model = DeepAR(
    input_dim=1,
    hidden_dim=128,
    num_layers=2,
    output_dim=forecast_horizon
).to(device)

print(f"DeepAR 모델 파라미터 수: {sum(p.numel() for p in deepar_model.parameters())}")

# DeepAR용 손실 함수 (Negative Log Likelihood)
def nll_loss(mu, sigma, targets):
    """정규분포 가정 하의 Negative Log Likelihood 손실"""
    # 정규분포의 NLL 계산
    nll = 0.5 * torch.log(2 * np.pi * sigma**2) + 0.5 * ((targets - mu) / sigma)**2
    return torch.mean(nll)

# DeepAR 모델 학습
print("=== DeepAR 모델 학습 시작 ===")
deepar_optimizer = optim.Adam(deepar_model.parameters(), lr=0.001)
deepar_scheduler = optim.lr_scheduler.ReduceLROnPlateau(deepar_optimizer, mode='min', patience=10, factor=0.5)

deepar_train_losses = []
deepar_val_losses = []

for epoch in range(num_epochs):
    # 학습
    deepar_model.train()
    train_loss = 0
    
    for sequences, targets in train_loader:
        deepar_optimizer.zero_grad()
        
        # 입력 형태 조정 (batch_size, lookback, 1)
        sequences_reshaped = sequences.unsqueeze(-1)
        
        mu, sigma, _ = deepar_model(sequences_reshaped)
        loss = nll_loss(mu, sigma, targets)
        
        loss.backward()
        deepar_optimizer.step()
        
        train_loss += loss.item()
    
    train_loss = train_loss / len(train_loader)
    
    # 검증
    deepar_model.eval()
    val_loss = 0
    
    with torch.no_grad():
        for sequences, targets in val_loader:
            sequences_reshaped = sequences.unsqueeze(-1)
            mu, sigma, _ = deepar_model(sequences_reshaped)
            loss = nll_loss(mu, sigma, targets)
            val_loss += loss.item()
    
    val_loss = val_loss / len(val_loader)
    
    deepar_train_losses.append(train_loss)
    deepar_val_losses.append(val_loss)
    
    # Learning rate 스케줄링
    deepar_scheduler.step(val_loss)
    
    if (epoch + 1) % 10 == 0:
        print(f"Epoch [{epoch+1}/{num_epochs}] - Train Loss: {train_loss:.6f}, Val Loss: {val_loss:.6f}")
    
    # Early stopping
    if len(deepar_val_losses) > 20 and deepar_val_losses[-1] > deepar_val_losses[-20]:
        print(f"Early stopping at epoch {epoch+1}")
        break

# DeepAR 학습 과정 시각화
plt.figure(figsize=(12, 6))
plt.plot(deepar_train_losses, label='Training Loss', alpha=0.7)
plt.plot(deepar_val_losses, label='Validation Loss', alpha=0.7)
plt.title('DeepAR 모델 학습 과정')
plt.xlabel('Epoch')
plt.ylabel('Loss (NLL)')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()

print(f"DeepAR 최종 검증 손실: {deepar_val_losses[-1]:.6f}")
```

### 6. 모델 성능 비교 및 분석

```python
def evaluate_model(model, dataloader, model_name, is_deepar=False):
    """모델 성능 평가"""
    model.eval()
    all_predictions = []
    all_targets = []
    
    with torch.no_grad():
        for sequences, targets in dataloader:
            if is_deepar:
                # DeepAR 모델
                sequences_reshaped = sequences.unsqueeze(-1)
                mu, sigma, _ = model(sequences_reshaped)
                predictions = mu
            else:
                # N-BEATS 모델
                predictions = model(sequences)
            
            all_predictions.append(predictions.cpu().numpy())
            all_targets.append(targets.cpu().numpy())
    
    # 예측값과 타겟을 하나로 합치기
    all_predictions = np.concatenate(all_predictions, axis=0)
    all_targets = np.concatenate(all_targets, axis=0)
    
    # 성능 지표 계산
    mse = mean_squared_error(all_targets.flatten(), all_predictions.flatten())
    mae = mean_absolute_error(all_targets.flatten(), all_predictions.flatten())
    rmse = np.sqrt(mse)
    
    print(f"\n{model_name} 성능:")
    print(f"  MSE: {mse:.4f}")
    print(f"  MAE: {mae:.4f}")
    print(f"  RMSE: {rmse:.4f}")
    
    return all_predictions, all_targets, (mse, mae, rmse)

# 모델 성능 평가
print("=== 모델 성능 평가 ===")

# N-BEATS 성능
nbeats_pred, nbeats_target, nbeats_metrics = evaluate_model(
    nbeats_model, test_loader, "N-BEATS", is_deepar=False
)

# DeepAR 성능
deepar_pred, deepar_target, deepar_metrics = evaluate_model(
    deepar_model, test_loader, "DeepAR", is_deepar=True
)

# 성능 비교 시각화
plt.figure(figsize=(15, 12))

# 1. 예측 vs 실제값 비교 (첫 번째 샘플)
sample_idx = 0

plt.subplot(3, 1, 1)
plt.plot(nbeats_target[sample_idx], label='실제값', linewidth=2, alpha=0.8)
plt.plot(nbeats_pred[sample_idx], label='N-BEATS 예측', color='red', alpha=0.8)
plt.title('N-BEATS: 예측 vs 실제값 (첫 번째 샘플)')
plt.xlabel('예측 기간')
plt.ylabel('값')
plt.legend()
plt.grid(True, alpha=0.3)

plt.subplot(3, 1, 2)
plt.plot(deepar_target[sample_idx], label='실제값', linewidth=2, alpha=0.8)
plt.plot(deepar_pred[sample_idx], label='DeepAR 예측', color='green', alpha=0.8)
plt.title('DeepAR: 예측 vs 실제값 (첫 번째 샘플)')
plt.xlabel('예측 기간')
plt.ylabel('값')
plt.legend()
plt.grid(True, alpha=0.3)

# 2. 전체 성능 비교
plt.subplot(3, 1, 3)
models = ['N-BEATS', 'DeepAR']
rmse_values = [nbeats_metrics[2], deepar_metrics[2]]
mae_values = [nbeats_metrics[1], deepar_metrics[1]]

x = np.arange(len(models))
width = 0.35

plt.bar(x - width/2, rmse_values, width, label='RMSE', alpha=0.8)
plt.bar(x + width/2, mae_values, width, label='MAE', alpha=0.8)

plt.xlabel('모델')
plt.ylabel('오차')
plt.title('모델 성능 비교')
plt.xticks(x, models)
plt.legend()
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()

# 성능 요약 테이블
results_df = pd.DataFrame({
    '모델': ['N-BEATS', 'DeepAR'],
    'MSE': [nbeats_metrics[0], deepar_metrics[0]],
    'MAE': [nbeats_metrics[1], deepar_metrics[1]],
    'RMSE': [nbeats_metrics[2], deepar_metrics[2]]
})

print("\n=== 성능 비교 요약 ===")
print(results_df.to_string(index=False))

# 승자 결정
if nbeats_metrics[2] < deepar_metrics[2]:  # RMSE 기준
    print(f"\n🏆 N-BEATS 모델이 더 나은 성능을 보입니다! (RMSE: {nbeats_metrics[2]:.4f})")
else:
    print(f"\n🏆 DeepAR 모델이 더 나은 성능을 보입니다! (RMSE: {deepar_metrics[2]:.4f})")

# 3. 확률적 예측 시각화 (DeepAR)
if len(test_loader) > 0:
    # 테스트 데이터에서 샘플 추출
    test_batch = next(iter(test_loader))
    test_sequences, test_targets = test_batch
    
    deepar_model.eval()
    with torch.no_grad():
        sequences_reshaped = test_sequences.unsqueeze(-1).to(device)
        mu, sigma, _ = deepar_model(sequences_reshaped)
        
        # 여러 샘플 생성 (Monte Carlo 시뮬레이션)
        num_samples = 100
        samples = []
        
        for _ in range(num_samples):
            # 정규분포에서 샘플링
            noise = torch.randn_like(mu)
            sample = mu + sigma * noise
            samples.append(sample.cpu().numpy())
        
        samples = np.array(samples)  # (num_samples, batch_size, forecast_horizon)
        
        # 첫 번째 샘플의 예측 구간 시각화
        sample_idx = 0
        forecast_horizons = np.arange(forecast_horizon)
        
        plt.figure(figsize=(15, 8))
        
        # 실제값
        plt.plot(forecast_horizons, test_targets[sample_idx], 
                label='실제값', linewidth=3, color='black')
        
        # 예측값 (평균)
        plt.plot(forecast_horizons, mu[sample_idx].cpu().numpy(), 
                label='DeepAR 예측 (평균)', linewidth=2, color='red')
        
        # 신뢰 구간
        percentiles = [5, 25, 75, 95]
        for i, p in enumerate(percentiles):
            percentile_values = np.percentile(samples[:, sample_idx, :], p, axis=0)
            if i < 2:  # 하위 구간
                plt.fill_between(forecast_horizons, percentile_values, 
                               alpha=0.3, color='blue', 
                               label=f'{p}% 신뢰 구간' if i == 0 else '')
            else:  # 상위 구간
                plt.fill_between(forecast_horizons, percentile_values, 
                               alpha=0.3, color='blue')
        
        plt.title('DeepAR 확률적 예측 및 신뢰 구간')
        plt.xlabel('예측 기간')
        plt.ylabel('값')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.show()
        
        print(f"DeepAR 예측의 불확실성:")
        print(f"  평균 표준편차: {sigma.mean().item():.4f}")
        print(f"  최대 표준편차: {sigma.max().item():.4f}")
        print(f"  최소 표준편차: {sigma.min().item():.4f}")
```

## 🚀 다음 단계 및 확장

### Part 3에서 다룰 내용

1. **Transformer 기반 시계열 예측**
   - Informer: 효율적인 Attention 메커니즘
   - Autoformer: 자동화된 시계열 분해
   - FEDformer: 주파수 도메인 기반 예측

2. **최신 LLM 기반 시계열 예측**
   - TimeGPT: 대규모 언어 모델 기반 예측
   - Lag-Llama: 오픈소스 대안

3. **실무 적용 및 최적화**
   - 하이퍼파라미터 튜닝
   - 앙상블 방법
   - 도메인별 최적화

### 추가 개선 방향

1. **모델 아키텍처 개선**
   - 더 깊은 네트워크 구조
   - Attention 메커니즘 도입
   - Residual connection 최적화

2. **데이터 증강**
   - 노이즈 추가
   - 시계열 변형
   - 적대적 학습

3. **앙상블 방법**
   - 여러 모델의 예측 결합
   - 가중 평균
   - Stacking

## 📚 학습 요약

### 이번 파트에서 학습한 내용

1. **딥러닝 기반 시계열 예측의 등장 배경**
   - 전통적 방법의 한계
   - 딥러닝의 혁신적 특징

2. **N-BEATS 모델**
   - 블록 기반 아키텍처
   - 해석 가능한 구조
   - 이중 출력 (Backcast + Forecast)

3. **DeepAR 모델**
   - 확률적 예측
   - LSTM 기반 아키텍처
   - 불확실성 정량화

4. **실제 구현**
   - PyTorch를 사용한 모델 구현
   - 데이터 전처리 및 시퀀스 생성
   - 모델 학습 및 성능 평가

### 핵심 개념 정리

| 모델 | 특징 | 장점 | 단점 |
|------|------|------|------|
| **N-BEATS** | 블록 기반, 해석 가능 | 빠른 학습, 확장성 | 복잡한 패턴 학습 한계 |
| **DeepAR** | 확률적 예측, LSTM 기반 | 불확실성 정량화, 외부 변수 활용 | 학습 시간, 계산 복잡도 |

### 실무 적용 시 고려사항

1. **데이터 특성에 따른 모델 선택**
   - 단순한 패턴: N-BEATS
   - 복잡한 패턴 + 불확실성: DeepAR

2. **계산 자원 고려**
   - 제한된 자원: N-BEATS
   - 충분한 자원: DeepAR

3. **해석 가능성 요구사항**
   - 높은 요구사항: N-BEATS
   - 중간 요구사항: DeepAR

---

*이번 파트에서는 딥러닝의 힘을 활용한 시계열 예측을 경험했습니다. N-BEATS의 해석 가능한 구조와 DeepAR의 확률적 예측을 통해 더욱 정교한 시계열 분석이 가능해졌습니다!* 🎯

*다음 파트에서는 Transformer 기반 모델들을 통해 장기 의존성 문제를 해결하고, 최신 시계열 예측 기술의 최전선을 경험해보세요!* 🚀

---

## 🔗 다음 파트로 이동

**Part 3: 트랜스포머 기반 시계열 예측 모델들**  
Informer, Autoformer, FEDformer, PatchTST 등 최신 트랜스포머 기반 시계열 예측 모델들을 살펴보고 실습해봅니다.

[**Part 3 읽기 →**](/data-ai/2025/09/06/time-series-transformers.html)
