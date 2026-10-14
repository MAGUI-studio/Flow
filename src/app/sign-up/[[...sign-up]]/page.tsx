import { SignUp } from "@clerk/nextjs";
import { Container } from "@/components/container";

export default function SignUpPage() {
  return (
    <Container className="flex min-h-dvh items-center justify-center">
      <SignUp />
    </Container>
  );
}
