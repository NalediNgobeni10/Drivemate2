import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Car, AlertCircle, Loader, Plus, Trash2, User, CheckCircle } from 'lucide-react';
import { slotsAPI } from '../lib/api';
import type { AvailabilitySlot } from '../types';

const VEHICLES = [
  'Toyota Hilux 2.4D (Manual - Code 10)',
  'VW Polo 1.4 (Manual - Code 8)',
  'Toyota Corolla 1.6 (Manual - Code 8)',
  'Nissan NV200 (Manual - Code 8)',
];

const InstructorSchedule: React.FC = () => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSlotForm, setShowSlotForm] = useState(false);
  const [newSlot, setNewSlot] = useState({ date: '', timeWindow: '', vehicle: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await slotsAPI.getMySchedule();
      setSlots(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load your schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await slotsAPI.create(newSlot);
      setShowSlotForm(false);
      setNewSlot({ date: '', timeWindow: '', vehicle: '' });
      await load();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create slot');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      await slotsAPI.delete(slotId);
      setSlots(slots.filter((s) => s.id !== slotId));
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

  const booked = slots.filter((s) => s.isBooked);
  const available = slots.filter((s) => !s.isBooked);

  // Group by date
  const byDate: Record<string, AvailabilitySlot[]> = {};
  slots.forEach((s) => {
    byDate[s.date] = byDate[s.date] || [];
    byDate[s.date].push(s);
  });
  const dates = Object.keys(byDate).sort();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8" data-testid="instructor-schedule-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Schedule</h1>
            <p className="text-slate-400">These are your own time slots only — students book against your availability.</p>
          </div>
          <button
            data-testid="add-slot-btn"
            onClick={() => setShowSlotForm(!showSlotForm)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
          >
            <Plus size={18} /> Add Slot
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2" data-testid="schedule-error">
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 border border-emerald-500/50 rounded-lg p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Available Slots</p>
              <p className="text-white text-2xl font-bold mt-1" data-testid="stat-available">{available.length}</p>
            </div>
            <Calendar className="text-emerald-400" size={32} />
          </div>
          <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/50 rounded-lg p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Booked Lessons</p>
              <p className="text-white text-2xl font-bold mt-1" data-testid="stat-booked">{booked.length}</p>
            </div>
            <CheckCircle className="text-blue-400" size={32} />
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/50 rounded-lg p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Slots</p>
              <p className="text-white text-2xl font-bold mt-1" data-testid="stat-total">{slots.length}</p>
            </div>
            <Clock className="text-purple-400" size={32} />
          </div>
        </div>

        {showSlotForm && (
          <form onSubmit={handleCreateSlot} className="mb-8 bg-slate-800/50 rounded-lg p-6 border border-slate-600" data-testid="slot-form">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
                <input
                  data-testid="slot-date-input"
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
                  data-testid="slot-time-input"
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
                  data-testid="slot-vehicle-select"
                  value={newSlot.vehicle}
                  onChange={(e) => setNewSlot({ ...newSlot, vehicle: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  required
                >
                  <option value="">Select vehicle</option>
                  {VEHICLES.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="submit" disabled={saving} data-testid="save-slot-btn" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 text-white rounded-lg transition flex items-center gap-2">
                {saving && <Loader size={16} className="animate-spin" />} Create Slot
              </button>
              <button type="button" onClick={() => setShowSlotForm(false)} className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition">Cancel</button>
            </div>
          </form>
        )}

        {slots.length === 0 ? (
          <div className="text-center py-16 bg-slate-800/50 border border-slate-700 rounded-lg">
            <Calendar size={48} className="mx-auto text-slate-600 mb-4" />
            <p className="text-slate-400">You have no time slots yet</p>
            <p className="text-slate-500 text-sm mt-2">Add slots above so students can book lessons with you</p>
          </div>
        ) : (
          <div className="space-y-6">
            {dates.map((date) => (
              <div key={date} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6" data-testid={`schedule-day-${date}`}>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-emerald-400" />
                  {new Date(date).toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {byDate[date].sort((a, b) => a.timeWindow.localeCompare(b.timeWindow)).map((slot) => (
                    <div
                      key={slot.id}
                      data-testid={`slot-card-${slot.id}`}
                      className={`rounded-lg p-4 border ${slot.isBooked ? 'bg-blue-500/10 border-blue-500/40' : 'bg-slate-700/30 border-slate-600'}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-white font-semibold flex items-center gap-2"><Clock size={16} className="text-emerald-400" />{slot.timeWindow}</p>
                        {slot.isBooked ? (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">Booked</span>
                        ) : (
                          <button onClick={() => handleDeleteSlot(slot.id)} data-testid={`delete-slot-${slot.id}`} className="p-1 hover:bg-red-500/10 text-red-400 rounded transition" title="Delete slot">
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm flex items-center gap-2"><Car size={14} />{slot.vehicle}</p>
                      {slot.isBooked && (
                        <p className="text-blue-300 text-sm flex items-center gap-2 mt-2"><User size={14} />{slot.booking?.student?.name || 'Student'}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorSchedule;
