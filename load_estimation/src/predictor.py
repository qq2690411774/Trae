"""
电力负荷预测器
整合数据加载、校验、特征工程和模型训练的统一接口
"""

import pandas as pd
import numpy as np
from typing import Optional, Tuple, Dict, List
import os

from .data_loader import DataLoader, generate_sample_data
from .data_validator import DataValidator
from .feature_engineering import FeatureEngineer
from .models.xgboost_model import XGBoostPredictor
from .models.lstm_model import LSTMPredictor


class LoadPredictor:
    """电力负荷预测器主类"""
    
    def __init__(
        self,
        model_type: str = 'xgboost',
        model_params: Optional[Dict] = None
    ):
        """
        初始化预测器
        
        Args:
            model_type: 模型类型 'xgboost' 或 'lstm'
            model_params: 模型参数
        """
        self.model_type = model_type.lower()
        self.model_params = model_params or {}
        
        self.data_loader = DataLoader()
        self.validator: Optional[DataValidator] = None
        self.feature_engineer: Optional[FeatureEngineer] = None
        self.model = None
        
        self.raw_data: Optional[pd.DataFrame] = None
        self.features_data: Optional[pd.DataFrame] = None
        
        self.X_train = None
        self.y_train = None
        self.X_val = None
        self.y_val = None
        self.X_test = None
        self.y_test = None
        
        self._init_model()
        
    def _init_model(self):
        """初始化模型"""
        if self.model_type == 'xgboost':
            self.model = XGBoostPredictor(self.model_params)
        elif self.model_type == 'lstm':
            self.model = LSTMPredictor(self.model_params)
        else:
            raise ValueError(f"不支持的模型类型: {self.model_type}")
    
    def load_data(
        self,
        file_path: str,
        validate: bool = True,
        fill_missing: bool = True,
        fill_method: str = 'linear'
    ) -> 'LoadPredictor':
        """
        加载数据
        
        Args:
            file_path: Excel文件路径
            validate: 是否进行数据校验
            fill_missing: 是否填充缺失值
            fill_method: 缺失值填充方法
            
        Returns:
            self
        """
        print(f"加载数据文件: {file_path}")
        
        self.raw_data = self.data_loader.load_excel(file_path)
        
        print(f"数据加载完成，共 {len(self.raw_data)} 条记录")
        
        if validate:
            self.validate_data()
            
        if fill_missing:
            self.fill_missing_values(method=fill_method)
            
        return self
    
    def validate_data(self) -> Dict:
        """
        验证数据
        
        Returns:
            验证报告
        """
        print("执行数据校验...")
        
        self.validator = DataValidator(self.raw_data)
        report = self.validator.validate()
        
        print(f"\n数据质量评分: {report['数据质量评分']}/100")
        
        return report
    
    def fill_missing_values(
        self,
        method: str = 'linear'
    ) -> 'LoadPredictor':
        """
        填充缺失值
        
        Args:
            method: 填充方法
            
        Returns:
            self
        """
        if self.validator is None:
            self.validator = DataValidator(self.raw_data)
            
        self.raw_data = self.validator.fill_missing_values(method=method)
        
        print(f"缺失值已使用 {method} 方法填充")
        
        return self
    
    def create_features(
        self,
        lag_features: Optional[List[int]] = None,
        rolling_windows: Optional[List[int]] = None
    ) -> 'LoadPredictor':
        """
        创建特征
        
        Args:
            lag_features: 滞后特征列表
            rolling_windows: 滚动窗口列表
            
        Returns:
            self
        """
        print("创建特征工程...")
        
        self.feature_engineer = FeatureEngineer(self.raw_data)
        self.features_data = self.feature_engineer.create_all_features(
            lag_features=lag_features,
            rolling_windows=rolling_windows
        )
        
        print(f"特征创建完成，共 {len(self.feature_engineer.get_features())} 个特征")
        
        return self
    
    def prepare_data(
        self,
        train_ratio: float = 0.7,
        val_ratio: float = 0.15
    ) -> 'LoadPredictor':
        """
        准备训练数据
        
        Args:
            train_ratio: 训练集比例
            val_ratio: 验证集比例
            
        Returns:
            self
        """
        if self.features_data is None:
            raise ValueError("请先调用 create_features() 创建特征")
            
        X, y = self.feature_engineer.get_X_y(self.features_data)
        
        n = len(X)
        train_end = int(n * train_ratio)
        val_end = int(n * (train_ratio + val_ratio))
        
        self.X_train = X[:train_end]
        self.y_train = y[:train_end]
        
        self.X_val = X[train_end:val_end]
        self.y_val = y[train_end:val_end]
        
        self.X_test = X[val_end:]
        self.y_test = y[val_end:]
        
        print(f"\n数据划分完成:")
        print(f"  训练集: {len(self.X_train)} 样本")
        print(f"  验证集: {len(self.X_val)} 样本")
        print(f"  测试集: {len(self.X_test)} 样本")
        
        return self
    
    def train(
        self,
        verbose: bool = True,
        save_model: Optional[str] = None
    ) -> 'LoadPredictor':
        """
        训练模型
        
        Args:
            verbose: 是否输出训练信息
            save_model: 模型保存路径
            
        Returns:
            self
        """
        if self.X_train is None:
            raise ValueError("请先调用 prepare_data() 准备训练数据")
            
        print(f"\n开始训练 {self.model_type.upper()} 模型...")
        
        if self.model_type == 'lstm':
            self.model.fit(
                self.X_train, self.y_train,
                self.X_val, self.y_val,
                verbose=verbose
            )
        else:
            self.model.fit(
                self.X_train, self.y_train,
                self.X_val, self.y_val,
                feature_names=self.feature_engineer.get_features(),
                verbose=verbose
            )
        
        if save_model:
            self.model.save(save_model)
            print(f"模型已保存至: {save_model}")
            
        return self
    
    def evaluate(self) -> Dict:
        """
        评估模型
        
        Returns:
            评估指标字典
        """
        if self.X_test is None:
            raise ValueError("请先准备测试数据")
            
        print("\n模型评估:")
        
        if self.model_type == 'lstm':
            X_test_seq, y_test_seq = self.model._create_sequences(
                self.X_test, 
                self.model.params['sequence_length']
            )
            metrics = self.model.evaluate(X_test_seq, y_test_seq)
        else:
            metrics = self.model.evaluate(self.X_test, self.y_test)
            
        print(f"  MAE:  {metrics['MAE']:.2f}")
        print(f"  RMSE: {metrics['RMSE']:.2f}")
        print(f"  MAPE: {metrics['MAPE']:.2f}%")
        print(f"  R²:   {metrics['R2']:.4f}")
        
        return metrics
    
    def predict(
        self,
        X: Optional[np.ndarray] = None,
        steps: int = 1
    ) -> np.ndarray:
        """
        预测
        
        Args:
            X: 输入特征，如果为None则使用测试集
            steps: 预测步数（仅多步预测时使用）
            
        Returns:
            预测数组
        """
        if self.model is None:
            raise ValueError("请先训练模型")
            
        if X is None:
            if self.X_test is None:
                raise ValueError("没有可用的测试数据")
            X = self.X_test[-1:] if self.model_type == 'lstm' else self.X_test
            
        if steps > 1:
            return self.predict_multi_step(steps)
            
        return self.model.predict(X)
    
    def predict_multi_step(
        self,
        steps: int,
        initial_data: Optional[pd.DataFrame] = None
    ) -> np.ndarray:
        """
        多步预测
        
        Args:
            steps: 预测步数
            initial_data: 初始数据
            
        Returns:
            预测数组
        """
        if self.model_type != 'xgboost':
            raise ValueError("多步预测目前仅支持XGBoost模型")
            
        if initial_data is None:
            initial_data = self.raw_data.tail(100)
            
        return self.model.predict_multi_step(
            initial_data,
            steps,
            self.feature_engineer
        )
    
    def get_feature_importance(self) -> pd.DataFrame:
        """
        获取特征重要性
        
        Returns:
            特征重要性DataFrame
        """
        if self.model_type != 'xgboost':
            raise ValueError("特征重要性仅XGBoost模型支持")
            
        return self.model.get_feature_importance()
    
    def save(self, filepath: str):
        """
        保存模型
        
        Args:
            filepath: 保存路径
        """
        self.model.save(filepath)
        
    def load(self, filepath: str):
        """
        加载模型
        
        Args:
            filepath: 模型路径
        """
        self.model.load(filepath)
        
    def get_pipeline_summary(self) -> str:
        """
        获取流程摘要
        
        Returns:
            摘要字符串
        """
        lines = []
        lines.append("=" * 50)
        lines.append("电力负荷预测系统 - 流程摘要")
        lines.append("=" * 50)
        
        lines.append(f"\n模型类型: {self.model_type.upper()}")
        
        if self.raw_data is not None:
            lines.append(f"\n数据信息:")
            lines.append(f"  记录数: {len(self.raw_data)}")
            lines.append(f"  时间范围: {self.raw_data.index.min()} 至 {self.raw_data.index.max()}")
            
        if self.features_data is not None:
            lines.append(f"\n特征信息:")
            lines.append(f"  特征数量: {len(self.feature_engineer.get_features())}")
            
        if self.X_train is not None:
            lines.append(f"\n数据集:")
            lines.append(f"  训练集: {len(self.X_train)} 样本")
            lines.append(f"  验证集: {len(self.X_val)} 样本")
            lines.append(f"  测试集: {len(self.X_test)} 样本")
            
        lines.append("\n" + "=" * 50)
        
        return "\n".join(lines)


def create_predictor(
    model_type: str = 'xgboost',
    data_path: Optional[str] = None,
    **kwargs
) -> LoadPredictor:
    """
    创建预测器的便捷函数
    
    Args:
        model_type: 模型类型
        data_path: 数据文件路径
        **kwargs: 其他参数
        
    Returns:
        LoadPredictor实例
    """
    predictor = LoadPredictor(model_type=model_type)
    
    if data_path:
        predictor.load_data(data_path)
        predictor.create_features()
        predictor.prepare_data()
        
    return predictor


if __name__ == '__main__':
    print("生成测试数据...")
    df = generate_sample_data(n_days=30)
    df.to_excel('data/sample_load_data.xlsx', index=False)
    print("测试数据已保存至 data/sample_load_data.xlsx")
    
    print("\n初始化预测器...")
    predictor = LoadPredictor(model_type='xgboost')
    
    print("\n加载数据...")
    predictor.load_data('data/sample_load_data.xlsx')
    
    print("\n创建特征...")
    predictor.create_features()
    
    print("\n准备数据...")
    predictor.prepare_data()
    
    print("\n训练模型...")
    predictor.train(verbose=True)
    
    print("\n评估模型...")
    metrics = predictor.evaluate()
    
    print("\n特征重要性 Top 10:")
    importance = predictor.get_feature_importance()
    print(importance.head(10))
    
    print("\n流程摘要:")
    print(predictor.get_pipeline_summary())
