import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PropertyFilters } from "../property-filters";

// Mock the usePropertyLocations hook
const mockLocationData = {
  states: ["São Paulo", "Rio de Janeiro", "Minas Gerais"],
  cities: [
    { value: "São Paulo", label: "São Paulo, SP", state: "São Paulo" },
    {
      value: "Rio de Janeiro",
      label: "Rio de Janeiro, RJ",
      state: "Rio de Janeiro",
    },
    {
      value: "Belo Horizonte",
      label: "Belo Horizonte, MG",
      state: "Minas Gerais",
    },
  ],
  neighborhoods: [
    {
      value: "Vila Madalena",
      label: "Vila Madalena, São Paulo",
      city: "São Paulo, São Paulo",
    },
    {
      value: "Copacabana",
      label: "Copacabana, Rio de Janeiro",
      city: "Rio de Janeiro, Rio de Janeiro",
    },
  ],
};

jest.mock("@/hooks/use-property-search", () => ({
  usePropertyLocations: () => ({
    data: mockLocationData,
    isLoading: false,
    error: null,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("PropertyFilters", () => {
  const mockOnFiltersChange = jest.fn();
  const mockOnClearFilters = jest.fn();

  const defaultProps = {
    filters: {},
    onFiltersChange: mockOnFiltersChange,
    onClearFilters: mockOnClearFilters,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders all filter categories", () => {
    render(<PropertyFilters {...defaultProps} />, { wrapper: createWrapper() });

    expect(screen.getByText(/tipo de transação/i)).toBeInTheDocument();
    expect(screen.getByText(/tipo de imóvel/i)).toBeInTheDocument();
    expect(screen.getByText(/localização/i)).toBeInTheDocument();
    expect(screen.getByText(/faixa de preço/i)).toBeInTheDocument();
    expect(screen.getByText(/características/i)).toBeInTheDocument();
  });

  it("calls onFiltersChange when transaction type is selected", async () => {
    const user = userEvent.setup();

    render(<PropertyFilters {...defaultProps} />, { wrapper: createWrapper() });

    const transactionSelect = screen.getByDisplayValue(/venda ou aluguel/i);
    await user.click(transactionSelect);

    const saleOption = screen.getByText("Venda");
    await user.click(saleOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      transactionType: "SALE",
    });
  });

  it("calls onFiltersChange when property type is selected", async () => {
    const user = userEvent.setup();

    render(<PropertyFilters {...defaultProps} />, { wrapper: createWrapper() });

    const typeSelect = screen.getByDisplayValue(/selecione o tipo/i);
    await user.click(typeSelect);

    const houseOption = screen.getByText("Casa");
    await user.click(houseOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      type: "HOUSE",
    });
  });

  it("loads and displays states from API", async () => {
    render(<PropertyFilters {...defaultProps} />, { wrapper: createWrapper() });

    const stateSelect = screen.getByDisplayValue(/estado/i);
    await userEvent.click(stateSelect);

    await waitFor(() => {
      expect(screen.getByText("São Paulo")).toBeInTheDocument();
      expect(screen.getByText("Rio de Janeiro")).toBeInTheDocument();
      expect(screen.getByText("Minas Gerais")).toBeInTheDocument();
    });
  });

  it("filters cities based on selected state", async () => {
    const user = userEvent.setup();

    render(
      <PropertyFilters
        {...defaultProps}
        filters={{ locationState: "São Paulo" }}
      />,
      { wrapper: createWrapper() }
    );

    const citySelect = screen.getByDisplayValue(/cidade/i);
    await user.click(citySelect);

    await waitFor(() => {
      // Should show cities from São Paulo state
      expect(screen.getByText("São Paulo, SP")).toBeInTheDocument();
      // Should not show cities from other states
      expect(screen.queryByText("Rio de Janeiro, RJ")).not.toBeInTheDocument();
    });
  });

  it("updates price filters when min/max price is entered", async () => {
    const user = userEvent.setup();

    render(<PropertyFilters {...defaultProps} />, { wrapper: createWrapper() });

    const minPriceInput = screen.getByPlaceholderText(/preço mín/i);
    const maxPriceInput = screen.getByPlaceholderText(/preço máx/i);

    await user.type(minPriceInput, "200000");
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      minPrice: 200000,
    });

    await user.type(maxPriceInput, "500000");
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      maxPrice: 500000,
    });
  });

  it("updates bedroom filter when selected", async () => {
    const user = userEvent.setup();

    render(<PropertyFilters {...defaultProps} />, { wrapper: createWrapper() });

    const bedroomsSelect = screen.getByDisplayValue(/qualquer/i);
    await user.click(bedroomsSelect);

    const threeBedroomsOption = screen.getByText("3+");
    await user.click(threeBedroomsOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      bedrooms: 3,
    });
  });

  it("toggles features when clicked", async () => {
    const user = userEvent.setup();

    render(<PropertyFilters {...defaultProps} />, { wrapper: createWrapper() });

    // Find and click a feature checkbox
    const piscinaCheckbox = screen.getByLabelText(/piscina/i);
    await user.click(piscinaCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      features: ["Piscina"],
    });

    // Click again to remove
    await user.click(piscinaCheckbox);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      features: undefined,
    });
  });

  it("shows correct active filters count", () => {
    const filtersWithData = {
      transactionType: "SALE" as const,
      type: "HOUSE" as const,
      locationState: "São Paulo",
      minPrice: 200000,
      bedrooms: 3,
    };

    render(<PropertyFilters {...defaultProps} filters={filtersWithData} />, {
      wrapper: createWrapper(),
    });

    // Should show 5 active filters
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("calls onClearFilters when clear button is clicked", async () => {
    const user = userEvent.setup();

    render(
      <PropertyFilters
        {...defaultProps}
        filters={{ transactionType: "SALE" as const }}
      />,
      { wrapper: createWrapper() }
    );

    const clearButton = screen.getByText(/limpar filtros/i);
    await user.click(clearButton);

    expect(mockOnClearFilters).toHaveBeenCalledTimes(1);
  });

  it("renders in mobile mode when isMobile prop is true", () => {
    render(<PropertyFilters {...defaultProps} isMobile={true} />, {
      wrapper: createWrapper(),
    });

    // Should render mobile trigger button
    expect(screen.getByText(/filtros/i)).toBeInTheDocument();
  });

  it("handles loading state for locations", () => {
    // Mock loading state
    jest.doMock("@/hooks/use-property-search", () => ({
      usePropertyLocations: () => ({
        data: null,
        isLoading: true,
        error: null,
      }),
    }));

    render(<PropertyFilters {...defaultProps} />, { wrapper: createWrapper() });

    const stateSelect = screen.getByDisplayValue(/estado/i);
    fireEvent.click(stateSelect);

    expect(screen.getByText(/carregando estados/i)).toBeInTheDocument();
  });

  it("updates filters when existing filter values are cleared", async () => {
    const user = userEvent.setup();

    render(
      <PropertyFilters
        {...defaultProps}
        filters={{ transactionType: "SALE" as const }}
      />,
      { wrapper: createWrapper() }
    );

    const transactionSelect = screen.getByDisplayValue(/venda/i);
    await user.click(transactionSelect);

    const allOption = screen.getByText("Todos");
    await user.click(allOption);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      transactionType: undefined,
    });
  });

  it("handles square meters filter input", async () => {
    const user = userEvent.setup();

    render(<PropertyFilters {...defaultProps} />, { wrapper: createWrapper() });

    const minSquareMetersInput = screen.getByPlaceholderText(/área mín/i);
    await user.type(minSquareMetersInput, "100");

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      minSquareMeters: 100,
    });
  });

  it("validates price input as numbers only", async () => {
    const user = userEvent.setup();

    render(<PropertyFilters {...defaultProps} />, { wrapper: createWrapper() });

    const minPriceInput = screen.getByPlaceholderText(/preço mín/i);
    await user.type(minPriceInput, "abc");

    // Should not call onFiltersChange with invalid number
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      minPrice: undefined,
    });
  });
});
