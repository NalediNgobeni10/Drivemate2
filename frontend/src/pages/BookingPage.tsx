

import React, { useEffect, useState } from 'react';
import { Calendar, Clock, Car, AlertCircle, Loader, Check, Ticket, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { slotsAPI, bookingsAPI, progressAPI } from '../lib/api';
import type { AvailabilitySlot } from '../types';

/* Name: Naledi Ngobeni
*  Student Number: 230742912 */

const BookingPage: React.FC = () => {
    const { user } = useAuth();
    const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [booking, setBooking] = useState<string | null>(null);
    const [credits, setCredits] = useState<{ availableCredits: number } | null>(null);

    const loadCredits = async () => {
        try {
            const res = await progressAPI.getCredits();
            setCredits(res.data);
        } catch {
            /* non-blocking */
        }
    };

    useEffect(() => {
        const fetchSlots = async () => {
            try {
                const res = await slotsAPI.getAvailable(selectedDate);
                setSlots(res.data);
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to load slots');
            } finally {
                setLoading(false);
            }
        };
        fetchSlots();
    }, [selectedDate]);

    useEffect(() => {
        loadCredits();
    }, []);

    const handleBook = async (slotId: string) => {
        setBooking(slotId);
        setError('');
        try {
            await bookingsAPI.book(slotId);
            setSlots(slots.filter(s => s.id !== slotId));
            setBooking(null);
            loadCredits();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to book slot');
            setBooking(null);
        }
    };

    const noCredits = credits !== null && credits.availableCredits <= 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="animate-spin text-emerald-500" size={32} />
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
                    <h1 className="text-3xl font-bold text-white mb-2">
                        Book a Lesson
                    </h1>
                    <p className="text-slate-400">Select an available time slot for your driving lesson</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
                        <AlertCircle size={20} className="text-red-400" />
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Lesson credits status */}
                {credits !== null && (
                    <div
                        className={`mb-6 rounded-xl p-4 flex items-center justify-between flex-wrap gap-3 border ${
                            noCredits ? 'bg-amber-500/10 border-amber-500/40' : 'bg-emerald-500/10 border-emerald-500/40'
                        }`}
                        data-testid="booking-credits-banner"
                    >
                        <div className="flex items-center gap-3">
                            <Ticket size={22} className={noCredits ? 'text-amber-400' : 'text-emerald-400'} />
                            <p className="text-white font-medium">
                                {noCredits
                                    ? 'You have no lesson credits. Purchase and pay for a package to book lessons.'
                                    : `${credits.availableCredits} lesson credit${credits.availableCredits === 1 ? '' : 's'} available`}
                            </p>
                        </div>
                        {noCredits && (
                            <Link
                                to="/payments"
                                data-testid="go-to-payments-btn"
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm transition"
                            >
                                Buy a Package
                            </Link>
                        )}
                    </div>
                )}

                {/* Date Filter */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Filter by Date</label>
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    />
                </div>

                {/* Available Slots Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {slots.length === 0 ? (
                        <div className="col-span-full text-center py-12 bg-slate-800/50 border border-slate-700 rounded-lg">
                            <Calendar size={48} className="mx-auto text-slate-600 mb-4" />
                            <p className="text-slate-400">No available slots found</p>
                            <p className="text-slate-500 text-sm mt-2">Try selecting a different date or check back later</p>
                        </div>
                    ) : (
                        slots.map((slot) => (
                            <div key={slot.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-emerald-500/50 transition">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                                            <Calendar size={20} className="text-emerald-400" />
                                        </div>
                                        <div>
                                            <p className="text-white font-semibold">{slot.date}</p>
                                            <p className="text-emerald-400 text-sm">{slot.timeWindow}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                                        <Car size={16} />
                                        <span>{slot.vehicle}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                                        <Clock size={16} />
                                        <span>1 hour lesson</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-700">
                                    <div>
                                        <p className="text-slate-400 text-xs">Instructor</p>
                                        <p className="text-white font-medium">{slot.instructor?.name}</p>
                                    </div>
                                    <button
                                        onClick={() => handleBook(slot.id)}
                                        disabled={booking === slot.id || noCredits}
                                        data-testid={`book-slot-${slot.id}`}
                                        title={noCredits ? 'Purchase a package to book' : 'Book this slot'}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition"
                                    >
                                        {booking === slot.id ? (
                                            <Loader size={18} className="animate-spin" />
                                        ) : (
                                            <Check size={18} />
                                        )}
                                        {booking === slot.id ? 'Booking...' : 'Book Now'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingPage;
