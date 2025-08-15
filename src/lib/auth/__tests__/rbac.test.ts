import { UserRole } from "@prisma/client";
import {
  belongsToAgency,
  canManageProperty,
  validateRequestBody,
  validateQueryParams,
} from "../rbac";

// Mock Next.js cookies
jest.mock("next/headers", () => ({
  cookies: jest.fn(),
}));

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClientComponentClient: jest.fn(),
}));

// Mock Prisma client
jest.mock("@/lib/prisma", () => ({
  user: {
    findUnique: jest.fn(),
  },
}));

// Test interfaces
interface TestUser {
  id: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  agencyId: string | null;
  active: boolean;
}

interface TestProperty {
  id: string;
  agentId: string;
  agencyId: string;
  status: string;
}

interface MockSchema {
  safeParse: jest.MockedFunction<
    (data: unknown) => {
      success: boolean;
      data?: unknown;
      error?: { errors: Array<{ message: string }> };
    }
  >;
}

describe("RBAC Utility Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("validateRequestBody", () => {
    const mockSchema: MockSchema = {
      safeParse: jest.fn(),
    };

    it("returns parsed data when validation succeeds", () => {
      const inputData = { title: "Test Property", price: 500000 };
      const parsedData = { title: "Test Property", price: 500000 };

      mockSchema.safeParse.mockReturnValue({
        success: true,
        data: parsedData,
      });

      const result = validateRequestBody(mockSchema, inputData);

      expect(result.data).toEqual(parsedData);
      expect(result.error).toBeNull();
      expect(mockSchema.safeParse).toHaveBeenCalledWith(inputData);
    });

    it("returns error when validation fails", () => {
      const inputData = { title: "", price: -1000 };
      const validationError = {
        errors: [
          { message: "Title is required" },
          { message: "Price must be positive" },
        ],
      };

      mockSchema.safeParse.mockReturnValue({
        success: false,
        error: validationError,
      });

      const result = validateRequestBody(mockSchema, inputData);

      expect(result.data).toBeNull();
      expect(result.error).toEqual("Title is required, Price must be positive");
    });
  });

  describe("validateQueryParams", () => {
    const mockSchema: MockSchema = {
      safeParse: jest.fn(),
    };

    it("parses URLSearchParams correctly", () => {
      const searchParams = new URLSearchParams();
      searchParams.append("type", "HOUSE");
      searchParams.append("minPrice", "200000");
      searchParams.append("features[]", "Piscina");
      searchParams.append("features[]", "Jardín");

      const expectedParsedData = {
        type: "HOUSE",
        minPrice: 200000,
        features: ["Piscina", "Jardín"],
      };

      mockSchema.safeParse.mockReturnValue({
        success: true,
        data: expectedParsedData,
      });

      const result = validateQueryParams(mockSchema, searchParams);

      expect(result.data).toEqual(expectedParsedData);
      expect(result.error).toBeNull();

      // Verify the parsed object structure
      const calledWith = mockSchema.safeParse.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(calledWith.type).toBe("HOUSE");
      expect(calledWith.minPrice).toBe("200000");
      expect(calledWith.features).toEqual(["Piscina", "Jardín"]);
    });

    it("handles empty search params", () => {
      const searchParams = new URLSearchParams();

      mockSchema.safeParse.mockReturnValue({
        success: true,
        data: {},
      });

      const result = validateQueryParams(mockSchema, searchParams);

      expect(result.data).toEqual({});
      expect(result.error).toBeNull();
    });
  });

  describe("canManageProperty", () => {
    const mockProperty: TestProperty = {
      id: "property-123",
      agentId: "agent-456",
      agencyId: "agency-789",
      status: "PENDING",
    };

    it("allows SUPER_ADMIN to manage any property", () => {
      const superAdmin: TestUser = {
        id: "super-admin-123",
        userId: "super-admin-123",
        firstName: "Super",
        lastName: "Admin",
        role: UserRole.SUPER_ADMIN,
        agencyId: "different-agency",
        active: true,
      };

      const result = canManageProperty(
        superAdmin,
        mockProperty.agencyId,
        mockProperty.agentId
      );
      expect(result).toBe(true);
    });

    it("allows AGENCY_ADMIN to manage properties from their agency", () => {
      const agencyAdmin: TestUser = {
        id: "agency-admin-123",
        userId: "agency-admin-123",
        firstName: "Agency",
        lastName: "Admin",
        role: UserRole.AGENCY_ADMIN,
        agencyId: "agency-789",
        active: true,
      };

      const result = canManageProperty(
        agencyAdmin,
        mockProperty.agencyId,
        mockProperty.agentId
      );
      expect(result).toBe(true);
    });

    it("denies AGENCY_ADMIN from managing properties from other agencies", () => {
      const agencyAdmin: TestUser = {
        id: "agency-admin-123",
        userId: "agency-admin-123",
        firstName: "Agency",
        lastName: "Admin",
        role: UserRole.AGENCY_ADMIN,
        agencyId: "different-agency",
        active: true,
      };

      const result = canManageProperty(
        agencyAdmin,
        mockProperty.agencyId,
        mockProperty.agentId
      );
      expect(result).toBe(false);
    });

    it("allows AGENT to manage their own properties", () => {
      const agent: TestUser = {
        id: "agent-456",
        userId: "agent-456",
        firstName: "Test",
        lastName: "Agent",
        role: UserRole.AGENT,
        agencyId: "agency-789",
        active: true,
      };

      const result = canManageProperty(
        agent,
        mockProperty.agencyId,
        mockProperty.agentId
      );
      expect(result).toBe(true);
    });

    it("denies AGENT from managing other agents properties", () => {
      const agent: TestUser = {
        id: "different-agent",
        userId: "different-agent",
        firstName: "Different",
        lastName: "Agent",
        role: UserRole.AGENT,
        agencyId: "agency-789",
        active: true,
      };

      const result = canManageProperty(
        agent,
        mockProperty.agencyId,
        mockProperty.agentId
      );
      expect(result).toBe(false);
    });
  });

  describe("belongsToAgency", () => {
    it("returns true when user belongs to the specified agency", () => {
      const user: TestUser = {
        id: "user-123",
        userId: "user-123",
        firstName: "Test",
        lastName: "User",
        role: UserRole.AGENT,
        agencyId: "agency-456",
        active: true,
      };

      const result = belongsToAgency(user, "agency-456");
      expect(result).toBe(true);
    });

    it("returns false when user belongs to a different agency", () => {
      const user: TestUser = {
        id: "user-123",
        userId: "user-123",
        firstName: "Test",
        lastName: "User",
        role: UserRole.AGENT,
        agencyId: "agency-456",
        active: true,
      };

      const result = belongsToAgency(user, "different-agency");
      expect(result).toBe(false);
    });

    it("returns false when user has no agency", () => {
      const user: TestUser = {
        id: "user-123",
        userId: "user-123",
        firstName: "Test",
        lastName: "User",
        role: UserRole.SUPER_ADMIN,
        agencyId: null,
        active: true,
      };

      const result = belongsToAgency(user, "agency-456");
      expect(result).toBe(false);
    });

    it("returns false when agencyId is null", () => {
      const user: TestUser = {
        id: "user-123",
        userId: "user-123",
        firstName: "Test",
        lastName: "User",
        role: UserRole.AGENT,
        agencyId: "agency-456",
        active: true,
      };

      const result = belongsToAgency(user, "");
      expect(result).toBe(false);
    });
  });
});
