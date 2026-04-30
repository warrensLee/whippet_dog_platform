import Script from "next/script";
import { useEffect, useState } from "react";

declare global {
    interface Turnstile {
        reset(widgetId?: string): void;
    }

    interface Window {
        turnstile?: Turnstile;
        handleTurnstileSuccess?(token: string): void
    }
}

export default function Turnstile({ onSuccess }: { onSuccess: (token: string) => void }) {
    const [sitekey, setSitekey] = useState<string | null>(null);

    useEffect(() => {
        const fetchSitekey = async () => {
            try {
                const res = await fetch("/api/turnstile");
                const text = await res.text();
                setSitekey(text);
            } catch (err) {
                console.error("Failed to fetch Turnstile sitekey", err);
            }
        };
        fetchSitekey();
    }, []);

    useEffect(() => {
        window.handleTurnstileSuccess = (token: string) => {
            if (onSuccess) {
                onSuccess(token);
            }
        };

        return () => {
            delete window.handleTurnstileSuccess;
        };
    }, [onSuccess]);


    if (!sitekey) {
        return null;
    }

    return (
        <div>
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                async
                defer
            ></Script>
            <div className="cf-turnstile" data-theme="light" data-sitekey={sitekey}
                data-size="normal"
                data-callback="handleTurnstileSuccess"></div>
        </div>
    )
}