"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Search, UserX, UserCheck, UserPlus, Mail } from "lucide-react";
import {
  useAgencyAgents,
  useCreateAgent,
  useUpdateAgent,
  type UseAgencyAgentsParams,
} from "@/hooks/use-agency-agents";
import { toast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAgentSchema,
  type CreateAgentInput,
} from "@/lib/validations/user";

export function AgencyAdminUserManagement() {
  const [params, setParams] = useState<UseAgencyAgentsParams>({
    page: 1,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data, isLoading, error } = useAgencyAgents(params);
  const createAgentMutation = useCreateAgent();
  const updateAgentMutation = useUpdateAgent();

  const createForm = useForm<CreateAgentInput>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setParams((prev) => ({ ...prev, search: value, page: 1 }));
  };

  const handleStatusFilter = (active: string) => {
    setParams((prev) => ({
      ...prev,
      active: active === "all" ? undefined : active === "true",
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const handleCreateAgent = async (data: CreateAgentInput) => {
    try {
      await createAgentMutation.mutateAsync(data);
      toast({
        title: "Success",
        description:
          "Agent created successfully. They will receive an email to complete their registration.",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create agent",
        variant: "destructive",
      });
    }
  };

  const handleToggleAgentStatus = async (agentId: string, active: boolean) => {
    try {
      await updateAgentMutation.mutateAsync({
        agentId,
        data: { active: !active },
      });
      toast({
        title: "Success",
        description: `Agent ${!active ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update agent status",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">Failed to load agents</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Agent Management</CardTitle>
              <CardDescription>Manage agents in your agency</CardDescription>
            </div>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Agent
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Agent</DialogTitle>
                  <DialogDescription>
                    Add a new agent to your agency. They will receive an email
                    to complete their registration.
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form
                    onSubmit={createForm.handleSubmit(handleCreateAgent)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={createForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={createForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john.doe@example.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsCreateDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createAgentMutation.isPending}
                      >
                        {createAgentMutation.isPending
                          ? "Creating..."
                          : "Create Agent"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search agents..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={
                params.active === undefined ? "all" : params.active.toString()
              }
              onValueChange={handleStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : data?.agents.length === 0 ? (
            <div className="text-center py-10">
              <UserPlus className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-medium">No agents found</h3>
              <p className="text-muted-foreground mb-4">
                {params.active !== undefined || search
                  ? "No agents match your current filters"
                  : "You haven't added any agents yet"}
              </p>
              {!params.active && !search && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Your First Agent
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Properties</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.agents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium">
                                {agent.firstName.charAt(0)}
                                {agent.lastName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium">
                                {agent.firstName} {agent.lastName}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Agent
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{agent.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {agent._count.properties}
                          </span>
                          <span className="text-muted-foreground text-sm ml-1">
                            properties
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={agent.active ? "default" : "secondary"}
                          >
                            {agent.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(agent.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                handleToggleAgentStatus(agent.id, agent.active)
                              }
                              disabled={updateAgentMutation.isPending}
                              className={
                                agent.active
                                  ? "text-destructive hover:text-destructive"
                                  : "text-green-600 hover:text-green-600"
                              }
                            >
                              {agent.active ? (
                                <UserX className="h-4 w-4" />
                              ) : (
                                <UserCheck className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {(data.currentPage - 1) * params.limit! + 1} to{" "}
                    {Math.min(data.currentPage * params.limit!, data.total)} of{" "}
                    {data.total} agents
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.currentPage - 1)}
                      disabled={data.currentPage <= 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {data.currentPage} of {data.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.currentPage + 1)}
                      disabled={data.currentPage >= data.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
