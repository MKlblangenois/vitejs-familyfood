import type { Preview } from '@storybook/react-vite'
import { sb } from 'storybook/test'
import '../src/index.css'

// Mock the Supabase client for all stories so hook-using components
// (e.g. AddToShoppingListModal, ItemRow, AddItemRow) render without
// hitting the network. Behavior is configured per-story via the
// `__mockHelpers` export from the mock file.
sb.mock(import('../src/shared/lib/supabase.ts'))

// Mock the recipe image upload helpers so RecipeImageUpload stories
// can control the upload lifecycle (e.g. show the uploading state).
sb.mock(import('../src/features/recipes/lib/imageUpload.ts'))

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
}

export default preview
