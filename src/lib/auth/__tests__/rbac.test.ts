import { UserRole } from "@prisma/client";
import {
  hasRole,
  belongsToAgency,
  canAccessAgency,
  canManageUsers,
  canManageProperty,
  validateRequestBody,
  validateQueryParams,
  type AuthenticatedUser,
} from "../rbac";

// Mock Next.js cookies
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createRouteHandlerClient: jest.fn(),
}));

// Mock Prisma client
jest.mock("@/lib/prisma", () => ({
  user: {
    findUnique: jest.fn(),
  },
}));

import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@/lib/supabase/client";
import prisma from "@/lib/prisma";

const mockCookies = cookies as jest.MockedFunction<typeof cookies>;
const mockCreateRouteHandlerClient =
  createRouteHandlerClient as jest.MockedFunction<
    typeof createRouteHandlerClient
  >;
const mockPrismaUser = prisma.user as jest.Mocked<typeof prisma.user>;

describe("RBAC Utility Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateRequestBody", () => {
    const mockSchema = {
      safeParse: jest.fn(),
    };

    it("returns parsed data when validation succeeds", () => {
      const inputData = { title: "Test Property", price: 500000 };
      const parsedData = { title: "Test Property", price: 500000 };

      mockSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const result = validateRequestBody(mockSchema as any, inputData);

      expect(result.data).toEqual(parsedData);
      expect(result.error).toBeNull();
      expect(mockSchema.safeParse).toHaveBeenCalledWith(inputData);
    });

    it("returns error when validation fails", () => {
      const inputData = { title: "", price: -1000 };
      const validationError = {
        format: () => ({
          title: { _errors: ["Title is required"] },
          price: { _errors: ["Price must be positive"] },
        }),
      };

      mockSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const result = validateRequestBody(mockSchema as any, inputData);

      expect(result.data).toBeNull();
      expect(result.error).toEqual(
        'Validation failed: {"title":{"_errors":["Title is required"]},"price":{"_errors":["Price must be positive"]}}'
      );
    });
  });

  describe("validateQueryParams", () => {
    const mockSchema = {
      safeParse: jest.fn(),
    };

    it("parses URLSearchParams correctly", () => {
      const searchParams = new URLSearchParams();
      searchParams.append("type", "HOUSE");
      searchParams.append("minPrice", "200000");
      searchParams.append("features[]", "Piscina");
      searchParams.append("features[]", "Jardim");

      const expectedParsedData = {
        type: "HOUSE",
        minPrice: 200000,
        features: ["Piscina", "Jardim"],
      };

      mockSchema.safeParse.mockReturnValue({
        success: true,
        data: expectedParsedData,
      });

      const result = validateQueryParams(mockSchema as any, searchParams);

      expect(result.data).toEqual(expectedParsedData);
      expect(result.error).toBeNull();

      // Verify the parsed object structure
      const calledWith = mockSchema.safeParse.mock.calls[0][0];
      expect(calledWith.type).toBe("HOUSE");
      expect(calledWith.minPrice).toBe("200000");
      expect(calledWith.features).toEqual(["Piscina", "Jardim"]);
    });

    it("handles empty search params", () => {
      const searchParams = new URLSearchParams();

      mockSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      const result = validateQueryParams(mockSchema as any, searchParams);

      expect(result.data).toEqual({});
      expect(result.error).toBeNull();
    });
  });

  describe("canManageProperty", () => {
    const mockProperty = {
      id: "property-123",
      agentId: "agent-456",
      agencyId: "agency-789",
      status: "PENDING",
    };

    it("allows SUPER_ADMIN to manage any property", () => {
      const superAdmin = {
        id: "super-admin-123",
        role: UserRole.SUPER_ADMIN,
        agencyId: "different-agency",
      };

      const result = canManageProperty(superAdmin as any, mockProperty as any);
      expect(result).toBe(true);
    });

    it("allows AGENCY_ADMIN to manage properties from their agency", () => {
      const agencyAdmin = {
        id: "agency-admin-123",
        role: UserRole.AGENCY_ADMIN,
        agencyId: "agency-789",
      };

      const result = canManageProperty(agencyAdmin as any, mockProperty as any);
      expect(result).toBe(true);
    });

    it("denies AGENCY_ADMIN from managing properties from other agencies", () => {
      const agencyAdmin = {
        id: "agency-admin-123",
        role: UserRole.AGENCY_ADMIN,
        agencyId: "different-agency",
      };

      const result = canManageProperty(agencyAdmin as any, mockProperty as any);
      expect(result).toBe(false);
    });

    it("allows AGENT to manage their own properties", () => {
      const agent = {
        id: "agent-456",
        role: UserRole.AGENT,
        agencyId: "agency-789",
      };

      const result = canManageProperty(agent as any, mockProperty as any);
      expect(result).toBe(true);
    });

    it("denies AGENT from managing other agents properties", () => {
      const agent = {
        id: "different-agent",
        role: UserRole.AGENT,
        agencyId: "agency-789",
      };

      const result = canManageProperty(agent as any, mockProperty as any);
      expect(result).toBe(false);
    });
  });

  describe("belongsToAgency", () => {
    it("returns true when user belongs to the specified agency", () => {
      const user = {
        id: "user-123",
        agencyId: "agency-456",
        role: UserRole.AGENT,
      };

      const result = belongsToAgency(user as any, "agency-456");
      expect(result).toBe(true);
    });

    it("returns false when user belongs to a different agency", () => {
      const user = {
        id: "user-123",
        agencyId: "agency-456",
        role: UserRole.AGENT,
      };

      const result = belongsToAgency(user as any, "different-agency");
      expect(result).toBe(false);
    });

    it("returns false when user has no agency", () => {
      const user = {
        id: "user-123",
        agencyId: null,
        role: UserRole.SUPER_ADMIN,
      };

      const result = belongsToAgency(user as any, "agency-456");
      expect(result).toBe(false);
    });

    it("returns false when agencyId is null", () => {
      const user = {
        id: "user-123",
        agencyId: "agency-456",
        role: UserRole.AGENT,
      };

      const result = belongsToAgency(user as any, null);
      expect(result).toBe(false);
    });
  });
});
