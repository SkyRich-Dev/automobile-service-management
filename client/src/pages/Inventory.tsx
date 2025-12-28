import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { useParts, useCreatePart } from "@/hooks/use-inventory";
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
  LinearProgress,
  Alert,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import WarningIcon from "@mui/icons-material/Warning";

export default function Inventory() {
  const { data: parts, isLoading } = useParts();
  const createPart = useCreatePart();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    stock: 0,
    min_stock: 5,
    price: "0",
    reserved: 0,
    location: "",
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
    createPart.mutate(formData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({ name: "", sku: "", category: "", stock: 0, min_stock: 5, price: "0", reserved: 0, location: "" });
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
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "grey.50" }} data-testid="page-inventory">
      <AppSidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 4, ml: "240px" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Inventory
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage parts, stock levels, and procurement.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} data-testid="button-add-part">
            Add Part
          </Button>
        </Box>

        <Grid container spacing={3}>
          {parts?.map((part) => {
            const stockPercentage = Math.min((part.stock / (part.min_stock * 3)) * 100, 100);
            const isLow = part.stock <= part.min_stock;

            return (
              <Grid item xs={12} sm={6} md={4} key={part.id}>
                <Card elevation={2} data-testid={`card-part-${part.id}`}>
                  <CardContent>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {part.name}
                        </Typography>
                        <Typography variant="caption" fontFamily="monospace" color="text.secondary">
                          {part.sku}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="h6" fontWeight="bold">
                          ${part.price}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {part.category}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          In Stock
                        </Typography>
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          sx={{ display: "flex", alignItems: "center", color: isLow ? "error.main" : "text.primary" }}
                        >
                          {isLow && <WarningIcon sx={{ fontSize: 14, mr: 0.5 }} />}
                          {part.stock}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={stockPercentage}
                        color={isLow ? "error" : "primary"}
                        sx={{ height: 8, borderRadius: 1 }}
                      />
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1, borderTop: 1, borderColor: "divider" }}>
                      <Typography variant="caption" color="text.secondary">
                        Min: {part.min_stock}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Reserved: {part.reserved}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>Add New Part</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField fullWidth label="Part Name" name="name" value={formData.name} onChange={handleChange} required />
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField fullWidth label="SKU" name="sku" value={formData.sku} onChange={handleChange} required />
                  <TextField fullWidth label="Category" name="category" value={formData.category} onChange={handleChange} required />
                </Box>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <TextField fullWidth label="Stock" name="stock" type="number" value={formData.stock} onChange={handleChange} />
                  <TextField fullWidth label="Min Stock" name="min_stock" type="number" value={formData.min_stock} onChange={handleChange} />
                  <TextField fullWidth label="Price ($)" name="price" value={formData.price} onChange={handleChange} />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={createPart.isPending}>
                {createPart.isPending ? <CircularProgress size={20} /> : "Save Part"}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </Box>
  );
}
