"""
Script to re-analyze comments for a video that was already synced.
This updates existing comments with category, sentiment, etc.
"""
import sys
from config.firebase import get_db
from services.gemini_service import gemini_service
from config.settings import settings

def reanalyze_video_comments(video_id: str):
    """Re-analyze all comments for a video"""
    db = get_db()
    
    print(f"📊 Fetching comments for video: {video_id}")
    
    # Get all comments for this video
    comments_ref = db.collection('comments').where('videoId', '==', video_id)
    comments_docs = list(comments_ref.stream())
    
    if not comments_docs:
        print(f"❌ No comments found for video {video_id}")
        return
    
    print(f"✅ Found {len(comments_docs)} comments")
    
    # Prepare comments for analysis
    comments_to_analyze = []
    for doc in comments_docs:
        data = doc.to_dict()
        comments_to_analyze.append({
            'id': doc.id,
            'text': data.get('text', '')
        })
    
    print(f"🤖 Analyzing comments with Gemini AI...")
    
    # Analyze comments in batches
    analyses = gemini_service.analyze_comments_batch(comments_to_analyze, batch_size=30)
    
    print(f"✅ Analysis complete. Updating {len(analyses)} comments...")
    
    # Update each comment with analysis
    category_counts = {}
    updated = 0
    
    for analysis in analyses:
        comment_id = analysis.get('commentId')
        
        # Flatten the analysis data
        update_data = {
            'analyzed': True,
            'category': analysis.get('category'),
            'sentimentScore': analysis.get('sentimentScore'),
            'sentimentLabel': analysis.get('sentimentLabel'),
            'toxicityScore': analysis.get('toxicityScore'),
            'extractedQuestion': analysis.get('extractedQuestion')
        }
        
        try:
            db.collection('comments').document(comment_id).update(update_data)
            updated += 1
            
            # Track category counts
            cat = analysis.get('category', 'neutral')
            category_counts[cat] = category_counts.get(cat, 0) + 1
            
            if updated % 10 == 0:
                print(f"   Updated {updated}/{len(analyses)} comments...")
        except Exception as e:
            print(f"⚠️  Failed to update comment {comment_id}: {e}")
    
    # Update video stats
    sentiment_sum = sum(a.get('sentimentScore', 0) for a in analyses)
    avg_sentiment = sentiment_sum / len(analyses) if analyses else 0
    
    stats = {
        'totalComments': len(comments_docs),
        'categoryCounts': category_counts,
        'avgSentiment': avg_sentiment
    }
    
    db.collection('videos').document(video_id).update({
        'stats': stats,
        'syncStatus': 'completed'
    })
    
    print(f"\n✅ Successfully updated {updated} comments!")
    print(f"📊 Category breakdown:")
    for category, count in sorted(category_counts.items()):
        percentage = (count / len(analyses)) * 100 if analyses else 0
        print(f"   {category}: {count} ({percentage:.1f}%)")
    print(f"📈 Average sentiment: {avg_sentiment:.2f}")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python reanalyze_video.py <video_id>")
        print("Example: python reanalyze_video.py BmDQTvpgp-0")
        sys.exit(1)
    
    video_id = sys.argv[1]
    reanalyze_video_comments(video_id)
