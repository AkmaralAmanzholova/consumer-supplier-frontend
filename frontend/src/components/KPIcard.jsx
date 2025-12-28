import React from "react";
import { Box, Paper, Typography } from "@mui/material";

export default function KPICard({ title, value, sublabel, icon, gradient }) {
    return (
      <Paper
        elevation={12}
        sx={{
          p: 3,
          borderRadius: 3,
          minHeight: 170,
          minWidth: 250,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundImage:
            gradient ||
            "linear-gradient(135deg, rgba(59,130,246,.12), rgba(147,51,234,.10))",
          backdropFilter: "blur(6px)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          {icon && <Box sx={{ fontSize: '30px', opacity: 0.8 }}>{icon}</Box>}
          <Typography variant="subtitle2" color="text.secondary">
            {title}
          </Typography>
        </Box>
  
        <Typography variant="h4" sx={{ fontSize: 60, fontWeight: 700, lineHeight: 1.1 }}>
          {value}
        </Typography>
  
        {sublabel && (
          <Typography variant="caption" color="text.secondary">
            {sublabel}
          </Typography>
        )}
      </Paper>
    );
  }