import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your Kelo account to start collecting customer feedback.',
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
