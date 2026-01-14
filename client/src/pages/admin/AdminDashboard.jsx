import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { 
    LayoutDashboard, 
    Server, 
    Ticket, 
    ShieldAlert, 
    CreditCard, 
    LogOut,
    Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Components
import Overview from './components/Overview';
import ServicesManager from './components/ServicesManager';
import PassMonitor from './components/PassMonitor';
import SecurityPanel from './components/SecurityPanel';

// import TransactionFeed from './components/TransactionFeed'; // Using Overview's feed for now

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (socket) {
            socket.emit('join_admin');
            setIsConnected(true);
            
            socket.on('disconnect', () => setIsConnected(false));
            return () => {
               socket.off('disconnect');
            }
        }
    }, [socket]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'overview': return <Overview onViewAll={() => setActiveTab('transactions')} />;
            case 'services': return <ServicesManager />; 
            case 'passes': return <PassMonitor />;
            case 'security': return <SecurityPanel />;
            case 'transactions': return <h2 className="text-center mt-20 text-slate-500">Full Transaction History (See Overview for Recent)</h2>;
            default: return <Overview />;
        }
    };

    return (
        <div className="flex h-screen bg-obsidian text-white overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-surface border-r border-white/5 flex flex-col">
                <div className="p-6 border-b border-white/5">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
                        <Activity className="text-blue-500" />
                        FlexPass Admin
                    </h1>
                    <div className="mt-2 flex items-center gap-2 text-xs text-text-muted">
                        <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {isConnected ? 'System Online' : 'Connecting...'}
                    </div>
                </div>

                <div className="flex-1 py-6 space-y-2 px-3">
                    <SidebarItem 
                        icon={LayoutDashboard} 
                        label="Overview" 
                        active={activeTab === 'overview'} 
                        onClick={() => setActiveTab('overview')} 
                    />
                    <SidebarItem 
                        icon={Server} 
                        label="Services" 
                        active={activeTab === 'services'} 
                        onClick={() => setActiveTab('services')} 
                    />
                    <SidebarItem 
                        icon={Ticket} 
                        label="Active Passes" 
                        active={activeTab === 'passes'} 
                        onClick={() => setActiveTab('passes')} 
                    />
                    <SidebarItem 
                        icon={ShieldAlert} 
                        label="Security" 
                        active={activeTab === 'security'} 
                        onClick={() => setActiveTab('security')} 
                    />
                    <SidebarItem 
                        icon={CreditCard} 
                        label="Transactions" 
                        active={activeTab === 'transactions'} 
                        onClick={() => setActiveTab('transactions')} 
                    />
                </div>

                <div className="p-4 border-t border-white/5">
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">Logout</span>
                    </button>
                    <div className="mt-4 text-[10px] text-center text-slate-600 uppercase tracking-widest">
                        v1.0.0 Production
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto bg-[#0a0a0a]">
                <header className="px-8 py-5 border-b border-white/5 flex justify-between items-center bg-surface/50 backdrop-blur-md sticky top-0 z-10">
                    <h2 className="text-xl font-bold capitalize">{activeTab.replace('-', ' ')}</h2>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-sm font-bold text-white">{user?.name}</div>
                            <div className="text-xs text-slate-500">Super Admin</div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center font-bold text-lg">
                            {user?.name?.charAt(0)}
                        </div>
                    </div>
                </header>
                <div className="p-8">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
            active 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-lg shadow-blue-500/10' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
        }`}
    >
        <Icon size={20} className={`transition-colors ${active ? 'text-blue-400' : 'group-hover:text-white'}`} />
        <span className="font-medium">{label}</span>
    </button>
);

export default AdminDashboard;
