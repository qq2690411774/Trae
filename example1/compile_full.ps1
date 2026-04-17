# 编译excel_sql.cpp
Write-Host "正在编译excel_sql.cpp..."
& "E:\Program Files\mingw64\bin\g++.exe" excel_sql.cpp -o excel_sql.exe

# 检查编译结果
if ($LASTEXITCODE -eq 0) {
    Write-Host "编译成功！"
    Write-Host "生成的文件："
    Get-ChildItem excel_sql.exe
} else {
    Write-Host "编译失败，请检查错误信息"
}

# 显示当前目录内容
Write-Host "\n当前目录内容："
Get-ChildItem