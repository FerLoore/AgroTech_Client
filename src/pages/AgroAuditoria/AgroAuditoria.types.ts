export interface Auditoria {
    [key: string]: unknown;
    audi_auditoria:      number;
    audi_tabla:          string;
    audi_accion:         string;
    audi_campo:          string;
    audi_valor_antes:    string;
    audi_valor_despues:  string;
    audi_fecha:          string;
    usu_usuario:         number;
    audi_usuario_nombre: string;
}

export const ACCION_BADGE = {
    INSERT: { label: "INSERT", bg: "#e6f4ea", text: "#166534" },
    UPDATE: { label: "UPDATE", bg: "#ddeef8", text: "#0C447C" },
    DELETE: { label: "DELETE", bg: "#f8d7da", text: "#791F1F" },
} as const;