import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  Menu,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ChatIcon from "@mui/icons-material/Chat";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import BlockIcon from "@mui/icons-material/Block";
import ChatPanel from "../components/ChatPanel";
import { format, parseISO } from "date-fns";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Consumers() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Tabs
  const [currentTab, setCurrentTab] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Selection and details
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedConsumer, setSelectedConsumer] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatConsumerId, setChatConsumerId] = useState(null);
  const [chatConsumerName, setChatConsumerName] = useState("");

  const { isManager, isSales, isLoading: roleLoading } = useAuth();
  
  // Sales users have read-only access
  const isReadOnly = isSales && !isManager;

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);
    setError("");

    try {
      // Fetch requests - use appropriate endpoint based on role
      const requestsEndpoint = isManager
        ? `${base}/manager/requests`
        : isSales
        ? `${base}/manager/requests` // Sales can use manager endpoint for read access
        : null;

      if (!requestsEndpoint) {
        setLoading(false);
        return;
      }

      const requestsResponse = await fetch(requestsEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (requestsResponse.status === 401) {
        logout();
        window.location.href = "/login";
        return;
      }

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setRequests(Array.isArray(requestsData) ? requestsData : []);
      }

      // Fetch orders for consumer stats - use appropriate endpoint based on role
      const ordersEndpoint = isManager
        ? `${base}/manager/orders`
        : isSales
        ? `${base}/sales/orders`
        : null;

      if (!ordersEndpoint) {
        setLoading(false);
        return;
      }

      const ordersResponse = await fetch(ordersEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (ordersResponse.status === 401) {
        logout();
        window.location.href = "/login";
        return;
      }

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      }

      // Fetch complaints for consumer stats
      const complaintsResponse = await fetch(`${base}/manager/complaints`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (complaintsResponse.status === 401) {
        logout();
        window.location.href = "/login";
        return;
      }

      if (complaintsResponse.ok) {
        const complaintsData = await complaintsResponse.json();
        setComplaints(Array.isArray(complaintsData) ? complaintsData : []);
      }
    } catch (err) {
      setError(err?.message || "Failed to load data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${base}/manager/request/accept/${requestId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.detail || "Failed to accept request");
      }

      setSuccess("Request accepted successfully");
      await fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.message || "Failed to accept request");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${base}/manager/request/reject/${requestId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.detail || "Failed to reject request");
      }

      setSuccess("Request rejected successfully");
      await fetchData();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.message || "Failed to reject request");
    } finally {
      setLoading(false);
    }
  };

  // Categorize requests
  const allLinked = useMemo(() => {
    return requests.filter((r) => r.status === "APPROVED");
  }, [requests]);

  const pendingRequests = useMemo(() => {
    return requests.filter((r) => r.status === "PENDING");
  }, [requests]);

  const blocked = useMemo(() => {
    return requests.filter((r) => r.status === "REJECTED");
  }, [requests]);

  // Get consumer stats
  const getConsumerStats = (consumerId) => {
    const consumerOrders = orders.filter((o) => o.consumer_id === consumerId);
    const consumerComplaints = complaints.filter(
      (c) => c.consumer_id === consumerId && !c.is_resolved
    );
    const lastOrder = consumerOrders
      .sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
        const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
        return dateB - dateA;
      })[0];

    return {
      totalOrders: consumerOrders.length,
      openComplaints: consumerComplaints.length,
      lastOrderDate: lastOrder?.created_at || null,
      recentOrders: consumerOrders.slice(0, 3),
    };
  };

  // Filter consumers
  const getFilteredConsumers = (consumerList) => {
    let filtered = [...consumerList];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((r) => {
        const consumer = r.consumer;
        const name = `${consumer?.first_name || ""} ${consumer?.last_name || ""}`.toLowerCase();
        const city = (consumer?.city || "").toLowerCase();
        const id = r.consumer_id?.toString() || "";
        return name.includes(query) || city.includes(query) || id.includes(query);
      });
    }

    // City filter
    if (cityFilter !== "all") {
      filtered = filtered.filter(
        (r) => r.consumer?.city === cityFilter
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (r) => r.consumer?.organization_type === typeFilter
      );
    }

    return filtered;
  };

  const filteredAllLinked = useMemo(
    () => getFilteredConsumers(allLinked),
    [allLinked, searchQuery, cityFilter, typeFilter]
  );

  const filteredPending = useMemo(
    () => {
      let filtered = [...pendingRequests];
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((r) => {
          const consumer = r.consumer;
          const name = `${consumer?.first_name || ""} ${consumer?.last_name || ""}`.toLowerCase();
          return name.includes(query);
        });
      }
      return filtered;
    },
    [pendingRequests, searchQuery]
  );

  const filteredBlocked = useMemo(
    () => getFilteredConsumers(blocked),
    [blocked, searchQuery, cityFilter, typeFilter]
  );

  // Get unique cities and types
  const cities = useMemo(() => {
    const citySet = new Set();
    requests.forEach((r) => {
      if (r.consumer?.city) citySet.add(r.consumer.city);
    });
    return Array.from(citySet).sort();
  }, [requests]);

  const handleViewConsumer = (request) => {
    setSelectedConsumer(request);
    setDetailsOpen(true);
  };

  const handleMenuOpen = (event, request) => {
    setMenuAnchor(event.currentTarget);
    setSelectedRequest(request);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedRequest(null);
  };

  const getConsumerName = (consumer) => {
    if (!consumer) return "Unknown";
    return `${consumer.first_name || ""} ${consumer.last_name || ""}`.trim() || "Unknown";
  };

  const getConsumerType = (consumer) => {
    return consumer?.organization_type || "Other";
  };

  const getConsumerCity = (consumer) => {
    return consumer?.city || "N/A";
  };

  const renderConsumerTable = (consumers, showActions = true) => {
    if (isMobile) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {consumers.map((request) => {
            const consumer = request.consumer;
            const stats = getConsumerStats(request.consumer_id);
            return (
              <Card key={request.request_id} elevation={1}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      mb: 2,
                    }}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {getConsumerName(consumer)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {getConsumerCity(consumer)} • {getConsumerType(consumer)}
                      </Typography>
                    </Box>
                    <Chip
                      label={request.status === "APPROVED" ? "Active" : "Blocked"}
                      size="small"
                      color={request.status === "APPROVED" ? "success" : "error"}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Linked since:{" "}
                      {request.created_at
                        ? format(parseISO(request.created_at), "MMM dd, yyyy")
                        : "N/A"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last order:{" "}
                      {stats.lastOrderDate
                        ? format(parseISO(stats.lastOrderDate), "MMM dd, yyyy")
                        : "Never"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewConsumer(request)}
                      sx={{ textTransform: "none" }}
                    >
                      View
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => {
                        const consumer = requests.find(
                          (r) => r.request_id === request.request_id
                        )?.consumer;
                        setChatConsumerId(request.consumer_id);
                        setChatConsumerName(getConsumerName(consumer) || "Consumer");
                        setChatOpen(true);
                      }}
                      title="Open chat"
                      color="primary"
                    >
                      <ChatIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  {!isReadOnly && !showActions && request.status === "REJECTED" && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleAcceptRequest(request.request_id)}
                      sx={{ textTransform: "none" }}
                    >
                      Unblock
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      );
    }

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Consumer name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Linked since</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Last order date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {consumers.map((request) => {
              const consumer = request.consumer;
              const stats = getConsumerStats(request.consumer_id);
              return (
                <TableRow
                  key={request.request_id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => handleViewConsumer(request)}
                >
                  <TableCell>{getConsumerName(consumer)}</TableCell>
                  <TableCell>{getConsumerCity(consumer)}</TableCell>
                  <TableCell>{getConsumerType(consumer)}</TableCell>
                  <TableCell>
                    {request.created_at
                      ? format(parseISO(request.created_at), "MMM dd, yyyy")
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={request.status === "APPROVED" ? "Active" : "Blocked"}
                      size="small"
                      color={request.status === "APPROVED" ? "success" : "error"}
                    />
                  </TableCell>
                  <TableCell>
                    {stats.lastOrderDate
                      ? format(parseISO(stats.lastOrderDate), "MMM dd, yyyy")
                      : "Never"}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewConsumer(request)}
                        title="View details"
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                      {/* Chat only available for sales users */}
                      {isSales && (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setChatConsumerId(request.consumer_id);
                            setChatConsumerName(getConsumerName(consumer));
                            setChatOpen(true);
                          }}
                          title="Open chat"
                          color="primary"
                        >
                          <ChatIcon fontSize="small" />
                        </IconButton>
                      )}
                      {showActions && (
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, request)}
                          title="More options"
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      )}
                      {!showActions && request.status === "REJECTED" && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() => handleAcceptRequest(request.request_id)}
                          sx={{ textTransform: "none" }}
                        >
                          Unblock
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const renderPendingTable = () => {
    if (isMobile) {
      return (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filteredPending.map((request) => {
            const consumer = request.consumer;
            return (
              <Card key={request.request_id} elevation={1}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                    {getConsumerName(consumer)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {getConsumerCity(consumer)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Requested:{" "}
                    {request.created_at
                      ? format(parseISO(request.created_at), "MMM dd, yyyy")
                      : "N/A"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Contact: {consumer?.user?.email || "N/A"}
                  </Typography>
                  {!isReadOnly && (
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleAcceptRequest(request.request_id)}
                        disabled={loading}
                        sx={{ textTransform: "none", flex: 1 }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleRejectRequest(request.request_id)}
                        disabled={loading}
                        sx={{ textTransform: "none", flex: 1 }}
                      >
                        Deny
                      </Button>
                    </Box>
                  )}
                  {isReadOnly && (
                    <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
                      Read-only access - Sales users cannot approve or deny requests
                    </Typography>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      );
    }

    return (
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Consumer name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Requested at</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPending.map((request) => {
              const consumer = request.consumer;
              return (
                <TableRow key={request.request_id} hover>
                  <TableCell>{getConsumerName(consumer)}</TableCell>
                  <TableCell>{getConsumerCity(consumer)}</TableCell>
                  <TableCell>
                    {request.created_at
                      ? format(parseISO(request.created_at), "MMM dd, yyyy HH:mm")
                      : "N/A"}
                  </TableCell>
                  <TableCell>{consumer?.user?.email || "N/A"}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleAcceptRequest(request.request_id)}
                        disabled={loading}
                        sx={{ textTransform: "none" }}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        onClick={() => handleRejectRequest(request.request_id)}
                        disabled={loading}
                        sx={{ textTransform: "none" }}
                      >
                        Deny
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const consumerStats = selectedConsumer
    ? getConsumerStats(selectedConsumer.consumer_id)
    : null;

  return (
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
          Consumers
        </Typography>
      </Box>

      {/* Summary + Tabs */}
      <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
          <Chip
            label={`All linked: ${allLinked.length}`}
            color="primary"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label={`Pending requests: ${pendingRequests.length}`}
            color="warning"
            sx={{ fontWeight: 600 }}
          />
          <Chip
            label={`Blocked: ${blocked.length}`}
            color="error"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="Blocked" />
        </Tabs>
      </Paper>

      {/* Filters + Search */}
      {currentTab !== 1 && (
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            <TextField
              placeholder="Search by name, city or ID…"
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
                gridColumn: { xs: "1", md: "span 1" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>City</InputLabel>
              <Select
                value={cityFilter}
                label="City"
                onChange={(e) => setCityFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All</MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city} value={city}>
                    {city}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="Restaurant">Restaurant</MenuItem>
                <MenuItem value="Hotel">Hotel</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>
      )}

      {currentTab === 1 && (
        <Paper elevation={1} sx={{ p: 2, borderRadius: 2 }}>
          <TextField
            placeholder="Search by name, city or ID…"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />
        </Paper>
      )}

      {/* Consumers List */}
      <Paper elevation={1} sx={{ borderRadius: 2, overflow: "hidden" }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {currentTab === 0 && (
              <>
                {filteredAllLinked.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: "center" }}>
                    <Typography color="text.secondary">No linked consumers found</Typography>
                  </Box>
                ) : (
                  renderConsumerTable(filteredAllLinked, true)
                )}
              </>
            )}

            {currentTab === 1 && (
              <>
                {filteredPending.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: "center" }}>
                    <Typography color="text.secondary">No pending requests</Typography>
                  </Box>
                ) : (
                  renderPendingTable()
                )}
              </>
            )}

            {currentTab === 2 && (
              <>
                {filteredBlocked.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: "center" }}>
                    <Typography color="text.secondary">No blocked consumers</Typography>
                  </Box>
                ) : (
                  renderConsumerTable(filteredBlocked, false)
                )}
              </>
            )}
          </>
        )}
      </Paper>

      {/* Consumer Details Drawer */}
      <Drawer
        anchor="right"
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        PaperProps={{
          sx: { width: { xs: "100%", sm: 500 } },
        }}
      >
        {selectedConsumer && consumerStats && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 3 }}>
              Consumer Details
            </Typography>

            {/* Header */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  {getConsumerName(selectedConsumer.consumer)}
                </Typography>
                <Chip
                  label={
                    selectedConsumer.status === "APPROVED"
                      ? "Active"
                      : selectedConsumer.status === "REJECTED"
                      ? "Blocked"
                      : "Pending"
                  }
                  color={
                    selectedConsumer.status === "APPROVED"
                      ? "success"
                      : selectedConsumer.status === "REJECTED"
                      ? "error"
                      : "warning"
                  }
                  size="small"
                />
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Basic Info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Basic Info
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>City:</strong> {getConsumerCity(selectedConsumer.consumer)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Address:</strong>{" "}
                {selectedConsumer.consumer?.address || "N/A"}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Contact person:</strong> {getConsumerName(selectedConsumer.consumer)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Phone:</strong>{" "}
                {selectedConsumer.consumer?.phone || "N/A"}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Email:</strong>{" "}
                {selectedConsumer.consumer?.user?.email || "N/A"}
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Type:</strong> {getConsumerType(selectedConsumer.consumer)}
              </Typography>
              <Typography variant="body2">
                <strong>Linked since:</strong>{" "}
                {selectedConsumer.created_at
                  ? format(parseISO(selectedConsumer.created_at), "MMM dd, yyyy")
                  : "N/A"}
              </Typography>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Relationship Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                Relationship
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <strong>Total orders:</strong> {consumerStats.totalOrders}
                </Typography>
                <Typography variant="body2">
                  <strong>Open complaints:</strong> {consumerStats.openComplaints}
                </Typography>
                <Typography variant="body2">
                  <strong>Last order date:</strong>{" "}
                  {consumerStats.lastOrderDate
                    ? format(parseISO(consumerStats.lastOrderDate), "MMM dd, yyyy")
                    : "Never"}
                </Typography>
              </Box>

              {/* Last 3 Orders */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                  Recent Orders
                </Typography>
                {consumerStats.recentOrders.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No orders yet
                  </Typography>
                ) : (
                  <List sx={{ p: 0 }}>
                    {consumerStats.recentOrders.map((order, idx) => (
                      <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                        <ListItemText
                          primary={`Order #${order.order_id}`}
                          secondary={`${format(parseISO(order.created_at), "MMM dd, yyyy")} • ${getStatusLabel(order.status)}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
                <Button
                  variant="text"
                  size="small"
                  onClick={() => {
                    setDetailsOpen(false);
                    navigate("/orders");
                  }}
                  sx={{ textTransform: "none", mt: 1 }}
                >
                  View all orders →
                </Button>
              </Box>

              {/* Recent Chat Messages */}
              {isSales && (
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Recent Chat Messages
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    No recent messages
                  </Typography>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<ChatIcon />}
                    onClick={() => {
                      setDetailsOpen(false);
                      setChatConsumerId(selectedConsumer.consumer_id);
                      setChatConsumerName(getConsumerName(selectedConsumer.consumer));
                      setChatOpen(true);
                    }}
                    sx={{ textTransform: "none" }}
                  >
                    Open chat
                  </Button>
                </Box>
              )}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Actions */}
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {selectedConsumer.status === "APPROVED" && (
                <>
                  {!isReadOnly && (
                    <>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<BlockIcon />}
                        fullWidth
                        sx={{ textTransform: "none", borderRadius: 2 }}
                      >
                        Block consumer
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        sx={{ textTransform: "none", borderRadius: 2 }}
                      >
                        Unlink consumer
                      </Button>
                    </>
                  )}
                  {isReadOnly && (
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", fontStyle: "italic" }}>
                      Read-only access - Sales users cannot block or unlink consumers
                    </Typography>
                  )}
                </>
              )}
              {!isReadOnly && selectedConsumer.status === "REJECTED" && (
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  onClick={() => {
                    handleAcceptRequest(selectedConsumer.request_id);
                    setDetailsOpen(false);
                  }}
                  disabled={loading}
                  sx={{ textTransform: "none", borderRadius: 2 }}
                >
                  Unblock consumer
                </Button>
              )}
              {!isReadOnly && selectedConsumer.status === "PENDING" && (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    fullWidth
                    onClick={() => {
                      handleAcceptRequest(selectedConsumer.request_id);
                      setDetailsOpen(false);
                    }}
                    disabled={loading}
                    sx={{ textTransform: "none", borderRadius: 2 }}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={() => {
                      handleRejectRequest(selectedConsumer.request_id);
                      setDetailsOpen(false);
                    }}
                    disabled={loading}
                    sx={{ textTransform: "none", borderRadius: 2 }}
                  >
                    Deny
                  </Button>
                </>
              )}
              {isReadOnly && (selectedConsumer.status === "PENDING" || selectedConsumer.status === "REJECTED") && (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", fontStyle: "italic", mt: 2 }}>
                  Read-only access - Sales users cannot approve or deny requests
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
          <MenuItem onClick={handleMenuClose}>View details</MenuItem>
          <MenuItem onClick={handleMenuClose}>View orders</MenuItem>
          <MenuItem onClick={handleMenuClose}>View complaints</MenuItem>
        </Menu>

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

function getStatusLabel(status) {
  const labels = {
    PENDING: "Pending",
    APPROVED: "Accepted",
    REJECTED: "Rejected",
  };
  return labels[status] || status;
}

