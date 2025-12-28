// src/pages/Login.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  Avatar, Box, Button, Checkbox, Container, FormControlLabel,
  IconButton, InputAdornment, Link, Paper, TextField, Typography,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [pwd, setPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const emailLooksValid = useMemo(
    () => EMAIL_REGEX.test(emailOrUsername) || emailOrUsername.length >= 3,
    [emailOrUsername]
  );
  const pwdValid = useMemo(() => pwd.length >= 4, [pwd]);
  const canSubmit = emailLooksValid && pwdValid && !loading;

  async function onSubmit(e) {
    e.preventDefault();
    setServerError("");
    if (!canSubmit) return;

    setLoading(true);
    try {
      await login(emailOrUsername, pwd);
      navigate("/dashboard");
    } catch (err) {
      setServerError(err?.message || "Login failed — check credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Container
      maxWidth="sm"
      sx={{ minHeight: "100vh", display: "grid", placeItems: "center", backgroundColor: "#fff" }}
    >
      <Paper
        elevation={6}
        sx={{
          position: "relative",
          p: 4, pt: 6, width: "100%", maxWidth: 420,
          borderRadius: 3, backdropFilter: "blur(8px)",
          backgroundImage: "linear-gradient(180deg, rgba(89,135,242,.95), rgba(255,255,255,.85))",
        }}
      >
        <Avatar
          sx={{
            bgcolor: "primary.main", width: 72, height: 72,
            position: "absolute", left: "50%", transform: "translateX(-50%)",
            top: -36, boxShadow: 5,
          }}
        >
          <PersonOutlineIcon sx={{ fontSize: 37 }} />
        </Avatar>

        <Box component="form" onSubmit={onSubmit} noValidate sx={{ mt: 2, display: "grid", gap: 2 }}>
          <Typography variant="h6" align="center" sx={{ mb: 1 }}>
            Supplier Login
          </Typography>

          <TextField
            label="Email or Username"
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            autoComplete="username"
            fullWidth
            error={emailOrUsername.length > 0 && !emailLooksValid}
            helperText={emailOrUsername.length > 0 && !emailLooksValid ? "Enter a valid email/username" : " "}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Password"
            type={showPwd ? "text" : "password"}
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            autoComplete="current-password"
            fullWidth
            error={pwd.length > 0 && !pwdValid}
            helperText={pwd.length > 0 && !pwdValid ? "Use at least 6 characters" : " "}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlinedIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPwd((s) => !s)} edge="end" aria-label="toggle password visibility">
                    {showPwd ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.5 }}>
            <FormControlLabel control={<Checkbox size="small" />} label="Remember me" />
            <Link href="#" variant="body2" underline="hover">Forgot Password?</Link>
          </Box>

          {serverError && (
            <Box sx={{ bgcolor: "error.light", color: "error.contrastText", p: 1.2, borderRadius: 1, fontSize: 14 }}>
              {serverError}
            </Box>
          )}

          <Button type="submit" variant="contained" size="large" sx={{ mt: 0.5, py: 1.2 }} disabled={!canSubmit}>
            {loading ? "Signing in..." : "LOGIN"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
