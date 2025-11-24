"""
Document Parser
Parses PDF and DOCX files to extract text content
"""

from pathlib import Path
from typing import List, Dict
import os

def parse_pdf(file_path: Path) -> str:
    """Parse PDF file and extract text"""
    try:
        import PyPDF2
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
        return text
    except ImportError:
        try:
            import pdfplumber
            text = ""
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
            return text
        except ImportError:
            raise ImportError("Please install PyPDF2 or pdfplumber: pip install PyPDF2 pdfplumber")
    except Exception as e:
        raise Exception(f"Error parsing PDF {file_path}: {str(e)}")


def parse_docx(file_path: Path) -> str:
    """Parse DOCX file and extract text"""
    try:
        from docx import Document
        doc = Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    except ImportError:
        raise ImportError("Please install python-docx: pip install python-docx")
    except Exception as e:
        raise Exception(f"Error parsing DOCX {file_path}: {str(e)}")


def parse_documents(upload_dir: Path, file_names: List[str]) -> List[Dict]:
    """
    Parse all uploaded documents
    Returns list of documents with content and metadata
    """
    documents = []
    
    for file_name in file_names:
        file_path = upload_dir / file_name
        
        if not file_path.exists():
            continue
        
        try:
            # Determine file type and parse
            if file_name.lower().endswith('.pdf'):
                content = parse_pdf(file_path)
            elif file_name.lower().endswith(('.docx', '.doc')):
                content = parse_docx(file_path)
            else:
                # Try to read as text
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
            
            documents.append({
                "content": content,
                "source": "upload",
                "metadata": {
                    "file_name": file_name,
                    "file_path": str(file_path),
                    "file_size": file_path.stat().st_size
                },
                "id": file_name
            })
            
        except Exception as e:
            print(f"Warning: Failed to parse {file_name}: {str(e)}")
            continue
    
    return documents

