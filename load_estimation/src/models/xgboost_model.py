"""
XGBoost预测模型
用于短期电力负荷预测
"""

import numpy as np
import pandas as pd
from typing import Optional, Tuple, Dict, Any
import xgboost as xgb
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import joblib
import os


class XGBoostPredictor:
    """XGBoost电力负荷预测器"""
    
    DEFAULT_PARAMS = {
        'n_estimators': 500,
        'max_depth': 6,
        'learning_rate': 0.05,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'min_child_weight': 3,
        'reg_alpha': 0.1,
        'reg_lambda': 1.0,
        'random_state': 42,
        'n_jobs': -1,
    }
    
    def __init__(self, params: Optional[Dict] = None):
        self.params = self.DEFAULT_PARAMS.copy()
        if params:
            self.params.update(params)
            
        self.model: Optional[xgb.XGBRegressor] = None
        self.feature_names: Optional[list] = None
        self.training_history: Dict = {}
        
    def fit(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        feature_names: Optional[list] = None,
        verbose: bool = True
    ) -> 'XGBoostPredictor':
        """
        训练XGBoost模型
        
        Args:
            X_train: 训练特征
            y_train: 训练目标
            X_val: 验证特征
            y_val: 验证目标
            feature_names: 特征名称列表
            verbose: 是否输出训练信息
            
        Returns:
            self
        """
        self.feature_names = feature_names
        
        eval_set = []
        if X_val is not None and y_val is not None:
            eval_set.append((X_val, y_val))
            
        self.model = xgb.XGBRegressor(**self.params)
        
        if eval_set:
            self.model.fit(
                X_train, y_train,
                eval_set=eval_set,
                verbose=verbose
            )
        else:
            self.model.fit(X_train, y_train)
            
        if verbose:
            self._print_training_info(y_train, X_train)
            
        return self
    
    def _print_training_info(self, y_train: np.ndarray, X_train: np.ndarray):
        """打印训练信息"""
        train_pred = self.model.predict(X_train)
        
        train_mae = mean_absolute_error(y_train, train_pred)
        train_rmse = np.sqrt(mean_squared_error(y_train, train_pred))
        
        print("\n" + "=" * 40)
        print("XGBoost 模型训练完成")
        print("=" * 40)
        print(f"训练集 MAE: {train_mae:.2f}")
        print(f"训练集 RMSE: {train_rmse:.2f}")
        print(f"特征数量: {X_train.shape[1]}")
        print(f"样本数量: {X_train.shape[0]}")
        
    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        预测负荷
        
        Args:
            X: 特征矩阵
            
        Returns:
            预测值数组
        """
        if self.model is None:
            raise ValueError("模型尚未训练，请先调用 fit() 方法")
            
        return self.model.predict(X)
    
    def predict_single_step(
        self, 
        last_values: np.ndarray,
        features: np.ndarray
    ) -> float:
        """
        单步预测
        
        Args:
            last_values: 历史负荷值
            features: 当前特征
            
        Returns:
            预测负荷值
        """
        if self.model is None:
            raise ValueError("模型尚未训练")
            
        X = features.reshape(1, -1)
        prediction = self.model.predict(X)[0]
        
        return max(0, prediction)
    
    def predict_multi_step(
        self,
        initial_data: pd.DataFrame,
        steps: int,
        feature_engineer
    ) -> np.ndarray:
        """
        多步预测(迭代预测)
        
        Args:
            initial_data: 初始数据
            steps: 预测步数
            feature_engineer: 特征工程器
            
        Returns:
            预测数组
        """
        predictions = []
        current_data = initial_data.copy()
        
        for step in range(steps):
            if hasattr(feature_engineer, 'create_all_features'):
                features_df = feature_engineer.create_all_features()
                
                if len(features_df) == 0:
                    raise ValueError("特征数据为空")
                    
                X = features_df.drop(columns=['load'], errors='ignore')
                if 'load' in X.columns:
                    X = X.drop(columns=['load'])
                    
                X = X.values
                
                pred = self.model.predict(X[-1:])
                predictions.append(pred[0])
                
                new_time = current_data.index[-1] + pd.Timedelta(minutes=1)
                new_row = pd.DataFrame({'load': [pred[0]]}, index=[new_time])
                current_data = pd.concat([current_data, new_row])
                
        return np.array(predictions)
    
    def evaluate(
        self,
        X: np.ndarray,
        y_true: np.ndarray
    ) -> Dict[str, float]:
        """
        评估模型性能
        
        Args:
            X: 特征矩阵
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
    
    def get_feature_importance(self) -> pd.DataFrame:
        """
        获取特征重要性
        
        Returns:
            特征重要性DataFrame
        """
        if self.model is None:
            raise ValueError("模型尚未训练")
            
        importance = self.model.feature_importances_
        
        if self.feature_names is None:
            feature_names = [f'feature_{i}' for i in range(len(importance))]
        else:
            feature_names = self.feature_names
            
        df = pd.DataFrame({
            'feature': feature_names,
            'importance': importance
        }).sort_values('importance', ascending=False)
        
        return df
    
    def save(self, filepath: str):
        """
        保存模型
        
        Args:
            filepath: 保存路径
        """
        if self.model is None:
            raise ValueError("模型尚未训练")
            
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        model_data = {
            'model': self.model,
            'params': self.params,
            'feature_names': self.feature_names
        }
        
        joblib.dump(model_data, filepath)
        
    def load(self, filepath: str):
        """
        加载模型
        
        Args:
            filepath: 模型路径
        """
        model_data = joblib.load(filepath)
        
        self.model = model_data['model']
        self.params = model_data['params']
        self.feature_names = model_data.get('feature_names')
        
    def tune_hyperparameters(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        param_grid: Optional[Dict] = None
    ) -> Dict:
        """
        超参数调优
        
        Args:
            X_train: 训练特征
            y_train: 训练目标
            X_val: 验证特征
            y_val: 验证目标
            param_grid: 参数网格
            
        Returns:
            最佳参数
        """
        if param_grid is None:
            param_grid = {
                'n_estimators': [100, 300, 500],
                'max_depth': [4, 6, 8],
                'learning_rate': [0.01, 0.05, 0.1],
                'subsample': [0.7, 0.8, 0.9]
            }
            
        best_score = float('inf')
        best_params = self.params.copy()
        
        from sklearn.model_selection import ParameterGrid
        
        for params in ParameterGrid(param_grid):
            model = xgb.XGBRegressor(**params, random_state=42, n_jobs=-1)
            model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
            
            y_pred = model.predict(X_val)
            score = mean_absolute_error(y_val, y_pred)
            
            if score < best_score:
                best_score = score
                best_params.update(params)
                
        self.params = best_params
        
        return best_params


class LoadXGBoostModel:
    """XGBoost模型包装类，提供更简洁的接口"""
    
    def __init__(self, model_path: Optional[str] = None):
        self.predictor = XGBoostPredictor()
        
        if model_path and os.path.exists(model_path):
            self.predictor.load(model_path)
            
    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: Optional[np.ndarray] = None,
        y_val: Optional[np.ndarray] = None,
        feature_names: Optional[list] = None,
        **kwargs
    ):
        """训练模型"""
        self.predictor.fit(X_train, y_train, X_val, y_val, feature_names, **kwargs)
        
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
    from src.data_loader import generate_sample_data
    from src.feature_engineering import FeatureEngineer
    from src.data_validator import DataValidator
    
    print("生成测试数据...")
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
    
    print("\n训练XGBoost模型...")
    predictor = XGBoostPredictor()
    predictor.fit(X_train, y_train, X_val, y_val, feature_names=engineer.get_features())
    
    print("\n模型评估...")
    metrics = predictor.evaluate(X_test, y_test)
    print(f"测试集 MAE: {metrics['MAE']:.2f}")
    print(f"测试集 RMSE: {metrics['RMSE']:.2f}")
    print(f"测试集 MAPE: {metrics['MAPE']:.2f}%")
    print(f"测试集 R2: {metrics['R2']:.4f}")
    
    print("\n特征重要性 Top 10:")
    importance_df = predictor.get_feature_importance()
    print(importance_df.head(10))
