"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Save,
  Loader2,
  Globe,
  Shield,
  Users,
  Home,
  AlertTriangle,
} from "lucide-react";

const systemConfigSchema = z.object({
  platformName: z
    .string()
    .min(2, "Platform name must be at least 2 characters"),
  platformDescription: z.string().optional(),
  supportEmail: z.string().email("Invalid email address"),
  maxPropertiesPerAgent: z
    .number()
    .min(1, "Must be at least 1")
    .max(1000, "Cannot exceed 1000"),
  autoApproveProperties: z.boolean(),
  requirePropertyVerification: z.boolean(),
  allowPublicRegistration: z.boolean(),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().optional(),
  maxImageUploadSize: z
    .number()
    .min(1, "Must be at least 1 MB")
    .max(50, "Cannot exceed 50 MB"),
});

type SystemConfigFormData = z.infer<typeof systemConfigSchema>;

export function SuperAdminSystemConfig() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const form = useForm<SystemConfigFormData>({
    resolver: zodResolver(systemConfigSchema),
    defaultValues: {
      platformName: "UbiGroup Real Estate Platform",
      platformDescription:
        "A comprehensive real estate management platform for agencies and agents.",
      supportEmail: "support@ubigroup.com",
      maxPropertiesPerAgent: 100,
      autoApproveProperties: false,
      requirePropertyVerification: true,
      allowPublicRegistration: false,
      maintenanceMode: false,
      maintenanceMessage:
        "The platform is currently under maintenance. Please check back later.",
      maxImageUploadSize: 10,
    },
  });

  const onSubmit = async () => {
    try {
      setIsLoading(true);

      // In a real implementation, this would call an API
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      toast({
        title: "Settings Saved",
        description: "System configuration has been updated successfully.",
      });

      setLastSaved(new Date());
    } catch {
      toast({
        title: "Error",
        description: "Failed to save system configuration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    form.reset();
    toast({
      title: "Settings Reset",
      description: "Configuration has been reset to default values.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Configuration</h2>
          <p className="text-muted-foreground">
            Manage platform-wide settings and configurations
          </p>
        </div>
        {lastSaved && (
          <Badge variant="outline" className="text-green-600 border-green-200">
            Last saved: {lastSaved.toLocaleTimeString()}
          </Badge>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Platform Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Platform Settings
              </CardTitle>
              <CardDescription>
                Basic platform information and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="platformName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="UbiGroup Real Estate Platform"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The name displayed across the platform
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="platformDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Platform Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="A comprehensive real estate management platform..."
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief description shown on public pages
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="supportEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Support Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="support@ubigroup.com"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Email address for user support inquiries
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Property Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Property Management
              </CardTitle>
              <CardDescription>
                Configure property listing and approval settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="maxPropertiesPerAgent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Properties per Agent</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of properties an agent can list
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="autoApproveProperties"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Auto-approve Properties
                      </FormLabel>
                      <FormDescription>
                        Automatically approve property listings without manual
                        review
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirePropertyVerification"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Require Property Verification
                      </FormLabel>
                      <FormDescription>
                        Require agents to provide verification documents for
                        properties
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxImageUploadSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Image Upload Size (MB)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum file size for property image uploads
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Configure user registration and access settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="allowPublicRegistration"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Allow Public Registration
                      </FormLabel>
                      <FormDescription>
                        Allow users to register without invitation (agents and
                        agency admins)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* System Maintenance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                System Maintenance
              </CardTitle>
              <CardDescription>
                Configure system maintenance settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="maintenanceMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        Maintenance Mode
                      </FormLabel>
                      <FormDescription>
                        Enable maintenance mode to prevent user access during
                        updates
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {form.watch("maintenanceMode") && (
                <FormField
                  control={form.control}
                  name="maintenanceMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maintenance Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="The platform is currently under maintenance..."
                          {...field}
                          rows={3}
                        />
                      </FormControl>
                      <FormDescription>
                        Message displayed to users during maintenance
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Reset to Defaults
                </Button>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Configuration
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </div>
  );
}
