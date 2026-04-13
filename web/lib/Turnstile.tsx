import Script from "next/script";
import { useEffect } from "react";

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
    useEffect(() => {
        window.handleTurnstileSuccess = (token: string) => {
            if (onSuccess) {
                onSuccess(token); // call your React callback
            }
        };

        return () => {
            delete window.handleTurnstileSuccess;
        };
    }, [onSuccess]);
    return (
        <div>
            <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js"
                async
                defer
            ></Script>
            <div className="cf-turnstile" data-sitekey={"1x00000000000000000000AA"} data-theme="light"
                data-size="normal"
                data-callback="handleTurnstileSuccess"></div>
        </div>
    )
}