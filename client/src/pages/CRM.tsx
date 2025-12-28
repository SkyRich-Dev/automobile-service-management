import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useCustomers, useCreateCustomer } from "@/hooks/use-crm";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Avatar,
  Chip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";

export default function CRM() {
  const { data: customers, isLoading } = useCustomers();
  const createCustomer = useCreateCustomer();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    loyalty_points: 0,
    address: "",
    notes: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCustomer.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({ name: "", email: "", phone: "", loyalty_points: 0, address: "", notes: "" });
      },
    });
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.50" }} data-testid="page-crm">
      <AppSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 4, ml: "240px" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              CRM
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage customer relationships and data.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} data-testid="button-add-customer">
            Add Customer
          </Button>
        </Box>

        <Grid container spacing={3}>
          {customers?.map((customer) => (
            <Grid item xs={12} sm={6} md={4} key={customer.id}>
              <Card elevation={2} data-testid={`card-customer-${customer.id}`}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                    <Avatar sx={{ width: 48, height: 48, bgcolor: "primary.main", fontSize: 20, fontWeight: "bold" }}>
                      {customer.name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" fontWeight="bold">
                        {customer.name}
                      </Typography>
                      <Chip label={`${customer.loyalty_points} Points`} size="small" color="primary" variant="outlined" />
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
                      <EmailIcon sx={{ fontSize: 18 }} />
                      <Typography variant="body2">{customer.email}</Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
                      <PhoneIcon sx={{ fontSize: 18 }} />
                      <Typography variant="body2">{customer.phone}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField fullWidth label="Name" name="name" value={formData.name} onChange={handleChange} required />
                <TextField fullWidth label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
                <TextField fullWidth label="Phone" name="phone" value={formData.phone} onChange={handleChange} required />
                <TextField fullWidth label="Address" name="address" value={formData.address} onChange={handleChange} />
                <TextField fullWidth label="Notes" name="notes" value={formData.notes} onChange={handleChange} multiline rows={2} />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={createCustomer.isPending}>
                {createCustomer.isPending ? <CircularProgress size={20} /> : "Save Customer"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Box>
  );
}
