import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, Wrench, Users, Package, IndianRupee, UserCheck, 
  FileText, Bell, Plug, Cpu, Search, Plus, History, 
  Calendar, Clock, Flag, Shield, GitBranch, AlertTriangle, 
  CheckCircle, Activity, ChevronRight, Sliders, Workflow
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface ModuleConfig {
  code: string;
  name: string;
  icon: string;
}

interface DashboardOverview {
  total_configs: number;
  total_workflows: number;
  total_approval_rules: number;
  total_automation_rules: number;
  total_notification_rules: number;
  active_feature_flags: number;
  pending_delegations: number;
  recent_config_changes: Array<{
    entity_type: string;
    entity_name: string;
    action: string;
    performed_by__username: string;
    created_at: string;
  }>;
  system_health: {
    integrations_active: number;
    integrations_error: number;
  };
}

interface FeatureFlag {
  id: number;
  code: string;
  name: string;
  description: string;
  is_enabled: boolean;
  enabled_roles: string[];
  enabled_branches: number[];
  rollout_percentage: number;
}

const iconMap: Record<string, any> = {
  settings: Settings,
  wrench: Wrench,
  users: Users,
  package: Package,
  'indian-rupee': IndianRupee,
  'user-check': UserCheck,
  'file-text': FileText,
  bell: Bell,
  plug: Plug,
  cpu: Cpu,
};

export default function AdminConfig() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModule, setActiveModule] = useState<string>('SYSTEM');

  const { data: overview, isLoading: overviewLoading } = useQuery<DashboardOverview>({
    queryKey: ['/api/admin-config/dashboard/overview/'],
  });

  const { data: modules } = useQuery<{ modules: ModuleConfig[] }>({
    queryKey: ['/api/admin-config/dashboard/modules/'],
  });

  const { data: featureFlags } = useQuery<FeatureFlag[]>({
    queryKey: ['/api/admin-config/feature-flags/'],
  });

  const { data: systemConfigs } = useQuery({
    queryKey: ['/api/admin-config/system-configs/', activeModule],
  });

  const { data: workflows } = useQuery({
    queryKey: ['/api/admin-config/workflows/'],
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['/api/admin-config/audit-logs/'],
  });

  const toggleFlagMutation = useMutation({
    mutationFn: async (flagId: number) => {
      return apiRequest('POST', `/api/admin-config/feature-flags/${flagId}/toggle/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin-config/feature-flags/'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin-config/dashboard/overview/'] });
      toast({ title: t('config.featureFlagToggled', 'Feature flag toggled successfully') });
    }
  });

  const getModuleIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Settings;
    return <Icon className="h-4 w-4" />;
  };

  const filteredModules = modules?.modules?.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.code.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (overviewLoading) {
    return (
      <div className="p-6" data-testid="admin-config-loading">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" data-testid="admin-config-page">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{t('config.title', 'Admin Configuration Center')}</h1>
          <p className="text-muted-foreground">{t('config.subtitle', 'Centralized system configuration and management')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('config.searchSettings', 'Search settings...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
              data-testid="input-search-settings"
            />
          </div>
          <Button variant="outline" size="icon" data-testid="button-history">
            <History className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-configs">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">{t('config.systemConfigs', 'System Configs')}</p>
                <p className="text-2xl font-bold" data-testid="text-total-configs">{overview?.total_configs || 0}</p>
              </div>
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-workflows">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">{t('config.workflows', 'Workflows')}</p>
                <p className="text-2xl font-bold" data-testid="text-total-workflows">{overview?.total_workflows || 0}</p>
              </div>
              <Workflow className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-automation">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">{t('config.automationRules', 'Automation Rules')}</p>
                <p className="text-2xl font-bold" data-testid="text-total-automation">{overview?.total_automation_rules || 0}</p>
              </div>
              <Cpu className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-feature-flags">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm text-muted-foreground">{t('config.activeFeatureFlags', 'Active Feature Flags')}</p>
                <p className="text-2xl font-bold" data-testid="text-active-flags">{overview?.active_feature_flags || 0}</p>
              </div>
              <Flag className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card className="h-full" data-testid="card-modules">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium">{t('config.configurationModules', 'Configuration Modules')}</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-[400px]">
                <div className="space-y-1">
                  {filteredModules.map((module) => (
                    <button
                      key={module.code}
                      onClick={() => setActiveModule(module.code)}
                      className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors hover-elevate ${
                        activeModule === module.code 
                          ? 'bg-primary/10 text-primary' 
                          : ''
                      }`}
                      data-testid={`button-module-${module.code.toLowerCase()}`}
                    >
                      {getModuleIcon(module.icon)}
                      <span className="text-sm font-medium">{module.name}</span>
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Tabs defaultValue="settings" className="space-y-4">
            <TabsList data-testid="tabs-config">
              <TabsTrigger value="settings" data-testid="tab-settings">
                <Sliders className="h-4 w-4 mr-2" />
                {t('config.tabs.settings', 'Settings')}
              </TabsTrigger>
              <TabsTrigger value="workflows" data-testid="tab-workflows">
                <GitBranch className="h-4 w-4 mr-2" />
                {t('config.tabs.workflows', 'Workflows')}
              </TabsTrigger>
              <TabsTrigger value="feature-flags" data-testid="tab-feature-flags">
                <Flag className="h-4 w-4 mr-2" />
                {t('config.tabs.featureFlags', 'Feature Flags')}
              </TabsTrigger>
              <TabsTrigger value="audit" data-testid="tab-audit">
                <History className="h-4 w-4 mr-2" />
                {t('config.tabs.auditLog', 'Audit Log')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="settings" className="space-y-4" data-testid="content-settings">
              <Card>
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">
                      {modules?.modules?.find(m => m.code === activeModule)?.name || t('config.system', 'System')} {t('config.settingsSuffix', 'Settings')}
                    </CardTitle>
                    <CardDescription>{t('config.configureModuleSettings', 'Configure module-specific settings')}</CardDescription>
                  </div>
                  <Button size="sm" data-testid="button-add-config">
                    <Plus className="h-4 w-4 mr-1" />
                    {t('config.addSetting', 'Add Setting')}
                  </Button>
                </CardHeader>
                <CardContent className="p-4">
                  {Array.isArray(systemConfigs) && systemConfigs.length > 0 ? (
                    <div className="space-y-4">
                      {systemConfigs.map((config: any) => (
                        <div 
                          key={config.id} 
                          className="flex items-center justify-between gap-4 p-3 border rounded-md"
                          data-testid={`config-item-${config.id}`}
                        >
                          <div className="flex-1">
                            <p className="font-medium">{config.key}</p>
                            <p className="text-sm text-muted-foreground">{config.description}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{config.value_type}</Badge>
                            <Badge variant="secondary">v{config.version}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{t('config.noConfigsYet', 'No configurations for this module yet')}</p>
                      <p className="text-sm">{t('config.addFirstSetting', 'Add your first setting to get started')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workflows" className="space-y-4" data-testid="content-workflows">
              <Card>
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{t('config.workflowConfigurations', 'Workflow Configurations')}</CardTitle>
                    <CardDescription>{t('config.defineManageWorkflows', 'Define and manage service workflows')}</CardDescription>
                  </div>
                  <Button size="sm" data-testid="button-add-workflow">
                    <Plus className="h-4 w-4 mr-1" />
                    {t('config.createWorkflow', 'Create Workflow')}
                  </Button>
                </CardHeader>
                <CardContent className="p-4">
                  {Array.isArray(workflows) && workflows.length > 0 ? (
                    <div className="space-y-4">
                      {workflows.map((wf: any) => (
                        <div 
                          key={wf.id} 
                          className="flex items-center justify-between gap-4 p-4 border rounded-md hover-elevate cursor-pointer"
                          data-testid={`workflow-item-${wf.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-md">
                              <GitBranch className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{wf.name}</p>
                              <p className="text-sm text-muted-foreground">{wf.workflow_type}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={wf.is_active ? 'default' : 'secondary'}>
                              {wf.is_active ? t('common.active', 'Active') : t('common.inactive', 'Inactive')}
                            </Badge>
                            <Badge variant="outline">{wf.stages?.length || 0} {t('config.stages', 'stages')}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <GitBranch className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{t('config.noWorkflowsYet', 'No workflows configured yet')}</p>
                      <p className="text-sm">{t('config.createFirstWorkflow', 'Create your first workflow to manage service processes')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feature-flags" className="space-y-4" data-testid="content-feature-flags">
              <Card>
                <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{t('config.featureFlags', 'Feature Flags')}</CardTitle>
                    <CardDescription>{t('config.controlFeatureRollout', 'Control feature rollout and availability')}</CardDescription>
                  </div>
                  <Button size="sm" data-testid="button-add-flag">
                    <Plus className="h-4 w-4 mr-1" />
                    {t('config.addFlag', 'Add Flag')}
                  </Button>
                </CardHeader>
                <CardContent className="p-4">
                  {featureFlags && featureFlags.length > 0 ? (
                    <div className="space-y-4">
                      {featureFlags.map((flag) => (
                        <div 
                          key={flag.id} 
                          className="flex items-center justify-between gap-4 p-4 border rounded-md"
                          data-testid={`flag-item-${flag.id}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-md ${flag.is_enabled ? 'bg-green-500/10' : 'bg-muted'}`}>
                              <Flag className={`h-5 w-5 ${flag.is_enabled ? 'text-green-600' : 'text-muted-foreground'}`} />
                            </div>
                            <div>
                              <p className="font-medium">{flag.name}</p>
                              <p className="text-sm text-muted-foreground">{flag.code}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {flag.rollout_percentage < 100 && (
                              <Badge variant="outline">{flag.rollout_percentage}% {t('config.rollout', 'rollout')}</Badge>
                            )}
                            <Switch
                              checked={flag.is_enabled}
                              onCheckedChange={() => toggleFlagMutation.mutate(flag.id)}
                              data-testid={`switch-flag-${flag.id}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Flag className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{t('config.noFeatureFlagsDefined', 'No feature flags defined')}</p>
                      <p className="text-sm">{t('config.createFeatureFlagsToControl', 'Create feature flags to control feature availability')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audit" className="space-y-4" data-testid="content-audit">
              <Card>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">{t('config.configurationAuditLog', 'Configuration Audit Log')}</CardTitle>
                  <CardDescription>{t('config.trackAllConfigChanges', 'Track all configuration changes')}</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {Array.isArray(auditLogs) && auditLogs.length > 0 ? (
                    <div className="space-y-3">
                      {auditLogs.slice(0, 20).map((log: any) => (
                        <div 
                          key={log.id} 
                          className="flex items-start gap-3 p-3 border-l-2 border-muted"
                          data-testid={`audit-item-${log.id}`}
                        >
                          <div className="p-1.5 bg-muted rounded-full mt-0.5">
                            <Activity className="h-3 w-3" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{log.entity_name}</span>
                              <Badge variant="outline" className="text-xs">{log.entity_type}</Badge>
                              <Badge 
                                variant={log.action === 'CREATE' ? 'default' : log.action === 'DELETE' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {log.action}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {t('config.byUser', 'by')} {log.performed_by_name} {t('config.atTime', 'at')} {new Date(log.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{t('config.noAuditLogsAvailable', 'No audit logs available')}</p>
                      <p className="text-sm">{t('config.configChangesTrackedHere', 'Configuration changes will be tracked here')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card data-testid="card-system-health">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-4 w-4" />
              {t('config.systemHealth', 'System Health')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{t('config.activeIntegrations', 'Active Integrations')}</span>
                </div>
                <span className="font-medium" data-testid="text-integrations-active">
                  {overview?.system_health?.integrations_active || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(overview?.system_health?.integrations_error || 0) > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  <span>{t('config.integrationErrors', 'Integration Errors')}</span>
                </div>
                <span className="font-medium" data-testid="text-integrations-error">
                  {overview?.system_health?.integrations_error || 0}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span>{t('config.activeDelegations', 'Active Delegations')}</span>
                </div>
                <span className="font-medium" data-testid="text-delegations">
                  {overview?.pending_delegations || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-purple-500" />
                  <span>{t('config.notificationRules', 'Notification Rules')}</span>
                </div>
                <span className="font-medium" data-testid="text-notification-rules">
                  {overview?.total_notification_rules || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-recent-changes">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              {t('config.recentChanges', 'Recent Changes')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {overview?.recent_config_changes && overview.recent_config_changes.length > 0 ? (
              <div className="space-y-3">
                {overview.recent_config_changes.slice(0, 5).map((change, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2 text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant="outline" className="text-xs shrink-0">{change.entity_type}</Badge>
                      <span className="truncate">{change.entity_name}</span>
                    </div>
                    <span className="text-muted-foreground text-xs shrink-0">
                      {change.performed_by__username}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <p className="text-sm">{t('config.noRecentChanges', 'No recent changes')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
