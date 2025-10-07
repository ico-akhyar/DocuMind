# llm_service.py
import os
from typing import List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class LLMService:
    def __init__(self):
        self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
        self.openai_client = None
        self.USE_OPENAI = False
        
        self._initialize_openai()
    
    def _initialize_openai(self):
        """Initialize OpenAI client if API key is available"""
        if self.OPENAI_API_KEY:
            try:
                print(f"🔑 OpenAI API Key found: {self.OPENAI_API_KEY[:10]}...")
                
                # APPROACH 1: Try direct API calls without the client
                import openai
                
                # Set the API key directly
                openai.api_key = self.OPENAI_API_KEY
                
                # Test with a direct API call
                import requests
                headers = {
                    "Authorization": f"Bearer {self.OPENAI_API_KEY}",
                    "Content-Type": "application/json"
                }
                
                test_data = {
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": "Say 'test'"}],
                    "max_tokens": 5
                }
                
                response = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers=headers,
                    json=test_data,
                    timeout=10
                )
                
                if response.status_code == 200:
                    print("✅ OpenAI direct API test successful!")
                    self.USE_OPENAI = True
                    self.openai_client = openai  # Use the module directly
                else:
                    print(f"❌ OpenAI API test failed: {response.status_code} - {response.text}")
                    self.USE_OPENAI = False
                
            except Exception as e:
                print(f"❌ OpenAI configuration failed: {e}")
                self.USE_OPENAI = False
        else:
            print("❌ OPENAI_API_KEY not found in environment variables")
            self.USE_OPENAI = False
    
    def generate_answer(self, query: str, relevant_chunks: List[str]) -> str:
        """
        Generate answer using available LLM service
        """
        if not relevant_chunks:
            return "I couldn't find any relevant information in your documents to answer this question."
        
        if self.USE_OPENAI:
            return self._generate_openai_answer(query, relevant_chunks)
        else:
            return self._generate_simple_answer(query, relevant_chunks)
    
    def _generate_simple_answer(self, query: str, relevant_chunks: List[str]) -> str:
        """
        Fallback response generator when no LLM service is available
        """
        print(f"🔍 Processing {len(relevant_chunks)} relevant chunks for query: '{query}'")
        
        # Combine context
        context = "\n\n".join([f"[Source {i+1}]: {chunk}" for i, chunk in enumerate(relevant_chunks)])
        
        return f"""Based on your documents:

{context}

Question: {query}

Note: OpenAI service is currently unavailable. Please check configuration."""
    
    def _generate_openai_answer(self, query: str, relevant_chunks: List[str]) -> str:
        """
        Generate intelligent answer using OpenAI GPT
        """
        print("🚀 Generating answer with OpenAI...")
        
        # Prepare context from relevant chunks
        context = "\n\n".join([f"Source {i+1}: {chunk}" for i, chunk in enumerate(relevant_chunks)])
        
        # Create sophisticated prompt for better answers
        prompt = f"""You are an expert AI assistant that provides accurate, concise answers based ONLY on the provided context.

CONTEXT FROM USER'S DOCUMENTS:
{context}

USER'S QUESTION: {query}

IMPORTANT INSTRUCTIONS:
1. Answer based ONLY on the provided context above
2. If the context doesn't contain enough information to fully answer the question, say so clearly
3. Be concise and factual - don't add information not present in the context
4. If multiple sources are provided, synthesize the information cohesively
5. Cite specific sources when referring to particular information (e.g., "According to Source 1...")
6. If you need to make inferences, clearly state they are based on the available context
7. Structure your answer to be helpful and easy to understand

Please provide a comprehensive answer:"""

        try:
            # Use direct API call to avoid client issues
            import requests
            
            headers = {
                "Authorization": f"Bearer {self.OPENAI_API_KEY}",
                "Content-Type": "application/json"
            }
            
            data = {
                "model": "gpt-4o-mini",
                "messages": [
                    {
                        "role": "system", 
                        "content": """You are a helpful assistant that provides accurate answers based only on the given context. 
                        Always be truthful about information limitations and cite your sources when possible.
                        Provide clear, structured responses that directly address the user's question."""
                    },
                    {
                        "role": "user", 
                        "content": prompt
                    }
                ],
                "max_tokens": 800,
                "temperature": 0.1,
                "top_p": 0.9
            }
            
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers=headers,
                json=data,
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                answer = result['choices'][0]['message']['content'].strip()
                print(f"✅ OpenAI response generated successfully")
                return answer
            else:
                print(f"❌ OpenAI API error: {response.status_code} - {response.text}")
                return self._generate_simple_answer(query, relevant_chunks)
            
        except Exception as e:
            print(f"❌ OpenAI API error: {e}")
            print("🔄 Falling back to simple RAG response...")
            return self._generate_simple_answer(query, relevant_chunks)

# Global instance
llm_service = LLMService()