import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PurchaseForm from "./PurchaseForm";
import useDraftState, { clearDraft } from '../../../../hooks/useDraftState';

const matchesSearch = (text, fields) => {
    const q = (text || '').toString().trim().toLowerCase();
    if (!q) return true;
    return fields.some((f) => (f || '').toString().toLowerCase().includes(q));
};

const SearchSelect = ({ label, placeholder, searchValue, onSearchChange, onClear, onSelect, items, getKey, emptyText, renderItem }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    value={searchValue}
                    placeholder={placeholder}
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                        onSearchChange(e.target.value);
                        setOpen(true);
                    }}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    className="w-full px-4 py-3.5 pr-10 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm"
                />
                {searchValue && (
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onClear();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 text-sm cursor-pointer"
                    >
                        ✕
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-lg">
                    {items.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-slate-400">{emptyText}</p>
                    ) : (
                        items.map((item) => (
                            <div
                                key={getKey(item)}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onSelect(item);
                                    setOpen(false);
                                }}
                                className="px-4 py-2.5 cursor-pointer hover:bg-emerald-50 border-b border-slate-100 last:border-b-0"
                            >
                                {renderItem(item)}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const PurchaseAdd = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editingPurchase = location.state?.purchase || null;
    const isReceiveMode = location.state?.mode === 'receive';
    const [isEditMode] = useState(!!editingPurchase);
    const [editId] = useState(editingPurchase?._id || null);

    // Draft key: নতুন Purchase আর Edit/Receive এর draft আলাদা থাকবে
    const draftPrefix = editingPurchase ? `purchaseEdit:${editingPurchase._id}` : 'purchaseNew';
    const clearPurchaseDrafts = () => {
        ['items', 'overallAmount', 'overallType', 'adjText', 'adjAmount', 'adjType', 'note', 'form', 'companySearch', 'categorySearch', 'freeItems', 'freeFilter', 'freeSearch']
            .forEach((k) => clearDraft(`${draftPrefix}:${k}`));
    };

    // ---------------- Payment / Receive States ----------------
    const [investments, setInvestments] = useState([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentAmountTouched, setPaymentAmountTouched] = useState(false); // ইউজার নিজে হাতে Payment Amount change করেছে কিনা
    const [paymentAccountType, setPaymentAccountType] = useState('');
    const [selectedAccountKey, setSelectedAccountKey] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [isReceiving, setIsReceiving] = useState(false);

    // সিলেক্ট করা প্রোডাক্টগুলো রাখার স্টেট
    const [purchaseItems, setPurchaseItems] = useDraftState(`${draftPrefix}:items`, []);

    // PurchaseForm থেকে আসা company, phone, address, date, shippingAddress, category
    const [purchaseFormData, setPurchaseFormData] = useState({
        company: '',
        companyContact: '',
        companyAddress: '',
        date: '',
        shippingAddress: '',
        category: '',
    });

    // Purchase সফল হওয়ার পর PurchaseForm রিসেট করার জন্য key
    const [formResetKey, setFormResetKey] = useState(0);

    // Toast notification
    const [toast, setToast] = useState({ show: false, message: '', isError: false });

    // Overall Discount
    const [overallDiscountAmount, setOverallDiscountAmount] = useDraftState(`${draftPrefix}:overallAmount`, 0);
    const [overallDiscountType, setOverallDiscountType] = useDraftState(`${draftPrefix}:overallType`, 'amount'); // 'amount' | 'percent'

    // Adjustment
    const [adjustmentText, setAdjustmentText] = useDraftState(`${draftPrefix}:adjText`, '');
    const [adjustmentAmount, setAdjustmentAmount] = useDraftState(`${draftPrefix}:adjAmount`, 0);
    const [adjustmentType, setAdjustmentType] = useDraftState(`${draftPrefix}:adjType`, '+');

    // Order Note
    const [orderNote, setOrderNote] = useDraftState(`${draftPrefix}:note`, '');

    // ---------------- Others Free Product States ----------------
    const [freeProductOpen, setFreeProductOpen] = useState(false);
    const [freeProductItems, setFreeProductItems] = useDraftState(`${draftPrefix}:freeItems`, []);
    const [freeCategories, setFreeCategories] = useState([]);
    const [freeProducts, setFreeProducts] = useState([]);
    const [freeFilter, setFreeFilter] = useDraftState(`${draftPrefix}:freeFilter`, { category: '' });
    const [freeSearch, setFreeSearch] = useDraftState(`${draftPrefix}:freeSearch`, { category: '', product: '' });

    // --------------------------------------------------
    // PurchaseForm-কে দেওয়ার জন্য stable initialData (re-render এ যেন
    // নতুন object তৈরি না হয়, নাহলে ফর্মের ভ্যালু বারবার রিসেট হয়ে যায়)
    // --------------------------------------------------
    const initialFormData = useMemo(() => {
        if (!editingPurchase) return null;
        return {
            company: editingPurchase.company || '',
            companyContact: editingPurchase.phone || '',
            companyAddress: editingPurchase.address || '',
            date: editingPurchase.purchaseDate || '',
            shippingAddress: editingPurchase.shippingAddress || '',
            category: editingPurchase.category || '',
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --------------------------------------------------
    // Edit Mode হলে ডাটা প্রি-ফিল করবে
    // --------------------------------------------------
    useEffect(() => {
        if (editingPurchase) {
            const mappedItems = (editingPurchase.items || []).map((item, index) => {
                const qtyNum = Number(item.unitQty ?? item.qty) || 0;
                const pcsQtyNum = Number(item.pcsQty) || 0;
                const totalQtyNum =
                    item.totalPcs !== undefined && item.totalPcs !== null
                        ? Number(item.totalPcs) || 0
                        : item.pcs !== undefined && item.pcs !== null
                            ? Number(item.pcs) || 0
                            : qtyNum + pcsQtyNum;
                const pcsPerUnit =
                    qtyNum > 0 ? (totalQtyNum - pcsQtyNum) / qtyNum : 1;
                const freeUnitQtyNum = Number(item.freeUnitQty) || 0;
                const freePcsQtyNum = Number(item.freePcsQty) || 0;
                const baseFreeUnitQty =
                    qtyNum > 0 ? freeUnitQtyNum / qtyNum : 0;
                const baseFreePcsQty =
                    qtyNum > 0 ? freePcsQtyNum / qtyNum : 0;

                return {
                    _id: item.productId,
                    productName: item.productName,
                    company: editingPurchase.company || '',
                    category: editingPurchase.category || '',
                    uniqueId: `${item.productId || 'item'}-${index}-${Date.now()}`,
                    buyPrice: Number(item.buyPrice) || 0,
                    sellPrice: Number(item.sellPrice) || 0,
                    unit: item.unit || 'Pcs',
                    unitQty: qtyNum === 0 ? '' : qtyNum,
                    pcsQty: pcsQtyNum === 0 ? '' : pcsQtyNum,
                    pcsPerUnit: pcsPerUnit || 1,
                    totalQty: totalQtyNum,
                    freeUnitQty: item.freeUnitQty !== undefined && item.freeUnitQty !== null ? (Number(item.freeUnitQty) || '') : '',
                    freePcsQty: item.freePcsQty !== undefined && item.freePcsQty !== null ? (Number(item.freePcsQty) || '') : (Number(item.freeTotalQty ?? item.freeQty) || ''),
                    freeQty: Number(item.freeTotalQty ?? item.freeQty) || 0,
                    baseFreeUnitQty,
                    baseFreePcsQty,
                    discount: Number(item.discount) || 0,
                    discountType: item.discountType || 'amount',
                };
            });

            setPurchaseItems(mappedItems);
            setOverallDiscountAmount(editingPurchase.overallDiscount || 0);
            setOverallDiscountType(editingPurchase.overallDiscountType || 'amount');
            setAdjustmentText(editingPurchase.adjustment?.text || '');
            setAdjustmentAmount(editingPurchase.adjustment?.amount || 0);
            setAdjustmentType(editingPurchase.adjustment?.type || '+');
            setOrderNote(editingPurchase.orderNote || '');

            const restoredFreeItems = (editingPurchase.freeItems || []).map((item, index) => {
                const unitQty = Number(item.unitQty) || 0;
                const pcsQty = Number(item.pcsQty) || 0;
                const totalQty = Number(item.totalQty) || 0;
                const pcsPerUnit =
                    Number(item.pcsPerUnit) > 0
                        ? Number(item.pcsPerUnit)
                        : unitQty > 0
                            ? ((totalQty - pcsQty) / unitQty) || 1
                            : 1;

                return {
                    ...item,
                    uniqueId: `${item.productId || 'free'}-${index}-${Date.now()}`,
                    _id: item.productId,
                    unitQty: unitQty || '',
                    pcsQty: pcsQty || '',
                    pcsPerUnit,
                    totalQty,
                    sellPriceBundle: Number(item.sellPriceBundle) > 0 ? item.sellPriceBundle : '',
                    sellPricePcs: Number(item.sellPricePcs) > 0 ? item.sellPricePcs : '',
                };
            });
            setFreeProductItems(restoredFreeItems);
            if (restoredFreeItems.length > 0) {
                setFreeProductOpen(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --------------------------------------------------
    // Receive Mode হলে Investment Accounts fetch করবে
    // --------------------------------------------------
    useEffect(() => {
        if (isReceiveMode) {
            fetch('http://localhost:5000/investment')
                .then((res) => res.json())
                .then((data) => setInvestments(Array.isArray(data) ? data : []))
                .catch((error) => console.error('Error fetching investments:', error));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --------------------------------------------------
    // Number কে সবসময় 2 digit পর্যন্ত Round করার Helper
    // (floating point error যেমন 22.339999999 এড়ানোর জন্য)
    // --------------------------------------------------
    const roundTo2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

    // --------------------------------------------------
    // Others Free Product — Category / Product fetch
    // --------------------------------------------------
    useEffect(() => {
        fetch('http://localhost:5000/category')
            .then((res) => res.json())
            .then((data) => setFreeCategories(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching categories:', error));

        fetch('http://localhost:5000/product')
            .then((res) => res.json())
            .then((data) => setFreeProducts(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching products:', error));
    }, []);

    // Main table এ product add হলে Free list থেকে auto remove
    useEffect(() => {
        setFreeProductItems((prev) =>
            prev.filter(
                (item) =>
                    !purchaseItems.some(
                        (pi) =>
                            (pi._id && pi._id === item._id) ||
                            (pi.productName && pi.productName === item.productName)
                    )
            )
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [purchaseItems]);

    // --------------------------------------------------
    // Others Free Product — Add / Remove / Change
    // --------------------------------------------------
    const getFreeUnitTotal = (item) =>
        (Number(item.unitQty) || 0) * (Number(item.sellPriceBundle) || 0);
    const getFreePcsTotal = (item) =>
        (Number(item.pcsQty) || 0) * (Number(item.sellPricePcs) || 0);
    const getFreeRowTotal = (item) => getFreeUnitTotal(item) + getFreePcsTotal(item);

    const handleAddFreeProduct = (product) => {
        const newItem = {
            uniqueId: Date.now() + Math.random(),
            _id: product._id,
            productName: product.productName || '',
            company: product.company || '',
            unit: product.unit || 'Pcs',
            unitQty: '',
            pcsQty: '',
            pcsPerUnit: Number(product.pcsOfUnit) || 1,
            totalQty: 0,
            sellPriceBundle: roundTo2((Number(product.sellingPrice) || 0) * (Number(product.pcsOfUnit) || 1)),
            sellPricePcs: Number(product.sellingPrice) || 0,
        };
        setFreeProductItems((prev) => [...prev, newItem]);
        setFreeSearch((prev) => ({ ...prev, product: '' }));
    };

    const handleRemoveFreeItem = (uniqueId) => {
        setFreeProductItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
    };

    const handleFreeItemChange = (uniqueId, field, value) => {
        if (value !== '' && Number(value) < 0) return;

        setFreeProductItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) return item;

                if (field === 'unitQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const pcsQtyVal = Number(item.pcsQty) || 0;
                    return {
                        ...item,
                        unitQty: value === '' ? '' : numVal,
                        totalQty: numVal * (Number(item.pcsPerUnit) || 1) + pcsQtyVal,
                    };
                }

                if (field === 'pcsQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const unitQtyVal = Number(item.unitQty) || 0;
                    return {
                        ...item,
                        pcsQty: value === '' ? '' : numVal,
                        totalQty: unitQtyVal * (Number(item.pcsPerUnit) || 1) + numVal,
                    };
                }

                if (field === 'sellPriceBundle') {
                    const bundlePriceVal = value === '' ? 0 : Number(value) || 0;
                    return {
                        ...item,
                        sellPriceBundle: value,
                        sellPricePcs: roundTo2(bundlePriceVal / (Number(item.pcsPerUnit) || 1)),
                    };
                }

                return { ...item, [field]: value };
            })
        );
    };

    const handleSelectFreeCategory = (cat) => {
        setFreeFilter({ category: cat.name });
        setFreeSearch((prev) => ({ ...prev, category: cat.name, product: '' }));
    };

    const handleClearFreeCategory = () => {
        setFreeFilter({ category: '' });
        setFreeSearch((prev) => ({ ...prev, category: '', product: '' }));
    };

    const addedMainProductIds = purchaseItems.map((item) => item.productName || item._id);
    const addedFreeProductIds = freeProductItems.map((item) => item.productName || item._id);

    const filteredFreeCategories = freeCategories
        .filter((cat) => cat.isActive === true)
        .filter((cat) => matchesSearch(freeSearch.category, [cat.name]));

    const filteredFreeProducts = freeProducts.filter((prod) => {
        if (!prod.productName) return false;
        if (prod.isActive !== true) return false;
        if (freeFilter.category && prod.category !== freeFilter.category) return false;

        const isAlreadyAdded =
            addedMainProductIds.includes(prod._id) ||
            addedMainProductIds.includes(prod.productName) ||
            addedFreeProductIds.includes(prod._id) ||
            addedFreeProductIds.includes(prod.productName);
        if (isAlreadyAdded) return false;

        return matchesSearch(freeSearch.product, [prod.productName, prod.sku]);
    });

    const freeItemsPayload = freeProductItems.map((item) => ({
        productId: item._id,
        productName: item.productName,
        company: item.company,
        unit: item.unit || 'Pcs',
        unitQty: Number(item.unitQty) || 0,
        pcsQty: Number(item.pcsQty) || 0,
        pcsPerUnit: Number(item.pcsPerUnit) || 1,
        totalQty: Number(item.totalQty) || 0,
        sellPriceBundle: roundTo2(item.sellPriceBundle),
        sellPricePcs: roundTo2(item.sellPricePcs),
        subtotal: roundTo2(getFreeRowTotal(item)),
    }));

    // --------------------------------------------------
    // Invoice Number Generate (YYMMDDHHMMSS - 24hr, no separators)
    // --------------------------------------------------
    const generateInvoiceNo = () => {
        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        // 24-hour format (international), AM/PM mix হবে না
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');

        return `${yy}${mm}${dd}${hh}${min}${ss}`;
    };

    // --------------------------------------------------
    // Purchase Form Data (company/phone/address/date/shipping) Update
    // --------------------------------------------------
    const handleFormDataChange = (data) => {
        setPurchaseFormData(data);
    };

    // --------------------------------------------------
    // Company Clear Handler -> company select kete dile,
    // table a add kra shob product remove/reset hye jbe
    // --------------------------------------------------
    const handleCompanyClear = () => {
        setPurchaseItems([]);
    };

    // --------------------------------------------------
    // Product Add
    // --------------------------------------------------
    const handleAddProduct = (product) => {
        const initialUnitQty = '';
        const initialPcsQty = '';
        const baseFreeUnitQty = Number(product.freeProductUnitQty) || 0;
        const baseFreePcsQty = Number(product.freeProductPcsQty) || 0;
        const pcsPerUnit = Number(product.pcsOfUnit) || 1;

        const newItem = {
            ...product,
            uniqueId: Date.now() + Math.random(),

            productName: product.productName || '',
            company: product.company || '',
            category: product.category || null,
            sku: product.sku || null,

            buyPrice: Number(product.purchasePrice) || 0,
            sellPrice: Number(product.sellingPrice) || 0,

            unit: product.unit || 'Pcs',

            unitQty: initialUnitQty,

            pcsQty: initialPcsQty,

            pcsPerUnit: pcsPerUnit,

            totalQty: (Number(initialUnitQty) || 0) * pcsPerUnit + (Number(initialPcsQty) || 0),

            freeUnitQty: '',
            freePcsQty: '',
            freeQty: 0,

            // মূল Free Qty (per unit multiplier)
            baseFreeUnitQty: baseFreeUnitQty,
            baseFreePcsQty: baseFreePcsQty,

            // Product Discount
            discount: 0,
            discountType: 'amount', // 'amount' | 'percent'
        };

        setPurchaseItems((prev) => [...prev, newItem]);
    };

    // --------------------------------------------------
    // Product Remove
    // --------------------------------------------------
    const handleRemoveItem = (uniqueId) => {
        setPurchaseItems((prev) =>
            prev.filter((item) => item.uniqueId !== uniqueId)
        );
    };

    // --------------------------------------------------
    // Item Change
    // --------------------------------------------------
    const handleItemChange = (uniqueId, field, value) => {
        // Negative value allow করবে না
        if (value !== '' && Number(value) < 0) return;

        setPurchaseItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) {
                    return item;
                }
                // ------------------------------------------
                // Unit Qty Change
                // ------------------------------------------
                if (field === 'unitQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const pcsQtyVal = Number(item.pcsQty) || 0;

                    const newTotalQty =
                        numVal * (Number(item.pcsPerUnit) || 1) + pcsQtyVal;

                    const newFreeUnitQty =
                        numVal * (Number(item.baseFreeUnitQty) || 0);
                    const newFreePcsQty =
                        numVal * (Number(item.baseFreePcsQty) || 0);
                    const newFreeQty =
                        newFreeUnitQty * (Number(item.pcsPerUnit) || 1) + newFreePcsQty;

                    return {
                        ...item,
                        unitQty: value === '' ? '' : numVal,
                        totalQty: newTotalQty,
                        freeUnitQty: newFreeUnitQty || '',
                        freePcsQty: newFreePcsQty || '',
                        freeQty: newFreeQty,
                    };
                }

                // ------------------------------------------
                // Free Unit Qty Change
                // ------------------------------------------
                if (field === 'freeUnitQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const freePcsQtyVal = Number(item.freePcsQty) || 0;

                    const newFreeQty =
                        numVal * (Number(item.pcsPerUnit) || 1) + freePcsQtyVal;

                    return {
                        ...item,
                        freeUnitQty: value === '' ? '' : numVal,
                        freeQty: newFreeQty,
                    };
                }

                // ------------------------------------------
                // Free PCS Qty Change
                // ------------------------------------------
                if (field === 'freePcsQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const freeUnitQtyVal = Number(item.freeUnitQty) || 0;

                    const newFreeQty =
                        freeUnitQtyVal * (Number(item.pcsPerUnit) || 1) + numVal;

                    return {
                        ...item,
                        freePcsQty: value === '' ? '' : numVal,
                        freeQty: newFreeQty,
                    };
                }

                // ------------------------------------------
                // PCS Qty Change
                // ------------------------------------------
                if (field === 'pcsQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const unitQtyVal = Number(item.unitQty) || 0;

                    const newTotalQty =
                        unitQtyVal * (Number(item.pcsPerUnit) || 1) + numVal;

                    return {
                        ...item,
                        pcsQty: value === '' ? '' : numVal,
                        totalQty: newTotalQty,
                    };
                }

                // ------------------------------------------
                // Free Qty Change
                // ------------------------------------------
                if (field === 'freeQty') {
                    return {
                        ...item,
                        freeQty:
                            value === ''
                                ? ''
                                : Number(value),
                    };
                }

                // ------------------------------------------
                // Discount Change
                // ------------------------------------------
                if (field === 'discount') {
                    return {
                        ...item,
                        discount:
                            value === ''
                                ? ''
                                : Number(value),
                    };
                }

                // ------------------------------------------
                // Other Fields
                // ------------------------------------------
                return {
                    ...item,
                    [field]: value,
                };
            })
        );
    };


    // --------------------------------------------------
    // Discount Type Toggle (Amount / Percent)
    // --------------------------------------------------
    const handleToggleDiscountType = (uniqueId) => {
        setPurchaseItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) return item;
                return {
                    ...item,
                    discountType: item.discountType === 'percent' ? 'amount' : 'percent',
                };
            })
        );
    };

    // --------------------------------------------------
    // Added Product IDs
    // --------------------------------------------------
    const addedProductIds = purchaseItems.map(
        (item) => item.productName || item._id
    );

    // --------------------------------------------------
    // Payment Account Type List (Investment থেকে unique accountType)
    // --------------------------------------------------
    const accountTypes = [...new Set(investments.map((inv) => inv.accountType).filter(Boolean))];

    // প্রতিটা account কে unique চেনার জন্য key বানানো (accountType অনুযায়ী)
    const getAccountKey = (inv) => {
        if (inv.accountType === 'Bank') {
            return `${inv.bankName}-${inv.accountNumber}-${inv.accountBranch}`;
        }
        if (inv.accountType === 'Mobile Banking') {
            return `${inv.accountName}-${inv.accountNumber}`;
        }
        return 'cash';
    };

    // Selected Account Type অনুযায়ী Unique Account গুলো বের করা (duplicate বাদ দিয়ে)
    const uniqueAccountsMap = new Map();
    investments
        .filter((inv) => inv.accountType === paymentAccountType)
        .forEach((inv) => {
            const key = getAccountKey(inv);
            if (!uniqueAccountsMap.has(key)) {
                uniqueAccountsMap.set(key, inv);
            }
        });
    const uniqueAccounts = Array.from(uniqueAccountsMap.values());

    const selectedAccountInfo = uniqueAccounts.find(
        (inv) => getAccountKey(inv) === selectedAccountKey
    );

    // --------------------------------------------------
    // TOTAL CALCULATIONS
    // --------------------------------------------------

    // Product-এর মূল SubTotal
    const subTotal = roundTo2(
        purchaseItems.reduce((total, item) => {
            const buyPrice = Number(item.buyPrice) || 0;
            const totalQty = Number(item.totalQty) || 0;

            return total + buyPrice * totalQty;
        }, 0)
    );

    // Product Wise Discount (percent হলে row gross total অনুযায়ী হিসাব হবে)
    const productWiseDiscount = roundTo2(
        purchaseItems.reduce((total, item) => {
            const rowGrossTotal = (Number(item.buyPrice) || 0) * (Number(item.totalQty) || 0);
            const effectiveDiscount =
                item.discountType === 'percent'
                    ? (rowGrossTotal * (Number(item.discount) || 0)) / 100
                    : Number(item.discount) || 0;
            return total + effectiveDiscount;
        }, 0)
    );

    // Grand Total এর তুলনায় Product Wise Discount কত % হলো তার হিসাব
    const productWiseDiscountPercent =
        subTotal > 0 ? roundTo2((productWiseDiscount / subTotal) * 100) : 0;

    // Overall Discount (Grand Total - Product Wise Discount এর উপর হিসাব হবে)
    const afterProductDiscount = subTotal - productWiseDiscount;
    const overallDiscountValue = roundTo2(
        overallDiscountType === 'percent'
            ? (afterProductDiscount * (Number(overallDiscountAmount) || 0)) / 100
            : Number(overallDiscountAmount) || 0
    );

    const overallDiscountPercent =
        overallDiscountType === 'amount'
            ? (afterProductDiscount > 0 ? roundTo2(((Number(overallDiscountAmount) || 0) / afterProductDiscount) * 100) : 0)
            : 0;

    // Adjustment
    const adjustmentValue =
        Number(adjustmentAmount) || 0;

    let payableAmount =
        afterProductDiscount -
        overallDiscountValue;

    if (adjustmentType === '+') {
        payableAmount += adjustmentValue;
    } else {
        payableAmount -= adjustmentValue;
    }

    // Payable কখনো negative হবে না
    if (payableAmount < 0) {
        payableAmount = 0;
    }

    payableAmount = roundTo2(payableAmount);


    // --------------------------------------------------
    // Receive Mode এ Payment Amount লাইভ Payable Amount এর সাথে
    // sync থাকবে, যতক্ষণ না ইউজার নিজে হাতে সেটা edit করছে
    // --------------------------------------------------
    useEffect(() => {
        if (isReceiveMode && !paymentAmountTouched) {
            setPaymentAmount(payableAmount);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [payableAmount, isReceiveMode, paymentAmountTouched]);

    // --------------------------------------------------
    // Submit
    // --------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        // ---------------- Validation ----------------
        if (!purchaseFormData.company) {
            setToast({ show: true, message: 'Company is required!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        if (!purchaseFormData.date) {
            setToast({ show: true, message: 'Date is required!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        if (purchaseItems.length === 0 && freeProductItems.length === 0) {
            setToast({ show: true, message: 'Please add at least one product!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        const hasInvalidQty = purchaseItems.some(
            (item) =>
                (Number(item.totalQty) || 0) <= 0 && (Number(item.freeQty) || 0) <= 0
        );

        if (hasInvalidQty) {
            setToast({ show: true, message: 'Each product must have a valid quantity (Unit/PCS/Free)!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }
        const hasInvalidFreeQty = freeProductItems.some(
            (item) => (Number(item.totalQty) || 0) <= 0
        );
        if (hasInvalidFreeQty) {
            setToast({ show: true, message: 'Each free product must have a valid quantity (greater than 0)!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }
        // ---------------- Validation End ----------------

        const itemsPayload = purchaseItems.map((item) => {
            const totalQty = Number(item.totalQty) || 0;
            const rowGrossTotal =
                (Number(item.buyPrice) || 0) * totalQty;
            const effectiveDiscount =
                item.discountType === 'percent'
                    ? roundTo2((rowGrossTotal * (Number(item.discount) || 0)) / 100)
                    : roundTo2(Number(item.discount) || 0);
            const rowSubtotal =
                roundTo2(rowGrossTotal - effectiveDiscount);

            return {
                productId: item.uniqueId,
                productName: item.productName,
                buyPrice: roundTo2(item.buyPrice),
                sellPrice: roundTo2(item.sellPrice),
                unit: item.unit || 'Pcs',
                unitQty: Number(item.unitQty) || 0,
                pcsQty: Number(item.pcsQty) || 0,
                totalPcs: totalQty,
                freeUnitQty: Number(item.freeUnitQty) || 0,
                freePcsQty: Number(item.freePcsQty) || 0,
                freeTotalQty: item.freeQty,
                discount: roundTo2(item.discount),
                discountType: item.discountType || 'amount',
                discountAmount: effectiveDiscount,
                subtotal: rowSubtotal,
            };
        });

        const purchaseData = {
            invoiceNo: isEditMode ? editingPurchase.invoiceNo : generateInvoiceNo(),
            company: purchaseFormData.company,
            phone: purchaseFormData.companyContact,
            address: purchaseFormData.companyAddress,
            shippingAddress: purchaseFormData.shippingAddress,
            category: purchaseFormData.category,
            purchaseDate: purchaseFormData.date,

            items: itemsPayload,

            grandTotal: subTotal,
            productWiseDiscount: productWiseDiscount,
            productWiseDiscountPercent: productWiseDiscountPercent,

            overallDiscount: roundTo2(overallDiscountAmount),
            overallDiscountType: overallDiscountType,
            overallDiscountValue: overallDiscountValue,

            freeItems: freeItemsPayload,

            adjustment: {
                text: adjustmentText,
                amount: roundTo2(adjustmentValue),
                type: adjustmentType,
            },

            payableAmount: payableAmount,

            orderNote: orderNote,
        };

        try {
            const url = isEditMode
                ? `http://localhost:5000/purchase/${editId}`
                : 'http://localhost:5000/purchase';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purchaseData),
            });

            if (!res.ok) {
                throw new Error('Failed to save purchase');
            }

            await res.json();

            // Toast দেখাবে
            setToast({
                show: true,
                message: isEditMode
                    ? `Purchase updated successfully! Invoice: ${purchaseData.invoiceNo}`
                    : `Purchase added successfully! Invoice: ${purchaseData.invoiceNo}`,
                isError: false,
            });

            clearPurchaseDrafts();
            // টেবিল ও ফর্ম রিসেট
            setPurchaseItems([]);
            setOverallDiscountAmount(0);
            setOverallDiscountType('amount');
            setAdjustmentText('');
            setAdjustmentAmount(0);
            setAdjustmentType('+');
            setOrderNote('');
            setFormResetKey((prev) => prev + 1);
            // Purchase লিস্টে ফিরে যাবে যাতে fresh data load হয় (রিফ্রেশ লাগবে না)
            setTimeout(() => {
                navigate('/purchase', { replace: true, state: null });
            }, 1000);
        } catch (error) {
            console.error('Error saving purchase:', error);
            setToast({
                show: true,
                message: isEditMode ? 'Failed to update purchase. Try again.' : 'Failed to save purchase. Try again.',
                isError: true,
            });
            setTimeout(() => {
                setToast({ show: false, message: '', isError: false });
            }, 3000);
        }
    };

    // --------------------------------------------------
    // Receive Submit
    // --------------------------------------------------
    const handleReceiveSubmit = async () => {
        if (isReceiving) return;
        // ---------------- Validation ----------------
        if (paymentAmount === '' || paymentAmount === null) {
            setToast({ show: true, message: 'Payment amount is required!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        if (!paymentAccountType) {
            setToast({ show: true, message: 'Please select a payment method!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        if (!selectedAccountInfo) {
            setToast({ show: true, message: 'Please select an account!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        const today = new Date();
        const receiveDate = today.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

        // Payment Method অনুযায়ী Account Info সাজানো
        let accountInfo = {};
        if (paymentAccountType === 'Bank') {
            accountInfo = {
                bankName: selectedAccountInfo.bankName || '',
                accountNumber: selectedAccountInfo.accountNumber || '',
                accountBranch: selectedAccountInfo.accountBranch || '',
            };
        } else if (paymentAccountType === 'Mobile Banking') {
            accountInfo = {
                accountName: selectedAccountInfo.accountName || '',
                accountNumber: selectedAccountInfo.accountNumber || '',
            };
        } else {
            accountInfo = {
                accountName: 'Cash',
            };
        }

        const itemsPayload = purchaseItems.map((item) => {
            const totalQty = Number(item.totalQty) || 0;
            const rowGrossTotal =
                (Number(item.buyPrice) || 0) * totalQty;
            const effectiveDiscount =
                item.discountType === 'percent'
                    ? roundTo2((rowGrossTotal * (Number(item.discount) || 0)) / 100)
                    : roundTo2(Number(item.discount) || 0);
            const rowSubtotal =
                roundTo2(rowGrossTotal - effectiveDiscount);

            return {
                productId: item.uniqueId,
                productName: item.productName,
                buyPrice: roundTo2(item.buyPrice),
                sellPrice: roundTo2(item.sellPrice),
                unit: item.unit || 'Pcs',
                unitQty: Number(item.unitQty) || 0,
                pcsQty: Number(item.pcsQty) || 0,
                totalPcs: totalQty,
                freeUnitQty: Number(item.freeUnitQty) || 0,
                freePcsQty: Number(item.freePcsQty) || 0,
                freeTotalQty: item.freeQty,
                discount: roundTo2(item.discount),
                discountType: item.discountType || 'amount',
                subtotal: rowSubtotal,
            };
        });

        const receiveData = {
            company: purchaseFormData.company,
            phone: purchaseFormData.companyContact,
            address: purchaseFormData.companyAddress,
            shippingAddress: purchaseFormData.shippingAddress,
            category: purchaseFormData.category,
            purchaseDate: purchaseFormData.date,

            items: itemsPayload,

            grandTotal: subTotal,
            productWiseDiscount: productWiseDiscount,
            productWiseDiscountPercent: productWiseDiscountPercent,

            overallDiscount: roundTo2(overallDiscountAmount),
            overallDiscountType: overallDiscountType,

            adjustment: {
                text: adjustmentText,
                amount: roundTo2(adjustmentValue),
                type: adjustmentType,
            },

            payableAmount: payableAmount,
            orderNote: orderNote,

            freeItems: freeItemsPayload,

            paidAmount: roundTo2(paymentAmount),
            receiveDate: receiveDate,
            receiveStatus: 'Received',
            paymentMethod: paymentAccountType,
            paymentAccount: accountInfo,
            paymentNote: paymentNote,
        };

        try {
            setIsReceiving(true);
            const res = await fetch(`http://localhost:5000/purchase/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(receiveData),
            });

            if (!res.ok) {
                throw new Error('Failed to receive purchase');
            }

            await res.json();

            clearPurchaseDrafts();
            setToast({
                show: true,
                message: 'Payment received successfully!',
                isError: false,
            });

            setTimeout(() => {
                navigate('/purchase', { replace: true, state: null });
            }, 1000);
        } catch (error) {
            console.error('Error receiving purchase:', error);
            setIsReceiving(false);
            setToast({
                show: true,
                message: 'Failed to receive payment. Try again.',
                isError: true,
            });
            setTimeout(() => {
                setToast({ show: false, message: '', isError: false });
            }, 3000);
        }
    };

    return (
        <div>
            {/* Toast Notification */}
            {toast.show && (
                <div
                    className={`fixed top-6 right-6 z-[200] px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold text-white flex items-center gap-2 transition-all ${toast.isError ? 'bg-rose-600' : 'bg-gradient-to-br from-teal-600 to-emerald-500'
                        }`}
                >
                    {toast.isError ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    {toast.message}
                </div>
            )}

            {/* -----------------------------------------
                Product Select Form
            ----------------------------------------- */}
            <PurchaseForm
                key={formResetKey}
                onAddProduct={handleAddProduct}
                addedProductIds={addedProductIds}
                onFormDataChange={handleFormDataChange}
                initialData={initialFormData}
                draftKey={draftPrefix}
                onCompanyClear={handleCompanyClear}
            />

            {/* -----------------------------------------
                Main Purchase Table
            ----------------------------------------- */}
            <div className="w-full px-0 sm:px-1 my-6 relative z-0">
                <div className="bg-white rounded-3xl shadow-xl shadow-teal-900/5 p-6 md:p-8 border border-teal-100/70">

                    <form onSubmit={handleSubmit}>

                        {/* ---------------------------------
                            Product Table
                        --------------------------------- */}
                        <div className="rounded-2xl border border-teal-100">
                            <table className="w-full table-fixed text-left border-collapse [&_td>input]:w-full [&_td_input]:min-w-0">
                                <colgroup>
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '13%' }} />
                                    <col style={{ width: '7%' }} />
                                    <col style={{ width: '13%' }} />
                                    <col style={{ width: '7%' }} />
                                    <col style={{ width: '14%' }} />
                                    <col style={{ width: '5%' }} />
                                    <col style={{ width: '4%' }} />
                                </colgroup>

                                <thead>
                                    <tr className="bg-teal-50/60 border-b-2 border-teal-100 text-xs font-semibold text-teal-800">

                                        <th className="py-3 px-3">
                                            Product Name
                                        </th>

                                        <th className="py-3 px-3">
                                            Company
                                        </th>

                                        <th className="py-3 px-3">
                                            Buy Price
                                        </th>

                                        <th className="py-3 px-3">
                                            Sell Price
                                        </th>

                                        <th className="py-3 pl-4 pr-1">
                                            Unit Qty
                                        </th>

                                        <th className="py-3 pl-3 pr-2">
                                            PCS Qty
                                        </th>

                                        <th className="py-3 pl-4 pr-1">
                                            Free Unit
                                        </th>

                                        <th className="py-3 pl-3 pr-2">
                                            Free PCS
                                        </th>

                                        <th className="py-3 px-3">
                                            Discount
                                        </th>

                                        <th className="py-3 px-3">
                                            Subtotal
                                        </th>

                                        <th className="py-3 px-3 text-center">
                                            Action
                                        </th>

                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 text-sm">

                                    {purchaseItems.length > 0 ? (

                                        purchaseItems.map((item) => {

                                            // Row Subtotal
                                            const rowGrossTotal =
                                                (Number(item.buyPrice) || 0) *
                                                (Number(item.totalQty) || 0);

                                            const rowEffectiveDiscount =
                                                item.discountType === 'percent'
                                                    ? roundTo2((rowGrossTotal * (Number(item.discount) || 0)) / 100)
                                                    : roundTo2(Number(item.discount) || 0);

                                            const rowDiscountPercent =
                                                item.discountType === 'amount'
                                                    ? (rowGrossTotal > 0 ? roundTo2(((Number(item.discount) || 0) / rowGrossTotal) * 100) : 0)
                                                    : 0;

                                            const rowSubtotal =
                                                roundTo2(rowGrossTotal - rowEffectiveDiscount);

                                            const currentUnitLabel =
                                                item.unit || 'Pcs';

                                            return (
                                                <tr
                                                    key={item.uniqueId}
                                                    className="hover:bg-teal-50/40 transition"
                                                >

                                                    {/* Product Name */}
                                                    <td className="py-3 px-3">
                                                        <div className="font-semibold text-slate-800">
                                                            {item.productName}
                                                        </div>
                                                    </td>

                                                    {/* Company */}
                                                    <td className="py-3 px-3 text-slate-600">
                                                        {item.company}
                                                    </td>

                                                    {/* Buy Price */}
                                                    <td className="py-3 px-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.buyPrice}
                                                            onChange={(e) => {
                                                                const value = e.target.value;

                                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                    handleItemChange(
                                                                        item.uniqueId,
                                                                        'buyPrice',
                                                                        value
                                                                    );
                                                                }
                                                            }}
                                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                        />
                                                    </td>

                                                    {/* Sell Price */}
                                                    <td className="py-3 px-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.sellPrice}
                                                            onChange={(e) => {
                                                                const value = e.target.value;

                                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                    handleItemChange(
                                                                        item.uniqueId,
                                                                        'sellPrice',
                                                                        value
                                                                    );
                                                                }
                                                            }}
                                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                        />
                                                    </td>

                                                    {/* Unit Qty */}
                                                    <td className="relative py-3 pl-2 pr-0">
                                                        <div
                                                            className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${Number(item.totalQty) > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'
                                                                }`}
                                                        >
                                                            Total: {item.totalQty}
                                                        </div>
                                                        <div className="p-1.5 bg-indigo-50 border border-r-0 border-indigo-200 rounded-l-2xl">
                                                            <div className="flex items-center border border-indigo-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">

                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="1"
                                                                    placeholder="0"
                                                                    value={item.unitQty}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;

                                                                        if (/^\d*$/.test(value)) {
                                                                            handleItemChange(
                                                                                item.uniqueId,
                                                                                'unitQty',
                                                                                value
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center"
                                                                />

                                                                <span
                                                                    className="flex-1 bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                    title="Unit"
                                                                >
                                                                    {currentUnitLabel}
                                                                </span>

                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* PCS Qty */}
                                                    <td className="py-3 pl-0 pr-2">
                                                        <div className="p-1.5 bg-indigo-50 border border-l-0 border-indigo-200 rounded-r-2xl">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                placeholder="0"
                                                                value={item.pcsQty}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;

                                                                    if (/^\d*$/.test(value)) {
                                                                        handleItemChange(
                                                                            item.uniqueId,
                                                                            'pcsQty',
                                                                            value
                                                                        );
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-sm outline-none shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                                            />
                                                        </div>
                                                    </td>

                                                    {/* Free Unit Qty */}
                                                    <td className="relative py-3 pl-2 pr-0">
                                                        <div
                                                            className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${Number(item.freeQty) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                                                                }`}
                                                        >
                                                            Total: {item.freeQty}
                                                        </div>
                                                        <div className="p-1.5 bg-emerald-50 border border-r-0 border-emerald-200 rounded-l-2xl">
                                                            <div className="flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">

                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="1"
                                                                    placeholder="0"
                                                                    value={item.freeUnitQty}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;

                                                                        if (/^\d*$/.test(value)) {
                                                                            handleItemChange(
                                                                                item.uniqueId,
                                                                                'freeUnitQty',
                                                                                value
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center"
                                                                />

                                                                <span
                                                                    className="flex-1 bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                    title="Unit"
                                                                >
                                                                    {currentUnitLabel}
                                                                </span>

                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Free PCS Qty */}
                                                    <td className="py-3 pl-0 pr-2">
                                                        <div className="p-1.5 bg-emerald-50 border border-l-0 border-emerald-200 rounded-r-2xl">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                placeholder="0"
                                                                value={item.freePcsQty}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;

                                                                    if (/^\d*$/.test(value)) {
                                                                        handleItemChange(
                                                                            item.uniqueId,
                                                                            'freePcsQty',
                                                                            value
                                                                        );
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-sm outline-none shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                            />
                                                        </div>
                                                    </td>

                                                    {/* Discount */}
                                                    <td className="py-3 px-3 relative">
                                                        <div
                                                            className={`absolute top-1 left-11 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${(item.discountType === 'percent' ? rowEffectiveDiscount : rowDiscountPercent)
                                                                ? 'bg-amber-100 text-amber-700'
                                                                : 'bg-slate-100 text-slate-400'
                                                                }`}
                                                        >
                                                            {item.discountType === 'percent'
                                                                ? `৳${rowEffectiveDiscount.toFixed(2)}`
                                                                : `${rowDiscountPercent.toFixed(2)}%`}
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleToggleDiscountType(item.uniqueId)
                                                                }
                                                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
                                                                title="Click to toggle Amount / Percentage"
                                                            >
                                                                {item.discountType === 'percent' ? '%' : '৳'}
                                                            </button>

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                placeholder="0"
                                                                value={item.discount === 0 ? '' : item.discount}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;

                                                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                        handleItemChange(
                                                                            item.uniqueId,
                                                                            'discount',
                                                                            value
                                                                        );
                                                                    }
                                                                }}
                                                                className="w-20 px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                            />
                                                        </div>
                                                    </td>

                                                    {/* Row Subtotal */}
                                                    <td className="py-3 px-3 font-bold text-emerald-700">
                                                        {rowSubtotal.toFixed(2)}
                                                    </td>

                                                    {/* Action */}
                                                    <td className="py-3 px-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveItem(
                                                                    item.uniqueId
                                                                )
                                                            }
                                                            className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                strokeWidth={1.5}
                                                                stroke="currentColor"
                                                                className="w-5 h-5"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </td>

                                                </tr>
                                            );
                                        })

                                    ) : (

                                        <tr>
                                            <td
                                                colSpan="11"
                                                className="text-center py-8 text-slate-400 text-sm"
                                            >
                                                No products added yet.
                                                Please select a company
                                                and product above.
                                            </td>
                                        </tr>

                                    )}

                                </tbody>
                            </table>
                        </div>


                        {/* =================================
    SUMMARY SECTION
================================= */}
                        <div className="mt-6 flex justify-end">

                            <div className="w-full md:w-[700px] space-y-2.5 bg-teal-50/40 border border-teal-100 rounded-2xl p-5">

                                {/* Grand Total */}
                                <div className="flex items-center">
                                    <label className="w-56 text-right pr-3 text-sm font-medium text-slate-600">
                                        Grand Total
                                    </label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={subTotal.toFixed(2)}
                                        className="flex-1 px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-sm outline-none"
                                    />
                                </div>

                                {/* Product Wise Discount */}
                                <div className="flex items-center">
                                    <label className="w-56 text-right pr-3 text-sm font-medium text-slate-600">
                                        Product Wise Discount
                                    </label>

                                    <div className="flex flex-1 rounded-lg overflow-hidden border border-slate-200">
                                        <input
                                            type="text"
                                            readOnly
                                            value={productWiseDiscount.toFixed(2)}
                                            className="flex-1 min-w-0 px-3 py-2 bg-slate-100 text-sm outline-none"
                                        />

                                        <input
                                            type="text"
                                            readOnly
                                            value={productWiseDiscountPercent ? `${productWiseDiscountPercent.toFixed(2)}%` : ''}
                                            placeholder="0%"
                                            title="Grand Total এর তুলনায় Discount percentage"
                                            className="w-28 shrink-0 px-3 py-2 border-l border-slate-200 bg-slate-100 text-sm outline-none text-slate-600"
                                        />
                                    </div>
                                </div>

                                {/* Overall Discount */}
                                <div className="flex items-center">

                                    <label className="w-56 text-right pr-3 text-sm font-medium text-slate-600">
                                        Overall Discount
                                    </label>

                                    <div className="flex flex-1 rounded-lg overflow-hidden border border-slate-200">

                                        {/* Overall Discount Amount */}
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0"
                                            value={overallDiscountAmount === 0 ? '' : overallDiscountAmount}
                                            onChange={(e) => {
                                                const value = e.target.value;

                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                    setOverallDiscountAmount(
                                                        value === '' ? '' : Number(value)
                                                    );
                                                }
                                            }}
                                            className="flex-1 min-w-0 px-3 py-2 bg-white text-sm outline-none focus:bg-teal-50/30"
                                        />

                                        {overallDiscountType === 'percent' && (
                                            <input
                                                type="text"
                                                readOnly
                                                value={overallDiscountValue ? overallDiscountValue.toFixed(2) : ''}
                                                placeholder="৳0.00"
                                                title="Discount amount in Taka"
                                                className="w-28 shrink-0 px-3 py-2 border-l border-slate-200 bg-slate-100 text-sm outline-none text-slate-600 cursor-not-allowed"
                                            />
                                        )}

                                        {overallDiscountType === 'amount' && (
                                            <input
                                                type="text"
                                                readOnly
                                                value={overallDiscountPercent ? `${overallDiscountPercent.toFixed(2)}%` : ''}
                                                placeholder="0%"
                                                title="Discount percentage"
                                                className="w-28 shrink-0 px-3 py-2 border-l border-slate-200 bg-slate-100 text-sm outline-none text-slate-600 cursor-not-allowed"
                                            />
                                        )}

                                        {/* Amount / Percent Toggle */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOverallDiscountType((prev) =>
                                                    prev === 'amount' ? 'percent' : 'amount'
                                                )
                                            }
                                            className="w-16 shrink-0 border-l border-slate-200 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition cursor-pointer"
                                            title="Click to toggle Amount / Percentage"
                                        >
                                            {overallDiscountType === 'percent' ? '%' : '৳'}
                                        </button>
                                    </div>
                                </div>

                                {/* Adjustment */}
                                <div className="flex items-center">

                                    <label className="w-56 text-right pr-3 text-sm font-medium text-slate-600">
                                        Adjustment
                                    </label>

                                    <div className="flex flex-1 rounded-lg overflow-hidden border border-slate-200">

                                        {/* Adjustment Text */}
                                        <input
                                            type="text"
                                            placeholder="Text"
                                            value={adjustmentText}
                                            onChange={(e) =>
                                                setAdjustmentText(e.target.value)
                                            }
                                            className="flex-1 min-w-0 px-3 py-2 bg-white text-sm outline-none focus:bg-teal-50/30"
                                        />

                                        {/* Adjustment Amount */}
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0"
                                            value={adjustmentAmount === 0 ? '' : adjustmentAmount}
                                            onChange={(e) => {
                                                const value = e.target.value;

                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                    setAdjustmentAmount(
                                                        value === '' ? '' : Number(value)
                                                    );
                                                }
                                            }}
                                            className="w-28 shrink-0 px-3 py-2 border-l border-slate-200 bg-white text-sm outline-none focus:bg-teal-50/30"
                                        />

                                        {/* Adjustment Type */}
                                        <select
                                            value={adjustmentType}
                                            onChange={(e) =>
                                                setAdjustmentType(e.target.value)
                                            }
                                            className="w-16 shrink-0 px-2 py-2 border-l border-slate-200 bg-white text-sm outline-none cursor-pointer"
                                        >
                                            <option value="+">+</option>
                                            <option value="-">-</option>
                                        </select>

                                    </div>
                                </div>

                                {/* Payable Amount */}
                                <div className="flex items-center pt-2 mt-1 border-t border-teal-200">
                                    <label className="w-56 text-right pr-3 text-sm font-bold text-teal-800">
                                        Payable Amount
                                    </label>

                                    <input
                                        type="text"
                                        readOnly
                                        value={payableAmount.toFixed(2)}
                                        className="flex-1 px-3 py-2.5 border border-teal-200 bg-white font-bold text-emerald-700 text-base rounded-lg outline-none"
                                    />
                                </div>

                            </div>
                        </div>


                        {/* =================================
                            OTHERS FREE PRODUCT
                        ================================= */}
                        <div className="mt-8">
                            <button
                                type="button"
                                onClick={() => setFreeProductOpen((prev) => !prev)}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Others Free Product
                                {freeProductItems.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                                        {freeProductItems.length}
                                    </span>
                                )}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className={`w-4 h-4 transition-transform duration-200 ${freeProductOpen ? 'rotate-180' : ''}`}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>

                            {freeProductOpen && (
                                <div className="mt-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 md:p-6">
                                    <h3 className="text-base font-bold text-emerald-800 mb-4">Others Free Product</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <SearchSelect
                                            label="Filter by Category"
                                            placeholder="Search or select category..."
                                            searchValue={freeSearch.category}
                                            onSearchChange={(text) => setFreeSearch((prev) => ({ ...prev, category: text }))}
                                            onClear={handleClearFreeCategory}
                                            onSelect={handleSelectFreeCategory}
                                            items={filteredFreeCategories}
                                            getKey={(cat) => cat._id}
                                            emptyText="No active category found"
                                            renderItem={(cat) => (
                                                <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                                            )}
                                        />

                                        <SearchSelect
                                            label="Select Free Product"
                                            placeholder="Search or select product..."
                                            searchValue={freeSearch.product}
                                            onSearchChange={(text) => setFreeSearch((prev) => ({ ...prev, product: text }))}
                                            onClear={() => setFreeSearch((prev) => ({ ...prev, product: '' }))}
                                            onSelect={handleAddFreeProduct}
                                            items={filteredFreeProducts}
                                            getKey={(prod) => prod._id}
                                            emptyText="No matching product found"
                                            renderItem={(prod) => (
                                                <div className="flex justify-between items-center gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{prod.productName}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            Company: {prod.company}
                                                            {prod.category ? ` | Category: ${prod.category}` : ''}
                                                        </p>
                                                    </div>
                                                    {prod.sku && (
                                                        <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-medium border border-emerald-100 shrink-0">
                                                            SKU: {prod.sku}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        />
                                    </div>

                                    {freeProductItems.length > 0 && (
                                        <div className="mt-6 overflow-x-auto rounded-2xl border border-emerald-200">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-emerald-100/70 border-b-2 border-emerald-200 text-xs font-semibold text-emerald-800">
                                                        <th className="py-3 px-3">Product Name</th>
                                                        <th className="py-3 px-3">Company</th>
                                                        <th className="py-3 px-3">Unit Qty</th>
                                                        <th className="py-3 px-3">PCS Qty</th>
                                                        <th className="py-3 px-3">Total Qty</th>
                                                        <th className="py-3 px-3">Sell Price (Bundle)</th>
                                                        <th className="py-3 px-3">Sell Price (PCS)</th>
                                                        <th className="py-3 px-3">Subtotal</th>
                                                        <th className="py-3 px-3 text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-emerald-100 text-sm">
                                                    {freeProductItems.map((item) => (
                                                        <tr key={item.uniqueId} className="hover:bg-emerald-50/50 transition">
                                                            <td className="py-3 px-2 font-semibold text-slate-800">{item.productName}</td>
                                                            <td className="py-3 px-2 text-slate-600 text-xs">{item.company}</td>

                                                            <td className="py-3 pl-1 pr-0 w-40">
                                                                <div className="p-1.5 bg-emerald-50 border border-r-0 border-emerald-200 rounded-l-2xl">
                                                                    <div className="flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            placeholder="0"
                                                                            value={item.unitQty}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d*$/.test(value)) {
                                                                                    handleFreeItemChange(item.uniqueId, 'unitQty', value);
                                                                                }
                                                                            }}
                                                                            className="w-20 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                        />
                                                                        <span
                                                                            className="flex-1 bg-gradient-to-br from-emerald-500 to-green-500 text-white text-xs px-1 py-2.5 text-center font-semibold select-none truncate"
                                                                            title="Unit"
                                                                        >
                                                                            {item.unit || 'Pcs'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            <td className="py-3 pl-0 pr-1 w-32">
                                                                <div className="p-1.5 bg-emerald-50 border border-l-0 border-emerald-200 rounded-r-2xl">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        placeholder="0"
                                                                        value={item.pcsQty}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*$/.test(value)) {
                                                                                handleFreeItemChange(item.uniqueId, 'pcsQty', value);
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm outline-none shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                                    />
                                                                </div>
                                                            </td>

                                                            <td className="py-3 px-2">
                                                                <input
                                                                    type="number"
                                                                    readOnly
                                                                    value={item.totalQty}
                                                                    className="w-14 px-2 py-2 rounded-xl border border-slate-200 bg-slate-100 text-sm outline-none text-slate-600 cursor-not-allowed"
                                                                />
                                                            </td>

                                                            <td className="relative py-3 px-2">
                                                                <div
                                                                    className={`absolute top-1 left-4 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${getFreeUnitTotal(item) > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}
                                                                >
                                                                    ৳{getFreeUnitTotal(item).toFixed(2)}
                                                                </div>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    placeholder="0"
                                                                    disabled={!(Number(item.unitQty) > 0)}
                                                                    value={item.sellPriceBundle}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                            handleFreeItemChange(item.uniqueId, 'sellPriceBundle', value);
                                                                        }
                                                                    }}
                                                                    className="w-24 px-2 py-2 rounded-xl border border-indigo-200 bg-indigo-50/60 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:border-slate-200 disabled:cursor-not-allowed"
                                                                />
                                                            </td>

                                                            <td className="relative py-3 px-2">
                                                                <div
                                                                    className={`absolute top-1 left-4 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${getFreePcsTotal(item) > 0 ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}
                                                                >
                                                                    ৳{getFreePcsTotal(item).toFixed(2)}
                                                                </div>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    placeholder="0"
                                                                    disabled={!(Number(item.pcsQty) > 0)}
                                                                    value={item.sellPricePcs}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                            handleFreeItemChange(item.uniqueId, 'sellPricePcs', value);
                                                                        }
                                                                    }}
                                                                    className="w-24 px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                                />
                                                            </td>

                                                            <td className="py-3 px-2 font-bold text-emerald-700 whitespace-nowrap">
                                                                {getFreeRowTotal(item).toFixed(2)}
                                                            </td>

                                                            <td className="py-3 px-1 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveFreeItem(item.uniqueId)}
                                                                    className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition"
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        strokeWidth={1.5}
                                                                        stroke="currentColor"
                                                                        className="w-5 h-5"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                                        />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-8">

                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Order Note
                            </label>

                            <textarea
                                rows="3"
                                placeholder="Write any note about this purchase..."
                                value={orderNote}
                                onChange={(e) =>
                                    setOrderNote(e.target.value)
                                }
                                className="w-full  px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-y shadow-sm"
                            />

                        </div>

                        {/* =================================
                            PAYMENT (Receive Mode Only)
                        ================================= */}
                        {isReceiveMode && (
                            <div className="mt-8 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 md:p-6">
                                <h3 className="text-base font-bold text-emerald-800 mb-4">Payment</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                    {/* Payment Amount */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Payment Amount <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={paymentAmount}
                                            onChange={(e) => {
                                                const value = e.target.value;

                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                    setPaymentAmount(value);
                                                    setPaymentAmountTouched(true);
                                                }
                                            }}
                                            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm"
                                        />
                                    </div>

                                    {/* Payment Method */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Payment Method <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={paymentAccountType}
                                            onChange={(e) => {
                                                setPaymentAccountType(e.target.value);
                                                setSelectedAccountKey('');
                                            }}
                                            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm cursor-pointer"
                                        >
                                            <option value="">Select method...</option>
                                            {accountTypes.map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Account Selection */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Account <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={selectedAccountKey}
                                            onChange={(e) => setSelectedAccountKey(e.target.value)}
                                            disabled={!paymentAccountType}
                                            className={`w-full px-4 py-3.5 rounded-2xl border text-sm outline-none shadow-sm ${paymentAccountType
                                                ? 'border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer'
                                                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <option value="">
                                                {paymentAccountType ? 'Select account...' : 'Select method first'}
                                            </option>
                                            {uniqueAccounts.map((inv) => {
                                                const key = getAccountKey(inv);
                                                const label =
                                                    inv.accountType === 'Bank'
                                                        ? `${inv.bankName} - ${inv.accountNumber} (${inv.accountBranch})`
                                                        : inv.accountType === 'Mobile Banking'
                                                            ? `${inv.accountName} - ${inv.accountNumber}`
                                                            : 'Cash';
                                                return (
                                                    <option key={key} value={key}>{label}</option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>

                                {/* Payment Note (Optional) */}
                                <div className="mt-6">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Payment Note <span className="text-slate-400 font-normal">(Optional)</span>
                                    </label>
                                    <textarea
                                        rows="2"
                                        placeholder="Write any note about this payment..."
                                        value={paymentNote}
                                        onChange={(e) => setPaymentNote(e.target.value)}
                                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-y shadow-sm"
                                    />
                                </div>
                            </div>
                        )}

                        {/* =================================
                            SUBMIT / RECEIVE BUTTON
                        ================================= */}
                        <div className="mt-6 flex justify-end">

                            {isReceiveMode ? (
                                <button
                                    type="button"
                                    onClick={handleReceiveSubmit}
                                    disabled={isReceiving}
                                    className="px-10 py-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition cursor-pointer"
                                >
                                    Receive
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="px-10 py-3 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-sm font-semibold text-white shadow-md shadow-teal-200 transition cursor-pointer"
                                >
                                    {isEditMode ? 'Update Purchase' : 'Purchase'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PurchaseAdd;