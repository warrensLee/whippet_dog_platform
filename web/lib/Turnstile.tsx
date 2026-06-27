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
    const [loaded, setLoaded] = useState(false);
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
            {!loaded && <div className="bg-white p-5"><p className="text-black">Waiting for Cloudflare</p></div>}
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                async
                defer
                onLoad={() => setLoaded(true)}
            ></Script>
            <div className="cf-turnstile" data-theme="light" data-sitekey={sitekey}
                data-size="normal"
                data-callback="handleTurnstileSuccess"></div>
        </div>
    )
}