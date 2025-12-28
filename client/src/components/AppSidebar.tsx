import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Divider,
  Button,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BuildIcon from "@mui/icons-material/Build";
import InventoryIcon from "@mui/icons-material/Inventory";
import PeopleIcon from "@mui/icons-material/People";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import BadgeIcon from "@mui/icons-material/Badge";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";

const drawerWidth = 240;

const menuItems = [
  { text: "Dashboard", icon: DashboardIcon, path: "/" },
  { text: "Service", icon: BuildIcon, path: "/service" },
  { text: "Inventory", icon: InventoryIcon, path: "/inventory" },
  { text: "CRM", icon: PeopleIcon, path: "/crm" },
  { text: "Accounts", icon: AccountBalanceIcon, path: "/accounts" },
  { text: "HRMS", icon: BadgeIcon, path: "/hrms" },
  { text: "Settings", icon: SettingsIcon, path: "/settings" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          bgcolor: "grey.900",
          color: "white",
        },
      }}
    >
      <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            bgcolor: "primary.main",
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <BuildIcon sx={{ color: "white" }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight="bold">
            AutoServ
          </Typography>
          <Typography variant="caption" sx={{ color: "grey.400" }}>
            Enterprise
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "grey.700" }} />

      <List sx={{ px: 1, py: 2, flexGrow: 1 }}>
        {menuItems.map((item) => {
          const isActive = location === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <Link href={item.path} style={{ width: "100%", textDecoration: "none" }}>
                <ListItemButton
                  selected={isActive}
                  sx={{
                    borderRadius: 1,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      "&:hover": {
                        bgcolor: "primary.dark",
                      },
                    },
                    "&:hover": {
                      bgcolor: "grey.800",
                    },
                  }}
                  data-testid={`nav-${item.text.toLowerCase()}`}
                >
                  <ListItemIcon sx={{ color: isActive ? "white" : "grey.400", minWidth: 40 }}>
                    <item.icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontSize: 14,
                      color: isActive ? "white" : "grey.300",
                    }}
                  />
                </ListItemButton>
              </Link>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "grey.700" }} />

      <Box sx={{ p: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main" }}>
            {user?.first_name?.[0] || user?.username?.[0] || "U"}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" fontWeight="medium" noWrap>
              {user?.first_name || user?.username || "User"}
            </Typography>
            <Typography variant="caption" sx={{ color: "grey.400" }} noWrap>
              {user?.email || ""}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          size="small"
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={() => logout()}
          sx={{
            borderColor: "grey.600",
            color: "grey.300",
            "&:hover": {
              borderColor: "grey.500",
              bgcolor: "grey.800",
            },
          }}
          data-testid="button-logout"
        >
          Logout
        </Button>
      </Box>
    </Drawer>
  );
}
