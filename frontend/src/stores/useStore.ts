import { create } from 'zustand';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: 'starter' | 'pro' | 'business';
  planDaysLeft: number;
}

export interface Video {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  views: number;
  likes: number;
  commentCount: number;
  sentimentScore: number;
  sentimentLabel: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative';
}

export interface Comment {
  id: string;
  videoId: string;
  author: string;
  authorAvatar: string;
  text: string;
  publishedAt: string;
  likeCount: number;
  replyCount: number;
  category: 'question' | 'praise' | 'complaint' | 'spam' | 'suggestion' | 'toxic';
  sentiment: number;
  isFlagged: boolean;
}

export interface Alert {
  id: string;
  type: 'spike' | 'sentiment' | 'toxic' | 'viral';
  title: string;
  description: string;
  videoId: string;
  videoTitle: string;
  createdAt: string;
  isRead: boolean;
}

export interface Question {
  id: string;
  text: string;
  count: number;
  videoIds: string[];
  isAnswered: boolean;
  sampleCommentIds: string[];
}

export interface Template {
  id: string;
  name: string;
  category: string;
  text: string;
  useCount: number;
}

export interface Filters {
  search: string;
  category: string | null;
  sentiment: string | null;
  dateRange: { start: string | null; end: string | null };
  sortBy: string;
}

interface Store {
  // Data
  user: User;
  videos: Video[];
  comments: Comment[];
  alerts: Alert[];
  questions: Question[];
  templates: Template[];
  
  // UI State
  filters: Filters;
  selectedVideoId: string | null;
  sidebarOpen: boolean;
  
  // Actions
  setSelectedVideo: (id: string | null) => void;
  updateFilters: (filters: Partial<Filters>) => void;
  resetFilters: () => void;
  markAlertRead: (id: string) => void;
  markAllAlertsRead: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  markQuestionAnswered: (id: string) => void;
  addTemplate: (template: Omit<Template, 'id' | 'useCount'>) => void;
  deleteTemplate: (id: string) => void;
}

// Dummy data
const dummyUser: User = {
  id: '1',
  name: 'Alex Chen',
  email: 'alex@example.com',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alex',
  plan: 'pro',
  planDaysLeft: 23,
};

const dummyVideos: Video[] = [
  {
    id: '1',
    title: 'How to Start a YouTube Channel in 2024',
    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=320&h=180&fit=crop',
    publishedAt: '2024-12-07',
    views: 45200,
    likes: 1200,
    commentCount: 543,
    sentimentScore: 45,
    sentimentLabel: 'positive',
  },
  {
    id: '2',
    title: 'My Morning Routine as a Content Creator',
    thumbnail: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=320&h=180&fit=crop',
    publishedAt: '2024-11-21',
    views: 32100,
    likes: 890,
    commentCount: 378,
    sentimentScore: 62,
    sentimentLabel: 'very_positive',
  },
  {
    id: '3',
    title: 'Why I Quit My Job to Make Videos',
    thumbnail: 'https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=320&h=180&fit=crop',
    publishedAt: '2024-10-21',
    views: 89500,
    likes: 2300,
    commentCount: 892,
    sentimentScore: 28,
    sentimentLabel: 'positive',
  },
  {
    id: '4',
    title: 'Camera Gear I Actually Use',
    thumbnail: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=320&h=180&fit=crop',
    publishedAt: '2024-11-28',
    views: 28700,
    likes: 654,
    commentCount: 289,
    sentimentScore: 51,
    sentimentLabel: 'positive',
  },
  {
    id: '5',
    title: 'Responding to Your Questions',
    thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=320&h=180&fit=crop',
    publishedAt: '2024-12-14',
    views: 15300,
    likes: 432,
    commentCount: 187,
    sentimentScore: 73,
    sentimentLabel: 'very_positive',
  },
  {
    id: '6',
    title: 'The Truth About YouTube Algorithm',
    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=320&h=180&fit=crop',
    publishedAt: '2024-09-15',
    views: 67800,
    likes: 1890,
    commentCount: 623,
    sentimentScore: 35,
    sentimentLabel: 'positive',
  },
  {
    id: '7',
    title: 'Studio Tour 2024',
    thumbnail: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=320&h=180&fit=crop',
    publishedAt: '2024-08-10',
    views: 41200,
    likes: 1100,
    commentCount: 412,
    sentimentScore: 58,
    sentimentLabel: 'positive',
  },
  {
    id: '8',
    title: 'How I Edit My Videos (Full Tutorial)',
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=320&h=180&fit=crop',
    publishedAt: '2024-07-22',
    views: 52300,
    likes: 1450,
    commentCount: 534,
    sentimentScore: 48,
    sentimentLabel: 'positive',
  },
];

const dummyComments: Comment[] = [
  {
    id: 'c1',
    videoId: '1',
    author: 'TechEnthusiast',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tech',
    text: 'Great video! Can you make a tutorial on editing?',
    publishedAt: '2024-12-19',
    likeCount: 45,
    replyCount: 3,
    category: 'question',
    sentiment: 0.8,
    isFlagged: false,
  },
  {
    id: 'c2',
    videoId: '1',
    author: 'CreatorFan',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=fan',
    text: 'This helped me so much, thank you! ❤️',
    publishedAt: '2024-12-18',
    likeCount: 89,
    replyCount: 1,
    category: 'praise',
    sentiment: 0.9,
    isFlagged: false,
  },
  {
    id: 'c3',
    videoId: '1',
    author: 'AudioCritic',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=audio',
    text: 'The audio quality is terrible 😞',
    publishedAt: '2024-12-17',
    likeCount: 12,
    replyCount: 5,
    category: 'complaint',
    sentiment: -0.6,
    isFlagged: false,
  },
  {
    id: 'c4',
    videoId: '1',
    author: 'SpamBot123',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=spam',
    text: 'First! 🔥🔥🔥',
    publishedAt: '2024-12-16',
    likeCount: 2,
    replyCount: 0,
    category: 'spam',
    sentiment: 0,
    isFlagged: false,
  },
  {
    id: 'c5',
    videoId: '1',
    author: 'ContentLover',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lover',
    text: 'Would love to see more content like this!',
    publishedAt: '2024-12-15',
    likeCount: 67,
    replyCount: 2,
    category: 'suggestion',
    sentiment: 0.7,
    isFlagged: false,
  },
  {
    id: 'c6',
    videoId: '1',
    author: 'ToxicTroll',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=troll',
    text: 'This is garbage, unsubscribed',
    publishedAt: '2024-12-14',
    likeCount: 3,
    replyCount: 8,
    category: 'toxic',
    sentiment: -0.9,
    isFlagged: true,
  },
  {
    id: 'c7',
    videoId: '2',
    author: 'MorningPerson',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=morning',
    text: 'What camera do you use for your vlogs?',
    publishedAt: '2024-12-10',
    likeCount: 34,
    replyCount: 4,
    category: 'question',
    sentiment: 0.5,
    isFlagged: false,
  },
  {
    id: 'c8',
    videoId: '2',
    author: 'RoutineFollower',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=routine',
    text: 'I started following this routine and it changed my life!',
    publishedAt: '2024-12-08',
    likeCount: 156,
    replyCount: 12,
    category: 'praise',
    sentiment: 0.95,
    isFlagged: false,
  },
  {
    id: 'c9',
    videoId: '3',
    author: 'CareerAdvice',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=career',
    text: 'How do you handle the financial uncertainty?',
    publishedAt: '2024-11-25',
    likeCount: 78,
    replyCount: 15,
    category: 'question',
    sentiment: 0.3,
    isFlagged: false,
  },
  {
    id: 'c10',
    videoId: '4',
    author: 'GearHead',
    authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gear',
    text: 'What lens do you use for your B-roll shots?',
    publishedAt: '2024-12-01',
    likeCount: 42,
    replyCount: 6,
    category: 'question',
    sentiment: 0.6,
    isFlagged: false,
  },
];

const dummyAlerts: Alert[] = [
  {
    id: 'a1',
    type: 'spike',
    title: 'Comment Spike Detected',
    description: 'Video has 5x normal comments in the last hour!',
    videoId: '1',
    videoTitle: 'How to Start a YouTube Channel in 2024',
    createdAt: '2024-12-21T10:30:00Z',
    isRead: false,
  },
  {
    id: 'a2',
    type: 'sentiment',
    title: 'Sentiment Drop Alert',
    description: 'Sentiment dropped 30% compared to yesterday',
    videoId: '3',
    videoTitle: 'Why I Quit My Job to Make Videos',
    createdAt: '2024-12-20T15:45:00Z',
    isRead: false,
  },
  {
    id: 'a3',
    type: 'viral',
    title: 'Viral Comment',
    description: 'A comment has received 500+ likes',
    videoId: '2',
    videoTitle: 'My Morning Routine as a Content Creator',
    createdAt: '2024-12-19T09:20:00Z',
    isRead: true,
  },
  {
    id: 'a4',
    type: 'toxic',
    title: 'Toxic Comments Detected',
    description: '3 toxic comments detected and flagged',
    videoId: '4',
    videoTitle: 'Camera Gear I Actually Use',
    createdAt: '2024-12-18T14:10:00Z',
    isRead: true,
  },
];

const dummyQuestions: Question[] = [
  {
    id: 'q1',
    text: 'What camera do you use?',
    count: 23,
    videoIds: ['1', '2', '4'],
    isAnswered: false,
    sampleCommentIds: ['c7', 'c10'],
  },
  {
    id: 'q2',
    text: 'How do you edit your videos?',
    count: 18,
    videoIds: ['1', '8'],
    isAnswered: true,
    sampleCommentIds: ['c1'],
  },
  {
    id: 'q3',
    text: 'Can you make a tutorial on thumbnails?',
    count: 15,
    videoIds: ['1', '6'],
    isAnswered: false,
    sampleCommentIds: [],
  },
  {
    id: 'q4',
    text: "What's your upload schedule?",
    count: 12,
    videoIds: ['2', '5'],
    isAnswered: true,
    sampleCommentIds: [],
  },
  {
    id: 'q5',
    text: 'Do you use Adobe Premiere or Final Cut?',
    count: 11,
    videoIds: ['8'],
    isAnswered: false,
    sampleCommentIds: [],
  },
];

const dummyTemplates: Template[] = [
  {
    id: 't1',
    name: 'Thank You Reply',
    category: 'General',
    text: 'Thanks so much for watching! ❤️',
    useCount: 45,
  },
  {
    id: 't2',
    name: 'Answer FAQ',
    category: 'FAQ',
    text: 'Great question! I actually covered this in {video}...',
    useCount: 32,
  },
  {
    id: 't3',
    name: 'Tutorial Request',
    category: 'Requests',
    text: "I'll definitely consider making a video about {topic}!",
    useCount: 28,
  },
  {
    id: 't4',
    name: 'Camera Question',
    category: 'Gear',
    text: "I'm currently using the Sony A7IV with a 24-70mm lens!",
    useCount: 56,
  },
  {
    id: 't5',
    name: 'Constructive Response',
    category: 'Feedback',
    text: 'Thanks for the feedback! I really appreciate you taking the time to share your thoughts.',
    useCount: 19,
  },
];

const defaultFilters: Filters = {
  search: '',
  category: null,
  sentiment: null,
  dateRange: { start: null, end: null },
  sortBy: 'recent',
};

export const useStore = create<Store>((set) => ({
  // Data
  user: dummyUser,
  videos: dummyVideos,
  comments: dummyComments,
  alerts: dummyAlerts,
  questions: dummyQuestions,
  templates: dummyTemplates,
  
  // UI State
  filters: defaultFilters,
  selectedVideoId: null,
  sidebarOpen: true,
  
  // Actions
  setSelectedVideo: (id) => set({ selectedVideoId: id }),
  
  updateFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),
  
  resetFilters: () => set({ filters: defaultFilters }),
  
  markAlertRead: (id) =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === id ? { ...alert, isRead: true } : alert
      ),
    })),
  
  markAllAlertsRead: () =>
    set((state) => ({
      alerts: state.alerts.map((alert) => ({ ...alert, isRead: true })),
    })),
  
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  
  markQuestionAnswered: (id) =>
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id ? { ...q, isAnswered: true } : q
      ),
    })),
  
  addTemplate: (template) =>
    set((state) => ({
      templates: [
        ...state.templates,
        {
          ...template,
          id: `t${Date.now()}`,
          useCount: 0,
        },
      ],
    })),
  
  deleteTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    })),
}));
