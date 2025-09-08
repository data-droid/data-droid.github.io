---
layout: post
lang: ko
title: "Part 3: 트랜스포머 기반 시계열 예측 모델들"
description: "Informer, Autoformer, FEDformer, PatchTST 등 최신 트랜스포머 기반 시계열 예측 모델들을 살펴보고 실습해봅니다."
date: 2025-09-06
author: Data Droid
category: data-ai
tags: [시계열예측, 트랜스포머, Informer, Autoformer, FEDformer, PatchTST, 딥러닝, AI]
series: time-series-forecasting
series_order: 3
reading_time: 15
difficulty: 중급
---

# Part 3: 트랜스포머 기반 시계열 예측 모델들

안녕하세요! 시계열 예측 시리즈의 세 번째 파트입니다. 이번에는 자연어 처리에서 혁명을 일으킨 트랜스포머(Transformer) 아키텍처가 시계열 예측에 어떻게 적용되었는지 살펴보겠습니다.

## 📚 학습 목표

이 파트를 통해 다음을 학습할 수 있습니다:

- 트랜스포머가 시계열 예측에 적용된 배경과 필요성
- Informer, Autoformer, FEDformer, PatchTST 등 주요 모델들의 특징
- 각 모델의 장단점과 적용 분야
- 실제 데이터를 활용한 트랜스포머 기반 시계열 예측 실습

## 🔍 트랜스포머가 시계열에 적용된 배경

### 기존 방법들의 한계

**RNN/LSTM의 문제점:**
- 순차적 처리로 인한 긴 학습 시간
- 장기 의존성 학습의 어려움
- 병렬 처리 불가능

**CNN의 한계:**
- 지역적 패턴에만 집중
- 장거리 의존성 포착 어려움

### 트랜스포머의 장점

1. **병렬 처리**: 모든 시점을 동시에 처리
2. **장거리 의존성**: Self-attention으로 긴 시퀀스의 관계 학습
3. **확장성**: 더 큰 모델과 데이터셋으로 성능 향상 가능

## 🚀 주요 트랜스포머 기반 시계열 모델들

### 1. Informer (2021)

**핵심 아이디어:**
- ProbSparse Self-attention으로 계산 복잡도 O(L²) → O(L log L)로 감소
- Self-attention Distilling으로 계층별 정보 압축
- Generative Decoder로 한 번에 긴 시퀀스 예측

**주요 특징:**
```python
# Informer의 핵심 구조
class Informer(nn.Module):
    def __init__(self, enc_in, dec_in, c_out, seq_len, label_len, out_len):
        super(Informer, self).__init__()
        self.enc_in = enc_in
        self.dec_in = dec_in
        self.c_out = c_out
        self.seq_len = seq_len
        self.label_len = label_len
        self.out_len = out_len
        
        # ProbSparse Attention 사용
        self.attn = ProbAttention(attention_dropout=0.1)
        
        # Encoder와 Decoder
        self.encoder = Encoder(...)
        self.decoder = Decoder(...)
```

**장점:**
- 긴 시퀀스에서도 효율적
- 다양한 데이터셋에서 우수한 성능

**단점:**
- 복잡한 구조로 인한 긴 학습 시간
- 하이퍼파라미터 튜닝이 어려움

### 2. Autoformer (2021)

**핵심 아이디어:**
- Auto-Correlation 메커니즘으로 시계열의 주기성 자동 학습
- Decomposition Block으로 트렌드와 계절성 분리
- Series-wise Connection으로 정보 손실 최소화

**주요 특징:**
```python
# Autoformer의 Auto-Correlation
class AutoCorrelation(nn.Module):
    def forward(self, queries, keys, values):
        # 시계열의 주기성을 찾는 상관관계 계산
        autocorr = self.autocorrelation(queries, keys)
        return self.value_projection(values) * autocorr
```

**장점:**
- 시계열의 주기성 자동 학습
- 트렌드와 계절성 분해로 해석 가능성 향상

**단점:**
- 주기성이 없는 데이터에서는 성능 제한
- 복잡한 패턴 학습에 어려움

### 3. FEDformer (2022)

**핵심 아이디어:**
- Fourier Enhanced Decomposed Transformer
- FFT를 활용한 주파수 도메인에서의 attention
- 모델 앙상블로 성능 향상

**주요 특징:**
```python
# FEDformer의 Fourier Attention
class FourierAttention(nn.Module):
    def forward(self, x):
        # FFT로 주파수 도메인 변환
        x_freq = torch.fft.rfft(x, dim=-1)
        # 주파수 도메인에서 attention 계산
        attn_freq = self.frequency_attention(x_freq)
        # 역변환으로 시간 도메인 복원
        return torch.fft.irfft(attn_freq, dim=-1)
```

**장점:**
- 주파수 도메인에서의 효율적 처리
- 다양한 주기성 패턴 학습 가능

**단점:**
- FFT 계산 비용
- 실시간 예측에 부적합할 수 있음

### 4. PatchTST (2023)

**핵심 아이디어:**
- 시계열을 패치 단위로 나누어 처리
- Channel Independence로 다변량 시계열 처리
- 단순한 구조로도 우수한 성능

**주요 특징:**
```python
# PatchTST의 패치 분할
def create_patch(x, patch_len, stride):
    # 시계열을 패치로 분할
    patches = x.unfold(dim=-1, size=patch_len, step=stride)
    return patches.transpose(-1, -2)
```

**장점:**
- 단순하고 효율적인 구조
- 다변량 시계열에서 우수한 성능
- 빠른 학습과 추론

**단점:**
- 패치 크기에 민감
- 매우 긴 시퀀스에서는 제한적

## 🛠️ 실습: PatchTST로 주식 가격 예측

이제 실제 데이터를 사용해서 PatchTST 모델을 구현해보겠습니다.

### 1. 데이터 준비

```python
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from torch.utils.data import DataLoader, TensorDataset

# 주식 데이터 생성 (실제로는 yfinance 등 사용)
def generate_stock_data(n_samples=1000, n_features=5):
    """가상의 주식 데이터 생성"""
    np.random.seed(42)
    
    # 트렌드와 계절성을 가진 데이터 생성
    t = np.linspace(0, 4*np.pi, n_samples)
    trend = 0.01 * t
    seasonal = 0.5 * np.sin(t) + 0.3 * np.sin(2*t)
    noise = 0.1 * np.random.randn(n_samples)
    
    # 다변량 시계열 생성
    data = np.zeros((n_samples, n_features))
    for i in range(n_features):
        data[:, i] = trend + seasonal + noise + i*0.1
    
    return pd.DataFrame(data, columns=[f'stock_{i+1}' for i in range(n_features)])

# 데이터 생성
data = generate_stock_data()
print(f"데이터 형태: {data.shape}")
print(data.head())
```

### 2. PatchTST 모델 구현

```python
class PatchTST(nn.Module):
    def __init__(self, seq_len, pred_len, patch_len, stride, n_features, d_model=128, n_heads=8, n_layers=3):
        super(PatchTST, self).__init__()
        self.seq_len = seq_len
        self.pred_len = pred_len
        self.patch_len = patch_len
        self.stride = stride
        self.n_features = n_features
        self.d_model = d_model
        
        # 패치 개수 계산
        self.num_patches = (seq_len - patch_len) // stride + 1
        
        # 입력 프로젝션
        self.input_projection = nn.Linear(patch_len, d_model)
        
        # 위치 인코딩
        self.pos_encoding = nn.Parameter(torch.randn(1, self.num_patches, d_model))
        
        # 트랜스포머 인코더
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, 
            nhead=n_heads, 
            dim_feedforward=d_model*4,
            dropout=0.1,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=n_layers)
        
        # 출력 프로젝션
        self.output_projection = nn.Linear(d_model, pred_len)
        
    def create_patches(self, x):
        """시계열을 패치로 분할"""
        # x: (batch_size, n_features, seq_len)
        batch_size, n_features, seq_len = x.shape
        
        # 각 피처별로 패치 생성
        patches = []
        for i in range(n_features):
            feature_patches = x[:, i, :].unfold(dim=-1, size=self.patch_len, step=self.stride)
            patches.append(feature_patches)
        
        # (batch_size, n_features, num_patches, patch_len)
        patches = torch.stack(patches, dim=1)
        return patches
    
    def forward(self, x):
        # x: (batch_size, n_features, seq_len)
        batch_size, n_features, seq_len = x.shape
        
        # 패치 생성
        patches = self.create_patches(x)  # (batch_size, n_features, num_patches, patch_len)
        
        # 각 피처별로 독립적으로 처리 (Channel Independence)
        outputs = []
        for i in range(n_features):
            feature_patches = patches[:, i, :, :]  # (batch_size, num_patches, patch_len)
            
            # 입력 프로젝션
            projected = self.input_projection(feature_patches)  # (batch_size, num_patches, d_model)
            
            # 위치 인코딩 추가
            projected = projected + self.pos_encoding
            
            # 트랜스포머 인코더
            encoded = self.transformer(projected)  # (batch_size, num_patches, d_model)
            
            # 글로벌 평균 풀링
            pooled = encoded.mean(dim=1)  # (batch_size, d_model)
            
            # 출력 프로젝션
            output = self.output_projection(pooled)  # (batch_size, pred_len)
            outputs.append(output)
        
        # 모든 피처의 출력을 결합
        final_output = torch.stack(outputs, dim=1)  # (batch_size, n_features, pred_len)
        return final_output

# 모델 파라미터 설정
seq_len = 96      # 입력 시퀀스 길이
pred_len = 24     # 예측 길이
patch_len = 16    # 패치 길이
stride = 8        # 스트라이드
n_features = 5    # 피처 수

model = PatchTST(
    seq_len=seq_len,
    pred_len=pred_len,
    patch_len=patch_len,
    stride=stride,
    n_features=n_features
)

print(f"모델 파라미터 수: {sum(p.numel() for p in model.parameters()):,}")
```

### 3. 데이터 전처리 및 학습

```python
def prepare_data(data, seq_len, pred_len, train_ratio=0.7, val_ratio=0.2):
    """데이터를 학습용으로 준비"""
    # 정규화
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(data)
    
    # 시퀀스 생성
    X, y = [], []
    for i in range(len(scaled_data) - seq_len - pred_len + 1):
        X.append(scaled_data[i:i+seq_len])
        y.append(scaled_data[i+seq_len:i+seq_len+pred_len])
    
    X = np.array(X)
    y = np.array(y)
    
    # 학습/검증/테스트 분할
    n_train = int(len(X) * train_ratio)
    n_val = int(len(X) * val_ratio)
    
    X_train, y_train = X[:n_train], y[:n_train]
    X_val, y_val = X[n_train:n_train+n_val], y[n_train:n_train+n_val]
    X_test, y_test = X[n_train+n_val:], y[n_train+n_val:]
    
    return (X_train, y_train), (X_val, y_val), (X_test, y_test), scaler

# 데이터 준비
(X_train, y_train), (X_val, y_val), (X_test, y_test), scaler = prepare_data(
    data, seq_len, pred_len
)

print(f"학습 데이터: {X_train.shape}, {y_train.shape}")
print(f"검증 데이터: {X_val.shape}, {y_val.shape}")
print(f"테스트 데이터: {X_test.shape}, {y_test.shape}")

# DataLoader 생성
def create_dataloader(X, y, batch_size=32, shuffle=True):
    X_tensor = torch.FloatTensor(X).transpose(1, 2)  # (batch, features, seq_len)
    y_tensor = torch.FloatTensor(y).transpose(1, 2)  # (batch, features, pred_len)
    dataset = TensorDataset(X_tensor, y_tensor)
    return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)

train_loader = create_dataloader(X_train, y_train, batch_size=32)
val_loader = create_dataloader(X_val, y_val, batch_size=32, shuffle=False)
```

### 4. 모델 학습

```python
def train_model(model, train_loader, val_loader, epochs=50, lr=0.001):
    """모델 학습"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)
    
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5, factor=0.5)
    
    train_losses = []
    val_losses = []
    
    for epoch in range(epochs):
        # 학습
        model.train()
        train_loss = 0
        for batch_X, batch_y in train_loader:
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)
            
            optimizer.zero_grad()
            outputs = model(batch_X)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
        
        # 검증
        model.eval()
        val_loss = 0
        with torch.no_grad():
            for batch_X, batch_y in val_loader:
                batch_X, batch_y = batch_X.to(device), batch_y.to(device)
                outputs = model(batch_X)
                loss = criterion(outputs, batch_y)
                val_loss += loss.item()
        
        train_loss /= len(train_loader)
        val_loss /= len(val_loader)
        
        train_losses.append(train_loss)
        val_losses.append(val_loss)
        
        scheduler.step(val_loss)
        
        if epoch % 10 == 0:
            print(f'Epoch {epoch:3d}: Train Loss = {train_loss:.6f}, Val Loss = {val_loss:.6f}')
    
    return train_losses, val_losses

# 모델 학습
print("모델 학습 시작...")
train_losses, val_losses = train_model(model, train_loader, val_loader, epochs=100)
print("학습 완료!")
```

### 5. 결과 시각화

```python
def plot_results(model, test_loader, scaler, n_samples=3):
    """결과 시각화"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.eval()
    
    with torch.no_grad():
        for i, (batch_X, batch_y) in enumerate(test_loader):
            if i >= n_samples:
                break
                
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)
            predictions = model(batch_X)
            
            # 첫 번째 샘플만 시각화
            X_sample = batch_X[0].cpu().numpy().T  # (seq_len, n_features)
            y_true = batch_y[0].cpu().numpy().T    # (pred_len, n_features)
            y_pred = predictions[0].cpu().numpy().T # (pred_len, n_features)
            
            # 역정규화
            X_sample = scaler.inverse_transform(X_sample)
            y_true = scaler.inverse_transform(y_true)
            y_pred = scaler.inverse_transform(y_pred)
            
            # 시각화
            fig, axes = plt.subplots(2, 3, figsize=(15, 10))
            axes = axes.flatten()
            
            for j in range(min(5, n_features)):
                ax = axes[j]
                
                # 과거 데이터
                ax.plot(range(seq_len), X_sample[:, j], 'b-', label='과거', linewidth=2)
                
                # 실제 미래
                future_x = range(seq_len, seq_len + pred_len)
                ax.plot(future_x, y_true[:, j], 'g-', label='실제', linewidth=2)
                
                # 예측
                ax.plot(future_x, y_pred[:, j], 'r--', label='예측', linewidth=2)
                
                ax.set_title(f'Stock {j+1}')
                ax.legend()
                ax.grid(True, alpha=0.3)
            
            # 마지막 subplot 숨기기
            if n_features < 6:
                axes[-1].set_visible(False)
            
            plt.tight_layout()
            plt.show()

# 결과 시각화
test_loader = create_dataloader(X_test, y_test, batch_size=1, shuffle=False)
plot_results(model, test_loader, scaler)

# 학습 곡선 시각화
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.plot(train_losses, label='Train Loss', color='blue')
plt.plot(val_losses, label='Validation Loss', color='red')
plt.title('학습 곡선')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.grid(True, alpha=0.3)

plt.subplot(1, 2, 2)
plt.plot(train_losses[-20:], label='Train Loss (Last 20)', color='blue')
plt.plot(val_losses[-20:], label='Validation Loss (Last 20)', color='red')
plt.title('최근 학습 곡선')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()
```

### 6. 성능 평가

```python
def evaluate_model(model, test_loader, scaler):
    """모델 성능 평가"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.eval()
    
    all_predictions = []
    all_targets = []
    
    with torch.no_grad():
        for batch_X, batch_y in test_loader:
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)
            predictions = model(batch_X)
            
            all_predictions.append(predictions.cpu().numpy())
            all_targets.append(batch_y.cpu().numpy())
    
    # 예측과 타겟 결합
    predictions = np.concatenate(all_predictions, axis=0)
    targets = np.concatenate(all_targets, axis=0)
    
    # 역정규화
    predictions = scaler.inverse_transform(predictions.transpose(0, 2, 1).reshape(-1, n_features))
    targets = scaler.inverse_transform(targets.transpose(0, 2, 1).reshape(-1, n_features))
    
    # MSE, MAE 계산
    mse = np.mean((predictions - targets) ** 2)
    mae = np.mean(np.abs(predictions - targets))
    rmse = np.sqrt(mse)
    
    print(f"테스트 성능:")
    print(f"MSE: {mse:.6f}")
    print(f"MAE: {mae:.6f}")
    print(f"RMSE: {rmse:.6f}")
    
    return mse, mae, rmse

# 성능 평가
mse, mae, rmse = evaluate_model(model, test_loader, scaler)
```

## 📊 모델 비교 및 선택 가이드

### 성능 비교

| 모델 | 장점 | 단점 | 적용 분야 |
|------|------|------|-----------|
| **Informer** | 긴 시퀀스 효율적, 강력한 성능 | 복잡한 구조, 긴 학습 시간 | 장기 예측, 대용량 데이터 |
| **Autoformer** | 주기성 자동 학습, 해석 가능 | 주기성 없는 데이터 제한 | 계절성 데이터, 비즈니스 분석 |
| **FEDformer** | 주파수 도메인 처리, 앙상블 | FFT 계산 비용 | 신호 처리, 주기성 데이터 |
| **PatchTST** | 단순하고 효율적, 빠른 학습 | 패치 크기 민감 | 실시간 예측, 다변량 시계열 |

### 모델 선택 가이드

**1. 데이터 특성에 따른 선택:**
- **주기성이 강한 데이터**: Autoformer, FEDformer
- **긴 시퀀스 데이터**: Informer, PatchTST
- **다변량 시계열**: PatchTST, Informer
- **실시간 예측**: PatchTST

**2. 리소스 제약에 따른 선택:**
- **제한된 계산 자원**: PatchTST
- **충분한 자원**: Informer, FEDformer
- **빠른 프로토타이핑**: PatchTST

## 🎯 다음 단계

이번 파트에서는 트랜스포머 기반 시계열 예측 모델들을 살펴보았습니다. 다음 파트에서는:

- **Part 4**: 최신 생성형 AI 모델들 (TimeGPT, Lag-Llama, Moirai, Chronos)
- **Part 5**: 실무 적용과 MLOps (모델 배포, 모니터링, A/B 테스트)

## 💡 핵심 포인트

1. **트랜스포머의 장점**: 병렬 처리, 장거리 의존성 학습, 확장성
2. **모델별 특성**: 각 모델마다 고유한 강점과 적용 분야가 있음
3. **실무 고려사항**: 데이터 특성, 리소스 제약, 성능 요구사항을 종합적으로 고려
4. **실습의 중요성**: 이론과 코드를 함께 학습하여 실제 적용 능력 향상

트랜스포머 기반 모델들은 시계열 예측의 새로운 패러다임을 제시하고 있습니다. 다음 파트에서 더욱 흥미로운 최신 모델들을 만나보세요!

---

## 🔗 시리즈 네비게이션

**← 이전**: [Part 2: 딥러닝 기반 시계열 예측 - N-BEATS와 DeepAR](/data-ai/2025/09/01/time-series-deep-learning.html)

**다음 →**: [Part 4: 최신 생성형 AI 모델들 - TimeGPT, Lag-Llama, Moirai, Chronos](/data-ai/2025/09/07/time-series-llm-models.html)

---

**다음 파트 미리보기**: Part 4에서는 TimeGPT, Lag-Llama 등 최신 생성형 AI 모델들이 시계열 예측에 어떻게 활용되는지 살펴보겠습니다. 🚀
