import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import TransferForm from './TransferForm';
import { FiPieChart, FiX, FiArrowRight } from 'react-icons/fi';

const Transfer = () => {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // Form & Edit Modal States
    const [showForm, setShowForm] = useState(false);
    const [editingTransfer, setEditingTransfer] = useState(null);

    // Advanced Filter States
    const [transferFromFilter, setTransferFromFilter] = useState('');
    const [transferToFilter, setTransferToFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Breakdown Modal States
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [breakdownVisible, setBreakdownVisible] = useState(false);

        // Refs for auto scrolling
    const tableSectionRef = useRef(null);
    const formSectionRef = useRef(null);

    // Refs for triggering date pickers
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Fetch Transfers
    const fetchTransfers = async () => {
        try {
            const response = await fetch('http://localhost:5000/transfer');
            const data = await response.json();
            setTransfers(data);
        } catch (error) {
            console.error('Error fetching transfers:', error);
            showToast('Failed to load transfers!', 'error');
        } finally {
            setLoading(false);
        }
    };

       useEffect(() => {
        fetchTransfers();
    }, []);

    // Helper function to format ISO date (YYYY-MM-DD) to "05 Aug 2026"
    const displayFormattedDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) return dateString;

        const dateObj = new Date(year, month - 1, day);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return dateObj.toLocaleDateString('en-GB', options);
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3500);
    };

    // View Note Handler with SweetAlert2
    const handleViewNote = (note) => {
        Swal.fire({
            title: '<span class="text-xl font-bold text-gray-800">Transfer Note</span>',
            html: `<div class="p-2 text-gray-600 bg-gray-50 rounded-xl border border-gray-100 max-h-60 overflow-y-auto text-left leading-relaxed">${note || 'No note available for this record.'}</div>`,
            confirmButtonText: 'Close',
            confirmButtonColor: '#4f46e5',
            customClass: {
                popup: 'rounded-3xl shadow-2xl border border-white'
            }
        });
    };

    // Delete Transfer Handler with SweetAlert2
    const handleDelete = async (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`http://localhost:5000/transfer/${id}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        showToast('Transfer deleted successfully!', 'success');
                        setTransfers(prevTransfers => prevTransfers.filter(item => item._id !== id));
                    } else {
                        showToast('Failed to delete transfer!', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting transfer:', error);
                    showToast('Server error while deleting!', 'error');
                }
            }
        });
    };

    // Clear Filters Handler
    const handleClearFilter = () => {
        setTransferFromFilter('');
        setTransferToFilter('');
        setStartDate('');
        setEndDate('');
        setSearchTerm('');
    };

    // Filtered Transfers based on Advanced Filters
    const filteredTransfers = transfers.filter((item) => {
        // Transfer From Filter (dropdown / select match)
        const matchTransferFrom = transferFromFilter === '' || item.transferFrom === transferFromFilter;

        // Transfer To Filter (dropdown / select match)
        const matchTransferTo = transferToFilter === '' || item.transferTo === transferToFilter;

        // Date Range Filters Logic (Updated)
        if (startDate || endDate) {
            if (!item.date) return false;

            const parsedDate = new Date(item.date);
            if (isNaN(parsedDate)) return false;

            if (startDate) {
                const startDateObj = new Date(startDate);
                if (!isNaN(startDateObj) && parsedDate < startDateObj) return false;
            }

            if (endDate) {
                const endDateObj = new Date(endDate);
                if (!isNaN(endDateObj) && parsedDate > endDateObj) return false;
            }
        }

        // General Search Term Filter
        const search = searchTerm.toLowerCase();
        const fromAccMatch = item.transferFrom?.toLowerCase().includes(search);
        const toAccMatch = item.transferTo?.toLowerCase().includes(search);
        const fromAccountNameMatch = item.fromAccount?.toLowerCase().includes(search);
        const toAccountNameMatch = item.toAccount?.toLowerCase().includes(search);
        const noteMatch = item.note?.toLowerCase().includes(search);
        const amountMatch = item.amount?.toString().toLowerCase().includes(search);

        const matchSearch = searchTerm === '' || fromAccMatch || toAccMatch || fromAccountNameMatch || toAccountNameMatch || noteMatch || amountMatch;

        return matchTransferFrom && matchTransferTo && matchSearch;
    });

    // Unique options for dropdowns based on existing data
    const uniqueTransferFrom = [...new Set(transfers.map(item => item.transferFrom).filter(Boolean))];
    const uniqueTransferTo = [...new Set(transfers.map(item => item.transferTo).filter(Boolean))];

    // Open/close breakdown modal with smooth animation
    const openBreakdown = () => {
        setShowBreakdown(true);
        setTimeout(() => setBreakdownVisible(true), 10);
    };

    const closeBreakdown = () => {
        setBreakdownVisible(false);
        setTimeout(() => setShowBreakdown(false), 250);
    };

    // Transfer Breakdown Calculation (type wise, e.g. Cash / Mobile Banking / Bank)
    // - transferFrom/transferTo type wise total
    // - Type er vitore fromAccount/toAccount onujayi sub-group (jemon: bKash, Nagad, ba specific bank account alada alada dekhabe)
    const getDirectionBreakdown = (typeField, accountField) => {
        const groups = {};

        filteredTransfers.forEach((item) => {
            const type = item[typeField]?.trim() || 'Others';
            const amount = Number(item.amount) || 0;

            if (!groups[type]) {
                groups[type] = { total: 0, subGroups: {} };
            }

            groups[type].total += amount;

            const subKey = item[accountField]?.trim();
            if (subKey && subKey !== type) {
                groups[type].subGroups[subKey] = (groups[type].subGroups[subKey] || 0) + amount;
            }
        });

        return groups;
    };

    const fromBreakdown = getDirectionBreakdown('transferFrom', 'fromAccount');
    const toBreakdown = getDirectionBreakdown('transferTo', 'toAccount');
    const grandTransferredTotal = filteredTransfers.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // ---- Flow Data: kon account theke kon account e koto taka gese, tar jonno diagram + list ----
    const getFlowData = () => {
        const pairs = {};
        const fromNodesMap = {};
        const toNodesMap = {};

        filteredTransfers.forEach((item) => {
            const fromLabel = item.fromAccount || item.transferFrom || 'N/A';
            const toLabel = item.toAccount || item.transferTo || 'N/A';

            const fromType = item.transferFrom || '';
            const toType = item.transferTo || '';
            const amount = Number(item.amount) || 0;

            const fromKey = `${item.transferFrom || 'Others'}::${fromLabel}`;
            const toKey = `${item.transferTo || 'Others'}::${toLabel}`;
            const pairKey = `${fromKey}=>${toKey}`;

            if (!pairs[pairKey]) {
                pairs[pairKey] = { fromKey, toKey, fromLabel, toLabel, amount: 0 };
            }
            pairs[pairKey].amount += amount;

            if (!fromNodesMap[fromKey]) fromNodesMap[fromKey] = { key: fromKey, label: fromLabel, total: 0 };
            fromNodesMap[fromKey].total += amount;

            if (!toNodesMap[toKey]) toNodesMap[toKey] = { key: toKey, label: toLabel, total: 0 };
            toNodesMap[toKey].total += amount;
        });

        return {
            pairs: Object.values(pairs).sort((a, b) => b.amount - a.amount),
            fromNodes: Object.values(fromNodesMap).sort((a, b) => b.total - a.total),
            toNodes: Object.values(toNodesMap).sort((a, b) => b.total - a.total),
        };
    };

    const flowData = getFlowData();
    const flowColors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6', '#84cc16', '#f97316'];

    // Flow Diagram Component (SVG দিয়ে বাম দিকে From, ডান দিকে To, বাঁকানো লাইন দিয়ে কানেক্ট করা)
    const FlowDiagram = ({ fromNodes, toNodes, pairs }) => {
        if (pairs.length === 0) {
            return (
                <div className="text-center py-10 text-gray-400 font-medium text-sm">No transfer flow to show!</div>
            );
        }

        const svgWidth = 640;
        const nodeCount = Math.max(fromNodes.length, toNodes.length, 1);
        const svgHeight = Math.max(220, nodeCount * 62 + 50);
        const leftX = 140;
        const rightX = svgWidth - 140;
        const maxAmount = Math.max(...pairs.map((p) => p.amount), 1);

        const getY = (index, total) => {
            if (total <= 1) return svgHeight / 2;
            const usableHeight = svgHeight - 60;
            return 30 + (usableHeight / (total - 1)) * index;
        };

        const fromYMap = {};
        fromNodes.forEach((node, i) => {
            fromYMap[node.key] = getY(i, fromNodes.length);
        });

        const toYMap = {};
        toNodes.forEach((node, i) => {
            toYMap[node.key] = getY(i, toNodes.length);
        });

        return (
            <div className="overflow-x-auto">
                <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    width="100%"
                    height={svgHeight}
                    style={{ overflow: 'visible', minWidth: '520px' }}
                >
                    {/* Connecting Flow Lines */}
                    {pairs.map((pair, idx) => {
                        const fromY = fromYMap[pair.fromKey];
                        const toY = toYMap[pair.toKey];
                        const strokeWidth = 2 + (pair.amount / maxAmount) * 8;
                        const color = flowColors[idx % flowColors.length];
                        const path = `M ${leftX} ${fromY} C ${leftX + 130} ${fromY}, ${rightX - 130} ${toY}, ${rightX} ${toY}`;
                        return (
                            <path
                                key={idx}
                                d={path}
                                fill="none"
                                stroke={color}
                                strokeWidth={strokeWidth}
                                strokeOpacity="0.55"
                                strokeLinecap="round"
                            >
                                <title>{`${pair.fromLabel} → ${pair.toLabel}: ৳${pair.amount.toLocaleString()}`}</title>
                            </path>
                        );
                    })}

                    {/* From Nodes (Left Side) */}
                    {fromNodes.map((node, i) => {
                        const y = getY(i, fromNodes.length);
                        return (
                            <g key={node.key}>
                                <circle cx={leftX} cy={y} r="5" fill="#4f46e5" />
                                <foreignObject
                                    x={leftX - 145}
                                    y={y - 25}
                                    width="135"
                                    height="55"
                                >
                                    <div className="text-right leading-tight">
                                        {node.label.split(' - ').map((part, index) => (
                                            <div
                                                key={index}
                                                className={index === 0 ? "font-bold text-gray-700 text-[11px]" : "text-[10px] text-gray-500"}
                                            >
                                                {index === 0 ? part : `(${part})`}
                                            </div>
                                        ))}
                                    </div>
                                </foreignObject>
                                <text x={leftX - 12} y={y + 10} textAnchor="end" fontSize="9" fill="#9ca3af">
                                    ৳{node.total.toLocaleString()}
                                </text>
                            </g>
                        );
                    })}

                    {/* To Nodes (Right Side) */}
                    {toNodes.map((node, i) => {
                        const y = getY(i, toNodes.length);
                        return (
                            <g key={node.key}>
                                <circle cx={rightX} cy={y} r="5" fill="#db2777" />
                                <foreignObject
                                    x={rightX + 12}
                                    y={y - 25}
                                    width="135"
                                    height="55"
                                >
                                    <div className="text-left leading-tight">
                                        {node.label.split(' - ').map((part, index) => (
                                            <div
                                                key={index}
                                                className={index === 0 ? "font-bold text-gray-700 text-[11px]" : "text-[10px] text-gray-500"}
                                            >
                                                {index === 0 ? part : `(${part})`}
                                            </div>
                                        ))}
                                    </div>
                                </foreignObject>
                                <text x={rightX + 12} y={y + 10} textAnchor="start" fontSize="9" fill="#9ca3af">
                                    ৳{node.total.toLocaleString()}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">

            {/* Top Right Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 transform translate-y-0 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Transfer Breakdown Modal */}
            {showBreakdown && (
                <div
                    className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${breakdownVisible ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`}
                    onClick={closeBreakdown}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-white overflow-hidden transform transition-all duration-300 ${breakdownVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
                    >
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-pink-600 px-6 py-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Transfer Breakdown</h3>
                                <p className="text-indigo-100 text-xs mt-0.5">কোন account থেকে কোন account এ টাকা গেছে তার বিস্তারিত</p>
                            </div>
                            <button
                                onClick={closeBreakdown}
                                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition duration-200 cursor-pointer"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">

                            {/* Flow Diagram Section */}
                            <div>
                                <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                    Transfer Flow Diagram
                                </p>
                                <div className="bg-gray-50/70 rounded-2xl border border-gray-100 p-4">
                                    <FlowDiagram
                                        fromNodes={flowData.fromNodes}
                                        toNodes={flowData.toNodes}
                                        pairs={flowData.pairs}
                                    />
                                </div>
                            </div>

                            {/* Flow List Section (exact from -> to amount) */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                    Flow List (Exact Amount)
                                </p>
                                {flowData.pairs.length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 font-medium text-sm">No data to show!</div>
                                ) : (
                                    <div className="space-y-2">
                                        {flowData.pairs.map((pair, idx) => (
                                            <div
                                                key={idx}
                                                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50/70 border border-gray-100 text-xs"
                                            >
                                                <div className="flex items-center gap-2 min-w-0 font-semibold text-gray-700">
                                                    <span
                                                        className="w-2 h-2 rounded-full flex-shrink-0"
                                                        style={{ backgroundColor: flowColors[idx % flowColors.length] }}
                                                    ></span>
                                                    <span className="truncate">{pair.fromLabel}</span>
                                                    <FiArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                    <span className="truncate">{pair.toLabel}</span>
                                                </div>
                                                <span className="font-bold text-indigo-700 whitespace-nowrap">
                                                    ৳ {pair.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Transfer From (Outgoing) Section */}
                            <div>
                                <p className="text-xs font-bold text-rose-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                                    Transfer From (Outgoing) - Type wise
                                </p>
                                {Object.keys(fromBreakdown).length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 font-medium text-sm">No data to show!</div>
                                ) : (
                                    <div className="space-y-3">
                                        {Object.entries(fromBreakdown).map(([type, data]) => (
                                            <div key={type} className="bg-gray-50/70 rounded-2xl border border-gray-100 p-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-gray-800 text-sm">{type}</span>
                                                    <span className="font-bold text-rose-600 text-sm">৳ {data.total.toLocaleString()}</span>
                                                </div>

                                                {Object.keys(data.subGroups).length > 0 && (
                                                    <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-indigo-100">
                                                        {Object.entries(data.subGroups).map(([subKey, subAmount]) => (
                                                            <div key={subKey} className="flex items-center justify-between text-xs text-gray-600">
                                                                <span className="font-medium">{subKey}</span>
                                                                <span className="font-semibold text-gray-700">৳ {subAmount.toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Transfer To (Incoming) Section */}
                            <div>
                                <p className="text-xs font-bold text-emerald-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                    Transfer To (Incoming) - Type wise
                                </p>
                                {Object.keys(toBreakdown).length === 0 ? (
                                    <div className="text-center py-6 text-gray-400 font-medium text-sm">No data to show!</div>
                                ) : (
                                    <div className="space-y-3">
                                        {Object.entries(toBreakdown).map(([type, data]) => (
                                            <div key={type} className="bg-gray-50/70 rounded-2xl border border-gray-100 p-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-gray-800 text-sm">{type}</span>
                                                    <span className="font-bold text-emerald-600 text-sm">৳ {data.total.toLocaleString()}</span>
                                                </div>

                                                {Object.keys(data.subGroups).length > 0 && (
                                                    <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-indigo-100">
                                                        {Object.entries(data.subGroups).map(([subKey, subAmount]) => (
                                                            <div key={subKey} className="flex items-center justify-between text-xs text-gray-600">
                                                                <span className="font-medium">{subKey}</span>
                                                                <span className="font-semibold text-gray-700">৳ {subAmount.toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-indigo-50/60 border-t border-indigo-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-700">Total Transferred</span>
                            <span className="text-lg font-extrabold text-indigo-700">৳ {grandTransferredTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-8">

                {/* Top Section: Title & Add Button */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Transfer Management
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Manage and track all balance transfers easily</p>
                    </div>

                    <button
                        onClick={() => {
                            setEditingTransfer(null);
                            setShowForm(!showForm);
                            if (!showForm) {
                                setTimeout(() => {
                                    formSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }
                        }}
                        className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition duration-300 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                    >
                        {showForm ? (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Close Form
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                New Transfer
                            </>
                        )}
                    </button>
                </div>

                {/* Collapsible Form Component */}
                <div ref={formSectionRef}>
                    {showForm && (
                        <TransferForm
                            showToast={showToast}
                            editingTransfer={editingTransfer}
                            onTransferAdded={(newTransfer) => {
                                setTransfers(prev => [newTransfer, ...prev]);
                                setShowForm(false);
                                setEditingTransfer(null);
                                setTimeout(() => {
                                    tableSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }}
                            onTransferSaved={(updatedTransfer) => {
                                setTransfers(prev => prev.map(item => item._id === updatedTransfer._id ? updatedTransfer : item));
                                setShowForm(false);
                                setEditingTransfer(null);
                                setTimeout(() => {
                                    tableSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }}
                        />
                    )}
                </div>

                {/* Table Card Section */}
                <div ref={tableSectionRef} className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl overflow-hidden p-6 md:p-8 border border-white space-y-6">

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-800">Transfers History</h3>
                            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                                Total: {filteredTransfers.length} / {transfers.length}
                            </span>
                            <span className="px-3 py-3 bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-xs rounded-full shadow-sm">
                                Total Transferred: ৳ {grandTransferredTotal.toLocaleString()}
                            </span>
                            <button
                                onClick={openBreakdown}
                                className="inline-flex items-center gap-1.5 px-3.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-full shadow-sm transition duration-200 cursor-pointer"
                                title="View Transfer Breakdown"
                            >
                                <FiPieChart className="w-3.5 h-3.5" />
                                Breakdown
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filter Section */}
                    <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">

                        {/* Transfer From Filter */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Transfer From</label>
                            <select
                                value={transferFromFilter}
                                onChange={(e) => setTransferFromFilter(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-white text-sm text-gray-700"
                            >
                                <option value="">All From Types</option>
                                {uniqueTransferFrom.map((type, idx) => (
                                    <option key={idx} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Transfer To Filter */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Transfer To</label>
                            <select
                                value={transferToFilter}
                                onChange={(e) => setTransferToFilter(e.target.value)}
                                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-white text-sm text-gray-700"
                            >
                                <option value="">All To Types</option>
                                {uniqueTransferTo.map((type, idx) => (
                                    <option key={idx} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                                               {/* Start Date */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
                            <div
                                className="relative w-full cursor-pointer"
                                onClick={() => startDateRef.current?.showPicker?.() || startDateRef.current?.click()}
                            >
                                <input
                                    ref={startDateRef}
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                />
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="Select start date"
                                    value={displayFormattedDate(startDate)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-white text-sm text-gray-700 cursor-pointer pointer-events-none"
                                />
                            </div>
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
                            <div
                                className="relative w-full cursor-pointer"
                                onClick={() => endDateRef.current?.showPicker?.() || endDateRef.current?.click()}
                            >
                                <input
                                    ref={endDateRef}
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                />
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="Select end date"
                                    value={displayFormattedDate(endDate)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-white text-sm text-gray-700 cursor-pointer pointer-events-none"
                                />
                            </div>
                        </div>
                        {/* Search & Clear Filter Actions */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-white text-sm text-gray-700"
                                />
                            </div>
                            <button
                                onClick={handleClearFilter}
                                className="px-4 py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-medium text-sm rounded-xl transition duration-200 shadow-sm cursor-pointer whitespace-nowrap"
                                title="Clear Filters"
                            >
                                Clear
                            </button>
                        </div>

                    </div>

                    {/* Table Container */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading transfers...</div>
                    ) : filteredTransfers.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No transfers found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-sm uppercase tracking-wider">
                                        <th className="py-4 px-5">#</th>
                                        <th className="py-4 px-5">Date</th>
                                        <th className="py-4 px-5">From Account</th>
                                        <th className="py-4 px-5">To Account</th>
                                        <th className="py-4 px-5">Amount</th>
                                        <th className="py-4 px-5">Note</th>
                                        <th className="py-4 px-5 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {filteredTransfers.map((item, index) => (
                                        <tr key={item._id || index} className="hover:bg-indigo-50/40 transition duration-150">
                                            <td className="py-4 px-5 font-medium text-gray-400">{index + 1}</td>
                                            <td className="py-4 px-5 font-semibold text-gray-800 whitespace-nowrap">{item.date}</td>
                                            <td className="py-4 px-5">
                                                <div className="font-semibold text-gray-800">{item.transferFrom}</div>
                                                <div className="text-xs text-indigo-600 font-medium">{item.fromAccount}</div>
                                            </td>
                                            <td className="py-4 px-5">
                                                <div className="font-semibold text-gray-800">{item.transferTo}</div>
                                                <div className="text-xs text-indigo-600 font-medium">{item.toAccount}</div>
                                            </td>
                                            <td className="py-4 px-5 font-bold text-emerald-600 whitespace-nowrap">৳{item.amount}</td>
                                            <td className="py-4 px-5 text-gray-600 max-w-xs">
                                                <button
                                                    onClick={() => handleViewNote(item.note)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-xl transition duration-200 shadow-sm text-xs font-semibold cursor-pointer"
                                                    title="View Note"
                                                >
                                                    View Note
                                                </button>
                                            </td>
                                            <td className="py-4 px-5 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setEditingTransfer(item);
                                                            setShowForm(true);
                                                            setTimeout(() => {
                                                                formSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                                            }, 100);
                                                        }}
                                                        className="p-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl transition duration-200 shadow-sm cursor-pointer"
                                                        title="Edit Transfer"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                        </svg>
                                                    </button>

                                                    <button
                                                        onClick={() => handleDelete(item._id)}
                                                        className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition duration-200 shadow-sm cursor-pointer"
                                                        title="Delete Transfer"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-4 h-4">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Transfer;