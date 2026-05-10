from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

DB_PATH = "chroma_db"

embedding = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


def process_pdf(pdf_path):
    loader = PyPDFLoader(pdf_path)

    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50
    )

    chunks = splitter.split_documents(documents)

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embedding,
        persist_directory=DB_PATH
    )

    vectorstore.persist()

    return "PDF Processed Successfully"


def search_pdf(query):
    vectorstore = Chroma(
        persist_directory=DB_PATH,
        embedding_function=embedding
    )

    results = vectorstore.similarity_search(query, k=3)

    context = "\n".join([doc.page_content for doc in results])

    return context
