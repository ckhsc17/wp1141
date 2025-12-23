
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { MapPin, Calendar, Clock, ArrowRight, Share2, Crown, ChevronRight, Zap, Trophy, Timer, Plus, Users, LayoutGrid, Home as HomeIcon, Info, X } from 'lucide-react';
import { format, isAfter, isBefore, formatDistanceToNow } from 'date-fns';
import { mockDb } from './services/mockDb';
import { generateEventSummary } from './services/geminiService';
import { Event, Member, CreateEventDTO, JoinEventDTO, TravelMode, EventStatus, Group } from './types';
import GoogleMapView from './components/GoogleMapView';

// --- Components ---

const GlassCard = ({ children, className = "" }: any) => (
  <div className={`bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl shadow-sm ${className}`}>
    {children}
  </div>
);

const IconButton = ({ icon: Icon, onClick, active = false }: any) => (
  <button onClick={onClick} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${active ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-slate-500 shadow-sm border border-slate-100'}`}>
    <Icon size={20} />
  </button>
);

// --- Pages ---

const Home = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    mockDb.getAllEvents().then(setEvents);
    mockDb.getGroups().then(setGroups);
  }, []);

  const activeEvents = events.filter(e => e.status !== EventStatus.ENDED);
  const pastEvents = events.filter(e => e.status === EventStatus.ENDED);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="px-6 pt-10 pb-6 bg-white border-b border-slate-100">
          <div className="flex justify-between items-center mb-6">
              <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tight">MeetHalf</h1>
                  <p className="text-slate-400 text-sm font-medium">Where's the squad?</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-100 border-2 border-white shadow-sm overflow-hidden">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alice" alt="avatar" />
              </div>
          </div>

          {/* Squads Scroll */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar py-2 -mx-2 px-2">
               <button onClick={() => navigate('/create')} className="flex-shrink-0 flex flex-col items-center gap-2">
                   <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                       <Plus size={24} />
                   </div>
                   <span className="text-[10px] font-bold text-slate-500">New Meet</span>
               </button>
               {groups.map(g => (
                   <div key={g.id} className="flex-shrink-0 flex flex-col items-center gap-2">
                       <div className="w-16 h-16 rounded-3xl bg-white border border-slate-100 flex items-center justify-center text-3xl shadow-sm">
                           {g.avatar}
                       </div>
                       <span className="text-[10px] font-bold text-slate-500 truncate w-16 text-center">{g.name}</span>
                   </div>
               ))}
          </div>
      </header>

      <main className="p-6 space-y-8">
          {/* Active Events */}
          <section>
              <div className="flex justify-between items-center mb-4">
                  <h2 className="font-bold text-slate-800">Active Gatherings</h2>
                  <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Live</span>
              </div>
              <div className="space-y-4">
                  {activeEvents.map(e => (
                      <div key={e.id} onClick={() => navigate(`/event/${e.id}`)} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group cursor-pointer active:scale-95 transition-all">
                          <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl">
                                   {e.groupId ? groups.find(g => g.id === e.groupId)?.avatar : '📍'}
                               </div>
                               <div>
                                   <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{e.name}</h3>
                                   <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                                       <Clock size={12} /> {format(e.startTime, 'h:mm a')} • {e.members.length} friends
                                   </div>
                               </div>
                          </div>
                          <ChevronRight size={18} className="text-slate-300" />
                      </div>
                  ))}
              </div>
          </section>

          {/* Past Events */}
          <section>
              <h2 className="font-bold text-slate-800 mb-4">History</h2>
              <div className="space-y-3">
                  {pastEvents.map(e => (
                      <div key={e.id} onClick={() => navigate(`/event/${e.id}/summary`)} className="bg-slate-100/50 p-4 rounded-2xl flex items-center justify-between opacity-80 cursor-pointer">
                          <div className="flex items-center gap-3">
                              <div className="text-xl grayscale">🕒</div>
                              <div>
                                  <h4 className="text-sm font-bold text-slate-700">{e.name}</h4>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{format(e.startTime, 'MMM d')}</span>
                              </div>
                          </div>
                          <Trophy size={14} className="text-slate-300" />
                      </div>
                  ))}
              </div>
          </section>
      </main>

      <nav className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-slate-100 px-8 py-4 flex justify-around items-center z-50">
          <IconButton icon={HomeIcon} active onClick={() => navigate('/')} />
          <IconButton icon={Users} onClick={() => {}} />
          <IconButton icon={LayoutGrid} onClick={() => {}} />
      </nav>
    </div>
  );
};

const EventRoom = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [currentUserMember, setCurrentUserMember] = useState<Member | undefined>(undefined);
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  const [pokedId, setPokedId] = useState<number | null>(null);

  useEffect(() => {
    const fetch = () => {
      mockDb.getEvent(parseInt(id!)).then(data => {
        if (data) {
          setEvent(data);
          const me = data.members.find(m => m.userId === mockDb.getCurrentUserId());
          setCurrentUserMember(me);
          mockDb.simulateOthersMovement(data.id);
        }
      });
    };
    fetch();
    const timer = setInterval(fetch, 2000);
    return () => clearInterval(timer);
  }, [id]);

  const handlePoke = async (mId: number) => {
      setPokedId(mId);
      await mockDb.pokeMember(event!.id, currentUserMember!.id, mId);
      setTimeout(() => setPokedId(null), 1000);
  }

  if (!event || !currentUserMember) return null;

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-100 overflow-hidden">
        {/* Map */}
        <div className="absolute inset-0 z-0">
            <GoogleMapView event={event} members={event.members} currentMemberId={currentUserMember.id} />
        </div>

        {/* Floating Headers & Event Info */}
        <div className="absolute top-0 left-0 w-full p-4 z-20 flex flex-col items-center">
             <div className="w-full flex justify-between items-center mb-4">
                 <button onClick={() => navigate('/')} className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 flex items-center justify-center text-slate-600 active:scale-90 transition-all">
                     <ArrowRight size={20} className="rotate-180" />
                 </button>
                 
                 {/* Expandable Meeting Info Pill */}
                 <div 
                    onClick={() => setIsInfoExpanded(!isInfoExpanded)}
                    className={`
                        flex flex-col overflow-hidden transition-all duration-300 ease-in-out cursor-pointer
                        ${isInfoExpanded ? 'w-[80%] p-5 bg-white/90 rounded-[2rem]' : 'w-auto px-4 py-2 bg-white/80 rounded-full'}
                        backdrop-blur-xl border border-white shadow-lg
                    `}
                 >
                     {!isInfoExpanded ? (
                         <div className="flex items-center gap-3">
                             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                             <span className="text-sm font-black text-slate-800">{event.name}</span>
                             <Clock size={14} className="text-slate-400" />
                             <span className="text-xs font-bold text-slate-500">{format(event.startTime, 'HH:mm')}</span>
                         </div>
                     ) : (
                         <div className="space-y-4">
                             <div className="flex justify-between items-start">
                                 <div>
                                     <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">Happening Now</span>
                                     <h2 className="text-xl font-black text-slate-900 leading-tight">{event.name}</h2>
                                 </div>
                                 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                     <X size={16} />
                                 </div>
                             </div>

                             <div className="space-y-2">
                                 <div className="flex items-center gap-3 text-slate-600">
                                     <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                                         <MapPin size={16} />
                                     </div>
                                     <div className="flex-1">
                                         <div className="text-sm font-bold">{event.meetingPointName}</div>
                                         <div className="text-[10px] text-slate-400">San Francisco, CA</div>
                                     </div>
                                 </div>
                                 <div className="flex items-center gap-3 text-slate-600">
                                     <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                                         <Clock size={16} />
                                     </div>
                                     <div className="flex-1">
                                         <div className="text-sm font-bold">{format(event.startTime, 'h:mm a')} – {format(event.endTime, 'h:mm a')}</div>
                                         <div className="text-[10px] text-slate-400">{formatDistanceToNow(event.startTime, { addSuffix: true })}</div>
                                     </div>
                                 </div>
                             </div>

                             <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                 <div className="flex items-center gap-2">
                                     <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold">A</div>
                                     <span className="text-[10px] font-medium text-slate-400">Organized by {event.ownerName}</span>
                                 </div>
                                 <button className="text-[10px] font-black text-blue-600 uppercase tracking-wider">Share Link</button>
                             </div>
                         </div>
                     )}
                 </div>

                 <button onClick={() => navigate(`/event/${event.id}/summary`)} className="w-12 h-12 bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/40 flex items-center justify-center text-blue-600 active:scale-90 transition-all">
                     <Trophy size={20} />
                 </button>
             </div>
        </div>

        {/* Arrived Action */}
        <div className="absolute bottom-32 left-0 w-full flex justify-center z-10 pointer-events-none">
             {!currentUserMember.arrivalTime ? (
                 <button 
                    onClick={() => mockDb.markArrived(event.id, currentUserMember.id)}
                    className="bg-blue-600 text-white px-10 py-4 rounded-full font-black shadow-2xl shadow-blue-500/40 border-4 border-white active:scale-90 transition-all pointer-events-auto"
                 >
                     I'M HERE 🏁
                 </button>
             ) : (
                 <div className="bg-green-500 text-white px-8 py-4 rounded-full font-black shadow-lg border-4 border-white flex items-center gap-2 pointer-events-auto">
                     <Crown size={20} fill="currentColor" /> ARRIVED
                 </div>
             )}
        </div>

        {/* Social Drawer */}
        <div className={`
            absolute bottom-0 left-0 w-full bg-white rounded-t-[3rem] shadow-[0_-20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 ease-out z-30
            ${isDrawerOpen ? 'h-[75%]' : 'h-24'}
        `}>
             <div onClick={() => setDrawerOpen(!isDrawerOpen)} className="w-full h-8 flex justify-center items-center cursor-pointer">
                 <div className="w-12 h-1 bg-slate-200 rounded-full" />
             </div>

             <div className="p-6 pt-0 overflow-y-auto max-h-full">
                  <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">The Squad</h3>
                      <div className="flex -space-x-3">
                           {event.members.slice(0, 3).map(m => (
                               <div key={m.id} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                   {m.nickname[0]}
                               </div>
                           ))}
                           {event.members.length > 3 && <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-400">+{event.members.length - 3}</div>}
                      </div>
                  </div>

                  {/* Member Grid */}
                  <div className="grid grid-cols-2 gap-4 pb-10">
                      {event.members.map(m => (
                          <div key={m.id} className={`p-4 rounded-3xl border transition-all ${m.arrivalTime ? 'bg-green-50 border-green-100' : 'bg-white border-slate-100'}`}>
                              <div className="flex items-center justify-between mb-3">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${m.arrivalTime ? 'bg-green-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                      {m.nickname[0].toUpperCase()}
                                  </div>
                                  {m.id !== currentUserMember.id && !m.arrivalTime && (
                                      <button 
                                        onClick={() => handlePoke(m.id)}
                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${pokedId === m.id ? 'bg-orange-500 text-white shake' : 'bg-slate-50 text-slate-400 hover:bg-orange-50 hover:text-orange-500'}`}
                                      >
                                          <Zap size={16} />
                                      </button>
                                  )}
                              </div>
                              <div className="font-bold text-slate-900 truncate">{m.nickname} {m.id === currentUserMember.id && '(You)'}</div>
                              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                  {m.arrivalTime ? `Arrived ${format(m.arrivalTime, 'HH:mm')}` : 'En Route...'}
                              </div>
                          </div>
                      ))}
                  </div>
             </div>
        </div>
    </div>
  );
};

const Summary = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState<Event | null>(null);
    const [aiSummary, setAiSummary] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        mockDb.getEvent(parseInt(id!)).then(data => {
            setEvent(data || null);
            // Fetch AI roast if we have the event and no summary yet
            if (data && !aiSummary && !isGenerating) {
                setIsGenerating(true);
                generateEventSummary(data)
                    .then(res => setAiSummary(res))
                    .catch(() => setAiSummary("The AI is too busy laughing at you to write a summary."))
                    .finally(() => setIsGenerating(false));
            }
        });
    }, [id, aiSummary, isGenerating]);

    if (!event) return null;

    const arrived = [...event.members].filter(m => m.arrivalTime).sort((a,b) => a.arrivalTime!.getTime() - b.arrivalTime!.getTime());
    const late = [...event.members].filter(m => !m.arrivalTime);

    return (
        <div className="min-h-screen bg-white p-6 pb-12">
            <header className="flex items-center justify-between mb-10">
                <button onClick={() => navigate(`/event/${event.id}`)} className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
                    <ArrowRight className="rotate-180" size={20} />
                </button>
                <h1 className="text-xl font-black text-slate-900">Leaderboard</h1>
                <div className="w-12 h-12" />
            </header>

            {/* AI Summary Section */}
            <div className="mb-10 p-5 bg-orange-50 rounded-[2.5rem] border border-orange-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Zap size={48} className="text-orange-500" />
                </div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2 flex items-center gap-1.5">
                    <Zap size={14} fill="currentColor" /> AI SQUAD ROAST
                </h3>
                {isGenerating ? (
                    <div className="text-sm text-slate-400 font-medium animate-pulse flex items-center gap-2">
                        Analyzing the lateness...
                    </div>
                ) : (
                    <p className="text-sm text-slate-700 font-medium leading-relaxed italic">
                        "{aiSummary}"
                    </p>
                )}
            </div>

            {/* Podium */}
            <div className="flex items-end justify-center gap-2 mb-12 h-48 px-4">
                {/* 2nd Place */}
                <div className="flex flex-col items-center flex-1">
                    <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white mb-2 flex items-center justify-center font-black">
                        {arrived[1]?.nickname[0] || '?'}
                    </div>
                    <div className="w-full bg-slate-200 rounded-t-2xl h-16 flex items-center justify-center text-slate-500 font-bold">2nd</div>
                    <span className="text-[10px] mt-1 font-bold text-slate-400 truncate w-full text-center">{arrived[1]?.nickname}</span>
                </div>
                {/* 1st Place */}
                <div className="flex flex-col items-center flex-1">
                    <div className="relative mb-2">
                        <Trophy className="absolute -top-6 left-1/2 -translate-x-1/2 text-orange-400" size={24} fill="currentColor"/>
                        <div className="w-16 h-16 rounded-full bg-blue-600 border-4 border-blue-50 flex items-center justify-center font-black text-white text-xl">
                            {arrived[0]?.nickname[0] || '?'}
                        </div>
                    </div>
                    <div className="w-full bg-blue-600 rounded-t-2xl h-24 flex items-center justify-center text-white font-bold">1st</div>
                    <span className="text-[10px] mt-1 font-bold text-blue-600 truncate w-full text-center">{arrived[0]?.nickname}</span>
                </div>
                {/* 3rd Place */}
                <div className="flex flex-col items-center flex-1">
                    <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white mb-2 flex items-center justify-center font-black">
                        {arrived[2]?.nickname[0] || '?'}
                    </div>
                    <div className="w-full bg-slate-100 rounded-t-2xl h-12 flex items-center justify-center text-slate-400 font-bold">3rd</div>
                    <span className="text-[10px] mt-1 font-bold text-slate-400 truncate w-full text-center">{arrived[2]?.nickname}</span>
                </div>
            </div>

            {/* Full List */}
            <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 px-2">Arrival Times</h3>
                {arrived.map((m, idx) => (
                    <div key={m.id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
                        <div className="flex items-center gap-4">
                             <span className="font-black text-slate-300 w-4">{idx + 1}</span>
                             <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center font-bold text-slate-700">
                                 {m.nickname[0]}
                             </div>
                             <div>
                                 <div className="font-bold text-slate-800">{m.nickname}</div>
                                 <div className="text-[10px] text-slate-400 font-bold">{format(m.arrivalTime!, 'HH:mm:ss')}</div>
                             </div>
                        </div>
                        {idx === 0 && <Crown size={18} className="text-orange-400" fill="currentColor" />}
                    </div>
                ))}
            </div>

            <div className="mt-12">
                 <button onClick={() => navigate('/')} className="w-full py-4 bg-slate-900 text-white rounded-3xl font-black shadow-xl active:scale-95 transition-all">
                     BACK TO SQUADS
                 </button>
            </div>
        </div>
    );
}

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/event/:id" element={<EventRoom />} />
        <Route path="/event/:id/summary" element={<Summary />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
