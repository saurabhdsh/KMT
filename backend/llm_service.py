"""
LLM Service
Generates responses using various LLMs (OpenAI, Azure OpenAI, etc.)
"""

import os
from typing import List, Dict

def generate_llm_response(
    user_query: str,
    rag_context: List[Dict],
    llm_model: str,
    conversation_history: List[Dict] = None
) -> str:
    """
    Generate LLM response using RAG context
    """
    try:
        # Build context from RAG results
        context_text = "\n\n".join([
            f"[Source: {chunk.get('metadata', {}).get('source', 'unknown')}]\n{chunk.get('text', '')}"
            for chunk in rag_context
        ])
        
        # Build system prompt
        system_prompt = """You are a helpful assistant for Service Operations. 
Use the provided knowledge base context to answer questions accurately.
If the context doesn't contain relevant information, say so.
Always cite sources when possible."""
        
        # Build user prompt with context
        user_prompt = f"""Based on the following knowledge base context, answer the user's question.

Context:
{context_text}

User Question: {user_query}

Answer:"""
        
        # Determine LLM provider and call
        if "azure" in llm_model.lower() or "azure-openai" in llm_model.lower():
            return generate_azure_openai_response(system_prompt, user_prompt, llm_model, conversation_history)
        elif "gpt" in llm_model.lower() or "openai" in llm_model.lower():
            return generate_openai_response(system_prompt, user_prompt, llm_model, conversation_history)
        else:
            # Default to OpenAI
            return generate_openai_response(system_prompt, user_prompt, "gpt-4", conversation_history)
            
    except Exception as e:
        raise Exception(f"Error generating LLM response: {str(e)}")


def generate_azure_openai_response(
    system_prompt: str,
    user_prompt: str,
    model: str = "gpt-4",
    conversation_history: List[Dict] = None
) -> str:
    """Generate response using Azure OpenAI"""
    try:
        from openai import AzureOpenAI
        
        client = AzureOpenAI(
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview"),
            azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
        )
        
        # Build messages
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history
        if conversation_history:
            for msg in conversation_history:
                if msg.get("role") in ["user", "assistant"]:
                    messages.append({
                        "role": msg["role"],
                        "content": msg.get("content", "")
                    })
        
        # Add current user prompt
        messages.append({"role": "user", "content": user_prompt})
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        
        return response.choices[0].message.content
        
    except ImportError:
        raise ImportError("Please install openai: pip install openai")
    except Exception as e:
        raise Exception(f"Azure OpenAI error: {str(e)}")


def generate_openai_response(
    system_prompt: str,
    user_prompt: str,
    model: str = "gpt-4",
    conversation_history: List[Dict] = None
) -> str:
    """Generate response using OpenAI"""
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # Build messages
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history
        if conversation_history:
            for msg in conversation_history:
                if msg.get("role") in ["user", "assistant"]:
                    messages.append({
                        "role": msg["role"],
                        "content": msg.get("content", "")
                    })
        
        # Add current user prompt
        messages.append({"role": "user", "content": user_prompt})
        
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.7,
            max_tokens=2000
        )
        
        return response.choices[0].message.content
        
    except ImportError:
        raise ImportError("Please install openai: pip install openai")
    except Exception as e:
        raise Exception(f"OpenAI error: {str(e)}")

