import type { Meta, StoryObj } from '@storybook/react-vite'
import AuthLayout from './AuthLayout'
import Button from './Button'
import TextField from './TextField'

const meta = {
  title: 'Layout/AuthLayout',
  component: AuthLayout,
  tags: ['autodocs'],
} satisfies Meta<typeof AuthLayout>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <AuthLayout>
      <form className="space-y-4">
        <TextField
          id="auth-email"
          label="Email"
          type="email"
          placeholder="vous@exemple.com"
        />
        <TextField
          id="auth-password"
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
        />
        <Button type="submit" variant="primary" size="lg" className="w-full">
          Se connecter
        </Button>
      </form>
    </AuthLayout>
  ),
}

export const WithError: Story = {
  render: () => (
    <AuthLayout>
      <form className="space-y-4">
        <TextField
          id="auth-email-error"
          label="Email"
          type="email"
          defaultValue="invalide"
          error="Veuillez saisir une adresse email valide."
        />
        <TextField
          id="auth-password-error"
          label="Mot de passe"
          type="password"
          placeholder="••••••••"
        />
        <Button type="submit" variant="primary" size="lg" className="w-full">
          Se connecter
        </Button>
      </form>
    </AuthLayout>
  ),
}
