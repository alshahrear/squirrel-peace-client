import React from 'react';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const formatDateOnly = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date)) return String(value);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const TH = 'px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider';

const CompanyDuePayAc = ({ rows = [], loading = false }) => {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className={TH}>Company</th>
                        <th className={TH}>Date</th>
                        <th className={TH}>Invoice</th>
                        <th className={TH}>Payment Method</th>
                        <th className={TH}>Payment Account</th>
                        <th className={TH}>Amount</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {loading ? (
                        <tr>
                            <td colSpan="6" className="text-center py-10 text-gray-400 text-sm">Loading...</td>
                        </tr>
                    ) : rows.length > 0 ? (
                        rows.map((r) => (
                            <tr key={r.key} className="hover:bg-indigo-50/50 transition-colors">
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">{r.company}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDateOnly(r.date) || 'N/A'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 font-medium">{r.invoiceNo || 'N/A'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-700">{r.method}</span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {r.account || <span className="text-gray-400 italic">N/A</span>}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-emerald-600">৳ {fmt(r.total)}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center py-10 text-gray-400 text-sm">
                                No records found for this company!
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default CompanyDuePayAc;