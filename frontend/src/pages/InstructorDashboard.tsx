import React, { useEffect, useState } from 'react';
import { Calendar, Users, TrendingUp, Clock, AlertCircle, Loader, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { slotsAPI, bookingsAPI, progressAPI } from '../lib/api';
import type { AvailabilitySlot, Booking, StudentProgress } from '../types';

const InstructorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Slot creation form
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [newSlot, setNewSlot] = useState({ date: '', timeWindow: '', vehicle: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [slotsRes, bookingsRes] = await Promise.all([
          slotsAPI.getMySchedule(),
          bookingsAPI.getMyLessons(),
        ]);
        setSlots(slotsRes.data);
        setBookings(bookingsRes.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await slotsAPI.create(newSlot);
      setSlots([...slots, res.data]);
      setShowSlotForm(false);
      setNewSlot({ date: '', timeWindow: '', vehicle: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create slot');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await slotsAPI.delete(slotId);
      setSlots(slots.filter(s => s.id !== slotId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete slot');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  const bookedSlots = slots.filter(s => s.isBooked);
  const availableSlots = slots.filter(s => !s.isBooked);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Instructor Dashboard
          </h1>
          <p className="text-slate-400">Manage your schedule and track student progress</p>
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
                <p className="text-slate-400 text-sm">Available Slots</p>
                <p className="text-white text-2xl font-bold mt-1">{availableSlots.length}</p>
              </div>
              <Calendar className="text-emerald-400" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Booked Lessons</p>
                <p className="text-white text-2xl font-bold mt-1">{bookedSlots.length}</p>
              </div>
              <Clock className="text-blue-400" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Students</p>
                <p className="text-white text-2xl font-bold mt-1">{new Set(bookings.map(b => b.studentId)).size}</p>
              </div>
              <Users className="text-purple-400" size={32} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-500/20 to-amber-600/20 border border-amber-500/50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">This Week</p>
                <p className="text-white text-2xl font-bold mt-1">
                  {bookedSlots.filter(s => {
                    const slotDate = new Date(s.date);
                    const now = new Date();
                    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return slotDate >= now && slotDate <= weekFromNow;
                  }).length}
                </p>
              </div>
              <TrendingUp className="text-amber-400" size={32} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Lessons */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Clock size={24} className="text-emerald-400" />
                Upcoming Lessons
              </h2>
              <button
                onClick={() => setShowSlotForm(!showSlotForm)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
              >
                <Plus size={18} />
                Add Slot
              </button>
            </div>

            {showSlotForm && (
              <form onSubmit={handleCreateSlot} className="mb-6 bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                    <input
                      type="date"
                      value={newSlot.date}
                      onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Time</label>
                    <input
                      type="time"
                      value={newSlot.timeWindow}
                      onChange={(e) => setNewSlot({ ...newSlot, timeWindow: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Vehicle</label>
                    <select
                      value={newSlot.vehicle}
                      onChange={(e) => setNewSlot({ ...newSlot, vehicle: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                      required
                    >
                      <option value="">Select vehicle</option>
                      <option value="Toyota Hilux 2.4D (Manual - Code 10)">Toyota Hilux 2.4D (Manual - Code 10)</option>
                      <option value="VW Polo 1.4 (Manual - Code 8)">VW Polo 1.4 (Manual - Code 8)</option>
                      <option value="Toyota Corolla 1.6 (Manual - Code 8)">Toyota Corolla 1.6 (Manual - Code 8)</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
                  >
                    Create Slot
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSlotForm(false)}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {bookedSlots.length === 0 ? (
              <div className="text-center py-12">
                <Clock size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No upcoming lessons booked</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookedSlots.slice(0, 5).map((slot) => (
                  <div key={slot.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">{slot.date}</p>
                        <p className="text-emerald-400 text-sm">{slot.timeWindow} · {slot.vehicle}</p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-medium">
                        Booked
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm">Student ID: {slot.studentId?.slice(0, 8)}...</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Available Slots */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Calendar size={24} className="text-emerald-400" />
              Available Slots
            </h2>

            {availableSlots.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-slate-600 mb-4" />
                <p className="text-slate-400">No available slots</p>
                <p className="text-slate-500 text-sm mt-2">Add slots to let students book lessons</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableSlots.map((slot) => (
                  <div key={slot.id} className="bg-slate-700/30 rounded-lg p-4 border border-slate-600">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-semibold">{slot.date}</p>
                        <p className="text-emerald-400 text-sm">{slot.timeWindow} · {slot.vehicle}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteSlot(slot.id)}
                        className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition"
                        title="Delete slot"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstructorDashboard;
