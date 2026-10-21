export function useRouter() {
  return {
    push: (href: string) => history.pushState(null, "", href),
    refresh: () => {},
  };
}
