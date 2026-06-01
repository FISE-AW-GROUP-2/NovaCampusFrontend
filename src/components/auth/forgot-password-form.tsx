"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Loader2, Mail, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const { forgotPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    const result = await forgotPassword(email)

    if (result.success) {
      setIsSuccess(true)
    } else {
      setError(result.error || "Failed to send reset email")
    }
    setIsSubmitting(false)
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-xl">Check your email</CardTitle>
              <CardDescription>
                If an account with <span className="font-medium text-foreground">{email}</span> exists,
                you will receive a password reset link shortly.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                {"Didn't receive the email? Check your spam folder or try again."}
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => setIsSuccess(false)}>
                  Try a different email
                </Button>
                <Link href="/login">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <svg
              className="h-10 w-10"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">School ERP</h1>
        </div>

        {/* Reset Password Card */}
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Forgot password?</CardTitle>
            <CardDescription>
              Enter your email address and we&apos;ll send you a link to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-foreground">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isSubmitting}
                    autoComplete="email"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send reset link"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back to login */}
        <div className="text-center">
          <Link href="/login">
            <Button variant="ghost" className="text-muted-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
