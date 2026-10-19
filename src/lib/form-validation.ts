// Opening controls or moving focus must not report missing required fields.
// After the first submit, corrections are revalidated as the user types.
export const formValidation = {
  mode: "onSubmit",
  reValidateMode: "onChange",
} as const;
