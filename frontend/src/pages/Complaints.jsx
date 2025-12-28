import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EscalationIcon from "@mui/icons-material/TrendingUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, isAfter, isBefore, parseISO } from "date-fns";
import { useAuth } from "../auth/AuthContext";

export default function Complaints() {
  const { token, user, logout } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState("open");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingComplaint, setViewingComplaint] = useState(null);

  const { isManager, isSales, isLoading: roleLoading } = useAuth();

  useEffect(() => {
    if (token) {
      fetchComplaints();
    }
  }, [token]);

  const fetchComplaints = async () => {
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);
    setError("");

    try {
      // Determine endpoint based on user role
      const endpoint = isManager 
        ? `${base}/manager/complaints`
        : isSales
        ? `${base}/sales/complaints`
        : null;
      
      if (!endpoint) {
        setError("You don't have access to view complaints");
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
        throw new Error(errorData?.detail || `Failed to fetch complaints: ${response.status}`);
      }

      const data = await response.json();
      setComplaints(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load complaints");
      console.error("Error fetching complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (event, newFilter) => {
    if (newFilter !== null) {
      setStatusFilter(newFilter);
    }
  };

  const handleMenuOpen = (event, complaint) => {
    setAnchorEl(event.currentTarget);
    setSelectedComplaint(complaint);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedComplaint(null);
  };

  const handleEscalate = async () => {
    if (!selectedComplaint || !token) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${base}/sales/escalate/${selectedComplaint.complaint_id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.detail || "Failed to escalate complaint");
      }

      setSuccess("Complaint escalated to manager");
      handleMenuClose();
      await fetchComplaints();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.message || "Failed to escalate complaint");
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedComplaint || !token) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);
    setError("");

    try {
      const endpoint = isManager
        ? `${base}/manager/solve/${selectedComplaint.complaint_id}`
        : isSales
        ? `${base}/sales/solve/${selectedComplaint.complaint_id}`
        : null;
      
      if (!endpoint) {
        setError("You don't have permission to resolve complaints");
        return;
      }

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData?.detail || "Failed to resolve complaint");
      }

      setSuccess("Complaint marked as resolved");
      handleMenuClose();
      await fetchComplaints();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.message || "Failed to resolve complaint");
    } finally {
      setLoading(false);
    }
  };

  const handleView = (complaint) => {
    setViewingComplaint(complaint);
    setViewDialogOpen(true);
    handleMenuClose();
  };

  // Calculate KPI counts
  const kpiCounts = useMemo(() => {
    const open = complaints.filter(
      (c) => !c.is_resolved && c.status === "sales"
    ).length;
    const inProgress = complaints.filter(
      (c) => !c.is_resolved && c.status === "manager"
    ).length;
    const resolved = complaints.filter((c) => c.is_resolved).length;
    return { open, inProgress, resolved };
  }, [complaints]);

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    let filtered = [...complaints];

    // Status filter
    if (statusFilter === "open") {
      filtered = filtered.filter((c) => !c.is_resolved && c.status === "sales");
    } else if (statusFilter === "in-progress") {
      filtered = filtered.filter((c) => !c.is_resolved && c.status === "manager");
    } else if (statusFilter === "resolved") {
      filtered = filtered.filter((c) => c.is_resolved);
    }

    // Date filter
    if (startDate) {
      filtered = filtered.filter((c) => {
        if (!c.created_at) return true;
        const complaintDate = parseISO(c.created_at);
        return !isBefore(complaintDate, startDate);
      });
    }
    if (endDate) {
      filtered = filtered.filter((c) => {
        if (!c.created_at) return true;
        const complaintDate = parseISO(c.created_at);
        return !isAfter(complaintDate, endDate);
      });
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.order_id?.toString().includes(query) ||
          c.complaint_id?.toString().includes(query) ||
          c.description?.toLowerCase().includes(query) ||
          c.consumer?.first_name?.toLowerCase().includes(query) ||
          c.consumer?.last_name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [complaints, statusFilter, startDate, endDate, searchQuery]);

  const getStatusChip = (complaint) => {
    if (complaint.is_resolved) {
      return <Chip label="Resolved" color="success" size="small" />;
    }
    if (complaint.status === "manager") {
      return <Chip label="In Progress" color="warning" size="small" />;
    }
    return <Chip label="Open" color="error" size="small" />;
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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
                Complaints Desk
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Chip
                  label={`Open: ${kpiCounts.open}`}
                  color="error"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    height: 36,
                    px: 1,
                  }}
                />
                <Chip
                  label={`In-progress: ${kpiCounts.inProgress}`}
                  color="warning"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    height: 36,
                    px: 1,
                  }}
                />
                <Chip
                  label={`Resolved: ${kpiCounts.resolved}`}
                  color="success"
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    height: 36,
                    px: 1,
                  }}
                />
              </Box>
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <ToggleButtonGroup
                value={statusFilter}
                exclusive
                onChange={handleStatusFilterChange}
                sx={{
                  "& .MuiToggleButton-root": {
                    textTransform: "none",
                    fontWeight: 500,
                    borderRadius: 3,
                    px: 3,
                    py: 0.75,
                    border: "1px solid",
                    borderColor: "divider",
                    "&.Mui-selected": {
                      backgroundColor: "primary.main",
                      color: "primary.contrastText",
                      borderColor: "primary.main",
                      "&:hover": {
                        backgroundColor: "primary.dark",
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="open">Open</ToggleButton>
                <ToggleButton value="in-progress">In-progress</ToggleButton>
                <ToggleButton value="resolved">Resolved</ToggleButton>
              </ToggleButtonGroup>

              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={2}>
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 3,
                          },
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            borderRadius: 3,
                          },
                        },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={12} md={8}>
                  <TextField
                    placeholder="Search by order #, consumer, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    size="small"
                    fullWidth
                    sx={{
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
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>

        {/* Complaints Table */}
        <TableContainer component={Paper} elevation={1}>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : filteredComplaints.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                {complaints.length === 0
                  ? "No complaints found"
                  : "No complaints match your filters"}
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Order ID</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Consumer</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredComplaints.map((complaint) => (
                  <TableRow key={complaint.complaint_id} hover>
                    <TableCell>#{complaint.complaint_id}</TableCell>
                    <TableCell>ORD-{complaint.order_id}</TableCell>
                    <TableCell>
                      {complaint.consumer?.first_name || "N/A"}{" "}
                      {complaint.consumer?.last_name || ""}
                    </TableCell>
                    <TableCell
                      sx={{
                        maxWidth: 300,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {complaint.description || "No description"}
                    </TableCell>
                    <TableCell>{getStatusChip(complaint)}</TableCell>
                    <TableCell>
                      {complaint.created_at
                        ? format(parseISO(complaint.created_at), "MMM dd, yyyy")
                        : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleView(complaint)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, complaint)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>

        {/* Actions Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          {selectedComplaint && !selectedComplaint.is_resolved && (
            <>
              {isSales && selectedComplaint.status === "sales" && (
                <MenuItem onClick={handleEscalate}>
                  <EscalationIcon sx={{ mr: 1, fontSize: 20 }} />
                  Escalate to Manager
                </MenuItem>
              )}
              <MenuItem onClick={handleResolve}>
                <CheckCircleIcon sx={{ mr: 1, fontSize: 20 }} />
                Mark as Resolved
              </MenuItem>
            </>
          )}
        </Menu>

        {/* View Dialog */}
        <Dialog
          open={viewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Complaint Details</DialogTitle>
          <DialogContent>
            {viewingComplaint && (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Complaint ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    #{viewingComplaint.complaint_id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Order ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    ORD-{viewingComplaint.order_id}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Consumer
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {viewingComplaint.consumer?.first_name || "N/A"}{" "}
                    {viewingComplaint.consumer?.last_name || ""}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Status
                  </Typography>
                  <Box sx={{ mt: 0.5 }}>{getStatusChip(viewingComplaint)}</Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mt: 0.5 }}>
                    {viewingComplaint.description || "No description provided"}
                  </Typography>
                </Box>
                {viewingComplaint.created_at && (
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Created At
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 0.5 }}>
                      {format(
                        parseISO(viewingComplaint.created_at),
                        "MMM dd, yyyy 'at' HH:mm"
                      )}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}
