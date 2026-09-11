(function () {
  const keywordPattern = /\b(and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)\b/;
  const builtinPattern = /\b(abs|all|any|bin|bool|bytearray|bytes|chr|complex|dict|enumerate|filter|float|format|frozenset|hex|int|isinstance|issubclass|iter|len|list|map|max|min|next|object|oct|open|ord|pow|print|range|reversed|round|set|slice|sorted|str|sum|tuple|type|zip)\b/;
  const stringPattern = /(['"`])(?:\\.|(?!\1)[^\\\n])*\1/;
  const commentPattern = /#[^\n]*/;
  const numberPattern = /\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/i;
  const operatorPattern = /^[()+\-*/=%<>!:.]+$/;

  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function highlightText(text) {
    const tokenPattern = /(['"`])(?:\\.|(?!\1)[^\\\n])*\1|#[^\n]*|\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b|\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)\b|\b(?:abs|all|any|bin|bool|bytearray|bytes|chr|complex|dict|enumerate|filter|float|format|frozenset|hex|int|isinstance|issubclass|iter|len|list|map|max|min|next|object|oct|open|ord|pow|print|range|reversed|round|set|slice|sorted|str|sum|tuple|type|zip)\b|[()+\-*/=%<>!:.]+|\s+|\S+/g;

    let result = '';
    let lastIndex = 0;
    let match;

    while ((match = tokenPattern.exec(text)) !== null) {
      const token = match[0];
      result += escapeHtml(text.slice(lastIndex, match.index));

      if (token.match(stringPattern)) {
        result += '<span class="token string">' + escapeHtml(token) + '</span>';
      } else if (token.match(commentPattern)) {
        result += '<span class="token comment">' + escapeHtml(token) + '</span>';
      } else if (token.match(numberPattern)) {
        result += '<span class="token number">' + escapeHtml(token) + '</span>';
      } else if (token.match(keywordPattern)) {
        result += '<span class="token keyword">' + escapeHtml(token) + '</span>';
      } else if (token.match(builtinPattern)) {
        result += '<span class="token builtin">' + escapeHtml(token) + '</span>';
      } else if (operatorPattern.test(token)) {
        result += '<span class="token operator">' + escapeHtml(token) + '</span>';
      } else {
        result += escapeHtml(token);
      }

      lastIndex = match.index + token.length;
    }

    result += escapeHtml(text.slice(lastIndex));
    return result;
  }

  function highlightNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      if (text && text.trim() !== '') {
        const fragment = document.createDocumentFragment();
        const temp = document.createElement('span');
        temp.innerHTML = highlightText(text);
        while (temp.firstChild) {
          fragment.appendChild(temp.firstChild);
        }
        node.parentNode.replaceChild(fragment, node);
      }
      return;
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(highlightNode);
    }
  }

  function fallbackCopy(text) {
    const tempArea = document.createElement('textarea');
    tempArea.value = text;
    tempArea.setAttribute('readonly', '');
    tempArea.style.position = 'fixed';
    tempArea.style.left = '-9999px';
    document.body.appendChild(tempArea);
    tempArea.select();
    document.execCommand('copy');
    document.body.removeChild(tempArea);
  }

  function attachCopyButton(block, codeWrapper) {
    if (block.querySelector('.copy-code-btn')) {
      return;
    }

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-code-btn';
    button.setAttribute('aria-label', 'Скопировать код');
    button.title = 'Скопировать код';
    button.innerHTML = '<span aria-hidden="true">⧉</span>';

    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();

      const text = codeWrapper.textContent.replace(/\r\n/g, '\n');
      const copyAction = navigator.clipboard && navigator.clipboard.writeText
        ? navigator.clipboard.writeText(text)
        : Promise.resolve().then(function () {
            fallbackCopy(text);
          });

      copyAction
        .then(function () {
          button.classList.add('copied');
          button.innerHTML = '<span aria-hidden="true">✓</span>';
          window.setTimeout(function () {
            button.classList.remove('copied');
            button.innerHTML = '<span aria-hidden="true">⧉</span>';
          }, 1400);
        })
        .catch(function () {
          fallbackCopy(text);
          button.classList.add('copied');
          button.innerHTML = '<span aria-hidden="true">✓</span>';
          window.setTimeout(function () {
            button.classList.remove('copied');
            button.innerHTML = '<span aria-hidden="true">⧉</span>';
          }, 1400);
        });
    });

    block.appendChild(button);
  }

  function processCodeBlocks(root) {
    const blocks = root.querySelectorAll('pre');
    blocks.forEach(function (block) {
      if (block.dataset.syntaxHighlighted === 'true') {
        return;
      }

      let codeWrapper = block.querySelector('code');
      if (!codeWrapper) {
        codeWrapper = document.createElement('code');
        codeWrapper.className = 'code-block-content';
        while (block.firstChild) {
          codeWrapper.appendChild(block.firstChild);
        }
        block.appendChild(codeWrapper);
      }

      block.classList.add('code-block--highlighted');
      codeWrapper.classList.add('code-block-content');
      highlightNode(codeWrapper);
      attachCopyButton(block, codeWrapper);
      block.dataset.syntaxHighlighted = 'true';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      processCodeBlocks(document);
    });
  } else {
    processCodeBlocks(document);
  }
})();
