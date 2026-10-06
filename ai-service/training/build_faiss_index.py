from app.services.similarity import similarity_engine


print("Building CivicResolve FAISS index...")

similarity_engine.build_index()

print("Done.")