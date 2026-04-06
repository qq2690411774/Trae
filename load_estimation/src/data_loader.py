"""
数据加载模块
用于读取和处理Excel格式的电力负荷历史数据
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Optional, Tuple, List
import warnings

warnings.filterwarnings('ignore')


class DataLoader:
    """电力负荷数据加载器"""
    
    TIME_COLUMN_PATTERNS = ['timestamp', 'time', 'datetime', 'date', '时刻', '时间']
    LOAD_COLUMN_PATTERNS = ['load', 'value', 'power', 'consumption', '负荷', '用电量']
    
    def __init__(self):
        self.data: Optional[pd.DataFrame] = None
        self.file_path: Optional[Path] = None
        self.time_column: str = 'timestamp'
        self.load_column: str = 'load'
        
    def load_excel(
        self, 
        file_path: str, 
        time_col: Optional[str] = None, 
        load_col: Optional[str] = None,
        sheet_name: Optional[str] = 0
    ) -> pd.DataFrame:
        """
        加载Excel文件
        
        Args:
            file_path: Excel文件路径
            time_col: 时间列名，如果为None则自动识别
            load_col: 负荷列名，如果为None则自动识别
            sheet_name: 工作表名称或索引
            
        Returns:
            DataFrame: 加载的数据
        """
        self.file_path = Path(file_path)
        
        if not self.file_path.exists():
            raise FileNotFoundError(f"文件不存在: {file_path}")
        
        try:
            self.data = pd.read_excel(
                file_path, 
                sheet_name=sheet_name,
                parse_dates=False
            )
        except Exception as e:
            raise ValueError(f"读取Excel文件失败: {str(e)}")
        
        if self.data is None or self.data.empty:
            raise ValueError("Excel文件为空")
        
        self._identify_columns(time_col, load_col)
        self._process_data()
        
        return self.data
    
    def _identify_columns(
        self, 
        time_col: Optional[str] = None, 
        load_col: Optional[str] = None
    ):
        """自动识别时间列和负荷列"""
        columns = self.data.columns.tolist()
        
        if time_col is not None:
            if time_col not in columns:
                raise ValueError(f"指定的时间列 '{time_col}' 不存在，可用列: {columns}")
            self.time_column = time_col
        else:
            self.time_column = self._find_column(columns, self.TIME_COLUMN_PATTERNS)
            
        if load_col is not None:
            if load_col not in columns:
                raise ValueError(f"指定的负荷列 '{load_col}' 不存在，可用列: {columns}")
            self.load_column = load_col
        else:
            self.load_column = self._find_column(columns, self.LOAD_COLUMN_PATTERNS)
            
    def _find_column(self, columns: List[str], patterns: List[str]) -> str:
        """根据模式匹配查找列名"""
        for col in columns:
            for pattern in patterns:
                if pattern.lower() in col.lower():
                    return col
        return columns[0]
    
    def _process_data(self):
        """处理数据：类型转换、排序、设置索引"""
        self.data = self.data.copy()
        
        self.data[self.time_column] = pd.to_datetime(
            self.data[self.time_column], 
            errors='coerce'
        )
        
        self.data[self.load_column] = pd.to_numeric(
            self.data[self.load_column], 
            errors='coerce'
        )
        
        self.data = self.data.dropna(
            subset=[self.time_column, self.load_column]
        )
        
        if self.data[self.time_column].duplicated().any():
            self.data = self.data.drop_duplicates(
                subset=[self.time_column], 
                keep='first'
            )
        
        self.data = self.data.sort_values(by=self.time_column)
        self.data = self.data.reset_index(drop=True)
        
        self.data = self.data.set_index(self.time_column)
        
    def get_data(self) -> pd.DataFrame:
        """获取加载的数据"""
        if self.data is None:
            raise ValueError("请先调用 load_excel() 加载数据")
        return self.data.copy()
    
    def get_time_range(self) -> Tuple[pd.Timestamp, pd.Timestamp]:
        """获取数据的时间范围"""
        if self.data is None:
            raise ValueError("请先调用 load_excel() 加载数据")
        return self.data.index.min(), self.data.index.max()
    
    def get_statistics(self) -> dict:
        """获取数据统计信息"""
        if self.data is None:
            raise ValueError("请先调用 load_excel() 加载数据")
        
        load_series = self.data[self.load_column]
        
        return {
            '记录数': len(self.data),
            '起始时间': str(self.data.index.min()),
            '结束时间': str(self.data.index.max()),
            '缺失值数量': load_series.isna().sum(),
            '负荷最小值': load_series.min(),
            '负荷最大值': load_series.max(),
            '负荷平均值': load_series.mean(),
            '负荷中位数': load_series.median(),
            '负荷标准差': load_series.std(),
        }
    
    def resample(self, freq: str = '15T') -> pd.DataFrame:
        """
        重采样数据
        
        Args:
            freq: 重采样频率，如 '15T'(15分钟), '1H'(1小时), '1D'(1天)
            
        Returns:
            重采样后的数据
        """
        if self.data is None:
            raise ValueError("请先调用 load_excel() 加载数据")
        
        load_series = self.data[self.load_column]
        resampled = load_series.resample(freq).mean()
        resampled = resampled.interpolate(method='linear')
        
        result = pd.DataFrame({self.load_column: resampled})
        result.index.name = self.time_column
        
        return result
    
    def split_by_time(
        self, 
        train_ratio: float = 0.7, 
        val_ratio: float = 0.15
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
        """
        按时间顺序划分数据集
        
        Args:
            train_ratio: 训练集比例
            val_ratio: 验证集比例
            
        Returns:
            (训练集, 验证集, 测试集)
        """
        if self.data is None:
            raise ValueError("请先调用 load_excel() 加载数据")
        
        n = len(self.data)
        train_end = int(n * train_ratio)
        val_end = int(n * (train_ratio + val_ratio))
        
        train_data = self.data.iloc[:train_end].copy()
        val_data = self.data.iloc[train_end:val_end].copy()
        test_data = self.data.iloc[val_end:].copy()
        
        return train_data, val_data, test_data


def generate_sample_data(
    n_days: int = 365,
    start_date: str = '2023-01-01',
    freq: str = '1T'
) -> pd.DataFrame:
    """
    生成模拟电力负荷数据用于测试
    
    Args:
        n_days: 天数
        start_date: 起始日期
        freq: 采样频率
        
    Returns:
        模拟数据DataFrame
    """
    n_points = n_days * 1440 if freq == '1T' else n_days * 24
    
    date_range = pd.date_range(
        start=start_date, 
        periods=n_points, 
        freq=freq
    )
    
    n = len(date_range)
    hour = date_range.hour
    day_of_week = date_range.dayofweek
    
    base_load = 5000
    
    hourly_pattern = 1500 * np.sin(2 * np.pi * (hour - 6) / 24)
    weekly_pattern = 500 * np.sin(2 * np.pi * day_of_week / 7)
    
    daily_pattern = 800 * np.sin(2 * np.pi * np.arange(n) / 1440)
    
    noise = np.random.normal(0, 200, n)
    
    load = base_load + hourly_pattern + weekly_pattern + daily_pattern + noise
    
    load = np.maximum(load, 500)
    
    df = pd.DataFrame({
        'timestamp': date_range,
        'load': load
    })
    
    return df


if __name__ == '__main__':
    print("生成模拟数据...")
    df = generate_sample_data(n_days=30)
    print(f"生成 {len(df)} 条记录")
    print(df.head(10))
    print("\n数据统计:")
    print(df['load'].describe())
