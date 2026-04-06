"""
数据合理性校验模块
用于检测和报告电力负荷数据中的各种问题
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional
from scipy import stats
import warnings

warnings.filterwarnings('ignore')


class DataValidator:
    """电力负荷数据校验器"""
    
    def __init__(self, data: pd.DataFrame):
        self.data = data.copy()
        self.load_column = 'load' if 'load' in data.columns else data.columns[1]
        self.report: Dict = {}
        
    def validate(self) -> Dict:
        """
        执行完整的数据校验
        
        Returns:
            校验报告字典
        """
        self.report = {
            '基本信息': self._check_basic_info(),
            '完整性校验': self._check_completeness(),
            '时间连续性': self._check_time_continuity(),
            '数值范围': self._check_value_range(),
            '异常值检测': self._check_outliers(),
            '数据质量评分': 0.0
        }
        
        self.report['数据质量评分'] = self._calculate_quality_score()
        
        return self.report
    
    def _check_basic_info(self) -> Dict:
        """基本数据信息"""
        return {
            '记录数': len(self.data),
            '列数': len(self.data.columns),
            '列名': list(self.data.columns),
            '时间范围': f"{self.data.index.min()} 至 {self.data.index.max()}" if len(self.data) > 0 else "N/A",
            '数据类型': {col: str(dtype) for col, dtype in self.data.dtypes.items()}
        }
    
    def _check_completeness(self) -> Dict:
        """完整性校验"""
        result = {}
        
        missing_total = self.data.isna().sum().sum()
        missing_pct = (missing_total / (len(self.data) * len(self.data.columns))) * 100
        
        result['缺失值总数'] = missing_total
        result['缺失值比例(%)'] = round(missing_pct, 2)
        
        missing_by_col = self.data.isna().sum()
        result['各列缺失值'] = missing_by_col.to_dict()
        
        duplicates = self.data.index.duplicated().sum()
        result['重复时间点'] = duplicates
        
        return result
    
    def _check_time_continuity(self) -> Dict:
        """时间连续性检查"""
        result = {}
        
        if len(self.data) < 2:
            result['状态'] = '数据不足'
            return result
        
        time_diff = self.data.index.to_series().diff().dropna()
        
        expected_diff = time_diff.mode()[0] if len(time_diff.mode()) > 0 else pd.Timedelta(minutes=1)
        result['标准时间间隔'] = str(expected_diff)
        
        irregular_indices = time_diff[time_diff != expected_diff].index
        result['时间间隔异常点数量'] = len(irregular_indices)
        
        if len(irregular_indices) > 0:
            result['时间间隔异常比例(%)'] = round(len(irregular_indices) / len(time_diff) * 100, 2)
        
        gaps = time_diff[time_diff > expected_diff * 5]
        if len(gaps) > 0:
            result['大时间断点数'] = len(gaps)
        
        result['状态'] = '正常' if result.get('时间间隔异常点数量', 0) == 0 else '存在异常'
        
        return result
    
    def _check_value_range(self) -> Dict:
        """数值范围检查"""
        result = {}
        
        load = self.data[self.load_column]
        
        result['最小值'] = load.min()
        result['最大值'] = load.max()
        result['平均值'] = round(load.mean(), 2)
        result['中位数'] = round(load.median(), 2)
        result['标准差'] = round(load.std(), 2)
        
        negative_count = (load < 0).sum()
        result['负值数量'] = int(negative_count)
        
        zero_count = (load == 0).sum()
        result['零值数量'] = int(zero_count)
        
        if negative_count > 0:
            result['状态'] = '存在负值'
        elif zero_count > len(load) * 0.5:
            result['状态'] = '零值过多'
        else:
            result['状态'] = '正常'
            
        return result
    
    def _check_outliers(self) -> Dict:
        """异常值检测"""
        result = {}
        
        load = self.data[self.load_column]
        
        Q1 = load.quantile(0.25)
        Q3 = load.quantile(0.75)
        IQR = Q3 - Q1
        
        iqr_lower = Q1 - 1.5 * IQR
        iqr_upper = Q3 + 1.5 * IQR
        
        iqr_outliers = (load < iqr_lower) | (load > iqr_upper)
        result['IQR方法异常点数'] = int(iqr_outliers.sum())
        result['IQR异常比例(%)'] = round(iqr_outliers.sum() / len(load) * 100, 2)
        
        z_scores = np.abs(stats.zscore(load.dropna()))
        z_outliers = z_scores > 3
        result['Z-Score方法异常点数'] = int(z_outliers.sum())
        
        diff = load.diff().abs()
        threshold = load.rolling(window=10).mean() * 0.5
        sudden_changes = (diff > threshold) & (diff > load.mean() * 0.3)
        result['突变点数'] = int(sudden_changes.sum())
        
        if result['IQR方法异常点数'] > 0:
            result['状态'] = '存在异常值'
        else:
            result['状态'] = '正常'
            
        return result
    
    def _calculate_quality_score(self) -> float:
        """计算数据质量评分(0-100)"""
        score = 100.0
        
        if '完整性校验' in self.report:
            missing_pct = self.report['完整性校验'].get('缺失值比例(%)', 0)
            score -= missing_pct * 0.5
            
            dup_count = self.report['完整性校验'].get('重复时间点', 0)
            score -= (dup_count / len(self.data) * 100) * 0.3 if len(self.data) > 0 else 0
            
        if '时间连续性' in self.report:
            gap_pct = self.report['时间连续性'].get('时间间隔异常比例(%)', 0)
            score -= gap_pct * 0.3
            
        if '异常值检测' in self.report:
            outlier_pct = self.report['异常值检测'].get('IQR异常比例(%)', 0)
            score -= outlier_pct * 0.2
            
        if '数值范围' in self.report:
            negative = self.report['数值范围'].get('负值数量', 0)
            if negative > 0:
                score -= 10
                
        return max(0, round(score, 2))
    
    def get_outlier_indices(self, method: str = 'iqr') -> pd.Index:
        """
        获取异常值的索引
        
        Args:
            method: 'iqr' 或 'zscore'
            
        Returns:
            异常值索引
        """
        load = self.data[self.load_column]
        
        if method == 'iqr':
            Q1 = load.quantile(0.25)
            Q3 = load.quantile(0.75)
            IQR = Q3 - Q1
            lower = Q1 - 1.5 * IQR
            upper = Q3 + 1.5 * IQR
            return load[(load < lower) | (load > upper)].index
            
        elif method == 'zscore':
            z_scores = stats.zscore(load.dropna())
            return load[abs(z_scores) > 3].index
            
        return pd.Index([])
    
    def get_time_gaps(self, threshold_multiplier: float = 5) -> List[Dict]:
        """
        获取时间断点信息
        
        Args:
            threshold_multiplier: 断点阈值倍数
            
        Returns:
            断点列表
        """
        if len(self.data) < 2:
            return []
            
        time_diff = self.data.index.to_series().diff().dropna()
        expected_diff = time_diff.mode()[0] if len(time_diff.mode()) > 0 else pd.Timedelta(minutes=1)
        
        threshold = expected_diff * threshold_multiplier
        gaps = time_diff[time_diff > threshold]
        
        result = []
        for idx, diff in gaps.items():
            result.append({
                '时间点': str(idx),
                '间隔': str(diff)
            })
            
        return result
    
    def fill_missing_values(
        self, 
        method: str = 'linear',
        max_gap_size: Optional[int] = None
    ) -> pd.DataFrame:
        """
        填充缺失值
        
        Args:
            method: 填充方法 'linear', 'forward', 'backward', 'mean'
            max_gap_size: 最大填充间隔
            
        Returns:
            填充后的数据
        """
        data = self.data.copy()
        
        if method == 'linear':
            data[self.load_column] = data[self.load_column].interpolate(method='linear')
        elif method == 'forward':
            data[self.load_column] = data[self.load_column].fillna(method='ffill')
        elif method == 'backward':
            data[self.load_column] = data[self.load_column].fillna(method='bfill')
        elif method == 'mean':
            data[self.load_column] = data[self.load_column].fillna(data[self.load_column].mean())
            
        data[self.load_column] = data[self.load_column].fillna(method='ffill').fillna(method='bfill')
        
        return data
    
    def remove_outliers(
        self, 
        method: str = 'iqr',
        action: str = 'interpolate'
    ) -> pd.DataFrame:
        """
        处理异常值
        
        Args:
            method: 检测方法 'iqr' 或 'zscore'
            action: 处理方式 'remove', 'interpolate', 'clip'
            
        Returns:
            处理后的数据
        """
        data = self.data.copy()
        load = data[self.load_column]
        
        if method == 'iqr':
            Q1 = load.quantile(0.25)
            Q3 = load.quantile(0.75)
            IQR = Q3 - Q1
            lower = Q1 - 1.5 * IQR
            upper = Q3 + 1.5 * IQR
            outlier_mask = (load < lower) | (load > upper)
        else:
            z_scores = np.abs(stats.zscore(load))
            outlier_mask = z_scores > 3
            
        if action == 'remove':
            data = data[~outlier_mask]
        elif action == 'interpolate':
            data.loc[outlier_mask, self.load_column] = np.nan
            data[self.load_column] = data[self.load_column].interpolate(method='linear')
        elif action == 'clip':
            data.loc[load < lower, self.load_column] = lower
            data.loc[load > upper, self.load_column] = upper
            
        return data
    
    def generate_report(self) -> str:
        """
        生成格式化的校验报告
        
        Returns:
            报告字符串
        """
        if not self.report:
            self.validate()
            
        lines = []
        lines.append("=" * 60)
        lines.append("电力负荷数据校验报告")
        lines.append("=" * 60)
        
        for section, content in self.report.items():
            if section == '数据质量评分':
                lines.append(f"\n{section}: {content}/100")
                continue
                
            lines.append(f"\n{'=' * 20} {section} {'=' * 20}")
            
            if isinstance(content, dict):
                for key, value in content.items():
                    lines.append(f"  {key}: {value}")
            else:
                lines.append(f"  {content}")
                
        lines.append("\n" + "=" * 60)
        
        return "\n".join(lines)


def validate_excel_file(file_path: str) -> Dict:
    """
    便捷函数：直接验证Excel文件
    
    Args:
        file_path: Excel文件路径
        
    Returns:
        校验报告
    """
    from src.data_loader import DataLoader
    
    loader = DataLoader()
    data = loader.load_excel(file_path)
    
    validator = DataValidator(data)
    report = validator.validate()
    
    return report


if __name__ == '__main__':
    from src.data_loader import generate_sample_data
    
    print("生成测试数据...")
    df = generate_sample_data(n_days=30)
    
    print("创建数据加载器...")
    from src.data_loader import DataLoader
    loader = DataLoader()
    loader.data = df.set_index('timestamp')
    loader.load_column = 'load'
    
    print("执行数据校验...")
    validator = DataValidator(loader.data)
    report = validator.validate()
    
    print("\n" + "=" * 60)
    print("数据校验报告")
    print("=" * 60)
    
    for section, content in report.items():
        print(f"\n{section}:")
        if isinstance(content, dict):
            for key, value in content.items():
                print(f"  {key}: {value}")
        else:
            print(f"  {content}")
