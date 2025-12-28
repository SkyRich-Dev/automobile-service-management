import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Tabs,
  Tab,
} from "@mui/material";
import BuildIcon from "@mui/icons-material/Build";

export default function Login() {
  const [, setLocation] = useLocation();
  const { loginAsync, registerAsync, isLoggingIn, isRegistering, loginError, registerError } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginAsync({ username: formData.username, password: formData.password });
      setLocation("/");
    } catch (err) {
      // Error handled by hook
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerAsync({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
      });
      setLocation("/");
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <Box
      data-testid="page-login"
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.50",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 400, px: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              bgcolor: "primary.main",
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: 4,
            }}
          >
            <BuildIcon sx={{ fontSize: 32, color: "white" }} />
          </Box>
        </Box>

        <Card elevation={6}>
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                textAlign: "center",
                fontWeight: "bold",
                mb: 1,
                background: "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              AutoServ
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center", mb: 3 }}
            >
              Enterprise Automotive Management
            </Typography>

            <Tabs value={tabIndex} onChange={handleTabChange} variant="fullWidth" sx={{ mb: 3 }}>
              <Tab label="Login" data-testid="tab-login" />
              <Tab label="Register" data-testid="tab-register" />
            </Tabs>

            {tabIndex === 0 && (
              <Box component="form" onSubmit={handleLogin}>
                {loginError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {loginError.message}
                  </Alert>
                )}
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  margin="normal"
                  required
                  autoComplete="username"
                  inputProps={{ "data-testid": "input-username" }}
                />
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  margin="normal"
                  required
                  autoComplete="current-password"
                  inputProps={{ "data-testid": "input-password" }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isLoggingIn}
                  sx={{ mt: 3, py: 1.5 }}
                  data-testid="button-login"
                >
                  {isLoggingIn ? <CircularProgress size={24} color="inherit" /> : "Sign In"}
                </Button>
              </Box>
            )}

            {tabIndex === 1 && (
              <Box component="form" onSubmit={handleRegister}>
                {registerError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {registerError.message}
                  </Alert>
                )}
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  margin="normal"
                  required
                  inputProps={{ "data-testid": "input-register-username" }}
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                  required
                  inputProps={{ "data-testid": "input-register-email" }}
                />
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    margin="normal"
                    inputProps={{ "data-testid": "input-register-firstname" }}
                  />
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    margin="normal"
                    inputProps={{ "data-testid": "input-register-lastname" }}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  margin="normal"
                  required
                  helperText="Minimum 6 characters"
                  inputProps={{ "data-testid": "input-register-password" }}
                />
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={isRegistering}
                  sx={{ mt: 3, py: 1.5 }}
                  data-testid="button-register"
                >
                  {isRegistering ? <CircularProgress size={24} color="inherit" /> : "Create Account"}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mt: 4 }}
        >
          2024 AutoServ Enterprise. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
}
