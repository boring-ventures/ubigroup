/**
 * Property Approval Workflow Verification
 *
 * This test verifies the complete property approval workflow:
 * 1. Agent creates property (status: PENDING)
 * 2. Agency Admin sees property in approval queue
 * 3. Agency Admin approves/rejects property
 * 4. Approved properties appear in public portal
 * 5. Rejected properties do not appear in public portal
 */

interface WorkflowTestResult {
  step: string;
  status: "PASS" | "FAIL";
  message: string;
  data?: any;
}

export class PropertyApprovalWorkflowVerification {
  private results: WorkflowTestResult[] = [];
  private testPropertyId: string | null = null;
  private agentToken: string | null = null;
  private agencyAdminToken: string | null = null;

  constructor(
    private baseUrl: string = "http://localhost:3000",
    private agentCredentials: { email: string; password: string },
    private agencyAdminCredentials: { email: string; password: string }
  ) {}

  /**
   * Run the complete workflow verification
   */
  async runVerification(): Promise<WorkflowTestResult[]> {
    console.log("🚀 Starting Property Approval Workflow Verification...\n");

    try {
      await this.authenticateUsers();
      await this.testAgentCreateProperty();
      await this.testAgencyAdminSeesPendingProperty();
      await this.testPropertyNotInPublicPortal();
      await this.testAgencyAdminApproveProperty();
      await this.testApprovedPropertyInPublicPortal();
      await this.testRejectWorkflow();
    } catch (error) {
      this.addResult(
        "WORKFLOW_ERROR",
        "FAIL",
        `Workflow failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    this.printResults();
    return this.results;
  }

  private async authenticateUsers() {
    try {
      // Authenticate Agent
      const agentResponse = await fetch(`${this.baseUrl}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.agentCredentials),
      });

      if (!agentResponse.ok) {
        throw new Error("Failed to authenticate agent");
      }

      // Authenticate Agency Admin
      const adminResponse = await fetch(`${this.baseUrl}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(this.agencyAdminCredentials),
      });

      if (!adminResponse.ok) {
        throw new Error("Failed to authenticate agency admin");
      }

      this.addResult(
        "AUTHENTICATION",
        "PASS",
        "Successfully authenticated both users"
      );
    } catch (error) {
      this.addResult(
        "AUTHENTICATION",
        "FAIL",
        `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    }
  }

  private async testAgentCreateProperty() {
    const propertyData = {
      title: `Test Property ${Date.now()}`,
      description:
        "This is a test property for workflow verification. It should start with PENDING status and go through the approval process.",
      type: "HOUSE",
      locationState: "São Paulo",
      locationCity: "São Paulo",
      locationNeigh: "Vila Madalena",
      address: "Rua Test, 123 - Vila Madalena, São Paulo - SP",
      price: 450000,
      bedrooms: 3,
      bathrooms: 2,
      garageSpaces: 1,
      squareMeters: 120,
      transactionType: "SALE",
      images: [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg",
      ],
      features: ["Jardim", "Varanda", "Portaria"],
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.agentToken}`,
        },
        body: JSON.stringify(propertyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to create property: ${errorData.error}`);
      }

      const data = await response.json();
      this.testPropertyId = data.property.id;

      if (data.property.status !== "PENDING") {
        throw new Error(
          `Expected property status to be PENDING, got ${data.property.status}`
        );
      }

      this.addResult(
        "AGENT_CREATE_PROPERTY",
        "PASS",
        `Agent successfully created property with PENDING status`,
        {
          propertyId: this.testPropertyId,
          status: data.property.status,
        }
      );
    } catch (error) {
      this.addResult(
        "AGENT_CREATE_PROPERTY",
        "FAIL",
        `Failed to create property: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    }
  }

  private async testAgencyAdminSeesPendingProperty() {
    try {
      const response = await fetch(`${this.baseUrl}/api/properties/approve`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.agencyAdminToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch pending properties");
      }

      const data = await response.json();
      const foundProperty = data.pendingProperties.find(
        (p: any) => p.id === this.testPropertyId
      );

      if (!foundProperty) {
        throw new Error("Test property not found in pending properties list");
      }

      this.addResult(
        "AGENCY_ADMIN_SEES_PENDING",
        "PASS",
        "Agency Admin can see the pending property in approval queue",
        {
          pendingCount: data.pendingProperties.length,
          foundProperty: foundProperty.title,
        }
      );
    } catch (error) {
      this.addResult(
        "AGENCY_ADMIN_SEES_PENDING",
        "FAIL",
        `Failed to verify pending properties: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    }
  }

  private async testPropertyNotInPublicPortal() {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/properties?status=APPROVED`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch public properties");
      }

      const data = await response.json();
      const foundProperty = data.properties.find(
        (p: any) => p.id === this.testPropertyId
      );

      if (foundProperty) {
        throw new Error("PENDING property should not appear in public portal");
      }

      this.addResult(
        "PENDING_NOT_IN_PUBLIC",
        "PASS",
        "PENDING property correctly not visible in public portal"
      );
    } catch (error) {
      this.addResult(
        "PENDING_NOT_IN_PUBLIC",
        "FAIL",
        `Failed to verify public visibility: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    }
  }

  private async testAgencyAdminApproveProperty() {
    try {
      const response = await fetch(`${this.baseUrl}/api/properties/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.agencyAdminToken}`,
        },
        body: JSON.stringify({
          id: this.testPropertyId,
          status: "APPROVED",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to approve property: ${errorData.error}`);
      }

      const data = await response.json();

      if (data.property.status !== "APPROVED") {
        throw new Error(
          `Expected property status to be APPROVED, got ${data.property.status}`
        );
      }

      this.addResult(
        "AGENCY_ADMIN_APPROVE",
        "PASS",
        "Agency Admin successfully approved the property",
        {
          previousStatus: data.previousStatus,
          newStatus: data.newStatus,
          approvedBy: data.approvedBy,
        }
      );
    } catch (error) {
      this.addResult(
        "AGENCY_ADMIN_APPROVE",
        "FAIL",
        `Failed to approve property: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    }
  }

  private async testApprovedPropertyInPublicPortal() {
    try {
      // Wait a moment for the update to propagate
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const response = await fetch(
        `${this.baseUrl}/api/properties?status=APPROVED`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch public properties");
      }

      const data = await response.json();
      const foundProperty = data.properties.find(
        (p: any) => p.id === this.testPropertyId
      );

      if (!foundProperty) {
        throw new Error("APPROVED property should appear in public portal");
      }

      if (foundProperty.status !== "APPROVED") {
        throw new Error(
          `Expected property status to be APPROVED in public portal, got ${foundProperty.status}`
        );
      }

      this.addResult(
        "APPROVED_IN_PUBLIC",
        "PASS",
        "APPROVED property correctly visible in public portal",
        {
          propertyTitle: foundProperty.title,
          status: foundProperty.status,
        }
      );
    } catch (error) {
      this.addResult(
        "APPROVED_IN_PUBLIC",
        "FAIL",
        `Failed to verify approved property in public portal: ${error instanceof Error ? error.message : "Unknown error"}`
      );
      throw error;
    }
  }

  private async testRejectWorkflow() {
    // Create another test property for rejection workflow
    const propertyData = {
      title: `Test Reject Property ${Date.now()}`,
      description:
        "This property will be rejected to test the rejection workflow.",
      type: "APARTMENT",
      locationState: "Rio de Janeiro",
      locationCity: "Rio de Janeiro",
      locationNeigh: "Copacabana",
      address: "Av. Atlântica, 456 - Copacabana, RJ",
      price: 650000,
      bedrooms: 2,
      bathrooms: 1,
      garageSpaces: 1,
      squareMeters: 80,
      transactionType: "SALE",
      images: ["https://example.com/reject-image1.jpg"],
      features: ["Vista para o mar"],
    };

    try {
      // Create property
      const createResponse = await fetch(`${this.baseUrl}/api/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.agentToken}`,
        },
        body: JSON.stringify(propertyData),
      });

      if (!createResponse.ok) {
        throw new Error("Failed to create property for rejection test");
      }

      const createData = await createResponse.json();
      const rejectPropertyId = createData.property.id;

      // Reject the property
      const rejectResponse = await fetch(
        `${this.baseUrl}/api/properties/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.agencyAdminToken}`,
          },
          body: JSON.stringify({
            id: rejectPropertyId,
            status: "REJECTED",
            rejectionReason:
              "Property does not meet quality standards for testing purposes.",
          }),
        }
      );

      if (!rejectResponse.ok) {
        throw new Error("Failed to reject property");
      }

      const rejectData = await rejectResponse.json();

      if (rejectData.property.status !== "REJECTED") {
        throw new Error(
          `Expected property status to be REJECTED, got ${rejectData.property.status}`
        );
      }

      // Verify rejected property is not in public portal
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const publicResponse = await fetch(
        `${this.baseUrl}/api/properties?status=APPROVED`
      );
      const publicData = await publicResponse.json();
      const foundRejectedProperty = publicData.properties.find(
        (p: any) => p.id === rejectPropertyId
      );

      if (foundRejectedProperty) {
        throw new Error("REJECTED property should not appear in public portal");
      }

      this.addResult(
        "REJECT_WORKFLOW",
        "PASS",
        "Property rejection workflow completed successfully",
        {
          propertyId: rejectPropertyId,
          status: rejectData.property.status,
          rejectionReason: rejectData.rejectionReason,
        }
      );
    } catch (error) {
      this.addResult(
        "REJECT_WORKFLOW",
        "FAIL",
        `Rejection workflow failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  private addResult(
    step: string,
    status: "PASS" | "FAIL",
    message: string,
    data?: any
  ) {
    this.results.push({ step, status, message, data });
    const emoji = status === "PASS" ? "✅" : "❌";
    console.log(`${emoji} ${step}: ${message}`);
    if (data) {
      console.log(`   Data:`, JSON.stringify(data, null, 2));
    }
    console.log("");
  }

  private printResults() {
    console.log("\n📊 WORKFLOW VERIFICATION RESULTS");
    console.log("================================");

    const passCount = this.results.filter((r) => r.status === "PASS").length;
    const failCount = this.results.filter((r) => r.status === "FAIL").length;

    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(
      `📈 Success Rate: ${Math.round((passCount / this.results.length) * 100)}%`
    );

    if (failCount === 0) {
      console.log(
        "\n🎉 ALL WORKFLOW TESTS PASSED! The property approval workflow is functioning correctly."
      );
    } else {
      console.log(
        "\n⚠️  Some tests failed. Please review the failed steps above."
      );
    }
  }
}

// Example usage:
/*
const verification = new PropertyApprovalWorkflowVerification(
  'http://localhost:3000',
  { email: 'agent@test.com', password: 'password123' },
  { email: 'admin@test.com', password: 'password123' }
);

verification.runVerification();
*/
