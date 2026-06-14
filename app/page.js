"use client";
import { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ArrowDownLeft, Users, Plus, X, History, TrendingUp, CheckSquare, Square } from 'lucide-react';
import { calculateSettlements } from '../utils/splitting';

const USERS = ['Eli', 'Itay', 'Amit', 'Yoav'];

export default function SplitTrip() {
  // App States
  const [activeUser, setActiveUser] = useState('Alex');
  const [activeTab, setActiveTab] = useState('me'); 
  const [expenses, setExpenses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form States
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('Alex');
  const [splitWith, setSplitWith] = useState([...USERS]); // Tracks selected users for split

  // Load data from localStorage
  useEffect(() => {
    const savedExpenses = localStorage.getItem('split_trip_expenses');
    if (savedExpenses) {
      setExpenses(JSON.parse(savedExpenses));
    }
  }, []);

  // Save data to localStorage
  const saveExpenses = (newExpenses) => {
    setExpenses(newExpenses);
    localStorage.setItem('split_trip_expenses', JSON.stringify(newExpenses));
  };

  const handleToggleUser = (user) => {
    if (splitWith.includes(user)) {
      if (splitWith.length > 1) {
        setSplitWith(splitWith.filter(u => u !== user));
      }
    } else {
      setSplitWith([...splitWith, user]);
    }
  };

  const handleSelectAll = () => {
    setSplitWith([...USERS]);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!description || !amount || splitWith.length === 0) return;

    const newExpense = {
      id: Date.now(),
      description,
      amount: parseFloat(amount),
      paidBy,
      splitWith, 
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };

    const updated = [newExpense, ...expenses];
    saveExpenses(updated);
    
    // Reset Form
    setDescription('');
    setAmount('');
    setSplitWith([...USERS]);
    setIsModalOpen(false);
  };

  const { balances, debts } = calculateSettlements(expenses, USERS);

  const currentUserBalance = balances[activeUser] || 0;
  const collectiveTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  
  const totalOwedToMe = debts
    .filter(d => d.to === activeUser)
    .reduce((sum, d) => sum + d.amount, 0);

  const totalIOwe = debts
    .filter(d => d.from === activeUser)
    .reduce((sum, d) => sum + d.amount, 0);

  const individualTimeline = expenses.filter(exp => 
    exp.paidBy === activeUser || exp.splitWith.includes(activeUser)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans max-w-md mx-auto relative pb-24 border-x border-slate-900 shadow-2xl">
      
      {/* HEADER & USER SWITCHER */}
      <header className="p-4 flex justify-between items-center bg-slate-900/50 backdrop-blur sticky top-0 z-40 border-b border-slate-900">
        <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">SplitTrip ✈️</h1>
        <select 
          value={activeUser} 
          onChange={(e) => { setActiveUser(e.target.value); setPaidBy(e.target.value); }}
          className="bg-slate-800 text-sm font-medium rounded-full px-3 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-200"
        >
          {USERS.map(user => <option key={user} value={user}>{user}</option>)}
        </select>
      </header>

      {/* TABS CONTROLLER */}
      <div className="flex p-2 gap-2 bg-slate-900/30 m-4 rounded-xl border border-slate-900">
        <button 
          onClick={() => setActiveTab('me')}
          className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition-all ${activeTab === 'me' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'}`}
        >
          My Balance
        </button>
        <button 
          onClick={() => setActiveTab('group')}
          className={`flex-1 py-2 text-center text-sm font-semibold rounded-lg transition-all ${activeTab === 'group' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400'}`}
        >
          Group Stats
        </button>
      </div>

      {/* TAB 1: MY BALANCE */}
      {activeTab === 'me' && (
        <main className="px-4">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl mb-6 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 text-slate-900/20 pointer-events-none">
              <Wallet size={140} />
            </div>
            <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-1">Net Trip Balance</p>
            <h2 className={`text-4xl font-black tracking-tight mb-6 ${currentUserBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {currentUserBalance >= 0 ? `+$${currentUserBalance.toFixed(2)}` : `-$${Math.abs(currentUserBalance).toFixed(2)}`}
            </h2>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/60">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <ArrowUpRight size={14} className="text-emerald-400" /> Owed to Me
                </div>
                <p className="text-lg font-bold text-slate-100">${totalOwedToMe.toFixed(2)}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <ArrowDownLeft size={14} className="text-rose-400" /> Total I Owe
                </div>
                <p className="text-lg font-bold text-slate-100">${totalIOwe.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1">
            <History size={12} /> Your Timeline
          </h3>
          <div className="space-y-2.5">
            {individualTimeline.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No expenses added yet.</p>
            ) : (
              individualTimeline.map(exp => {
                const wasInvolved = exp.splitWith.includes(activeUser);
                const userShare = wasInvolved ? exp.amount / exp.splitWith.length : 0;
                
                return (
                  <div key={exp.id} className="bg-slate-900/40 border border-slate-900 rounded-xl p-3.5 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-semibold text-slate-200">{exp.description}</p>
                      <p className="text-xs text-slate-500">
                        {exp.date} • Paid by {exp.paidBy} 
                        <span className="block text-[10px] text-slate-400 mt-0.5">Split with: {exp.splitWith.join(', ')}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-200">${exp.amount.toFixed(2)}</p>
                      <p className="text-[11px] font-medium mt-0.5">
                        {exp.paidBy === activeUser ? (
                          <span className="text-emerald-400">You lent ${(exp.amount - userShare).toFixed(2)}</span>
                        ) : wasInvolved ? (
                          <span className="text-rose-400">You owe ${userShare.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-500">Not involved</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      )}

      {/* TAB 2: GROUP STATS */}
      {activeTab === 'group' && (
        <main className="px-4">
          <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-4 flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl">
                <Users size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-medium">Collective Trip Spend</p>
                <p className="text-xl font-bold text-slate-100">${collectiveTotal.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1">
            <TrendingUp size={12} /> Optimized Settlement Plan
          </h3>
          <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 mb-6 space-y-3">
            {debts.length === 0 ? (
              <p className="text-sm text-emerald-400/80 text-center py-2 font-medium">Everyone is completely settled up! 🎉</p>
            ) : (
              debts.map((debt, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm border-b border-slate-900 pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-300 font-medium">{debt.from} owes <span className="text-slate-100 font-bold">{debt.to}</span></span>
                  <span className="bg-emerald-500/10 text-emerald-400 font-mono font-bold px-2.5 py-0.5 rounded-full text-xs">${debt.amount}</span>
                </div>
              ))
            )}
          </div>
        </main>
      )}

      {/* FLOATING ACTION BUTTON */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 bg-emerald-500 hover:bg-emerald-400 text-slate-950 p-4 rounded-full shadow-xl transition-transform active:scale-95 z-50"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* CUSTOMIZABLE SPLIT EXPENSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-end justify-center z-50 max-w-md mx-auto">
          <div className="bg-slate-900 w-full rounded-t-3xl p-6 border-t border-slate-800 shadow-2xl">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold">Add New Expense</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Description</label>
                <input 
                  type="text" 
                  placeholder="e.g., Dinner, Tram tickets"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Amount ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Paid By</label>
                  <select 
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {USERS.map(user => <option key={user} value={user}>{user}</option>)}
                  </select>
                </div>
              </div>

              {/* INDIVIDUAL CHOICE SELECTION */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold uppercase text-slate-400">Split With Whom?</label>
                  <button 
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[11px] font-bold text-emerald-400 hover:underline"
                  >
                    Select All
                  </button>
                </div>
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex justify-between gap-2">
                  {USERS.map(user => {
                    const isChecked = splitWith.includes(user);
                    return (
                      <button
                        key={user}
                        type="button"
                        onClick={() => handleToggleUser(user)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${
                          isChecked 
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' 
                            : 'bg-slate-800/50 border-slate-700 text-slate-400'
                        }`}
                      >
                        {isChecked ? <CheckSquare size={14} /> : <Square size={14} />}
                        {user}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-3 rounded-xl transition-all text-sm mt-2"
              >
                Save Custom Split
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}