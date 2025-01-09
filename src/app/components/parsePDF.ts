const parsePDF = async (file: File) => {
    try {
      if (!window.pdfjsLib) {
        throw new Error('PDF.js library not loaded');
      }
  
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
  
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join('\n'); // Changed from space to newline
        fullText += pageText + '\n';
      }
  
      // Clean up common PDF artifacts
      fullText = fullText
        .replace(/Sides by Breakdown Services.*$/gm, '') // Remove footer
        .replace(/\d{1,2}\/\d{1,2}\/\d{2,4}/g, '')     // Remove dates
        .replace(/Table Draft.*$/gm, '')                // Remove draft info
        .replace(/SCENE [A-Z]/g, '')                    // Remove scene labels
        .replace(/START →|← END/g, '')                  // Remove start/end markers
        .replace(/\s{2,}/g, '\n')                      // Replace multiple spaces with newlines
        .split('\n')
        .filter(line => line.trim())                   // Remove empty lines
        .join('\n');
  
      return fullText;
    } catch (err) {
      console.error('PDF parsing error:', err);
      throw new Error('Error parsing PDF');
    }
  };