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

# Part 1: Fundamentals of Time Series Forecasting - From ARIMA to Prophet

> Systematically learn the basic concepts of time series data and traditional statistical methods, up to the emergence of Prophet, and implement them with actual code.

## 📋 Table of Contents

1. [What is Time Series Forecasting?](#what-is-time-series-forecasting)
2. [Characteristics of Time Series Data](#characteristics-of-time-series-data)
3. [Traditional Statistical Methods](#traditional-statistical-methods)
4. [ARIMA Models](#arima-models)
5. [Introduction to Prophet](#introduction-to-prophet)
6. [Practical Implementation](#practical-implementation)
7. [Methodology Comparison](#methodology-comparison)
8. [Next Steps](#next-steps)

## 🎯 What is Time Series Forecasting?

Time series forecasting is **a technology that learns patterns in data arranged in chronological order to predict future values**. It is used in various fields such as stock prices, sales volume, sensor data, and more.

### 🔍 Characteristics of Time Series Data

- **Trend**: Long-term increase/decrease patterns
- **Seasonality**: Periodically repeating patterns
- **Noise**: Random variations that are difficult to predict
- **Structural Changes**: Pattern changes occurring at specific points in time

## 📊 Characteristics of Time Series Data

### 1. Stationarity
Stationarity means that the statistical properties of a time series do not change over time.

```python
# Stationarity test example
from statsmodels.tsa.stattools import adfuller

def check_stationarity(timeseries):
    result = adfuller(timeseries)
    print(f'ADF Statistic: {result[0]}')
    print(f'p-value: {result[1]}')
    print(f'Critical Values: {result[4]}')
    
    if result[1] <= 0.05:
        print("Time series is stationary (H0 rejected)")
    else:
        print("Time series is not stationary (H0 accepted)")
```

### 2. Autocorrelation
Autocorrelation refers to the correlation between values in a time series at different time intervals.

```python
# Autocorrelation Function (ACF) and Partial Autocorrelation Function (PACF)
from statsmodels.graphics.tsaplots import plot_acf, plot_pacf

def plot_correlation_functions(timeseries, lags=40):
    fig, (ax1, ax2) = plt.subplots(2, 1, figsize=(12, 8))
    
    plot_acf(timeseries, lags=lags, ax=ax1)
    plot_pacf(timeseries, lags=lags, ax=ax2)
    
    plt.tight_layout()
    plt.show()
```

## 📈 Traditional Statistical Methods

### 1. Moving Average
Moving average is a method of calculating the average over a certain period to reduce noise.

```python
def simple_moving_average(data, window):
    """Calculate simple moving average"""
    return data.rolling(window=window).mean()

def exponential_moving_average(data, alpha):
    """Calculate exponential moving average"""
    return data.ewm(alpha=alpha).mean()
```

### 2. Differencing
Differencing is a method used to achieve stationarity in time series.

```python
def difference_series(data, order=1):
    """Calculate differencing"""
    return data.diff(order).dropna()
```

## 🏗️ ARIMA Models

ARIMA (AutoRegressive Integrated Moving Average) is the most basic model for time series forecasting.

### Components of ARIMA Model

1. **AR (AutoRegressive)**: Linear combination of past values
2. **I (Integrated)**: Achieving stationarity through differencing
3. **MA (Moving Average)**: Linear combination of past errors

### ARIMA(p, d, q) Parameters

- **p**: AR order (number of past values used)
- **d**: Differencing order (number of differencing operations for stationarity)
- **q**: MA order (number of past errors used)

```python
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.stattools import adfuller
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Generate sample time series data
np.random.seed(42)
n = 1000
trend = np.linspace(0, 10, n)
seasonality = 5 * np.sin(2 * np.pi * np.arange(n) / 100)
noise = np.random.normal(0, 1, n)
data = trend + seasonality + noise

# Convert to pandas Series
ts = pd.Series(data, index=pd.date_range('2020-01-01', periods=n, freq='D'))

# Stationarity test
print("Original time series stationarity test:")
check_stationarity(ts)

# Achieve stationarity through differencing
ts_diff = difference_series(ts)
print("\nStationarity test after 1st differencing:")
check_stationarity(ts_diff)

# ACF and PACF plots
plot_correlation_functions(ts_diff, lags=50)

# Fit ARIMA model (p=2, d=1, q=2)
model = ARIMA(ts, order=(2, 1, 2))
fitted_model = model.fit()

print(f"\nARIMA model summary:")
print(fitted_model.summary())

# Forecasting
forecast_steps = 30
forecast = fitted_model.forecast(steps=forecast_steps)

# Result visualization
plt.figure(figsize=(15, 8))
plt.plot(ts.index, ts.values, label='Original Data', alpha=0.7)
plt.plot(forecast.index, forecast.values, label='Forecast', color='red', linewidth=2)
plt.title('ARIMA Model Forecast Results')
plt.xlabel('Date')
plt.ylabel('Value')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()

# Model performance evaluation
from sklearn.metrics import mean_squared_error, mean_absolute_error

# Split data into training and validation
train_size = int(len(ts) * 0.8)
train = ts[:train_size]
test = ts[train_size:]

# Refit model with training data
model_train = ARIMA(train, order=(2, 1, 2))
fitted_model_train = model_train.fit()

# Forecast on validation data
forecast_test = fitted_model_train.forecast(steps=len(test))

# Calculate performance metrics
mse = mean_squared_error(test, forecast_test)
mae = mean_absolute_error(test, forecast_test)
rmse = np.sqrt(mse)

print(f"\nModel performance evaluation:")
print(f"MSE: {mse:.4f}")
print(f"MAE: {mae:.4f}")
print(f"RMSE: {rmse:.4f}")
```

## 🚀 Introduction to Prophet

Prophet is an automated time series forecasting tool developed by Facebook, specialized for business time series data.

### Advantages of Prophet

1. **Automated Modeling**: Hyperparameter tuning is automated
2. **Seasonality Handling**: Automatically detects various seasonal patterns
3. **Outlier Handling**: Processes special dates like holidays and events
4. **Interpretability**: Analyzes trend and seasonal components

```python
from fbprophet import Prophet
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# Prepare data for Prophet (columns: ds, y)
df = pd.DataFrame({
    'ds': pd.date_range('2020-01-01', periods=1000, freq='D'),
    'y': ts.values
})

# Create and fit Prophet model
model_prophet = Prophet(
    yearly_seasonality=True,    # Yearly seasonality
    weekly_seasonality=True,    # Weekly seasonality
    daily_seasonality=False,    # Daily seasonality (False if insufficient data)
    seasonality_mode='additive' # Additive seasonality
)

model_prophet.fit(df)

# Future prediction
future = model_prophet.make_future_dataframe(periods=30)
forecast_prophet = model_prophet.predict(future)

# Forecast result visualization
fig1 = model_prophet.plot(forecast_prophet)
plt.title('Prophet Model Forecast Results')
plt.show()

# Component analysis
fig2 = model_prophet.plot_components(forecast_prophet)
plt.show()

# Prophet model performance evaluation
# Split data into training and validation
train_size = int(len(df) * 0.8)
train_df = df[:train_size]
test_df = df[train_size:]

# Refit model with training data
model_prophet_train = Prophet(
    yearly_seasonality=True,
    weekly_seasonality=True,
    daily_seasonality=False,
    seasonality_mode='additive'
)
model_prophet_train.fit(train_df)

# Forecast on validation data
future_test = model_prophet_train.make_future_dataframe(periods=len(test_df))
forecast_prophet_test = model_prophet_train.predict(future_test)

# Calculate performance metrics
y_true = test_df['y'].values
y_pred = forecast_prophet_test['yhat'].values[-len(test_df):]

mse_prophet = mean_squared_error(y_true, y_pred)
mae_prophet = mean_absolute_error(y_true, y_pred)
rmse_prophet = np.sqrt(mse_prophet)

print(f"\nProphet model performance evaluation:")
print(f"MSE: {mse_prophet:.4f}")
print(f"MAE: {mae_prophet:.4f}")
print(f"RMSE: {rmse_prophet:.4f}")
```

## 🛠️ Practical Implementation

### 1. Environment Setup and Data Preparation

```python
# Required library installation
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

# Visualization settings
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")
```

### 2. Generate Complex Time Series Data

```python
def generate_complex_timeseries(n=1000, seed=42):
    """Generate complex time series data"""
    np.random.seed(seed)
    
    # Time index
    t = np.arange(n)
    
    # Trend (non-linear)
    trend = 0.1 * t + 0.001 * t**2 + 0.00001 * t**3
    
    # Seasonality (multiple periods)
    seasonality_1 = 10 * np.sin(2 * np.pi * t / 365)  # Yearly
    seasonality_2 = 5 * np.sin(2 * np.pi * t / 7)     # Weekly
    seasonality_3 = 2 * np.sin(2 * np.pi * t / 24)    # Daily
    
    # Structural change (pattern change in the middle)
    structural_change = np.where(t < n//2, 0, 5 * np.sin(2 * np.pi * t / 100))
    
    # Noise (increasing volatility over time)
    noise = np.random.normal(0, 1 + 0.01 * t, n)
    
    # Add outliers
    outliers = np.random.choice(n, size=n//50, replace=False)
    noise[outliers] += np.random.normal(0, 10, len(outliers))
    
    # Complete time series
    ts = trend + seasonality_1 + seasonality_2 + seasonality_3 + structural_change + noise
    
    return pd.Series(ts, index=pd.date_range('2020-01-01', periods=n, freq='D'))

# Generate complex time series
complex_ts = generate_complex_timeseries(1000)

# Visualization
plt.figure(figsize=(15, 10))

plt.subplot(3, 1, 1)
plt.plot(complex_ts.index, complex_ts.values, alpha=0.7)
plt.title('Complex Time Series Data')
plt.ylabel('Value')

plt.subplot(3, 1, 2)
plt.plot(complex_ts.index[:100], complex_ts.values[:100], alpha=0.7)
plt.title('First 100 Days Data (Zoomed)')
plt.ylabel('Value')

plt.subplot(3, 1, 3)
plt.plot(complex_ts.index[-100:], complex_ts.values[-100:], alpha=0.7)
plt.title('Last 100 Days Data (Zoomed)')
plt.ylabel('Value')

plt.tight_layout()
plt.show()
```

### 3. ARIMA Model Practice

```python
def arima_practice(timeseries):
    """ARIMA model practice"""
    print("=== ARIMA Model Practice ===\n")
    
    # 1. Stationarity test
    print("1. Stationarity test")
    check_stationarity(timeseries)
    
    # 2. Achieve stationarity through differencing
    print("\n2. Achieve stationarity through differencing")
    ts_diff = difference_series(timeseries)
    check_stationarity(ts_diff)
    
    # 3. ACF and PACF analysis
    print("\n3. ACF and PACF analysis")
    plot_correlation_functions(ts_diff, lags=50)
    
    # 4. ARIMA model fitting (try multiple parameters)
    print("\n4. ARIMA model fitting")
    best_aic = float('inf')
    best_order = None
    best_model = None
    
    # Parameter grid search
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
    
    print(f"\nBest model: ARIMA{best_order} (AIC: {best_aic:.2f})")
    
    # 5. Forecast with optimal model
    print("\n5. Forecast with optimal model")
    forecast_steps = 30
    forecast = best_model.forecast(steps=forecast_steps)
    
    # 6. Result visualization
    plt.figure(figsize=(15, 8))
    plt.plot(timeseries.index, timeseries.values, label='Original Data', alpha=0.7)
    plt.plot(forecast.index, forecast.values, label='Forecast', color='red', linewidth=2)
    plt.title(f'ARIMA{best_order} Model Forecast Results')
    plt.xlabel('Date')
    plt.ylabel('Value')
    plt.legend()
    plt.grid(True, alpha=0.3)
    plt.show()
    
    return best_model, forecast

# Execute ARIMA practice
arima_model, arima_forecast = arima_practice(complex_ts)
```

### 4. Prophet Model Practice

```python
def prophet_practice(timeseries):
    """Prophet model practice"""
    print("=== Prophet Model Practice ===\n")
    
    # 1. Prepare data for Prophet
    print("1. Prepare data for Prophet")
    df = pd.DataFrame({
        'ds': timeseries.index,
        'y': timeseries.values
    })
    
    # 2. Create and fit model
    print("2. Prophet model fitting")
    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=True,
        daily_seasonality=False,
        seasonality_mode='additive',
        changepoint_prior_scale=0.05,  # Trend change point sensitivity
        seasonality_prior_scale=10.0   # Seasonality strength
    )
    
    # Add holiday information (example)
    holidays = pd.DataFrame({
        'holiday': 'new_year',
        'ds': pd.to_datetime(['2020-01-01', '2021-01-01', '2022-01-01']),
        'lower_window': -1,
        'upper_window': 1,
    })
    model.add_country_holidays(country_name='US')  # Add US holidays
    
    model.fit(df)
    
    # 3. Future prediction
    print("3. Future prediction")
    future = model.make_future_dataframe(periods=30)
    forecast = model.predict(future)
    
    # 4. Forecast result visualization
    print("4. Forecast result visualization")
    fig1 = model.plot(forecast)
    plt.title('Prophet Model Forecast Results')
    plt.show()
    
    # 5. Component analysis
    print("5. Component analysis")
    fig2 = model.plot_components(forecast)
    plt.show()
    
    # 6. Trend change point analysis
    print("6. Trend change point analysis")
    changepoints = model.changepoints
    if len(changepoints) > 0:
        plt.figure(figsize=(15, 8))
        plt.plot(df['ds'], df['y'], label='Original Data', alpha=0.7)
        plt.plot(forecast['ds'], forecast['yhat'], label='Forecast', color='red', alpha=0.7)
        plt.vlines(changepoints, ymin=df['y'].min(), ymax=df['y'].max(), 
                  colors='green', linestyles='--', alpha=0.5, label='Change Points')
        plt.title('Prophet Model - Trend Change Points')
        plt.xlabel('Date')
        plt.ylabel('Value')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.show()
    
    return model, forecast

# Execute Prophet practice
prophet_model, prophet_forecast = prophet_practice(complex_ts)
```

### 5. Model Performance Comparison and Analysis

```python
def compare_models(timeseries, arima_forecast, prophet_forecast):
    """Compare ARIMA and Prophet model performance"""
    print("=== Model Performance Comparison ===\n")
    
    # Data splitting (training:validation = 8:2)
    train_size = int(len(timeseries) * 0.8)
    train = timeseries[:train_size]
    test = timeseries[train_size:]
    
    # ARIMA model refitting and validation
    print("1. ARIMA model validation")
    model_arima = ARIMA(train, order=(2, 1, 2))  # Use simple model
    fitted_arima = model_arima.fit()
    forecast_arima_test = fitted_arima.forecast(steps=len(test))
    
    # Prophet model refitting and validation
    print("2. Prophet model validation")
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
    
    # Calculate performance metrics
    def calculate_metrics(y_true, y_pred, model_name):
        mse = mean_squared_error(y_true, y_pred)
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mse)
        
        print(f"\n{model_name} Performance:")
        print(f"  MSE: {mse:.4f}")
        print(f"  MAE: {mae:.4f}")
        print(f"  RMSE: {rmse:.4f}")
        
        return mse, mae, rmse
    
    # ARIMA performance
    arima_metrics = calculate_metrics(test.values, forecast_arima_test.values, "ARIMA")
    
    # Prophet performance
    prophet_metrics = calculate_metrics(test.values, yhat_prophet, "Prophet")
    
    # Performance comparison visualization
    plt.figure(figsize=(15, 10))
    
    # Complete time series
    plt.subplot(2, 1, 1)
    plt.plot(timeseries.index, timeseries.values, label='Original Data', alpha=0.7)
    plt.plot(arima_forecast.index, arima_forecast.values, label='ARIMA Forecast', color='red', alpha=0.7)
    plt.plot(prophet_forecast['ds'], prophet_forecast['yhat'], label='Prophet Forecast', color='green', alpha=0.7)
    plt.axvline(x=test.index[0], color='black', linestyle='--', alpha=0.5, label='Validation Start')
    plt.title('Complete Time Series and Forecast Comparison')
    plt.xlabel('Date')
    plt.ylabel('Value')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    # Validation period zoom
    plt.subplot(2, 1, 2)
    plt.plot(test.index, test.values, label='Actual Values', alpha=0.7, linewidth=2)
    plt.plot(test.index, forecast_arima_test.values, label='ARIMA Forecast', color='red', alpha=0.7)
    plt.plot(test.index, yhat_prophet, label='Prophet Forecast', color='green', alpha=0.7)
    plt.title('Validation Period Forecast Comparison')
    plt.xlabel('Date')
    plt.ylabel('Value')
    plt.legend()
    plt.grid(True, alpha=0.3)
    
    plt.tight_layout()
    plt.show()
    
    # Performance summary table
    results_df = pd.DataFrame({
        'Model': ['ARIMA', 'Prophet'],
        'MSE': [arima_metrics[0], prophet_metrics[0]],
        'MAE': [arima_metrics[1], prophet_metrics[1]],
        'RMSE': [arima_metrics[2], prophet_metrics[2]]
    })
    
    print("\n=== Performance Comparison Summary ===")
    print(results_df.to_string(index=False))
    
    # Determine winner
    if arima_metrics[2] < prophet_metrics[2]:  # Based on RMSE
        print(f"\n🏆 ARIMA model shows better performance! (RMSE: {arima_metrics[2]:.4f})")
    else:
        print(f"\n🏆 Prophet model shows better performance! (RMSE: {prophet_metrics[2]:.4f})")

# Execute model comparison
compare_models(complex_ts, arima_forecast, prophet_forecast)
```

## 📊 Methodology Comparison

### ARIMA vs Prophet

| Characteristic | ARIMA | Prophet |
|----------------|-------|---------|
| **Application Range** | Linear time series | Non-linear time series |
| **Seasonality Handling** | Manual setting | Automatic detection |
| **Outlier Handling** | Sensitive | Robust |
| **Interpretability** | High | High |
| **Automation Level** | Low | High |
| **Computational Efficiency** | High | Medium |
| **Hyperparameters** | Manual tuning | Automatic optimization |

### When to Use Which Model?

#### **Use ARIMA when:**
- Time series with linear trends
- Clear seasonal patterns
- Fast prediction is needed
- Model interpretation is important

#### **Use Prophet when:**
- Complex seasonal patterns
- Special dates like holidays and events
- Automated modeling is needed
- Business time series data

## 🚀 Next Steps

Now let's move to **Part 2: Deep Learning-Based Time Series Forecasting** to learn more powerful time series forecasting models through N-BEATS and DeepAR!

### What We'll Cover in the Next Part

1. **Background of Deep Learning-Based Models**
2. **N-BEATS' Interpretable Block-Based Architecture**
3. **DeepAR's Probabilistic Forecasting and Uncertainty Quantification**
4. **Actual Model Implementation Using PyTorch**
5. **Performance Comparison with Traditional Methods**

---

*In this part, we covered the core of traditional statistical methods through ARIMA and Prophet. In the next part, experience more sophisticated time series forecasting utilizing the power of deep learning!* 🎯
