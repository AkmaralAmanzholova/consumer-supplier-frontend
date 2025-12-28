import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  List,
  ListItem,
  Divider,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ChatPanel from "../components/ChatPanel";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [selectedLang, setSelectedLang] = useState("EN");
  const [complaints, setComplaints] = useState([]);
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);
  const [linkRequestsLoading, setLinkRequestsLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatConsumerId, setChatConsumerId] = useState(null);
  const [chatConsumerName, setChatConsumerName] = useState("");

  const { isManager, isSales } = useAuth();

  const baseUrl = useMemo(() => import.meta.env.VITE_API_URL || "http://localhost:8000", []);

  useEffect(() => {
    if (!token) return;

    if (isManager || isSales) {
      fetchComplaints();
    }
    if (isManager) {
      fetchOrders();
      fetchRequests();
      fetchProducts();
    }
  }, [token, isManager, isSales]);

  const fetchComplaints = async () => {
    if (!token) return;

    setComplaintsLoading(true);

    try {
      const endpoint = isManager
        ? `${baseUrl}/manager/complaints`
        : isSales
        ? `${baseUrl}/sales/complaints`
        : null;

      if (!endpoint) {
        setComplaints([]);
        setComplaintsLoading(false);
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

      if (response.ok) {
        const data = await response.json();
        setComplaints(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Error fetching complaints:", err);
    } finally {
      setComplaintsLoading(false);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await fetch(`${baseUrl}/manager/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchRequests = async () => {
    setRequestsLoading(true);
    setLinkRequestsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/manager/requests`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(Array.isArray(data) ? data : []);
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.error("Error fetching link requests:", err);
      setRequests([]);
    } finally {
      setRequestsLoading(false);
      setLinkRequestsLoading(false);
    }
  };

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const response = await fetch(`${baseUrl}/manager/products`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : []);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const todayISO = new Date().toISOString().split("T")[0];
  const stats = {
    newOrdersToday: orders.filter((order) => {
      const created = order.created_at || order.createdAt;
      if (created) {
        return created.startsWith(todayISO);
      }
      return order.status === "PENDING";
    }).length,
    pendingDecisions: requests.filter((req) => req.status === "PENDING").length,
    openComplaints: complaints.filter((c) => !c.is_resolved && c.status === "sales").length,
    openIncidents: complaints.filter((c) => !c.is_resolved && c.status === "manager").length,
  };

  const recentOrders = orders
    .slice()
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    })
    .slice(0, 5)
    .map((order) => ({
      id: order.order_id || order.id,
      consumer:
        order.consumer?.first_name
          ? `${order.consumer.first_name} ${order.consumer.last_name || ""}`.trim()
          : `Consumer #${order.consumer_id}`,
      date: order.created_at
        ? new Date(order.created_at).toLocaleDateString()
        : "—",
      status: order.status || "UNKNOWN",
      complaints: order.complaints?.length || 0,
    }));

  // Get recent complaints for display (limit to 5 most recent)
  const recentComplaints = complaints
    .filter((c) => !c.is_resolved)
    .sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
      const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
      return dateB - dateA;
    })
    .slice(0, 5)
    .map((c) => ({
      consumer: c.consumer?.first_name 
        ? `${c.consumer.first_name} ${c.consumer.last_name || ""}`.trim()
        : "Unknown Consumer",
      orderId: `ORD-${c.order_id}`,
      status: c.status === "manager" ? "Escalated" : "Open",
      handler: c.status === "manager" ? "Manager" : "Sales",
    }));

  const linkRequests = requests
    .filter((req) => req.status === "PENDING")
    .map((req) => ({
      name: req.consumer?.organization_name || req.consumer?.first_name || `Consumer #${req.consumer_id}`,
      date: req.created_at ? new Date(req.created_at).toLocaleDateString() : "—",
      request_id: req.request_id,
    }))
    .slice(0, 5);

  const activeProductsCount = products.filter((p) => p.is_active !== false).length;
  const lowStockProducts = products
    .filter((p) => typeof p.quantity === "number" && p.quantity <= 5)
    .sort((a, b) => (a.quantity || 0) - (b.quantity || 0));
  const criticalProducts = lowStockProducts.slice(0, 3).map((p) => ({
    name: p.product_name || `Product #${p.product_id}`,
    stock: p.quantity ?? "—",
  }));

  const recentMessages = [
    {
      consumer: "ABC Company",
      message: "Hello, when will my order be delivered?",
      time: "2h ago",
    },
    {
      consumer: "XYZ Corp",
      message: "Thank you for the quick response!",
      time: "5h ago",
    },
    {
      consumer: "Tech Solutions",
      message: "Can we discuss pricing?",
      time: "1d ago",
    },
  ];

  const getStatusColor = (status) => {
    const colors = {
      New: "primary",
      Accepted: "success",
      Rejected: "error",
      "In progress": "warning",
      Open: "info",
      Escalated: "error",
    };
    return colors[status] || "default";
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f1f5f9",
        p: { xs: 2, md: 4, lg: 6 },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            fontSize: { xs: "1.5rem", md: "2rem" },
            flexGrow: { xs: 1, md: 0 },
          }}
        >
          Dashboard
        </Typography>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
            flexGrow: { xs: 1, md: 0 },
            justifyContent: { xs: "flex-end", md: "flex-end" },
          }}
        >
          {/* Search */}
          <TextField
            placeholder="Search orders, products, consumers…"
            size="small"
            sx={{
              minWidth: { xs: "100%", sm: 300 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                bgcolor: "white",
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

          {/* Language Switcher */}
          <Box sx={{ display: "flex", gap: 0.5 }}>
            {["KZ", "RU", "EN"].map((lang) => (
              <Button
                key={lang}
                variant={selectedLang === lang ? "contained" : "outlined"}
                size="small"
                onClick={() => setSelectedLang(lang)}
                sx={{
                  minWidth: 40,
                  px: 1.5,
                  borderRadius: 1,
                  textTransform: "none",
                  fontSize: "0.75rem",
                }}
              >
                {lang}
              </Button>
            ))}
          </Box>

          {/* User Avatar */}
          <Box sx={{ position: "relative" }}>
            <IconButton
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{ p: 0 }}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: "#3b82f6",
                }}
              >
                {user?.first_name?.[0] || "U"}
              </Avatar>
              <ArrowDropDownIcon
                sx={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  fontSize: 16,
                  bgcolor: "white",
                  borderRadius: "50%",
                }}
              />
            </IconButton>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
            >
              <MenuItem onClick={() => {
                setUserMenuAnchor(null);
                navigate("/settings");
              }}>
                Profile
              </MenuItem>
              <MenuItem onClick={() => {
                setUserMenuAnchor(null);
                navigate("/settings");
              }}>
                Settings
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => {
                setUserMenuAnchor(null);
                logout();
              }}>
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 4,
        }}
      >
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 1,
            bgcolor: "white",
            "&:hover": { boxShadow: 3 },
          }}
        >
          <CardContent>
            <Typography
              variant="body2"
              sx={{ color: "#64748b", fontWeight: 500, mb: 1 }}
            >
              New Orders Today
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, mb: 0.5, color: "#1e293b" }}
            >
              {stats.newOrdersToday}
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              since 00:00
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 1,
            bgcolor: "white",
            "&:hover": { boxShadow: 3 },
          }}
        >
          <CardContent>
            <Typography
              variant="body2"
              sx={{ color: "#64748b", fontWeight: 500, mb: 1 }}
            >
              Pending Decisions
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, mb: 0.5, color: "#1e293b" }}
            >
              {stats.pendingDecisions}
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              requires attention
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 1,
            bgcolor: "white",
            "&:hover": { boxShadow: 3 },
          }}
        >
          <CardContent>
            <Typography
              variant="body2"
              sx={{ color: "#64748b", fontWeight: 500, mb: 1 }}
            >
              Open Complaints
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, mb: 0.5, color: "#1e293b" }}
            >
              {stats.openComplaints}
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              requires attention
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 1,
            bgcolor: "white",
            "&:hover": { boxShadow: 3 },
          }}
        >
          <CardContent>
            <Typography
              variant="body2"
              sx={{ color: "#64748b", fontWeight: 500, mb: 1 }}
            >
              Open Incidents
            </Typography>
            <Typography
              variant="h4"
              sx={{ fontWeight: 600, mb: 0.5, color: "#1e293b" }}
            >
              {stats.openIncidents}
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              requires attention
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Middle Section */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
          gap: 3,
          mb: 4,
        }}
      >
        {/* Recent Orders Table */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 1,
            bgcolor: "white",
            overflow: "hidden",
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 2, color: "#1e293b" }}
            >
              Recent Orders
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Consumer</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Complaints</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ordersLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : recentOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ color: "#94a3b8" }}>
                        No orders found
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        sx={{
                          "&:hover": { bgcolor: "#f8fafc" },
                          cursor: "pointer",
                        }}
                      >
                        <TableCell>{order.id}</TableCell>
                        <TableCell>{order.consumer}</TableCell>
                        <TableCell>{order.date}</TableCell>
                        <TableCell>
                          <Chip
                            label={order.status}
                            color={getStatusColor(order.status)}
                            size="small"
                            sx={{ borderRadius: 2 }}
                          />
                        </TableCell>
                        <TableCell>{order.complaints}</TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <IconButton size="small">
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small">
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Right Column - Complaints & Link Requests */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Complaints & Escalations */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 1,
              bgcolor: "white",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 2, color: "#1e293b" }}
              >
                Complaints & Escalations
              </Typography>
              {complaintsLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : recentComplaints.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#64748b", p: 2 }}>
                  No active complaints
                </Typography>
              ) : (
                <List sx={{ p: 0 }}>
                  {recentComplaints.map((complaint, idx) => (
                    <React.Fragment key={idx}>
                      <ListItem
                        sx={{
                          flexDirection: "column",
                          alignItems: "flex-start",
                          px: 0,
                          py: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            mb: 1,
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {complaint.consumer}
                          </Typography>
                          <Chip
                            label={complaint.status}
                            color={getStatusColor(complaint.status)}
                            size="small"
                            sx={{ borderRadius: 2 }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                          Order: {complaint.orderId} • Handler: {complaint.handler}
                        </Typography>
                      </ListItem>
                      {idx < recentComplaints.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
              {recentComplaints.length > 0 && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => navigate("/complaints")}
                  sx={{
                    mt: 1,
                    textTransform: "none",
                    fontSize: "0.75rem",
                  }}
                >
                  View all complaints →
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Pending Link Requests */}
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 1,
              bgcolor: "white",
            }}
          >
            <CardContent>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, mb: 2, color: "#1e293b" }}
              >
                Pending Link Requests
              </Typography>
              <List sx={{ p: 0 }}>
                {linkRequestsLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : linkRequests.length === 0 ? (
                  <Typography variant="body2" sx={{ color: "#64748b" }}>
                    No pending requests
                  </Typography>
                ) : (
                  linkRequests.map((request, idx) => (
                    <React.Fragment key={idx}>
                      <ListItem
                        sx={{
                          flexDirection: "column",
                          alignItems: "flex-start",
                          px: 0,
                          py: 1.5,
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            width: "100%",
                            mb: 1,
                          }}
                        >
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {request.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "#64748b" }}>
                              {request.date}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontSize: "0.75rem",
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            sx={{
                              borderRadius: 2,
                              textTransform: "none",
                              fontSize: "0.75rem",
                            }}
                          >
                            Deny
                          </Button>
                        </Box>
                      </ListItem>
                      {idx < linkRequests.length - 1 && <Divider />}
                    </React.Fragment>
                  ))
                )}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Bottom Section */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "repeat(2, 1fr)" },
          gap: 3,
        }}
      >
        {/* Catalog Status */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 1,
            bgcolor: "white",
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 2, color: "#1e293b" }}
            >
              Catalog Status
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: "#64748b", mb: 1 }}>
                Active products:{" "}
                <strong>
                  {productsLoading ? "…" : activeProductsCount}
                </strong>
              </Typography>
              <Typography variant="body2" sx={{ color: "#64748b" }}>
                Low-stock products:{" "}
                <strong>
                  {productsLoading ? "…" : lowStockProducts.length}
                </strong>
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, mb: 1, color: "#1e293b" }}
            >
              Critical items:
            </Typography>
            <List sx={{ p: 0, mb: 2 }}>
              {productsLoading ? (
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                  Loading products…
                </Typography>
              ) : criticalProducts.length === 0 ? (
                <Typography variant="body2" sx={{ color: "#94a3b8" }}>
                  No critical items 🎉
                </Typography>
              ) : (
              criticalProducts.map((product, idx) => (
                <ListItem
                  key={idx}
                  sx={{
                    px: 0,
                    py: 0.5,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography variant="body2">{product.name}</Typography>
                  <Chip
                    label={`${product.stock} left`}
                    color="error"
                    size="small"
                    sx={{ borderRadius: 2 }}
                  />
                </ListItem>
              )))}
            </List>
            <Button
              variant="contained"
              fullWidth
              onClick={() => navigate("/catalog")}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                mt: 1,
              }}
            >
              Go to Catalog
            </Button>
          </CardContent>
        </Card>

        {/* Recent Messages */}
        <Card
          sx={{
            borderRadius: 3,
            boxShadow: 1,
            bgcolor: "white",
          }}
        >
          <CardContent>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 2, color: "#1e293b" }}
            >
              Recent Messages
            </Typography>
            <List sx={{ p: 0, mb: 2 }}>
              {recentMessages.map((msg, idx) => (
                <React.Fragment key={idx}>
                  <ListItem
                    sx={{
                      flexDirection: "column",
                      alignItems: "flex-start",
                      px: 0,
                      py: 1.5,
                      "&:hover": { bgcolor: "#f8fafc" },
                      borderRadius: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        width: "100%",
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {msg.consumer}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#64748b" }}>
                        {msg.time}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{ color: "#64748b", fontSize: "0.875rem" }}
                    >
                      {msg.message}
                    </Typography>
                  </ListItem>
                  {idx < recentMessages.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
            <Button
              variant="outlined"
              fullWidth
              onClick={() => {
                // For now, open a generic chat - in real implementation, 
                // this would open a list of chats or a specific consumer chat
                setChatOpen(true);
                setChatConsumerName("Chat");
              }}
              sx={{
                borderRadius: 2,
                textTransform: "none",
              }}
            >
              Open chat
            </Button>
          </CardContent>
        </Card>
      </Box>

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
  );
}
