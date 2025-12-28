import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormLabel,
  Switch,
  Alert,
  Divider,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext";

export default function Settings() {
  const { token, user, logout } = useAuth();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile state
  const [profile, setProfile] = useState({
    supplierName: "",
    companyEmail: "",
    phone: "",
    address: "",
    city: "",
    country: "",
  });

  // Localization state
  const [localization, setLocalization] = useState({
    language: "EN",
    dateFormat: "DD.MM.YYYY",
    timezone: "UTC+6",
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    newOrders: true,
    complaintsIncidents: true,
    linkRequests: true,
  });

  // Danger zone state
  const [deleteConfirm, setDeleteConfirm] = useState("");

  useEffect(() => {
    // Load supplier data if available
    // For now, using dummy data - can be connected to backend later
    setProfile({
      supplierName: "My Supplier Company",
      companyEmail: user?.email || "",
      phone: "+7 700 123 4567",
      address: "123 Business Street",
      city: "Almaty",
      country: "Kazakhstan",
    });
  }, [user]);

  const handleProfileChange = (field) => (e) => {
    setProfile({ ...profile, [field]: e.target.value });
  };

  const handleSaveProfile = async () => {
    setError("");
    setSuccess("");

    // TODO: Connect to backend endpoint
    // For now, just show success message
    console.log("Saving profile:", profile);
    setSuccess("Profile saved successfully");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleLocalizationChange = (field) => (e) => {
    setLocalization({ ...localization, [field]: e.target.value });
  };

  const handleSaveLocalization = () => {
    setError("");
    setSuccess("");

    // TODO: Connect to backend endpoint
    console.log("Saving localization:", localization);
    setSuccess("Localization settings saved successfully");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleNotificationChange = (field) => (e) => {
    setNotifications({ ...notifications, [field]: e.target.checked });
  };

  const handleSaveNotifications = () => {
    setError("");
    setSuccess("");

    // TODO: Connect to backend endpoint
    console.log("Saving notifications:", notifications);
    setSuccess("Notification preferences saved successfully");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleDeleteSupplier = () => {
    if (deleteConfirm === "DELETE") {
      console.warn("Delete supplier account triggered");
      setError("");
      setSuccess("");
      // TODO: Connect to backend endpoint
      // After deletion, logout and redirect
      // logout();
      // window.location.href = "/login";
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
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

      {/* Page Header */}
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Settings
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary" }}>
          Manage your company profile and preferences.
        </Typography>
      </Box>

      {/* Section 1 - Profile */}
      <Paper
        elevation={1}
        sx={{
          p: 4,
          borderRadius: 3,
          bgcolor: "white",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Profile
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <TextField
            label="Supplier name"
            value={profile.supplierName}
            onChange={handleProfileChange("supplierName")}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          <TextField
            label="Company email"
            type="email"
            value={profile.companyEmail}
            onChange={handleProfileChange("companyEmail")}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          <TextField
            label="Phone"
            value={profile.phone}
            onChange={handleProfileChange("phone")}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          <TextField
            label="Address"
            value={profile.address}
            onChange={handleProfileChange("address")}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
              gap: 3,
            }}
          >
            <TextField
              label="City"
              value={profile.city}
              onChange={handleProfileChange("city")}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Country</InputLabel>
              <Select
                value={profile.country}
                label="Country"
                onChange={handleProfileChange("country")}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="Kazakhstan">Kazakhstan</MenuItem>
                <MenuItem value="Russia">Russia</MenuItem>
                <MenuItem value="Uzbekistan">Uzbekistan</MenuItem>
                <MenuItem value="Kyrgyzstan">Kyrgyzstan</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSaveProfile}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 4,
              }}
            >
              Save profile
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Section 2 - Localization & UI */}
      <Paper
        elevation={1}
        sx={{
          p: 4,
          borderRadius: 3,
          bgcolor: "white",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Localization & UI
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
          }}
        >
          <FormControl>
            <FormLabel sx={{ mb: 1, fontWeight: 500 }}>Language</FormLabel>
            <RadioGroup
              row
              value={localization.language}
              onChange={handleLocalizationChange("language")}
            >
              <FormControlLabel
                value="KZ"
                control={<Radio />}
                label="KZ"
                sx={{
                  "& .MuiFormControlLabel-label": {
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    border:
                      localization.language === "KZ"
                        ? "2px solid"
                        : "2px solid transparent",
                    borderColor:
                      localization.language === "KZ" ? "primary.main" : "transparent",
                    bgcolor:
                      localization.language === "KZ" ? "primary.50" : "transparent",
                  },
                }}
              />
              <FormControlLabel
                value="RU"
                control={<Radio />}
                label="RU"
                sx={{
                  "& .MuiFormControlLabel-label": {
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    border:
                      localization.language === "RU"
                        ? "2px solid"
                        : "2px solid transparent",
                    borderColor:
                      localization.language === "RU" ? "primary.main" : "transparent",
                    bgcolor:
                      localization.language === "RU" ? "primary.50" : "transparent",
                  },
                }}
              />
              <FormControlLabel
                value="EN"
                control={<Radio />}
                label="EN"
                sx={{
                  "& .MuiFormControlLabel-label": {
                    px: 2,
                    py: 0.5,
                    borderRadius: 2,
                    border:
                      localization.language === "EN"
                        ? "2px solid"
                        : "2px solid transparent",
                    borderColor:
                      localization.language === "EN" ? "primary.main" : "transparent",
                    bgcolor:
                      localization.language === "EN" ? "primary.50" : "transparent",
                  },
                }}
              />
            </RadioGroup>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Date format</InputLabel>
            <Select
              value={localization.dateFormat}
              label="Date format"
              onChange={handleLocalizationChange("dateFormat")}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="DD.MM.YYYY">DD.MM.YYYY</MenuItem>
              <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
              <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Timezone</InputLabel>
            <Select
              value={localization.timezone}
              label="Timezone"
              onChange={handleLocalizationChange("timezone")}
              sx={{ borderRadius: 2 }}
            >
              <MenuItem value="UTC+6">UTC+6 (Almaty)</MenuItem>
              <MenuItem value="UTC+5">UTC+5 (Tashkent)</MenuItem>
              <MenuItem value="UTC+3">UTC+3 (Moscow)</MenuItem>
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSaveLocalization}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 4,
              }}
            >
              Save localization
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Section 3 - Notifications */}
      <Paper
        elevation={1}
        sx={{
          p: 4,
          borderRadius: 3,
          bgcolor: "white",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Notifications
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={notifications.newOrders}
                onChange={handleNotificationChange("newOrders")}
              />
            }
            label="New orders"
          />

          <FormControlLabel
            control={
              <Switch
                checked={notifications.complaintsIncidents}
                onChange={handleNotificationChange("complaintsIncidents")}
              />
            }
            label="Complaints & incidents"
          />

          <FormControlLabel
            control={
              <Switch
                checked={notifications.linkRequests}
                onChange={handleNotificationChange("linkRequests")}
              />
            }
            label="Link requests from consumers"
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
            <Button
              variant="contained"
              onClick={handleSaveNotifications}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 4,
              }}
            >
              Save notifications
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Section 4 - Danger Zone */}
      <Paper
        elevation={1}
        sx={{
          p: 4,
          borderRadius: 3,
          bgcolor: "white",
          border: "2px solid",
          borderColor: "error.main",
        }}
      >
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, mb: 1, color: "error.main" }}
        >
          Danger zone
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Deleting your supplier account will deactivate access for all staff and
          consumers. This action cannot be undone.
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            maxWidth: 500,
          }}
        >
          <TextField
            label="Type DELETE to confirm"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            fullWidth
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
              },
            }}
          />

          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteSupplier}
            disabled={deleteConfirm !== "DELETE"}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              alignSelf: "flex-start",
            }}
          >
            Delete supplier account
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
