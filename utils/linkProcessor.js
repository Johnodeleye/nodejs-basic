const linkProcessor = {
  processLinks: async (html, links) => {
    if (!html || !links || links.length === 0) {
      return html;
    }

    try {
      const jsdom = require('jsdom');
      const { JSDOM } = jsdom;
      
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      links.forEach(link => {
        const linkText = link.text;
        const linkUrl = link.url;
        
        const walker = document.createTreeWalker(
          document.body,
          dom.window.NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              if (node.parentElement.tagName === 'SCRIPT' || 
                  node.parentElement.tagName === 'STYLE' ||
                  node.parentElement.tagName === 'A') {
                return dom.window.NodeFilter.FILTER_REJECT;
              }
              return dom.window.NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        const textNodes = [];
        let currentNode;
        while (currentNode = walker.nextNode()) {
          textNodes.push(currentNode);
        }

        textNodes.forEach(node => {
          const text = node.nodeValue;
          if (text && text.includes(linkText)) {
            const fragment = document.createDocumentFragment();
            const parts = text.split(linkText);
            
            for (let i = 0; i < parts.length; i++) {
              if (parts[i]) {
                fragment.appendChild(document.createTextNode(parts[i]));
              }
              
              if (i < parts.length - 1) {
                const linkElement = document.createElement('a');
                linkElement.href = linkUrl;
                linkElement.textContent = linkText;
                linkElement.target = '_blank';
                linkElement.rel = 'noopener noreferrer';
                linkElement.style.display = 'inline-block';
                linkElement.style.backgroundColor = '#1E3A8A';
                linkElement.style.color = '#ffffff';
                linkElement.style.padding = '8px 16px';
                linkElement.style.borderRadius = '8px';
                linkElement.style.textDecoration = 'none';
                linkElement.style.fontWeight = '600';
                linkElement.style.margin = '4px 0';
                linkElement.style.border = 'none';
                linkElement.style.cursor = 'pointer';
                fragment.appendChild(linkElement);
              }
            }
            
            node.parentNode.replaceChild(fragment, node);
          }
        });
      });

      return dom.serialize();
    } catch (error) {
      console.error('Error processing links:', error);
      return html;
    }
  },

  generateButtonHtml: (text, url) => {
    return `
      <div style="text-align: center; margin: 20px 0;">
        <a href="${url}" 
           target="_blank" 
           rel="noopener noreferrer"
           style="display: inline-block; 
                  background-color: #1E3A8A; 
                  color: #ffffff; 
                  padding: 12px 24px; 
                  border-radius: 8px; 
                  text-decoration: none; 
                  font-weight: 600; 
                  font-size: 16px;
                  border: none;
                  cursor: pointer;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          ${text}
        </a>
      </div>
    `;
  }
};

module.exports = linkProcessor;