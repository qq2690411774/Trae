"""
特征工程模块
用于生成电力负荷预测所需的时间特征、滞后特征和滚动统计特征
"""

import pandas as pd
import numpy as np
from typing import List, Optional, Dict, Tuple
from sklearn.preprocessing import StandardScaler, MinMaxScaler


class FeatureEngineer:
    """电力负荷特征工程"""
    
    def __init__(self, data: pd.DataFrame):
        self.data = data.copy()
        self.load_column = 'load' if 'load' in data.columns else data.columns[1]
        self.feature_columns: List[str] = []
        self.scaler: Optional[StandardScaler] = None
        self.scaler_params: Dict = {}
        
    def create_all_features(
        self,
        lag_features: List[int] = None,
        rolling_windows: List[int] = None,
        include_time_features: bool = True,
        include_cyclic_features: bool = True,
        include_rolling_stats: bool = True
    ) -> pd.DataFrame:
        """
        创建所有特征
        
        Args:
            lag_features: 滞后特征列表
            rolling_windows: 滚动窗口大小列表
            include_time_features: 是否包含时间特征
            include_cyclic_features: 是否包含周期性特征
            include_rolling_stats: 是否包含滚动统计特征
            
        Returns:
            包含特征的DataFrame
        """
        if lag_features is None:
            lag_features = [1, 5, 15, 30, 60, 1440]
            
        if rolling_windows is None:
            rolling_windows = [15, 60, 1440]
            
        df = self.data.copy()
        
        if include_time_features:
            df = self._add_time_features(df)
            
        if include_cyclic_features:
            df = self._add_cyclic_features(df)
            
        if include_rolling_stats:
            df = self._add_rolling_features(df, rolling_windows)
            
        df = self._add_lag_features(df, lag_features)
        
        df = df.dropna()
        
        self._extract_feature_columns(df)
        
        return df
    
    def _add_time_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """添加时间特征"""
        df = df.copy()
        
        df['hour'] = df.index.hour
        df['day_of_week'] = df.index.dayofweek
        df['day_of_month'] = df.index.day
        df['month'] = df.index.month
        df['year'] = df.index.year
        df['week_of_year'] = df.index.isocalendar().week.astype(int)
        df['quarter'] = df.index.quarter
        
        df['is_weekend'] = (df.index.dayofweek >= 5).astype(int)
        
        df['minute_of_day'] = df.index.hour * 60 + df.index.minute
        
        df['is_working_hour'] = ((df['hour'] >= 8) & (df['hour'] <= 18) & (df['is_weekend'] == 0)).astype(int)
        
        return df
    
    def _add_cyclic_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """添加周期性特征(正弦/余弦编码)"""
        df = df.copy()
        
        df['hour_sin'] = np.sin(2 * np.pi * df['hour'] / 24)
        df['hour_cos'] = np.cos(2 * np.pi * df['hour'] / 24)
        
        df['day_of_week_sin'] = np.sin(2 * np.pi * df['day_of_week'] / 7)
        df['day_of_week_cos'] = np.cos(2 * np.pi * df['day_of_week'] / 7)
        
        df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
        df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
        
        df['minute_of_day_sin'] = np.sin(2 * np.pi * df['minute_of_day'] / 1440)
        df['minute_of_day_cos'] = np.cos(2 * np.pi * df['minute_of_day'] / 1440)
        
        df['day_of_year_sin'] = np.sin(2 * np.pi * df.index.dayofyear / 365)
        df['day_of_year_cos'] = np.cos(2 * np.pi * df.index.dayofyear / 365)
        
        return df
    
    def _add_rolling_features(
        self, 
        df: pd.DataFrame, 
        windows: List[int]
    ) -> pd.DataFrame:
        """添加滚动统计特征"""
        df = df.copy()
        
        for window in windows:
            df[f'rolling_mean_{window}'] = df[self.load_column].rolling(
                window=window, min_periods=1
            ).mean()
            
            df[f'rolling_std_{window}'] = df[self.load_column].rolling(
                window=window, min_periods=1
            ).std().fillna(0)
            
            df[f'rolling_min_{window}'] = df[self.load_column].rolling(
                window=window, min_periods=1
            ).min()
            
            df[f'rolling_max_{window}'] = df[self.load_column].rolling(
                window=window, min_periods=1
            ).max()
            
        return df
    
    def _add_lag_features(
        self, 
        df: pd.DataFrame, 
        lags: List[int]
    ) -> pd.DataFrame:
        """添加滞后特征"""
        df = df.copy()
        
        for lag in lags:
            df[f'lag_{lag}'] = df[self.load_column].shift(lag)
            
        df['load_diff_1'] = df[self.load_column].diff(1)
        df['load_diff_5'] = df[self.load_column].diff(5)
        df['load_diff_15'] = df[self.load_column].diff(15)
        df['load_diff_60'] = df[self.load_column].diff(60)
        
        return df
    
    def _extract_feature_columns(self, df: pd.DataFrame):
        """提取特征列名"""
        exclude_cols = [self.load_column]
        self.feature_columns = [
            col for col in df.columns 
            if col not in exclude_cols and df[col].dtype in ['int64', 'float64']
        ]
        
    def get_features(self) -> List[str]:
        """获取特征列名"""
        return self.feature_columns
    
    def get_X_y(
        self, 
        data: pd.DataFrame,
        target_column: Optional[str] = None
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        获取特征矩阵和目标向量
        
        Args:
            data: 特征数据
            target_column: 目标列名
            
        Returns:
            (X, y) 特征矩阵和目标向量
        """
        if target_column is None:
            target_column = self.load_column
            
        feature_cols = [col for col in self.feature_columns if col in data.columns]
        
        X = data[feature_cols].values
        y = data[target_column].values
        
        return X, y
    
    def scale_features(
        self, 
        X_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        X_test: Optional[np.ndarray] = None,
        method: str = 'standard'
    ) -> Tuple:
        """
        特征标准化
        
        Args:
            X_train: 训练集特征
            X_val: 验证集特征
            X_test: 测试集特征
            method: 标准化方法 'standard' 或 'minmax'
            
        Returns:
            标准化后的特征数组元组
        """
        if method == 'standard':
            self.scaler = StandardScaler()
        else:
            self.scaler = MinMaxScaler()
            
        X_train_scaled = self.scaler.fit_transform(X_train)
        
        self.scaler_params = {
            'method': method,
            'mean': self.scaler.mean_.tolist() if hasattr(self.scaler, 'mean_') else None,
            'std': self.scaler.scale_.tolist() if hasattr(self.scaler, 'scale_') else None,
            'min': self.scaler.data_min_.tolist() if hasattr(self.scaler, 'data_min_') else None,
            'max': self.scaler.data_max_.tolist() if hasattr(self.scaler, 'data_max_') else None,
        }
        
        result = (X_train_scaled,)
        
        if X_val is not None:
            X_val_scaled = self.scaler.transform(X_val)
            result = result + (X_val_scaled,)
            
        if X_test is not None:
            X_test_scaled = self.scaler.transform(X_test)
            result = result + (X_test_scaled,)
            
        return result
    
    def create_sequences(
        self, 
        data: np.ndarray, 
        sequence_length: int = 60
    ) -> Tuple[np.ndarray, np.ndarray]:
        """
        为LSTM创建序列数据
        
        Args:
            data: 输入数据
            sequence_length: 序列长度
            
        Returns:
            (X, y) 序列数据
        """
        X, y = [], []
        
        for i in range(len(data) - sequence_length):
            X.append(data[i:i + sequence_length])
            y.append(data[i + sequence_length])
            
        return np.array(X), np.array(y)
    
    def get_feature_importance(
        self, 
        model, 
        feature_names: Optional[List[str]] = None
    ) -> pd.DataFrame:
        """
        获取特征重要性
        
        Args:
            model: 训练好的模型
            feature_names: 特征名称列表
            
        Returns:
            特征重要性DataFrame
        """
        if feature_names is None:
            feature_names = self.feature_columns
            
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
        else:
            return pd.DataFrame()
            
        df = pd.DataFrame({
            'feature': feature_names,
            'importance': importances
        }).sort_values('importance', ascending=False)
        
        return df
    
    def get_period_statistics(self, data: pd.DataFrame) -> Dict:
        """
        获取周期统计特征
        
        Args:
            data: 输入数据
            
        Returns:
            统计特征字典
        """
        stats = {}
        
        for period in ['hour', 'day_of_week', 'month']:
            if period in data.columns:
                group = data.groupby(period)[self.load_column]
                stats[f'{period}_mean'] = group.mean().to_dict()
                stats[f'{period}_std'] = group.std().to_dict()
                
        return stats
    
    def add_period_features(
        self, 
        data: pd.DataFrame, 
        period_stats: Dict
    ) -> pd.DataFrame:
        """
        添加周期统计特征
        
        Args:
            data: 输入数据
            period_stats: 周期统计字典
            
        Returns:
            添加特征后的数据
        """
        df = data.copy()
        
        for period in ['hour', 'day_of_week', 'month']:
            if f'{period}_mean' in period_stats:
                col_name = f'{period}_mean_load'
                if period == 'hour':
                    df[col_name] = df['hour'].map(period_stats[f'{period}_mean'])
                elif period == 'day_of_week':
                    df[col_name] = df['day_of_week'].map(period_stats[f'{period}_mean'])
                elif period == 'month':
                    df[col_name] = df['month'].map(period_stats[f'{period}_mean'])
                    
        return df


def create_features_from_raw(
    data: pd.DataFrame,
    lag_features: List[int] = None,
    rolling_windows: List[int] = None
) -> pd.DataFrame:
    """
    便捷函数：从原始数据创建所有特征
    
    Args:
        data: 原始数据
        lag_features: 滞后特征列表
        rolling_windows: 滚动窗口列表
        
    Returns:
        特征数据
    """
    engineer = FeatureEngineer(data)
    return engineer.create_all_features(
        lag_features=lag_features,
        rolling_windows=rolling_windows
    )


if __name__ == '__main__':
    from src.data_loader import generate_sample_data
    
    print("生成测试数据...")
    df = generate_sample_data(n_days=30)
    df = df.set_index('timestamp')
    
    print("创建特征工程...")
    engineer = FeatureEngineer(df)
    
    print("生成特征...")
    features_df = engineer.create_all_features()
    
    print(f"\n特征数量: {len(engineer.get_features())}")
    print(f"特征列: {engineer.get_features()[:10]}...")
    print(f"\n数据形状: {features_df.shape}")
    print(f"\n特征数据前5行:\n{features_df.head()}")
