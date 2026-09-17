import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "w-64 h-auto", showText = false }: { className?: string; showText?: boolean }) {
    return (
        <Link href="/" className="flex items-center gap-2">
            <div className={`relative ${className} flex-shrink-0 bg-transparent`}>
                <Image
                    src="/logo.png"
                    alt="RemittancePay Logo"
                    width={300}
                    height={80}
                    className="w-full h-auto object-contain drop-shadow-[0_1.2px_1.2px_rgba(0,0,0,0.8)]"
                    priority
                />
            </div>
        </Link>
    )
}
