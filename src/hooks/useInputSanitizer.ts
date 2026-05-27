import React, { useState, useCallback, useRef, useEffect } from "react";
import { FIELD_RULES } from "../utils/inputRules";

export interface UseInputSanitizerOptions {
    allowSpecial?: boolean;
    textareaFree?: boolean;
}

export const useInputSanitizer = (
    fieldType?: string,
    options?: UseInputSanitizerOptions
) => {
    const [isShaking, setIsShaking] = useState(false);
    const [showWarning, setShowWarning] = useState(false);

    const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Retrieve active rule config
    const rule = fieldType ? FIELD_RULES[fieldType] : null;

    const triggerWarning = useCallback(() => {
        if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
        if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);

        setIsShaking(true);
        setShowWarning(true);

        shakeTimeoutRef.current = setTimeout(() => {
            setIsShaking(false);
        }, 300);

        warningTimeoutRef.current = setTimeout(() => {
            setShowWarning(false);
        }, 2000);
    }, []);

    useEffect(() => {
        return () => {
            if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
            if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
        };
    }, []);

    // 1. Keydown handler: blocks character in real-time
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            if (options?.allowSpecial) return;
            if (options?.textareaFree && fieldType === "textarea") return;
            if (fieldType === "password") return;
            if (!rule) return;

            const key = e.key;

            // Allow navigation, deletion and system control keys
            if (key.length > 1) return;

            // Only allow characters matching the active regex
            const isAllowed = rule.character.test(key);
            if (!isAllowed) {
                e.preventDefault();
                triggerWarning();
            }
        },
        [fieldType, options, rule, triggerWarning]
    );

    // 2. Paste handler: sanitizes pasted content in real-time
    const handlePaste = useCallback(
        (e: React.ClipboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            if (options?.allowSpecial) return;
            if (options?.textareaFree && fieldType === "textarea") return;
            if (fieldType === "password") return;
            if (!rule) return;

            const pastedText = e.clipboardData.getData("text");
            // Clean illegal characters using the negated regex
            const sanitizedText = pastedText.replace(rule.forbidden, "");

            if (pastedText !== sanitizedText) {
                e.preventDefault();
                triggerWarning();

                const target = e.target as HTMLInputElement | HTMLTextAreaElement;
                const start = target.selectionStart ?? 0;
                const end = target.selectionEnd ?? 0;
                const currentValue = target.value;
                const newValue =
                    currentValue.substring(0, start) +
                    sanitizedText +
                    currentValue.substring(end);

                target.value = newValue;

                const newCursorPos = start + sanitizedText.length;

                // Fire input event to trigger React value tracking
                const changeEvent = new Event("input", { bubbles: true });
                target.dispatchEvent(changeEvent);

                setTimeout(() => {
                    target.setSelectionRange(newCursorPos, newCursorPos);
                }, 0);
            }
        },
        [fieldType, options, rule, triggerWarning]
    );

    // 3. Change handler: final safeguard for autocomplete / virtual keyboards
    const handleChange = useCallback(
        (
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
            onChangeCallback?: (e: React.ChangeEvent<any>) => void
        ) => {
            if (options?.allowSpecial || fieldType === "password" || (options?.textareaFree && fieldType === "textarea") || !rule) {
                if (onChangeCallback) onChangeCallback(e);
                return;
            }

            const originalValue = e.target.value;
            const sanitizedValue = originalValue.replace(rule.forbidden, "");

            if (originalValue !== sanitizedValue) {
                triggerWarning();

                const target = e.target;
                const start = target.selectionStart ?? 0;

                const diff = originalValue.length - sanitizedValue.length;
                target.value = sanitizedValue;

                const newCursorPos = Math.max(0, start - diff);

                if (onChangeCallback) {
                    onChangeCallback(e);
                }

                setTimeout(() => {
                    target.setSelectionRange(newCursorPos, newCursorPos);
                }, 0);
            } else {
                if (onChangeCallback) onChangeCallback(e);
            }
        },
        [fieldType, options, rule, triggerWarning]
    );

    return {
        isShaking,
        showWarning,
        errorMsg: rule?.errorMsg || "Caracteres no permitidos detectados.",
        handleKeyDown,
        handlePaste,
        handleChange,
    };
};
