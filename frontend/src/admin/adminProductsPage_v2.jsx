import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || import.meta.env.API_BASE_URL || "";

const categories = [
  "Living Room",
  "Bedroom",
  "Dining",
  "Office",
  "Kids",
  "Mattress",
  "Storage",
  "Decor",
  "Modular",
];

const subcategoryMap = {
  "Living Room": ["Sofas", "Coffee Tables", "TV Units", "Recliners"],
  Bedroom: ["Beds", "Wardrobes", "Nightstands", "Dressing Tables"],
  Dining: ["Dining Sets", "Dining Chairs", "Sideboards", "Bar Cabinets"],
  Office: ["Office Desks", "Office Chairs", "File Cabinets", "Workstations"],
  Kids: ["Kids Beds", "Study Tables", "Toy Storage", "Kids Chairs"],
  Mattress: ["Memory Foam", "Innerspring", "Orthopedic", "Pillow Top"],
  Storage: ["Cabinets", "Shelves", "Organizers", "Storage Benches"],
  Decor: ["Wall Shelves", "Wall Art", "Showpieces", "Rugs"],
  Modular: [
    "Modular Kitchens",
    "Modular Wardrobes",
    "Modular Cabinets",
    "Storage Modules",
  ],
};

const parsePriceOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  if (num < 0) return null;
  return num;
};

const parseStockOrNull = (value) => {
  if (value === "" || value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(num)) return null;
  if (!Number.isInteger(num)) return null;
  if (num < 0) return null;
  return num;
};

const getValidationErrors = (formData) => {
  const next = {
    name: "",
    price: "",
    stock: "",
    category: "",
    subcategory: "",
    description: "",
  };

  const name = typeof formData.name === "string" ? formData.name.trim() : "";
  const description =
    typeof formData.description === "string" ? formData.description.trim() : "";

  if (!name) next.name = "Product Name is required";

  const priceNum = parsePriceOrNull(formData.price);
  if (formData.price === "" || formData.price === null || formData.price === undefined) {
    next.price = "Price is required";
  } else if (priceNum === null) {
    next.price = "Price must be a valid non-negative number";
  }

  const stockNum = parseStockOrNull(formData.stock);
  if (formData.stock === "" || formData.stock === null || formData.stock === undefined) {
    next.stock = "Stock is required";
  } else if (stockNum === null) {
    next.stock = "Stock must be a valid non-negative integer";
  }

  if (!formData.category) next.category = "Category is required";

  const availableSubs = subcategoryMap[formData.category] || [];
  if (!formData.subcategory) next.subcategory = "Subcategory is required";
  else if (availableSubs.length > 0 && !availableSubs.includes(formData.subcategory)) {
    next.subcategory = "Please select a valid Subcategory";
  }

  if (!description) next.description = "Description is required";

  return next;
};

const hasAnyError = (errs) => Object.values(errs).some(Boolean);

const AdminProductsPage = () => {
  const { token, hasPermission } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    subcategory: "",
    description: "",
    featured: false,
  });

  const [errors, setErrors] = useState({
    name: "",
    price: "",
    stock: "",
    category: "",
    subcategory: "",
    description: "",
    images: "",
  });

  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Image upload state (for previews + FormData upload)
  const [selectedImages, setSelectedImages] = useState([]); // File[]
  const [imagePreviews, setImagePreviews] = useState([]); // string[] (object URLs)


  const availableSubcategories = useMemo(() => {
    return subcategoryMap[formData.category] || [];
  }, [formData.category]);

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, search, categoryFilter]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
      });

      const res = await fetch(`${API_BASE}/api/admin/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        setProducts(data.products || []);
        setPagination((prev) => ({ ...prev, ...data.pagination }));
      }
    } catch (err) {
      console.error("Admin products fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      stock: "",
      category: "",
      subcategory: "",
      description: "",
      featured: false,
    });
    setErrors({
      name: "",
      price: "",
      stock: "",
      category: "",
      subcategory: "",
      description: "",
      images: "",
    });

    // Revoke previews before clearing them to prevent memory leaks.
    imagePreviews.forEach((u) => URL.revokeObjectURL(u));

    setSelectedImages([]);
    setImagePreviews([]);

    setSubmitError("");
    setSubmitSuccess("");
  };


  const openEditModal = (product) => {
    setEditingProduct(product);
    setSubmitError("");
    setSubmitSuccess("");

    setFormData({
      name: product.name || "",
      price: product.price?.toString?.() ?? "",
      stock: product.stock?.toString?.() ?? "",
      category: product.category || "",
      subcategory: product.subcategory || "",
      description: product.description || "",
      featured: product.featured || false,
    });

    setErrors({
      name: "",
      price: "",
      stock: "",
      category: "",
      subcategory: "",
      description: "",
    });

    setShowModal(true);
  };

  const openAddModal = () => {
    setEditingProduct(null);
    resetForm();
    setShowModal(true);
  };

  const validate = () => {
    const next = getValidationErrors(formData);
    setErrors(next);
    return !hasAnyError(next);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    resetForm();
  };

  const handleCancel = () => {
    closeModal();
  };

  const removeImageAtIndex = (idx) => {
    setSelectedImages((prev) => {
      const next = [...prev];
      if (idx >= 0 && idx < next.length) {
        next.splice(idx, 1);
      }
      return next;
    });
    setImagePreviews((prev) => {
      const next = [...prev];
      if (idx >= 0 && idx < next.length) {
        URL.revokeObjectURL(next[idx]);
        next.splice(idx, 1);
      }
      return next;
    });
  };


  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);

    // revoke old previews
    imagePreviews.forEach((u) => URL.revokeObjectURL(u));

    setErrors((prev) => ({ ...prev, images: "" }));

    setSelectedImages(files);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };


  useEffect(() => {
    return () => {
      imagePreviews.forEach((u) => URL.revokeObjectURL(u));
    };
    // Intentionally depend on imagePreviews so we also revoke on preview replacements.
  }, [imagePreviews]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!validate()) return;

    if (!editingProduct && selectedImages.length === 0) {
      setErrors((prev) => ({ ...prev, images: "Please select at least one image" }));
      setSubmitError("Please select at least one product image.");
      return;
    }

    const priceNum = parsePriceOrNull(formData.price);
    const stockNum = parseStockOrNull(formData.stock);

    const form = new FormData();
    form.append("name", formData.name.trim());
    form.append("price", priceNum);
    form.append("stock", stockNum);
    form.append("category", formData.category);
    form.append("subcategory", formData.subcategory);
    form.append("description", formData.description.trim());
    form.append("featured", formData.featured ? "true" : "false");

    // IMPORTANT: backend expects multipart/form-data.
    selectedImages.forEach((file) => {
      form.append("images", file);
    });

    setSaving(true);
    try {
      const url = editingProduct
        ? `${API_BASE}/api/admin/products/${editingProduct._id}`
        : `${API_BASE}/api/admin/products`;


      const res = await fetch(url, {
        method: editingProduct ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          // Do NOT set Content-Type here; browser will add proper boundary for multipart.
        },
        body: form,
      });

      const data = await res.json();

      if (!data.success) {
        setSubmitError(
          data.message || "Failed to create product (upload images + details)"
        );
        return;
      }

      setSubmitSuccess(
        editingProduct
          ? "Product updated successfully"
          : "Product created successfully with images"
      );

      setShowModal(false);
      setEditingProduct(null);
      setSelectedImages([]);
      setImagePreviews([]);
      resetForm();
      fetchProducts();
    } catch (err) {
      console.error("Product save error:", err);
      setSubmitError("Failed to create product, check server logs");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) fetchProducts();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Products</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your product inventory</p>
        </div>
        {hasPermission("products:create") && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-neutral-900 text-white rounded-lg hover:bg-[#2b1b0e] transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500 border-t-transparent mx-auto"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {products.length > 0 ? (
                  products.map((product) => (
                    <tr key={product._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{product.name}</p>
                            <p className="text-xs text-slate-500">{product.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{product.category}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">₹{product.price?.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            product.stock > 10
                              ? "bg-green-100 text-green-800"
                              : product.stock > 0
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.stock} in stock
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {product.featured && (
                            <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded">Featured</span>
                          )}
                          {!product.isActive && (
                            <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-600 rounded">Inactive</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {hasPermission("products:update") && (
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-2 text-slate-500 hover:text-amber-500 hover:bg-slate-100 rounded-lg"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            </button>
                          )}
                          {hasPermission("products:delete") && (
                            <button
                              onClick={() => handleDelete(product._id)}
                              className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-100 rounded-lg"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      No products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {(pagination.page - 1) * pagination.limit + 1} to
              {" "}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                {editingProduct ? "Edit Product" : "Add Product"}
              </h2>
              <button
                type="button"
                onClick={handleCancel}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 pb-28"> 

              <div className="h-0" />

              <div className="h-0" />

              <div className="flex justify-end gap-3 pt-2 mt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-[#2b1b0e] transition shadow-lg hover:shadow-xl disabled:opacity-60 disabled:hover:shadow-lg"
                >
                  {saving ? "Saving..." : editingProduct ? "Update" : "Create"}
                </button>
              </div>

              <div className="h-24" />


              {submitError && (
                <div className="rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
                  {submitError}
                </div>
              )}

              {submitSuccess && (
                <div className="rounded-lg border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm">
                  {submitSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 ${
                    errors.name ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Price (₹)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formData.price}
                    onChange={(e) => setFormData((p) => ({ ...p, price: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 ${
                      errors.price ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                    }`}
                    min={0}
                    step="any"
                    required
                  />
                  {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={formData.stock}
                    onChange={(e) => setFormData((p) => ({ ...p, stock: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 ${
                      errors.stock ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                    }`}
                    min={0}
                    step={1}
                    required
                  />
                  {errors.stock && <p className="mt-1 text-xs text-red-600">{errors.stock}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const nextCategory = e.target.value;
                      setFormData((p) => ({
                        ...p,
                        category: nextCategory,
                        subcategory: "",
                      }));
                    }}
                    className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 ${
                      errors.category ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                    }`}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subcategory
                  </label>
                  <select
                    value={formData.subcategory}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, subcategory: e.target.value }))
                    }
                    className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 ${
                      errors.subcategory ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                    }`}
                    required
                    disabled={!formData.category}
                  >
                    <option value="">Select Subcategory</option>
                    {availableSubcategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                  {errors.subcategory && (
                    <p className="mt-1 text-xs text-red-600">{errors.subcategory}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Product Images
                </label>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImagesChange}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />

                {errors.images && (
                  <p className="mt-1 text-xs text-red-600">{errors.images}</p>
                )}

                {imagePreviews.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      Preview
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {imagePreviews.map((url, idx) => (
                        <div key={url} className="relative">
                          <img
                            src={url}
                            alt={`Selected ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                          />
                          <button
                            type="button"
                            onClick={() => removeImageAtIndex(idx)}
                            className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-neutral-900 text-white flex items-center justify-center text-sm shadow hover:bg-[#2b1b0e]"
                            aria-label="Remove image"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, description: e.target.value }))
                  }
                  rows={3}
                  className={`w-full px-4 py-2 rounded-lg border bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 ${
                    errors.description ? "border-red-400" : "border-slate-200 dark:border-slate-700"
                  }`}
                  required
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-red-600">{errors.description}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="featured"
                  checked={!!formData.featured}
                  onChange={(e) => setFormData((p) => ({ ...p, featured: e.target.checked }))}
                  className="w-5 h-5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <label htmlFor="featured" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Featured Product
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-5 py-2.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-neutral-900 text-white rounded-xl hover:bg-[#2b1b0e] transition shadow-lg hover:shadow-xl disabled:opacity-60 disabled:hover:shadow-lg"
                >
                  {saving ? "Saving..." : editingProduct ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProductsPage;

