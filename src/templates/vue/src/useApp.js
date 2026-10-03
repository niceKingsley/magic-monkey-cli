import { ref } from 'vue';

export function useApp(name = '') {
  const projectName = ref(name);

  return {
    projectName,
  };
}
