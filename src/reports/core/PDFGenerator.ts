
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Genera un PDF a partir de un elemento HTML con márgenes y cortes inteligentes.
 */
export const generatePDF = async (
    element: HTMLElement,
    fileName: string
): Promise<boolean> => {
    try {
        const SCALE = 2;
        const canvas = await html2canvas(element, {
            scale: SCALE,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff",
            windowWidth: element.scrollWidth,
        });

        const totalW = canvas.width;
        const totalH = canvas.height;

        // 1. Configuración de página A4 con márgenes
        const pdf      = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        const MARGIN   = 10; // 10mm de margen físico en el PDF
        const pageW    = pdf.internal.pageSize.getWidth();
        const pageH    = pdf.internal.pageSize.getHeight();
        const usableW  = pageW - (MARGIN * 2);
        const usableH  = pageH - (MARGIN * 2);
        
        const ratio    = usableW / totalW;
        const pageHpx  = usableH / ratio;

        // 2. Bloques que no deben cortarse [data-pdf-avoid]
        const templateRect = element.getBoundingClientRect();
        const avoidBlocks: { top: number; bottom: number }[] = [];

        element.querySelectorAll<HTMLElement>("[data-pdf-avoid]").forEach((el) => {
            const r  = el.getBoundingClientRect();
            const top    = (r.top    - templateRect.top) * SCALE;
            const bottom = (r.bottom - templateRect.top) * SCALE;
            if (bottom > top) avoidBlocks.push({ top: Math.round(top), bottom: Math.round(bottom) });
        });

        // 3. Cálculo de puntos de corte
        const cutPoints: number[] = [0];
        let cursor = 0;

        while (cursor < totalH) {
            let nextCut = cursor + pageHpx;
            if (nextCut >= totalH) break;

            for (const block of avoidBlocks) {
                if (block.top < nextCut && block.bottom > nextCut) {
                    nextCut = block.top;
                    break;
                }
            }

            if (nextCut <= cursor) nextCut = cursor + pageHpx;
            cutPoints.push(Math.round(nextCut));
            cursor = nextCut;
        }
        cutPoints.push(totalH);

        // 4. Generar rebanadas (slices)
        const MIN_SLICE_PX = 80;
        const slices = cutPoints
            .slice(0, -1)
            .map((srcY, i) => ({ srcY, srcH: cutPoints[i + 1] - srcY }))
            .filter(s => s.srcH >= MIN_SLICE_PX);

        // 5. Renderizar en el PDF
        for (let i = 0; i < slices.length; i++) {
            if (i > 0) pdf.addPage();

            const { srcY, srcH } = slices[i];
            const heightMM = srcH * ratio;

            const slice = document.createElement("canvas");
            slice.width  = totalW;
            slice.height = Math.ceil(srcH);

            const ctx = slice.getContext("2d")!;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, slice.width, slice.height);
            ctx.drawImage(canvas, 0, srcY, totalW, srcH, 0, 0, totalW, srcH);

            const imgData = slice.toDataURL("image/png");
            pdf.addImage(imgData, "PNG", MARGIN, MARGIN, usableW, heightMM);
        }

        pdf.save(`${fileName}.pdf`);
        return true;

    } catch (err) {
        console.error("Error al generar PDF:", err);
        return false;
    }
};