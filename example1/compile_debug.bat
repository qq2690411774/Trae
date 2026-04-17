@echo off
echo ======================================
echo 正在编译 excel_sql.cpp ...
echo ======================================
echo.
echo 编译命令:
echo "E:\Program Files\mingw64\bin\g++.exe" -static -municode -mwindows excel_sql.cpp -o excel_sql.exe -lodbc32
echo.
echo 开始编译...
"E:\Program Files\mingw64\bin\g++.exe" -static -municode -mwindows excel_sql.cpp -o excel_sql.exe -lodbc32 2>&1
echo.
echo 编译完成，退出码: %errorlevel%
echo.
echo 检查生成的文件:
if exist excel_sql.exe (
    echo SUCCESS: excel_sql.exe 已生成
    dir excel_sql.exe
) else (
    echo FAILED: excel_sql.exe 未生成
    echo.
    echo 当前目录文件列表:
    dir
)
echo.
pause