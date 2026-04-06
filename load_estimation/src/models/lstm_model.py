"""
LSTM预测模型
用于短期电力负荷预测
"""

import numpy as np
import pandas as pd
from typing import Optional, Tuple, Dict, Any
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import os
import warnings

warnings.filterwarnings('ignore')


class LSTMModel(nn.Module):
    """LSTM神经网络模型"""
    
    def __init__(
        self,
        input_dim: int,
        hidden_units: int = 64,
        num_layers: int = 2,
        dropout: float = 0.2,
        output_dim: int = 1
    ):
        super(LSTMModel, self).__init__()
        
        self.hidden_units = hidden_units
        self.num_layers = num_layers
        
        self.lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_units,
            num_layers=num_layers,
            batch_first=True,
            dropout=dropout if num_layers > 1 else 0
        )
        
        self.fc = nn.Sequential(
            nn.Linear(hidden_units, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, output_dim)
        )
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        lstm_out, _ = self.lstm(x)
        last_output = lstm_out[:, -1, :]
        output = self.fc(last_output)
        return output


class LSTMPredictor:
    """LSTM电力负荷预测器"""
    
    DEFAULT_PARAMS = {
        'hidden_units': 64,
        'num_layers': 2,
        'dropout': 0.2,
        'sequence_length': 60,
        'learning_rate': 0.001,
        'batch_size': 64,
        'epochs': 50,
        'early_stopping_patience': 10,
    }
    
    def __init__(self, params: Optional[Dict] = None):
        self.params = self.DEFAULT_PARAMS.copy()
        if params:
            self.params.update(params)
            
        self.model: Optional[LSTMModel] = None
        self.scaler: Optional[Any] = None
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.training_history: Dict = {
            'train_loss': [],
            'val_loss': []
        }
        
    def _create_sequences(
        self, 
        data: np.ndarray, 
        sequence_length: int
    ) -> Tuple[np.ndarray, np.ndarray]:
        """创建序列数据"""
        X, y = [], []
        
        for i in range(len(data) - sequence_length):
            X.append(data[i:i + sequence_length])
            y.append(data[i + sequence_length])
            
        return np.array(X), np.array(y)
    
    def _normalize_data(
        self,
        train_data: np.ndarray,
        val_data: Optional[np.ndarray] = None,
        test_data: Optional[np.ndarray] = None
    ):
        """归一化数据"""
        from sklearn.preprocessing import StandardScaler
        
        self.scaler = StandardScaler()
        
        train_reshaped = train_data.reshape(-1, train_data.shape[-1])
        self.scaler.fit(train_reshaped)
        
        train_normalized = self.scaler.transform(train_reshaped).reshape(train_data.shape)
        
        result = [train_normalized]
        
        if val_data is not None:
            val_reshaped = val_data.reshape(-1, val_data.shape[-1])
            val_normalized = self.scaler.transform(val_reshaped).reshape(val_data.shape)
            result.append(val_normalized)
            
        if test_data is not None:
            test_reshaped = test_data.reshape(-1, test_data.shape[-1])
            test_normalized = self.scaler.transform(test_reshaped).reshape(test_data.shape)
            result.append(test_normalized)
            
        return tuple(result)
    
    def fit(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        X_test: Optional[np.ndarray] = None,
        y_test: Optional[np.ndarray] = None,
        verbose: bool = True
    ) -> 'LSTMPredictor':
        """
        训练LSTM模型
        
        Args:
            X_train: 训练数据
            y_train: 训练目标
            X_val: 验证数据
            y_val: 验证目标
            X_test: 测试数据
            y_test: 测试目标
            verbose: 是否输出训练信息
            
        Returns:
            self
        """
        sequence_length = self.params['sequence_length']
        
        if len(X_train) < sequence_length + 1:
            raise ValueError(f"训练数据不足，需要至少 {sequence_length + 1} 个样本")
        
        if X_val is not None:
            combined_data = np.vstack([X_train, X_val])
        else:
            combined_data = X_train
            
        train_sequences, train_targets = self._create_sequences(
            X_train, sequence_length
        )
        
        if X_val is not None:
            val_sequences, val_targets = self._create_sequences(
                X_val, sequence_length
            )
        else:
            val_sequences, val_targets = None, None
            
        train_sequences, train_targets = self._normalize_sequence_data(
            train_sequences, train_targets
        )
        
        if val_sequences is not None:
            val_sequences, val_targets = self._normalize_sequence_data(
                val_sequences, val_targets
            )
        
        input_dim = train_sequences.shape[-1]
        
        self.model = LSTMModel(
            input_dim=input_dim,
            hidden_units=self.params['hidden_units'],
            num_layers=self.params['num_layers'],
            dropout=self.params['dropout']
        ).to(self.device)
        
        if verbose:
            print(f"\n模型设备: {self.device}")
            print(f"输入维度: {input_dim}")
            print(f"序列长度: {sequence_length}")
            print(f"训练样本数: {len(train_sequences)}")
        
        train_dataset = TensorDataset(
            torch.FloatTensor(train_sequences),
            torch.FloatTensor(train_targets)
        )
        
        train_loader = DataLoader(
            train_dataset, 
            batch_size=self.params['batch_size'],
            shuffle=True
        )
        
        criterion = nn.MSELoss()
        optimizer = torch.optim.Adam(
            self.model.parameters(), 
            lr=self.params['learning_rate']
        )
        
        patience_counter = 0
        best_val_loss = float('inf')
        
        for epoch in range(self.params['epochs']):
            self.model.train()
            train_loss = 0.0
            
            for batch_X, batch_y in train_loader:
                batch_X = batch_X.to(self.device)
                batch_y = batch_y.to(self.device)
                
                optimizer.zero_grad()
                outputs = self.model(batch_X)
                loss = criterion(outputs.squeeze(), batch_y)
                loss.backward()
                optimizer.step()
                
                train_loss += loss.item()
            
            train_loss /= len(train_loader)
            self.training_history['train_loss'].append(train_loss)
            
            if val_sequences is not None:
                self.model.eval()
                with torch.no_grad():
                    val_X = torch.FloatTensor(val_sequences).to(self.device)
                    val_y = torch.FloatTensor(val_targets).to(self.device)
                    
                    val_outputs = self.model(val_X)
                    val_loss = criterion(val_outputs.squeeze(), val_y).item()
                    
                self.training_history['val_loss'].append(val_loss)
                
                if val_loss < best_val_loss:
                    best_val_loss = val_loss
                    patience_counter = 0
                    self.best_model_state = self.model.state_dict().copy()
                else:
                    patience_counter += 1
                    
                if verbose and (epoch + 1) % 10 == 0:
                    print(f"Epoch {epoch+1}/{self.params['epochs']} - Train Loss: {train_loss:.4f}, Val Loss: {val_loss:.4f}")
                    
                if patience_counter >= self.params['early_stopping_patience']:
                    if verbose:
                        print(f"\n早停: 连续{self.params['early_stopping_patience']}个epoch验证集损失未下降")
                    break
            else:
                if verbose and (epoch + 1) % 10 == 0:
                    print(f"Epoch {epoch+1}/{self.params['epochs']} - Train Loss: {train_loss:.4f}")
        
        if val_sequences is not None and hasattr(self, 'best_model_state'):
            self.model.load_state_dict(self.best_model_state)
            
        if verbose:
            print("\n" + "=" * 40)
            print("LSTM 模型训练完成")
            print("=" * 40)
            
        return self
    
    def _normalize_sequence_data(
        self, 
        sequences: np.ndarray, 
        targets: np.ndarray
    ) -> Tuple[np.ndarray, np.ndarray]:
        """归一化序列数据"""
        n_samples, seq_len, n_features = sequences.shape
        
        sequences_flat = sequences.reshape(-1, n_features)
        
        if self.scaler is None:
            from sklearn.preprocessing import StandardScaler
            self.scaler = StandardScaler()
            sequences_flat = self.scaler.fit_transform(sequences_flat)
        else:
            sequences_flat = self.scaler.transform(sequences_flat)
            
        sequences_normalized = sequences_flat.reshape(n_samples, seq_len, n_features)
        
        if self.scaler_target is None:
            from sklearn.preprocessing import StandardScaler
            self.scaler_target = StandardScaler()
            targets_normalized = self.scaler_target.fit_transform(targets.reshape(-1, 1)).flatten()
        else:
            targets_normalized = self.scaler_target.transform(targets.reshape(-1, 1)).flatten()
            
        return sequences_normalized, targets_normalized
    
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        预测负荷
        
        Args:
            X: 输入数据
            
        Returns:
            预测值数组
        """
        if self.model is None:
            raise ValueError("模型尚未训练，请先调用 fit() 方法")
            
        self.model.eval()
        
        X = np.array(X)
        
        if len(X.shape) == 2:
            X = X.reshape(1, X.shape[0], X.shape[1])
            
        with torch.no_grad():
            X_tensor = torch.FloatTensor(X).to(self.device)
            predictions = self.model(X_tensor).cpu().numpy()
            
        if hasattr(self, 'scaler_target') and self.scaler_target is not None:
            predictions = self.scaler_target.inverse_transform(
                predictions.reshape(-1, 1)
            ).flatten()
            
        return predictions
    
    def predict_single_step(
        self,
        last_sequence: np.ndarray
    ) -> float:
        """
        单步预测
        
        Args:
            last_sequence: 最后一个序列
            
        Returns:
            预测值
        """
        predictions = self.predict(last_sequence)
        return float(predictions[0])
    
    def predict_multi_step(
        self,
        initial_sequence: np.ndarray,
        steps: int
    ) -> np.ndarray:
        """
        多步预测
        
        Args:
            initial_sequence: 初始序列
            steps: 预测步数
            
        Returns:
            预测数组
        """
        predictions = []
        current_sequence = initial_sequence.copy()
        
        for _ in range(steps):
            pred = self.predict(current_sequence)
            predictions.append(pred[0])
            
            current_sequence = np.roll(current_sequence, -1, axis=0)
            current_sequence[-1] = pred[0]
            
        return np.array(predictions)
    
    def evaluate(
        self,
        X: np.ndarray,
        y_true: np.ndarray
    ) -> Dict[str, float]:
        """
        评估模型性能
        
        Args:
            X: 输入数据
            y_true: 真实值
            
        Returns:
            评估指标字典
        """
        y_pred = self.predict(X)
        
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        
        mape = np.mean(np.abs((y_true - y_pred) / y_true)) * 100
        
        r2 = r2_score(y_true, y_pred)
        
        return {
            'MAE': mae,
            'RMSE': rmse,
            'MAPE': mape,
            'R2': r2
        }
    
    def save(self, filepath: str):
        """
        保存模型
        
        Args:
            filepath: 保存路径
        """
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        torch.save({
            'model_state_dict': self.model.state_dict(),
            'params': self.params,
            'scaler_mean': self.scaler.mean_ if self.scaler else None,
            'scaler_scale': self.scaler.scale_ if self.scaler else None,
        }, filepath)
        
    def load(self, filepath: str):
        """
        加载模型
        
        Args:
            filepath: 模型路径
        """
        checkpoint = torch.load(filepath, map_location=self.device)
        
        self.params = checkpoint['params']
        
        input_dim = 1
        self.model = LSTMModel(
            input_dim=input_dim,
            hidden_units=self.params['hidden_units'],
            num_layers=self.params['num_layers'],
            dropout=self.params['dropout']
        ).to(self.device)
        
        self.model.load_state_dict(checkpoint['model_state_dict'])


class LoadLSTMModel:
    """LSTM模型包装类，提供更简洁的接口"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.predictor = LSTMPredictor()
        
        if model_path and os.path.exists(model_path):
            self.predictor.load(model_path)
            
    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        **kwargs
    ):
        """训练模型"""
        self.predictor.fit(X_train, y_train, X_val, y_val, **kwargs)
        
    def predict(self, X: np.ndarray) -> np.ndarray:
        """预测"""
        return self.predictor.predict(X)
    
    def evaluate(self, X: np.ndarray, y_true: np.ndarray) -> Dict:
        """评估"""
        return self.predictor.evaluate(X, y_true)
    
    def save(self, filepath: str):
        """保存"""
        self.predictor.save(filepath)
        
    def load(self, filepath: str):
        """加载"""
        self.predictor.load(filepath)


if __name__ == '__main__':
    print("生成测试数据...")
    from src.data_loader import generate_sample_data
    from src.feature_engineering import FeatureEngineer
    from src.data_validator import DataValidator
    
    df = generate_sample_data(n_days=30)
    df = df.set_index('timestamp')
    
    print("数据校验...")
    validator = DataValidator(df)
    validator.validate()
    
    print("特征工程...")
    engineer = FeatureEngineer(df)
    features_df = engineer.create_all_features()
    
    X, y = engineer.get_X_y(features_df)
    
    train_size = int(len(X) * 0.7)
    val_size = int(len(X) * 0.15)
    
    X_train, X_val, X_test = X[:train_size], X[train_size:train_size+val_size], X[train_size+val_size:]
    y_train, y_val, y_test = y[:train_size], y[train_size:train_size+val_size], y[train_size+val_size:]
    
    print(f"训练集: {X_train.shape}, 验证集: {X_val.shape}, 测试集: {X_test.shape}")
    
    print("\n训练LSTM模型...")
    predictor = LSTMPredictor({
        'sequence_length': 30,
        'epochs': 20,
        'batch_size': 32
    })
    predictor.fit(X_train, y_train, X_val, y_val, verbose=True)
    
    print("\n模型评估...")
    X_test_seq, y_test_seq = predictor._create_sequences(X_test, 30)
    metrics = predictor.evaluate(X_test_seq, y_test_seq)
    print(f"测试集 MAE: {metrics['MAE']:.2f}")
    print(f"测试集 RMSE: {metrics['RMSE']:.2f}")
    print(f"测试集 MAPE: {metrics['MAPE']:.2f}%")
    print(f"测试集 R2: {metrics['R2']:.4f}")
