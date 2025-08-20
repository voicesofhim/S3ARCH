/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Chat, UsageMetadata, GenerateContentResponse, Content } from '@google/genai';

// --- CONFIGURATION ---
const BASE_SYSTEM_INSTRUCTION = "You are an AI assistant helping a user write. Your primary goal is to provide concise, relevant, and in-context completions for the user's thoughts. You should act as a silent partner, completing sentences or ideas. Do not be conversational. Be a tool. Complete the user's thought based on the current text and the provided memory context. The user is typing, and you are providing a ghost text suggestion for what they might type next. Keep auto suggestions to 3 words max";
const PLACEHOLDER_TEXT = 'Type something...';
// Pricing for gemini-2.5-flash model
const PRICE_PER_INPUT_TOKEN = 0.35 / 1_000_000;
const PRICE_PER_OUTPUT_TOKEN = 0.70 / 1_000_000;

// --- DOM ELEMENTS ---
const editorElement = document.getElementById('editor') as HTMLDivElement;
const timerElement = document.getElementById('timer') as HTMLDivElement;
const statsElement = document.getElementById('stats') as HTMLDivElement;
const tokenCounterElement = document.getElementById('token-counter') as HTMLDivElement;
const costEstimatorElement = document.getElementById('cost-estimator') as HTMLDivElement;
const toggleAnalyticsElement = document.getElementById('toggle-analytics') as HTMLDivElement;
const memoryBankToggleElement = document.getElementById('memory-bank-toggle') as HTMLDivElement;
const memoryBankModalElement = document.getElementById('memory-bank-modal') as HTMLDivElement;
const memoryBankTextareaElement = document.getElementById('memory-bank-textarea') as HTMLTextAreaElement;
const memoryBankSaveElement = document.getElementById('memory-bank-save') as HTMLButtonElement;
const memoryBankCloseElement = document.getElementById('memory-bank-close') as HTMLButtonElement;

if (!editorElement || !statsElement || !timerElement || !tokenCounterElement || !costEstimatorElement || 
    !toggleAnalyticsElement || !memoryBankToggleElement || !memoryBankModalElement || 
    !memoryBankTextareaElement || !memoryBankSaveElement || !memoryBankCloseElement) {
  throw new Error('Critical error: A required element was not found in the DOM.');
}

// --- STATE ---
let ai: GoogleGenAI;
let chat: Chat;
let timerInterval: ReturnType<typeof setInterval> | undefined;
let isRequestInProgress = false;
let predictionController: AbortController | null = null;
let predictionDebounceTimer: ReturnType<typeof setTimeout> | undefined;

let totalTokens = 0;
let totalCost = 0;
let isStatsVisible = false;
let currentMemories = '';

// --- FUNCTIONS ---

const initializeChat = async () => {
    const systemInstruction = currentMemories
        ? `${BASE_SYSTEM_INSTRUCTION}\n\n--- MEMORIES ---\n${currentMemories}`
        : BASE_SYSTEM_INSTRUCTION;

    chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
      },
    });
};

const handleClearEditor = () => {
    stopTimer();
    clearSuggestion();
    predictionController?.abort();
    isRequestInProgress = false;

    editorElement.innerHTML = '';
    timerElement.textContent = '0.00s';
    
    // Reset stats
    totalTokens = 0;
    totalCost = 0;
    tokenCounterElement.textContent = '0 tokens';
    costEstimatorElement.textContent = '$0.000000';
    
    // Re-initialize chat to clear history
    initializeChat();
    
    createNewInput();
};

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = undefined;
  }
};

const getActiveInput = (): HTMLElement | null => editorElement.querySelector('.input-active');
const getGhostElement = (): HTMLElement | null => editorElement.querySelector('.ghost-text');

const updateStats = (usage: UsageMetadata) => {
    const inputTokens = usage.promptTokenCount ?? 0;
    const totalResponseTokens = usage.totalTokenCount ?? 0;
    const outputTokens = totalResponseTokens > inputTokens ? totalResponseTokens - inputTokens : 0;
    
    totalTokens += (inputTokens + outputTokens);
    totalCost += (inputTokens * PRICE_PER_INPUT_TOKEN) + (outputTokens * PRICE_PER_OUTPUT_TOKEN);
    
    tokenCounterElement.textContent = `${totalTokens} tokens`;
    costEstimatorElement.textContent = `$${totalCost.toFixed(6)}`;
};

const setupPlaceholder = (element: HTMLElement) => {
    if (element.innerText.trim() === '') {
        element.innerText = PLACEHOLDER_TEXT;
        element.classList.add('is-placeholder');
    }
};

const clearSuggestion = () => {
    predictionController?.abort();
    predictionController = null;
    getGhostElement()?.remove();
};

const acceptSuggestion = () => {
    const activeInput = getActiveInput();
    const ghostElement = getGhostElement();

    if (!activeInput || !ghostElement?.innerText) return;

    activeInput.innerText += ghostElement.innerText;
    clearSuggestion();

    // Move cursor to the end
    moveCursorToEnd(activeInput);
};

const createNewInput = (): HTMLElement => {
  const lastElement = editorElement.lastElementChild;
  if (lastElement && lastElement.tagName !== 'BR') {
     editorElement.appendChild(document.createElement('br'));
  }

  const newInput = document.createElement('span');
  newInput.className = 'input-active';
  newInput.setAttribute('contenteditable', 'true');
  newInput.setAttribute('spellcheck', 'false');
  
  editorElement.appendChild(newInput);
  setupPlaceholder(newInput);
  newInput.focus();
  
  return newInput;
};

const handleSubmit = async () => {
  if (isRequestInProgress) return;

  clearSuggestion();
  const activeInput = getActiveInput();
  if (!activeInput || activeInput.classList.contains('is-placeholder')) return;
  
  const userInput = activeInput.innerText.trim();
  if (!userInput) return;

  isRequestInProgress = true;
  stopTimer();
  timerElement.textContent = '0.00s';
  
  activeInput.classList.remove('input-active');
  activeInput.classList.add('committed-input');
  activeInput.setAttribute('contenteditable', 'false');

  const aiOutputSpan = document.createElement('span');
  aiOutputSpan.className = 'ai-output is-placeholder';
  aiOutputSpan.textContent = '...';
  activeInput.insertAdjacentElement('afterend', aiOutputSpan);
  aiOutputSpan.setAttribute('aria-busy', 'true');

  const startTime = performance.now();
  timerInterval = setInterval(() => {
    const duration = (performance.now() - startTime) / 1000;
    timerElement.textContent = `${duration.toFixed(2)}s`;
  }, 100);

  try {
    const streamResponse = await chat.sendMessageStream({ message: userInput });
    let firstChunk = true;
    let lastResponseChunk: GenerateContentResponse | undefined;

    for await (const chunk of streamResponse) {
      if (firstChunk) {
        aiOutputSpan.textContent = ' ';
        aiOutputSpan.classList.remove('is-placeholder');
        firstChunk = false;
      }
      aiOutputSpan.textContent += chunk.text;
      editorElement.scrollTop = editorElement.scrollHeight;
      lastResponseChunk = chunk;
    }

    if (lastResponseChunk?.usageMetadata) {
        updateStats(lastResponseChunk.usageMetadata);
    }

  } catch (error) {
    console.error('API Error:', error);
    aiOutputSpan.classList.remove('is-placeholder');
    aiOutputSpan.textContent = ' An error occurred. Please try again.';
  } finally {
    stopTimer();
    const endTime = performance.now();
    const duration = (endTime - startTime) / 1000;
    timerElement.textContent = `${duration.toFixed(2)}s`;
    
    if (aiOutputSpan.textContent?.endsWith('undefined')) {
      aiOutputSpan.textContent = aiOutputSpan.textContent.slice(0, -'undefined'.length);
    }

    aiOutputSpan.setAttribute('aria-busy', 'false');
    isRequestInProgress = false;
    createNewInput();
    editorElement.scrollTop = editorElement.scrollHeight;
  }
};

const streamPredictionToGhost = async (
    streamPromise: Promise<AsyncGenerator<GenerateContentResponse>>,
    signal: AbortSignal
) => {
    const activeInput = getActiveInput();
    if (!activeInput) return;

    getGhostElement()?.remove();
    const ghostElement = document.createElement('span');
    ghostElement.className = 'ghost-text';
    activeInput.insertAdjacentElement('afterend', ghostElement);

    try {
        const streamResponse = await streamPromise;
        let lastResponseChunk: GenerateContentResponse | undefined;

        for await (const chunk of streamResponse) {
            if (signal.aborted) return;
            ghostElement.textContent += chunk.text;
            lastResponseChunk = chunk;
        }
        
        if (lastResponseChunk?.usageMetadata) {
            updateStats(lastResponseChunk.usageMetadata);
        }
    } catch (error) {
        if ((error as Error).name !== 'AbortError') console.error('Prediction Error:', error);
        ghostElement.remove();
    } finally {
        if (ghostElement.textContent?.endsWith('undefined')) {
           ghostElement.textContent = ghostElement.textContent.slice(0, -'undefined'.length);
        }
        if (ghostElement.textContent?.trim() === '') ghostElement.remove();
    }
};


const startPredictionStream = async () => {
    const activeInput = getActiveInput();
    if (!activeInput || activeInput.classList.contains('is-placeholder') || isRequestInProgress) return;

    const currentText = activeInput.innerText;
    if (currentText.trim() === '') {
        clearSuggestion();
        return;
    }

    predictionController?.abort();
    predictionController = new AbortController();
    const { signal } = predictionController;

    const streamPromise = chat.sendMessageStream({ message: currentText });
    await streamPredictionToGhost(streamPromise, signal);
};

const getChatHistoryFromDOM = (): Content[] => {
    const history: Content[] = [];
    const editorChildren = Array.from(editorElement.children);

    for (const child of editorChildren) {
        if (child.classList.contains('committed-input')) {
            history.push({
                role: 'user',
                parts: [{ text: (child as HTMLElement).innerText.trim() }],
            });
        } else if (child.classList.contains('ai-output')) {
            if (!child.classList.contains('is-placeholder')) {
                 history.push({
                    role: 'model',
                    parts: [{ text: (child as HTMLElement).innerText.trim() }],
                });
            }
        }
    }
    return history;
};

const startPredictionWithoutMemory = async () => {
    const activeInput = getActiveInput();
    if (!activeInput || activeInput.classList.contains('is-placeholder') || isRequestInProgress) return;
    
    const currentText = activeInput.innerText;
    // No need to check for empty trim, as this is user-invoked
    
    predictionController?.abort();
    predictionController = new AbortController();
    const { signal } = predictionController;

    const history = getChatHistoryFromDOM();
    const contents: Content[] = [...history, { role: 'user', parts: [{ text: currentText }] }];

    const streamPromise = ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
            systemInstruction: BASE_SYSTEM_INSTRUCTION,
            thinkingConfig: { thinkingBudget: 0 },
        },
    });
    await streamPredictionToGhost(streamPromise, signal);
};

const isCursorAtEnd = (element: HTMLElement) => {
    const selection = window.getSelection();
    if (!selection?.rangeCount) return false;
    const range = selection.getRangeAt(0);
    return range.collapsed && range.endOffset === element.textContent?.length;
};

const moveCursorToEnd = (element: HTMLElement) => {
    const range = document.createRange();
    const sel = window.getSelection();
    if (sel) {
        range.selectNodeContents(element);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
    }
    element.focus();
};

// --- INITIALIZATION ---

async function main() {
    // Load memories from localStorage or fetch from file
    const savedMemories = localStorage.getItem('memories');
    if (savedMemories) {
        currentMemories = savedMemories;
    } else {
        try {
            const response = await fetch('/memories.txt');
            if (response.ok) {
                currentMemories = await response.text();
                localStorage.setItem('memories', currentMemories);
            }
        } catch (error) {
            console.warn('Could not load memories.txt. Continuing without it.');
        }
    }

    // Initialize AI
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    await initializeChat();

    // Setup Event Listeners
    editorElement.addEventListener('input', (e) => {
        const target = e.target as HTMLElement;
        if (!target.matches('.input-active')) return;

        if (target.classList.contains('is-placeholder')) {
            target.innerText = '';
            target.classList.remove('is-placeholder');
        }
        
        clearTimeout(predictionDebounceTimer);
        clearSuggestion();
        predictionDebounceTimer = setTimeout(startPredictionStream, 300);
    });

    editorElement.addEventListener('keydown', (e) => {
      const activeInput = getActiveInput();
      if (!activeInput) return;

      // Handle Alt+Backspace for word deletion
      if (e.key === 'Backspace' && e.altKey) {
        e.preventDefault();
        if (activeInput.classList.contains('is-placeholder')) return;
        const text = activeInput.innerText;
        if (text.length === 0) return;

        let i = text.length - 1;
        // Find the end of the last word (skip trailing spaces)
        while (i >= 0 && /\s/.test(text[i])) {
            i--;
        }
        // Find the start of the last word
        let j = i;
        while (j >= 0 && !/\s/.test(text[j])) {
            j--;
        }
        
        activeInput.innerText = text.substring(0, j + 1);
        moveCursorToEnd(activeInput);

        // Manually trigger suggestion logic
        clearTimeout(predictionDebounceTimer);
        clearSuggestion();
        predictionDebounceTimer = setTimeout(startPredictionStream, 300);
        return;
      }

      const ghostElement = getGhostElement();
      const hasGhostText = ghostElement && ghostElement.innerText.trim() !== '';

      if (e.key === '>' && e.shiftKey) {
          e.preventDefault();
          startPredictionWithoutMemory();
      } else if (e.key === 'Tab' || (e.key === 'ArrowRight' && isCursorAtEnd(activeInput))) {
        if (hasGhostText) {
          e.preventDefault();
          acceptSuggestion();
        } else if (e.key === 'Tab') {
          e.preventDefault();
          handleSubmit();
        }
      } else if (e.key === 'Escape') {
        if (hasGhostText) {
          e.preventDefault();
          clearSuggestion();
        }
      } else if (e.key.length > 1 && e.key !== 'Backspace' && e.key !== 'Delete') {
        clearSuggestion();
      }
    });

    editorElement.addEventListener('blur', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('.input-active')) {
        clearSuggestion();
        setupPlaceholder(target);
      }
    }, true);

    editorElement.addEventListener('click', (e) => {
      if (e.target === editorElement) {
        let activeInput = getActiveInput();
        if (!activeInput) {
          activeInput = createNewInput();
        }
        
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(activeInput);
        range.collapse(false);
        if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
        }
        activeInput.focus();
      }
    });

    toggleAnalyticsElement.addEventListener('click', () => {
        isStatsVisible = !isStatsVisible;
        statsElement.classList.toggle('hidden', !isStatsVisible);
    });
    
    memoryBankToggleElement.addEventListener('click', () => {
        memoryBankTextareaElement.value = currentMemories;
        memoryBankModalElement.classList.remove('hidden');
    });

    memoryBankCloseElement.addEventListener('click', () => {
        memoryBankModalElement.classList.add('hidden');
    });

    memoryBankSaveElement.addEventListener('click', async () => {
        currentMemories = memoryBankTextareaElement.value;
        localStorage.setItem('memories', currentMemories);
        memoryBankModalElement.classList.add('hidden');
        
        alert('Memories saved. The editor will now be reloaded.');
        handleClearEditor();
    });

    // Final UI setup
    timerElement.textContent = '0.00s';
    tokenCounterElement.textContent = '0 tokens';
    costEstimatorElement.textContent = '$0.000000';
    createNewInput();
}

main();