
import React, { useState, useRef } from 'react';
import { CURRICULUM } from './constants';
import { ExamData, Chapter } from './types';
import { generateExam } from './geminiService';
import { generateExamDoc } from './docxGenerator';

const ChemicalText: React.FC<{ text: string }> = ({ text }) => {
  const parts = text.split(/(\_{.*?\}|\^{.*?\}|\n)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part === '\n') return <br key={i} />;
        if (part.startsWith('_{') && part.endsWith('}')) {
          return <sub key={i} className="text-[0.8em] align-baseline relative top-[0.3em]">{part.slice(2, -1)}</sub>;
        }
        if (part.startsWith('^{') && part.endsWith('}')) {
          return <sup key={i} className="text-[0.8em] align-baseline relative top-[-0.4em]">{part.slice(2, -1)}</sup>;
        }
        return part;
      })}
    </span>
  );
};

const App: React.FC = () => {
  const [selectedGrade, setSelectedGrade] = useState<number>(10);
  const [selectedChapters, setSelectedChapters] = useState<Chapter[]>([]);
  const [unitName, setUnitName] = useState<string>('');
  const [extraNotes, setExtraNotes] = useState<string>('');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progressMsg, setProgressMsg] = useState<string>('');
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = error => reject(error);
    });
  };

  const handleCreateExam = async () => {
    if (selectedChapters.length === 0) {
      alert("Vui lòng chọn ít nhất một chương!");
      return;
    }

    if (pdfFile && pdfFile.size > 45 * 1024 * 1024) {
      alert("File PDF quá lớn (tối đa 45MB). Vui lòng chọn file khác.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setExamData(null);
    setProgressMsg("Đang chuẩn bị...");

    try {
      let pdfBase64 = null;
      if (pdfFile) {
        setProgressMsg("Đang mã hóa tài liệu PDF...");
        pdfBase64 = await fileToBase64(pdfFile);
      }

      const chapterNames = selectedChapters.map(c => c.name).join(', ');

      const data = await generateExam(
        selectedGrade, 
        chapterNames, 
        extraNotes, 
        unitName || null, 
        pdfBase64, 
        setProgressMsg
      );
      setExamData(data);
      setProgressMsg("Thành công!");
    } catch (err: any) {
      console.error(err);
      setError("Không thể tạo đề. Vui lòng kiểm tra lại file PDF hoặc nội dung yêu cầu.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDoc = async (type: 'exam' | 'answer') => {
    if (!examData) return;
    const blob = await generateExamDoc(examData, type === 'answer');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const fileNameSuffix = 'De_On_Tap';
    const mainName = unitName || (selectedChapters.length === 1 ? selectedChapters[0].name : 'TongHop');
    link.download = `${type === 'exam' ? fileNameSuffix : 'Dap_An'}_Lop${selectedGrade}_${mainName.replace(/ /g, '_')}.docx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleChapter = (ch: Chapter) => {
    setSelectedChapters([ch]);
  };

  const activeGradeData = CURRICULUM.find(g => g.grade === selectedGrade);
  const labelMap = ['a', 'b', 'c', 'd'];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <header className="text-center mb-10 relative">
        <div className="absolute top-0 right-0 hidden md:block">
          <div className="bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-[10px] font-black text-blue-700 tracking-tighter uppercase">Gemini 3.5 Flash Optimized</span>
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-blue-950 mb-3 uppercase tracking-tight">
          TẠO ĐỀ ÔN TẬP CHƯƠNG 50 MCQ & 25 True/False
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-sm">
          Tạo đề ôn tập chương gồm 50 câu trắc nghiệm MCQ và 25 câu Đúng/Sai từ chương trình chuẩn hoặc tài liệu PDF cá nhân.
        </p>
      </header>

      {!examData ? (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Cột trái: Chọn chương */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-800">1. Lớp & Chương học</h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Lớp học</label>
                  <div className="flex gap-1">
                    {[10, 11, 12].map(g => (
                      <button
                        key={g}
                        onClick={() => { setSelectedGrade(g); setSelectedChapters([]); }}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
                          selectedGrade === g ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        Lớp {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Chọn chương ôn tập
                  </label>
                  <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {activeGradeData?.chapters.map(ch => (
                      <button
                        key={ch.id}
                        onClick={() => toggleChapter(ch)}
                        className={`w-full text-left p-3 rounded-xl border-2 text-sm transition-all relative ${
                          selectedChapters.find(c => c.id === ch.id) ? 'border-blue-500 bg-blue-50 font-semibold' : 'border-transparent bg-slate-50 hover:bg-slate-100'
                        }`}
                      >
                        {ch.name}
                        {selectedChapters.find(c => c.id === ch.id) && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 font-bold">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Tùy chọn chuyên sâu & PDF */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">2. Tùy chọn Module & Tài liệu (PDF)</h3>
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold uppercase">Nâng cao</span>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Đơn vị kiến thức cụ thể (Module)</label>
                      <input 
                        type="text"
                        value={unitName}
                        onChange={(e) => setUnitName(e.target.value)}
                        placeholder="Ví dụ: Định luật bảo toàn khối lượng..."
                        className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Tải lên file PDF tham khảo</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                          pdfFile ? 'border-green-400 bg-green-50' : 'border-slate-200 hover:border-blue-400'
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          accept="application/pdf"
                          onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                        />
                        {pdfFile ? (
                          <div className="text-green-600 font-medium">
                            <p className="text-sm">✓ {pdfFile.name}</p>
                            <button onClick={(e) => { e.stopPropagation(); setPdfFile(null); }} className="text-[10px] underline mt-2 text-red-500">Xóa file</button>
                          </div>
                        ) : (
                          <div className="text-slate-400">
                            <p className="text-sm font-medium">Kéo thả hoặc Click để tải PDF</p>
                            <p className="text-[10px] mt-1">(Tối đa 45MB)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ghi chú yêu cầu riêng</label>
                    <textarea
                      value={extraNotes}
                      onChange={(e) => setExtraNotes(e.target.value)}
                      placeholder="Nhập yêu cầu như: 30% câu hỏi mức độ vận dụng cao, tập trung vào bài toán nồng độ..."
                      className="w-full h-full min-h-[160px] p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm transition-all"
                    />
                  </div>
                </div>

                <button
                  disabled={selectedChapters.length === 0 || isGenerating}
                  onClick={handleCreateExam}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex flex-col items-center justify-center gap-1 transition-all ${
                    isGenerating 
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white shadow-xl hover:bg-blue-700 hover:-translate-y-1 active:scale-[0.98]'
                  }`}
                >
                  <span className="flex items-center gap-3">
                    {isGenerating ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        {progressMsg}
                      </>
                    ) : 'TẠO ĐỀ ÔN TẬP (50 MCQ + 25 ĐÚNG/SAI)'}
                  </span>
                  {isGenerating && (
                    <span className="text-[10px] font-medium text-slate-400 animate-pulse uppercase tracking-[0.2em]">High Speed Mode Active</span>
                  )}
                </button>
                {error && <p className="text-red-500 text-center text-xs font-medium bg-red-50 p-2 rounded-lg">{error}</p>}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border-2 border-blue-600 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-100">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">Hoàn tất</span>
                <h2 className="text-xl font-black text-slate-800 uppercase">Đã tạo đề thi thành công!</h2>
              </div>
              <p className="text-slate-500 text-sm italic">
                Căn cứ: {unitName ? `Bài học ${unitName}` : `Các chương: ${selectedChapters.map(c => c.name).join(', ')}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => downloadDoc('exam')} className="bg-white text-blue-700 border-2 border-blue-700 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all">Tải Đề thi</button>
              <button onClick={() => downloadDoc('answer')} className="bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-800 transition-all shadow-lg shadow-blue-200">Tải Đáp án</button>
              <button onClick={() => { setExamData(null); setPdfFile(null); setUnitName(''); }} className="bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold text-sm">Tạo lại</button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h3 className="text-lg font-black text-blue-900 border-b-2 border-slate-100 pb-4 mb-6">XEM TRƯỚC NỘI DUNG</h3>
            <div className="grid md:grid-cols-2 gap-10">
              {examData.mcqs && examData.mcqs.length > 0 && (
                <section>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Phần I (MCQ) - Trích đoạn</h4>
                  {examData.mcqs.slice(0, 2).map((q, i) => (
                    <div key={i} className="mb-6">
                      <p className="font-bold text-slate-800 mb-2 leading-relaxed">Câu {i+1}. <ChemicalText text={q.question} /></p>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                        {['A', 'B', 'C', 'D'].map(opt => (
                          <p key={opt} className={q.correctAnswer === opt ? 'text-blue-600 font-bold' : ''}>
                            {opt}. <ChemicalText text={(q.options as any)[opt]} />
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              )}
              <section className={examData.mcqs && examData.mcqs.length > 0 ? '' : 'md:col-span-2'}>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Phần II (Đúng/Sai) - Trích đoạn</h4>
                {examData.trueFalse.slice(0, 1).map((q, i) => (
                  <div key={i}>
                    <p className="font-bold text-slate-800 mb-2 bg-slate-50 p-3 rounded-lg border-l-4 border-blue-500">
                      Câu 1. <ChemicalText text={q.context} />
                    </p>
                    <div className="space-y-2 ml-4 text-xs">
                      {q.statements.map((s, idx) => (
                        <p key={idx} className={s.isCorrect ? 'text-blue-600 font-bold' : 'text-slate-600'}>
                          {labelMap[idx]}) <ChemicalText text={s.text} />
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </section>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-100 text-center">
              <p className="text-slate-400 text-xs italic">
                Vui lòng tải file Word (.docx) để xem đầy đủ toàn bộ 50 câu trắc nghiệm MCQ và 25 câu Đúng/Sai.
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default App;
