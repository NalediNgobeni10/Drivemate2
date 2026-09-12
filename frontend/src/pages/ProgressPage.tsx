//SESETHU NCITI 231118384//
import React, { useEffect, useState } from 'react';
import { TrendingUp, BookOpen, Star, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { progressAPI, feedbackAPI, bookingsAPI } from '../lib/api';
import type { StudentProgress, Feedback, Booking } from '../types';

const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [history, setHistory] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) return;
        
        if (user.role === 'INSTRUCTOR') {
          // Instructors see all their students' progress through bookings
          const bookingsRes = await bookingsAPI.getMyLessons();
          setHistory(bookingsRes.data);
        } else {
          // Students see their own progress
          const [progressRes, feedbackRes, historyRes] = await Promise.all([
            progressAPI.get(user.id),
            feedbackAPI.get(user.id),
            bookingsAPI.getMyLessons(),
          ]);
          setProgress(progressRes.data);
          setFeedback(feedbackRes.data);
          setHistory(historyRes.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id, user?.role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (user?.role === 'INSTRUCTOR') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition mb-4"
            >
              <ArrowLeft size={18} />
              <span>Back to Dashboard</span>
            </Link>
            <h1 className="text-3xl font-bold text-white mb-2">My Students</h1>
            <p className="text-slate-400">View and manage student progress</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} className="text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          )}

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No students assigned yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((booking) => (
                  <div key={booking.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-semibold">Student ID: {booking.studentId.slice(0, 8)}...</p>
                        <p className="text-emerald-400 text-sm">{booking.slot?.date} · {booking.slot?.timeWindow}</p>
                        <p className="text-slate-400 text-sm mt-1">{booking.slot?.vehicle}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                        booking.status === 'CONFIRMED' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition mb-4"
          >
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Lesson Progress</h1>
          <p className="text-slate-400">Track your driving lesson progress and feedback</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {progress && (
          <>
            {/* Progress Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">License Track</p>
                    <p className="text-white text-2xl font-bold mt-1">{progress.track.replace('_', ' ')}</p>
                  </div>
                  <BookOpen className="text-emerald-400" size={32} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Progress</p>
                    <p className="text-white text-2xl font-bold mt-1">{progress.progressPct}%</p>
                  </div>
                  <TrendingUp className="text-blue-400" size={32} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Rating</p>
                    <p className="text-white text-2xl font-bold mt-1 flex items-center gap-2">
                      <Star size={20} className="text-amber-400 fill-amber-400" />
                      {progress.rating.toFixed(1)}
                    </p>
                  </div>
                  <Star className="text-purple-400" size={32} />
                </div>
              </div>

              <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/50 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Lessons</p>
                    <p className="text-white text-2xl font-bold mt-1">{progress.completedLessons}/{progress.totalLessons}</p>
                  </div>
                  <BookOpen className="text-amber-400" size={32} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Progress Details */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Progress Details</h2>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-slate-700">
                    <span className="text-slate-400">License Track</span>
                    <span className="text-white font-medium">{progress.track.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-700">
                    <span className="text-slate-400">Progress</span>
                    <span className="text-white font-medium">{progress.progressPct}%</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-700">
                    <span className="text-slate-400">Rating</span>
                    <span className="text-white font-medium flex items-center gap-1">
                      <Star size={16} className="text-amber-400 fill-amber-400" />
                      {progress.rating.toFixed(1)}/5
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-700">
                    <span className="text-slate-400">Completed Lessons</span>
                    <span className="text-white font-medium">{progress.completedLessons}/{progress.totalLessons}</span>
                  </div>
                  <div className="py-2">
                    <span className="text-slate-400 block mb-2">Instructor Notes</span>
                    <p className="text-white bg-slate-700/30 rounded-lg p-3">{progress.lessonNotes || 'No notes yet'}</p>
                  </div>
                </div>
              </div>

              {/* Feedback History */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-6">Feedback History</h2>

                {feedback.length === 0 ? (
                  <div className="text-center py-8">
                    <Star size={32} className="mx-auto text-slate-600 mb-2" />
                    <p className="text-slate-400 text-sm">No feedback received yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {feedback.map((f) => (
                      <div key={f.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white font-medium">{f.author?.name}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={16}
                                className={i < f.ratingScore ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-slate-300 text-sm">{f.evaluationNotes}</p>
                        <p className="text-slate-500 text-xs mt-2">{new Date(f.createdAt).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Lesson History */}
            <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-6">Lesson History</h2>

              {history.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No lessons completed yet</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {history.map((booking) => (
                    <div key={booking.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-white font-semibold">{booking.slot?.date}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          booking.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                          booking.status === 'CONFIRMED' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-emerald-400 text-sm">{booking.slot?.timeWindow}</p>
                      <p className="text-slate-400 text-sm mt-1">{booking.slot?.vehicle}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProgressPage;
