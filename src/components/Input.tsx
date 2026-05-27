import React, { forwardRef } from "react";
import { useInputSanitizer } from "../hooks/useInputSanitizer";
import { AlertCircle } from "lucide-react";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>, "onChange"> {
    type?: string;
    allowSpecial?: boolean;
    textareaFree?: boolean;
    rows?: number;
    rule?: string; // Rule type (e.g. "nombre_persona", "email", "numero", etc.)
    onChange?: (e: React.ChangeEvent<any>) => void;
}

export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
    ({ type = "text", allowSpecial, textareaFree, rule, style, className = "", onChange, ...props }, ref) => {
        // Feed the rule name (or type as fallback) to the sanitizer hook
        const activeRule = rule || (type === "textarea" ? undefined : type);

        const {
            isShaking,
            showWarning,
            errorMsg,
            handleKeyDown,
            handlePaste,
            handleChange,
        } = useInputSanitizer(activeRule, { allowSpecial, textareaFree });

        const onKeyDownHandler = (e: React.KeyboardEvent<any>) => {
            handleKeyDown(e);
            if (props.onKeyDown) props.onKeyDown(e);
        };

        const onPasteHandler = (e: React.ClipboardEvent<any>) => {
            handlePaste(e);
            if (props.onPaste) props.onPaste(e);
        };

        const onChangeHandler = (e: React.ChangeEvent<any>) => {
            handleChange(e, onChange);
        };

        const combinedClassName = `${className} ${isShaking ? "shake-input" : ""}`.trim();

        const inputProps = {
            ...props,
            ref: ref as any,
            onKeyDown: onKeyDownHandler,
            onPaste: onPasteHandler,
            onChange: onChangeHandler,
            className: combinedClassName,
            style,
            "data-rule": rule,
            "data-allow-special": allowSpecial ? "true" : undefined,
            "data-type": textareaFree ? "textarea-free" : undefined,
        };

        return (
            <div style={{ display: "flex", flexDirection: "column", width: "100%", position: "relative" }}>
                {type === "textarea" ? (
                    <textarea {...(inputProps as any)} />
                ) : (
                    <input type={type} {...(inputProps as any)} />
                )}
                {showWarning && (
                    <span className="blocked-warning-text">
                        <AlertCircle size={12} /> {errorMsg}
                    </span>
                )}
            </div>
        );
    }
);

Input.displayName = "Input";

export default Input;
