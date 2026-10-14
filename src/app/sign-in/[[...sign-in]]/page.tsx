import { SignIn } from "@clerk/nextjs";
import { Container } from "@/components/container";

export default function SignInPage() {
  return (
    <Container className="flex min-h-dvh items-center justify-center">
      <SignIn />
    </Container>
  );
}
