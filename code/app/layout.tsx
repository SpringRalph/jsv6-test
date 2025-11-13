import type React from "react";
import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
    title: "PayPal JS v6 Test Framework",
    description: "Testing framework for PayPal JavaScript SDK v6 examples",
    generator: "v0.app",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <Navbar />
                <main className="min-h-screen">{children}</main>
                <Toaster position="top-center" />
            </body>
        </html>
    );
}
