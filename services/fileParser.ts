
// Add declarations for global variables from CDN scripts
declare const pdfjsLib: any;
declare const docxPreview: any;
declare const JSZip: any;
declare const Tesseract: any;

// Helper to handle multiple files
export const parseFiles = async (files: File[], onProgress: (message: string) => void): Promise<string> => {
    onProgress(`正在讀取與分析 ${files.length} 個文件...<br><span class="sub-text">Reading and analyzing ${files.length} documents...</span>`);
    const parsingPromises = Array.from(files).map(file => parseFile(file, onProgress));
    const contents = await Promise.all(parsingPromises);
    return contents.join('\n\n---\n\n'); // Join content with a separator
};


// Main parsing logic for a single file
const parseFile = (file: File, onProgress: (message: string) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        if (file.type.startsWith('image/')) {
            onProgress('AI 正在辨識圖片中的文字...<br><span class="sub-text">AI is recognizing text from the image... (This may take a moment)</span>');
            Tesseract.recognize(
                file,
                'eng+chi_tra',
                {
                    logger: (m: any) => {
                        if (m.status === 'recognizing text') {
                            onProgress(`辨識進度: ${Math.round(m.progress * 100)}%<br><span class="sub-text">Recognition progress: ${Math.round(m.progress * 100)}%</span>`);
                        }
                    }
                }
            ).then(({ data: { text } }: { data: { text: string } }) => {
                resolve(text);
            }).catch((err: any) => {
                console.error(err);
                reject(new Error('圖片文字辨識失敗 / Failed to recognize text from image.'));
            });
        } else if (file.type === 'application/pdf') {
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const pdf = await pdfjsLib.getDocument({ data }).promise;
                    let textContent = '';
                    for (let i = 1; i <= pdf.numPages; i++) {
                        onProgress(`正在讀取 PDF 檔案: ${i}/${pdf.numPages} 頁...<br><span class="sub-text">Reading PDF: page ${i}/${pdf.numPages}...</span>`);
                        const page = await pdf.getPage(i);
                        const text = await page.getTextContent();
                        textContent += text.items.map((s: any) => s.str).join(' ');
                    }
                    resolve(textContent);
                } catch (err) {
                    reject(new Error('讀取 PDF 檔案失敗 / Failed to read PDF file.'));
                }
            };
            reader.readAsArrayBuffer(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
             reader.onload = (e) => {
                const previewContainer = document.createElement('div');
                previewContainer.style.display = 'none';
                document.body.appendChild(previewContainer);
                onProgress('正在讀取 DOCX 檔案...<br><span class="sub-text">Reading DOCX file...</span>');
                docxPreview.renderAsync(e.target?.result as ArrayBuffer, previewContainer)
                    .then(() => {
                        setTimeout(() => {
                             resolve(previewContainer.innerText);
                             document.body.removeChild(previewContainer);
                        }, 100);
                    })
                    .catch(() => reject(new Error('讀取 DOCX 檔案失敗 / Failed to read DOCX file.')));
            };
            reader.readAsArrayBuffer(file);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
            reader.onload = async (e) => {
                try {
                    onProgress('正在讀取 PPTX 檔案...<br><span class="sub-text">Reading PPTX file...</span>');
                    const arrayBuffer = e.target?.result as ArrayBuffer;
                    const zip = await JSZip.loadAsync(arrayBuffer);
                    const slidePromises: Promise<string>[] = [];
                    zip.folder("ppt/slides")?.forEach((relativePath, file) => {
                         if (relativePath.endsWith(".xml") && !file.dir) {
                             slidePromises.push(file.async("string"));
                         }
                    });

                    const slideXmls = await Promise.all(slidePromises);
                    let fullText = "";
                    const parser = new DOMParser();
                    for (const slideXml of slideXmls) {
                        const xmlDoc = parser.parseFromString(slideXml, "application/xml");
                        const textNodes = xmlDoc.querySelectorAll("a\\:t");
                        textNodes.forEach(node => {
                            fullText += node.textContent + " ";
                        });
                    }
                    resolve(fullText);
                } catch (err) {
                    reject(new Error('讀取 PPTX 檔案失敗 / Failed to read PPTX file.'));
                }
            };
            reader.readAsArrayBuffer(file);
        } else if (file.type === 'text/plain') {
            onProgress('正在讀取 TXT 檔案...<br><span class="sub-text">Reading TXT file...</span>');
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = () => reject(new Error('讀取 TXT 檔案失敗 / Failed to read TXT file.'));
            reader.readAsText(file);
        } else {
            reject(new Error(`不支援的檔案格式: ${file.type} / Unsupported file format: ${file.type}.`));
        }
    });
};
