import registerHR from './components/demos/hr-alpine.js';
import registerPortfolio from './components/demos/portfolio-alpine.js';
import registerAsk from './components/layout/ask-palette';
import registerLab from './components/lab/prototypes.js';
import registerPromptBuilder from './lib/prompt-builder/workspace';

export default function setup(Alpine) {
    registerHR(Alpine);
    registerPortfolio(Alpine);
    registerAsk(Alpine);
    registerLab(Alpine);
    registerPromptBuilder(Alpine);
}
