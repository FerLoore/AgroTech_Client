export interface FieldRuleConfig {
    allowed: RegExp;       // Allowed characters full pattern
    character: RegExp;     // Single character allowed pattern (for real-time keypress blocking)
    forbidden: RegExp;     // Negated character class (for sanitizing copy-pastes)
    errorMsg: string;      // Error message for feedback
}

export const FIELD_RULES: Record<string, FieldRuleConfig> = {
    nombre_persona: {
        allowed: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/,
        character: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/,
        forbidden: /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g,
        errorMsg: "Solo se permiten letras, tildes y espacios."
    },
    nombre_rol: {
        allowed: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/,
        character: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/,
        forbidden: /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g,
        errorMsg: "Solo se permiten letras, tildes y espacios."
    },
    nombre_categoria: {
        allowed: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/,
        character: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]$/,
        forbidden: /[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g,
        errorMsg: "Solo se permiten letras, tildes y espacios."
    },
    texto_descriptivo: {
        allowed: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-]*$/,
        character: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-]$/,
        forbidden: /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-]/g,
        errorMsg: "Solo letras, números, espacios y puntuación básica (. , -)."
    },
    concentracion: {
        allowed: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-%]*$/,
        character: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-%]$/,
        forbidden: /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-%]/g,
        errorMsg: "Solo letras, números, espacios, puntuación básica (. , -) y signo de porcentaje (%)."
    },
    descripcion: {
        allowed: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-]*$/,
        character: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-]$/,
        forbidden: /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-]/g,
        errorMsg: "Solo letras, números, espacios y puntuación básica (. , -)."
    },
    comentario: {
        allowed: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-]*$/,
        character: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-]$/,
        forbidden: /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-]/g,
        errorMsg: "Solo letras, números, espacios y puntuación básica (. , -)."
    },
    email: {
        allowed: /^[a-zA-Z0-9@._\-]*$/,
        character: /^[a-zA-Z0-9@._\-]$/,
        forbidden: /[^a-zA-Z0-9@._\-]/g,
        errorMsg: "Solo letras, números y caracteres @ . _ -"
    },
    telefono: {
        allowed: /^[+0-9]*$/,
        character: /^[+0-9]$/,
        forbidden: /[^+0-9]/g,
        errorMsg: "Solo se permiten números y el signo + al inicio."
    },
    celular: {
        allowed: /^[+0-9]*$/,
        character: /^[+0-9]$/,
        forbidden: /[^+0-9]/g,
        errorMsg: "Solo se permiten números y el signo + al inicio."
    },
    numero: {
        allowed: /^[0-9.]*$/,
        character: /^[0-9.]$/,
        forbidden: /[^0-9.]/g,
        errorMsg: "Solo se permiten números y punto decimal."
    },
    numero_mayor_cero: {
        allowed: /^(?=.*[1-9])[0-9.]*$/,
        character: /^[0-9.]$/,
        forbidden: /[^0-9.]/g,
        errorMsg: "El valor debe ser mayor a 0."
    },
    numero_no_cero: {
        allowed: /^(?=.*[1-9])-?[0-9.]*$/,
        character: /^[0-9.\-]$/,
        forbidden: /[^0-9.\-]/g,
        errorMsg: "El valor no puede ser 0."
    },
    cantidad: {
        allowed: /^[0-9.]*$/,
        character: /^[0-9.]$/,
        forbidden: /[^0-9.]/g,
        errorMsg: "Solo se permiten números y punto decimal."
    },
    precio: {
        allowed: /^[0-9.]*$/,
        character: /^[0-9.]$/,
        forbidden: /[^0-9.]/g,
        errorMsg: "Solo se permiten números y punto decimal."
    },
    monto: {
        allowed: /^[0-9.]*$/,
        character: /^[0-9.]$/,
        forbidden: /[^0-9.]/g,
        errorMsg: "Solo se permiten números y punto decimal."
    },
    codigo: {
        allowed: /^[a-zA-Z0-9]*$/,
        character: /^[a-zA-Z0-9]$/,
        forbidden: /[^a-zA-Z0-9]/g,
        errorMsg: "Solo se permiten letras y números sin espacios."
    },
    referencia: {
        allowed: /^[a-zA-Z0-9]*$/,
        character: /^[a-zA-Z0-9]$/,
        forbidden: /[^a-zA-Z0-9]/g,
        errorMsg: "Solo se permiten letras y números sin espacios."
    },
    id_externo: {
        allowed: /^[a-zA-Z0-9]*$/,
        character: /^[a-zA-Z0-9]$/,
        forbidden: /[^a-zA-Z0-9]/g,
        errorMsg: "Solo se permiten letras y números sin espacios."
    },
    direccion: {
        allowed: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-#/]*$/,
        character: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-#/]$/,
        forbidden: /[^a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s.,\-#/]/g,
        errorMsg: "Solo letras, números, espacios y caracteres . , - # /"
    },
    url: {
        allowed: /^[a-zA-Z0-9:\/.\-_?=&%]*$/,
        character: /^[a-zA-Z0-9:\/.\-_?=&%]$/,
        forbidden: /[^a-zA-Z0-9:\/.\-_?=&%]/g,
        errorMsg: "Solo caracteres válidos de URL (letras, números, : / . - _ ? = & %)."
    },
    enlace: {
        allowed: /^[a-zA-Z0-9:\/.\-_?=&%]*$/,
        character: /^[a-zA-Z0-9:\/.\-_?=&%]$/,
        forbidden: /[^a-zA-Z0-9:\/.\-_?=&%]/g,
        errorMsg: "Solo caracteres válidos de URL (letras, números, : / . - _ ? = & %)."
    },
    fecha: {
        allowed: /^[0-9\/\-]*$/,
        character: /^[0-9\/\-]$/,
        forbidden: /[^0-9\/\-]/g,
        errorMsg: "Solo se permiten números y los caracteres / o -"
    }
};
