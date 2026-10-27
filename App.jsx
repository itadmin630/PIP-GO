import React, { useState, useEffect, useMemo } from 'react';
import { 
  Flame, TrendingUp, Users, Calendar as CalendarIcon, X, Settings, 
  Bike, Footprints, Dumbbell, Waves, Activity as ActivityIcon, Mountain, Snowflake, Heart
} from 'lucide-react';
import pipLogo from './assets/pip-logo.jpg.jpg'; 

const getCalorieColor = (cal) => {
  if (!cal || cal === 0) return 'bg-[#f1f5f9] text-[#94a3b8]'; 
  if (cal < 200) return 'bg-[#ffedd5] text-[#ea580c] font-semibold'; 
  if (cal < 500) return 'bg-[#fdba74] text-[#c2410c] font-bold'; 
  return 'bg-[#ff5500] text-white font-bold'; 
};

const getStreakIcon = (type) => {
  const props = { className: "w-3.5 h-3.5 text-white cursor-help", title: type };
  if (['Ride', 'VirtualRide', 'EBikeRide', 'Handcycle', 'MountainBikeRide'].includes(type)) return <Bike {...props} />;
  if (['Run', 'VirtualRun', 'Walk', 'Wheelchair'].includes(type)) return <Footprints {...props} />;
  if (['Hike', 'RockClimbing'].includes(type)) return <Mountain {...props} />;
  if (['Swim', 'Rowing', 'Kayaking', 'Canoeing', 'Surfing', 'StandUpPaddling', 'Windsurf'].includes(type)) return <Waves {...props} />;
  if (['WeightTraining', 'Crossfit', 'Powerlifting'].includes(type)) return <Dumbbell {...props} />;
  if (['AlpineSki', 'BackcountrySki', 'IceSkate', 'Snowboard'].includes(type)) return <Snowflake {...props} />;
  if (['Yoga', 'Pilates'].includes(type)) return <Heart {...props} />;
  if (['Padel', 'Tennis', 'Squash', 'Badminton', 'TableTennis', 'Pickleball', 'Racquetball'].includes(type)) {
    return (
      <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="10" r="7" /><path d="M12 17v7" /><path d="M10 21h4" /><path d="m10 8 4 4" />
      </svg>
    );
  }
  return <ActivityIcon {...props} />;
};

const getCurrentWeek = () => {
  const curr = new Date();
  const first = curr.getDate() - curr.getDay() + (curr.getDay() === 0 ? -6 : 1);
  const days = [];
  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  for (let i = 0; i < 7; i++) {
    const dayDate = new Date(new Date().setDate(first + i));
    days.push({ label: dayNames[i], dateString: dayDate.toISOString().split('T')[0], dayNum: dayDate.getDate() });
  }
  return days;
};

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [sortBy, setSortBy] = useState('distance'); 
  const [selectedUser, setSelectedUser] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const date = new Date();
  const currentMonthName = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const currentWeek = useMemo(() => getCurrentWeek(), []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let url = 'http://localhost:8000/api/leaderboard';
        if (startDate && endDate) url += `?start_date=${startDate}&end_date=${endDate}`;
        
        const response = await fetch(url);
        const data = await response.json();

        const preparedData = data.map((emp) => {
          let totalCalories = 0;
          let totalDistance = 0;
          let dailyDataMap = {};
          let activeWeeksCount = emp.activities.length > 0 ? 1 : 0;
          
          emp.activities.forEach(act => {
            totalCalories += act.calories;
            totalDistance += parseFloat(act.distance);
            const day = new Date(act.activity_date).getDate();
            dailyDataMap[day] = act.calories;
          });

          const weekData = currentWeek.map(day => {
            const activity = emp.activities.find(a => a.activity_date.startsWith(day.dateString));
            return { ...day, hasActivity: !!activity, type: activity ? activity.type : null };
          });

          let dailyData = [];
          for (let i = 1; i <= daysInMonth; i++) dailyData.push({ day: i, calories: dailyDataMap[i] || 0 });

          return {
            id: emp.id,
            name: emp.name,
            role: emp.department,
            avatar: emp.avatar_url,
            totalDistance: totalDistance.toFixed(1),
            totalCalories: Math.round(totalCalories),
            totalActivities: emp.activities.length, // Penyesuaian nama variabel
            streakWeeks: activeWeeksCount,
            weekData: weekData,
            dailyData: dailyData
          };
        });
        setEmployees(preparedData);
      } catch (error) { console.error("API Error:", error); }
    };
    fetchData();
  }, [daysInMonth, startDate, endDate, currentWeek]);

  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => sortBy === 'distance' ? b.totalDistance - a.totalDistance : b.totalCalories - a.totalCalories);
  }, [employees, sortBy]);

  const stats = useMemo(() => {
    return {
      totalDist: employees.reduce((acc, curr) => acc + parseFloat(curr.totalDistance || 0), 0).toFixed(1),
      totalCals: employees.reduce((acc, curr) => acc + (curr.totalCalories || 0), 0),
      activeCount: employees.filter(e => e.totalActivities > 0).length
    };
  }, [employees]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#334155] font-sans p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center space-x-3">
            <img src={pipLogo} alt="Logo PIP GO" className="w-14 h-14 object-contain rounded-full border border-slate-200 shadow-sm" />
            <div>
              <h1 className="text-2xl font-black text-[#ff5500] leading-none tracking-tight">PIP GO</h1>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-0.5">Activity Tracker</p>
            </div>
          </div>
          <button onClick={() => setShowSettings(!showSettings)} className={`p-3 rounded-full transition-all ${showSettings ? 'bg-[#ff5500] text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-600 shadow-sm'}`}>
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {showSettings && (
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-end gap-4 animate-fadeIn">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tanggal Mulai</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff5500]/20 focus:border-[#ff5500] transition-all font-medium" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tanggal Akhir</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#ff5500]/20 focus:border-[#ff5500] transition-all font-medium" />
            </div>
            <button onClick={() => { setStartDate(''); setEndDate(''); }} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors">Reset</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-50 text-[#ff5500] rounded-full flex items-center justify-center"><TrendingUp className="w-6 h-6" /></div>
            <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Distance</p><p className="text-2xl font-black text-slate-800">{stats.totalDist} <span className="text-sm font-semibold text-slate-400">km</span></p></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center"><Flame className="w-6 h-6" /></div>
            <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Calories Burned</p><p className="text-2xl font-black text-slate-800">{stats.totalCals.toLocaleString()} <span className="text-sm font-semibold text-slate-400">kcal</span></p></div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center"><Users className="w-6 h-6" /></div>
            <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Evaluated</p><p className="text-2xl font-black text-slate-800">{stats.activeCount} <span className="text-sm font-semibold text-slate-400">/ {employees.length}</span></p></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2"><span className="text-2xl">🏆</span><h2 className="text-lg font-extrabold text-slate-800">Leaderboard Karyawan</h2></div>
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button onClick={() => setSortBy('distance')} className={`px-4 py-2 rounded-lg transition-all ${sortBy === 'distance' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Sort by Distance</button>
              <button onClick={() => setSortBy('calories')} className={`px-4 py-2 rounded-lg transition-all ${sortBy === 'calories' ? 'bg-white text-[#ff5500] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Sort by Calories</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/50 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-4 px-6 w-16 text-center">Rank</th>
                  <th className="py-4 px-6">Employee</th>
                  <th className="py-4 px-6">Weekly Streak</th>
                  <th className="py-4 px-6 text-center">Distance (KM)</th>
                  <th className="py-4 px-6 text-center">Calories</th>
                  <th className="py-4 px-6 text-center">Total Activity</th> {/* Penyesuaian nama kolom */}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {sortedEmployees.map((emp, index) => (
                  <tr key={emp.id} onClick={() => setSelectedUser(emp)} className="hover:bg-slate-50/80 cursor-pointer transition-colors group">
                    <td className="py-4 px-6 text-center">
                      {index === 0 ? <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-600 text-xs font-black shadow-sm">🥇</span> : 
                       index === 1 ? <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-600 text-xs font-black shadow-sm">🥈</span> : 
                       index === 2 ? <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/10 text-amber-800 text-xs font-black shadow-sm">🥉</span> : 
                       <span className="text-slate-400 font-bold">{index + 1}</span>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <img src={emp.avatar} alt={emp.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-[#ff5500]/30 transition-all"/>
                        <div>
                          <p className="font-bold text-slate-800 group-hover:text-[#ff5500] transition-colors">{emp.name}</p>
                          <p className="text-xs text-slate-400 font-normal">{emp.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-4">
                        <div className="flex flex-col items-center justify-center">
                          <Flame className={`w-7 h-7 ${emp.streakWeeks > 0 ? 'text-[#ff5500] fill-[#ff5500]' : 'text-slate-300 fill-slate-200'}`} />
                          <span className={`text-[10px] font-black mt-0.5 ${emp.streakWeeks > 0 ? 'text-[#ff5500]' : 'text-slate-400'}`}>
                            {emp.streakWeeks > 0 ? `${emp.streakWeeks} Week` : '0 Week'}
                          </span>
                        </div>
                        <div className="flex space-x-1.5">
                          {emp.weekData.map((d, i) => (
                            <div key={i} className="flex flex-col items-center space-y-1.5">
                              <span className="text-[10px] font-bold text-slate-400">{d.label}</span>
                              {d.hasActivity ? (
                                <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center shadow-sm">
                                  {getStreakIcon(d.type)}
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                  {d.dayNum}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-black text-slate-700 text-base">{emp.totalDistance}</td>
                    <td className="py-4 px-6 text-center"><span className="font-extrabold text-[#ff5500] inline-flex items-center space-x-1"><Flame className="w-4 h-4 fill-[#ff5500]" /><span>{emp.totalCalories.toLocaleString()}</span></span></td>
                    <td className="py-4 px-6 text-center"><span className="inline-block bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">{emp.totalActivities} </span></td> {/* Penyesuaian isi kolom */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 relative">
            <div className="bg-[#ff5500] p-6 text-white relative">
              <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors text-white"><X className="w-5 h-5" /></button>
              <div className="flex items-center space-x-4 mt-2">
                <img src={selectedUser.avatar} alt={selectedUser.name} className="w-16 h-16 rounded-full object-cover ring-4 ring-white/30"/>
                <div>
                  <h3 className="text-xl font-black">{selectedUser.name}</h3>
                  <p className="text-xs text-orange-100 font-medium">{selectedUser.role}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-2 text-slate-800 font-extrabold text-base">
                  <CalendarIcon className="w-5 h-5 text-[#ff5500]" />
                  <span>Consistency Calendar</span>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{currentMonthName}</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5 text-center mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-[11px] font-bold text-slate-400 py-1">{day}</div>
                ))}
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10"></div>
                ))}
                {selectedUser.dailyData.map((data) => (
                  <div key={data.day} className={`h-10 rounded-xl flex flex-col items-center justify-center p-1 transition-all hover:scale-105 cursor-default ${getCalorieColor(data.calories)}`}>
                    <span className="text-[10px] leading-none opacity-80">{data.day}</span>
                    <span className="text-[9px] font-black leading-none mt-0.5">{data.calories > 0 ? data.calories : '-'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}