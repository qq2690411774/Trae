# Clean script to remove excel_sql.exe
if (Test-Path 'excel_sql.exe') {
    Remove-Item 'excel_sql.exe' -Force
    Write-Host 'File deleted successfully!'
} else {
    Write-Host 'File not found or already deleted'
}