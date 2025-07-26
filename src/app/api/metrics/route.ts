import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { UserRole, PropertyStatus } from "@prisma/client";
import { authenticateUser } from "@/lib/auth/rbac";

// GET - Fetch dashboard metrics based on user role
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const { user, error: authError } = await authenticateUser();
    if (!user) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      );
    }

    let metrics: any = {};

    if (user.role === UserRole.SUPER_ADMIN) {
      // Super Admin metrics - platform-wide statistics
      const [
        totalAgencies,
        activeAgencies,
        totalUsers,
        totalAgents,
        totalAgencyAdmins,
        totalProperties,
        approvedProperties,
        pendingProperties,
        rejectedProperties,
        recentActivities,
      ] = await Promise.all([
        prisma.agency.count(),
        prisma.agency.count({ where: { active: true } }),
        prisma.user.count({ where: { role: { not: UserRole.SUPER_ADMIN } } }),
        prisma.user.count({ where: { role: UserRole.AGENT } }),
        prisma.user.count({ where: { role: UserRole.AGENCY_ADMIN } }),
        prisma.property.count(),
        prisma.property.count({ where: { status: PropertyStatus.APPROVED } }),
        prisma.property.count({ where: { status: PropertyStatus.PENDING } }),
        prisma.property.count({ where: { status: PropertyStatus.REJECTED } }),
        // Recent activities - latest properties and users
        prisma.property.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            agent: { select: { firstName: true, lastName: true } },
            agency: { select: { name: true } },
          },
        }),
      ]);

      metrics = {
        platformStats: {
          totalAgencies,
          activeAgencies,
          totalUsers,
          totalAgents,
          totalAgencyAdmins,
        },
        propertyStats: {
          totalProperties,
          approvedProperties,
          pendingProperties,
          rejectedProperties,
          approvalRate:
            totalProperties > 0
              ? Math.round((approvedProperties / totalProperties) * 100)
              : 0,
        },
        recentActivities: recentActivities.map((property) => ({
          type: "property_created",
          id: property.id,
          title: property.title,
          agent: `${property.agent.firstName} ${property.agent.lastName}`,
          agency: property.agency.name,
          status: property.status,
          createdAt: property.createdAt,
        })),
      };
    } else if (user.role === UserRole.AGENCY_ADMIN) {
      // Agency Admin metrics - agency-specific statistics
      const [
        agencyInfo,
        totalAgents,
        activeAgents,
        totalProperties,
        approvedProperties,
        pendingProperties,
        rejectedProperties,
        topAgents,
        recentProperties,
      ] = await Promise.all([
        prisma.agency.findUnique({
          where: { id: user.agencyId! },
          select: { name: true, logoUrl: true },
        }),
        prisma.user.count({
          where: {
            agencyId: user.agencyId!,
            role: UserRole.AGENT,
          },
        }),
        prisma.user.count({
          where: {
            agencyId: user.agencyId!,
            role: UserRole.AGENT,
            active: true,
          },
        }),
        prisma.property.count({ where: { agencyId: user.agencyId! } }),
        prisma.property.count({
          where: {
            agencyId: user.agencyId!,
            status: PropertyStatus.APPROVED,
          },
        }),
        prisma.property.count({
          where: {
            agencyId: user.agencyId!,
            status: PropertyStatus.PENDING,
          },
        }),
        prisma.property.count({
          where: {
            agencyId: user.agencyId!,
            status: PropertyStatus.REJECTED,
          },
        }),
        // Top agents by property count
        prisma.user.findMany({
          where: {
            agencyId: user.agencyId!,
            role: UserRole.AGENT,
          },
          include: {
            _count: {
              select: { properties: true },
            },
          },
          orderBy: {
            properties: { _count: "desc" },
          },
          take: 5,
        }),
        // Recent properties from agency
        prisma.property.findMany({
          where: { agencyId: user.agencyId! },
          take: 5,
          orderBy: { createdAt: "desc" },
          include: {
            agent: { select: { firstName: true, lastName: true } },
          },
        }),
      ]);

      metrics = {
        agencyInfo,
        agentStats: {
          totalAgents,
          activeAgents,
        },
        propertyStats: {
          totalProperties,
          approvedProperties,
          pendingProperties,
          rejectedProperties,
          approvalRate:
            totalProperties > 0
              ? Math.round((approvedProperties / totalProperties) * 100)
              : 0,
        },
        topAgents: topAgents.map((agent) => ({
          id: agent.id,
          name: `${agent.firstName} ${agent.lastName}`,
          propertiesCount: agent._count.properties,
          active: agent.active,
        })),
        recentProperties: recentProperties.map((property) => ({
          id: property.id,
          title: property.title,
          agent: `${property.agent.firstName} ${property.agent.lastName}`,
          status: property.status,
          createdAt: property.createdAt,
        })),
      };
    } else if (user.role === UserRole.AGENT) {
      // Agent metrics - personal statistics
      const [
        totalProperties,
        approvedProperties,
        pendingProperties,
        rejectedProperties,
        recentProperties,
        propertyViews, // This would require a views tracking system
      ] = await Promise.all([
        prisma.property.count({ where: { agentId: user.id } }),
        prisma.property.count({
          where: {
            agentId: user.id,
            status: PropertyStatus.APPROVED,
          },
        }),
        prisma.property.count({
          where: {
            agentId: user.id,
            status: PropertyStatus.PENDING,
          },
        }),
        prisma.property.count({
          where: {
            agentId: user.id,
            status: PropertyStatus.REJECTED,
          },
        }),
        prisma.property.findMany({
          where: { agentId: user.id },
          take: 5,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            title: true,
            status: true,
            price: true,
            transactionType: true,
            createdAt: true,
          },
        }),
        // Placeholder for property views - would need view tracking implementation
        Promise.resolve(0),
      ]);

      metrics = {
        personalStats: {
          totalProperties,
          approvedProperties,
          pendingProperties,
          rejectedProperties,
          approvalRate:
            totalProperties > 0
              ? Math.round((approvedProperties / totalProperties) * 100)
              : 0,
          totalViews: propertyViews, // Placeholder
        },
        recentProperties: recentProperties.map((property) => ({
          id: property.id,
          title: property.title,
          status: property.status,
          price: property.price,
          transactionType: property.transactionType,
          createdAt: property.createdAt,
        })),
        performanceInsights: {
          averageApprovalTime: "2.5 days", // Placeholder - would calculate from actual data
          mostPopularPropertyType: "APARTMENT", // Placeholder - would calculate from data
          averagePropertyPrice:
            approvedProperties > 0
              ? await prisma.property
                  .aggregate({
                    where: {
                      agentId: user.id,
                      status: PropertyStatus.APPROVED,
                    },
                    _avg: { price: true },
                  })
                  .then((result) => Math.round(result._avg.price || 0))
              : 0,
        },
      };
    }

    return NextResponse.json({ metrics });
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json(
      { error: "Error fetching metrics" },
      { status: 500 }
    );
  }
}
