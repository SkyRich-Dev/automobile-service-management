import { Box, Typography, Card, CardContent } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Link } from "wouter";
import { Button } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "grey.50",
      }}
      data-testid="page-not-found"
    >
      <Card sx={{ maxWidth: 400, mx: 2 }} elevation={2}>
        <CardContent sx={{ pt: 4, textAlign: "center" }}>
          <ErrorOutlineIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            404
          </Typography>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Page Not Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </Typography>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Button variant="contained" startIcon={<HomeIcon />} data-testid="button-go-home">
              Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </Box>
  );
}
