# Makefile for excel_sql program

# Compiler
CXX = g++

# Compiler flags
CXXFLAGS = -fdiagnostics-color=always -g

# Linker flags
LDFLAGS = -lodbc32

# Target executable
target = excel_sql.exe

# Source files
sources = excel_sql.cpp

# Default target
all: $(target)

# Compile the program
$(target): $(sources)
	$(CXX) $(CXXFLAGS) $(sources) -o $(target) $(LDFLAGS)

# Clean target
clean:
	@powershell -Command "if (Test-Path '$(target)') { Remove-Item '$(target)' -Force } else { Write-Host 'File not found or already deleted' }"

# Phony targets
.PHONY: all clean