#include <iostream>
#include <windows.h>
#include <sql.h>
#include <sqlext.h>
#include <sqltypes.h>
#include <cstring>
#include <cstdio>
#include <string>
#include <vector>

using namespace std;

// 错误处理函数
void SQLCheck(SQLRETURN ret, SQLHANDLE handle, SQLSMALLINT handleType, const char* operation) {
    if (ret != SQL_SUCCESS && ret != SQL_SUCCESS_WITH_INFO) {
        SQLCHAR sqlState[6], message[1024];
        SQLINTEGER nativeError;
        SQLSMALLINT messageLength;
        
        SQLGetDiagRecA(handleType, handle, 1, sqlState, &nativeError, message, sizeof(message), &messageLength);
        cout << "Error during " << operation << ": " << message << " (SQL State: " << sqlState << ")" << endl;
        exit(1);
    }
}

// 转换wchar_t到string
string wstringToString(const wstring& ws) {
    int len = WideCharToMultiByte(CP_ACP, 0, ws.c_str(), -1, NULL, 0, NULL, NULL);
    char* buf = new char[len];
    WideCharToMultiByte(CP_ACP, 0, ws.c_str(), -1, buf, len, NULL, NULL);
    string result(buf);
    delete[] buf;
    return result;
}

int wmain(int argc, wchar_t* argv[]) {
    // 显示参数信息
    wcout << L"argc: " << argc << endl;
    for (int i = 0; i < argc; i++) {
        wcout << L"argv[" << i << L"]: " << argv[i] << endl;
    }
    
    // 检查命令行参数（至少3个参数：程序名、Excel路径、工作表名、SQL语句）
    if (argc < 4) {
        wcout << L"Usage: excel_sql <excel_file_path> <worksheet_name> <sql_statement>" << endl;
        wcout << L"Example: excel_sql D:\\example.xlsx Sheet1 \"SELECT * FROM [Sheet1$]\"" << endl;
        return 1;
    }
    
    SQLHENV henv;
    SQLHDBC hdbc;
    SQLHSTMT hstmt;
    SQLRETURN ret;
    
    // 获取命令行参数
    wstring excelFilePath(argv[1]);
    wstring worksheetName(argv[2]);
    
    // 合并第3个参数之后的所有参数为SQL语句
    wstring sqlStatement;
    for (int i = 3; i < argc; i++) {
        if (i > 3) sqlStatement += L" ";
        sqlStatement += argv[i];
    }
    
    // 转换为ANSI字符串
    string excelFilePathA = wstringToString(excelFilePath);
    string worksheetNameA = wstringToString(worksheetName);
    string sqlStatementA = wstringToString(sqlStatement);
    
    wcout << L"\nProcessed parameters:" << endl;
    wcout << L"Excel file: " << excelFilePath << endl;
    wcout << L"Worksheet: " << worksheetName << endl;
    wcout << L"SQL statement: " << sqlStatement << endl;
    
    // 1. 分配环境句柄
    ret = SQLAllocHandle(SQL_HANDLE_ENV, SQL_NULL_HANDLE, &henv);
    SQLCheck(ret, henv, SQL_HANDLE_ENV, "allocating environment");
    
    // 2. 设置环境属性
    ret = SQLSetEnvAttr(henv, SQL_ATTR_ODBC_VERSION, (SQLPOINTER)SQL_OV_ODBC3, 0);
    SQLCheck(ret, henv, SQL_HANDLE_ENV, "setting environment attributes");
    
    // 3. 分配连接句柄
    ret = SQLAllocHandle(SQL_HANDLE_DBC, henv, &hdbc);
    SQLCheck(ret, hdbc, SQL_HANDLE_DBC, "allocating connection");
    
    // 4. 连接到Excel文件
    char connectionString[512];
    sprintf(connectionString, "DRIVER={Microsoft Excel Driver (*.xls, *.xlsx, *.xlsm, *.xlsb)};DBQ=%s;", excelFilePathA.c_str());
    
    cout << "Connection string: " << connectionString << endl;
    
    ret = SQLDriverConnectA(hdbc, NULL, (SQLCHAR*)connectionString, SQL_NTS, NULL, 0, NULL, SQL_DRIVER_COMPLETE);
    SQLCheck(ret, hdbc, SQL_HANDLE_DBC, "connecting to Excel");
    
    // 5. 分配语句句柄
    ret = SQLAllocHandle(SQL_HANDLE_STMT, hdbc, &hstmt);
    SQLCheck(ret, hstmt, SQL_HANDLE_STMT, "allocating statement");
    
    // 6. 执行SQL语句
    cout << "Executing SQL statement: " << sqlStatementA << endl;
    ret = SQLExecDirectA(hstmt, (SQLCHAR*)sqlStatementA.c_str(), SQL_NTS);
    SQLCheck(ret, hstmt, SQL_HANDLE_STMT, "executing SQL statement");
    
    // 7. 处理查询结果（如果是SELECT语句）
    if (sqlStatementA.length() >= 6 && _strnicmp(sqlStatementA.c_str(), "select", 6) == 0) {
        cout << "Query results:" << endl;
        
        // 获取结果集列数
        SQLSMALLINT columnCount;
        SQLNumResultCols(hstmt, &columnCount);
        
        // 为每列分配缓冲区
        SQLCHAR** columnBuffers = new SQLCHAR*[columnCount];
        SQLLEN* columnLengths = new SQLLEN[columnCount];
        
        for (int i = 0; i < columnCount; i++) {
            columnBuffers[i] = new SQLCHAR[256];
        }
        
        // 读取并显示结果
        while (SQLFetch(hstmt) == SQL_SUCCESS) {
            for (int i = 0; i < columnCount; i++) {
                SQLGetData(hstmt, i + 1, SQL_CHAR, columnBuffers[i], 256, &columnLengths[i]);
                cout << "Column " << (i + 1) << ": " << columnBuffers[i];
                if (i < columnCount - 1) cout << ", ";
            }
            cout << endl;
        }
        
        // 释放缓冲区
        for (int i = 0; i < columnCount; i++) {
            delete[] columnBuffers[i];
        }
        delete[] columnBuffers;
        delete[] columnLengths;
    } else {
        // 对于非SELECT语句，显示影响的行数
        SQLLEN rowCount;
        SQLRowCount(hstmt, &rowCount);
        cout << "SQL statement executed successfully! Rows affected: " << rowCount << endl;
    }
    
    // 9. 释放资源
    SQLFreeHandle(SQL_HANDLE_STMT, hstmt);
    SQLDisconnect(hdbc);
    SQLFreeHandle(SQL_HANDLE_DBC, hdbc);
    SQLFreeHandle(SQL_HANDLE_ENV, henv);
    
    cout << "\nProgram completed successfully!" << endl;
    return 0;
}