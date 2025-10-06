# test_system.py
import requests
import json
import time
import os

def test_complete_system():
    print("🧪 Testing Complete RAG System with OpenAI...")
    
    # Use development token (since Firebase isn't fully setup yet)
    headers = {"Authorization": "Bearer dev_user_123"}
    
    # Test 1: Health Check
    print("\n1. Testing health endpoint...")
    try:
        health = requests.get("http://localhost:8000/health")
        print(f"✅ Health: {health.json()}")
    except:
        print("❌ Server not running")
        return

    # Test 2: Create a test document
    print("\n2. Creating test document...")
    test_content = """
    Artificial Intelligence (AI) is the simulation of human intelligence in machines. 
    Machine Learning (ML) is a subset of AI that enables computers to learn without explicit programming.
    Deep Learning uses neural networks with multiple layers for complex pattern recognition.
    
    RAG (Retrieval-Augmented Generation) combines retrieval systems with language models.
    It helps provide accurate, context-aware responses based on specific documents.
    RAG systems work by first retrieving relevant information from a knowledge base,
    then using that information to generate more accurate and context-aware responses.
    This approach reduces hallucinations and improves response quality.
    """
    
    with open("test_document.txt", "w", encoding="utf-8") as f:
        f.write(test_content)

    # Test 3: Upload document
    print("\n3. Testing document upload...")
    with open("test_document.txt", "rb") as f:
        files = {'file': ('test_document.txt', f, 'text/plain')}
        
        upload_response = requests.post(
            "http://localhost:8000/upload?is_private=true",
            files=files,
            headers=headers
        )
    
    if upload_response.status_code == 200:
        upload_data = upload_response.json()
        print(f"✅ Upload successful!")
        print(f"   Message: {upload_data['message']}")
        session_id = upload_data.get('session_id')
        print(f"   Session ID: {session_id}")
        
        # Wait for processing
        print("   ⏳ Waiting for document processing...")
        time.sleep(3)
        
        # Test multiple queries to see OpenAI in action
        test_queries = [
            "What is ML?",
            "Explain RAG and how it works",
            "What is the relationship between AI and ML?",
            "How does RAG improve response quality?"
        ]
        
        for i, query in enumerate(test_queries, 1):
            print(f"\n4.{i} Testing query: '{query}'")
            query_data = {
                "query": query,
                "session_id": session_id
            }
            
            query_response = requests.post(
                "http://localhost:8000/query",
                json=query_data,
                headers=headers
            )
            
            if query_response.status_code == 200:
                query_result = query_response.json()
                print("✅ Query successful!")
                print(f"   Answer: {query_result['answer']}")
                print(f"   Sources found: {len(query_result['sources'])}")
                
                for j, source in enumerate(query_result['sources']):
                    print(f"   Source {j+1}: {source['filename']} (Score: {source['similarity_score']})")
                
                print("-" * 80)
            else:
                print(f"❌ Query failed: {query_response.text}")
            
            # Small delay between queries
            time.sleep(1)
            
        # Test 5: Check sessions
        print("\n5. Testing session management...")
        sessions_response = requests.get("http://localhost:8000/sessions", headers=headers)
        if sessions_response.status_code == 200:
            sessions = sessions_response.json()
            print(f"✅ Active sessions: {len(sessions)}")
            for session in sessions:
                print(f"   - {session['session_id']} ({session['file_count']} files)")
        
    else:
        print(f"❌ Upload failed: {upload_response.text}")
    
    # Cleanup
    if os.path.exists("test_document.txt"):
        os.remove("test_document.txt")

def test_openai_status():
    """Test if OpenAI is properly configured"""
    print("\n🔍 Checking OpenAI configuration...")
    headers = {"Authorization": "Bearer dev_user_123"}
    
    # Simple query to see if OpenAI is working
    test_query = {
        "query": "What is AI?",
        "session_id": "test_session"
    }
    
    try:
        response = requests.post(
            "http://localhost:8000/query",
            json=test_query,
            headers=headers,
            timeout=30
        )
        if response.status_code == 200:
            result = response.json()
            if "OpenAI" in result['answer'] and "API key" in result['answer']:
                print("❌ OpenAI is NOT configured properly")
                print("💡 Make sure you:")
                print("   1. Created a .env file with OPENAI_API_KEY=your_key")
                print("   2. Installed python-dotenv: pip install python-dotenv")
                print("   3. Restarted the FastAPI server")
            else:
                print("✅ OpenAI is working correctly!")
        else:
            print("❌ Could not test OpenAI configuration")
    except Exception as e:
        print(f"❌ Error testing OpenAI: {e}")

if __name__ == "__main__":
    test_openai_status()
    test_complete_system()