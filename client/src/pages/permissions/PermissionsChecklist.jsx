import React, { useState, useEffect } from "react";
import {
  FormGroup,
  FormControlLabel,
  Checkbox,
  Chip,
  Tooltip
} from "@mui/material";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function PermissionsChecklist({ 
  selected = [], 
  onChange, 
  disabled = false,
  compact = false 
}) {
  const [catalog, setCatalog] = useState([]);

  useEffect(() => {
    fetchPermissionsCatalog();
  }, []);

  const fetchPermissionsCatalog = async () => {
    try {
      const res = await fetch(`${API_BASE}/rbac/catalog`, { credentials: "include" });
      if (res.ok) {
        const json = await res.json();
        setCatalog(json.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch permissions catalog:", error);
    }
  };

  const togglePermission = (permKey) => {
    const newPermissions = selected.includes(permKey)
      ? selected.filter(key => key !== permKey)
      : [...selected, permKey];
    onChange(newPermissions);
  };

  return (
    <FormGroup className={compact ? "perm-grid-compact" : "perm-grid"}>
      {catalog.map((p) => (
        <FormControlLabel
          key={p.perm_key}
          control={
            <Checkbox
              checked={selected.includes(p.perm_key)}
              onChange={() => togglePermission(p.perm_key)}
              disabled={disabled}
              id={`permission-${p.perm_key}`}
              name={`permission-${p.perm_key}`}
            />
          }
          label={
            <span className="perm-label">
              <span className="perm-key">{p.perm_key}</span>
              {p.is_readonly_safe && <Chip size="small" className="perm-chip-ok" label="RO-OK" />}
              {p.description && (
                <Tooltip title={p.description} placement="top" arrow>
                  <Chip size="small" className="perm-chip-info" label="מידע" />
                </Tooltip>
              )}
            </span>
          }
        />
      ))}
      {catalog.length === 0 && <div>טוען רשימת הרשאות...</div>}
    </FormGroup>
  );
}