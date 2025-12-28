import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../auth/AuthContext";

export default function Catalog() {
  const { token, logout, isManager, isSales, isLoading: roleLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    console.log("Catalog component mounted");
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [open, setOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Product detail view state
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [productImages, setProductImages] = useState([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    product_name: "",
    price: "",
    discount: "",
    min_order_qty: "",
    category: "",
  });

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return Array.from(cats).sort();
  }, [products]);

  useEffect(() => {
    fetchProducts();
  }, [token, isManager, isSales]);

  const fetchProducts = async () => {
    if (!token) return;
    
    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);
    try {
      let endpoint = null;
      if (isManager) {
        endpoint = `${base}/manager/products`;
      } else if (isSales) {
        endpoint = `${base}/sales/products`;
      }

      if (!endpoint) {
        setProducts([]);
        setLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.status === 401) {
        // Token expired or invalid - redirect to login
        logout();
        window.location.href = "/login";
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to fetch products:", response.status, errorData);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      if (err instanceof TypeError && err.message.includes("fetch")) {
        console.error("Network error - is the backend running on", base, "?");
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (statusFilter === "active") {
      filtered = filtered.filter((p) => p.is_active === true);
    } else if (statusFilter === "archived") {
      filtered = filtered.filter((p) => p.is_active === false);
    }

    if (categoryFilter) {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (p) =>
          p.product_name?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, statusFilter, categoryFilter, searchQuery]);

  const paginatedProducts = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredProducts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredProducts, page, rowsPerPage]);

  useEffect(() => {
    setPage(0);
  }, [statusFilter, categoryFilter, searchQuery]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenMenu = (event, product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({
      product_name: "",
      price: "",
      discount: "",
      min_order_qty: "",
      category: "",
    });
    setError("");
    setOpen(true);
  };

  const handleEdit = async () => {
    if (!selectedProduct) return;
    
    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);
    try {
      const detailEndpoint = isManager
        ? `${base}/manager/product/${selectedProduct.product_id}`
        : isSales
        ? `${base}/sales/product/${selectedProduct.product_id}`
        : null;

      if (!detailEndpoint) {
        setError("No permission to view product details");
        setLoading(false);
        return;
      }

      const response = await fetch(detailEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch product details");
      }

      const product = await response.json();
      setEditingProduct(product);
      setFormData({
        product_name: product.product_name || "",
        price: product.price?.toString() || "",
        discount: product.discount?.toString() || "",
        min_order_qty: product.min_order_qty?.toString() || "",
        category: product.category || "",
      });
      setError("");
      setOpen(true);
      handleCloseMenu();
    } catch (err) {
      setError(err?.message || "Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async () => {
    if (!selectedProduct) return;
    setEditingProduct(null);
    setFormData({
      product_name: `${selectedProduct.product_name} (Copy)`,
      price: selectedProduct.price?.toString() || "",
      discount: selectedProduct.discount?.toString() || "",
      min_order_qty: selectedProduct.min_order_qty?.toString() || "",
      category: selectedProduct.category || "",
    });
    setError("");
    setOpen(true);
    handleCloseMenu();
  };

  const handleViewDetails = async () => {
    if (!selectedProduct) return;
    
    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);
    try {
      // Fetch product details - use appropriate endpoint based on role
      const productEndpoint = isManager
        ? `${base}/manager/product/${selectedProduct.product_id}`
        : isSales
        ? `${base}/sales/product/${selectedProduct.product_id}`
        : null;

      if (!productEndpoint) {
        throw new Error("No access to product details");
      }

      const productResponse = await fetch(productEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!productResponse.ok) {
        throw new Error("Failed to fetch product details");
      }

      const product = await productResponse.json();
      setDetailProduct(product);

      // Fetch product images using manager endpoint
      try {
        let imagesResponse;
        
        const imagesEndpoint = isManager
          ? `${base}/manager/product/${selectedProduct.product_id}/productimages`
          : isSales
          ? `${base}/sales/product/${selectedProduct.product_id}/productimages`
          : null;

        if (imagesEndpoint) {
          try {
            imagesResponse = await fetch(imagesEndpoint, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          } catch (err) {
            imagesResponse = null;
          }
        }

        if (imagesResponse?.ok) {
          const images = await imagesResponse.json();
          console.log("Fetched product images:", images);
          // Filter out archived images
          const activeImages = images.filter(img => !img.is_archived);
          console.log("Active images after filtering:", activeImages);
          setProductImages(activeImages);
        } else if (imagesResponse?.status === 403) {
          // 403 Forbidden - manager trying to access customer endpoint
          console.warn("Manager endpoint for product images not available. Please ask backend to add: @manager.get('/product_image/{product_id}')");
          setProductImages([]);
        } else if (imagesResponse) {
          console.error("Failed to fetch images, status:", imagesResponse.status);
          const errorText = await imagesResponse.text().catch(() => "");
          console.error("Error response:", errorText);
          setProductImages([]);
        } else {
          setProductImages([]);
        }
      } catch (err) {
        console.error("Failed to fetch images:", err);
        setProductImages([]);
      }

      setDetailOpen(true);
      handleCloseMenu();
    } catch (err) {
      setError(err?.message || "Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!isManager) {
      setError("Only managers can upload images");
      return;
    }
    if (!detailProduct || !file) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setUploadingImage(true);
    setError("");

    try {
      // Step 1: Upload file to Yandex
      const formData = new FormData();
      formData.append("file", file);

      const uploadResponse = await fetch(`${base}/yandex/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to upload image");
      }

      const uploadResult = await uploadResponse.json();
      console.log("Upload result:", uploadResult);
      
      // Step 2: Construct image URL
      // TODO: Ask your teammate for the exact public URL pattern for Yandex S3
      // For now, trying different possible patterns - you'll need to update this
      // Option 1: Direct S3 URL (if bucket is public)
      // Option 2: Use download endpoint
      // Option 3: Get public URL from backend
      
      // Try using the download endpoint URL instead of direct S3 URL
      const imageUrl = `${base}/yandex/download_file/${uploadResult.filename}`;
      console.log("Using image URL:", imageUrl);
      
      // Step 3: Create product image record
      const createImageResponse = await fetch(`${base}/manager/product_image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: detailProduct.product_id,
          image_url: imageUrl,
        }),
      });

      if (!createImageResponse.ok) {
        const errorData = await createImageResponse.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to create image record");
      }

      // Refresh images - use manager endpoint
      let imagesResponse;
      try {
        imagesResponse = await fetch(`${base}/manager/product/${detailProduct.product_id}/productimages`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        // Fallback to customer endpoint if manager endpoint fails
        imagesResponse = await fetch(`${base}/customer/product_image/${detailProduct.product_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (imagesResponse.ok) {
        const images = await imagesResponse.json();
        console.log("Images after upload:", images);
        const activeImages = images.filter(img => !img.is_archived);
        console.log("Active images after upload:", activeImages);
        setProductImages(activeImages);
      } else if (imagesResponse.status === 403) {
        console.warn("Cannot refresh images - manager endpoint needed");
      } else {
        console.error("Failed to refresh images after upload");
      }

      setSuccess(true);
    } catch (err) {
      setError(err?.message || "Failed to upload image");
      console.error("Image upload error:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!isManager) {
      setError("Only managers can delete images");
      return;
    }
    if (!detailProduct) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${base}/manager/delete_image/${imageId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete image");
      }

      // Refresh images - use manager endpoint
      let imagesResponse;
      try {
        imagesResponse = await fetch(`${base}/manager/product/${detailProduct.product_id}/productimages`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (err) {
        // Fallback to customer endpoint if manager endpoint fails
        imagesResponse = await fetch(`${base}/customer/product_image/${detailProduct.product_id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (imagesResponse.ok) {
        const images = await imagesResponse.json();
        setProductImages(images.filter(img => !img.is_archived));
      } else if (imagesResponse.status === 403) {
        console.warn("Cannot refresh images - manager endpoint needed");
      }

      setSuccess(true);
    } catch (err) {
      setError(err?.message || "Failed to delete image");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedProduct) return;
    
    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    try {
      const response = await fetch(`${base}/manager/product/${selectedProduct.product_id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          is_active: !selectedProduct.is_active,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.detail || "Failed to update product");
      }

      await fetchProducts();
      setSuccess(true);
      handleCloseMenu();
    } catch (err) {
      setError(err?.message || "Failed to update product status");
    }
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
      setEditingProduct(null);
      setFormData({
        product_name: "",
        price: "",
        discount: "",
        min_order_qty: "",
        category: "",
      });
      setError("");
    }
  };

  const validateForm = () => {
    const price = parseFloat(formData.price);
    const discount = parseInt(formData.discount);
    const minOrderQty = parseInt(formData.min_order_qty);

    if (!formData.product_name.trim()) {
      setError("Product name is required");
      return false;
    }
    if (isNaN(price) || price < 0) {
      setError("Price must be a number ≥ 0");
      return false;
    }
    if (isNaN(discount) || discount < 0 || discount > 100) {
      setError("Discount must be between 0 and 100");
      return false;
    }
    if (isNaN(minOrderQty) || minOrderQty < 1) {
      setError("Min order quantity must be ≥ 1");
      return false;
    }
    if (!formData.category.trim()) {
      setError("Category is required");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);

    try {
      const payload = {
        product_name: formData.product_name.trim(),
        price: parseFloat(formData.price),
        discount: parseInt(formData.discount),
        min_order_qty: parseInt(formData.min_order_qty),
        category: formData.category.trim(),
        unit: "pcs", // Default unit - can be made configurable later
        quantity: 0, // Default quantity - can be made configurable later
      };

      const url = editingProduct 
        ? `${base}/manager/product/${editingProduct.product_id}`
        : `${base}/manager/product`;
      
      console.log("Making request to:", url);
      console.log("Payload:", payload);
      
      let response;
      try {
        response = await fetch(url, {
          method: editingProduct ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });
        console.log("Response status:", response.status);
      } catch (fetchError) {
        console.error("Fetch error:", fetchError);
        throw fetchError;
      }

      if (!response.ok) {
        let errorMessage = editingProduct ? "Failed to update product" : "Failed to create product";
        try {
          const errorData = await response.json();
          // FastAPI validation errors can be an array of error objects
          if (Array.isArray(errorData?.detail)) {
            errorMessage = errorData.detail.map(err => 
              `${err.loc?.join('.') || 'field'}: ${err.msg || 'Invalid value'}`
            ).join(', ');
          } else if (typeof errorData?.detail === 'string') {
            errorMessage = errorData.detail;
          } else if (errorData?.detail) {
            errorMessage = JSON.stringify(errorData.detail);
          }
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      setSuccess(true);
      await fetchProducts();
      handleClose();
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError("Network error: Unable to connect to server. Please check if the backend is running.");
      } else {
        setError(err?.message || "An error occurred");
      }
      console.error("Product save error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Please log in to view the catalog.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Paper
        elevation={2}
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          p: 3,
          borderRadius: 2,
          backgroundColor: "background.paper",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Catalog
            </Typography>
            {isManager && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{
                  py: 1.2,
                  px: 3,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Add Product
              </Button>
            )}
          </Box>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <TextField
              placeholder="Search by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              sx={{
                flexGrow: 1,
                minWidth: 250,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 3,
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="">All</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: 3 }}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ mt: 2 }}>
        {loading && !products.length ? (
          <Typography color="text.secondary">Loading products...</Typography>
        ) : filteredProducts.length > 0 ? (
          <TableContainer component={Paper} elevation={1}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Price</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Discount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Min Order Qty</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedProducts.map((product) => (
                  <TableRow key={product.product_id} hover>
                    <TableCell>{product.product_name}</TableCell>
                    <TableCell>{product.price?.toFixed(2) || "0.00"} ₸</TableCell>
                    <TableCell>{product.discount}%</TableCell>
                    <TableCell>{product.min_order_qty}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>
                      <Chip
                        label={product.is_active ? "Active" : "Archived"}
                        size="small"
                        color={product.is_active ? "success" : "default"}
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={(e) => handleOpenMenu(e, product)}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredProducts.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50]}
            />
          </TableContainer>
        ) : (
          <Paper
            sx={{
              p: 6,
              textAlign: "center",
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No products yet
            </Typography>
            {isManager && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                size="large"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                Add Product
              </Button>
            )}
          </Paper>
        )}
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleViewDetails}>
          <VisibilityIcon sx={{ mr: 1, fontSize: 20 }} />
          View Details
        </MenuItem>
        {isManager && (
          <MenuItem onClick={handleEdit}>
            <EditIcon sx={{ mr: 1, fontSize: 20 }} />
            Edit
          </MenuItem>
        )}
        {isManager && (
          <MenuItem onClick={handleToggleStatus}>
            {selectedProduct?.is_active ? (
              <>
                <BlockIcon sx={{ mr: 1, fontSize: 20 }} />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircleIcon sx={{ mr: 1, fontSize: 20 }} />
                Reactivate
              </>
            )}
          </MenuItem>
        )}
        {isManager && (
          <MenuItem onClick={handleDuplicate}>
            <ContentCopyIcon sx={{ mr: 1, fontSize: 20 }} />
            Duplicate
          </MenuItem>
        )}
      </Menu>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
          {editingProduct ? "Edit Product" : "Add Product"}
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            <TextField
              label="Product Name"
              value={formData.product_name}
              onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
              fullWidth
              required
              disabled={loading}
            />

            <TextField
              label="Price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 0, step: 0.01 }}
              disabled={loading}
              InputProps={{
                endAdornment: <InputAdornment position="end">₸</InputAdornment>,
              }}
            />

            <TextField
              label="Discount (%)"
              type="number"
              value={formData.discount}
              onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 0, max: 100 }}
              disabled={loading}
            />

            <TextField
              label="Min Order Quantity"
              type="number"
              value={formData.min_order_qty}
              onChange={(e) => setFormData({ ...formData, min_order_qty: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 1 }}
              disabled={loading}
            />

            <TextField
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              fullWidth
              required
              disabled={loading}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              {loading ? "Saving..." : editingProduct ? "Update" : "Create"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Product Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, fontWeight: 600 }}>
          {detailProduct?.product_name || "Product Details"}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {detailProduct && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Product Information */}
              <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Product Information
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Price</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {detailProduct.price?.toFixed(2) || "0.00"} ₸
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Discount</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {detailProduct.discount}%
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Min Order Qty</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {detailProduct.min_order_qty}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Category</Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {detailProduct.category}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Chip
                      label={detailProduct.is_active ? "Active" : "Archived"}
                      size="small"
                      color={detailProduct.is_active ? "success" : "default"}
                    />
                  </Box>
                </Box>
              </Paper>

              {/* Product Images */}
              <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Product Images
                  </Typography>
                  {isManager && (
                    <Box>
                      <input
                        accept="image/*"
                        style={{ display: "none" }}
                        id="image-upload-input"
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            handleImageUpload(file);
                          }
                          e.target.value = ""; // Reset input
                        }}
                        disabled={uploadingImage}
                      />
                      <label htmlFor="image-upload-input">
                        <Button
                          variant="outlined"
                          component="span"
                          size="small"
                          startIcon={<CloudUploadIcon />}
                          disabled={uploadingImage}
                        >
                          {uploadingImage ? "Uploading..." : "Upload Image"}
                        </Button>
                      </label>
                    </Box>
                  )}
                </Box>

                {productImages.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 4 }}>
                    No images available
                  </Typography>
                ) : (
                  <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 2 }}>
                    {productImages.map((image) => (
                      <Box
                        key={image.productimage_id}
                        sx={{
                          position: "relative",
                          borderRadius: 2,
                          overflow: "hidden",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        <img
                          src={image.image_url}
                          alt={`Product ${detailProduct.product_id}`}
                          style={{
                            width: "100%",
                            height: "auto",
                            minHeight: 200,
                            maxHeight: 400,
                            objectFit: "contain",
                            display: "block",
                            backgroundColor: "#f5f5f5",
                          }}
                          onError={(e) => {
                            console.error("Image failed to load:", image.image_url);
                            e.target.src = "https://via.placeholder.com/200?text=Image+Not+Found";
                          }}
                          onLoad={() => {
                            console.log("Image loaded successfully:", image.image_url);
                          }}
                        />
                        {isManager && (
                          <IconButton
                            size="small"
                            color="error"
                            sx={{
                              position: "absolute",
                              top: 8,
                              right: 8,
                              bgcolor: "rgba(255, 255, 255, 0.9)",
                              "&:hover": { bgcolor: "rgba(255, 255, 255, 1)" },
                            }}
                            onClick={() => handleDeleteImage(image.productimage_id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button onClick={() => setDetailOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={success}
        autoHideDuration={3000}
        onClose={() => setSuccess(false)}
        message="Product saved."
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      />
    </Box>
  );
}
