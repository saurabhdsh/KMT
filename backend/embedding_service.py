"""
Embedding Service
Generates embeddings using various models (OpenAI, Azure OpenAI, etc.)
"""

import os
from typing import List

def generate_embedding(text: str, model: str = "text-embedding-3-large") -> List[float]:
    """
    Generate embedding for text using specified model
    Automatically falls back to alternative providers if primary fails
    """
    # Azure OpenAI
    if "azure" in model.lower() or "azure-openai" in model.lower():
        try:
            return generate_azure_openai_embedding(text, model)
        except Exception as azure_error:
            error_msg = str(azure_error).lower()
            # Check if it's a connection/auth error
            if "connection" in error_msg or "timeout" in error_msg or "api key" in error_msg:
                print(f"⚠️ Azure OpenAI failed ({azure_error}), trying OpenAI fallback...")
                # Try OpenAI as fallback
                if os.getenv("OPENAI_API_KEY"):
                    try:
                        return generate_openai_embedding(text, "text-embedding-3-large")
                    except Exception as openai_error:
                        print(f"⚠️ OpenAI fallback also failed ({openai_error}), trying HuggingFace...")
                        # Try HuggingFace as final fallback
                        return generate_huggingface_embedding(text)
                else:
                    # No OpenAI key, go straight to HuggingFace
                    print(f"⚠️ No OpenAI API key, using HuggingFace fallback...")
                    return generate_huggingface_embedding(text)
            else:
                # Other error, re-raise
                raise
    
    # OpenAI
    elif "text-embedding" in model.lower() or "gpt" in model.lower():
        try:
            return generate_openai_embedding(text, model)
        except Exception as openai_error:
            error_msg = str(openai_error).lower()
            if "connection" in error_msg or "timeout" in error_msg or "api key" in error_msg:
                print(f"⚠️ OpenAI failed ({openai_error}), trying HuggingFace fallback...")
                return generate_huggingface_embedding(text)
            else:
                raise
    
    # HuggingFace (default fallback)
    else:
        return generate_huggingface_embedding(text, model)


def generate_azure_openai_embedding(text: str, model: str = "azure-openai-embedding-1") -> List[float]:
    """Generate embedding using Azure OpenAI"""
    try:
        from openai import AzureOpenAI
        
        api_key = os.getenv("AZURE_OPENAI_API_KEY")
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")
        
        if not api_key:
            raise Exception("AZURE_OPENAI_API_KEY not set in environment variables")
        if not endpoint:
            raise Exception("AZURE_OPENAI_ENDPOINT not set in environment variables")
        
        # Clean endpoint URL (remove trailing slash if present)
        endpoint = endpoint.rstrip('/')
        
        client = AzureOpenAI(
            api_key=api_key,
            api_version=api_version,
            azure_endpoint=endpoint
        )
        
        response = client.embeddings.create(
            model=model,
            input=text
        )
        
        return response.data[0].embedding
        
    except ImportError:
        raise ImportError("Please install openai: pip install openai")
    except Exception as e:
        raise Exception(f"Azure OpenAI embedding error: {str(e)}")


def generate_openai_embedding(text: str, model: str = "text-embedding-3-large") -> List[float]:
    """Generate embedding using OpenAI"""
    try:
        from openai import OpenAI
        
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        response = client.embeddings.create(
            model=model,
            input=text
        )
        
        return response.data[0].embedding
        
    except ImportError:
        raise ImportError("Please install openai: pip install openai")
    except Exception as e:
        raise Exception(f"OpenAI embedding error: {str(e)}")


def generate_huggingface_embedding(text: str, model: str = "sentence-transformers/all-MiniLM-L6-v2") -> List[float]:
    """Generate embedding using HuggingFace (fallback)"""
    try:
        from sentence_transformers import SentenceTransformer
        
        # Load model (cached after first use)
        encoder = SentenceTransformer(model)
        embedding = encoder.encode(text).tolist()
        
        return embedding
        
    except ImportError:
        raise ImportError("Please install sentence-transformers: pip install sentence-transformers")
    except Exception as e:
        raise Exception(f"HuggingFace embedding error: {str(e)}")

