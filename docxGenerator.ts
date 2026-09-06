
import { Document, Packer, Paragraph, TextRun, AlignmentType, UnderlineType } from "docx";
import { ExamData } from "./types";

const parseChemicalText = (text: string, options: { bold?: boolean, italics?: boolean, underline?: boolean, size?: number, color?: string } = {}): TextRun[] => {
  if (!text) return [];
  const parts = text.split(/(\_{.*?\}|\^{.*?\})/g);
  
  return parts.filter(p => p !== undefined && p !== "").map(part => {
    if (part.startsWith('_{') && part.endsWith('}')) {
      return new TextRun({
        text: part.slice(2, -1),
        subScript: true,
        bold: options.bold,
        italics: options.italics,
        size: options.size,
        color: options.color,
        underline: options.underline ? { type: UnderlineType.SINGLE } : undefined,
      });
    }
    if (part.startsWith('^{') && part.endsWith('}')) {
      return new TextRun({
        text: part.slice(2, -1),
        superScript: true,
        bold: options.bold,
        italics: options.italics,
        size: options.size,
        color: options.color,
        underline: options.underline ? { type: UnderlineType.SINGLE } : undefined,
      });
    }
    return new TextRun({
      text: part,
      bold: options.bold,
      italics: options.italics,
      size: options.size,
      color: options.color,
      underline: options.underline ? { type: UnderlineType.SINGLE } : undefined,
    });
  });
};

export const generateExamDoc = async (data: ExamData, isAnswerKey: boolean = false): Promise<Blob> => {
  const paragraphSpacing = { before: 0, after: 0, line: 220 };

  const children: any[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({ 
          text: `ĐỀ ÔN TẬP HÓA HỌC LỚP ${data.grade} - TỈ LỆ 40-30-30`, 
          bold: true, 
          size: 26 
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({ 
          text: (data.unitName || data.chapter).toUpperCase(), 
          bold: true, 
          size: 22 
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({ 
          text: isAnswerKey ? "(BẢN ĐÁP ÁN TIẾT KIỆM GIẤY)" : "(BẢN ĐỀ THI)", 
          italics: true, 
          size: 18 
        }),
      ],
    }),
  ];

  // MCQ Section
  if (data.mcqs && data.mcqs.length > 0) {
    children.push(new Paragraph({ 
      spacing: { ...paragraphSpacing, before: 200, after: 80 },
      children: [new TextRun({ text: "PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn.", bold: true, size: 24 })] 
    }));

    data.mcqs.forEach((q, index) => {
      children.push(new Paragraph({
        spacing: { ...paragraphSpacing, before: (index === 0 || isAnswerKey) ? 0 : 80 },
        alignment: AlignmentType.BOTH,
        children: [
          new TextRun({ text: `Câu ${index + 1}. `, bold: true, size: 22 }),
          ...parseChemicalText(q.question, { size: 22 })
        ],
      }));

      (['A', 'B', 'C', 'D'] as const).forEach(opt => {
        const isCorrect = isAnswerKey && q.correctAnswer === opt;
        children.push(new Paragraph({
          indent: { left: 420 },
          spacing: paragraphSpacing,
          children: [
            ...parseChemicalText(`${opt}. ${q.options[opt]}`, {
              size: 22,
              bold: false,
              underline: isCorrect,
              color: isCorrect ? "0000FF" : undefined
            })
          ],
        }));
      });
    });
  }

  // True/False Section
  if (data.trueFalse && data.trueFalse.length > 0) {
    const tfTitle = data.mcqs && data.mcqs.length > 0 
      ? `PHẦN II. Câu trắc nghiệm đúng sai (có ${data.trueFalse.length} câu).`
      : `PHẦN TRẮC NGHIỆM ĐÚNG SAI (có ${data.trueFalse.length} câu).`;

    children.push(new Paragraph({ 
      spacing: { before: 200, after: 40 }, 
      children: [new TextRun({ text: tfTitle, bold: true, size: 24 })] 
    }));

    const labelMap = ['a', 'b', 'c', 'd'];

    data.trueFalse.forEach((q, index) => {
    children.push(new Paragraph({
      spacing: { ...paragraphSpacing, before: (index === 0 || isAnswerKey) ? 0 : 120 },
      alignment: AlignmentType.BOTH, // Căn lề đều cho bối cảnh dài
      children: [
        new TextRun({ text: `Câu ${index + 1}. `, bold: true, size: 22 }),
        ...parseChemicalText(q.context, { size: 22, italics: true }) // In nghiêng bối cảnh để phân biệt
      ],
    }));

    q.statements.forEach((s, sIdx) => {
      const isCorrect = isAnswerKey && s.isCorrect;
      const label = labelMap[sIdx] || 'a';
      children.push(new Paragraph({
        indent: { left: 420 },
        spacing: paragraphSpacing,
        children: [
          ...parseChemicalText(`${label}) ${s.text}`, {
            size: 22,
            bold: false,
            underline: isCorrect,
            color: isCorrect ? "0000FF" : undefined
          })
        ],
      }));
    });
  });
}

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 400, bottom: 400, left: 567, right: 400 }
        }
      },
      children: children,
    }],
  });

  return await Packer.toBlob(doc);
};
