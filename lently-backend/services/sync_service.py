import uuid
from datetime import datetime
from typing import Tuple, List, Dict, Any

from config.firebase import get_db
from services.youtube_service import youtube_service
from services.gemini_service import gemini_service
from services.alert_service import alert_service
from services.ai_reply_service import ai_reply_service
from config.settings import settings


class SyncService:
    """Service to handle end-to-end video sync: validate → fetch comments → analyze → store results"""

    def __init__(self):
        self.db = get_db()

    def create_sync_job(self, user_id: str, youtube_url: str) -> Tuple[str, str]:
        """
        Create a sync job and initial video document in Firestore.
        Returns (job_id, video_id)
        """
        # Generate job id
        job_id = f"job_{uuid.uuid4().hex}"

        # Extract video id
        video_id = youtube_service.extract_video_id(youtube_url)

        # Fetch video metadata
        metadata = youtube_service.get_video_metadata(video_id) or {}

        now = datetime.utcnow().isoformat() + "Z"

        # Create or update video document
        video_doc = {
            'userId': user_id,
            'youtubeVideoId': video_id,
            'title': metadata.get('title'),
            'description': metadata.get('description'),
            'thumbnailUrl': metadata.get('thumbnailUrl'),
            'viewCount': metadata.get('viewCount', 0),
            'likeCount': metadata.get('likeCount', 0),
            'commentCount': metadata.get('commentCount', 0),
            'publishedAt': metadata.get('publishedAt'),
            'syncStatus': 'queued',
            'syncProgress': 0,
            'createdAt': now,
            'stats': {}
        }

        self.db.collection('videos').document(video_id).set(video_doc)

        # Create sync job document
        job_doc = {
            'jobId': job_id,
            'userId': user_id,
            'videoId': video_id,
            'status': 'queued',
            'progress': 0,
            'totalComments': metadata.get('commentCount', 0),
            'processedComments': 0,
            'error': None,
            'createdAt': now,
            'completedAt': None
        }

        self.db.collection('sync_jobs').document(job_id).set(job_doc)

        return job_id, video_id

    def update_job_progress(self, job_id: str, progress: int, status: str, processed_comments: int = 0, error: str = None):
        """Update job document with progress and status"""
        update = {
            'progress': progress,
            'status': status,
            'processedComments': processed_comments,
        }
        if error is not None:
            update['error'] = error
        if progress >= 100 or status == 'completed':
            update['completedAt'] = datetime.utcnow().isoformat() + "Z"

        self.db.collection('sync_jobs').document(job_id).update(update)

    def process_sync_job(self, job_id: str) -> Dict[str, Any]:
        """
        Process the sync job end-to-end.
        Steps:
        - mark processing
        - fetch all comments
        - store raw comments
        - analyze in batches
        - update comments with analysis
        - compute aggregate stats and update video
        - mark job completed
        """
        try:
            job_ref = self.db.collection('sync_jobs').document(job_id)
            job_snap = job_ref.get()
            if not job_snap.exists:
                raise Exception("Job not found")

            job = job_snap.to_dict()
            video_id = job.get('videoId')
            user_id = job.get('userId')

            # Update status to processing
            job_ref.update({'status': 'processing', 'progress': 10})
            self.db.collection('videos').document(video_id).update({'syncStatus': 'processing', 'syncProgress': 10})

            # Fetch all comments from YouTube
            comments = youtube_service.get_all_comments(video_id)
            total_comments = len(comments)

            # Update job totalComments
            job_ref.update({'totalComments': total_comments})

            # Store raw comments in Firestore
            for c in comments:
                comment_id = c.get('id') or c.get('youtubeCommentId')
                doc = {
                    'videoId': video_id,
                    'userId': user_id,
                    'youtubeCommentId': comment_id,
                    'author': c.get('author'),
                    'text': c.get('text'),
                    'likeCount': int(c.get('likeCount') or 0),
                    'publishedAt': c.get('publishedAt'),
                    'analyzed': False
                }
                # Use youtube comment id as document id to avoid duplicates
                try:
                    self.db.collection('comments').document(comment_id).set(doc)
                except Exception:
                    # If a comment fails to write, continue
                    pass

            # Update progress halfway
            job_ref.update({'progress': 50})
            self.db.collection('videos').document(video_id).update({'syncProgress': 50})

            # Prepare comments for analysis (list with id and text)
            analysis_input = [{'id': c.get('id'), 'text': c.get('text', '')} for c in comments]

            # Call Gemini analysis in batches via gemini_service
            analyses = gemini_service.analyze_comments_batch(analysis_input, batch_size=50)

            # Update each comment with analysis
            processed = 0
            category_counts = {}
            sentiment_sum = 0.0

            for a in analyses:
                comment_id = a.get('commentId')
                # Flatten the analysis data into the comment document
                update_data = {
                    'analyzed': True,
                    'category': a.get('category'),
                    'sentimentScore': a.get('sentimentScore'),
                    'sentimentLabel': a.get('sentimentLabel'),
                    'toxicityScore': a.get('toxicityScore'),
                    'extractedQuestion': a.get('extractedQuestion')
                }
                try:
                    self.db.collection('comments').document(comment_id).update(update_data)
                except Exception:
                    # Try set if update fails (missing doc)
                    try:
                        self.db.collection('comments').document(comment_id).set(update_data, merge=True)
                    except Exception:
                        pass

                processed += 1
                cat = a.get('category') or 'neutral'
                category_counts[cat] = category_counts.get(cat, 0) + 1
                sentiment_sum += float(a.get('sentimentScore') or 0)

                # Periodically update job progress
                if processed % 50 == 0:
                    percent = 50 + int((processed / max(1, total_comments)) * 45)
                    job_ref.update({'processedComments': processed, 'progress': percent})
                    self.db.collection('videos').document(video_id).update({'syncProgress': percent})

            # Final progress update
            job_ref.update({'processedComments': processed, 'progress': 95})
            self.db.collection('videos').document(video_id).update({'syncProgress': 95})

            # Compute aggregate stats
            avg_sentiment = (sentiment_sum / processed) if processed else 0.0
            stats = {
                'totalComments': total_comments,
                'categoryCounts': category_counts,
                'avgSentiment': avg_sentiment
            }

            # Update video document with stats and mark completed
            self.db.collection('videos').document(video_id).update({
                'syncStatus': 'completed',
                'syncProgress': 100,
                'stats': stats,
                'lastSyncedAt': datetime.utcnow().isoformat() + "Z"
            })

            # Mark job completed
            job_ref.update({'status': 'completed', 'progress': 100, 'completedAt': datetime.utcnow().isoformat() + "Z"})

            # Run alert checks after analysis completes
            print(f"Running alert checks for video {video_id}")
            import asyncio
            try:
                # Run alert checks asynchronously
                asyncio.create_task(alert_service.run_alert_checks(video_id, user_id))
            except Exception as alert_error:
                print(f"Error running alert checks: {alert_error}")
                # Don't fail the entire sync if alerts fail

            # Auto-generate AI replies for top 3 common questions
            print(f"Generating AI replies for top questions in video {video_id}")
            try:
                # Extract common questions
                common_questions = ai_reply_service.extract_common_questions(video_id)
                
                # Generate replies for top 3 questions
                video_ref = self.db.collection('videos').document(video_id)
                video_data = video_ref.get().to_dict()
                
                video_context = {
                    'channelName': video_data.get('channelName'),
                    'videoTitle': video_data.get('title'),
                    'videoId': video_id
                }
                
                for question_data in common_questions[:3]:
                    try:
                        # Generate reply
                        reply_text = asyncio.run(ai_reply_service.generate_reply(
                            user_id=user_id,
                            question=question_data['question'],
                            video_context=video_context
                        ))
                        
                        # Save reply
                        asyncio.run(ai_reply_service.save_reply(
                            user_id=user_id,
                            question=question_data['question'],
                            reply_text=reply_text,
                            video_ids=[video_id]
                        ))
                        
                        print(f"Generated reply for: {question_data['question'][:50]}...")
                    except Exception as reply_error:
                        print(f"Error generating reply for question: {reply_error}")
                        continue
                        
            except Exception as gen_error:
                print(f"Error in AI reply auto-generation: {gen_error}")
                # Don't fail the entire sync if reply generation fails

            return {'jobId': job_id, 'videoId': video_id, 'status': 'completed', 'stats': stats}

        except Exception as e:
            # Try to mark job as failed
            try:
                self.db.collection('sync_jobs').document(job_id).update({'status': 'failed', 'error': str(e), 'progress': 0, 'completedAt': datetime.utcnow().isoformat() + "Z"})
            except Exception:
                pass
            # Also update video status
            try:
                if 'video_id' in locals():
                    self.db.collection('videos').document(video_id).update({'syncStatus': 'failed', 'syncProgress': 0})
            except Exception:
                pass

            raise


# Create a singleton instance
sync_service = SyncService()
