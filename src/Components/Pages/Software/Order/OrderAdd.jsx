import React, { useState, useEffect } from 'react';
import OrderForm, { SearchSelect, matchesSearch } from './OrderForm';
import { useNavigate, useLocation } from 'react-router-dom';
import useDraftState, { clearDraft } from '../../../../hooks/useDraftState';
import Swal from 'sweetalert2';

const clearOrderDrafts = () => {
    ['items', 'overallAmount', 'overallType', 'adjText', 'adjAmount', 'adjType', 'note', 'form', 'search', 'routeLocked', 'freeItems', 'freeFilter', 'freeSearch', 'damageItems', 'damageFilter', 'damageSearch', 'returnItems', 'returnFilter', 'returnSearch', 'directSales']
        .forEach((k) => clearDraft(`orderNew:${k}`));
};


// Damage-only edit এ OrderForm lock করার wrapper
const LockWrap = ({ locked, as: Comp, ...props }) => (
    <div className={locked ? 'pointer-events-none opacity-60 select-none' : ''}>
        <Comp {...props} />
    </div>
);

const OrderAdd = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Edit mode হলে এখানে পুরনো order data থাকবে
    const editingOrder = location.state?.order || null;
    const isEditMode = !!editingOrder;
    const isDeliveryMode = location.state?.mode === 'delivery';
    // Damage page থেকে এলে শুধু Damage section edit হবে
    const isDamageOnly = !!editingOrder && location.state?.mode === 'damage';
    // Sales Bulk Return page theke Edit e eshe shudhu Bulk Return section edit hobe
    const isReturnOnly = !!editingOrder && location.state?.mode === 'bulkReturn';
    const lockCls = (isDamageOnly || isReturnOnly) ? 'pointer-events-none opacity-60 select-none' : '';

    // Direct Sales toggle (শুধু নতুন order এ, default ON)
    const [directSalesToggle, setDirectSalesToggle] = useState(false);
    useEffect(() => {
        fetch('https://squirrel-peace-server.onrender.com/feature/orderDirectSales')
            .then((res) => res.json())
            .then((data) => setDirectSalesToggle(data?.enabled === true))
            .catch(() => setDirectSalesToggle(false));
    }, []);

    // Toggle ON/OFF করলে database এ save হবে (যতক্ষণ না আবার বদলানো হয়)
    const handleDirectSalesChange = (checked) => {
        setDirectSalesToggle(checked);
        fetch('https://squirrel-peace-server.onrender.com/feature/orderDirectSales', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled: checked }),
        })
            .then((res) => {
                if (!res.ok) throw new Error('Save failed');
            })
            .catch(() => setDirectSalesToggle(!checked));
    };
    // Edit mode e order er nijer directSales flag dhorbe, notun order e toggle
    const directSales = editingOrder ? editingOrder.directSales === true : directSalesToggle;
    const isDeliveredEdit = !!editingOrder && !isDeliveryMode && editingOrder.status === 'Delivered';
    const showPayment = isDeliveryMode || directSales || isDeliveredEdit;

    // সিলেক্ট করা প্রোডাক্টগুলো রাখার স্টেট
    const [orderItems, setOrderItems] = useDraftState('orderNew:items', []);

    // ---------------- Payment / Delivery States ----------------
    const [investments, setInvestments] = useState([]);
    const [paymentAmount, setPaymentAmount] = useState(isDeliveredEdit ? (editingOrder.paidAmount ?? '') : '');
    const [paymentAmountTouched, setPaymentAmountTouched] = useState(isDeliveredEdit);
    const [paymentAccountType, setPaymentAccountType] = useState('');
    const [selectedAccountKey, setSelectedAccountKey] = useState('');
    const [paymentNote, setPaymentNote] = useState('');

    // Save Payment Method checkbox (database এ save থাকবে)
    const [savePaymentMethod, setSavePaymentMethod] = useState(false);

    useEffect(() => {
        if (isDeliveredEdit) return;
        fetch('https://squirrel-peace-server.onrender.com/feature/orderPaymentMethod')
            .then((res) => res.json())
            .then((data) => {
                if (data?.enabled === true && data?.value?.paymentAccountType && data?.value?.selectedAccountKey) {
                    setPaymentAccountType(data.value.paymentAccountType);
                    setSelectedAccountKey(data.value.selectedAccountKey);
                    setSavePaymentMethod(true);
                }
            })
            .catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const persistPaymentMethod = (checked, method, key) => {
        fetch('https://squirrel-peace-server.onrender.com/feature/orderPaymentMethod', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                enabled: checked,
                value: checked ? { paymentAccountType: method, selectedAccountKey: key } : null,
            }),
        }).catch((error) => console.error('Error saving payment method:', error));
    };

    const handleSavePaymentToggle = (checked) => {
        setSavePaymentMethod(checked);
        persistPaymentMethod(checked, paymentAccountType, selectedAccountKey);
    };

    // OrderForm থেকে আসা customer, route, date, shippingAddress, sr, deliveredBy ইত্যাদি
    const [orderFormData, setOrderFormData] = useState({
        customerId: '',
        customer: '',
        customerContact: '',
        customerAddress: '',
        route: '',
        date: '',
        shippingAddress: '',
        srId: '',
        sr: '',
        deliveredById: '',
        deliveredBy: '',
        company: '',
        category: '',
    });

    // Order সফল হওয়ার পর OrderForm রিসেট করার জন্য key
    const [formResetKey, setFormResetKey] = useState(0);

    // Toast notification
    const [toast, setToast] = useState({ show: false, message: '', isError: false });

    // Overall Discount
    const [overallDiscountAmount, setOverallDiscountAmount] = useDraftState('orderNew:overallAmount', 0);
    const [overallDiscountType, setOverallDiscountType] = useDraftState('orderNew:overallType', 'amount'); // 'amount' | 'percent'

    // Adjustment
    const [adjustmentText, setAdjustmentText] = useDraftState('orderNew:adjText', '');
    const [adjustmentAmount, setAdjustmentAmount] = useDraftState('orderNew:adjAmount', 0);
    const [adjustmentType, setAdjustmentType] = useDraftState('orderNew:adjType', '+');

    // Order Note
    const [orderNote, setOrderNote] = useDraftState('orderNew:note', '');

    // ---------------- Others Free Product States ----------------
    const [freeProductOpen, setFreeProductOpen] = useState(false);
    const [freeProductItems, setFreeProductItems] = useDraftState('orderNew:freeItems', []);
    const [freeCompanies, setFreeCompanies] = useState([]);
    const [freeCategories, setFreeCategories] = useState([]);
    const [freeProducts, setFreeProducts] = useState([]);
    const [freeFilter, setFreeFilter] = useDraftState('orderNew:freeFilter', { company: '', category: '' });
    const [freeSearch, setFreeSearch] = useDraftState('orderNew:freeSearch', { company: '', category: '', product: '' });

    // ---------------- Damage Product States ----------------
    const [damageProductOpen, setDamageProductOpen] = useState(false);
    const [damageItems, setDamageItems] = useDraftState('orderNew:damageItems', []);
    const [damageFilter, setDamageFilter] = useDraftState('orderNew:damageFilter', { company: '', category: '' });
    const [damageSearch, setDamageSearch] = useDraftState('orderNew:damageSearch', { company: '', category: '', product: '' });

    // ---------------- Return Product States ----------------
    const [returnProductOpen, setReturnProductOpen] = useState(false);
    const [returnItems, setReturnItems] = useDraftState('orderNew:returnItems', []);
    const [returnFilter, setReturnFilter] = useDraftState('orderNew:returnFilter', { company: '', category: '' });
    const [returnSearch, setReturnSearch] = useDraftState('orderNew:returnSearch', { company: '', category: '', product: '' });
    // --------------------------------------------------
    // Edit Mode হলে editingOrder থেকে সব ফিল্ড লোড করা (একবারই)
    // --------------------------------------------------
    useEffect(() => {
        if (!editingOrder) return;

        setOrderFormData({
            customerId: editingOrder.customerId || '',
            customer: editingOrder.customer || '',
            customerContact: editingOrder.phone || '',
            customerAddress: editingOrder.address || '',
            route: editingOrder.route || '',
            date: editingOrder.orderDate || '',
            shippingAddress: editingOrder.shippingAddress || '',
            srId: editingOrder.srId || '',
            sr: editingOrder.sr || '',
            deliveredById: editingOrder.deliveredById || '',
            deliveredBy: editingOrder.deliveredBy || '',
            company: '',
            category: '',
        });

        const restoredItems = (editingOrder.items || []).map((item) => {
            const unitQty = Number(item.unitQty) || 0;
            const pcsPerUnit =
                Number(item.sellPricePcs) > 0
                    ? roundTo2(Number(item.sellPriceUnit) / Number(item.sellPricePcs)) || 1
                    : 1;
            const freeUnitQtyNum = Number(item.freeUnitQty) || 0;
            const freePcsQtyNum = Number(item.freePcsQty) || 0;

            return {
                ...item,
                uniqueId: Date.now() + Math.random(),
                _id: item.productId,
                unitQty: unitQty || '',
                pcsQty: item.pcsQty || '',
                pcsPerUnit,
                totalQty: Number(item.totalPcs) || 0,
                pcsPerUnit: Number(item.pcsPerUnit) > 0 ? Number(item.pcsPerUnit) : pcsPerUnit,
                subQty: Number(item.subQty) || '',
                freeSubQty: Number(item.freeSubQty) || '',
                freeUnitQty: item.freeUnitQty !== undefined && item.freeUnitQty !== null ? (Number(item.freeUnitQty) || '') : '',
                freePcsQty: item.freePcsQty !== undefined && item.freePcsQty !== null ? (Number(item.freePcsQty) || '') : (Number(item.freeQty) || ''),
                baseFreeUnitQty: unitQty > 0 ? roundTo2(freeUnitQtyNum / unitQty) : 0,
                baseFreeSubQty: unitQty > 0 ? roundTo2((Number(item.freeSubQty) || 0) / unitQty) : 0,
                baseFreePcsQty: item.parentMode === true
                    ? ((unitQty + (Number(item.subQty) || 0)) > 0 ? roundTo2(freePcsQtyNum / (unitQty + (Number(item.subQty) || 0))) : 0)
                    : (unitQty > 0 ? roundTo2(freePcsQtyNum / unitQty) : 0),
            };
        });
        setOrderItems(restoredItems);

        const restoredFreeItems = (editingOrder.freeItems || []).map((item) => {
            const unitQty = Number(item.unitQty) || 0;
            const pcsQty = Number(item.pcsQty) || 0;
            const totalQty = Number(item.totalQty) || 0;
            const subQty = Number(item.subQty) || 0;
            const pcsPerSubVal = Number(item.pcsPerSub) || 0;
            const pcsPerUnit =
                Number(item.pcsPerUnit) > 0
                    ? Number(item.pcsPerUnit)
                    : unitQty > 0
                        ? (roundTo2((totalQty - pcsQty - subQty * pcsPerSubVal) / unitQty) || 1)
                        : 1;

            return {
                ...item,
                uniqueId: Date.now() + Math.random(),
                _id: item.productId || item._id,
                unitQty: unitQty || '',
                subQty: subQty || '',
                pcsQty: pcsQty || '',
                pcsPerUnit,
                totalQty,
            };
        });
        setFreeProductItems(restoredFreeItems);
        if (restoredFreeItems.length > 0) {
            setFreeProductOpen(true);
        }

        const restoredDamageItems = (editingOrder.damageItems || []).map(restoreAdjItem);
        setDamageItems(restoredDamageItems);
        if (restoredDamageItems.length > 0) {
            setDamageProductOpen(true);
        }

        const restoredReturnItems = (editingOrder.returnItems || []).map(restoreAdjItem);
        setReturnItems(restoredReturnItems);
        if (restoredReturnItems.length > 0) {
            setReturnProductOpen(true);
        }

        setOverallDiscountAmount(editingOrder.overallDiscount || 0);
        setOverallDiscountType(editingOrder.overallDiscountType || 'amount');
        setAdjustmentText(editingOrder.adjustment?.text || '');
        setAdjustmentAmount(editingOrder.adjustment?.amount || 0);
        setAdjustmentType(editingOrder.adjustment?.type || '+');
        setOrderNote(editingOrder.orderNote || '');
        setAddDamageToAdjustment(Number(editingOrder.damageAdjustmentAmount) > 0);
        setAddReturnToAdjustment(Number(editingOrder.returnAdjustmentAmount) > 0);

        if (editingOrder.status === 'Delivered' && !isDeliveryMode) {
            setPaymentAmount(editingOrder.paidAmount ?? '');
            setPaymentAmountTouched(true);
            setPaymentAccountType(editingOrder.paymentMethod || '');
            setPaymentNote(editingOrder.paymentNote || '');
            const pa = editingOrder.paymentAccount || {};
            if (editingOrder.paymentMethod === 'Bank') {
                setSelectedAccountKey(`${pa.bankName}-${pa.accountNumber}-${pa.accountBranch}`);
            } else if (editingOrder.paymentMethod === 'Mobile Banking') {
                setSelectedAccountKey(`${pa.accountName}-${pa.accountNumber}`);
            } else {
                setSelectedAccountKey('cash');
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingOrder]);

    // --------------------------------------------------
    // Damage edit এ এলে Damage section এ scroll করবে
    useEffect(() => {
        if (isDamageOnly && damageProductOpen) {
            setTimeout(() => {
                document.getElementById('damage-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 200);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDamageOnly, damageProductOpen]);

    // Delivery Mode হলে Investment Accounts fetch করবে
    // --------------------------------------------------
    useEffect(() => {
        if (showPayment) {
            fetch('https://squirrel-peace-server.onrender.com/investment')
                .then((res) => res.json())
                .then((data) => setInvestments(Array.isArray(data) ? data : []))
                .catch((error) => console.error('Error fetching investments:', error));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showPayment]);

    // --------------------------------------------------
    // Others Free Product ডেটা fetch করা (Company, Category, Product)
    // --------------------------------------------------
    useEffect(() => {
        fetch('https://squirrel-peace-server.onrender.com/company')
            .then((res) => res.json())
            .then((data) => setFreeCompanies(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching companies:', error));

        fetch('https://squirrel-peace-server.onrender.com/category')
            .then((res) => res.json())
            .then((data) => setFreeCategories(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching categories:', error));

        fetch('https://squirrel-peace-server.onrender.com/product')
            .then((res) => res.json())
            .then((data) => setFreeProducts(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching products:', error));
    }, []);

    // --------------------------------------------------
    // Main Table এ কোনো প্রোডাক্ট Add হলে, সেটা Free list এ থাকলে
    // এখান থেকে Auto Remove হয়ে যাবে
    // --------------------------------------------------
    useEffect(() => {
        setFreeProductItems((prev) =>
            prev.filter(
                (item) =>
                    !orderItems.some(
                        (oi) =>
                            (oi._id && oi._id === item._id) ||
                            (oi.productName && oi.productName === item.productName)
                    )
            )
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderItems]);

    // --------------------------------------------------
    // Helpers
    // --------------------------------------------------
    // Number কে সবসময় 2 digit পর্যন্ত Round করার Helper
    const roundTo2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

    // Unit অংশের মোট দাম = Unit Qty × প্রতি Unit এর দাম
    const getUnitTotal = (item) =>
        (Number(item.unitQty) || 0) * (Number(item.sellPriceUnit) || 0);

    // PCS অংশের মোট দাম = PCS Qty × প্রতি PCS এর দাম
    const getPcsTotal = (item) =>
        (Number(item.pcsQty) || 0) * (Number(item.sellPricePcs) || 0);

    // Sub Unit অংশের মোট দাম (Parent Unit থাকলে)
    const getSubTotal = (item) =>
        (Number(item.subQty) || 0) * (Number(item.sellPriceSub) || 0);

    // Row এর মোট দাম = Unit অংশ + Sub অংশ + PCS অংশ
    const getRowGross = (item) => getUnitTotal(item) + getSubTotal(item) + getPcsTotal(item);

    // Damage / Return এর নতুন item বানানো (Parent Unit সহ)
    const buildAdjItem = (product) => {
        const isParent = product.parentUnitUse === true;
        const pcsPerUnit = Number(product.pcsOfUnit) || 1;
        const pcsPerSub = isParent ? (Number(product.subUnitQty) || 1) : 0;
        const sellingPrice = Number(product.sellingPrice) || 0;

        return {
            uniqueId: Date.now() + Math.random(),
            _id: product._id,

            productName: product.productName || '',
            company: product.company || '',
            sku: product.sku || null,

            sellPricePcs: sellingPrice,
            sellPriceUnit: roundTo2(sellingPrice * pcsPerUnit),
            sellPriceSub: isParent ? roundTo2(sellingPrice * pcsPerSub) : '',

            unit: isParent ? product.parentUnit : (product.unit || 'Pcs'),
            parentMode: isParent,
            subUnit: isParent ? (product.subUnit || '') : '',
            pcsPerSub: pcsPerSub,
            subQty: '',

            unitQty: '',
            pcsQty: '',
            pcsPerUnit: pcsPerUnit,

            totalQty: 0,

            freeUnitQty: '',
            freeSubQty: '',
            freePcsQty: '',
            freeQty: 0,

            baseFreeUnitQty: isParent ? 0 : (Number(product.freeProductUnitQty) || 0),
            baseFreeSubQty: isParent ? (Number(product.freeProductSubQty) || 0) : 0,
            baseFreePcsQty: Number(product.freeProductPcsQty) || 0,
        };
    };

    // Damage / Return item Change (Parent Unit সহ)
    const applyAdjItemChange = (item, field, value) => {
        // Parent Unit থাকলে: Parent Qty → Free Sub + Free Pcs, Sub Qty → Free Pcs
        if (item.parentMode && ['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'].includes(field)) {
            const numVal = value === '' ? '' : Number(value) || 0;
            const next = { ...item, [field]: numVal };
            const ppu = Number(next.pcsPerUnit) || 1;
            const pps = Number(next.pcsPerSub) || 0;
            next.totalQty =
                (Number(next.unitQty) || 0) * ppu +
                (Number(next.subQty) || 0) * pps +
                (Number(next.pcsQty) || 0);
            if (field === 'unitQty' || field === 'subQty') {
                const u = Number(next.unitQty) || 0;
                const s = Number(next.subQty) || 0;
                next.freeSubQty = u * (Number(item.baseFreeSubQty) || 0) || '';
                next.freePcsQty = (u + s) * (Number(item.baseFreePcsQty) || 0) || '';
            }
            next.freeQty =
                (Number(next.freeUnitQty) || 0) * ppu +
                (Number(next.freeSubQty) || 0) * pps +
                (Number(next.freePcsQty) || 0);
            return next;
        }

        if (field === 'unitQty') {
            const numVal = value === '' ? 0 : Number(value) || 0;
            const pcsQtyVal = Number(item.pcsQty) || 0;

            const newTotalQty = numVal * (Number(item.pcsPerUnit) || 1) + pcsQtyVal;

            const newFreeUnitQty = numVal * (Number(item.baseFreeUnitQty) || 0);
            const newFreePcsQty = numVal * (Number(item.baseFreePcsQty) || 0);
            const newFreeQty = newFreeUnitQty * (Number(item.pcsPerUnit) || 1) + newFreePcsQty;

            return {
                ...item,
                unitQty: value === '' ? '' : numVal,
                totalQty: newTotalQty,
                freeUnitQty: newFreeUnitQty || '',
                freePcsQty: newFreePcsQty || '',
                freeQty: newFreeQty,
            };
        }

        // Unit দাম Change → PCS (ও Sub) দাম নিজে থেকে হিসাব হবে
        if (field === 'sellPriceUnit') {
            const unitPriceVal = value === '' ? 0 : Number(value) || 0;
            const ppu = Number(item.pcsPerUnit) || 1;
            const pps = Number(item.pcsPerSub) || 0;
            return {
                ...item,
                sellPriceUnit: value,
                sellPricePcs: roundTo2(unitPriceVal / ppu),
                ...(item.parentMode ? { sellPriceSub: roundTo2((unitPriceVal / ppu) * pps) } : {}),
            };
        }

        // Sub Unit দাম Change → শুধু PCS দাম হিসাব হবে (Parent Unit দাম অপরিবর্তিত)
        if (field === 'sellPriceSub') {
            const subPriceVal = value === '' ? 0 : Number(value) || 0;
            const pps = Number(item.pcsPerSub) || 1;
            return {
                ...item,
                sellPriceSub: value,
                sellPricePcs: value === '' ? '' : roundTo2(subPriceVal / pps),
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

        if (field === 'freeUnitQty') {
            const numVal = value === '' ? 0 : Number(value) || 0;
            const freePcsQtyVal = Number(item.freePcsQty) || 0;
            return {
                ...item,
                freeUnitQty: value === '' ? '' : numVal,
                freeQty: numVal * (Number(item.pcsPerUnit) || 1) + freePcsQtyVal,
            };
        }

        if (field === 'freePcsQty') {
            const numVal = value === '' ? 0 : Number(value) || 0;
            const freeUnitQtyVal = Number(item.freeUnitQty) || 0;
            return {
                ...item,
                freePcsQty: value === '' ? '' : numVal,
                freeQty: freeUnitQtyVal * (Number(item.pcsPerUnit) || 1) + numVal,
            };
        }

        return {
            ...item,
            [field]: value,
        };
    };

    // Edit Mode এ Damage / Return item restore (Parent Unit সহ)
    const restoreAdjItem = (item) => {
        const unitQty = Number(item.unitQty) || 0;
        const subQty = Number(item.subQty) || 0;
        const pcsPerUnit =
            Number(item.pcsPerUnit) > 0
                ? Number(item.pcsPerUnit)
                : Number(item.sellPricePcs) > 0
                    ? roundTo2(Number(item.sellPriceUnit) / Number(item.sellPricePcs)) || 1
                    : 1;
        const freeUnitQtyNum = Number(item.freeUnitQty) || 0;
        const freeSubQtyNum = Number(item.freeSubQty) || 0;
        const freePcsQtyNum = Number(item.freePcsQty) || 0;

        return {
            ...item,
            uniqueId: Date.now() + Math.random(),
            _id: item.productId,
            unitQty: unitQty || '',
            subQty: subQty || '',
            pcsQty: item.pcsQty || '',
            pcsPerUnit,
            totalQty: Number(item.totalQty) || 0,
            freeUnitQty: item.freeUnitQty !== undefined && item.freeUnitQty !== null ? (Number(item.freeUnitQty) || '') : '',
            freeSubQty: freeSubQtyNum || '',
            freePcsQty: item.freePcsQty !== undefined && item.freePcsQty !== null ? (Number(item.freePcsQty) || '') : (Number(item.freeQty) || ''),
            baseFreeUnitQty: unitQty > 0 ? roundTo2(freeUnitQtyNum / unitQty) : 0,
            baseFreeSubQty: unitQty > 0 ? roundTo2(freeSubQtyNum / unitQty) : 0,
            baseFreePcsQty: item.parentMode === true
                ? ((unitQty + subQty) > 0 ? roundTo2(freePcsQtyNum / (unitQty + subQty)) : 0)
                : (unitQty > 0 ? roundTo2(freePcsQtyNum / unitQty) : 0),
        };
    };

    // Save করার Payload (Free / Damage / Return)
    const buildFreeItemsPayload = () =>
        freeProductItems.map((item) => ({
            productId: item._id,
            productName: item.productName,
            company: item.company,
            unit: item.unit || 'Pcs',
            parentMode: item.parentMode === true,
            subUnit: item.subUnit || '',
            pcsPerUnit: Number(item.pcsPerUnit) || 1,
            pcsPerSub: Number(item.pcsPerSub) || 0,
            unitQty: Number(item.unitQty) || 0,
            subQty: Number(item.subQty) || 0,
            pcsQty: Number(item.pcsQty) || 0,
            totalQty: Number(item.totalQty) || 0,
        }));

    const buildAdjItemsPayload = (items) =>
        items.map((item) => ({
            productId: item._id,
            productName: item.productName,
            company: item.company,
            sku: item.sku,
            sellPricePcs: roundTo2(item.sellPricePcs),
            sellPriceUnit: roundTo2(item.sellPriceUnit),
            sellPriceSub: roundTo2(item.sellPriceSub),
            unit: item.unit || 'Pcs',
            parentMode: item.parentMode === true,
            subUnit: item.subUnit || '',
            pcsPerUnit: Number(item.pcsPerUnit) || 1,
            pcsPerSub: Number(item.pcsPerSub) || 0,
            unitQty: Number(item.unitQty) || 0,
            subQty: Number(item.subQty) || 0,
            pcsQty: Number(item.pcsQty) || 0,
            totalQty: Number(item.totalQty) || 0,
            freeUnitQty: Number(item.freeUnitQty) || 0,
            freeSubQty: Number(item.freeSubQty) || 0,
            freePcsQty: Number(item.freePcsQty) || 0,
            freeQty: Number(item.freeQty) || 0,
            subtotal: roundTo2(getRowGross(item)),
        }));

    const showToast = (message, isError = false) => {
        setToast({ show: true, message, isError });
        setTimeout(() => setToast({ show: false, message: '', isError: false }), 6000);
    };

    const escapeHtml = (s) =>
        String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

    // Main / Free stock er ekta kom hole onno pool theke nite user er confirm chaibe
    const askBorrowConfirm = async (borrows = []) => {
        const blocks = borrows
            .map((b) => {
                const toMain = b.direction === 'free_to_main';
                const to = toMain ? 'Main' : 'Free';
                const from = toMain ? 'Free' : 'Main';
                return `
                <div style="text-align:left;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px 14px;margin-top:10px;font-size:13px;line-height:1.7">
                    <div style="font-weight:800;color:#1e293b;font-size:14px">📦 ${escapeHtml(b.productName)}</div>
                   <div>${to} লাগবে: <b>${b.need}</b> &nbsp;|&nbsp; ${to} স্টকে আছে: <b style="color:#e11d48">${b.have}</b></div>
                   <div>${from} স্টকে আছে: <b style="color:#059669">${b.otherAvailable}</b> <span style="color:#94a3b8">(${from} লাগবে ${b.otherNeed})</span></div>
                    <div style="margin-top:6px;padding:6px 10px;background:#fffbeb;border:1px dashed #f59e0b;border-radius:10px;color:#b45309;font-weight:700">
                       ${to} স্টকে <b>${b.borrowQty}</b> টি কম আছে। ${from} স্টক থেকে <b>${b.borrowQty}</b> টি নিতে চান?
                    </div>
                </div>`;
            })
            .join('');

        const result = await Swal.fire({
            icon: 'question',
            title: 'স্টক নিশ্চিত করুন',
            html: `<div style="font-size:13px;color:#475569">আপনার অর্ডারের জন্য এক ধরনের স্টকে পণ্য কম আছে, কিন্তু অন্য ধরনের স্টকে অতিরিক্ত আছে।</div>${blocks}`,
            showCancelButton: true,
            confirmButtonText: '✔ Agree',
            cancelButtonText: '✖ Disagree',
            confirmButtonColor: '#059669',
            cancelButtonColor: '#f43f5e',
            reverseButtons: true,
            allowOutsideClick: false,
            allowEscapeKey: true,
        });
        return result.isConfirmed;
    };

    // Order Number Generate (YYMMDDHHMMSS - 24hr, no separators)
    const generateOrderNo = () => {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        return `${yy}${mm}${dd}${hh}${min}${ss}`;
    };

    // --------------------------------------------------
    // OrderForm Data Update
    // --------------------------------------------------
    const handleFormDataChange = (data) => {
        setOrderFormData(data);
    };

    // --------------------------------------------------
    // Product Add
    // --------------------------------------------------
    const handleAddProduct = (product) => {
        const initialUnitQty = '';
        const initialPcsQty = '';
        const isParent = product.parentUnitUse === true;
        const baseFreeUnitQty = isParent ? 0 : (Number(product.freeProductUnitQty) || 0);
        const baseFreeSubQty = isParent ? (Number(product.freeProductSubQty) || 0) : 0;
        const baseFreePcsQty = Number(product.freeProductPcsQty) || 0;
        const pcsPerUnit = Number(product.pcsOfUnit) || 1;
        const pcsPerSub = isParent ? (Number(product.subUnitQty) || 1) : 0;

        const newItem = {
            ...product,
            uniqueId: Date.now() + Math.random(),

            productName: product.productName || '',
            company: product.company || '',
            category: product.category || null,
            sku: product.sku || null,

            buyPrice: Number(product.purchasePrice) || 0,
            sellPricePcs: Number(product.sellingPrice) || 0, // প্রতি PCS এর দাম
            sellPriceUnit: roundTo2((Number(product.sellingPrice) || 0) * pcsPerUnit), // প্রতি Unit এর দাম (edit করা যাবে)
            sellPriceSub: isParent ? roundTo2((Number(product.sellingPrice) || 0) * pcsPerSub) : '', // প্রতি Sub Unit এর দাম

            unit: isParent ? product.parentUnit : (product.unit || 'Pcs'),
            parentMode: isParent,
            subUnit: isParent ? (product.subUnit || '') : '',
            pcsPerSub: pcsPerSub,
            subQty: '',
            freeSubQty: '',
            baseFreeSubQty: baseFreeSubQty,

            unitQty: initialUnitQty,
            pcsQty: initialPcsQty,
            pcsPerUnit: pcsPerUnit,

            totalQty: (Number(initialUnitQty) || 0) * pcsPerUnit + (Number(initialPcsQty) || 0),

            freeUnitQty: '',
            freePcsQty: '',
            freeQty: 0,

            // মূল Free Qty (প্রতি Unit এ)
            baseFreeUnitQty: baseFreeUnitQty,
            baseFreePcsQty: baseFreePcsQty,

            // Product Discount
            discount: 0,
            discountType: 'amount', // 'amount' | 'percent'
        };

        setOrderItems((prev) => [...prev, newItem]);
    };

    // --------------------------------------------------
    // Product Remove
    // --------------------------------------------------
    const handleRemoveItem = (uniqueId) => {
        setOrderItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
    };

    // --------------------------------------------------
    // Item Change
    // --------------------------------------------------
    const handleItemChange = (uniqueId, field, value) => {
        // Negative value allow করবে না
        if (value !== '' && Number(value) < 0) return;

        setOrderItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) {
                    return item;
                }

                // Parent Unit থাকলে: Parent Qty → Free Sub + Free Pcs, Sub Qty → Free Pcs
                if (item.parentMode && ['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'].includes(field)) {
                    const numVal = value === '' ? '' : Number(value) || 0;
                    const next = { ...item, [field]: numVal };
                    const ppu = Number(next.pcsPerUnit) || 1;
                    const pps = Number(next.pcsPerSub) || 0;
                    next.totalQty =
                        (Number(next.unitQty) || 0) * ppu +
                        (Number(next.subQty) || 0) * pps +
                        (Number(next.pcsQty) || 0);
                    if (field === 'unitQty' || field === 'subQty') {
                        const u = Number(next.unitQty) || 0;
                        const s = Number(next.subQty) || 0;
                        next.freeSubQty = u * (Number(item.baseFreeSubQty) || 0) || '';
                        next.freePcsQty = (u + s) * (Number(item.baseFreePcsQty) || 0) || '';
                    }
                    next.freeQty =
                        (Number(next.freeUnitQty) || 0) * ppu +
                        (Number(next.freeSubQty) || 0) * pps +
                        (Number(next.freePcsQty) || 0);
                    return next;
                }

                // Unit Qty Change
                if (field === 'unitQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const pcsQtyVal = Number(item.pcsQty) || 0;

                    const newTotalQty = numVal * (Number(item.pcsPerUnit) || 1) + pcsQtyVal;

                    const newFreeUnitQty = numVal * (Number(item.baseFreeUnitQty) || 0);
                    const newFreePcsQty = numVal * (Number(item.baseFreePcsQty) || 0);
                    const newFreeQty = newFreeUnitQty * (Number(item.pcsPerUnit) || 1) + newFreePcsQty;

                    return {
                        ...item,
                        unitQty: value === '' ? '' : numVal,
                        totalQty: newTotalQty,
                        freeUnitQty: newFreeUnitQty || '',
                        freePcsQty: newFreePcsQty || '',
                        freeQty: newFreeQty,
                    };
                }

                // Unit দাম Change → PCS (ও Sub) দাম নিজে থেকে হিসাব হবে
                if (field === 'sellPriceUnit') {
                    const unitPriceVal = value === '' ? 0 : Number(value) || 0;
                    const ppu = Number(item.pcsPerUnit) || 1;
                    const pps = Number(item.pcsPerSub) || 0;
                    return {
                        ...item,
                        sellPriceUnit: value,
                        sellPricePcs: roundTo2(unitPriceVal / ppu),
                        ...(item.parentMode ? { sellPriceSub: roundTo2((unitPriceVal / ppu) * pps) } : {}),
                    };
                }

                // Sub Unit দাম Change → শুধু PCS দাম হিসাব হবে (Parent Unit দাম অপরিবর্তিত)
                if (field === 'sellPriceSub') {
                    const subPriceVal = value === '' ? 0 : Number(value) || 0;
                    const pps = Number(item.pcsPerSub) || 1;
                    return {
                        ...item,
                        sellPriceSub: value,
                        sellPricePcs: value === '' ? '' : roundTo2(subPriceVal / pps),
                    };
                }

                // PCS দাম Change → শুধু PCS দাম change হবে (Unit ও Sub অপরিবর্তিত)
                if (field === 'sellPricePcs') {
                    return {
                        ...item,
                        sellPricePcs: value,
                    };
                }

                // PCS Qty Change
                if (field === 'pcsQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const unitQtyVal = Number(item.unitQty) || 0;

                    const newTotalQty = unitQtyVal * (Number(item.pcsPerUnit) || 1) + numVal;

                    return {
                        ...item,
                        pcsQty: value === '' ? '' : numVal,
                        totalQty: newTotalQty,
                    };
                }

                // Free Unit Qty Change
                if (field === 'freeUnitQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const freePcsQtyVal = Number(item.freePcsQty) || 0;

                    const newFreeQty = numVal * (Number(item.pcsPerUnit) || 1) + freePcsQtyVal;

                    return {
                        ...item,
                        freeUnitQty: value === '' ? '' : numVal,
                        freeQty: newFreeQty,
                    };
                }

                // Free PCS Qty Change
                if (field === 'freePcsQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const freeUnitQtyVal = Number(item.freeUnitQty) || 0;

                    const newFreeQty = freeUnitQtyVal * (Number(item.pcsPerUnit) || 1) + numVal;

                    return {
                        ...item,
                        freePcsQty: value === '' ? '' : numVal,
                        freeQty: newFreeQty,
                    };
                }

                // Free Qty Change
                if (field === 'freeQty') {
                    return {
                        ...item,
                        freeQty: value === '' ? '' : Number(value),
                    };
                }

                // Discount Change
                if (field === 'discount') {
                    return {
                        ...item,
                        discount: value === '' ? '' : Number(value),
                    };
                }

                // Other Fields (যেমন sellPrice)
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
        setOrderItems((prev) =>
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
    // Others Free Product — Add / Remove / Change
    // --------------------------------------------------
    const handleAddFreeProduct = (product) => {
        const pcsPerUnit = Number(product.pcsOfUnit) || 1;
        const isParent = product.parentUnitUse === true;

        const newItem = {
            uniqueId: Date.now() + Math.random(),
            _id: product._id,
            productName: product.productName || '',
            company: product.company || '',
            unit: isParent ? product.parentUnit : (product.unit || 'Pcs'),
            parentMode: isParent,
            subUnit: isParent ? (product.subUnit || '') : '',
            pcsPerSub: isParent ? (Number(product.subUnitQty) || 1) : 0,
            subQty: '',
            unitQty: '',
            pcsQty: '',
            pcsPerUnit: pcsPerUnit,
            totalQty: 0,
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

                if (['unitQty', 'subQty', 'pcsQty'].includes(field)) {
                    const numVal = value === '' ? '' : Number(value) || 0;
                    const next = { ...item, [field]: numVal };
                    next.totalQty =
                        (Number(next.unitQty) || 0) * (Number(next.pcsPerUnit) || 1) +
                        (Number(next.subQty) || 0) * (Number(next.pcsPerSub) || 0) +
                        (Number(next.pcsQty) || 0);
                    return next;
                }

                return { ...item, [field]: value };
            })
        );
    };

    const handleSelectFreeCompany = (comp) => {
        setFreeFilter((prev) => ({ ...prev, company: comp.businessName }));
        setFreeSearch((prev) => ({ ...prev, company: comp.businessName, product: '' }));
    };

    const handleClearFreeCompany = () => {
        setFreeFilter((prev) => ({ ...prev, company: '' }));
        setFreeSearch((prev) => ({ ...prev, company: '', product: '' }));
    };

    const handleSelectFreeCategory = (cat) => {
        setFreeFilter((prev) => ({ ...prev, category: cat.name }));
        setFreeSearch((prev) => ({ ...prev, category: cat.name, product: '' }));
    };

    const handleClearFreeCategory = () => {
        setFreeFilter((prev) => ({ ...prev, category: '' }));
        setFreeSearch((prev) => ({ ...prev, category: '', product: '' }));
    };

    // --------------------------------------------------
    // Damage Product — Add / Remove / Change
    // --------------------------------------------------
    const handleAddDamageProduct = (product) => {
        setDamageItems((prev) => [...prev, buildAdjItem(product)]);
        setDamageSearch((prev) => ({ ...prev, product: '' }));
    };

    const handleRemoveDamageItem = (uniqueId) => {
        setDamageItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
    };

    const handleDamageItemChange = (uniqueId, field, value) => {
        if (value !== '' && Number(value) < 0) return;

        setDamageItems((prev) =>
            prev.map((item) => (item.uniqueId === uniqueId ? applyAdjItemChange(item, field, value) : item))
        );
    };

    const handleSelectDamageCompany = (comp) => {
        setDamageFilter((prev) => ({ ...prev, company: comp.businessName }));
        setDamageSearch((prev) => ({ ...prev, company: comp.businessName, product: '' }));
    };

    const handleClearDamageCompany = () => {
        setDamageFilter((prev) => ({ ...prev, company: '' }));
        setDamageSearch((prev) => ({ ...prev, company: '', product: '' }));
    };

    const handleSelectDamageCategory = (cat) => {
        setDamageFilter((prev) => ({ ...prev, category: cat.name }));
        setDamageSearch((prev) => ({ ...prev, category: cat.name, product: '' }));
    };

    const handleClearDamageCategory = () => {
        setDamageFilter((prev) => ({ ...prev, category: '' }));
        setDamageSearch((prev) => ({ ...prev, category: '', product: '' }));
    };

    // --------------------------------------------------
    // Return Product — Add / Remove / Change
    // --------------------------------------------------
    const handleAddReturnProduct = (product) => {
        setReturnItems((prev) => [...prev, buildAdjItem(product)]);
        setReturnSearch((prev) => ({ ...prev, product: '' }));
    };

    const handleRemoveReturnItem = (uniqueId) => {
        setReturnItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
    };

    const handleReturnItemChange = (uniqueId, field, value) => {
        if (value !== '' && Number(value) < 0) return;

        setReturnItems((prev) =>
            prev.map((item) => (item.uniqueId === uniqueId ? applyAdjItemChange(item, field, value) : item))
        );
    };

    const handleSelectReturnCompany = (comp) => {
        setReturnFilter((prev) => ({ ...prev, company: comp.businessName }));
        setReturnSearch((prev) => ({ ...prev, company: comp.businessName, product: '' }));
    };

    const handleClearReturnCompany = () => {
        setReturnFilter((prev) => ({ ...prev, company: '' }));
        setReturnSearch((prev) => ({ ...prev, company: '', product: '' }));
    };

    const handleSelectReturnCategory = (cat) => {
        setReturnFilter((prev) => ({ ...prev, category: cat.name }));
        setReturnSearch((prev) => ({ ...prev, category: cat.name, product: '' }));
    };

    const handleClearReturnCategory = () => {
        setReturnFilter((prev) => ({ ...prev, category: '' }));
        setReturnSearch((prev) => ({ ...prev, category: '', product: '' }));
    };

    const addedMainProductIds = orderItems.map((item) => item.productName || item._id);

    // Main table এ minimum 1 pcs product না থাকলে Damage / Return disabled থাকবে
    const hasMainProduct = orderItems.some((item) => (Number(item.totalQty) || 0) >= 1);
    const disabledTip = 'Main table e minimum 1 pcs product add korle then enable hobe';
    const addedFreeProductIds = freeProductItems.map((item) => item.productName || item._id);

    const filteredFreeCompanies = freeCompanies.filter((comp) =>
        matchesSearch(freeSearch.company, [comp.businessName, comp.contactNumber, comp.email, comp.address])
    );

    const filteredFreeCategories = freeCategories
        .filter((cat) => cat.isActive === true)
        .filter((cat) => matchesSearch(freeSearch.category, [cat.name]));

    const filteredFreeProducts = freeProducts.filter((prod) => {
        if (!prod.productName) return false;
        if (prod.isActive !== true) return false;
        if (freeFilter.company && prod.company !== freeFilter.company) return false;
        if (freeFilter.category && prod.category !== freeFilter.category) return false;

        const isAlreadyAdded =
            addedMainProductIds.includes(prod._id) ||
            addedMainProductIds.includes(prod.productName) ||
            addedFreeProductIds.includes(prod._id) ||
            addedFreeProductIds.includes(prod.productName);
        if (isAlreadyAdded) return false;

        return matchesSearch(freeSearch.product, [prod.productName, prod.sku]);
    });

    // Damage Product — filtered lists
    const filteredDamageCompanies = freeCompanies.filter((comp) =>
        matchesSearch(damageSearch.company, [comp.businessName, comp.contactNumber, comp.email, comp.address])
    );

    const filteredDamageCategories = freeCategories
        .filter((cat) => cat.isActive === true)
        .filter((cat) => matchesSearch(damageSearch.category, [cat.name]));

    const filteredDamageProducts = freeProducts.filter((prod) => {
        if (!prod.productName) return false;
        if (prod.isActive !== true) return false;
        if (damageFilter.company && prod.company !== damageFilter.company) return false;
        if (damageFilter.category && prod.category !== damageFilter.category) return false;

        const isAlreadyAddedInDamage = damageItems.some(
            (item) => item._id === prod._id || item.productName === prod.productName
        );
        if (isAlreadyAddedInDamage) return false;

        return matchesSearch(damageSearch.product, [prod.productName, prod.sku]);
    });

    // Return Product — filtered lists (main/free list এ থাকলেও বাদ যাবে না, শুধু return list এ ডুপ্লিকেট আটকাবে)
    const filteredReturnCompanies = freeCompanies.filter((comp) =>
        matchesSearch(returnSearch.company, [comp.businessName, comp.contactNumber, comp.email, comp.address])
    );

    const filteredReturnCategories = freeCategories
        .filter((cat) => cat.isActive === true)
        .filter((cat) => matchesSearch(returnSearch.category, [cat.name]));

    const filteredReturnProducts = freeProducts.filter((prod) => {
        if (!prod.productName) return false;
        if (prod.isActive !== true) return false;
        if (returnFilter.company && prod.company !== returnFilter.company) return false;
        if (returnFilter.category && prod.category !== returnFilter.category) return false;

        const isAlreadyAddedInReturn = returnItems.some(
            (item) => item._id === prod._id || item.productName === prod.productName
        );
        if (isAlreadyAddedInReturn) return false;

        return matchesSearch(returnSearch.product, [prod.productName, prod.sku]);
    });

    // --------------------------------------------------
    // Added Product IDs (ড্রপডাউন থেকে বাদ দেওয়ার জন্য)
    // --------------------------------------------------
    const addedProductIds = [
        ...orderItems.map((item) => item.productName || item._id),
        ...freeProductItems.map((item) => item.productName || item._id),
    ];

    // Sell Price header এর জন্য Unit এর নাম (সব product এর unit এক হলে সেটা, না হলে "Unit")
    const uniqueUnits = [...new Set(orderItems.map((item) => item.unit || 'Pcs'))];
    const sellPriceUnitLabel = uniqueUnits.length === 1 ? uniqueUnits[0] : 'Unit';

    const damageUniqueUnits = [...new Set(damageItems.map((item) => item.unit || 'Pcs'))];
    const damageSellPriceUnitLabel = damageUniqueUnits.length === 1 ? damageUniqueUnits[0] : 'Unit';

    const returnUniqueUnits = [...new Set(returnItems.map((item) => item.unit || 'Pcs'))];
    const returnSellPriceUnitLabel = returnUniqueUnits.length === 1 ? returnUniqueUnits[0] : 'Unit';

    // Damage & Return Total Subtotal Value
    const damageTotalValue = roundTo2(
        damageItems.reduce((total, item) => total + getRowGross(item), 0)
    );
    const returnTotalValue = roundTo2(
        returnItems.reduce((total, item) => total + getRowGross(item), 0)
    );

    // Damage / Return Value কে Adjustment এ Add করার Toggle (Default Off)
    const [addDamageToAdjustment, setAddDamageToAdjustment] = useState(false);
    const [addReturnToAdjustment, setAddReturnToAdjustment] = useState(false);

    // --------------------------------------------------
    // Payment Account Type List (Investment থেকে unique accountType)
    // --------------------------------------------------
    const accountTypes = [...new Set(investments.map((inv) => inv.accountType).filter(Boolean))];

    const getAccountKey = (inv) => {
        if (inv.accountType === 'Bank') {
            return `${inv.bankName}-${inv.accountNumber}-${inv.accountBranch}`;
        }
        if (inv.accountType === 'Mobile Banking') {
            return `${inv.accountName}-${inv.accountNumber}`;
        }
        return 'cash';
    };

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

    // Product-এর মূল SubTotal (Sell Price x Total Qty)
    const subTotal = roundTo2(
        orderItems.reduce((total, item) => {
            return total + getRowGross(item);
        }, 0)
    );

    // Product Wise Discount (percent হলে row gross total অনুযায়ী হিসাব হবে)
    const productWiseDiscount = roundTo2(
        orderItems.reduce((total, item) => {
            const rowGrossTotal = getRowGross(item);
            const effectiveDiscount =
                item.discountType === 'percent'
                    ? (rowGrossTotal * (Number(item.discount) || 0)) / 100
                    : Number(item.discount) || 0;
            return total + effectiveDiscount;
        }, 0)
    );

    // Grand Total এর তুলনায় Product Wise Discount কত % হলো
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
            ? (afterProductDiscount > 0
                ? roundTo2(((Number(overallDiscountAmount) || 0) / afterProductDiscount) * 100)
                : 0)
            : 0;

    // Adjustment
    const adjustmentValue = Number(adjustmentAmount) || 0;

    let payableAmount = afterProductDiscount - overallDiscountValue;

    if (adjustmentType === '+') {
        payableAmount += adjustmentValue;
    } else {
        payableAmount -= adjustmentValue;
    }

    // Damage / Return টগল অন থাকলে, ওই amount Payable থেকে বিয়োগ (Discount হিসেবে) হবে
    if (addDamageToAdjustment) {
        payableAmount -= damageTotalValue;
    }
    if (addReturnToAdjustment) {
        payableAmount -= returnTotalValue;
    }

    // Payable কখনো negative হবে না
    if (payableAmount < 0) {
        payableAmount = 0;
    }

    payableAmount = roundTo2(payableAmount);

    // --------------------------------------------------
    // Delivery Mode এ Payment Amount লাইভ Payable Amount এর সাথে
    // sync থাকবে, যতক্ষণ না ইউজার নিজে হাতে সেটা edit করছে
    // --------------------------------------------------
    useEffect(() => {
        if (showPayment && !isDeliveredEdit && !paymentAmountTouched) {
            setPaymentAmount(payableAmount);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [payableAmount, showPayment, paymentAmountTouched]);

    // --------------------------------------------------
    // Submit (এখন শুধু Frontend — Backend পরে যোগ হবে)
    // --------------------------------------------------
    // Damage-only update: শুধু damage related field পাঠাবে (stock এ হাত দেবে না)
    const handleDamageOnlySubmit = async () => {
        if (damageItems.length === 0) {
            showToast('At least one damage product is required!', true);
            return;
        }
        const hasInvalid = damageItems.some(
            (item) => (Number(item.totalQty) || 0) <= 0 && (Number(item.freeQty) || 0) <= 0
        );
        if (hasInvalid) {
            showToast('Each damage product must have a valid quantity (Unit/PCS/Free)!', true);
            return;
        }

        const useAdj = addDamageToAdjustment && damageTotalValue > 0;
        const body = {
            damageItems: buildAdjItemsPayload(damageItems),
            payableAmount: payableAmount,
            ...(useAdj ? { damageAdjustmentAmount: damageTotalValue } : {}),
            unsetFields: useAdj ? [] : ['damageAdjustmentAmount'],
        };

        try {
            const res = await fetch(`https://squirrel-peace-server.onrender.com/sales/${editingOrder._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('Failed');
            clearOrderDrafts();
            showToast('Damage products updated successfully!');
            setTimeout(() => navigate(-1), 1200);
        } catch (error) {
            console.error('Error updating damage:', error);
            showToast('Failed to update damage. Try again.', true);
        }
    };

    // Bulk Return-only update: shudhu returnItems related field pathabe
    const handleReturnOnlySubmit = async () => {
        const hasInvalid = returnItems.some(
            (item) => (Number(item.totalQty) || 0) <= 0 && (Number(item.freeQty) || 0) <= 0
        );
        if (hasInvalid) {
            showToast('Each return product must have a valid quantity (Unit/PCS/Free)!', true);
            return;
        }

        const useAdj = addReturnToAdjustment && returnTotalValue > 0;
        const body = {
            returnItems: buildAdjItemsPayload(returnItems),
            payableAmount: payableAmount,
            ...(useAdj ? { returnAdjustmentAmount: returnTotalValue } : {}),
            unsetFields: useAdj ? [] : ['returnAdjustmentAmount'],
        };

        try {
            const res = await fetch(`https://squirrel-peace-server.onrender.com/sales/${editingOrder._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error('Failed');
            clearOrderDrafts();
            showToast('Bulk return updated successfully!');
            setTimeout(() => navigate(-1), 1200);
        } catch (error) {
            console.error('Error updating bulk return:', error);
            showToast('Failed to update bulk return. Try again.', true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isDamageOnly) {
            handleDamageOnlySubmit();
            return;
        }

        if (isReturnOnly) {
            handleReturnOnlySubmit();
            return;
        }

        // Direct Sales হলে সরাসরি delivery সহ save হবে
        if (directSales && !isEditMode) {
            handleDeliverySubmit();
            return;
        }

        // ---------------- Validation ----------------
        if (!orderFormData.customerId) {
            showToast('Customer is required!', true);
            return;
        }

        if (!directSales && !orderFormData.route) {
            showToast('Route is required!', true);
            return;
        }

        if (!orderFormData.date) {
            showToast('Date is required!', true);
            return;
        }

        if (!directSales && !orderFormData.srId) {
            showToast('SR is required!', true);
            return;
        }

        if (!directSales && !orderFormData.deliveredById) {
            showToast('Delivered By is required!', true);
            return;
        }

        if (orderItems.length === 0 && freeProductItems.length === 0 && damageItems.length === 0 && returnItems.length === 0) {
            showToast('Please add at least one product!', true);
            return;
        }

        const hasInvalidQty = orderItems.some(
            (item) => (Number(item.totalQty) || 0) <= 0 && (Number(item.freeQty) || 0) <= 0
        );
        if (hasInvalidQty) {
            showToast('Each main product must have a valid quantity (Unit/PCS/Free)!', true);
            return;
        }

        const hasInvalidFreeQty = freeProductItems.some(
            (item) => (Number(item.totalQty) || 0) <= 0
        );
        if (hasInvalidFreeQty) {
            showToast('Each free product must have a valid quantity (greater than 0)!', true);
            return;
        }

        const hasInvalidDamageQty = damageItems.some(
            (item) => (Number(item.totalQty) || 0) <= 0 && (Number(item.freeQty) || 0) <= 0
        );
        if (hasInvalidDamageQty) {
            showToast('Each damage product must have a valid quantity (Unit/PCS/Free)!', true);
            return;
        }

        const hasInvalidReturnQty = returnItems.some(
            (item) => (Number(item.totalQty) || 0) <= 0 && (Number(item.freeQty) || 0) <= 0
        );
        if (hasInvalidReturnQty) {
            showToast('Each return product must have a valid quantity (Unit/PCS/Free)!', true);
            return;
        }
        let deliveredPaymentData = {};
        if (isDeliveredEdit) {
            if (paymentAmount === '' || paymentAmount === null) {
                showToast('Payment amount is required!', true);
                return;
            }
            if (!paymentAccountType) {
                showToast('Please select a payment method!', true);
                return;
            }
            if (!selectedAccountInfo) {
                showToast('Please select an account!', true);
                return;
            }

            let accInfo = {};
            if (paymentAccountType === 'Bank') {
                accInfo = {
                    bankName: selectedAccountInfo.bankName || '',
                    accountNumber: selectedAccountInfo.accountNumber || '',
                    accountBranch: selectedAccountInfo.accountBranch || '',
                };
            } else if (paymentAccountType === 'Mobile Banking') {
                accInfo = {
                    accountName: selectedAccountInfo.accountName || '',
                    accountNumber: selectedAccountInfo.accountNumber || '',
                };
            } else {
                accInfo = { accountName: 'Cash' };
            }

            deliveredPaymentData = {
                paidAmount: roundTo2(paymentAmount),
                paymentMethod: paymentAccountType,
                paymentAccount: accInfo,
                paymentNote: paymentNote,
            };
        }
        // ---------------- Validation End ----------------


        const itemsPayload = orderItems.map((item) => {
            const totalQty = Number(item.totalQty) || 0;
            const rowGrossTotal = getRowGross(item);
            const effectiveDiscount =
                item.discountType === 'percent'
                    ? roundTo2((rowGrossTotal * (Number(item.discount) || 0)) / 100)
                    : roundTo2(Number(item.discount) || 0);
            const rowSubtotal = roundTo2(rowGrossTotal - effectiveDiscount);

            return {
                productId: item._id,
                productName: item.productName,
                company: item.company,
                sku: item.sku,
                sellPricePcs: roundTo2(item.sellPricePcs),
                sellPriceUnit: roundTo2(item.sellPriceUnit),
                unit: item.unit || 'Pcs',
                unitQty: Number(item.unitQty) || 0,
                pcsQty: Number(item.pcsQty) || 0,
                parentMode: item.parentMode === true,
                subUnit: item.subUnit || '',
                pcsPerUnit: Number(item.pcsPerUnit) || 1,
                pcsPerSub: Number(item.pcsPerSub) || 0,
                sellPriceSub: roundTo2(item.sellPriceSub),
                subQty: Number(item.subQty) || 0,
                freeSubQty: Number(item.freeSubQty) || 0,
                totalPcs: totalQty,
                freeUnitQty: Number(item.freeUnitQty) || 0,
                freePcsQty: Number(item.freePcsQty) || 0,
                freeQty: Number(item.freeQty) || 0,
                discount: roundTo2(item.discount),
                discountType: item.discountType || 'amount',
                discountAmount: effectiveDiscount,
                subtotal: rowSubtotal,
            };
        });

        const freeItemsPayload = buildFreeItemsPayload();
        const damageItemsPayload = buildAdjItemsPayload(damageItems);
        const returnItemsPayload = buildAdjItemsPayload(returnItems);

        const orderData = {
            orderNo: isEditMode ? editingOrder.orderNo : generateOrderNo(),

            customerId: orderFormData.customerId,
            customer: orderFormData.customer,
            phone: orderFormData.customerContact,
            address: orderFormData.customerAddress,
            route: orderFormData.route,
            shippingAddress: orderFormData.shippingAddress,
            orderDate: orderFormData.date,

            srId: orderFormData.srId,
            sr: orderFormData.sr,
            deliveredById: orderFormData.deliveredById,
            deliveredBy: orderFormData.deliveredBy,

            items: itemsPayload,

            grandTotal: subTotal,
            productWiseDiscount: productWiseDiscount,
            productWiseDiscountPercent: productWiseDiscountPercent,

            overallDiscount: roundTo2(overallDiscountAmount),
            overallDiscountType: overallDiscountType,
            overallDiscountValue: overallDiscountValue,

            adjustment: {
                text: adjustmentText,
                amount: roundTo2(adjustmentValue),
                type: adjustmentType,
            },

            ...(addDamageToAdjustment && damageTotalValue > 0 ? { damageAdjustmentAmount: damageTotalValue } : {}),
            ...(addReturnToAdjustment && returnTotalValue > 0 ? { returnAdjustmentAmount: returnTotalValue } : {}),

            payableAmount: payableAmount,

            orderNote: orderNote,

            ...(directSales ? { directSales: true } : {}),

            ...deliveredPaymentData,

            ...(isEditMode
                ? {
                    unsetFields: [
                        'addDamageToAdjustment',
                        'addReturnToAdjustment',
                        ...(addDamageToAdjustment && damageTotalValue > 0 ? [] : ['damageAdjustmentAmount']),
                        ...(addReturnToAdjustment && returnTotalValue > 0 ? [] : ['returnAdjustmentAmount']),
                    ],
                }
                : {}),

            freeItems: freeItemsPayload,

            damageItems: damageItemsPayload,

            returnItems: returnItemsPayload,
        };

        // Sales database এ save করা (Edit হলে Update, নাহলে নতুন Create)
        const sendOrder = async (confirmed = false) => {
            const res = await fetch(
                isEditMode
                    ? `https://squirrel-peace-server.onrender.com/sales/${editingOrder._id}`
                    : 'https://squirrel-peace-server.onrender.com/sales',
                {
                    method: isEditMode ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(confirmed ? { ...orderData, stockBorrowConfirmed: true } : orderData),
                }
            );

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                if (res.status === 409 && errData?.needsConfirm) {
                    const agreed = await askBorrowConfirm(errData.borrows);
                    if (!agreed) return 'cancelled';
                    return sendOrder(true);
                }
                if (errData?.shortages?.length) {
                    const msg = errData.shortages
                        .map((s) => `${s.productName} (Need: ${s.need}, Stock: ${s.available})`)
                        .join(', ');
                    showToast(`স্টকে পণ্য নেই! ${msg}`, true);
                    return 'cancelled';
                }
                throw new Error('Failed to save order');
            }

            await res.json();
            return 'ok';
        };

        try {
            const outcome = await sendOrder(false);
            if (outcome !== 'ok') return;
        } catch (error) {
            console.error('Error saving order:', error);
            showToast(isEditMode ? 'Failed to update order. Try again.' : 'Failed to save order. Try again.', true);
            return;
        }

        if (isEditMode) {
            showToast('Order updated successfully!');
            setTimeout(() => navigate('/wholesale'), 1500);
            clearOrderDrafts();
            return;
        }

        showToast(`Order created successfully! Order No: ${orderData.orderNo}`);

        setTimeout(() => navigate('/wholesale'), 1500);

        clearOrderDrafts();
        // টেবিল ও ফর্ম রিসেট
        setOrderItems([]);
        setOverallDiscountAmount(0);
        setOverallDiscountType('amount');
        setAdjustmentText('');
        setAdjustmentAmount(0);
        setAdjustmentType('+');
        setOrderNote('');
        setFreeProductItems([]);
        setFreeProductOpen(false);
        setFormResetKey((prev) => prev + 1);
    };

    // --------------------------------------------------
    // Delivery Submit
    // --------------------------------------------------
    const handleDeliverySubmit = async () => {
        if (!orderFormData.customerId) {
            showToast('Customer is required!', true);
            return;
        }

        if (!directSales && !orderFormData.route) {
            showToast('Route is required!', true);
            return;
        }

        if (!orderFormData.date) {
            showToast('Date is required!', true);
            return;
        }

        if (!directSales && !orderFormData.srId) {
            showToast('SR is required!', true);
            return;
        }

        if (!directSales && !orderFormData.deliveredById) {
            showToast('Delivered By is required!', true);
            return;
        }


        if (orderItems.length === 0 && freeProductItems.length === 0 && damageItems.length === 0 && returnItems.length === 0) {
            showToast('Please add at least one product!', true);
            return;
        }

        const hasInvalidQtyDelivery = orderItems.some(
            (item) => (Number(item.totalQty) || 0) <= 0 && (Number(item.freeQty) || 0) <= 0
        );
        if (hasInvalidQtyDelivery) {
            showToast('Each main product must have a valid quantity (Unit/PCS/Free)!', true);
            return;
        }

        const hasInvalidFreeQtyDelivery = freeProductItems.some(
            (item) => (Number(item.totalQty) || 0) <= 0
        );
        if (hasInvalidFreeQtyDelivery) {
            showToast('Each free product must have a valid quantity (greater than 0)!', true);
            return;
        }

        const hasInvalidDamageQtyDelivery = damageItems.some(
            (item) => (Number(item.totalQty) || 0) <= 0 && (Number(item.freeQty) || 0) <= 0
        );
        if (hasInvalidDamageQtyDelivery) {
            showToast('Each damage product must have a valid quantity (Unit/PCS/Free)!', true);
            return;
        }

        const hasInvalidReturnQtyDelivery = returnItems.some(
            (item) => (Number(item.totalQty) || 0) <= 0 && (Number(item.freeQty) || 0) <= 0
        );
        if (hasInvalidReturnQtyDelivery) {
            showToast('Each return product must have a valid quantity (Unit/PCS/Free)!', true);
            return;
        }

        if (paymentAmount === '' || paymentAmount === null) {
            showToast('Payment amount is required!', true);
            return;
        }

        if (!paymentAccountType) {
            showToast('Please select a payment method!', true);
            return;
        }

        if (!selectedAccountInfo) {
            showToast('Please select an account!', true);
            return;
        }

        const today = new Date();
        const deliveryDate = today.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

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

        const itemsPayload = orderItems.map((item) => {
            const totalQty = Number(item.totalQty) || 0;
            const rowGrossTotal = getRowGross(item);
            const effectiveDiscount =
                item.discountType === 'percent'
                    ? roundTo2((rowGrossTotal * (Number(item.discount) || 0)) / 100)
                    : roundTo2(Number(item.discount) || 0);
            const rowSubtotal = roundTo2(rowGrossTotal - effectiveDiscount);

            return {
                productId: item._id,
                productName: item.productName,
                company: item.company,
                sku: item.sku,
                sellPricePcs: roundTo2(item.sellPricePcs),
                sellPriceUnit: roundTo2(item.sellPriceUnit),
                unit: item.unit || 'Pcs',
                unitQty: Number(item.unitQty) || 0,
                pcsQty: Number(item.pcsQty) || 0,
                parentMode: item.parentMode === true,
                subUnit: item.subUnit || '',
                pcsPerUnit: Number(item.pcsPerUnit) || 1,
                pcsPerSub: Number(item.pcsPerSub) || 0,
                sellPriceSub: roundTo2(item.sellPriceSub),
                subQty: Number(item.subQty) || 0,
                freeSubQty: Number(item.freeSubQty) || 0,
                totalPcs: totalQty,
                freeUnitQty: Number(item.freeUnitQty) || 0,
                freePcsQty: Number(item.freePcsQty) || 0,
                freeQty: Number(item.freeQty) || 0,
                discount: roundTo2(item.discount),
                discountType: item.discountType || 'amount',
                subtotal: rowSubtotal,
            };
        });

        const freeItemsPayload = buildFreeItemsPayload();
        const damageItemsPayload = buildAdjItemsPayload(damageItems);
        const returnItemsPayload = buildAdjItemsPayload(returnItems);

        const deliveryData = {
            customerId: orderFormData.customerId,
            customer: orderFormData.customer,
            phone: orderFormData.customerContact,
            address: orderFormData.customerAddress,
            orderDate: orderFormData.date,

            ...(directSales
                ? { directSales: true }
                : {
                    route: orderFormData.route,
                    shippingAddress: orderFormData.shippingAddress,
                    srId: orderFormData.srId,
                    sr: orderFormData.sr,
                    deliveredById: orderFormData.deliveredById,
                    deliveredBy: orderFormData.deliveredBy,
                }),

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

            ...(addDamageToAdjustment && damageTotalValue > 0 ? { damageAdjustmentAmount: damageTotalValue } : {}),
            ...(addReturnToAdjustment && returnTotalValue > 0 ? { returnAdjustmentAmount: returnTotalValue } : {}),

            payableAmount: payableAmount,
            orderNote: orderNote,

            unsetFields: [
                'addDamageToAdjustment',
                'addReturnToAdjustment',
                ...(addDamageToAdjustment && damageTotalValue > 0 ? [] : ['damageAdjustmentAmount']),
                ...(addReturnToAdjustment && returnTotalValue > 0 ? [] : ['returnAdjustmentAmount']),
            ],

            paidAmount: roundTo2(paymentAmount),
            deliveryDate: deliveryDate,
            status: 'Delivered',
            paymentMethod: paymentAccountType,
            paymentAccount: accountInfo,
            paymentNote: paymentNote,

            freeItems: freeItemsPayload,

            damageItems: damageItemsPayload,

            returnItems: returnItemsPayload,
        };

        const newOrderNo = generateOrderNo();

        const sendDelivery = async (confirmed = false) => {
            const { unsetFields: _unsetFields, ...deliveryCreateData } = deliveryData;
            const extra = confirmed ? { stockBorrowConfirmed: true } : {};
            const res = await fetch(
                !editingOrder
                    ? 'https://squirrel-peace-server.onrender.com/sales'
                    : `https://squirrel-peace-server.onrender.com/sales/${editingOrder._id}`,
                {
                    method: !editingOrder ? 'POST' : 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(
                        !editingOrder
                            ? { ...deliveryCreateData, orderNo: newOrderNo, ...extra }
                            : { ...deliveryData, orderNo: editingOrder.orderNo, ...extra }
                    ),
                }
            );

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));

                if (res.status === 409 && errData?.needsConfirm) {
                    const agreed = await askBorrowConfirm(errData.borrows);
                    if (!agreed) return 'cancelled';
                    return sendDelivery(true);
                }

                if (errData?.shortages?.length) {
                    const msg = errData.shortages
                        .map((s) => `${s.productName} (Need: ${s.need}, Stock: ${s.available})`)
                        .join(', ');
                    showToast(`Stock a product nai! ${msg}`, true);
                    return 'cancelled';
                }
                showToast(errData?.error || errData?.message || `Server error (${res.status})`, true);
                return 'cancelled';
            }

            await res.json();
            return 'ok';
        };

        try {
            const outcome = await sendDelivery(false);
            if (outcome !== 'ok') return;

            clearOrderDrafts();
            showToast('Order delivered successfully!');

            setTimeout(() => {
                navigate('/wholesale', { replace: true, state: null });
            }, 1000);
        } catch (error) {
            console.error('Error delivering order:', error);
            showToast('Failed to deliver order. Try again.', true);
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
                Order Form (Customer, Route, SR, Product Select...)
            ----------------------------------------- */}
            <LockWrap
                locked={isDamageOnly || isReturnOnly}
                as={OrderForm}
                key={formResetKey}
                onAddProduct={handleAddProduct}
                addedProductIds={addedProductIds}
                onFormDataChange={handleFormDataChange}
                initialData={editingOrder}
                directSales={directSales}
                onDirectSalesChange={handleDirectSalesChange}
            />

            {/* -----------------------------------------
                Main Order Table
            ----------------------------------------- */}
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 my-6 relative z-0">
                <div className="bg-white rounded-3xl shadow-xl shadow-teal-900/5 p-4 md:p-5 border border-teal-100/70">

                    <form onSubmit={handleSubmit}>

                        {/* ---------------------------------
                            Product Table
                        --------------------------------- */}
                        <div className={`overflow-x-auto rounded-2xl border border-teal-100 ${lockCls}`}>
                            <table className="w-full table-fixed text-left border-collapse [&_td>input]:w-full [&_td_input]:min-w-0">
                                <colgroup>
                                    <col style={{ width: '11%' }} />
                                    <col style={{ width: '6%' }} />
                                    <col style={{ width: '11%' }} />
                                    <col style={{ width: '8%' }} />
                                    <col style={{ width: '11%' }} />
                                    <col style={{ width: '8%' }} />
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '13%' }} />
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '5%' }} />
                                </colgroup>

                                <thead>
                                    <tr className="bg-teal-50/60 border-b-2 border-teal-100 text-xs font-semibold text-teal-800">
                                        <th className="py-3 px-3">Product Name</th>
                                        <th className="py-3 px-3">Company</th>
                                        <th className="py-3 pl-4 pr-1">Unit Qty</th>
                                        <th className="py-3 pl-3 pr-2">PCS Qty</th>
                                        <th className="py-3 pl-4 pr-1">Free Unit</th>
                                        <th className="py-3 pl-3 pr-2">Free PCS</th>
                                        <th className="py-3 px-3">Sell Price ({sellPriceUnitLabel})</th>
                                        <th className="py-3 px-3">Sell Price (PCS)</th>
                                        <th className="py-3 px-3">Discount</th>
                                        <th className="py-3 px-3">Subtotal</th>
                                        <th className="py-3 px-3 text-center">Action</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 text-sm">

                                    {orderItems.length > 0 ? (

                                        orderItems.map((item) => {

                                            // Row Subtotal
                                            const rowGrossTotal = getRowGross(item);

                                            const rowEffectiveDiscount =
                                                item.discountType === 'percent'
                                                    ? roundTo2((rowGrossTotal * (Number(item.discount) || 0)) / 100)
                                                    : roundTo2(Number(item.discount) || 0);

                                            const rowDiscountPercent =
                                                item.discountType === 'amount'
                                                    ? (rowGrossTotal > 0
                                                        ? roundTo2(((Number(item.discount) || 0) / rowGrossTotal) * 100)
                                                        : 0)
                                                    : 0;

                                            const rowSubtotal = roundTo2(rowGrossTotal - rowEffectiveDiscount);

                                            const currentUnitLabel = item.unit || 'Pcs';

                                            return (
                                                <tr key={item.uniqueId} className="hover:bg-teal-50/40 transition">

                                                    {/* Product Name */}
                                                    <td className="py-3 px-2 leading-tight">
                                                        <div className="font-semibold text-slate-800">
                                                            {item.productName}
                                                        </div>
                                                    </td>

                                                    {/* Company */}
                                                    <td className="py-3 px-2 text-slate-600 text-xs">
                                                        {item.company}
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
                                                                            handleItemChange(item.uniqueId, 'unitQty', value);
                                                                        }
                                                                    }}
                                                                    className="w-14 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                />
                                                                <span
                                                                    className="flex-1 bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                    title={currentUnitLabel}
                                                                >
                                                                    {currentUnitLabel}
                                                                </span>
                                                            </div>
                                                            {item.parentMode && (
                                                                <div className="mt-1.5 flex items-center border border-indigo-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        placeholder="0"
                                                                        value={item.subQty ?? ''}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*$/.test(value)) {
                                                                                handleItemChange(item.uniqueId, 'subQty', value);
                                                                            }
                                                                        }}
                                                                        className="w-14 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                    />
                                                                    <span
                                                                        className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                        title="Sub Unit"
                                                                    >
                                                                        {item.subUnit}
                                                                    </span>
                                                                </div>
                                                            )}
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
                                                                        handleItemChange(item.uniqueId, 'pcsQty', value);
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2.5 rounded-xl border border-indigo-200 bg-white text-sm outline-none shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
                                                                            handleItemChange(item.uniqueId, 'freeUnitQty', value);
                                                                        }
                                                                    }}
                                                                    className="w-14 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                />

                                                                <span
                                                                    className="flex-1 bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                    title={currentUnitLabel}
                                                                >
                                                                    {currentUnitLabel}
                                                                </span>

                                                            </div>
                                                            {item.parentMode && (
                                                                <div className="mt-1.5 flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        placeholder="0"
                                                                        value={item.freeSubQty ?? ''}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*$/.test(value)) {
                                                                                handleItemChange(item.uniqueId, 'freeSubQty', value);
                                                                            }
                                                                        }}
                                                                        className="w-14 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                    />
                                                                    <span
                                                                        className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                        title="Sub Unit"
                                                                    >
                                                                        {item.subUnit}
                                                                    </span>
                                                                </div>
                                                            )}
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
                                                                        handleItemChange(item.uniqueId, 'freePcsQty', value);
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm outline-none shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                            />
                                                        </div>
                                                    </td>

                                                    {/* Sell Price (Unit) */}
                                                    <td className="relative py-3 px-2">
                                                        {/* Unit অংশের মোট দাম (Unit Qty × Unit দাম) */}
                                                        <div
                                                            className={`absolute top-1 left-4 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${getUnitTotal(item) > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}
                                                        >
                                                            ৳{getUnitTotal(item).toFixed(2)}
                                                        </div>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            placeholder="0"
                                                            title="প্রতি Unit এর দাম (edit করা যাবে)"
                                                            disabled={!(Number(item.unitQty) > 0)}
                                                            value={item.sellPriceUnit}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                    handleItemChange(item.uniqueId, 'sellPriceUnit', value);
                                                                }
                                                            }}
                                                            className="w-20 px-2 py-2 rounded-xl border border-indigo-200 bg-indigo-50/60 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:border-slate-200 disabled:cursor-not-allowed"
                                                        />
                                                        {item.parentMode && (
                                                            <div className="relative mt-6">
                                                                <div
                                                                    className={`absolute -top-4 left-2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${getSubTotal(item) > 0 ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-slate-100 text-slate-400'}`}
                                                                >
                                                                    {item.subUnit}: ৳{getSubTotal(item).toFixed(2)}
                                                                </div>
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    placeholder="0"
                                                                    title="প্রতি Sub Unit এর দাম (edit করা যাবে)"
                                                                    disabled={!(Number(item.subQty) > 0)}
                                                                    value={item.sellPriceSub}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                            handleItemChange(item.uniqueId, 'sellPriceSub', value);
                                                                        }
                                                                    }}
                                                                    className="w-20 px-2 py-2 rounded-xl border border-fuchsia-200 bg-fuchsia-50/60 text-sm outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100 disabled:bg-slate-100 disabled:border-slate-200 disabled:cursor-not-allowed"
                                                                />
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Sell Price (PCS) */}
                                                    <td className="relative py-3 px-2">
                                                        {/* PCS অংশের মোট দাম (PCS Qty × PCS দাম) */}
                                                        <div
                                                            className={`absolute top-1 left-4 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${getPcsTotal(item) > 0 ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}
                                                        >
                                                            ৳{getPcsTotal(item).toFixed(2)}
                                                        </div>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.sellPricePcs}
                                                            disabled={!(Number(item.pcsQty) > 0)}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                    handleItemChange(item.uniqueId, 'sellPricePcs', value);
                                                                }
                                                            }}
                                                            className="w-20 px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                        />
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
                                                                onClick={() => handleToggleDiscountType(item.uniqueId)}
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
                                                                        handleItemChange(item.uniqueId, 'discount', value);
                                                                    }
                                                                }}
                                                                className="w-20 px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                            />
                                                        </div>
                                                    </td>

                                                    {/* Row Subtotal */}
                                                    <td className="py-3 px-2 font-bold text-emerald-700 whitespace-nowrap">
                                                        {rowSubtotal.toFixed(2)}
                                                    </td>

                                                    {/* Action */}
                                                    <td className="py-3 px-1 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(item.uniqueId)}
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
                                                Please fill the order information above and select a product.
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

                            <div className={`w-full md:w-[700px] space-y-2.5 bg-teal-50/40 border border-teal-100 rounded-2xl p-5 ${lockCls}`}>

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
                                            onChange={(e) => setAdjustmentText(e.target.value)}
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
                                            onChange={(e) => setAdjustmentType(e.target.value)}
                                            className="w-16 shrink-0 px-2 py-2 border-l border-slate-200 bg-white text-sm outline-none cursor-pointer"
                                        >
                                            <option value="+">+</option>
                                            <option value="-">-</option>
                                        </select>

                                    </div>
                                </div>

                                {/* Damage Amount (Toggle On হলে দেখাবে) */}
                                {addDamageToAdjustment && damageTotalValue > 0 && (
                                    <div className="flex items-center">
                                        <label className="w-56 text-right pr-3 text-sm font-medium text-red-600">
                                            Damage Products Amount
                                        </label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={`- ৳${damageTotalValue.toFixed(2)}`}
                                            className="flex-1 px-3 py-2 border border-red-200 bg-red-50 text-red-700 font-semibold rounded-lg text-sm outline-none"
                                        />
                                    </div>
                                )}

                                {/* Return Amount (Toggle On হলে দেখাবে) */}
                                {addReturnToAdjustment && returnTotalValue > 0 && (
                                    <div className="flex items-center">
                                        <label className="w-56 text-right pr-3 text-sm font-medium text-violet-600">
                                            Return Products Amount
                                        </label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={`- ৳${returnTotalValue.toFixed(2)}`}
                                            className="flex-1 px-3 py-2 border border-violet-200 bg-violet-50 text-violet-700 font-semibold rounded-lg text-sm outline-none"
                                        />
                                    </div>
                                )}

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
                                disabled={isDamageOnly}
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
                                <div className={`mt-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 md:p-6 ${lockCls}`}>
                                    <h3 className="text-base font-bold text-emerald-800 mb-4">Others Free Product</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <SearchSelect
                                            label="Filter by Company"
                                            placeholder="Search or select company..."
                                            searchValue={freeSearch.company}
                                            onSearchChange={(text) => setFreeSearch((prev) => ({ ...prev, company: text }))}
                                            onClear={handleClearFreeCompany}
                                            onSelect={handleSelectFreeCompany}
                                            items={filteredFreeCompanies}
                                            getKey={(comp) => comp._id}
                                            emptyText="No company found"
                                            renderItem={(comp) => (
                                                <p className="text-sm font-semibold text-slate-800">{comp.businessName}</p>
                                            )}
                                        />

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
                                                                    {item.parentMode && (
                                                                        <div className="mt-1.5 flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                step="1"
                                                                                placeholder="0"
                                                                                value={item.subQty ?? ''}
                                                                                onChange={(e) => {
                                                                                    const value = e.target.value;
                                                                                    if (/^\d*$/.test(value)) {
                                                                                        handleFreeItemChange(item.uniqueId, 'subQty', value);
                                                                                    }
                                                                                }}
                                                                                className="w-20 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                            />
                                                                            <span
                                                                                className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-1 py-2.5 text-center font-semibold select-none truncate"
                                                                                title="Sub Unit"
                                                                            >
                                                                                {item.subUnit}
                                                                            </span>
                                                                        </div>
                                                                    )}
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

                        {/* =================================
DAMAGE PRODUCT
                        ================================= */}
                        <div className="flex flex-col-reverse">
                            {/*
                        ================================= */}
                            <div className="mt-8">
                                <button
                                    type="button"
                                    disabled={!hasMainProduct}
                                    title={!hasMainProduct ? disabledTip : ''}
                                    onClick={() => hasMainProduct && setDamageProductOpen((prev) => !prev)}
                                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-sm font-semibold text-white shadow-md shadow-red-200 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                    Damage Product
                                    {damageItems.length > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                                            {damageItems.length}
                                        </span>
                                    )}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className={`w-4 h-4 transition-transform duration-200 ${damageProductOpen ? 'rotate-180' : ''}`}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>

                                {damageProductOpen && hasMainProduct && (
                                    <div id="damage-section" className={`mt-4 bg-red-50/50 border border-red-100 rounded-2xl p-5 md:p-6 scroll-mt-6 ${isReturnOnly ? lockCls : ''}`}>
                                        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                            <h3 className="text-base font-bold text-red-800">Damage Product</h3>

                                            <div className="flex items-center gap-2.5">
                                                <span className="text-xs font-semibold text-red-700">
                                                    Add to the Damage Adjustment
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setAddDamageToAdjustment((prev) => !prev)}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${addDamageToAdjustment ? 'bg-red-500' : 'bg-slate-300'
                                                        }`}
                                                >
                                                    <span
                                                        className={`inline-block h-4.5 w-4.5 h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${addDamageToAdjustment ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                            </div>

                                            {damageItems.length > 0 && (
                                                <span className="px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-bold border border-red-200">
                                                    Total Value: ৳{damageTotalValue.toFixed(2)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <SearchSelect
                                                label="Filter by Company"
                                                placeholder="Search or select company..."
                                                searchValue={damageSearch.company}
                                                onSearchChange={(text) => setDamageSearch((prev) => ({ ...prev, company: text }))}
                                                onClear={handleClearDamageCompany}
                                                onSelect={handleSelectDamageCompany}
                                                items={filteredDamageCompanies}
                                                getKey={(comp) => comp._id}
                                                emptyText="No company found"
                                                renderItem={(comp) => (
                                                    <p className="text-sm font-semibold text-slate-800">{comp.businessName}</p>
                                                )}
                                            />

                                            <SearchSelect
                                                label="Filter by Category"
                                                placeholder="Search or select category..."
                                                searchValue={damageSearch.category}
                                                onSearchChange={(text) => setDamageSearch((prev) => ({ ...prev, category: text }))}
                                                onClear={handleClearDamageCategory}
                                                onSelect={handleSelectDamageCategory}
                                                items={filteredDamageCategories}
                                                getKey={(cat) => cat._id}
                                                emptyText="No active category found"
                                                renderItem={(cat) => (
                                                    <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                                                )}
                                            />

                                            <SearchSelect
                                                label="Select Damage Product"
                                                placeholder="Search or select product..."
                                                searchValue={damageSearch.product}
                                                onSearchChange={(text) => setDamageSearch((prev) => ({ ...prev, product: text }))}
                                                onClear={() => setDamageSearch((prev) => ({ ...prev, product: '' }))}
                                                onSelect={handleAddDamageProduct}
                                                items={filteredDamageProducts}
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
                                                            <span className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-lg font-medium border border-red-100 shrink-0">
                                                                SKU: {prod.sku}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </div>

                                        {damageItems.length > 0 && (
                                            <div className="mt-6 overflow-x-auto rounded-2xl border border-red-200">
                                                <table className="w-full table-fixed text-left border-collapse [&_td>input]:w-full [&_td_input]:min-w-0">
                                                    <colgroup>
                                                        <col style={{ width: '13%' }} />
                                                        <col style={{ width: '8%' }} />
                                                        <col style={{ width: '12%' }} />
                                                        <col style={{ width: '9%' }} />
                                                        <col style={{ width: '12%' }} />
                                                        <col style={{ width: '9%' }} />
                                                        <col style={{ width: '11%' }} />
                                                        <col style={{ width: '11%' }} />
                                                        <col style={{ width: '10%' }} />
                                                        <col style={{ width: '5%' }} />
                                                    </colgroup>
                                                    <thead>
                                                        <tr className="bg-red-100/70 border-b-2 border-red-200 text-xs font-semibold text-red-800">
                                                            <th className="py-3 px-3">Product Name</th>
                                                            <th className="py-3 px-3">Company</th>
                                                            <th className="py-3 pl-4 pr-1">Unit Qty</th>
                                                            <th className="py-3 pl-3 pr-2">PCS Qty</th>
                                                            <th className="py-3 pl-4 pr-1">Free Unit</th>
                                                            <th className="py-3 pl-3 pr-2">Free PCS</th>
                                                            <th className="py-3 px-3">Sell Price ({damageSellPriceUnitLabel})</th>
                                                            <th className="py-3 px-3">Sell Price (PCS)</th>
                                                            <th className="py-3 px-3">Subtotal</th>
                                                            <th className="py-3 px-3 text-center">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-red-100 text-sm">
                                                        {damageItems.map((item) => {
                                                            const rowGrossTotal = getRowGross(item);
                                                            const currentUnitLabel = item.unit || 'Pcs';

                                                            return (
                                                                <tr key={item.uniqueId} className="hover:bg-red-50/40 transition">

                                                                    <td className="py-3 px-2 leading-tight">
                                                                        <div className="font-semibold text-slate-800">
                                                                            {item.productName}
                                                                        </div>
                                                                    </td>

                                                                    <td className="py-3 px-2 text-slate-600 text-xs">
                                                                        {item.company}
                                                                    </td>

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
                                                                                            handleDamageItemChange(item.uniqueId, 'unitQty', value);
                                                                                        }
                                                                                    }}
                                                                                    className="w-14 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                                />
                                                                                <span
                                                                                    className="flex-1 bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                                    title={currentUnitLabel}
                                                                                >
                                                                                    {currentUnitLabel}
                                                                                </span>
                                                                            </div>
                                                                            {item.parentMode && (
                                                                                <div className="mt-1.5 flex items-center border border-indigo-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        step="1"
                                                                                        placeholder="0"
                                                                                        value={item.subQty ?? ''}
                                                                                        onChange={(e) => {
                                                                                            const value = e.target.value;
                                                                                            if (/^\d*$/.test(value)) {
                                                                                                handleDamageItemChange(item.uniqueId, 'subQty', value);
                                                                                            }
                                                                                        }}
                                                                                        className="w-14 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                                    />
                                                                                    <span
                                                                                        className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                                        title="Sub Unit"
                                                                                    >
                                                                                        {item.subUnit}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>

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
                                                                                        handleDamageItemChange(item.uniqueId, 'pcsQty', value);
                                                                                    }
                                                                                }}
                                                                                className="w-full px-3 py-2.5 rounded-xl border border-indigo-200 bg-white text-sm outline-none shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                                                            />
                                                                        </div>
                                                                    </td>

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
                                                                                            handleDamageItemChange(item.uniqueId, 'freeUnitQty', value);
                                                                                        }
                                                                                    }}
                                                                                    className="w-14 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                                />
                                                                                <span
                                                                                    className="flex-1 bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                                    title={currentUnitLabel}
                                                                                >
                                                                                    {currentUnitLabel}
                                                                                </span>
                                                                            </div>
                                                                            {item.parentMode && (
                                                                                <div className="mt-1.5 flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        step="1"
                                                                                        placeholder="0"
                                                                                        value={item.freeSubQty ?? ''}
                                                                                        onChange={(e) => {
                                                                                            const value = e.target.value;
                                                                                            if (/^\d*$/.test(value)) {
                                                                                                handleDamageItemChange(item.uniqueId, 'freeSubQty', value);
                                                                                            }
                                                                                        }}
                                                                                        className="w-14 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                                    />
                                                                                    <span
                                                                                        className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                                        title="Sub Unit"
                                                                                    >
                                                                                        {item.subUnit}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>

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
                                                                                        handleDamageItemChange(item.uniqueId, 'freePcsQty', value);
                                                                                    }
                                                                                }}
                                                                                className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm outline-none shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                                            />
                                                                        </div>
                                                                    </td>

                                                                    <td className="relative py-3 px-2">
                                                                        <div
                                                                            className={`absolute top-1 left-4 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${getUnitTotal(item) > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}
                                                                        >
                                                                            ৳{getUnitTotal(item).toFixed(2)}
                                                                        </div>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            placeholder="0"
                                                                            title="প্রতি Unit এর দাম (edit করা যাবে)"
                                                                            disabled={!(Number(item.unitQty) > 0)}
                                                                            value={item.sellPriceUnit}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                                    handleDamageItemChange(item.uniqueId, 'sellPriceUnit', value);
                                                                                }
                                                                            }}
                                                                            className="w-20 px-2 py-2 rounded-xl border border-indigo-200 bg-indigo-50/60 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:border-slate-200 disabled:cursor-not-allowed"
                                                                        />
                                                                        {item.parentMode && (
                                                                            <div className="relative mt-6">
                                                                                <div
                                                                                    className={`absolute -top-4 left-2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${getSubTotal(item) > 0 ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-slate-100 text-slate-400'}`}
                                                                                >
                                                                                    {item.subUnit}: ৳{getSubTotal(item).toFixed(2)}
                                                                                </div>
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    step="0.01"
                                                                                    placeholder="0"
                                                                                    title="প্রতি Sub Unit এর দাম (edit করা যাবে)"
                                                                                    disabled={!(Number(item.subQty) > 0)}
                                                                                    value={item.sellPriceSub}
                                                                                    onChange={(e) => {
                                                                                        const value = e.target.value;
                                                                                        if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                                            handleDamageItemChange(item.uniqueId, 'sellPriceSub', value);
                                                                                        }
                                                                                    }}
                                                                                    className="w-20 px-2 py-2 rounded-xl border border-fuchsia-200 bg-fuchsia-50/60 text-sm outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100 disabled:bg-slate-100 disabled:border-slate-200 disabled:cursor-not-allowed"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </td>

                                                                    <td className="relative py-3 px-2">
                                                                        <div
                                                                            className={`absolute top-1 left-4 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${getPcsTotal(item) > 0 ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}
                                                                        >
                                                                            ৳{getPcsTotal(item).toFixed(2)}
                                                                        </div>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={item.sellPricePcs}
                                                                            disabled={!(Number(item.pcsQty) > 0)}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                                    handleDamageItemChange(item.uniqueId, 'sellPricePcs', value);
                                                                                }
                                                                            }}
                                                                            className="w-20 px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                                        />
                                                                    </td>

                                                                    <td className="py-3 px-2 font-bold text-emerald-700 whitespace-nowrap">
                                                                        {rowGrossTotal.toFixed(2)}
                                                                    </td>

                                                                    <td className="py-3 px-1 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveDamageItem(item.uniqueId)}
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
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* =================================
                            RETURN PRODUCT
                        ================================= */}
                            <div className="mt-8">
                                <button
                                    type="button"
                                    onClick={() => hasMainProduct && setReturnProductOpen((prev) => !prev)}
                                    disabled={isDamageOnly || !hasMainProduct}
                                    title={!hasMainProduct ? disabledTip : ''}
                                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-sm font-semibold text-white shadow-md shadow-violet-200 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                    </svg>
                                    Bulk Return Product
                                    {returnItems.length > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                                            {returnItems.length}
                                        </span>
                                    )}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className={`w-4 h-4 transition-transform duration-200 ${returnProductOpen ? 'rotate-180' : ''}`}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>

                                {returnProductOpen && hasMainProduct && (
                                    <div className={`mt-4 bg-violet-50/50 border border-violet-100 rounded-2xl p-5 md:p-6 ${isDamageOnly ? lockCls : ''}`}>
                                        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                            <h3 className="text-base font-bold text-violet-800">Bulk Return Product</h3>

                                            <div className="flex items-center gap-2.5">
                                                <span className="text-xs font-semibold text-violet-700">
                                                    Add to the Return Adjustment
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setAddReturnToAdjustment((prev) => !prev)}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${addReturnToAdjustment ? 'bg-violet-500' : 'bg-slate-300'
                                                        }`}
                                                >
                                                    <span
                                                        className={`inline-block h-4.5 w-4.5 h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${addReturnToAdjustment ? 'translate-x-6' : 'translate-x-1'
                                                            }`}
                                                    />
                                                </button>
                                            </div>

                                            {returnItems.length > 0 && (
                                                <span className="px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-bold border border-violet-200">
                                                    Total Value: ৳{returnTotalValue.toFixed(2)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <SearchSelect
                                                label="Filter by Company"
                                                placeholder="Search or select company..."
                                                searchValue={returnSearch.company}
                                                onSearchChange={(text) => setReturnSearch((prev) => ({ ...prev, company: text }))}
                                                onClear={handleClearReturnCompany}
                                                onSelect={handleSelectReturnCompany}
                                                items={filteredReturnCompanies}
                                                getKey={(comp) => comp._id}
                                                emptyText="No company found"
                                                renderItem={(comp) => (
                                                    <p className="text-sm font-semibold text-slate-800">{comp.businessName}</p>
                                                )}
                                            />

                                            <SearchSelect
                                                label="Filter by Category"
                                                placeholder="Search or select category..."
                                                searchValue={returnSearch.category}
                                                onSearchChange={(text) => setReturnSearch((prev) => ({ ...prev, category: text }))}
                                                onClear={handleClearReturnCategory}
                                                onSelect={handleSelectReturnCategory}
                                                items={filteredReturnCategories}
                                                getKey={(cat) => cat._id}
                                                emptyText="No active category found"
                                                renderItem={(cat) => (
                                                    <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                                                )}
                                            />

                                            <SearchSelect
                                                label="Select Return Product"
                                                placeholder="Search or select product..."
                                                searchValue={returnSearch.product}
                                                onSearchChange={(text) => setReturnSearch((prev) => ({ ...prev, product: text }))}
                                                onClear={() => setReturnSearch((prev) => ({ ...prev, product: '' }))}
                                                onSelect={handleAddReturnProduct}
                                                items={filteredReturnProducts}
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
                                                            <span className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-lg font-medium border border-violet-100 shrink-0">
                                                                SKU: {prod.sku}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </div>

                                        {returnItems.length > 0 && (
                                            <div className="mt-6 overflow-x-auto rounded-2xl border border-violet-200">
                                                <table className="w-full table-fixed text-left border-collapse [&_td>input]:w-full [&_td_input]:min-w-0">
                                                    <colgroup>
                                                        <col style={{ width: '13%' }} />
                                                        <col style={{ width: '8%' }} />
                                                        <col style={{ width: '12%' }} />
                                                        <col style={{ width: '9%' }} />
                                                        <col style={{ width: '12%' }} />
                                                        <col style={{ width: '9%' }} />
                                                        <col style={{ width: '11%' }} />
                                                        <col style={{ width: '11%' }} />
                                                        <col style={{ width: '10%' }} />
                                                        <col style={{ width: '5%' }} />
                                                    </colgroup>
                                                    <thead>
                                                        <tr className="bg-violet-100/70 border-b-2 border-violet-200 text-xs font-semibold text-violet-800">
                                                            <th className="py-3 px-3">Product Name</th>
                                                            <th className="py-3 px-3">Company</th>
                                                            <th className="py-3 pl-4 pr-1">Unit Qty</th>
                                                            <th className="py-3 pl-3 pr-2">PCS Qty</th>
                                                            <th className="py-3 pl-4 pr-1">Free Unit</th>
                                                            <th className="py-3 pl-3 pr-2">Free PCS</th>
                                                            <th className="py-3 px-3">Sell Price ({returnSellPriceUnitLabel})</th>
                                                            <th className="py-3 px-3">Sell Price (PCS)</th>
                                                            <th className="py-3 px-3">Subtotal</th>
                                                            <th className="py-3 px-3 text-center">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-violet-100 text-sm">
                                                        {returnItems.map((item) => {
                                                            const rowGrossTotal = getRowGross(item);
                                                            const currentUnitLabel = item.unit || 'Pcs';

                                                            return (
                                                                <tr key={item.uniqueId} className="hover:bg-violet-50/40 transition">

                                                                    <td className="py-3 px-2 leading-tight">
                                                                        <div className="font-semibold text-slate-800">
                                                                            {item.productName}
                                                                        </div>
                                                                    </td>

                                                                    <td className="py-3 px-2 text-slate-600 text-xs">
                                                                        {item.company}
                                                                    </td>

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
                                                                                            handleReturnItemChange(item.uniqueId, 'unitQty', value);
                                                                                        }
                                                                                    }}
                                                                                    className="w-14 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                                />
                                                                                <span
                                                                                    className="flex-1 bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                                    title={currentUnitLabel}
                                                                                >
                                                                                    {currentUnitLabel}
                                                                                </span>
                                                                            </div>
                                                                            {item.parentMode && (
                                                                                <div className="mt-1.5 flex items-center border border-indigo-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        step="1"
                                                                                        placeholder="0"
                                                                                        value={item.subQty ?? ''}
                                                                                        onChange={(e) => {
                                                                                            const value = e.target.value;
                                                                                            if (/^\d*$/.test(value)) {
                                                                                                handleReturnItemChange(item.uniqueId, 'subQty', value);
                                                                                            }
                                                                                        }}
                                                                                        className="w-14 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                                    />
                                                                                    <span
                                                                                        className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                                        title="Sub Unit"
                                                                                    >
                                                                                        {item.subUnit}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>

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
                                                                                        handleReturnItemChange(item.uniqueId, 'pcsQty', value);
                                                                                    }
                                                                                }}
                                                                                className="w-full px-3 py-2.5 rounded-xl border border-indigo-200 bg-white text-sm outline-none shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                                                            />
                                                                        </div>
                                                                    </td>

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
                                                                                            handleReturnItemChange(item.uniqueId, 'freeUnitQty', value);
                                                                                        }
                                                                                    }}
                                                                                    className="w-14 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                                />
                                                                                <span
                                                                                    className="flex-1 bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                                    title={currentUnitLabel}
                                                                                >
                                                                                    {currentUnitLabel}
                                                                                </span>
                                                                            </div>
                                                                            {item.parentMode && (
                                                                                <div className="mt-1.5 flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                                    <input
                                                                                        type="number"
                                                                                        min="0"
                                                                                        step="1"
                                                                                        placeholder="0"
                                                                                        value={item.freeSubQty ?? ''}
                                                                                        onChange={(e) => {
                                                                                            const value = e.target.value;
                                                                                            if (/^\d*$/.test(value)) {
                                                                                                handleReturnItemChange(item.uniqueId, 'freeSubQty', value);
                                                                                            }
                                                                                        }}
                                                                                        className="w-14 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                                    />
                                                                                    <span
                                                                                        className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                                        title="Sub Unit"
                                                                                    >
                                                                                        {item.subUnit}
                                                                                    </span>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>

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
                                                                                        handleReturnItemChange(item.uniqueId, 'freePcsQty', value);
                                                                                    }
                                                                                }}
                                                                                className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm outline-none shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                                            />
                                                                        </div>
                                                                    </td>

                                                                    <td className="relative py-3 px-2">
                                                                        <div
                                                                            className={`absolute top-1 left-4 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${getUnitTotal(item) > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}
                                                                        >
                                                                            ৳{getUnitTotal(item).toFixed(2)}
                                                                        </div>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            placeholder="0"
                                                                            title="প্রতি Unit এর দাম (edit করা যাবে)"
                                                                            disabled={!(Number(item.unitQty) > 0)}
                                                                            value={item.sellPriceUnit}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                                    handleReturnItemChange(item.uniqueId, 'sellPriceUnit', value);
                                                                                }
                                                                            }}
                                                                            className="w-20 px-2 py-2 rounded-xl border border-indigo-200 bg-indigo-50/60 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:border-slate-200 disabled:cursor-not-allowed"
                                                                        />
                                                                        {item.parentMode && (
                                                                            <div className="relative mt-6">
                                                                                <div
                                                                                    className={`absolute -top-4 left-2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${getSubTotal(item) > 0 ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-slate-100 text-slate-400'}`}
                                                                                >
                                                                                    {item.subUnit}: ৳{getSubTotal(item).toFixed(2)}
                                                                                </div>
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    step="0.01"
                                                                                    placeholder="0"
                                                                                    title="প্রতি Sub Unit এর দাম (edit করা যাবে)"
                                                                                    disabled={!(Number(item.subQty) > 0)}
                                                                                    value={item.sellPriceSub}
                                                                                    onChange={(e) => {
                                                                                        const value = e.target.value;
                                                                                        if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                                            handleReturnItemChange(item.uniqueId, 'sellPriceSub', value);
                                                                                        }
                                                                                    }}
                                                                                    className="w-20 px-2 py-2 rounded-xl border border-fuchsia-200 bg-fuchsia-50/60 text-sm outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100 disabled:bg-slate-100 disabled:border-slate-200 disabled:cursor-not-allowed"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </td>

                                                                    <td className="relative py-3 px-2">
                                                                        <div
                                                                            className={`absolute top-1 left-4 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${getPcsTotal(item) > 0 ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}
                                                                        >
                                                                            ৳{getPcsTotal(item).toFixed(2)}
                                                                        </div>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.01"
                                                                            value={item.sellPricePcs}
                                                                            disabled={!(Number(item.pcsQty) > 0)}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                                    handleReturnItemChange(item.uniqueId, 'sellPricePcs', value);
                                                                                }
                                                                            }}
                                                                            className="w-20 px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                                        />
                                                                    </td>

                                                                    <td className="py-3 px-2 font-bold text-emerald-700 whitespace-nowrap">
                                                                        {rowGrossTotal.toFixed(2)}
                                                                    </td>

                                                                    <td className="py-3 px-1 text-center">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveReturnItem(item.uniqueId)}
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
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* =================================
                           ORDER NOTE
                        ================================= */}
                        </div>
                        {/*
                        ================================= */}
                        <div className="mt-8">

                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Order Note
                            </label>

                            <textarea
                                rows="3"
                                placeholder="Write any note about this order..."
                                disabled={isDamageOnly}
                                value={orderNote}
                                onChange={(e) => setOrderNote(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-y shadow-sm"
                            />

                        </div>

                        {/* =================================
                            PAYMENT (Delivery Mode Only)
                        ================================= */}
                        {showPayment && (
                            <div className={`mt-8 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 md:p-6 ${lockCls}`}>
                                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                    <h3 className="text-base font-bold text-emerald-800">Payment</h3>

                                    <label
                                        className={`flex items-center gap-2 text-sm font-semibold ${paymentAccountType && selectedAccountKey ? 'text-emerald-700 cursor-pointer' : 'text-slate-400 cursor-not-allowed'}`}
                                        title={paymentAccountType && selectedAccountKey ? '' : 'আগে Payment Method ও Account select করুন'}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={savePaymentMethod}
                                            disabled={!(paymentAccountType && selectedAccountKey)}
                                            onChange={(e) => handleSavePaymentToggle(e.target.checked)}
                                            className="w-4 h-4 accent-emerald-600 disabled:cursor-not-allowed"
                                        />
                                        Save Payment Method
                                    </label>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

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

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Payment Method <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={paymentAccountType}
                                            onChange={(e) => {
                                                setPaymentAccountType(e.target.value);
                                                setSelectedAccountKey('');
                                                if (savePaymentMethod) {
                                                    setSavePaymentMethod(false);
                                                    persistPaymentMethod(false, '', '');
                                                }
                                            }}
                                            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm cursor-pointer"
                                        >
                                            <option value="">Select method...</option>
                                            {accountTypes.map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Account <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={selectedAccountKey}
                                            onChange={(e) => {
                                                setSelectedAccountKey(e.target.value);
                                                if (savePaymentMethod) {
                                                    persistPaymentMethod(true, paymentAccountType, e.target.value);
                                                }
                                            }}
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
                            SUBMIT / DELIVERY BUTTON
                        ================================= */}
                        <div className="mt-6 flex justify-end">

                            {isDamageOnly ? (
                                <button
                                    type="submit"
                                    className="px-10 py-3 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-sm font-semibold text-white shadow-md shadow-red-200 transition cursor-pointer"
                                >
                                    Update Damage
                                </button>
                            ) : (isDeliveryMode || (directSales && !isEditMode)) ? (
                                <button
                                    type="button"
                                    onClick={handleDeliverySubmit}
                                    className="px-10 py-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition cursor-pointer"
                                >
                                    {directSales ? 'Direct Delivery' : 'Delivery'}
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="px-10 py-3 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-sm font-semibold text-white shadow-md shadow-teal-200 transition cursor-pointer"
                                >
                                    {isReturnOnly ? 'Update Bulk Return' : isEditMode ? 'Update Order' : 'Create Order'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div >
        </div >
    );
};

export default OrderAdd;