---
layout: post
lang: en
title: "Part 3: Transformer-Based Time Series Forecasting Models"
description: "Explore state-of-the-art transformer-based time series forecasting models including Informer, Autoformer, FEDformer, and PatchTST with hands-on practice."
date: 2025-09-06
author: Data Droid
category: data-ai
tags: [time-series-forecasting, transformer, Informer, Autoformer, FEDformer, PatchTST, deep-learning, AI]
series: time-series-forecasting
series_order: 3
reading_time: 15
difficulty: intermediate
---

# Part 3: Transformer-Based Time Series Forecasting Models

Welcome to the third part of our time series forecasting series! In this installment, we'll explore how the revolutionary Transformer architecture, which transformed natural language processing, has been adapted for time series forecasting.

## 📚 Learning Objectives

By the end of this part, you will learn:

- The background and necessity of applying Transformers to time series forecasting
- Key characteristics of major models: Informer, Autoformer, FEDformer, PatchTST
- Strengths and weaknesses of each model and their application domains
- Hands-on practice with transformer-based time series forecasting using real data

## 🔍 Background: Why Transformers for Time Series?

### Limitations of Previous Methods

**RNN/LSTM Problems:**
- Sequential processing leading to long training times
- Difficulty learning long-term dependencies
- Inability to parallelize processing

**CNN Limitations:**
- Focus only on local patterns
- Difficulty capturing long-range dependencies

### Transformer Advantages

1. **Parallel Processing**: Process all time points simultaneously
2. **Long-range Dependencies**: Learn relationships in long sequences through self-attention
3. **Scalability**: Performance improvement with larger models and datasets

## 🚀 Major Transformer-Based Time Series Models

### 1. Informer (2021)

**Core Ideas:**
- ProbSparse Self-attention reduces complexity from O(L²) to O(L log L)
- Self-attention Distilling compresses information across layers
- Generative Decoder predicts long sequences at once

**Key Features:**
```python
# Informer's core structure
class Informer(nn.Module):
    def __init__(self, enc_in, dec_in, c_out, seq_len, label_len, out_len):
        super(Informer, self).__init__()
        self.enc_in = enc_in
        self.dec_in = dec_in
        self.c_out = c_out
        self.seq_len = seq_len
        self.label_len = label_len
        self.out_len = out_len
        
        # Uses ProbSparse Attention
        self.attn = ProbAttention(attention_dropout=0.1)
        
        # Encoder and Decoder
        self.encoder = Encoder(...)
        self.decoder = Decoder(...)
```

**Advantages:**
- Efficient on long sequences
- Excellent performance across diverse datasets

**Disadvantages:**
- Long training time due to complex structure
- Difficult hyperparameter tuning

### 2. Autoformer (2021)

**Core Ideas:**
- Auto-Correlation mechanism automatically learns periodicity in time series
- Decomposition Block separates trend and seasonality
- Series-wise Connection minimizes information loss

**Key Features:**
```python
# Autoformer's Auto-Correlation
class AutoCorrelation(nn.Module):
    def forward(self, queries, keys, values):
        # Calculate correlation to find periodicity in time series
        autocorr = self.autocorrelation(queries, keys)
        return self.value_projection(values) * autocorr
```

**Advantages:**
- Automatic learning of time series periodicity
- Improved interpretability through trend and seasonality decomposition

**Disadvantages:**
- Limited performance on data without periodicity
- Difficulty learning complex patterns

### 3. FEDformer (2022)

**Core Ideas:**
- Fourier Enhanced Decomposed Transformer
- Attention in frequency domain using FFT
- Model ensemble for performance improvement

**Key Features:**
```python
# FEDformer's Fourier Attention
class FourierAttention(nn.Module):
    def forward(self, x):
        # Transform to frequency domain using FFT
        x_freq = torch.fft.rfft(x, dim=-1)
        # Calculate attention in frequency domain
        attn_freq = self.frequency_attention(x_freq)
        # Inverse transform back to time domain
        return torch.fft.irfft(attn_freq, dim=-1)
```

**Advantages:**
- Efficient processing in frequency domain
- Can learn various periodic patterns

**Disadvantages:**
- FFT computation cost
- May not be suitable for real-time prediction

### 4. PatchTST (2023)

**Core Ideas:**
- Process time series in patch units
- Channel Independence for multivariate time series
- Simple structure with excellent performance

**Key Features:**
```python
# PatchTST's patch creation
def create_patch(x, patch_len, stride):
    # Split time series into patches
    patches = x.unfold(dim=-1, size=patch_len, step=stride)
    return patches.transpose(-1, -2)
```

**Advantages:**
- Simple and efficient structure
- Excellent performance on multivariate time series
- Fast training and inference

**Disadvantages:**
- Sensitive to patch size
- Limited on very long sequences

## 🛠️ Hands-on Practice: Stock Price Prediction with PatchTST

Now let's implement a PatchTST model using real data.

### 1. Data Preparation

```python
import torch
import torch.nn as nn
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import StandardScaler
from torch.utils.data import DataLoader, TensorDataset

# Generate stock data (use yfinance for real data)
def generate_stock_data(n_samples=1000, n_features=5):
    """Generate synthetic stock data"""
    np.random.seed(42)
    
    # Generate data with trend and seasonality
    t = np.linspace(0, 4*np.pi, n_samples)
    trend = 0.01 * t
    seasonal = 0.5 * np.sin(t) + 0.3 * np.sin(2*t)
    noise = 0.1 * np.random.randn(n_samples)
    
    # Generate multivariate time series
    data = np.zeros((n_samples, n_features))
    for i in range(n_features):
        data[:, i] = trend + seasonal + noise + i*0.1
    
    return pd.DataFrame(data, columns=[f'stock_{i+1}' for i in range(n_features)])

# Generate data
data = generate_stock_data()
print(f"Data shape: {data.shape}")
print(data.head())
```

### 2. PatchTST Model Implementation

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
        
        # Calculate number of patches
        self.num_patches = (seq_len - patch_len) // stride + 1
        
        # Input projection
        self.input_projection = nn.Linear(patch_len, d_model)
        
        # Positional encoding
        self.pos_encoding = nn.Parameter(torch.randn(1, self.num_patches, d_model))
        
        # Transformer encoder
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, 
            nhead=n_heads, 
            dim_feedforward=d_model*4,
            dropout=0.1,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=n_layers)
        
        # Output projection
        self.output_projection = nn.Linear(d_model, pred_len)
        
    def create_patches(self, x):
        """Split time series into patches"""
        # x: (batch_size, n_features, seq_len)
        batch_size, n_features, seq_len = x.shape
        
        # Create patches for each feature
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
        
        # Create patches
        patches = self.create_patches(x)  # (batch_size, n_features, num_patches, patch_len)
        
        # Process each feature independently (Channel Independence)
        outputs = []
        for i in range(n_features):
            feature_patches = patches[:, i, :, :]  # (batch_size, num_patches, patch_len)
            
            # Input projection
            projected = self.input_projection(feature_patches)  # (batch_size, num_patches, d_model)
            
            # Add positional encoding
            projected = projected + self.pos_encoding
            
            # Transformer encoder
            encoded = self.transformer(projected)  # (batch_size, num_patches, d_model)
            
            # Global average pooling
            pooled = encoded.mean(dim=1)  # (batch_size, d_model)
            
            # Output projection
            output = self.output_projection(pooled)  # (batch_size, pred_len)
            outputs.append(output)
        
        # Combine outputs from all features
        final_output = torch.stack(outputs, dim=1)  # (batch_size, n_features, pred_len)
        return final_output

# Model parameters
seq_len = 96      # Input sequence length
pred_len = 24     # Prediction length
patch_len = 16    # Patch length
stride = 8        # Stride
n_features = 5    # Number of features

model = PatchTST(
    seq_len=seq_len,
    pred_len=pred_len,
    patch_len=patch_len,
    stride=stride,
    n_features=n_features
)

print(f"Model parameters: {sum(p.numel() for p in model.parameters()):,}")
```

### 3. Data Preprocessing and Training

```python
def prepare_data(data, seq_len, pred_len, train_ratio=0.7, val_ratio=0.2):
    """Prepare data for training"""
    # Normalization
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(data)
    
    # Create sequences
    X, y = [], []
    for i in range(len(scaled_data) - seq_len - pred_len + 1):
        X.append(scaled_data[i:i+seq_len])
        y.append(scaled_data[i+seq_len:i+seq_len+pred_len])
    
    X = np.array(X)
    y = np.array(y)
    
    # Train/validation/test split
    n_train = int(len(X) * train_ratio)
    n_val = int(len(X) * val_ratio)
    
    X_train, y_train = X[:n_train], y[:n_train]
    X_val, y_val = X[n_train:n_train+n_val], y[n_train:n_train+n_val]
    X_test, y_test = X[n_train+n_val:], y[n_train+n_val:]
    
    return (X_train, y_train), (X_val, y_val), (X_test, y_test), scaler

# Prepare data
(X_train, y_train), (X_val, y_val), (X_test, y_test), scaler = prepare_data(
    data, seq_len, pred_len
)

print(f"Train data: {X_train.shape}, {y_train.shape}")
print(f"Validation data: {X_val.shape}, {y_val.shape}")
print(f"Test data: {X_test.shape}, {y_test.shape}")

# Create DataLoader
def create_dataloader(X, y, batch_size=32, shuffle=True):
    X_tensor = torch.FloatTensor(X).transpose(1, 2)  # (batch, features, seq_len)
    y_tensor = torch.FloatTensor(y).transpose(1, 2)  # (batch, features, pred_len)
    dataset = TensorDataset(X_tensor, y_tensor)
    return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)

train_loader = create_dataloader(X_train, y_train, batch_size=32)
val_loader = create_dataloader(X_val, y_val, batch_size=32, shuffle=False)
```

### 4. Model Training

```python
def train_model(model, train_loader, val_loader, epochs=50, lr=0.001):
    """Train the model"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = model.to(device)
    
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=lr)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, patience=5, factor=0.5)
    
    train_losses = []
    val_losses = []
    
    for epoch in range(epochs):
        # Training
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
        
        # Validation
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

# Train model
print("Starting model training...")
train_losses, val_losses = train_model(model, train_loader, val_loader, epochs=100)
print("Training completed!")
```

### 5. Results Visualization

```python
def plot_results(model, test_loader, scaler, n_samples=3):
    """Visualize results"""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.eval()
    
    with torch.no_grad():
        for i, (batch_X, batch_y) in enumerate(test_loader):
            if i >= n_samples:
                break
                
            batch_X, batch_y = batch_X.to(device), batch_y.to(device)
            predictions = model(batch_X)
            
            # Visualize only the first sample
            X_sample = batch_X[0].cpu().numpy().T  # (seq_len, n_features)
            y_true = batch_y[0].cpu().numpy().T    # (pred_len, n_features)
            y_pred = predictions[0].cpu().numpy().T # (pred_len, n_features)
            
            # Inverse normalization
            X_sample = scaler.inverse_transform(X_sample)
            y_true = scaler.inverse_transform(y_true)
            y_pred = scaler.inverse_transform(y_pred)
            
            # Visualization
            fig, axes = plt.subplots(2, 3, figsize=(15, 10))
            axes = axes.flatten()
            
            for j in range(min(5, n_features)):
                ax = axes[j]
                
                # Historical data
                ax.plot(range(seq_len), X_sample[:, j], 'b-', label='Past', linewidth=2)
                
                # Actual future
                future_x = range(seq_len, seq_len + pred_len)
                ax.plot(future_x, y_true[:, j], 'g-', label='Actual', linewidth=2)
                
                # Prediction
                ax.plot(future_x, y_pred[:, j], 'r--', label='Prediction', linewidth=2)
                
                ax.set_title(f'Stock {j+1}')
                ax.legend()
                ax.grid(True, alpha=0.3)
            
            # Hide last subplot
            if n_features < 6:
                axes[-1].set_visible(False)
            
            plt.tight_layout()
            plt.show()

# Visualize results
test_loader = create_dataloader(X_test, y_test, batch_size=1, shuffle=False)
plot_results(model, test_loader, scaler)

# Plot training curves
plt.figure(figsize=(12, 4))

plt.subplot(1, 2, 1)
plt.plot(train_losses, label='Train Loss', color='blue')
plt.plot(val_losses, label='Validation Loss', color='red')
plt.title('Training Curves')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.grid(True, alpha=0.3)

plt.subplot(1, 2, 2)
plt.plot(train_losses[-20:], label='Train Loss (Last 20)', color='blue')
plt.plot(val_losses[-20:], label='Validation Loss (Last 20)', color='red')
plt.title('Recent Training Curves')
plt.xlabel('Epoch')
plt.ylabel('Loss')
plt.legend()
plt.grid(True, alpha=0.3)

plt.tight_layout()
plt.show()
```

### 6. Performance Evaluation

```python
def evaluate_model(model, test_loader, scaler):
    """Evaluate model performance"""
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
    
    # Combine predictions and targets
    predictions = np.concatenate(all_predictions, axis=0)
    targets = np.concatenate(all_targets, axis=0)
    
    # Inverse normalization
    predictions = scaler.inverse_transform(predictions.transpose(0, 2, 1).reshape(-1, n_features))
    targets = scaler.inverse_transform(targets.transpose(0, 2, 1).reshape(-1, n_features))
    
    # Calculate MSE, MAE
    mse = np.mean((predictions - targets) ** 2)
    mae = np.mean(np.abs(predictions - targets))
    rmse = np.sqrt(mse)
    
    print(f"Test Performance:")
    print(f"MSE: {mse:.6f}")
    print(f"MAE: {mae:.6f}")
    print(f"RMSE: {rmse:.6f}")
    
    return mse, mae, rmse

# Evaluate performance
mse, mae, rmse = evaluate_model(model, test_loader, scaler)
```

## 📊 Model Comparison and Selection Guide

### Performance Comparison

| Model | Advantages | Disadvantages | Application Areas |
|-------|------------|---------------|-------------------|
| **Informer** | Efficient on long sequences, strong performance | Complex structure, long training time | Long-term prediction, large-scale data |
| **Autoformer** | Automatic periodicity learning, interpretable | Limited on non-periodic data | Seasonal data, business analysis |
| **FEDformer** | Frequency domain processing, ensemble | FFT computation cost | Signal processing, periodic data |
| **PatchTST** | Simple and efficient, fast training | Sensitive to patch size | Real-time prediction, multivariate time series |

### Model Selection Guide

**1. Based on Data Characteristics:**
- **Strongly periodic data**: Autoformer, FEDformer
- **Long sequence data**: Informer, PatchTST
- **Multivariate time series**: PatchTST, Informer
- **Real-time prediction**: PatchTST

**2. Based on Resource Constraints:**
- **Limited computational resources**: PatchTST
- **Sufficient resources**: Informer, FEDformer
- **Fast prototyping**: PatchTST

## 🎯 Next Steps

In this part, we explored transformer-based time series forecasting models. In the next parts:

- **Part 4**: Latest generative AI models (TimeGPT, Lag-Llama, Moirai, Chronos)
- **Part 5**: Practical application and MLOps (model deployment, monitoring, A/B testing)

## 💡 Key Takeaways

1. **Transformer Advantages**: Parallel processing, long-range dependency learning, scalability
2. **Model-specific Characteristics**: Each model has unique strengths and application areas
3. **Practical Considerations**: Consider data characteristics, resource constraints, and performance requirements comprehensively
4. **Importance of Practice**: Learn theory and code together to improve practical application skills

Transformer-based models present a new paradigm for time series forecasting. Join us in the next part to explore even more interesting cutting-edge models!

---

## 🔗 Series Navigation

**← Previous**: [Part 2: Deep Learning-based Time Series Forecasting - N-BEATS and DeepAR](/en_posts/2025-09-01-time-series-deep-learning.html)

**Next →**: [Part 4: Latest Generative AI Models - TimeGPT, Lag-Llama, Moirai, Chronos](/en_posts/2025-09-07-time-series-llm-models.html)

---

**Next Part Preview**: In Part 4, we'll explore how the latest generative AI models like TimeGPT and Lag-Llama are being utilized for time series forecasting. 🚀
