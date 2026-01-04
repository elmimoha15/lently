"""Clear all cached AI answers"""
from config.firebase import get_db

db = get_db()

# Delete all cached answers
cache_ref = db.collection('answer_cache')
docs = cache_ref.stream()

deleted_count = 0
for doc in docs:
    print(f"Deleting cache: {doc.id}")
    doc.reference.delete()
    deleted_count += 1

print(f"\n✅ Cleared {deleted_count} cached answers")
print("Now try asking your question again in Swagger UI!")
