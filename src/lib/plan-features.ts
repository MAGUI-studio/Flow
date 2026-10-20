export function planFeatures(plan: string) {
  return plan === "multi"
    ? {
        name: "Flow PRO",
        establishments: 3,
        professionals: 20,
        reports: true,
        export: true,
      }
    : {
        name: "Essencial",
        establishments: 1,
        professionals: 10,
        reports: false,
        export: false,
      };
}
