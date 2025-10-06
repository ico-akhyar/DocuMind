# llm_service.py
import os
from openai import OpenAI
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
                self.openai_client = OpenAI(api_key=self.OPENAI_API_KEY)
                # Test the connection
                self.openai_client.models.list()
                self.USE_OPENAI = True
                print("✅ OpenAI configured successfully!")
            except Exception as e:
                print(f"❌ OpenAI configuration failed: {e}")
                self.USE_OPENAI = False
                self.openai_client = None
        else:
            print("❌ OPENAI_API_KEY not found - using simple RAG responses")
    
    def generate_answer(self, query: str, relevant_chunks: List[str]) -> str:
        """
        Generate answer using available LLM service
        """
        if not relevant_chunks:
            return "I couldn't find any relevant information in your documents to answer this question."
        
        if self.USE_OPENAI and self.openai_client:
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

Note: For more detailed and intelligent answers, please configure an LLM service."""
    
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
            response = self.openai_client.chat.completions.create(
                model="gpt-4o-mini",  # You can change to "gpt-3.5-turbo" for cost savings
                messages=[
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
                max_tokens=800,
                temperature=0.1,  # Low temperature for factual responses
                top_p=0.9
            )
            
            answer = response.choices[0].message.content.strip()
            print(f"✅ OpenAI response generated successfully")
            return answer
            
        except Exception as e:
            print(f"❌ OpenAI API error: {e}")
            print("🔄 Falling back to simple RAG response...")
            return self._generate_simple_answer(query, relevant_chunks)

# Global instance
llm_service = LLMService()