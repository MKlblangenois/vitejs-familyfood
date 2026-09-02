import type { Meta, StoryObj } from '@storybook/react-vite'
import { StepList } from './pages/RecipeDetailPage'
import { mockRecipeWithRelations } from '../mockData'

const meta = {
  title: 'Recipes/StepList',
  component: StepList,
  tags: ['autodocs'],
} satisfies Meta<typeof StepList>

export default meta
type Story = StoryObj<typeof meta>

export const FewSteps: Story = {
  render: () => (
    <StepList steps={mockRecipeWithRelations.recipe_steps.slice(0, 2)} />
  ),
}

export const ManySteps: Story = {
  render: () => <StepList steps={mockRecipeWithRelations.recipe_steps} />,
}

export const LongInstruction: Story = {
  render: () => (
    <StepList
      steps={[
        {
          id: 'step-long',
          recipe_id: 'recipe-1',
          instruction:
            'Dans un grand bol, mélangez la farine, le sucre, la levure et le sel. Ajoutez progressivement le lait tiède et le beurre fondu en remuant jusqu’à obtenir une pâte homogène. Pétrissez pendant 10 minutes, couvrez et laissez lever dans un endroit chaud pendant 1 heure ou jusqu’à ce que la pâte ait doublé de volume.',
          position: 1,
        },
      ]}
    />
  ),
}

export const SingleStep: Story = {
  render: () => (
    <StepList
      steps={[
        {
          id: 'step-1',
          recipe_id: 'recipe-1',
          instruction: 'Mélangez tous les ingrédients dans un saladier.',
          position: 1,
        },
      ]}
    />
  ),
}
