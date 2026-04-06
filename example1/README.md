# Excel SQL C++ 程序

这个程序使用C++和ODBC来操作Excel文件，支持通过SQL语句读写Excel表格。

## 功能
1. 打开Excel表格文件
2. 使用SQL语句读取指定工作表中的数据
3. 使用SQL语句向指定工作表写入数据

## 环境要求
1. Windows操作系统
2. Visual Studio 或其他支持C++的编译器
3. ODBC驱动（Windows默认安装了Microsoft Excel Driver）
4. Excel文件（.xlsx或.xls格式）

## 编译步骤
1. 打开Visual Studio，创建一个新的C++控制台项目
2. 将`excel_sql.cpp`文件添加到项目中
3. 在项目属性中，确保链接器包含`odbc32.lib`库
4. 编译项目

## 使用方法
1. 编译程序
2. 在命令行中运行程序，提供Excel文件路径、工作表名称和SQL语句作为参数

## 命令格式
```
excel_sql <excel_file_path> <worksheet_name> <sql_statement>
```

## 示例
### 读取数据
```
excel_sql D:\example.xlsx Sheet1 "SELECT * FROM [Sheet1$]"
```

### 写入数据
```
excel_sql D:\example.xlsx Sheet1 "INSERT INTO [Sheet1$] (Column1, Column2) VALUES ('New Value 1', 'New Value 2')"
```

### 更新数据
```
excel_sql D:\example.xlsx Sheet1 "UPDATE [Sheet1$] SET Column2 = 'Updated Value' WHERE Column1 = 'Value1'"
```

### 删除数据
```
excel_sql D:\example.xlsx Sheet1 "DELETE FROM [Sheet1$] WHERE Column1 = 'Value1'"
```

## 注意事项
1. 确保Excel文件存在且可访问
2. 确保工作表名称正确（注意工作表名称后面需要加`$`符号）
3. 确保Excel文件没有被其他程序打开
4. 对于.xlsx文件，需要使用Microsoft Excel Driver (*.xls, *.xlsx, *.xlsm, *.xlsb)驱动

## 错误处理
程序会捕获并显示ODBC错误信息，帮助你诊断问题。

## 扩展建议
1. 添加命令行参数支持，允许用户指定Excel文件路径和工作表名称
2. 添加更多SQL操作支持，如更新和删除数据
3. 添加错误处理和异常捕获
4. 添加数据类型转换支持，处理不同类型的数据

## 示例Excel文件结构
为了测试程序，你可以创建一个Excel文件，包含以下结构：

| Column1 | Column2 |
|---------|---------|
| Value1  | Value2  |
| Value3  | Value4  |

然后运行程序，它会读取这些数据并添加一行新数据。