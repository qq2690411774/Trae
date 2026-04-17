
try:
    import pdfplumber
    with pdfplumber.open('alfred_application_challenge.pdf') as pdf:
        output_file = open('pdf_content.txt', 'w', encoding='utf-8')
        
        output_file.write(f"页数: {len(pdf.pages)}\n")
        output_file.write("\n=== 文档内容 ===\n\n")
        
        for page_num, page in enumerate(pdf.pages):
            text = page.extract_text()
            output_file.write(f"--- 第 {page_num + 1} 页 ---\n\n")
            output_file.write(text)
            output_file.write("\n\n")
        
        output_file.close()
        print("PDF内容已写入 pdf_content.txt")
except ImportError:
    print("pdfplumber not found. Try installing with: pip install pdfplumber")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

