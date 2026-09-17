import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/lib/theme-context"
import { LanguageProvider } from "@/lib/language-context"
import { FontProvider } from "@/lib/font-context"
import { DeferredAiAssistant } from "@/components/deferred-ai-assistant"
import { Toaster } from "@/components/ui/sonner"

export const metadata: Metadata = {
  title: "RemittancePay - Secure Money Transfer",
  description: "Fast, secure, and transparent remittance service powered by blockchain",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to font origins for faster DNS/TLS */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.maateen.me" crossOrigin="anonymous" />

        {/* Preload font CSS — downloads without blocking render */}
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
        />
        <link
          rel="preload"
          as="style"
          href="https://fonts.maateen.me/solaiman-lipi/font.css"
        />

        {/* Activate font stylesheets after page loads */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var fonts = [
                  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap",
                  "https://fonts.maateen.me/solaiman-lipi/font.css"
                ];
                fonts.forEach(function(href){
                  var l = document.createElement('link');
                  l.rel = 'stylesheet';
                  l.href = href;
                  document.head.appendChild(l);
                });
              })();
            `,
          }}
        />
        <noscript>
          <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@400;600;700&family=Poppins:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap" />
          <link rel="stylesheet" href="https://fonts.maateen.me/solaiman-lipi/font.css" />
        </noscript>
      </head>
      <body className="bg-background text-foreground">
        <LanguageProvider>
          <FontProvider>
            <ThemeProvider>
              <AuthProvider>
                {children}
                <DeferredAiAssistant />
                <Toaster />
              </AuthProvider>
            </ThemeProvider>
          </FontProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
