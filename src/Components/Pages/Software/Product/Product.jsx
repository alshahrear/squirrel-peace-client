import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaEye, FaPlus, FaMinus, FaFilter, FaRedo, FaBoxOpen } from 'react-icons/fa';
import { FiChevronDown } from 'react-icons/fi';
import ProductForm from './ProductForm';
import { ComboBox, Pager, RowMenu, Skeleton, PopStyle, DateInput, inputCls, labelCls } from './ProductUi';
import useDraftState from '../../../../hooks/useDraftState';
import useCan from '../../../../hooks/useCan';

const EMPTY_FORM = {
    productName: '', company: '', companyContact: '', sku: '', category: '',
    alertQuantity: '', purchasePrice: '', sellingPrice: '', mrp: '',
    unit: '', pcsOfUnit: '', freeProductUnitQty: '', freeProductSubQty: '', freeProductPcsQty: '',
    hasParent: false, parentUnit: '', parentQty: '', unitQty: '', note: '', isActive: true,
};

const EMPTY_FILTERS = {
    startDate: '', endDate: '', productName: '', sku: '', category: '',
    company: '', companyContact: '', supplier: '', price: '', status: '',
};

const money = (v) => '৳ ' + (v ? Number(v).toLocaleString() : '0');
const low = (s) => (s || '').toLowerCase();

const UnitInfo = ({ p }) =>
    p.subUnit ? (
        <div className="flex flex-col gap-0.5">
            <div>{p.parentUnit || p.unit} ({p.parentQty}pcs)</div>
            <div>{p.subUnit} ({p.subUnitQty}pcs)</div>
            <div>PCS ({p.pcsOfUnit}pcs)</div>
        </div>
    ) : (
        <div>{p.unit || 'N/A'} ({p.pcsOfUnit || '0'}pcs)</div>
    );

const FreeInfo = ({ p }) =>
    Number(p.freeProductSubQty) || Number(p.freeProductPcsQty) ? (
        <div className="flex flex-col">
            <div>
                {p.subUnit && <>{p.freeProductSubQty || 0} {p.subUnit}{' '}</>}
                {p.freeProductPcsQty || 0} Pcs
            </div>
            <span className="text-[10px] text-emerald-700 font-bold">
                (Total: {(Number(p.freeProductSubQty) || 0) * (Number(p.subUnitQty) || 0) + (Number(p.freeProductPcsQty) || 0)})
            </span>
        </div>
    ) : (
        <span className="text-slate-400">None</span>
    );

const UnitInline = ({ p }) =>
    p.subUnit
        ? `${p.parentUnit || p.unit} (${p.parentQty}pcs) › ${p.subUnit} (${p.subUnitQty}pcs) › PCS (${p.pcsOfUnit}pcs)`
        : `${p.unit || 'N/A'} (${p.pcsOfUnit || '0'}pcs)`;

const FreeInline = ({ p }) => {
    const sub = Number(p.freeProductSubQty) || 0;
    const pcs = Number(p.freeProductPcsQty) || 0;
    if (!sub && !pcs) return <span className="text-slate-400">None</span>;
    const total = sub * (Number(p.subUnitQty) || 0) + pcs;
    return (
        <>
            {p.subUnit && sub ? `${sub} ${p.subUnit} ` : ''}{pcs} Pcs{' '}
            <span className="text-emerald-700 font-bold">(Total: {total})</span>
        </>
    );
};

const Product = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const { canAdd, canEdit, canDelete } = useCan('product');

    const [editingId, setEditingId] = useDraftState('productEditingId', null);
    const [isFormOpen, setIsFormOpen] = useDraftState('productFormOpen', false);
    const [formData, setFormData] = useDraftState('productFormData', {
        productName: '', company: '', companyContact: '', sku: '', category: '',
        alertQuantity: '', purchasePrice: '', sellingPrice: '', mrp: '',
        unit: '', pcsOfUnit: '', freeProductUnitQty: '', freeProductPcsQty: '',
        note: '', isActive: true,
    });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [filtersOpen, setFiltersOpen] = useState(false);

    // Toast: Main.jsx এর Toaster
    const showToast = (message, type = 'success') => {
        if (type === 'error') toast.error(message);
        else toast.success(message);
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch('http://localhost:5000/product');
            setProducts(await res.json());
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetch('http://localhost:5000/category')
            .then((r) => r.json())
            .then(setCategories)
            .catch((e) => console.error('Error fetching categories:', e));
        fetch('http://localhost:5000/company')
            .then((r) => r.json())
            .then(setCompanies)
            .catch((e) => console.error('Error fetching companies:', e));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const phoneOf = (p) =>
        p.companyContact ||
        companies.find((c) => c.businessName?.trim().toLowerCase() === p.company?.trim().toLowerCase())?.contactNumber ||
        '';

    const setF = (patch) => {
        setFilters((f) => ({ ...f, ...patch }));
        setCurrentPage(1);
    };
    const handleFilterChange = (e) => setF({ [e.target.name]: e.target.value });
    const handleClearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setCurrentPage(1);
    };

    // combo options
    const productOptions = products
        .filter((p) => {
            const s = low(filters.productName);
            return low(p.productName).includes(s) || low(p.company).includes(s) || low(p.companyContact).includes(s);
        })
        .map((p) => ({
            key: p._id,
            title: p.productName,
            sub: `🏢 ${p.company || 'N/A'}${phoneOf(p) ? ` | 📞 ${phoneOf(p)}` : ''}`,
            value: p,
        }));
    const categoryOptions = categories
        .filter((c) => low(c.name).includes(low(filters.category)))
        .map((c) => ({ key: c._id, title: c.name, value: c }));
    const companyOptions = companies
        .filter((c) => low(c.businessName).includes(low(filters.company)) || low(c.contactNumber).includes(low(filters.company)))
        .map((c) => ({ key: c._id, title: c.businessName, sub: c.contactNumber ? `📞 ${c.contactNumber}` : '', value: c }));

    const handleDelete = (id) => {
        if (!canDelete) return showToast('আপনার Delete করার অনুমতি নেই!', 'error');
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`http://localhost:5000/product/${id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (data.deletedCount > 0 || res.ok) {
                        showToast('Product deleted successfully!', 'success');
                        fetchProducts();
                    }
                } catch (error) {
                    console.error('Error deleting product:', error);
                }
            }
        });
    };

    const handleEdit = (product) => {
        if (!canEdit) return showToast('আপনার Edit করার অনুমতি নেই!', 'error');
        setFormData({
            productName: product.productName || '',
            company: product.company || '',
            companyContact: product.companyContact || '',
            sku: product.sku || '',
            category: product.category || '',
            alertQuantity: product.alertQuantity || '',
            purchasePrice: product.purchasePrice || '',
            sellingPrice: product.sellingPrice || '',
            mrp: product.mrp || '',
            ...(product.parentUnitUse || product.subUnit
                ? {
                    hasParent: true,
                    parentUnit: product.parentUnit || product.unit || '',
                    parentQty: product.parentQty || '',
                    unit: product.subUnit || '',
                    unitQty: product.subUnitQty || '',
                    pcsOfUnit: product.pcsOfUnit || '',
                }
                : {
                    hasParent: false,
                    parentUnit: '',
                    parentQty: '',
                    unitQty: '',
                    unit: product.unit || '',
                    pcsOfUnit: product.pcsOfUnit || '',
                }),
            freeProductSubQty: product.freeProductSubQty || '',
            freeProductPcsQty: product.freeProductPcsQty || '',
            note: product.note || '',
            isActive: product.isActive !== undefined ? product.isActive : true,
        });
        setEditingId(product._id);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData(EMPTY_FORM);
        setIsFormOpen(false);
    };

    const filteredProducts = [...products].reverse().filter((product) => {
        if (filters.startDate || filters.endDate) {
            if (!product.createdAt) return false;
            const datePart = product.createdAt.split(',')[0].trim(); // DD/MM/YYYY
            const [cDay, cMonth, cYear] = datePart.split('/');
            const productDate = new Date(`${cYear}-${cMonth}-${cDay}`);
            productDate.setHours(0, 0, 0, 0);
            if (filters.startDate) {
                const s = new Date(filters.startDate);
                s.setHours(0, 0, 0, 0);
                if (!isNaN(s) && productDate < s) return false;
            }
            if (filters.endDate) {
                const e = new Date(filters.endDate);
                e.setHours(0, 0, 0, 0);
                if (!isNaN(e) && productDate > e) return false;
            }
        }
        if (filters.productName && !low(product.productName).includes(low(filters.productName))) return false;
        if (filters.sku && !low(product.sku).includes(low(filters.sku))) return false;
        if (filters.category && !low(product.category).includes(low(filters.category))) return false;
        if (filters.company && !low(product.company).includes(low(filters.company))) return false;
        if (filters.companyContact && product.companyContact && product.companyContact !== filters.companyContact) return false;
        if (filters.status !== '' && String(product.isActive) !== filters.status) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const menuItems = (p) => [
        { label: 'View Details', icon: <FaEye size={12} />, tone: 'emerald', onClick: () => navigate(`/product-details/${p._id}`) },
        { label: 'Edit', icon: <FaEdit size={12} />, onClick: () => handleEdit(p) },
        { label: 'Delete', icon: <FaTrash size={12} />, tone: 'rose', onClick: () => handleDelete(p._id) },
    ];

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <PopStyle />
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Product Inventory Management</h1>
                        <p className="text-slate-500 text-xs sm:text-sm mt-1">
                            Manage your store items, stock levels, pricing, and details efficiently.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            if (isFormOpen && editingId) return handleCancelEdit();
                            if (!isFormOpen && !canAdd) return showToast('আপনার Add করার অনুমতি নেই!', 'error');
                            setIsFormOpen(!isFormOpen);
                        }}
                        className={`inline-flex items-center justify-center gap-2 px-5 min-h-[44px] w-full sm:w-auto whitespace-nowrap text-sm font-semibold cursor-pointer ${isFormOpen ? 'bg-rose-600 hover:bg-rose-700 text-white rounded-full' : 'bg-brand-600 text-white'
                            }`}
                    >
                        {isFormOpen ? <><FaMinus size={12} /> Close Form</> : <><FaPlus size={12} /> Add New Product</>}
                    </button>
                </div>

                {/* Form */}
                {isFormOpen && (
                    <div className="pd-pop">
                        <ProductForm
                            formData={formData}
                            setFormData={setFormData}
                            editingId={editingId}
                            setEditingId={setEditingId}
                            fetchProducts={fetchProducts}
                            setIsFormOpen={setIsFormOpen}
                            showToast={showToast}
                            products={products}
                        />
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4">
                    <div className="flex justify-between items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setFiltersOpen((v) => !v)}
                            aria-expanded={filtersOpen}
                            className="lg:cursor-default flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer min-h-[36px]"
                        >
                            <FaFilter className="text-brand-600" /> Filter &amp; Search
                            <FiChevronDown className={`lg:hidden w-4 h-4 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="flex items-center gap-1.5 text-xs bg-white border border-slate-300 hover:bg-rose-50 hover:text-rose-600 text-slate-600 px-3 h-9 rounded-xl font-semibold cursor-pointer"
                        >
                            <FaRedo size={11} /> Clear
                        </button>
                    </div>

                    <div className={`${filtersOpen ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3`}>
                        <div>
                            <label className={labelCls}>Start Date</label>
                            <DateInput name="startDate" value={filters.startDate} onChange={handleFilterChange} placeholder="Start date" />
                        </div>
                        <div>
                            <label className={labelCls}>End Date</label>
                            <DateInput name="endDate" value={filters.endDate} onChange={handleFilterChange} placeholder="End date" />
                        </div>
                        <div>
                            <label className={labelCls}>Product Name</label>
                            <ComboBox
                                value={filters.productName}
                                placeholder="Search or select product..."
                                options={productOptions}
                                emptyText="No product found"
                                onType={(v) => setF({ productName: v, company: '', companyContact: '' })}
                                onPick={(o) =>
                                    setF({
                                        productName: o.value.productName?.trim() || '',
                                        company: o.value.company?.trim() || '',
                                        companyContact: phoneOf(o.value),
                                    })
                                }
                                onClear={() => setF({ productName: '', company: '', companyContact: '' })}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>SKU</label>
                            <input type="text" name="sku" placeholder="Search SKU..." value={filters.sku} onChange={handleFilterChange} className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Category</label>
                            <ComboBox
                                value={filters.category}
                                placeholder="Search or select category..."
                                options={categoryOptions}
                                emptyText="No category found"
                                onType={(v) => setF({ category: v })}
                                onPick={(o) => setF({ category: o.value.name })}
                                onClear={() => setF({ category: '' })}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Company</label>
                            <ComboBox
                                value={filters.company}
                                placeholder="Search or select company..."
                                options={companyOptions}
                                emptyText="No company found"
                                onType={(v) => setF({ company: v, companyContact: '' })}
                                onPick={(o) => setF({ company: o.value.businessName, companyContact: o.value.contactNumber || '' })}
                                onClear={() => setF({ company: '', companyContact: '' })}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Status</label>
                            <select name="status" value={filters.status} onChange={handleFilterChange} className={`${inputCls} cursor-pointer`}>
                                <option value="">All Status</option>
                                <option value="true">Active</option>
                                <option value="false">In-Active</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div id="product-table-section" className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-6 space-y-2 sm:space-y-4 scroll-mt-20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FaBoxOpen className="text-brand-600" /> Product Inventory List
                        </h2>
                        <span className="px-3 py-1 bg-brand-50 text-brand-700 font-semibold text-xs rounded-full w-fit">
                            Showing {filteredProducts.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredProducts.length)}` : 0} of {filteredProducts.length} ({products.length} total)
                        </span>
                    </div>

                    {loading ? (
                        <Skeleton rows={6} />
                    ) : currentProducts.length === 0 ? (
                        <div className="text-center py-14 text-slate-400">
                            <FaBoxOpen size={32} className="mx-auto mb-2 text-slate-300" />
                            <p className="text-sm font-medium">No matching products found!</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1">
                                {currentProducts.map((p) => (
                                    <div
                                        key={p._id}
                                        className="relative rounded-lg border border-slate-200 bg-white pl-2.5 pr-1.5 py-1 shadow-sm"
                                    >
                                        <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${p.isActive === false ? 'bg-rose-400' : 'bg-brand-500'}`} />
                                        <div className="flex items-stretch gap-2">
                                            {/* Left: info */}
                                            <div className="min-w-0 flex-1 flex flex-col justify-between gap-0">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/product-details/${p._id}`)}
                                                        className="font-bold text-[13px] text-brand-700 text-left truncate cursor-pointer leading-tight"
                                                    >
                                                        {p.productName}
                                                    </button>
                                                    {p.isActive === false && (
                                                        <span className="px-1.5 py-px rounded-full text-[9px] font-bold bg-rose-50 text-rose-700 shrink-0">Inactive</span>
                                                    )}
                                                </div>
                                                <p className="text-[10.5px] text-slate-500 leading-[1.25] truncate">
                                                    <span className="font-semibold text-slate-700">{p.company || 'N/A'}</span>
                                                    {phoneOf(p) && <> • 📞 {phoneOf(p)}</>}
                                                </p>
                                                <p className="text-[10px] text-slate-600 leading-[1.25]">
                                                    <span className="uppercase text-slate-400 font-bold">Unit: </span>
                                                    <UnitInline p={p} />
                                                </p>
                                                <p className="text-[10px] text-slate-600 leading-[1.25]">
                                                    <span className="uppercase text-slate-400 font-bold">Free: </span>
                                                    <FreeInline p={p} />
                                                </p>
                                            </div>

                                            {/* Right: category, actions, prices */}
                                            <div className="shrink-0 w-[112px] flex flex-col justify-between gap-1">
                                                <div className="flex items-center gap-1.5 w-full justify-between">
                                                    <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[9.5px] font-bold truncate max-w-[74px]">
                                                        {p.category || 'No category'}
                                                    </span>
                                                    <RowMenu compact items={menuItems(p)} />
                                                </div>
                                                <div className="w-full space-y-px">
                                                    <div className="flex items-center justify-between rounded-md bg-rose-50 px-1.5 py-0">
                                                        <span className="text-[9px] font-bold text-rose-400">PUR</span>
                                                        <span className="text-[10.5px] font-bold text-rose-600">{money(p.purchasePrice)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-md bg-emerald-50 px-1.5 py-px">
                                                        <span className="text-[9px] font-bold text-emerald-400">SELL</span>
                                                        <span className="text-[10.5px] font-bold text-emerald-600">{money(p.sellingPrice)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between rounded-md bg-brand-50 px-1.5 py-px">
                                                        <span className="text-[9px] font-bold text-brand-400">MRP</span>
                                                        <span className="text-[10.5px] font-bold text-brand-700">{money(p.mrp)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="w-full min-w-[1000px] text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 uppercase tracking-wide">
                                            <th className="px-4 py-3">Product Name</th>
                                            <th className="px-4 py-3">Company</th>
                                            <th className="px-4 py-3">Category</th>
                                            <th className="px-4 py-3">Purchase</th>
                                            <th className="px-4 py-3">Selling</th>
                                            <th className="px-4 py-3">MRP</th>
                                            <th className="px-4 py-3">Unit / Pcs</th>
                                            <th className="px-4 py-3">Free Item</th>
                                            <th className="px-4 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {currentProducts.map((p) => (
                                            <tr key={p._id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/product-details/${p._id}`)}
                                                        className="text-brand-700 hover:underline font-bold text-left cursor-pointer"
                                                    >
                                                        {p.productName}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="font-medium">{p.company || 'N/A'}</div>
                                                    {phoneOf(p) && <div className="text-[11px] text-slate-400 mt-0.5">📞 {phoneOf(p)}</div>}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">{p.category || 'N/A'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap font-semibold text-rose-600">{money(p.purchasePrice)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap font-semibold text-emerald-600">{money(p.sellingPrice)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap font-semibold text-brand-700">{money(p.mrp)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap"><UnitInfo p={p} /></td>
                                                <td className="px-4 py-3 whitespace-nowrap"><FreeInfo p={p} /></td>
                                                <td className="px-4 py-3 text-center"><RowMenu items={menuItems(p)} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {!loading && filteredProducts.length > 0 && (
                        <Pager page={currentPage} total={totalPages} onChange={handlePageChange} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Product;