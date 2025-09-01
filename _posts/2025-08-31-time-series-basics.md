---
layout: post
lang: ko
title: "Part 1: 시계열 예측의 기초 - ARIMA부터 Prophet까지"
description: "시계열 데이터의 기본 개념과 전통적 통계 방법, Prophet의 등장까지 체계적으로 학습하고 실제 코드로 구현해보세요."
date: 2025-08-31
author: Data Droid
category: data-ai
tags: [시계열예측, ARIMA, Prophet, 통계, Python, 시계열분석]
series: time-series-forecasting
series_order: 1
reading_time: "25분"
difficulty: "초급"
---

# Part 1: 시계열 예측의 기초 - ARIMA부터 Prophet까지

> 시계열 데이터의 기본 개념과 전통적 통계 방법, Prophet의 등장까지 체계적으로 학습하고 실제 코드로 구현해보세요.

## 📋 목차

1. [시계열 예측이란 무엇인가?](#시계열-예측이란-무엇인가)
2. [시계열 데이터의 특성](#시계열-데이터의-특성)
3. [전통적 통계 방법](#전통적-통계-방법)
4. [ARIMA 모델](#arima-모델)
5. [Prophet 소개](#prophet-소개)
6. [실습 구현](#실습-구현)
7. [방법론 비교](#방법론-비교)
8. [다음 단계](#다음-단계)

## 🎯 시계열 예측이란 무엇인가?

시계열 예측은 **시간 순서대로 배열된 데이터의 패턴을 학습하여 미래 값을 예측하는 기술**입니다. 주식 가격, 판매량, 센서 데이터 등 다양한 분야에서 사용됩니다.

### 🔍 시계열 데이터의 특성

- **추세(Trend)**: 장기적인 증가/감소 패턴
- **계절성(Seasonality)**: 주기적으로 반복되는 패턴
- **노이즈(Noise)**: 예측하기 어려운 무작위 변동
- **구조적 변화(Structural Changes)**: 특정 시점에서 발생하는 패턴 변화

## 📊 시계열 데이터의 특성

### 1. 정상성(Stationarity)
정상성은 시계열의 통계적 특성이 시간에 따라 변하지 않는다는 의미입니다.

```python
# 정상성 검정 예제
from statsmodels.tsa.stattools import adfuller

def check_stationarity(timeseries):
    result = adfuller(timeseries)
    print(f'ADF 통계량: {result[0]}')
    print(f'p-value: {result[1]}')
    print(f'임계값: {result[4]}')
    
    if result[1] <= 0.05:
        print("시계열이 정상적입니다 (H0 기각)")
    else:
        print("시계열이 비정상적입니다 (H0 채택)")
```

### 2. 자기상관(Autocorrelation)
자기상관은 시계열에서 서로 다른 시간 간격의 값들 간의 상관관계를 의미합니다.

```python
# 자기상관함수(ACF)와 부분자기상관함수(PACF)
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf

def plot_correlation_functions(timeseries, lags=40):
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8))
    
    plot_acf(timeseries, lags=lags, ax=ax1)
    plot_pacf(timeseries, lags=lags, ax=ax2)
    
    plt.tight_layout()
    plt.show()
```

## 📈 전통적 통계 방법

### 1. 이동평균(Moving Average)
이동평균은 노이즈를 줄이기 위해 특정 기간의 평균을 계산하는 방법입니다.

```python
def simple_moving_average(data, window):
    """단순 이동평균 계산"""
    return data.rolling(window=window).mean()

def exponential_moving_average(data, alpha):
    """지수 이동평균 계산"""
    return data.ewm(alpha=alpha).mean()
```

### 2. 차분(Differencing)
차분은 시계열에서 정상성을 달성하기 위해 사용하는 방법입니다.

```python
def difference_series(data, order=1):
    """차분 계산"""
    return data.diff(order).dropna()
```

## 🏗️ ARIMA 모델

ARIMA (AutoRegressive Integrated Moving Average)는 시계열 예측을 위한 가장 기본적인 모델입니다.

### ARIMA 모델의 구성 요소

1. **AR (자기회귀)**: 과거 값들의 선형 결합
2. **I (통합)**: 차분을 통한 정상성 달성
3. **MA (이동평균)**: 과거 오차들의 선형 결합

### ARIMA(p, d, q) 매개변수

- **p**: AR 차수 (사용되는 과거 값의 개수)
- **d**: 차분 차수 (정상성을 위한 차분 연산 횟수)
- **q**: MA 차수 (사용되는 과거 오차의 개수)

```python
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# 샘플 시계열 데이터 생성
np.random.seed(42)
n = 1000
trend = np.linspace(0, 10, n)
seasonality = 5 * np.sin(2 * np.pi * np.arange(n) / 100)
noise = np.random.normal(0, 1, n)
data = trend + seasonality + noise

# pandas Series로 변환
ts = pd.Series(data, index=pd.date_range('2020-01-01', periods=n, freq='D'))

# 정상성 검정
print("원본 시계열 정상성 검정:")
check_stationarity(ts)

# 차분을 통한 정상성 달성
ts_diff = difference_series(ts)
print("\n1차 차분 후 정상성 검정:")
check_stationarity(ts_diff)

# ACF와 PACF 그래프
plot_correlation_functions(ts_diff, lags=50)

# ARIMA 모델 적합 (p=2, d=1, q=2)
model = ARIMA(ts, order=(2, 1, 2))
fitted_model = model.fit()

print(f"\nARIMA 모델 요약:")
print(fitted_model.summary())

# 예측
forecast_steps = 30
forecast = fitted_model.forecast(steps=forecast_steps)

# 결과 시각화
plt.figure(figsize=(15, 8))
plt.plot(ts.index, ts.values, label='원본 데이터', alpha=0.7)
plt.plot(forecast.index, forecast.values, label='예측값', color='red', linewidth=2)
plt.title('ARIMA 모델 예측 결과')
plt.xlabel('날짜')
plt.ylabel('값')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()

# 모델 성능 평가
from sklearn.metrics import mean_squared_error, mean_absolute_error

# 훈련 데이터와 검증 데이터 분할
train_size = int(len(ts) * 0.8)
train = ts[:train_size]
test = ts[train_size:]

# 훈련 데이터로 모델 재적합
model_train = ARIMA(train, order=(2, 1, 2))
fitted_model_train = model_train.fit()

# 검증 데이터에 대한 예측
forecast_test = fitted_model_train.forecast(steps=len(test))

# 성능 지표 계산
mse = mean_squared_error(test, forecast_test)
mae = mean_absolute_error(test, forecast_test)
rmse = np.sqrt(mse)

print(f"\n모델 성능 평가:")
print(f"MSE: {mse:.4f}")
print(f"MAE: {mae:.4f}")
print(f"RMSE: {rmse:.4f}")
```

## 🚀 Prophet 소개

Prophet은 Facebook에서 개발한 자동화된 시계열 예측 도구로, 비즈니스 시계열 데이터에 특화되어 있습니다.

### Prophet의 장점

1. **자동화된 모델링**: 하이퍼파라미터 튜닝이 자동화됨
2. **계절성 처리**: 다양한 계절적 패턴을 자동으로 감지
3. **이상치 처리**: 휴일이나 이벤트 같은 특별한 날짜들을 처리
4. **해석 가능성**: 추세와 계절성 구성 요소를 분석

```python
from fbprophet import Prophet
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Prophet용 데이터 준비 (컬럼: ds, y)
df = pd.DataFrame({
    'ds': pd.date_range('2020-01-01', periods=1000, freq='D'),
    'y': ts.values
})

# Prophet 모델 생성 및 적합
model_prophet = Prophet(
    yearly_seasonality=True,    # 연간 계절성
    weekly_seasonality=True,    # 주간 계절성
    daily_seasonality=False,    # 일간 계절성 (데이터 부족시 False)
    seasonality_mode='additive' # 가법적 계절성
)

model_prophet.fit(df)

# 미래 예측
future = model_prophet.make_future_dataframe(periods=30)
forecast_prophet = model_prophet.predict(future)

# 예측 결과 시각화
fig1 = model_prophet.plot(forecast_prophet)
plt.title('Prophet 모델 예측 결과')
plt.show()

# 구성 요소 분석
fig2 = model_prophet.plot_components(forecast_prophet)
plt.show()

# Prophet 모델 성능 평가
# 훈련 데이터와 검증 데이터 분할
train_size = int(len(df) * 0.8)
train_df = df[:train_size]
test_df = df[train_size:]

# 훈련 데이터로 모델 재적합
model_prophet_train = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=False,
    seasonality_mode='additive'
)
model_prophet_train.fit(train_df)

# 검증 데이터에 대한 예측
future_test = model_prophet_train.make_future_dataframe(periods=len(test_df))
forecast_prophet_test = model_prophet_train.predict(future_test)

# 성능 지표 계산
y_true = test_df['y'].values
y_pred = forecast_prophet_test['yhat'].values[-len(test_df):]

mse_prophet = mean_squared_error(y_true, y_pred)
mae_prophet = mean_absolute_error(y_true, y_pred)
rmse_prophet = np.sqrt(mse_prophet)

print(f"\nProphet 모델 성능 평가:")
print(f"MSE: {mse_prophet:.4f}")
print(f"MAE: {mae_prophet:.4f}")
print(f"RMSE: {rmse_prophet:.4f}")
```

## 🛠️ 실습 구현

### 1. 환경 설정 및 데이터 준비

```python
# 필요한 라이브러리 설치
# pip install pandas numpy matplotlib seaborn statsmodels fbprophet scikit-learn

import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf
from fbprophet import Prophet
from sklearn.metrics import mean_squared_error, mean_absolute_error
import warnings
warnings.filterwarnings('ignore')

# 시각화 설정
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")
```

### 2. 복잡한 시계열 데이터 생성

```python
def generate_complex_timeseries(n=1000, seed=42):
    """복잡한 시계열 데이터 생성"""
    np.random.seed(seed)
    
    # 시간 인덱스
    t = np.arange(n)
    
    # 추세 (비선형)
    trend = 0.1 * t + 0.001 * t**2 + 0.00001 * t**3
    
    # 계절성 (다중 주기)
    seasonality_1 = 10 * np.sin(2 * np.pi * t / 365)  # 연간
    seasonality_2 = 5 * np.sin(2 * np.pi * t / 7)     # 주간
    seasonality_3 = 2 * np.sin(2 * np.pi * t / 24)    # 일간
    
    # 구조적 변화 (중간에 패턴 변화)
    structural_change = np.where(t < n//2, 0, 5 * np.sin(2 * np.pi * t / 100))
    
    # 노이즈 (시간에 따라 증가하는 변동성)
    noise = np.random.normal(0, 1 + 0.01 * t, n)
    
    # 이상치 추가
    outliers = np.random.choice(n, size=n//50, replace=False)
    noise[outliers] += np.random.normal(0, 10, len(outliers))
    
    # 완전한 시계열
    ts = trend + seasonality_1 + seasonality_2 + seasonality_3 + structural_change + noise
    
    return pd.Series(ts, index=pd.date_range('2020-01-01', periods=n, freq='D'))

# 복잡한 시계열 생성
complex_ts = generate_complex_timeseries(1000)

# 시각화
plt.figure(figsize=(15, 10))

plt.subplot(3, 1, 1)
plt.plot(complex_ts.index, complex_ts.values, alpha=0.7)
plt.title('복잡한 시계열 데이터')
plt.ylabel('값')

plt.subplot(3, 1, 2)
plt.plot(complex_ts.index[:100], complex_ts.values[:100], alpha=0.7)
plt.title('첫 100일 데이터 (확대)')
plt.ylabel('값')

plt.subplot(3, 1, 3)
plt.plot(complex_ts.index[-100:], complex_ts.values[-100:], alpha=0.7)
plt.title('마지막 100일 데이터 (확대)')
plt.ylabel('값')

plt.tight_layout()
plt.show()
```

### 3. ARIMA 모델 실습

```python
def arima_practice(timeseries):
    """ARIMA 모델 실습"""
    print("=== ARIMA 모델 실습 ===\n")
    
    # 1. 정상성 검정
    print("1. 정상성 검정")
    check_stationarity(timeseries)
    
    # 2. 차분을 통한 정상성 달성
    print("\n2. 차분을 통한 정상성 달성")
    ts_diff = difference_series(timeseries)
    check_stationarity(ts_diff)
    
    # 3. ACF와 PACF 분석
    print("\n3. ACF와 PACF 분석")
    plot_correlation_functions(ts_diff, lags=50)
    
    # 4. ARIMA 모델 적합 (여러 매개변수 시도)
    print("\n4. ARIMA 모델 적합")
    best_aic = float('inf')
    best_order = None
    best_model = None
    
    # 매개변수 그리드 탐색
    p_values = range(0, 4)
    d_values = range(0, 3)
    q_values = range(0, 4)
    
    for p in p_values:
        for d in d_values:
            for q in q_values:
                try:
                    model = ARIMA(timeseries, order=(p, d, q))
                    fitted_model = model.fit()
                    aic = fitted_model.aic
                    
                    if aic < best_aic:
                        best_aic = aic
                        best_order = (p, d, q)
                        best_model = fitted_model
                        
                    print(f"ARIMA({p},{d},{q}) - AIC: {aic:.2f}")
                    
                except:
                    continue
    
    print(f"\n최적 모델: ARIMA{best_order} (AIC: {best_aic:.2f})")
    
    # 5. 최적 모델로 예측
    print("\n5. 최적 모델로 예측")
    forecast_steps = 30
    forecast = best_model.forecast(steps=forecast_steps)
    
    # 6. 결과 시각화
    plt.figure(figsize=(15, 8))
    plt.plot(timeseries.index, timeseries.values, label='원본 데이터', alpha=0.7)
    plt.plot(forecast.index, forecast.values, label='예측값', color='red', linewidth=2)
    plt.title(f'ARIMA{best_order} 모델 예측 결과')
    plt.xlabel('날짜')
    plt.ylabel('값')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.show()
    
    return best_model, forecast

# ARIMA 실습 실행
arima_model, arima_forecast = arima_practice(complex_ts)
```

### 4. Prophet 모델 실습

```python
def prophet_practice(timeseries):
    """Prophet 모델 실습"""
    print("=== Prophet 모델 실습 ===\n")
    
    # 1. Prophet용 데이터 준비
    print("1. Prophet용 데이터 준비")
    df = pd.DataFrame({
        'ds': timeseries.index,
        'y': timeseries.values
    })
    
    # 2. 모델 생성 및 적합
    print("2. Prophet 모델 적합")
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode='additive',
        changepoint_prior_scale=0.05,  # 추세 변화점 민감도
        seasonality_prior_scale=10.0   # 계절성 강도
    )
    
    # 휴일 정보 추가 (예제)
    holidays = pd.DataFrame({
        'holiday': 'new_year',
        'ds': pd.to_datetime(['2020-01-01', '2021-01-01', '2022-01-01']),
        'lower_window': -1,
        'upper_window': 1,
    })
    model.add_country_holidays(country_name='US')  # 미국 휴일 추가
    
    model.fit(df)
    
    # 3. 미래 예측
    print("3. 미래 예측")
    future = model.make_future_dataframe(periods=30)
    forecast = model.predict(future)
    
    # 4. 예측 결과 시각화
    print("4. 예측 결과 시각화")
    fig1 = model.plot(forecast)
    plt.title('Prophet 모델 예측 결과')
    plt.show()
    
    # 5. 구성 요소 분석
    print("5. 구성 요소 분석")
    fig2 = model.plot_components(forecast)
    plt.show()
    
    # 6. 추세 변화점 분석
    print("6. 추세 변화점 분석")
    changepoints = model.changepoints
    if len(changepoints) > 0:
        plt.figure(figsize=(15, 8))
        plt.plot(df['ds'], df['y'], label='원본 데이터', alpha=0.7)
        plt.plot(forecast['ds'], forecast['yhat'], label='예측값', color='red', alpha=0.7)
        plt.vlines(changepoints, ymin=df['y'].min(), ymax=df['y'].max(), 
                  colors='green', linestyles='--', alpha=0.5, label='변화점')
        plt.title('Prophet 모델 - 추세 변화점')
        plt.xlabel('날짜')
        plt.ylabel('값')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.show()
    
    return model, forecast

# Prophet 실습 실행
prophet_model, prophet_forecast = prophet_practice(complex_ts)
```

### 5. 모델 성능 비교 및 분석

```python
def compare_models(timeseries, arima_forecast, prophet_forecast):
    """ARIMA와 Prophet 모델 성능 비교"""
    print("=== 모델 성능 비교 ===\n")
    
    # 데이터 분할 (훈련:검증 = 8:2)
    train_size = int(len(timeseries) * 0.8)
    train = timeseries[:train_size]
    test = timeseries[train_size:]
    
    # ARIMA 모델 재적합 및 검증
    print("1. ARIMA 모델 검증")
    model_arima = ARIMA(train, order=(2, 1, 2))  # 간단한 모델 사용
    fitted_arima = model_arima.fit()
    forecast_arima_test = fitted_arima.forecast(steps=len(test))
    
    # Prophet 모델 재적합 및 검증
    print("2. Prophet 모델 검증")
    train_df = pd.DataFrame({
        'ds': train.index,
        'y': train.values
    })
    
    model_prophet = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False
    )
    model_prophet.fit(train_df)
    
    future_test = model_prophet.make_future_dataframe(periods=len(test))
    forecast_prophet_test = model_prophet.predict(future_test)
    yhat_prophet = forecast_prophet_test['yhat'].values[-len(test):]
    
    # 성능 지표 계산
    def calculate_metrics(y_true, y_pred, model_name):
        mse = mean_squared_error(y_true, y_pred)
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        
        print(f"\n{model_name} 성능:")
        print(f"  MSE: {mse:.4f}")
        print(f"  MAE: {mae:.4f}")
        print(f"  RMSE: {rmse:.4f}")
        
        return mse, mae, rmse
    
    # ARIMA 성능
    arima_metrics = calculate_metrics(test.values, forecast_arima_test.values, "ARIMA")
    
    # Prophet 성능
    prophet_metrics = calculate_metrics(test.values, yhat_prophet, "Prophet")
    
    # 성능 비교 시각화
    plt.figure(figsize=(15, 10))
    
    # 전체 시계열
    plt.subplot(2, 1, 1)
    plt.plot(timeseries.index, timeseries.values, label='원본 데이터', alpha=0.7)
    plt.plot(arima_forecast.index, arima_forecast.values, label='ARIMA 예측', color='red', alpha=0.7)
    plt.plot(prophet_forecast['ds'], prophet_forecast['yhat'], label='Prophet 예측', color='green', alpha=0.7)
    plt.axvline(x=test.index[0], color='black', linestyle='--', alpha=0.5, label='검증 시작')
    plt.title('전체 시계열 및 예측 비교')
    plt.xlabel('날짜')
    plt.ylabel('값')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # 검증 기간 확대
    plt.subplot(2, 1, 2)
    plt.plot(test.index, test.values, label='실제값', alpha=0.7, linewidth=2)
    plt.plot(test.index, forecast_arima_test.values, label='ARIMA 예측', color='red', alpha=0.7)
    plt.plot(test.index, yhat_prophet, label='Prophet 예측', color='green', alpha=0.7)
    plt.title('검증 기간 예측 비교')
    plt.xlabel('날짜')
    plt.ylabel('값')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.show()
    
    # 성능 요약 테이블
    results_df = pd.DataFrame({
        '모델': ['ARIMA', 'Prophet'],
        'MSE': [arima_metrics[0], prophet_metrics[0]],
        'MAE': [arima_metrics[1], prophet_metrics[1]],
        'RMSE': [arima_metrics[2], prophet_metrics[2]]
    })
    
    print("\n=== 성능 비교 요약 ===")
    print(results_df.to_string(index=False))
    
    # 승자 결정
    if arima_metrics[2] < prophet_metrics[2]:  # RMSE 기준
        print(f"\n🏆 ARIMA 모델이 더 나은 성능을 보입니다! (RMSE: {arima_metrics[2]:.4f})")
    else:
        print(f"\n🏆 Prophet 모델이 더 나은 성능을 보입니다! (RMSE: {prophet_metrics[2]:.4f})")

# 모델 비교 실행
compare_models(complex_ts, arima_forecast, prophet_forecast)
```

## 📊 방법론 비교

### ARIMA vs Prophet

| 특성 | ARIMA | Prophet |
|------|-------|---------|
| **적용 범위** | 선형 시계열 | 비선형 시계열 |
| **계절성 처리** | 수동 설정 | 자동 감지 |
| **이상치 처리** | 민감함 | 강건함 |
| **해석 가능성** | 높음 | 높음 |
| **자동화 수준** | 낮음 | 높음 |
| **계산 효율성** | 높음 | 중간 |
| **하이퍼파라미터** | 수동 튜닝 | 자동 최적화 |

### 언제 어떤 모델을 사용할까?

#### **ARIMA를 사용하는 경우:**
- 선형 추세를 가진 시계열
- 명확한 계절적 패턴
- 빠른 예측이 필요한 경우
- 모델 해석이 중요한 경우

#### **Prophet을 사용하는 경우:**
- 복잡한 계절적 패턴
- 휴일이나 이벤트 같은 특별한 날짜들
- 자동화된 모델링이 필요한 경우
- 비즈니스 시계열 데이터

## 🚀 다음 단계

이제 **Part 2: 딥러닝 기반 시계열 예측**으로 넘어가서 N-BEATS와 DeepAR을 통해 더 강력한 시계열 예측 모델들을 학습해보세요!

### 다음 파트에서 다룰 내용

1. **딥러닝 기반 모델의 배경**
2. **N-BEATS의 해석 가능한 블록 기반 아키텍처**
3. **DeepAR의 확률적 예측과 불확실성 정량화**
4. **PyTorch를 이용한 실제 모델 구현**
5. **전통적 방법과의 성능 비교**

---

*이번 파트에서는 ARIMA와 Prophet을 통해 전통적 통계 방법의 핵심을 다뤘습니다. 다음 파트에서는 딥러닝의 힘을 활용한 더 정교한 시계열 예측을 경험해보세요!* 🎯
