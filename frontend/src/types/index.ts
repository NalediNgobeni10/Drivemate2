// Frontend type definitions
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN';
  title?: string;
  phone?: string;
  bio?: string;
  createdAt: string;
}

export interface StudentProgress {
  id: string;
  studentId: string;
  track: 'CODE_8' | 'CODE_10';
  progressPct: number;
  rating: number;
  lessonNotes?: string;
  completedLessons: number;
  totalLessons: number;
  createdAt: string;
  updatedAt: string;
  feedbackReceived?: Feedback[];
}

export interface AvailabilitySlot {
  id: string;
  instructorId: string;
  date: string;
  timeWindow: string;
  vehicle: string;
  vehicleId?: string;
  isBooked: boolean;
  studentId?: string;
  instructor?: { id: string; name: string };
  booking?: { id: string; status: string; student?: { id: string; name: string } };
  createdAt: string;
}

export interface Booking {
  id: string;
  slotId: string;
  studentId: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  slot?: AvailabilitySlot;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  packageType: string;
  lessonsIncluded: number;
  student?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface LessonCredits {
  totalPaidLessons: number;
  usedLessons: number;
  availableCredits: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Feedback {
  id: string;
  studentId: string;
  authorId: string;
  author?: { name: string };
  ratingScore: number;
  evaluationNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string;
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  licenseCode: string;
  score: number;
  total: number;
  percentScore: number;
  passed: boolean;
  createdAt: string;
  answers?: string;
}

export interface QuizQuestion {
  id: string;
  category: string;
  code: string;
  question: string;
  options: string[];
}

export interface MessageThread {
  peerId: string;
  peer: { id: string; name: string; role: string };
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
}

export type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
};

