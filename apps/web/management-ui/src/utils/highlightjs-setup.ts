import hljs from 'highlight.js/lib/core';
import rego from '@styra/highlightjs-rego/dist/rego.es.min.js';
import 'highlight.js/styles/github.min.css';

hljs.registerLanguage('rego', rego);

export default hljs