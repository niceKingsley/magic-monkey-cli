import { defineConfig, monkey } from 'magic-monkey-cli';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith('magic-'),
        },
      },
    }),
    monkey(),
  ],
});
