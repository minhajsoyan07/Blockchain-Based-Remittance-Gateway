"use client"

import { Mail, Phone, HelpCircle, ExternalLink } from "lucide-react"
import { REMITTANCEPAY_CONFIG } from "@/lib/remittancepay-config"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function RemittancePayContact() {
  const supportEmails = REMITTANCEPAY_CONFIG.contact.supportEmails || []
  const supportPhones = REMITTANCEPAY_CONFIG.contact.supportPhones || []

  return (
    <>
      <Card className="border-2 border-indigo-100 dark:border-indigo-900 bg-gradient-to-b from-white to-indigo-50/50 dark:from-slate-900 dark:to-indigo-950/30 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-indigo-50 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-indigo-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
              <HelpCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">Need Help?</CardTitle>
              <CardDescription className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                We are here to assist you 24/7
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 pb-6 space-y-6">
          {/* Contact Methods */}
          <div className="space-y-3">
            {/* Email Support */}
            {supportEmails.map((email, index) => (
              <a
                key={`email-${index}`}
                href={`mailto:${email}`}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700 hover:shadow-md transition-all duration-300 group"
              >
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                  <Mail className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">Email Support</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {email}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Response time: ~2 hours</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all" />
              </a>
            ))}

            {/* Phone Support */}
            {supportPhones.map((phone, index) => (
              <a
                key={`phone-${index}`}
                href={`tel:${phone}`}
                className="flex items-start gap-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-md transition-all duration-300 group"
              >
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <Phone className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-0.5">Phone Support</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {phone}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Available 9AM - 6PM EST</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-300 group-hover:text-emerald-400 opacity-0 group-hover:opacity-100 transition-all" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  )
}