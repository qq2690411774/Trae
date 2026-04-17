@echo off
echo ======================================
echo 正在编译 excel_sql.cpp ...
echo ======================================
"E:\Program Files\mingw64\bin\g++.exe" -static -municode -mwindows excel_sql.cpp -o excel_sql.exe -lodbc32
if %errorlevel% equ 0 (
    echo.
    echo ======================================
    echo 编译成功！生成文件：excel_sql.exe
    echo ======================================
    dir excel_sql.exe
) else (
    echo.
    echo ======================================
    echo 编译失败！
    echo ======================================
)
pause