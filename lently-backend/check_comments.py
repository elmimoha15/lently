"""Check comment structure in Firestore"""
from config.firebase import get_db
import json

db = get_db()
comments = db.collection('comments').where('videoId', '==', 'poQMJmE57N4').limit(2).stream()

print("=" * 60)
print("COMMENT STRUCTURE IN FIRESTORE:")
print("=" * 60)

for doc in comments:
    data = doc.to_dict()
    print(json.dumps(data, indent=2, default=str))
    print("\n" + "=" * 60 + "\n")
