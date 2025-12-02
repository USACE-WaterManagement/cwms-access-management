import hljs from 'highlight.js/lib/core';
import rego from '@styra/highlightjs-rego';
import 'highlight.js/styles/github-dark-dimmed.min.css';

hljs.registerLanguage('rego', rego);

export default hljs;
