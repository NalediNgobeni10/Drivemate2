import React from 'react';
import { Link } from 'react-router-dom';
import { Car, ShieldCheck, Calendar, Users, Star, CheckCircle, ArrowRight, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const LandingPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 backdrop-blur-sm border-b z-50 ${theme === 'dark' ? 'bg-slate-900/95 border-slate-700' : 'bg-white/95 border-gray-100'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-lg">
                <Car className="text-white" size={28} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DriveMate</h1>
                <p className="text-emerald-600 text-sm font-medium">South Africa's Premier Driving School</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} hover:text-emerald-600 transition font-medium`}>Features</a>
              <a href="#packages" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} hover:text-emerald-600 transition font-medium`}>Packages</a>
              <a href="#about" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} hover:text-emerald-600 transition font-medium`}>About</a>
              <a href="#contact" className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} hover:text-emerald-600 transition font-medium`}>Contact</a>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition ${theme === 'dark' ? 'hover:bg-slate-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <Link
                to="/login"
                className="px-6 py-2.5 text-emerald-600 font-semibold hover:bg-emerald-50 rounded-lg transition"
              >
                Login
              </Link>
              <Link
                to="/login"
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition shadow-lg"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={`pt-32 pb-20 px-4 ${theme === 'dark' ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800' : 'bg-gradient-to-br from-emerald-50 via-white to-blue-50'}`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Star className="w-4 h-4 fill-current" />
                Rated #1 Driving School in South Africa
              </div>
              <h1 className={`text-5xl lg:text-6xl font-bold leading-tight mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Master the Road with
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-blue-600"> Confidence</span>
              </h1>
              <p className={`text-xl mb-8 leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Professional K53 driving lessons across South Africa. Pass your test with our certified instructors and modern fleet of vehicles.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/login"
                  className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition shadow-xl flex items-center justify-center gap-2 text-lg"
                >
                  Start Learning Today
                  <ArrowRight size={20} />
                </Link>
                <a
                  href="#packages"
                  className={`px-8 py-4 font-semibold rounded-xl border-2 transition flex items-center justify-center gap-2 text-lg ${theme === 'dark' ? 'bg-slate-800 text-gray-300 border-slate-600 hover:border-emerald-500 hover:text-emerald-400' : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-500 hover:text-emerald-600'}`}
                >
                  View Packages
                </a>
              </div>
              <div className="flex items-center gap-8 mt-10">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-emerald-500" size={24} />
                  <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>K53 Certified</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-emerald-500" size={24} />
                  <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Code 8 & 10</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-emerald-500" size={24} />
                  <span className={`font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Nationwide</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-500 to-blue-600 rounded-3xl p-8 shadow-2xl">
                <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6`}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                      <Car className="text-emerald-600" size={32} />
                    </div>
                    <div>
                      <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Book Your First Lesson</h3>
                      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Easy online booking system</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                      <Calendar className="text-emerald-600" size={24} />
                      <div>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Flexible Scheduling</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Book lessons at your convenience</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                      <Users className="text-emerald-600" size={24} />
                      <div>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Expert Instructors</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Certified professionals</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-3 p-4 rounded-xl ${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'}`}>
                      <ShieldCheck className="text-emerald-600" size={24} />
                      <div>
                        <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Safe Learning</p>
                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Modern dual-control vehicles</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className={`py-16 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">5,000+</div>
              <p className="text-gray-600 font-medium">Students Trained</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">95%</div>
              <p className="text-gray-600 font-medium">Pass Rate</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">50+</div>
              <p className="text-gray-600 font-medium">Certified Instructors</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">9</div>
              <p className="text-gray-600 font-medium">Provinces Covered</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Why Choose DriveMate?</h2>
            <p className={`text-xl max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              We combine experienced instructors, modern vehicles, and a proven curriculum to help you become a safe, confident driver.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-white'} p-8 rounded-2xl shadow-lg hover:shadow-xl transition`}>
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="text-emerald-600" size={32} />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>K53 Certified Training</h3>
              <p className={`leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Our curriculum follows the official K53 test requirements, ensuring you're fully prepared for your licensing exam.
              </p>
            </div>
            <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-white'} p-8 rounded-2xl shadow-lg hover:shadow-xl transition`}>
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                <Car className="text-blue-600" size={32} />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Modern Fleet</h3>
              <p className={`leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Learn in well-maintained, dual-control vehicles including Toyota Hilux, VW Polo, and Toyota Corolla models.
              </p>
            </div>
            <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-white'} p-8 rounded-2xl shadow-lg hover:shadow-xl transition`}>
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mb-6">
                <Users className="text-purple-600" size={32} />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Expert Instructors</h3>
              <p className={`leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Our certified instructors have years of experience and are passionate about teaching safe driving habits.
              </p>
            </div>
            <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-white'} p-8 rounded-2xl shadow-lg hover:shadow-xl transition`}>
              <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mb-6">
                <Calendar className="text-amber-600" size={32} />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Flexible Scheduling</h3>
              <p className={`leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Book lessons at times that work for you, including early mornings, evenings, and weekends.
              </p>
            </div>
            <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-white'} p-8 rounded-2xl shadow-lg hover:shadow-xl transition`}>
              <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mb-6">
                <Star className="text-rose-600" size={32} />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Track Progress</h3>
              <p className={`leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Monitor your learning journey with our detailed progress tracking and feedback system.
              </p>
            </div>
            <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-white'} p-8 rounded-2xl shadow-lg hover:shadow-xl transition`}>
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mb-6">
                <CheckCircle className="text-teal-600" size={32} />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>High Pass Rate</h3>
              <p className={`leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Our students consistently achieve above-average pass rates on their first attempt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Packages Section */}
      <section id="packages" className={`py-20 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Lesson Packages</h2>
            <p className={`text-xl max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Choose the package that suits your learning needs. All packages include K53 test preparation.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className={`${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} border-2 rounded-2xl p-8 hover:border-emerald-500 transition`}>
              <div className="text-center mb-6">
                <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Starter Package</h3>
                <div className="text-4xl font-bold text-emerald-600 mb-2">R 1,500</div>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>5 Lessons</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <CheckCircle className="text-emerald-500" size={20} />
                  5 x 1-hour lessons
                </li>
                <li className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <CheckCircle className="text-emerald-500" size={20} />
                  K53 test preparation
                </li>
                <li className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <CheckCircle className="text-emerald-500" size={20} />
                  Progress tracking
                </li>
                <li className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <CheckCircle className="text-emerald-500" size={20} />
                  Code 8 or Code 10
                </li>
              </ul>
              <Link
                to="/login"
                className="block w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition text-center"
              >
                Get Started
              </Link>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-8 shadow-xl transform scale-105">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-amber-400 text-gray-900 px-4 py-1 rounded-full text-sm font-bold">MOST POPULAR</span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Standard Package</h3>
                <div className="text-4xl font-bold text-white mb-2">R 2,800</div>
                <p className="text-emerald-100">10 Lessons</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-white">
                  <CheckCircle className="text-white" size={20} />
                  10 x 1-hour lessons
                </li>
                <li className="flex items-center gap-2 text-white">
                  <CheckCircle className="text-white" size={20} />
                  K53 test preparation
                </li>
                <li className="flex items-center gap-2 text-white">
                  <CheckCircle className="text-white" size={20} />
                  Progress tracking
                </li>
                <li className="flex items-center gap-2 text-white">
                  <CheckCircle className="text-white" size={20} />
                  Mock test included
                </li>
                <li className="flex items-center gap-2 text-white">
                  <CheckCircle className="text-white" size={20} />
                  Code 8 or Code 10
                </li>
              </ul>
              <Link
                to="/login"
                className="block w-full py-3 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-gray-100 transition text-center"
              >
                Get Started
              </Link>
            </div>
            <div className={`${theme === 'dark' ? 'bg-slate-700 border-slate-600' : 'bg-white border-gray-200'} border-2 rounded-2xl p-8 hover:border-emerald-500 transition`}>
              <div className="text-center mb-6">
                <h3 className={`text-2xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Premium Package</h3>
                <div className="text-4xl font-bold text-emerald-600 mb-2">R 4,000</div>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>15 Lessons</p>
              </div>
              <ul className="space-y-3 mb-8">
                <li className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <CheckCircle className="text-emerald-500" size={20} />
                  15 x 1-hour lessons
                </li>
                <li className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <CheckCircle className="text-emerald-500" size={20} />
                  K53 test preparation
                </li>
                <li className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <CheckCircle className="text-emerald-500" size={20} />
                  Progress tracking
                </li>
                <li className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <CheckCircle className="text-emerald-500" size={20} />
                  Mock test included
                </li>
                <li className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <CheckCircle className="text-emerald-500" size={20} />
                  Priority scheduling
                </li>
                <li className={`flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  <CheckCircle className="text-emerald-500" size={20} />
                  Code 8 or Code 10
                </li>
              </ul>
              <Link
                to="/login"
                className="block w-full py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition text-center"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className={`py-20 ${theme === 'dark' ? 'bg-slate-800' : 'bg-gray-50'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className={`text-4xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>About DriveMate</h2>
              <p className={`text-lg mb-6 leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                DriveMate is South Africa's leading driving school, dedicated to producing safe, responsible drivers since 2015. We operate across all 9 provinces, with a network of certified instructors and modern training vehicles.
              </p>
              <p className={`text-lg mb-6 leading-relaxed ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                Our mission is to make quality driver education accessible to everyone. We believe that proper training not only helps students pass their tests but also creates safer roads for all South Africans.
              </p>
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Licensed</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Fully certified</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Car className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Modern Fleet</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Latest vehicles</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <Users className="text-purple-600" size={24} />
                  </div>
                  <div>
                    <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Experienced</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Expert instructors</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                    <Star className="text-amber-600" size={24} />
                  </div>
                  <div>
                    <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Top Rated</p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>5-star reviews</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-blue-600 rounded-3xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Our Commitment</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="flex-shrink-0" size={24} />
                  <p>Comprehensive K53 curriculum aligned with national standards</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="flex-shrink-0" size={24} />
                  <p>Patient, professional instructors who adapt to your learning style</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="flex-shrink-0" size={24} />
                  <p>Safe, well-maintained dual-control training vehicles</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="flex-shrink-0" size={24} />
                  <p>Flexible scheduling to accommodate busy lifestyles</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="flex-shrink-0" size={24} />
                  <p>Transparent pricing with no hidden fees</p>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="flex-shrink-0" size={24} />
                  <p>Support beyond the test - building lifelong safe driving habits</p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Get In Touch</h2>
            <p className={`text-xl max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
              Have questions? We're here to help you start your driving journey.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'} p-8 rounded-2xl text-center`}>
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Phone className="text-emerald-600" size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Call Us</h3>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>+27 21 123 4567</p>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Mon-Fri: 8am - 6pm</p>
            </div>
            <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'} p-8 rounded-2xl text-center`}>
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Mail className="text-blue-600" size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Email Us</h3>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>info@drivemate.co.za</p>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>support@drivemate.co.za</p>
            </div>
            <div className={`${theme === 'dark' ? 'bg-slate-700' : 'bg-gray-50'} p-8 rounded-2xl text-center`}>
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <MapPin className="text-purple-600" size={32} />
              </div>
              <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Visit Us</h3>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Cape Town, South Africa</p>
              <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Nationwide coverage</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-emerald-500 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Ready to Start Your Driving Journey?</h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join thousands of successful drivers who learned with DriveMate. Book your first lesson today!
          </p>
          <Link
            to="/login"
            className="inline-block px-10 py-4 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-gray-100 transition text-lg shadow-xl"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-xl flex items-center justify-center">
                  <Car className="text-white" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">DriveMate</h3>
                  <p className="text-emerald-400 text-sm">Driving School</p>
                </div>
              </div>
              <p className="text-gray-400 mb-6">
                South Africa's premier driving school, committed to producing safe, responsible drivers since 2015.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition">
                  <Facebook size={20} />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition">
                  <Instagram size={20} />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-emerald-600 transition">
                  <Twitter size={20} />
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="text-gray-400 hover:text-emerald-400 transition">Features</a></li>
                <li><a href="#packages" className="text-gray-400 hover:text-emerald-400 transition">Packages</a></li>
                <li><a href="#about" className="text-gray-400 hover:text-emerald-400 transition">About Us</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-emerald-400 transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-6">Services</h4>
              <ul className="space-y-3">
                <li className="text-gray-400">Code 8 Lessons</li>
                <li className="text-gray-400">Code 10 Lessons</li>
                <li className="text-gray-400">K53 Test Prep</li>
                <li className="text-gray-400">Refresher Courses</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-6">Contact Info</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-gray-400">
                  <Phone size={18} />
                  +27 21 123 4567
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <Mail size={18} />
                  info@drivemate.co.za
                </li>
                <li className="flex items-center gap-2 text-gray-400">
                  <MapPin size={18} />
                  Cape Town, SA
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">
              © 2026 DriveMate Driving School. All rights reserved. | Faculty of Informatics & Design — CPUT Project III
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
