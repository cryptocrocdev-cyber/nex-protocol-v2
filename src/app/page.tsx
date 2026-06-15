"use client";
import DemoApp from "@/components/DemoApp";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function HomePage() {
  return (
    <ErrorBoundary>
      <DemoApp />
    </ErrorBoundary>
  );
}