import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropertyForm } from "../property-form";
import { PropertyType, TransactionType } from "@prisma/client";
import "@testing-library/jest-dom";

// Mock the usePropertyCreate hook
jest.mock("@/hooks/use-agent-properties", () => ({
  usePropertyCreate: () => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  }),
}));

// Mock react-hook-form toast
jest.mock("@/hooks/use-toast", () => ({
  toast: jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  TestWrapper.displayName = "TestWrapper";

  return TestWrapper;
};

describe("PropertyForm", () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all required form fields", () => {
    render(<PropertyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    // Check for required form fields
    expect(
      screen.getByLabelText(/título de la propiedad/i)
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/descrição/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de propiedad/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de transação/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/estado/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/cidade/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bairro/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preço/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quartos/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/banheiros/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/metros quadrados/i)).toBeInTheDocument();
  });

  it("shows validation errors for required fields", async () => {
    const user = userEvent.setup();

    render(<PropertyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    // Try to submit form without filling required fields
    const submitButton = screen.getByRole("button", {
      name: /crear propiedad/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/title must be at least 5 characters/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/description must be at least 20 characters/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/state is required/i)).toBeInTheDocument();
      expect(screen.getByText(/city is required/i)).toBeInTheDocument();
    });
  });

  it("validates minimum title length", async () => {
    const user = userEvent.setup();

    render(<PropertyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    const titleInput = screen.getByLabelText(/título de la propiedad/i);
    await user.type(titleInput, "ABC"); // Less than 5 characters

    const submitButton = screen.getByRole("button", {
      name: /crear propiedad/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/title must be at least 5 characters/i)
      ).toBeInTheDocument();
    });
  });

  it("validates minimum description length", async () => {
    const user = userEvent.setup();

    render(<PropertyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    const descInput = screen.getByLabelText(/descrição/i);
    await user.type(descInput, "Short desc"); // Less than 20 characters

    const submitButton = screen.getByRole("button", {
      name: /crear propiedad/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/description must be at least 20 characters/i)
      ).toBeInTheDocument();
    });
  });

  it("validates positive price value", async () => {
    const user = userEvent.setup();

    render(<PropertyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    const priceInput = screen.getByLabelText(/preço/i);
    await user.type(priceInput, "-1000"); // Negative price

    const submitButton = screen.getByRole("button", {
      name: /crear propiedad/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/price must be positive/i)).toBeInTheDocument();
    });
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();

    render(<PropertyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    const cancelButton = screen.getByRole("button", { name: /cancelar/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("renders update form when editing existing property", () => {
    const initialData = {
      id: "property-123",
      title: "Casa em Vila Madalena",
      description: "Hermosa casa con 3 habitaciones y jardín amplio",
      type: PropertyType.HOUSE,
      transactionType: TransactionType.SALE,
      locationState: "São Paulo",
      locationCity: "São Paulo",
      locationNeigh: "Vila Madalena",
      price: 650000,
      bedrooms: 3,
      bathrooms: 2,
      garageSpaces: 1,
      squareMeters: 150,
      images: ["https://example.com/image1.jpg"],
      features: ["Jardín", "Balcón"],
    };

    render(
      <PropertyForm
        initialData={initialData}
        propertyId="property-123"
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />,
      { wrapper: createWrapper() }
    );

    // Check that form is pre-filled with initial data
    expect(
      screen.getByDisplayValue("Casa em Vila Madalena")
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue(
        "Hermosa casa con 3 habitaciones y jardín amplio"
      )
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue("São Paulo")).toBeInTheDocument();
    expect(screen.getByDisplayValue("650000")).toBeInTheDocument();

    // Check that button text is for updating
    expect(
      screen.getByRole("button", { name: /actualizar propiedad/i })
    ).toBeInTheDocument();
  });

  it("allows adding and removing features", async () => {
    const user = userEvent.setup();

    render(<PropertyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    // Add a feature
    const featureInput = screen.getByPlaceholderText(
      /adicione uma característica/i
    );
    await user.type(featureInput, "Piscina");

    const addButton = screen.getByRole("button", { name: /adicionar/i });
    await user.click(addButton);

    // Check if feature was added
    expect(screen.getByText("Piscina")).toBeInTheDocument();

    // Remove the feature
    const removeButton = screen.getByRole("button", {
      name: /remover piscina/i,
    });
    await user.click(removeButton);

    // Check if feature was removed
    expect(screen.queryByText("Piscina")).not.toBeInTheDocument();
  });

  it("allows adding and removing images", async () => {
    const user = userEvent.setup();

    render(<PropertyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    // Add an image URL
    const imageInput = screen.getByPlaceholderText(/url da imagem/i);
    await user.type(imageInput, "https://example.com/house.jpg");

    const addImageButton = screen.getByRole("button", {
      name: /adicionar imagem/i,
    });
    await user.click(addImageButton);

    // Check if image was added (should show preview or URL)
    expect(screen.getByText(/house\.jpg/)).toBeInTheDocument();

    // Remove the image
    const removeImageButton = screen.getByRole("button", {
      name: /remover imagem/i,
    });
    await user.click(removeImageButton);

    // Check if image was removed
    expect(screen.queryByText(/house\.jpg/)).not.toBeInTheDocument();
  });

  it("validates image URL format", async () => {
    const user = userEvent.setup();

    render(<PropertyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    const imageInput = screen.getByPlaceholderText(/url da imagem/i);
    await user.type(imageInput, "invalid-url");

    const addImageButton = screen.getByRole("button", {
      name: /adicionar imagem/i,
    });
    await user.click(addImageButton);

    await waitFor(() => {
      expect(screen.getByText(/url inválida/i)).toBeInTheDocument();
    });
  });

  it("requires at least one image", async () => {
    const user = userEvent.setup();

    render(<PropertyForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />, {
      wrapper: createWrapper(),
    });

    // Fill out all other required fields but no images
    await user.type(
      screen.getByLabelText(/título de la propiedad/i),
      "Casa Teste"
    );
    await user.type(
      screen.getByLabelText(/descrição/i),
      "Esta é uma descrição de teste com mais de vinte caracteres"
    );
    await user.type(screen.getByLabelText(/estado/i), "São Paulo");
    await user.type(screen.getByLabelText(/cidade/i), "São Paulo");
    await user.type(screen.getByLabelText(/bairro/i), "Vila Madalena");
    await user.type(screen.getByLabelText(/preço/i), "500000");

    const submitButton = screen.getByRole("button", {
      name: /crear propiedad/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/at least one image is required/i)
      ).toBeInTheDocument();
    });
  });
});
