# test_real_files.py
import requests
import os
import tempfile

def create_real_test_files():
    """Create real, valid test files"""
    test_files = {}
    
    # Real PDF content
    pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT /F1 12 Tf 100 700 Td (Artificial Intelligence PDF Test) Tj ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000239 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
300
%%EOF"""
    
    # Real DOCX (minimal valid structure)
    docx_content = b"PK\x03\x04\x14\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00[Content_Types].xml"
    
    # Real JPEG (minimal valid)
    jpg_content = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\x09\x09\x08\x0a\x0c\x14\x0d\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $. \' #.,\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\xff\xc4\x00\xb5\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07\"q\x142\x81\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br\x82\x09\n\x16\x17\x18\x19\x1a%&\'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x83\x84\x85\x86\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5\xf6\xf7\xf8\xf9\xfa\xff\xda\x00\x08\x01\x01\x00\x00?\x00"
    
    # Real TXT
    txt_content = b"Artificial Intelligence is the future of technology. Machine learning enables computers to learn from data."
    
    test_files = {
        "real_sample.pdf": pdf_content,
        "real_sample.docx": docx_content, 
        "real_sample.jpg": jpg_content,
        "real_sample.txt": txt_content
    }
    
    return test_files

def test_with_real_files():
    """Test with properly formatted files"""
    headers = {"Authorization": "Bearer dev_user_123"}
    test_files = create_real_test_files()
    
    for filename, content in test_files.items():
        print(f"\n📤 Testing {filename}...")
        
        # Create temporary file
        temp_path = f"temp_{filename}"
        with open(temp_path, "wb") as f:
            f.write(content)
        
        with open(temp_path, "rb") as f:
            files = {'file': (filename, f, 'application/octet-stream')}
            
            try:
                response = requests.post(
                    "http://localhost:8000/upload?is_private=true",
                    files=files,
                    headers=headers,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ {filename} uploaded successfully")
                    print(f"   Session: {result.get('session_id')}")
                    
                    # Test query if upload was successful
                    if "txt" in filename or "pdf" in filename:
                        time.sleep(2)  # Wait for processing
                        query_data = {
                            "query": "What is artificial intelligence?",
                            "session_id": result.get('session_id')
                        }
                        
                        query_response = requests.post(
                            "http://localhost:8000/query",
                            json=query_data,
                            headers=headers
                        )
                        
                        if query_response.status_code == 200:
                            query_result = query_response.json()
                            print(f"   Query successful: {len(query_result['sources'])} sources found")
                else:
                    print(f"❌ {filename} failed: {response.text}")
                    
            except Exception as e:
                print(f"❌ Error with {filename}: {e}")
        
        # Cleanup
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == "__main__":
    import time
    test_with_real_files()