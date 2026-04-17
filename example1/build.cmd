@echo off
echo 正在编译excel_sql.cpp...
g++ excel_sql.cpp -o excel_sql.exe
if %errorlevel% equ 0 (
    echo 编译成功！
    echo 生成的文件：
    dir excel_sql.exe
) else (
    echo 编译失败，请检查错误信息
)
pause