import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AddToShoppingListModal from '../AddToShoppingListModal'
import type { RecipeWithRelations } from '../../types'
import type { ShoppingListWithRelations } from '../../../shopping-lists/types'

// ---------------------------------------------------------------------------
// Mocks – hoisted so they survive vi.mock factory hoisting
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  useShoppingLists: vi.fn(),
  useShoppingList: vi.fn(),
  useAddRecipeToShoppingList: vi.fn(),
}))

vi.mock('../../../shopping-lists/hooks', () => ({
  useShoppingLists: mocks.useShoppingLists,
  useShoppingList: mocks.useShoppingList,
}))

vi.mock('../../hooks', () => ({
  useAddRecipeToShoppingList: mocks.useAddRecipeToShoppingList,
}))

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const recipe: RecipeWithRelations = {
  id: 'r1',
  user_id: 'u1',
  title: 'Pasta',
  description: null,
  image_url: null,
  servings: 4,
  prep_time_minutes: null,
  cook_time_minutes: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  recipe_ingredient_groups: [
    {
      id: 'g1',
      recipe_id: 'r1',
      name: 'Sauce',
      position: 0,
      recipe_ingredients: [
        {
          id: 'i1',
          group_id: 'g1',
          recipe_id: 'r1',
          name: 'Tomato',
          quantity: 2,
          unit: 'cups',
          position: 0,
        },
        {
          id: 'i2',
          group_id: 'g1',
          recipe_id: 'r1',
          name: 'Garlic',
          quantity: 3,
          unit: 'cloves',
          position: 1,
        },
      ],
    },
  ],
  recipe_steps: [],
}

const list1: ShoppingListWithRelations = {
  id: 'sl1',
  owner_id: 'u1',
  title: 'Weekly Groceries',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  shopping_list_members: [],
  shopping_list_items: [
    {
      id: 'existing1',
      list_id: 'sl1',
      name: 'Tomato',
      quantity: 1,
      unit: 'cups',
      checked: false,
      created_by: 'u1',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
    },
  ],
}

const list2: ShoppingListWithRelations = {
  ...list1,
  id: 'sl2',
  title: 'Party',
  shopping_list_items: [],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockMutation(overrides: Record<string, unknown> = {}) {
  return {
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    ...overrides,
  }
}

function renderModal() {
  return render(
    <MemoryRouter>
      <AddToShoppingListModal open onClose={vi.fn()} recipe={recipe} />
    </MemoryRouter>,
  )
}

// ---------------------------------------------------------------------------
// Per-test reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks()
  mocks.useShoppingLists.mockReturnValue({
    data: [list1, list2],
    isLoading: false,
  })
  mocks.useShoppingList.mockReturnValue({ data: list1, isLoading: false })
  mocks.useAddRecipeToShoppingList.mockReturnValue(mockMutation())
})

// ===========================================================================
// Tests
// ===========================================================================

describe('AddToShoppingListModal', () => {
  it('renders the list selector, servings input, and ingredient checkboxes', () => {
    renderModal()

    expect(
      screen.getByRole('heading', { name: /add to shopping list/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('combobox', { name: /shopping list/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('spinbutton', { name: /servings/i }),
    ).toHaveValue(4)

    // Both ingredients are checked by default.
    expect(
      screen.getByRole('checkbox', { name: /tomato/i }),
    ).toBeChecked()
    expect(
      screen.getByRole('checkbox', { name: /garlic/i }),
    ).toBeChecked()
  })

  it('disables submit until a list is selected', async () => {
    const user = userEvent.setup()
    renderModal()

    const submit = screen.getByRole('button', { name: /add to list/i })
    expect(submit).toBeDisabled()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /shopping list/i }),
      'sl1',
    )

    expect(submit).toBeEnabled()
  })

  it('disables submit when no ingredients are selected', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /shopping list/i }),
      'sl1',
    )

    // Deselect all ingredients.
    await user.click(screen.getByRole('button', { name: /deselect all/i }))

    expect(
      screen.getByRole('button', { name: /add to list/i }),
    ).toBeDisabled()
  })

  it('shows an added vs merged summary for the selected list', async () => {
    const user = userEvent.setup()
    renderModal()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /shopping list/i }),
      'sl1',
    )

    // Tomato already exists (1 cup) → merged; Garlic is new → added.
    expect(
      screen.getByText(/1 item will be added, 1 merged with existing items/i),
    ).toBeInTheDocument()
  })

  it('shows an empty state with a link when the user has no lists', () => {
    mocks.useShoppingLists.mockReturnValue({ data: [], isLoading: false })

    renderModal()

    expect(
      screen.getByText(/you don't have any shopping lists yet/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /create a list/i }),
    ).toHaveAttribute('href', '/shopping-lists')
  })

  it('submits the selected list, ingredients, and servings on success', async () => {
    const user = userEvent.setup()
    const mutate = vi.fn((_input, options) => {
      options?.onSuccess?.({ addedCount: 1, mergedCount: 1 })
    })
    mocks.useAddRecipeToShoppingList.mockReturnValue(
      mockMutation({ mutate }),
    )

    renderModal()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /shopping list/i }),
      'sl1',
    )
    fireEvent.change(
      screen.getByRole('spinbutton', { name: /servings/i }),
      { target: { value: '8' } },
    )

    await user.click(screen.getByRole('button', { name: /add to list/i }))

    expect(mutate).toHaveBeenCalledWith(
      {
        recipe,
        list: list1,
        selectedIngredientIds: ['i1', 'i2'],
        targetServings: 8,
      },
      expect.any(Object),
    )

    // Success state is shown.
    expect(
      await screen.findByRole('heading', { name: /added to shopping list/i }),
    ).toBeInTheDocument()
  })

  it('shows an error and keeps the modal open when the insert fails', async () => {
    const user = userEvent.setup()
    mocks.useAddRecipeToShoppingList.mockReturnValue(
      mockMutation({
        isError: true,
        error: new Error('Failed to add items: boom'),
      }),
    )

    renderModal()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /shopping list/i }),
      'sl1',
    )

    expect(
      screen.getByRole('alert'),
    ).toHaveTextContent('Failed to add items: boom')
    // The form is still present (modal not closed).
    expect(
      screen.getByRole('heading', { name: /add to shopping list/i }),
    ).toBeInTheDocument()
  })

  it('shows a pending state on the submit button while adding', async () => {
    const user = userEvent.setup()
    mocks.useAddRecipeToShoppingList.mockReturnValue(
      mockMutation({ isPending: true }),
    )

    renderModal()

    await user.selectOptions(
      screen.getByRole('combobox', { name: /shopping list/i }),
      'sl1',
    )

    expect(
      screen.getByRole('button', { name: /adding/i }),
    ).toBeInTheDocument()
  })
})
