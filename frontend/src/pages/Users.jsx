import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  InputAdornment,
  Alert,
  Menu,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Chip,
  CircularProgress,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import SearchIcon from "@mui/icons-material/Search";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import DeleteIcon from "@mui/icons-material/Delete";
import { useAuth } from "../auth/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function User() {
  const { token, user } = useAuth();
  const [isOwner, setIsOwner] = useState(null); // null = checking, true = owner, false = not owner
  const [anchorEl, setAnchorEl] = useState(null);
  const [open, setOpen] = useState(false);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  
  const [selectedWorkers, setSelectedWorkers] = useState(new Set());
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const firstNameValid = useMemo(() => firstName.trim().length >= 2, [firstName]);
  const lastNameValid = useMemo(() => lastName.trim().length >= 2, [lastName]);
  const emailValid = useMemo(() => EMAIL_REGEX.test(email), [email]);
  const passwordValid = useMemo(() => password.length >= 6, [password]);
  const canSubmit = firstNameValid && lastNameValid && emailValid && passwordValid && !loading;

  useEffect(() => {
    const fetchWorkers = async () => {
      if (!token) return;
      
      const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
      setLoadingWorkers(true);
      try {
        const response = await fetch(`${base}/owner/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.status === 403) {
          // User is not an owner
          setIsOwner(false);
          setLoadingWorkers(false);
          return;
        }
        
        if (response.ok) {
          setIsOwner(true);
          const data = await response.json();
          setWorkers(data || []);
        } else {
          setIsOwner(false);
        }
      } catch (err) {
        console.error("Failed to fetch workers:", err);
        setIsOwner(false);
      } finally {
        setLoadingWorkers(false);
      }
    };

    fetchWorkers();
  }, [token, success]);

  const filteredWorkers = useMemo(() => {
    let filtered = workers;

    if (filter === "managers") {
      filtered = filtered.filter((w) => {
        const role = (w.supplier_role || "").toString().toLowerCase();
        return role === "manager" && !(w.is_archived ?? false);
      });
    } else if (filter === "sales") {
      filtered = filtered.filter((w) => {
        const role = (w.supplier_role || "").toString().toLowerCase();
        return role === "sales" && !(w.is_archived ?? false);
      });
    } else if (filter === "archived") {
      filtered = filtered.filter((w) => w.is_archived === true);
    } else {
      filtered = filtered.filter((w) => !(w.is_archived ?? false));
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (w) =>
          w.first_name?.toLowerCase().includes(query) ||
          w.last_name?.toLowerCase().includes(query) ||
          w.email?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [workers, filter, searchQuery]);

  useEffect(() => {
    setPage(0);
  }, [filter, searchQuery]);

  const paginatedWorkers = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredWorkers.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredWorkers, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSelectAll = () => {
    if (selectedWorkers.size === filteredWorkers.length) {
      setSelectedWorkers(new Set());
    } else {
      setSelectedWorkers(new Set(filteredWorkers.map((w) => w.email)));
    }
  };

  const handleSelectWorker = (email) => {
    const newSelected = new Set(selectedWorkers);
    if (newSelected.has(email)) {
      newSelected.delete(email);
    } else {
      newSelected.add(email);
    }
    setSelectedWorkers(newSelected);
  };

  const handleDeactivate = async () => {
    console.log("Deactivate:", Array.from(selectedWorkers));
    setSelectedWorkers(new Set());
  };

  const handleReactivate = async () => {
    console.log("Reactivate:", Array.from(selectedWorkers));
    setSelectedWorkers(new Set());
  };

  const handleChangeRole = async () => {
    console.log("Change role:", Array.from(selectedWorkers));
    setSelectedWorkers(new Set());
  };

  const handleRemove = async () => {
    if (window.confirm(`Are you sure you want to remove ${selectedWorkers.size} team member(s)?`)) {
      console.log("Remove:", Array.from(selectedWorkers));
      setSelectedWorkers(new Set());
    }
  };

  const handleAddClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSelectType = (type) => {
    setUserType(type);
    setAnchorEl(null);
    setOpen(true);
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    if (!loading) {
      setOpen(false);
      setUserType(null);
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setError("");
      setSuccess(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!canSubmit) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const endpoint = userType === "manager" ? "/owner/manager" : "/owner/sales";

    setLoading(true);
    try {
      const response = await fetch(`${base}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          email: email.trim(),
          pwd: password,
          role: "supplier",
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create manager";
        try {
          const errorData = await response.json();
          errorMessage = errorData?.detail || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
        setSelectedWorkers(new Set());
      }, 1500);
    } catch (err) {
      const userTypeLabel = userType === "manager" ? "manager" : "sales person";
      setError(err?.message || `An error occurred while creating the ${userTypeLabel}`);
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking access
  if (isOwner === null) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show access denied if not owner
  if (isOwner === false) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 3 }}>
        <Paper elevation={1} sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h5" sx={{ mb: 2, color: "error.main" }}>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Only owners can access User Management. You need owner privileges to view and manage team members.
          </Typography>
        </Paper>
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
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Team
            </Typography>
            <Button
              variant="contained"
              startIcon={<PersonAddIcon />}
              endIcon={<ArrowDropDownIcon />}
              onClick={handleAddClick}
              sx={{
                py: 1.2,
                px: 3,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Add
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem onClick={() => handleSelectType("manager")}>
                Add Manager
              </MenuItem>
              <MenuItem onClick={() => handleSelectType("sales")}>
                Add Sales
              </MenuItem>
            </Menu>
          </Box>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
            <ToggleButtonGroup
              value={filter}
              exclusive
              onChange={(e, newFilter) => {
                if (newFilter !== null) {
                  setFilter(newFilter);
                }
              }}
              sx={{
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  fontWeight: 500,
                  borderRadius: 3,
                  px: 2.5,
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
              <ToggleButton value="all">All</ToggleButton>
              <ToggleButton value="managers">Managers</ToggleButton>
              <ToggleButton value="sales">Sales</ToggleButton>
              <ToggleButton value="archived">Archived</ToggleButton>
            </ToggleButtonGroup>

            <TextField
              placeholder="Search by name or email..."
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
          </Box>
        </Box>
      </Paper>

      {selectedWorkers.size > 0 && (
        <Paper
          elevation={2}
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "primary.light",
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="body1" sx={{ fontWeight: 600, mr: 1 }}>
            {selectedWorkers.size} {selectedWorkers.size === 1 ? "member" : "members"} selected
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button
              variant="outlined"
              startIcon={<BlockIcon />}
              onClick={handleDeactivate}
              sx={{ textTransform: "none" }}
            >
              Deactivate
            </Button>
            <Button
              variant="outlined"
              startIcon={<CheckCircleIcon />}
              onClick={handleReactivate}
              sx={{ textTransform: "none" }}
            >
              Reactivate
            </Button>
            <Button
              variant="outlined"
              startIcon={<SwapHorizIcon />}
              onClick={handleChangeRole}
              sx={{ textTransform: "none" }}
            >
              Change Role
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleRemove}
              sx={{ textTransform: "none" }}
            >
              Remove
            </Button>
          </Box>
        </Paper>
      )}

      <Box sx={{ mt: 2 }}>
        {loadingWorkers ? (
          <Typography color="text.secondary">Loading team members...</Typography>
        ) : (
          <>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography color="text.secondary">
                {filteredWorkers.length} {filteredWorkers.length === 1 ? "member" : "members"} found
                {searchQuery && ` matching "${searchQuery}"`}
              </Typography>
              {filteredWorkers.length > 0 && (
                <Button
                  size="small"
                  onClick={handleSelectAll}
                  sx={{ textTransform: "none" }}
                >
                  {selectedWorkers.size === filteredWorkers.length ? "Deselect All" : "Select All"}
                </Button>
              )}
            </Box>

            {filteredWorkers.length > 0 ? (
              <TableContainer component={Paper} elevation={1}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox" sx={{ width: 48 }}>
                        <Checkbox
                          indeterminate={
                            selectedWorkers.size > 0 &&
                            selectedWorkers.size < filteredWorkers.length
                          }
                          checked={
                            filteredWorkers.length > 0 &&
                            selectedWorkers.size === filteredWorkers.length
                          }
                          onChange={handleSelectAll}
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedWorkers.map((worker) => {
                      const isSelected = selectedWorkers.has(worker.email);
                      const fullName = `${worker.first_name} ${worker.last_name}`;
                      const roleValue = worker.supplier_role?.toLowerCase() || "";
                      const isArchived = worker.is_archived ?? false;

                      return (
                        <TableRow
                          key={worker.email}
                          hover
                          selected={isSelected}
                          sx={{
                            cursor: "pointer",
                            "&:hover": {
                              backgroundColor: "action.hover",
                            },
                          }}
                          onClick={() => handleSelectWorker(worker.email)}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              checked={isSelected}
                              onChange={() => handleSelectWorker(worker.email)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </TableCell>
                          <TableCell>{fullName}</TableCell>
                          <TableCell>{worker.email}</TableCell>
                          <TableCell>
                            <Chip
                              label={roleValue === "manager" ? "Manager" : roleValue === "sales" ? "Sales" : roleValue}
                              size="small"
                              color={roleValue === "manager" ? "primary" : "secondary"}
                              sx={{
                                textTransform: "capitalize",
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={isArchived ? "Archived" : "Active"}
                              size="small"
                              color={isArchived ? "default" : "success"}
                              sx={{
                                fontWeight: 500,
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={filteredWorkers.length}
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
                  p: 4,
                  textAlign: "center",
                  borderRadius: 2,
                }}
              >
                <Typography color="text.secondary">
                  No team members found
                  {searchQuery && ` matching "${searchQuery}"`}
                </Typography>
              </Paper>
            )}
          </>
        )}
      </Box>

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
        <DialogTitle sx={{ pb: 1, fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
          <PersonAddIcon color="primary" />
          Add New {userType === "manager" ? "Manager" : "Sales Person"}
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            {error && (
              <Alert severity="error" onClose={() => setError("")}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success">
                {userType === "manager" ? "Manager" : "Sales person"} created successfully! They can now log in to the system.
              </Alert>
            )}

            <TextField
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              fullWidth
              required
              error={firstName.length > 0 && !firstNameValid}
              helperText={
                firstName.length > 0 && !firstNameValid
                  ? "First name must be at least 2 characters"
                  : " "
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              disabled={loading}
            />

            <TextField
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              fullWidth
              required
              error={lastName.length > 0 && !lastNameValid}
              helperText={
                lastName.length > 0 && !lastNameValid
                  ? "Last name must be at least 2 characters"
                  : " "
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonOutlineIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              disabled={loading}
            />

            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              required
              error={email.length > 0 && !emailValid}
              helperText={
                email.length > 0 && !emailValid ? "Please enter a valid email address" : " "
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              disabled={loading}
            />

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              error={password.length > 0 && !passwordValid}
              helperText={
                password.length > 0 && !passwordValid
                  ? "Password must be at least 6 characters"
                  : " "
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      aria-label="toggle password visibility"
                      disabled={loading}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
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
              disabled={!canSubmit}
              sx={{
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              {loading ? "Creating..." : `Create ${userType === "manager" ? "Manager" : "Sales Person"}`}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}