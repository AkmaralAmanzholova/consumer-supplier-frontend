import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemText,
  Alert,
  CircularProgress,
  Toolbar,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import ChatIcon from "@mui/icons-material/Chat";
import ChatPanel from "../components/ChatPanel";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, parseISO, isAfter, isBefore } from "date-fns";
import { useAuth } from "../auth/AuthContext";

export default function Orders() {
  const { token, user, logout, isSales } = useAuth();
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [consumerFilter, setConsumerFilter] = useState("all");
  const [hasComplaintOnly, setHasComplaintOnly] = useState(false);

  // Selection and details
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [orderComplaints, setOrderComplaints] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatConsumerId, setChatConsumerId] = useState(null);
  const [chatConsumerName, setChatConsumerName] = useState("");

  const isManager = user?.role === "supplier";

  useEffect(() => {
    if (token) {
      fetchOrders();
      fetchComplaints();
    }
  }, [token]);

  const fetchOrders = async () => {
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);
    setError("");

    try {
      const endpoint = isManager
        ? `${base}/manager/orders`
        : isSales
        ? `${base}/sales/orders`
        : null;
      
      if (!endpoint) {
        setError("You don't have access to view orders");
        setLoading(false);
        return;
      }

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        logout();
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.detail || `Failed to fetch orders: ${response.status}`);
      }

             const data = await response.json();
             const ordersArray = Array.isArray(data) ? data : [];
             setOrders(ordersArray);
             console.log("Orders loaded:", ordersArray.length, ordersArray);
           } catch (err) {
             setError(err?.message || "Failed to load orders");
             console.error("Error fetching orders:", err);
           } finally {
             setLoading(false);
           }
         };

  const fetchComplaints = async () => {
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";

    try {
      const endpoint = isManager
        ? `${base}/manager/complaints`
        : `${base}/sales/complaints`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComplaints(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching complaints:", err);
    }
  };

  const fetchOrderDetails = async (orderId) => {
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";

    try {
      // Try to fetch order items - if endpoint doesn't exist, use empty array
      try {
        const itemsResponse = await fetch(`${base}/manager/order/${orderId}/items`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          setOrderItems(Array.isArray(itemsData) ? itemsData : []);
        } else {
          // If endpoint doesn't exist, check if items are in the order object
          const order = orders.find((o) => o.order_id === orderId);
          setOrderItems(order?.order_items || []);
        }
      } catch (err) {
        // Fallback: use items from order object if available
        const order = orders.find((o) => o.order_id === orderId);
        setOrderItems(order?.order_items || []);
      }

      // Get complaints for this order
      const orderComplaintsList = complaints.filter(
        (c) => c.order_id === orderId
      );
      setOrderComplaints(orderComplaintsList);
    } catch (err) {
      console.error("Error fetching order details:", err);
      setOrderItems([]);
    }
  };

  const handleViewOrder = async (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
    await fetchOrderDetails(order.order_id);
  };

  const handleAcceptOrder = async (orderId) => {
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${base}/manager/order/accept/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.detail || "Failed to accept order");
      }

      setSuccess("Order accepted successfully");
      await fetchOrders();
      setDetailsOpen(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.message || "Failed to accept order");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectOrder = async (orderId) => {
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${base}/manager/order/reject/${orderId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.detail || "Failed to reject order");
      }

      setSuccess("Order rejected successfully");
      await fetchOrders();
      setDetailsOpen(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.message || "Failed to reject order");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAccept = async () => {
    for (const orderId of selectedOrders) {
      await handleAcceptOrder(orderId);
    }
    setSelectedOrders(new Set());
  };

  const handleBulkReject = async () => {
    for (const orderId of selectedOrders) {
      await handleRejectOrder(orderId);
    }
    setSelectedOrders(new Set());
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      const allIds = new Set(filteredOrders.map((o) => o.order_id));
      setSelectedOrders(allIds);
    } else {
      setSelectedOrders(new Set());
    }
  };

  const handleSelectOrder = (orderId) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId);
    } else {
      newSelected.add(orderId);
    }
    setSelectedOrders(newSelected);
  };


  // Get unique consumers for filter
  const consumers = useMemo(() => {
    const consumerSet = new Set();
    orders.forEach((order) => {
      if (order.consumer) {
        const name = `${order.consumer.first_name || ""} ${order.consumer.last_name || ""}`.trim();
        if (name) consumerSet.add(name);
      }
    });
    return Array.from(consumerSet).sort();
  }, [orders]);

  // Get complaints count per order
  const getComplaintsCount = (orderId) => {
    return complaints.filter((c) => c.order_id === orderId && !c.is_resolved).length;
  };

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (o) =>
          o.order_id?.toString().includes(query) ||
          o.consumer?.first_name?.toLowerCase().includes(query) ||
          o.consumer?.last_name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      const statusMap = {
        new: "PENDING",
        pending: "PENDING",
        accepted: "APPROVED",
        rejected: "REJECTED",
        "in progress": "APPROVED",
        completed: "APPROVED",
        cancelled: "REJECTED",
      };
      filtered = filtered.filter((o) => o.status === statusMap[statusFilter]);
    }

    // Date filter
    if (fromDate) {
      filtered = filtered.filter((o) => {
        if (!o.created_at) return true;
        const orderDate = parseISO(o.created_at);
        return !isBefore(orderDate, fromDate);
      });
    }
    if (toDate) {
      filtered = filtered.filter((o) => {
        if (!o.created_at) return true;
        const orderDate = parseISO(o.created_at);
        return !isAfter(orderDate, toDate);
      });
    }

    // Consumer filter
    if (consumerFilter !== "all") {
      filtered = filtered.filter((o) => {
        const name = `${o.consumer?.first_name || ""} ${o.consumer?.last_name || ""}`.trim();
        return name === consumerFilter;
      });
    }

    // Has complaint only
    if (hasComplaintOnly) {
      filtered = filtered.filter((o) => getComplaintsCount(o.order_id) > 0);
    }

    return filtered;
  }, [orders, searchQuery, statusFilter, fromDate, toDate, consumerFilter, hasComplaintOnly, complaints]);

  const getStatusColor = (status) => {
    const colors = {
      PENDING: "warning",
      APPROVED: "success",
      REJECTED: "error",
    };
    return colors[status] || "default";
  };

  const getStatusLabel = (status) => {
    const labels = {
      PENDING: "Pending",
      APPROVED: "Accepted",
      REJECTED: "Rejected",
    };
    return labels[status] || status;
  };

  const getStatusBgColor = (status) => {
    const colors = {
      PENDING: "#dbeafe", // soft blue
      APPROVED: "#d1fae5", // soft green
      REJECTED: "#fee2e2", // soft red
    };
    return colors[status] || "#f3f4f6";
  };

  const getStatusTextColor = (status) => {
    const colors = {
      PENDING: "#1e40af", // blue
      APPROVED: "#065f46", // green
      REJECTED: "#991b1b", // red
    };
    return colors[status] || "#374151";
  };

  // Calculate order total
  const calculateOrderTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {/* Alerts */}
        {error && (
          <Alert severity="error" onClose={() => setError("")}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" onClose={() => setSuccess("")}>
            {success}
          </Alert>
        )}

        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Orders
          </Typography>
        </Box>

        {/* Filters */}
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
                lg: "repeat(5, 1fr)",
              },
              gap: 2,
            }}
          >
            <TextField
              placeholder="Search by Order ID or consumer…"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                gridColumn: { xs: "1", md: "span 2" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="new">New</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="accepted">Accepted</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
                <MenuItem value="in progress">In progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>

            <DatePicker
              label="From date"
              value={fromDate}
              onChange={(newValue) => setFromDate(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  sx: {
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  },
                },
              }}
            />

            <DatePicker
              label="To date"
              value={toDate}
              onChange={(newValue) => setToDate(newValue)}
              slotProps={{
                textField: {
                  size: "small",
                  fullWidth: true,
                  sx: {
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 2,
                    },
                  },
                },
              }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Consumer</InputLabel>
              <Select
                value={consumerFilter}
                label="Consumer"
                onChange={(e) => setConsumerFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All</MenuItem>
                {consumers.map((consumer) => (
                  <MenuItem key={consumer} value={consumer}>
                    {consumer}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mt: 2 }}>
            <FormControl>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Checkbox
                  checked={hasComplaintOnly}
                  onChange={(e) => setHasComplaintOnly(e.target.checked)}
                />
                <Typography variant="body2">Has complaint only</Typography>
              </Box>
            </FormControl>
          </Box>
        </Paper>

        {/* Bulk Actions Bar */}
        {selectedOrders.size > 0 && (
          <Paper
            elevation={2}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: "#f0f9ff",
              border: "1px solid #bae6fd",
            }}
          >
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 2,
              }}
            >
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {selectedOrders.size} order{selectedOrders.size !== 1 ? "s" : ""} selected
              </Typography>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleBulkAccept}
                  disabled={loading}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  Bulk Accept
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleBulkReject}
                  disabled={loading}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  Bulk Reject
                </Button>
              </Box>
            </Box>
          </Paper>
        )}

        {/* Orders Table */}
        <TableContainer component={Paper} elevation={1}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredOrders.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                {orders.length === 0
                  ? "No orders found"
                  : "No orders match your filters"}
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedOrders.size > 0 &&
                        selectedOrders.size < filteredOrders.length
                      }
                      checked={
                        filteredOrders.length > 0 &&
                        selectedOrders.size === filteredOrders.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Consumer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Created at</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Delivery date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Items</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Complaints</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredOrders.map((order) => {
                  const complaintsCount = getComplaintsCount(order.order_id);
                  const canAcceptReject =
                    order.status === "PENDING" || order.status === "APPROVED";

                  return (
                    <TableRow key={order.order_id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedOrders.has(order.order_id)}
                          onChange={() => handleSelectOrder(order.order_id)}
                        />
                      </TableCell>
                      <TableCell>#{order.order_id}</TableCell>
                      <TableCell>
                        {order.consumer?.first_name || "N/A"}{" "}
                        {order.consumer?.last_name || ""}
                      </TableCell>
                      <TableCell>
                        {order.created_at
                          ? format(parseISO(order.created_at), "MMM dd, yyyy HH:mm")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {order.delivery_date
                          ? format(parseISO(order.delivery_date), "MMM dd, yyyy")
                          : "TBD"}
                      </TableCell>
                      <TableCell>
                        {order.items_count || order.order_items?.length || 0}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(order.status)}
                          size="small"
                          sx={{
                            bgcolor: getStatusBgColor(order.status),
                            color: getStatusTextColor(order.status),
                            fontWeight: 500,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {complaintsCount > 0 ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <ReportProblemIcon
                              fontSize="small"
                              color="error"
                            />
                            <Typography variant="body2">{complaintsCount}</Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            None
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewOrder(order)}
                            title="View order"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          {isSales && (
                            <IconButton
                              size="small"
                              onClick={() => {
                                const consumerId = order.consumer_id || order.consumer?.consumer_id;
                                setChatConsumerId(consumerId);
                                setChatConsumerName(
                                  `${order.consumer?.first_name || ""} ${order.consumer?.last_name || ""}`.trim() || "Consumer"
                                );
                                setChatOpen(true);
                              }}
                              title="Open chat"
                              color="primary"
                              sx={{
                                "&:hover": {
                                  bgcolor: "primary.light",
                                },
                              }}
                            >
                              <ChatIcon fontSize="small" />
                            </IconButton>
                          )}
                          {canAcceptReject && isManager && (
                            <>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleAcceptOrder(order.order_id)}
                                disabled={loading}
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRejectOrder(order.order_id)}
                                disabled={loading}
                              >
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* Order Details Drawer */}
        <Drawer
          anchor="right"
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          PaperProps={{
            sx: { width: { xs: "100%", sm: 500 } },
          }}
        >
          {selectedOrder && (
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
                Order Details
              </Typography>

              {/* Order Header */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Order ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    #{selectedOrder.order_id}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedOrder.status)}
                    size="small"
                    sx={{
                      bgcolor: getStatusBgColor(selectedOrder.status),
                      color: getStatusTextColor(selectedOrder.status),
                      fontWeight: 500,
                    }}
                  />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    Created
                  </Typography>
                  <Typography variant="body2">
                    {selectedOrder.created_at
                      ? format(
                          parseISO(selectedOrder.created_at),
                          "MMM dd, yyyy 'at' HH:mm"
                        )
                      : "N/A"}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Consumer Block */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Consumer
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Name:</strong> {selectedOrder.consumer?.first_name || "N/A"}{" "}
                  {selectedOrder.consumer?.last_name || ""}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Outlet:</strong> {selectedOrder.consumer?.organization_name || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Email:</strong> {selectedOrder.consumer?.user?.email || "N/A"}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Items List */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Items
                </Typography>
                {orderItems.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No items found
                  </Typography>
                ) : (
                  <List sx={{ p: 0 }}>
                    {orderItems.map((item, idx) => (
                      <React.Fragment key={idx}>
                        <ListItem sx={{ px: 0, py: 1.5 }}>
                          <ListItemText
                            primary={item.product?.product_name || "Product"}
                            secondary={
                              <Box>
                                <Typography variant="caption" component="span">
                                  {item.quantity} {item.unit} × {item.price} ₸ ={" "}
                                  {(item.quantity * item.price).toFixed(2)} ₸
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        {idx < orderItems.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>

              {/* Summary */}
              <Box sx={{ mb: 3, p: 2, bgcolor: "#f8fafc", borderRadius: 2 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2">Total Items:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {orderItems.reduce((sum, item) => sum + item.quantity, 0)}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Total Amount:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {calculateOrderTotal().toFixed(2)} ₸
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Related Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Related
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2">
                      Complaints: <strong>{orderComplaints.length}</strong>
                    </Typography>
                    {orderComplaints.length > 0 && (
                      <Button
                        variant="text"
                        size="small"
                        sx={{ textTransform: "none" }}
                      >
                        View complaints
                      </Button>
                    )}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="body2">
                    Incidents: <strong>0</strong>
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Action Buttons */}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                {selectedOrder.status === "PENDING" && (
                  <>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleAcceptOrder(selectedOrder.order_id)}
                      disabled={loading}
                      sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                      Accept order
                    </Button>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => handleRejectOrder(selectedOrder.order_id)}
                      disabled={loading}
                      sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                      Reject order
                    </Button>
                  </>
                )}
                {selectedOrder.status === "APPROVED" && (
                  <Button
                    variant="contained"
                    fullWidth
                    sx={{ textTransform: "none", borderRadius: 2 }}
                  >
                    Mark as completed
                  </Button>
                )}
              </Box>
            </Box>
          )}
        </Drawer>

        {/* Chat Panel */}
        <ChatPanel
          open={chatOpen}
          onClose={() => {
            setChatOpen(false);
            setChatConsumerId(null);
            setChatConsumerName("");
          }}
          consumerId={chatConsumerId}
          consumerName={chatConsumerName}
        />
      </Box>
    </LocalizationProvider>
  );
}
