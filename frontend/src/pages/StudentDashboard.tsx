import React, { useEffect, useState } from 'react';
import { BookOpen, TrendingUp, Calendar, FileText, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { progressAPI, bookingsAPI } from '../lib/api';
import type { StudentProgress, Booking } from '../types';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user?.id) return;
        const [progressRes, bookingsRes] = await Promise.all([
          progressAPI.get(user.id),
          bookingsAPI.getMyLessons(),
        ]);
        setProgress(progressRes.data);
        setBookings(bookingsRes.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  const upcomingBookings = bookings.filter((b) => b.status === 'CONFIRMED').slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome, {user?.name}! 👋
          </h1>
          <p className="text-slate-400">Track your progress and manage your driving lessons</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">License Track</p>
                <p className="text-white text-2xl font-bold mt-1">{progress?.track || 'N/A'}</p>
              </div>
              <FileText className="text-emerald-400" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Progress</p>
                <p className="text-white text-2xl font-bold mt-1">{progress?.progressPct || 0}%</p>
              </div>
              <TrendingUp className="text-blue-400" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Rating</p>
                <p className="text-white text-2xl font-bold mt-1">⭐ {progress?.rating?.toFixed(1) || 'N/A'}</p>
              </div>
              <TrendingUp className="text-purple-400" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Lessons</p>
                <p className="text-white text-2xl font-bold mt-1">{progress?.completedLessons || 0}/{progress?.totalLessons || 20}</p>
              </div>
              <BookOpen className="text-amber-400" size={32} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upcoming Lessons */}
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar size={24} className="text-emerald-400" />
              Upcoming Lessons
            </h2>

            {upcomingBookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No upcoming lessons booked</p>
                <p className="text-slate-500 text-sm mt-2">Visit the Booking page to reserve your next lesson</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => (
                  <div key={booking.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">{booking.slot?.date}</p>
                        <p className="text-emerald-400 text-sm">
                          {booking.slot?.timeWindow} · {booking.slot?.vehicle}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                        {booking.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">
                      Instructor: <span className="text-white font-medium">{booking.slot?.instructor?.name}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress Note */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Instructor Notes</h2>
            <div className="bg-slate-700/30 rounded-lg p-4 border-l-4 border-emerald-500">
              <p className="text-slate-300">
                {progress?.lessonNotes || 'No notes yet. Your instructor will add feedback after each lesson.'}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Completed:</span>
                <span className="text-white font-semibold">{progress?.completedLessons || 0} lessons</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Remaining:</span>
                <span className="text-white font-semibold">
                  {Math.max(0, (progress?.totalLessons || 20) - (progress?.completedLessons || 0))} lessons
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mt-4">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress?.progressPct || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Lesson History</h2>
          {bookings.length === 0 ? (
            <p className="text-slate-400 text-center py-8">No lessons yet</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookings.slice(0, 6).map((booking) => (
                <div key={booking.id} className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
                  <div className="text-sm">
                    <p className="text-slate-300">{booking.slot?.date}</p>
                    <p className="text-emerald-400 text-xs mt-1">{booking.slot?.timeWindow}</p>
                    <p className="text-slate-500 text-xs mt-2 truncate">{booking.slot?.vehicle}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

