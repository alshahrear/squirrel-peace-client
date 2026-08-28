import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { FaBox, FaBuilding, FaBarcode, FaTags, FaExclamationTriangle, FaDollarSign, FaBalanceScale, FaGift, FaWarehouse, FaStickyNote, FaTimes, FaEdit, FaSave } from 'react-icons/fa';

const ProductForm = ({ formData, setFormData, editingId, setEditingId, fetchProducts }) => {
    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);

    useEffect(() => {
        // Company Fetch
        fetch('http://localhost:5000/company')
            .then(res => res.json())
            .then(data => setCompanies(data))
            .catch(err => console.error('Error fetching companies:', err));

        // Category Fetch
        fetch('http://localhost:5000/category')
            .then(res => res.json())
            .then(data => {
                const activeCategories = data.filter(cat => cat.isActive === true);
                setCategories(activeCategories);
            })
            .catch(err => console.error('Error fetching categories:', err));

        // Unit Fetch
        fetch('http://localhost:5000/unit')
            .then(res => res.json())
            .then(data => {
                const activeUnits = data.filter(u => u.isActive === true);
                setUnits(activeUnits);
            })
            .catch(err => console.error('Error fetching units:', err));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ 
            ...formData, 
            [name]: type === 'checkbox' ? checked : value 
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            productName: '',
            company: '',
            sku: '',
            category: '',
            alertQuantity: '',
            purchasePrice: '',
            sellingPrice: '',
            mrp: '',
            unit: '',
            pcsOfUnit: '',
            freeProductQty: '',
            freeProductName: '',
            openingStockQty: '',
            note: '',
            isActive: true,
            createdAt: ''
        });
    };

    const getFormattedDateTime = () => {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12;
        const strTime = `${hours}:${minutes}:${seconds} ${ampm}`;
        return `${day}/${month}/${year}, ${strTime}`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const isEditing = Boolean(editingId);

        Swal.fire({
            title: 'Are you sure?',
            text: isEditing ? "Do you want to update this product?" : "Do you want to add this product to inventory?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#7c3aed',
            cancelButtonColor: '#d33',
            confirmButtonText: isEditing ? 'Yes, Update!' : 'Yes, Add Product!',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const finalData = {
                    ...formData,
                    createdAt: formData.createdAt || getFormattedDateTime()
                };

                try {
                    let response;
                    if (isEditing) {
                        response = await fetch(`http://localhost:5000/product/${editingId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(finalData),
                        });
                    } else {
                        response = await fetch('http://localhost:5000/product', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(finalData),
                        });
                    }

                    const data = await response.json();
                    if (data.insertedId || data.modifiedCount > 0) {
                        const Toast = Swal.mixin({
                            toast: true,
                            position: 'top-end',
                            showConfirmButton: false,
                            timer: 3000,
                            timerProgressBar: true,
                        });

                        Toast.fire({
                            icon: 'success',
                            title: isEditing ? 'Product updated successfully!' : 'Product added successfully!'
                        });

                        handleCancelEdit();
                        if (fetchProducts) fetchProducts();
                    }
                } catch (error) {
                    console.error('Error saving product:', error);
                    Swal.fire('Error!', 'Failed to save product.', 'error');
                }
            }
        });
    };

    return (
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-8 border border-indigo-100 backdrop-blur-sm transition-all duration-300">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {editingId ? <span className="text-indigo-600 flex items-center gap-2"><FaEdit /> Edit Product</span> : <span className="text-indigo-600 flex items-center gap-2"><FaSave /> Add New Product</span>}
                </h2>
                {editingId && (
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full transition-all"
                    >
                        <FaTimes /> Cancel Edit
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Product Name */}
                    <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaBox className="text-indigo-500" /> Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="productName"
                            placeholder="Enter product name"
                            value={formData.productName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        />
                    </div>

                    {/* Company */}
                    <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaBuilding className="text-indigo-500" /> Company <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        >
                            <option value="">Select Company</option>
                            {companies.map((comp) => (
                                <option key={comp._id} value={comp.businessName}>
                                    {comp.businessName}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* SKU */}
                    <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaBarcode className="text-indigo-500" /> SKU
                        </label>
                        <input
                            type="text"
                            name="sku"
                            placeholder="SKU code"
                            value={formData.sku}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaTags className="text-indigo-500" /> Category
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        >
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                                <option key={cat._id} value={cat.name}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Alert Quantity */}
                    <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaExclamationTriangle className="text-indigo-500" /> Alert Quantity
                        </label>
                        <input
                            type="number"
                            name="alertQuantity"
                            placeholder="0"
                            value={formData.alertQuantity}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        />
                    </div>

                    {/* Purchase Price */}
                    <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaDollarSign className="text-indigo-500" /> Purchase Price
                        </label>
                        <input
                            type="number"
                            step="any"
                            name="purchasePrice"
                            placeholder="0.00"
                            value={formData.purchasePrice}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        />
                    </div>

                    {/* Selling Price */}
                    <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaDollarSign className="text-indigo-500" /> Selling Price
                        </label>
                        <input
                            type="number"
                            step="any"
                            name="sellingPrice"
                            placeholder="0.00"
                            value={formData.sellingPrice}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        />
                    </div>

                    {/* MRP */}
                    <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaDollarSign className="text-indigo-500" /> MRP
                        </label>
                        <input
                            type="number"
                            step="any"
                            name="mrp"
                            placeholder="0.00"
                            value={formData.mrp}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        />
                    </div>
                </div>

                {/* Unit & Stock Configuration */}
                <div className="pt-2">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-purple-600 rounded-full inline-block"></span>
                        Unit & Stock Configuration
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {/* Unit */}
                        <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                                <FaBalanceScale className="text-indigo-500" /> Unit <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                            >
                                <option value="">Select Unit</option>
                                {units.map((u) => (
                                    <option key={u._id} value={u.name}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* PCS of 1 Unit */}
                        <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                                <FaBalanceScale className="text-indigo-500" /> PCS of 1 Unit <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="pcsOfUnit"
                                placeholder="e.g. 10"
                                value={formData.pcsOfUnit}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                            />
                        </div>

                        {/* Free Product Qty */}
                        <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                                <FaGift className="text-indigo-500" /> Free Product Qty
                            </label>
                            <input
                                type="number"
                                name="freeProductQty"
                                placeholder="0"
                                value={formData.freeProductQty}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                            />
                        </div>

                        {/* Free Product Name */}
                        <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                                <FaGift className="text-indigo-500" /> Free Product Name
                            </label>
                            <input
                                type="text"
                                name="freeProductName"
                                placeholder="Free item name"
                                value={formData.freeProductName}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                            />
                        </div>

                        {/* Opening Stock Qty */}
                        <div>
                            <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                                <FaWarehouse className="text-indigo-500" /> Opening Stock Qty (PCS)
                            </label>
                            <input
                                type="number"
                                name="openingStockQty"
                                placeholder="Initial stock"
                                value={formData.openingStockQty}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Note & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaStickyNote className="text-indigo-500" /> Note
                        </label>
                        <input
                            type="text"
                            name="note"
                            placeholder="Write additional notes here..."
                            value={formData.note}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        />
                    </div>

                    <div className="flex items-center justify-between px-3 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-lg h-[38px]">
                        <div>
                            <span className="text-xs font-semibold text-gray-700 block">Product Status</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                name="isActive"
                                checked={formData.isActive} 
                                onChange={handleChange}
                                className="sr-only peer" 
                            />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                            <span className="ml-2 text-xs font-bold text-gray-700 w-12">
                                {formData.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        className={`px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all transform hover:-translate-y-0.5 ${
                            editingId
                                ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200'
                                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200'
                        }`}
                    >
                        {editingId ? 'Update Product Details' : 'Submit Product'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;