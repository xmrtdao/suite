import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield, Users, Settings, Crown, UserCog, Key, Cloud, Plug } from 'lucide-react';
import { CredentialsManager } from '@/components/admin/CredentialsManager';

// GoogleCloudConnect removed - now part of unified login flow

type AppRole = 'user' | 'contributor' | 'moderator' | 'admin' | 'superadmin';
type TierAssignmentStatus = 'active' | 'pending' | 'canceled' | 'past_due' | 'trialing' | null;

interface TierCatalogItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  pricing_model: 'flat' | 'metered' | 'one_time' | 'custom';
  amount_cents: number | null;
  currency: string | null;
  interval: 'day' | 'week' | 'month' | 'year' | null;
  features: unknown;
}

interface UserTierView {
  assignmentId: string | null;
  status: TierAssignmentStatus;
  startsAt: string | null;
  endsAt: string | null;
  source: string | null;
  tier: TierCatalogItem | null;
  isLegacyFallback: boolean;
  legacyMembershipTier: string | null;
}

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
  roles: AppRole[];
  tierView: UserTierView;
}

const ROLE_COLORS: Record<AppRole, string> = {
  user: 'bg-slate-500',
  contributor: 'bg-blue-500',
  moderator: 'bg-green-500',
  admin: 'bg-orange-500',
  superadmin: 'bg-purple-500',
};

const ROLE_LABELS: Record<AppRole, string> = {
  user: 'User',
  contributor: 'Contributor',
  moderator: 'Moderator',
  admin: 'Admin',
  superadmin: 'Super Admin',
};

const TIER_STATUS_COLORS: Record<Exclude<TierAssignmentStatus, null>, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  pending: 'secondary',
  canceled: 'outline',
  past_due: 'destructive',
  trialing: 'secondary',
};

const formatDate = (value: string | null): string => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
};

const getCurrentAssignmentByUser = (assignments: any[]): Map<string, any> => {
  const nowIso = new Date().toISOString();
  const map = new Map<string, any>();

  const valid = assignments
    .filter((assignment) => {
      const hasUser = Boolean(assignment?.user_id);
      const hasValidStatus = ['active', 'pending', 'past_due', 'trialing'].includes(assignment?.status);
      const hasNotEnded = !assignment?.ends_at || assignment.ends_at > nowIso;
      return hasUser && hasValidStatus && hasNotEnded;
    })
    .sort((a, b) => {
      const aStart = a?.starts_at ? Date.parse(a.starts_at) : 0;
      const bStart = b?.starts_at ? Date.parse(b.starts_at) : 0;
      return bStart - aStart;
    });

  for (const assignment of valid) {
    if (!map.has(assignment.user_id)) {
      map.set(assignment.user_id, assignment);
    }
  }

  return map;
};

export default function Admin() {
  const navigate = useNavigate();
  const { user, isAdmin, isSuperadmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [tierCatalog, setTierCatalog] = useState<TierCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updatingTierUserId, setUpdatingTierUserId] = useState<string | null>(null);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [authLoading, isAdmin, navigate]);

  // Fetch all users with roles + tier assignments
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;

      try {
        const rawSupabase = supabase as any;

        const [profilesResult, rolesResult, tiersResult] = await Promise.all([
          rawSupabase
            .from('profiles')
            .select('id, email, full_name, display_name, avatar_url, is_active, created_at, last_login_at, membership_tier')
            .order('created_at', { ascending: false }),
          rawSupabase.from('user_roles').select('user_id, role'),
          rawSupabase
            .from('user_tiers')
            .select('id, slug, name, description, pricing_model, amount_cents, currency, interval, features')
            .eq('is_active', true)
            .order('amount_cents', { ascending: true, nullsFirst: true }),
        ]);

        if (profilesResult.error) throw profilesResult.error;
        if (rolesResult.error) throw rolesResult.error;
        if (tiersResult.error) throw tiersResult.error;

        const { data: assignmentsWithSource, error: assignmentWithSourceError } = await rawSupabase
          .from('user_tier_assignments')
          .select(`
            id,
            user_id,
            status,
            starts_at,
            ends_at,
            source,
            user_tiers:tier_id (
              id,
              slug,
              name,
              description,
              pricing_model,
              amount_cents,
              currency,
              interval,
              features
            )
          `)
          .in('status', ['active', 'pending', 'past_due', 'trialing'])
          .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`);

        let assignmentRecords = assignmentsWithSource || [];

        if (assignmentWithSourceError) {
          const { data: assignmentsFallback, error: assignmentFallbackError } = await rawSupabase
            .from('user_tier_assignments')
            .select(`
              id,
              user_id,
              status,
              starts_at,
              ends_at,
              user_tiers:tier_id (
                id,
                slug,
                name,
                description,
                pricing_model,
                amount_cents,
                currency,
                interval,
                features
              )
            `)
            .in('status', ['active', 'pending', 'past_due', 'trialing'])
            .or(`ends_at.is.null,ends_at.gt.${new Date().toISOString()}`);

          if (assignmentFallbackError) throw assignmentFallbackError;
          assignmentRecords = assignmentsFallback || [];
        }

        const currentAssignments = getCurrentAssignmentByUser(assignmentRecords);

        setTierCatalog(tiersResult.data || []);

        const usersWithRoles: UserWithRoles[] = (profilesResult.data || []).map((profile: any) => {
          const assignment = currentAssignments.get(profile.id);
          const assignmentTier = assignment?.user_tiers || null;
          const tierView: UserTierView = assignment
            ? {
                assignmentId: assignment.id ?? null,
                status: assignment.status ?? null,
                startsAt: assignment.starts_at ?? null,
                endsAt: assignment.ends_at ?? null,
                source: assignment.source ?? null,
                tier: assignmentTier,
                isLegacyFallback: false,
                legacyMembershipTier: null,
              }
            : {
                assignmentId: null,
                status: null,
                startsAt: null,
                endsAt: null,
                source: null,
                tier: null,
                isLegacyFallback: Boolean(profile.membership_tier),
                legacyMembershipTier: profile.membership_tier ?? null,
              };

          return {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            is_active: Boolean(profile.is_active),
            created_at: profile.created_at,
            last_login_at: profile.last_login_at,
            roles: (rolesResult.data || [])
              .filter((role: any) => role.user_id === profile.id)
              .map((role: any) => role.role as AppRole),
            tierView,
          };
        });

        setUsers(usersWithRoles);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: 'Failed to load users',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, toast]);

  const handleRoleChange = async (userId: string, newRole: AppRole) => {
    if (!isSuperadmin) {
      toast({
        title: 'Permission denied',
        description: 'Only superadmins can modify roles',
        variant: 'destructive',
      });
      return;
    }

    // Prevent self-demotion
    if (userId === user?.id && newRole !== 'superadmin') {
      toast({
        title: 'Cannot modify own role',
        description: 'You cannot demote yourself',
        variant: 'destructive',
      });
      return;
    }

    setUpdatingUserId(userId);

    try {
      // Remove all existing roles for this user
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // Add the new role (and user role if not 'user')
      const rolesToInsert = [{ user_id: userId, role: 'user' as AppRole, granted_by: user?.id }];

      if (newRole !== 'user') {
        rolesToInsert.push({ user_id: userId, role: newRole, granted_by: user?.id });
      }

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert(rolesToInsert);

      if (insertError) throw insertError;

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, roles: newRole === 'user' ? ['user'] : ['user', newRole] }
            : u
        )
      );

      toast({
        title: 'Role updated',
        description: `User role changed to ${ROLE_LABELS[newRole]}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update role',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleTierChange = async (targetUserId: string, selectedTierId: string) => {
    if (!isAdmin) {
      toast({
        title: 'Permission denied',
        description: 'Only admins can modify billing tiers',
        variant: 'destructive',
      });
      return;
    }

    const targetUser = users.find((candidate) => candidate.id === targetUserId);
    if (!targetUser) {
      return;
    }

    const currentTierId = targetUser.tierView.tier?.id || null;
    if (currentTierId === selectedTierId) {
      return;
    }

    setUpdatingTierUserId(targetUserId);

    try {
      const rawSupabase = supabase as any;
      const nowIso = new Date().toISOString();

      if (targetUser.tierView.assignmentId) {
        const { error: cancelError } = await rawSupabase
          .from('user_tier_assignments')
          .update({ status: 'canceled', ends_at: nowIso })
          .eq('id', targetUser.tierView.assignmentId);

        if (cancelError) throw cancelError;
      }

      const { data: insertedAssignment, error: insertError } = await rawSupabase
        .from('user_tier_assignments')
        .insert({
          user_id: targetUserId,
          tier_id: selectedTierId,
          status: 'active',
          starts_at: nowIso,
          ends_at: null,
        })
        .select(`
          id,
          user_id,
          status,
          starts_at,
          ends_at,
          source,
          user_tiers:tier_id (
            id,
            slug,
            name,
            description,
            pricing_model,
            amount_cents,
            currency,
            interval,
            features
          )
        `)
        .single();

      if (insertError) throw insertError;

      setUsers((prev) =>
        prev.map((candidate) =>
          candidate.id === targetUserId
            ? {
                ...candidate,
                tierView: {
                  assignmentId: insertedAssignment?.id ?? null,
                  status: insertedAssignment?.status ?? 'active',
                  startsAt: insertedAssignment?.starts_at ?? nowIso,
                  endsAt: insertedAssignment?.ends_at ?? null,
                  source: insertedAssignment?.source ?? 'admin_panel',
                  tier: insertedAssignment?.user_tiers ?? tierCatalog.find((tier) => tier.id === selectedTierId) ?? null,
                  isLegacyFallback: false,
                  legacyMembershipTier: null,
                },
              }
            : candidate
        )
      );

      const selectedTier = tierCatalog.find((tier) => tier.id === selectedTierId);
      toast({
        title: 'Tier updated',
        description: `Billing tier changed to ${selectedTier?.name || 'selected tier'}`,
      });
    } catch (error) {
      console.error('Error updating tier:', error);
      toast({
        title: 'Error',
        description: 'Failed to update billing tier assignment',
        variant: 'destructive',
      });
    } finally {
      setUpdatingTierUserId(null);
    }
  };

  const getHighestRole = (roles: AppRole[]): AppRole => {
    const hierarchy: AppRole[] = ['superadmin', 'admin', 'moderator', 'contributor', 'user'];
    for (const role of hierarchy) {
      if (roles.includes(role)) return role;
    }
    return 'user';
  };

  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const stats = useMemo(
    () => ({
      total: users.length,
      superadmins: users.filter((u) => u.roles.includes('superadmin')).length,
      admins: users.filter((u) => u.roles.includes('admin')).length,
      active: users.filter((u) => u.is_active).length,
    }),
    [users]
  );

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <main id="main-content" className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage users, credentials, integrations, and system settings
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Crown className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.superadmins}</p>
                <p className="text-sm text-muted-foreground">Super Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <UserCog className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-sm text-muted-foreground">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Settings className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="credentials" className="gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Credentials</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Roles are permission controls; tiers are billing/entitlements from assignment records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Tier Status</TableHead>
                    <TableHead>Tier Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    {isSuperadmin && <TableHead>Role Action</TableHead>}
                    {isAdmin && <TableHead>Tier Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((userItem) => {
                    const highestRole = getHighestRole(userItem.roles);
                    const isCurrentUser = userItem.id === user?.id;
                    const tierStatus = userItem.tierView.status;

                    return (
                      <TableRow key={userItem.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={userItem.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(userItem.full_name, userItem.email)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {userItem.display_name || userItem.full_name || 'Anonymous'}
                                {isCurrentUser && (
                                  <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                                )}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{userItem.email}</TableCell>
                        <TableCell>
                          <Badge className={`${ROLE_COLORS[highestRole]} text-white`}>
                            {ROLE_LABELS[highestRole]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">
                              {userItem.tierView.tier?.name || (userItem.tierView.isLegacyFallback ? `legacy:${userItem.tierView.legacyMembershipTier}` : 'No assignment')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {userItem.tierView.tier?.slug || userItem.tierView.source || '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {tierStatus ? (
                            <Badge variant={TIER_STATUS_COLORS[tierStatus]}>{tierStatus}</Badge>
                          ) : userItem.tierView.isLegacyFallback ? (
                            <Badge variant="outline">legacy fallback</Badge>
                          ) : (
                            <Badge variant="outline">none</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          <div>Start: {formatDate(userItem.tierView.startsAt)}</div>
                          <div>End: {formatDate(userItem.tierView.endsAt)}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={userItem.is_active ? 'default' : 'secondary'}>
                            {userItem.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(userItem.created_at).toLocaleDateString()}
                        </TableCell>
                        {isSuperadmin && (
                          <TableCell>
                            <Select
                              value={highestRole}
                              onValueChange={(value) =>
                                handleRoleChange(userItem.id, value as AppRole)
                              }
                              disabled={updatingUserId === userItem.id || isCurrentUser}
                            >
                              <SelectTrigger className="w-36">
                                {updatingUserId === userItem.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="contributor">Contributor</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="superadmin">Super Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                        {isAdmin && (
                          <TableCell>
                            <Select
                              value={userItem.tierView.tier?.id || '__none__'}
                              onValueChange={(value) => {
                                if (value !== '__none__') {
                                  handleTierChange(userItem.id, value);
                                }
                              }}
                              disabled={updatingTierUserId === userItem.id || tierCatalog.length === 0}
                            >
                              <SelectTrigger className="w-44">
                                {updatingTierUserId === userItem.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <SelectValue placeholder="Select tier" />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                {userItem.tierView.tier?.id ? null : (
                                  <SelectItem value="__none__" disabled>
                                    Select tier
                                  </SelectItem>
                                )}
                                {tierCatalog.map((tier) => (
                                  <SelectItem key={tier.id} value={tier.id}>
                                    {tier.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credentials Tab */}
        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                AI & Service Credentials
              </CardTitle>
              <CardDescription>
                API keys powering Eliza and the AI executives. View status and troubleshoot issues.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CredentialsManager />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plug className="h-5 w-5" />
                  OAuth Integrations
                </CardTitle>
                <CardDescription>
                  Connect external services for Eliza to access on your behalf
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Google Cloud OAuth - Now part of unified login flow */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Cloud className="h-4 w-4" />
                    Google Cloud Services
                  </h4>
                  <div className="p-4 bg-muted/50 rounded-lg border border-dashed border-border">
                    <p className="text-sm text-muted-foreground">
                      Google Cloud authorization is now automatically handled during the initial sign-in for admins and super admins.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 max-w-md">
                    Admins are automatically prompted for Gmail, Drive, Sheets, and Calendar access when logging in with Google.
                  </p>
                </div>

                {/* GitHub Integration Info */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub Integration
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    GitHub is configured via Personal Access Token (PAT) stored in Supabase secrets.
                    Check the Credentials tab for current status.
                  </p>
                </div>

                {/* VSCO/Táve Info */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    📸 VSCO Workspace (Táve)
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Táve integration is configured via API key stored in Supabase secrets.
                    Powers Party Favor Photo business operations.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                System settings coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
