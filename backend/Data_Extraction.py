import pytesseract
from PIL import Image
from pdf2image import convert_from_path
from docx import Document
import trafilatura
import pdfplumber
import unicodedata
import chromadb
from datetime import datetime, timedelta
import os
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
model = SentenceTransformer("models/all-MiniLM-L6-v2")
# model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def text_extract_pdf(path):
    pages = []
    with pdfplumber.open(path) as pdf:
        for page_num, page in enumerate(pdf.pages, start=1):
            txt = page.extract_text() or ""
            pages.append({"page": page_num, "text": txt})
    return pages


def text_extract_doc(path):
    doc = Document(path)
    text = []
    for paragraph in doc.paragraphs:
        text.append(paragraph.text)
    text = "\n".join(text)
    return [{"page": 1, "text": text}]

def extract_scanned_pdf(path):
    images = convert_from_path(path, dpi=300)
    pages = []
    for i, image in enumerate(images, start=1):
        txt = pytesseract.image_to_string(image)
        pages.append({"page": i, "text": txt})
    return pages

def extract_text_txt(path):
    with open(path, 'r') as f:
        text = f.read()
    return [{"page": 1, "text": text}]

def extract_text_html(url):
    downloaded = trafilatura.fetch_url(url)
    text = trafilatura.extract(downloaded)
    return [{"page": 1, "text": text}]


def extract_image(path):
    image = Image.open(path)
    text = pytesseract.image_to_string(image)
    return [{"page": 1, "text": text}]

def clean_text(text):
    text=unicodedata.normalize('NFKC',text)
    text = "".join(ch for ch in text if unicodedata.category(ch)[0]!="C")
    return text

def extract_raw_text(path):
    ext = os.path.splitext(path)[1].lower()
    try:
        if ext == ".pdf":
            pages = text_extract_pdf(path)
            if all(not p["text"].strip() for p in pages):
                pages = extract_scanned_pdf(path)
            return pages

        elif ext == ".docx":
            return text_extract_doc(path)

        elif ext == ".txt":
            return extract_text_txt(path)

        elif ext == ".html":
            return extract_text_html(path)

        elif ext in [".jpg", ".jpeg", ".png"]:
            return extract_image(path)

        else:
            raise ValueError(f"Unsupported file format: {ext}")
    except Exception as e:
        print(f"[ERROR] Failed extracting {path}: {e}")
        return [{"page": 1, "text": ""}]


def extract_text(path):
    pages = extract_raw_text(path)
    return [{"page": p["page"], "text": clean_text(p["text"])} for p in pages]



def chunking(path):
    pages=extract_text(path)
    filename=os.path.basename(path)
    ext=os.path.splitext(filename)[1].lower()

    # Use smaller chunks for better precision
    splitter=RecursiveCharacterTextSplitter(
        chunk_size=200,  # Smaller chunks!
        chunk_overlap=50,
        length_function=len,
        separators=["\n\n", "\n", ". ", "! ", "? "]  # Split at sentence boundaries
    )

    all_chunks=[]
    chunk_id=0
    for page in pages:
        page_text=page["text"]
        page_no=page["page"]

        if not page_text.strip():
            continue

        chunks=splitter.split_text(page_text)
        
        for chunk in chunks:
            chunk_id+=1
            all_chunks.append({
                "filename":filename,
                "doctype":ext,
                "page":page_no,
                "chunk_id":chunk_id,
                "chunk":chunk.strip(),  # Remove extra whitespace
            })

    print(f"📝 Created {len(all_chunks)} chunks from document")
    return all_chunks


def embed_chunks(chunks):
    text=[ch["chunk"] for ch in chunks]
    embeddings=model.encode(text, batch_size=32, show_progress_bar=True)

    for i, enb in enumerate(embeddings):
        chunks[i]["embedding"]=enb.tolist()

    return chunks




client = chromadb.PersistentClient(path="chroma_db")
if "documents" in [c.name for c in client.list_collections()]:
    collection = client.get_collection("documents")
else:
    collection = client.create_collection("documents")


def store_in_chroma_with_session(chunks, session_id=None, user_id=None):
    ids = [f"{c['filename']}_{c['chunk_id']}" for c in chunks]
    docs = [c["chunk"] for c in chunks]
    metas = [{
        "filename": c["filename"],  # This should be the original filename
        "page": c["page"], 
        "chunk_id": c["chunk_id"],
        "doctype": c["doctype"],
        "session_id": session_id,
        "user_id": user_id,  
        "created_at": datetime.now().isoformat(),
        "expires_at": (datetime.now() + timedelta(minutes=30)).isoformat() if session_id else None
    } for c in chunks]
    embs = [c["embedding"] for c in chunks]

    try:
        collection.upsert(
            documents=docs,
            metadatas=metas,
            ids=ids,
            embeddings=embs,
        )
    except Exception as e:
        print(f"Error storing in ChromaDB: {e}")

# Update process_and_store
def process_and_store(path, session_id=None, user_id=None, original_filename=None):
    print(f"🔍 Starting processing for: {path}")
    chunks = chunking(path)
    print(f"📄 Extracted {len(chunks)} chunks")
    
    # Use original filename if provided
    if original_filename:
        for chunk in chunks:
            chunk["filename"] = original_filename
    
    embedded = embed_chunks(chunks)
    print(f"🔢 Generated embeddings for {len(embedded)} chunks")
    
    store_in_chroma_with_session(embedded, session_id, user_id)
    print(f"💾 Stored {len(embedded)} chunks in ChromaDB (session: {session_id}, user: {user_id})")
    return len(embedded)