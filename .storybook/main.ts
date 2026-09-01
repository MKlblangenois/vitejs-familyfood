import type { StorybookConfig } from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@chromatic-com/storybook",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp"
  ],
  "framework": "@storybook/react-vite",
  "viteFinal": async (config) => {
    config.plugins = config.plugins || [];

    // Storybook's Vite builder picks up the project's vite.config.ts
    // plugins. The PWA plugin is app-specific and must not run during
    // Storybook builds (it tries to generate a service worker and fails
    // on Storybook's large manager bundle). Remove it here — it may be
    // nested inside an array of plugins.
    const isPwaPlugin = (p: unknown): boolean => {
      const name = (p as { name?: string } | undefined)?.name;
      return typeof name === 'string' && name.startsWith('vite-plugin-pwa');
    };
    config.plugins = config.plugins.filter((plugin) => {
      if (Array.isArray(plugin)) {
        return !plugin.some(isPwaPlugin);
      }
      return !isPwaPlugin(plugin);
    });

    // Ensure the Tailwind v4 Vite plugin is applied when Storybook
    // does not automatically pick up the project's vite.config.ts.
    const hasTailwind = config.plugins.some(
      (p) =>
        (p as Record<string, unknown>)?.name === 'tailwindcss' ||
        (Array.isArray(p) &&
          (p as unknown[]).some(
            (x) => (x as Record<string, unknown>)?.name === 'tailwindcss'
          ))
    );
    if (!hasTailwind) {
      config.plugins.push(tailwindcss());
    }
    return config;
  }
};
export default config;
