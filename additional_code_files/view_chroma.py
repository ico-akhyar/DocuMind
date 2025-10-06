import chromadb

def check_chroma():
    client = chromadb.PersistentClient(path="chroma_db")
    collection = client.get_collection("documents")
    
    # Get all items
    all_items = collection.get()
    
    print(f"Total items in ChromaDB: {len(all_items['ids'])}")
    
    for i, (id, metadata, document) in enumerate(zip(all_items['ids'], all_items['metadatas'], all_items['documents'])):
        print(f"\n--- Item {i+1} ---")
        print(f"ID: {id}")
        print(f"Filename: {metadata.get('filename', 'N/A')}")
        print(f"User: {metadata.get('user_id', 'N/A')}")
        print(f"Session: {metadata.get('session_id', 'N/A')}")
        print(f"Content preview: {document[:200]}...")

if __name__ == "__main__":
    check_chroma()