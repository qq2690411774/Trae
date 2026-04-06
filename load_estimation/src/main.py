"""
电力负荷预测系统 - 主程序
提供命令行接口用于训练和预测
"""

import argparse
import os
import sys
import pandas as pd
import numpy as np

from src.data_loader import DataLoader, generate_sample_data
from src.data_validator import DataValidator
from src.feature_engineering import FeatureEngineer
from src.models.xgboost_model import XGBoostPredictor
from src.models.lstm_model import LSTMPredictor
from src.predictor import LoadPredictor


def generate_sample_command(args):
    """生成示例数据"""
    print("生成示例数据...")
    
    n_days = args.days
    output_path = args.output
    
    df = generate_sample_data(n_days=n_days)
    df.to_excel(output_path, index=False)
    
    print(f"示例数据已生成: {output_path}")
    print(f"记录数: {len(df)}")
    print(f"时间范围: {df['timestamp'].min()} 至 {df['timestamp'].max()}")
    
    return df


def validate_command(args):
    """数据校验命令"""
    print(f"校验数据文件: {args.input}")
    
    loader = DataLoader()
    data = loader.load_excel(args.input)
    
    validator = DataValidator(data)
    report = validator.validate()
    
    print("\n" + validator.generate_report())
    
    return report


def train_command(args):
    """训练模型命令"""
    print("=" * 60)
    print("电力负荷预测系统 - 训练模式")
    print("=" * 60)
    
    predictor = LoadPredictor(
        model_type=args.model,
        model_params={'n_estimators': args.estimators, 'max_depth': args.depth}
    )
    
    predictor.load_data(args.input, validate=not args.no_validate)
    
    if args.no_validate:
        predictor.fill_missing_values()
        
    predictor.create_features()
    
    predictor.prepare_data(
        train_ratio=args.train_ratio,
        val_ratio=args.val_ratio
    )
    
    predictor.train(
        verbose=args.verbose,
        save_model=args.save_model
    )
    
    metrics = predictor.evaluate()
    
    print("\n" + predictor.get_pipeline_summary())
    
    if args.save_model:
        print(f"\n模型已保存: {args.save_model}")
        
    return predictor, metrics


def predict_command(args):
    """预测命令"""
    print("=" * 60)
    print("电力负荷预测系统 - 预测模式")
    print("=" * 60)
    
    if not args.model_path:
        print("错误: 需要指定模型路径 (--model-path)")
        return None
        
    predictor = LoadPredictor(model_type=args.model)
    
    predictor.load(args.model_path)
    
    print(f"模型已加载: {args.model_path}")
    
    if args.test_data:
        test_data = pd.read_excel(args.test_data)
        
        loader = DataLoader()
        loader.data = test_data.set_index('timestamp')
        
        engineer = FeatureEngineer(loader.data)
        features_df = engineer.create_all_features()
        
        X, y = engineer.get_X_y(features_data)
        
        predictions = predictor.predict(X)
        
        results = pd.DataFrame({
            'actual': y,
            'predicted': predictions
        })
        
        results.to_excel(args.output, index=False)
        
        print(f"\n预测结果已保存: {args.output}")
        print(f"预测样本数: {len(predictions)}")
        
    elif args.steps:
        predictions = predictor.predict(steps=args.steps)
        
        print(f"\n未来 {args.steps} 步预测:")
        for i, pred in enumerate(predictions[:10]):
            print(f"  步骤 {i+1}: {pred:.2f}")
            
        if args.output:
            results = pd.DataFrame({
                'step': range(1, len(predictions) + 1),
                'predicted': predictions
            })
            results.to_excel(args.output, index=False)
            print(f"\n预测结果已保存: {args.output}")
            
    return predictions


def interactive_mode():
    """交互模式"""
    print("=" * 60)
    print("电力负荷预测系统 - 交互模式")
    print("=" * 60)
    
    print("\n请选择操作:")
    print("1. 生成示例数据")
    print("2. 数据校验")
    print("3. 训练模型")
    print("4. 加载模型进行预测")
    print("5. 退出")
    
    choice = input("\n请输入选项 (1-5): ").strip()
    
    if choice == '1':
        n_days = input("请输入生成天数 (默认30): ").strip()
        n_days = int(n_days) if n_days else 30
        
        output = input("请输入输出文件路径 (默认 data/sample_data.xlsx): ").strip()
        output = output or "data/sample_data.xlsx"
        
        df = generate_sample_data(n_days=n_days)
        df.to_excel(output, index=False)
        
        print(f"\n示例数据已生成: {output}")
        print(f"记录数: {len(df)}")
        
    elif choice == '2':
        file_path = input("请输入数据文件路径: ").strip()
        
        if not os.path.exists(file_path):
            print(f"文件不存在: {file_path}")
            return
            
        loader = DataLoader()
        data = loader.load_excel(file_path)
        
        validator = DataValidator(data)
        report = validator.validate()
        
        print("\n" + validator.generate_report())
        
    elif choice == '3':
        file_path = input("请输入数据文件路径: ").strip()
        
        if not os.path.exists(file_path):
            print(f"文件不存在: {file_path}")
            return
            
        model_type = input("请输入模型类型 (xgboost/lstm, 默认 xgboost): ").strip() or 'xgboost'
        
        predictor = LoadPredictor(model_type=model_type)
        
        print("\n加载数据...")
        predictor.load_data(file_path)
        
        print("\n创建特征...")
        predictor.create_features()
        
        print("\n准备数据...")
        predictor.prepare_data()
        
        print("\n训练模型...")
        predictor.train(verbose=True)
        
        print("\n评估模型...")
        metrics = predictor.evaluate()
        
        save_path = input("请输入模型保存路径 (可选): ").strip()
        if save_path:
            predictor.save(save_path)
            print(f"模型已保存: {save_path}")
            
    elif choice == '4':
        model_path = input("请输入模型文件路径: ").strip()
        
        if not os.path.exists(model_path):
            print(f"文件不存在: {model_path}")
            return
            
        model_type = input("请输入模型类型 (xgboost/lstm, 默认 xgboost): ").strip() or 'xgboost'
        
        predictor = LoadPredictor(model_type=model_type)
        predictor.load(model_path)
        
        print("模型已加载")
        
        steps = input("请输入预测步数 (默认1): ").strip()
        steps = int(steps) if steps else 1
        
        predictions = predictor.predict(steps=steps)
        
        print(f"\n预测结果:")
        for i, pred in enumerate(predictions[:10]):
            print(f"  步骤 {i+1}: {pred:.2f}")
            
    else:
        print("退出程序")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='短期电力负荷预测系统',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例用法:
  # 生成30天示例数据
  python -m src.main generate --days 30 --output data/sample.xlsx
  
  # 校验数据
  python -m src.main validate --input data/sample.xlsx
  
  # 训练XGBoost模型
  python -m src.main train --input data/sample.xlsx --model xgboost
  
  # 训练并保存模型
  python -m src.main train --input data/sample.xlsx --save-model models/xgboost.pkl
  
  # 预测
  python -m src.main predict --model-path models/xgboost.pkl --steps 60
        """
    )
    
    subparsers = parser.add_subparsers(dest='command', help='子命令')
    
    generate_parser = subparsers.add_parser('generate', help='生成示例数据')
    generate_parser.add_argument('--days', type=int, default=30, help='生成天数')
    generate_parser.add_argument('--output', type=str, default='data/sample_data.xlsx', help='输出文件路径')
    
    validate_parser = subparsers.add_parser('validate', help='数据校验')
    validate_parser.add_argument('--input', type=str, required=True, help='输入Excel文件路径')
    
    train_parser = subparsers.add_parser('train', help='训练模型')
    train_parser.add_argument('--input', type=str, required=True, help='输入Excel文件路径')
    train_parser.add_argument('--model', type=str, default='xgboost', choices=['xgboost', 'lstm'], help='模型类型')
    train_parser.add_argument('--no-validate', action='store_true', help='跳过数据校验')
    train_parser.add_argument('--train-ratio', type=float, default=0.7, help='训练集比例')
    train_parser.add_argument('--val-ratio', type=float, default=0.15, help='验证集比例')
    train_parser.add_argument('--estimators', type=int, default=500, help='XGBoost树的数量')
    train_parser.add_argument('--depth', type=int, default=6, help='XGBoost树的最大深度')
    train_parser.add_argument('--save-model', type=str, help='模型保存路径')
    train_parser.add_argument('--verbose', action='store_true', default=True, help='显示训练信息')
    
    predict_parser = subparsers.add_parser('predict', help='进行预测')
    predict_parser.add_argument('--model-path', type=str, help='模型文件路径')
    predict_parser.add_argument('--model', type=str, default='xgboost', choices=['xgboost', 'lstm'], help='模型类型')
    predict_parser.add_argument('--test-data', type=str, help='测试数据文件路径')
    predict_parser.add_argument('--steps', type=int, default=1, help='预测步数')
    predict_parser.add_argument('--output', type=str, help='输出文件路径')
    
    args = parser.parse_args()
    
    if args.command == 'generate':
        generate_sample_command(args)
    elif args.command == 'validate':
        validate_command(args)
    elif args.command == 'train':
        train_command(args)
    elif args.command == 'predict':
        predict_command(args)
    else:
        interactive_mode()


if __name__ == '__main__':
    main()
