import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent } from 'storybook/test'
import { mocked } from 'storybook/test'
import RecipeImageUpload from './components/RecipeImageUpload'
import { uploadRecipeImage } from './lib/imageUpload'

const meta = {
  title: 'Recipes/RecipeImageUpload',
  component: RecipeImageUpload,
  tags: ['autodocs'],
} satisfies Meta<typeof RecipeImageUpload>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  render: () => (
    <RecipeImageUpload value="" onChange={() => {}} recipeId="recipe-1" />
  ),
}

export const WithValue: Story = {
  render: () => (
    <RecipeImageUpload
      value="https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80"
      onChange={() => {}}
      recipeId="recipe-1"
    />
  ),
}

export const WithError: Story = {
  render: () => (
    <RecipeImageUpload
      value=""
      onChange={() => {}}
      recipeId="recipe-1"
      error="Le fichier est trop volumineux. Choisissez une image de moins de 5 Mo."
    />
  ),
}

export const Uploading: Story = {
  render: () => (
    <RecipeImageUpload value="" onChange={() => {}} recipeId="recipe-1" />
  ),
  play: async ({ canvas }) => {
    // Make the upload hang so the uploading state stays visible.
    mocked(uploadRecipeImage).mockImplementation(
      () => new Promise(() => {}),
    )

    const fileInput = canvas.getByLabelText('Choisir une image')
    const file = new File(['x'.repeat(1000)], 'photo.jpg', {
      type: 'image/jpeg',
    })
    await userEvent.upload(fileInput, file)

    await expect(
      canvas.getByText('Téléversement…'),
    ).toBeInTheDocument()
  },
}