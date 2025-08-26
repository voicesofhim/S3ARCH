/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Chat, UsageMetadata, GenerateContentResponse, Content } from '@google/genai';

// --- CONFIGURATION ---
const BASE_SYSTEM_INSTRUCTION = "You are an AI assistant helping a user write. Your primary goal is to provide concise, relevant, and in-context completions for the user's thoughts. You should act as a silent partner, completing sentences or ideas. Do not be conversational. Be a tool. Complete the user's thought based on the current text and the provided memory context. The user is typing, and you are providing a ghost text suggestion for what they might type next. Keep auto suggestions to 3 words max";
const PLACEHOLDER_TEXT = '';
// Pricing for 

const PRICE_PER_INPUT_TOKEN = 0.10 / 1_000_000;
const PRICE_PER_OUTPUT_TOKEN = 0.40 / 1_000_000;

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
const memoryBankClearElement = document.getElementById('memory-bank-clear') as HTMLButtonElement;
const memoryBankCloseElement = document.getElementById('memory-bank-close') as HTMLButtonElement;
const contextModeIndicatorElement = document.getElementById('context-mode-indicator') as HTMLDivElement;
const socraticMemoryToggleElement = document.getElementById('socratic-memory-toggle') as HTMLDivElement;

if (!editorElement || !statsElement || !timerElement || !tokenCounterElement || !costEstimatorElement || 
    !toggleAnalyticsElement || !memoryBankToggleElement || !memoryBankModalElement || 
    !memoryBankTextareaElement || !memoryBankSaveElement || !memoryBankClearElement || !memoryBankCloseElement || 
    !contextModeIndicatorElement || !socraticMemoryToggleElement) {
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
let currentContextMode: 'memory' | 'model' = 'memory';
let socraticQuestionTimer: ReturnType<typeof setTimeout> | undefined;
let socraticMemoryEnabled = true;

// --- FUNCTIONS ---

const updateContextModeIndicator = (mode: 'memory' | 'model') => {
    currentContextMode = mode;
    
    // Clear all mode classes first
    contextModeIndicatorElement.classList.remove('model-mode', 'web-mode');
    
    if (mode === 'memory') {
        contextModeIndicatorElement.textContent = '[ Memory Mode + Web Search ]';
    } else if (mode === 'model') {
        contextModeIndicatorElement.textContent = '[ Model Mode + Web Search ]';
        contextModeIndicatorElement.classList.add('model-mode');
    }
};

const toggleContextMode = () => {
    const newMode = currentContextMode === 'memory' ? 'model' : 'memory';
    updateContextModeIndicator(newMode);
};

const initializeChat = async () => {
    const systemInstruction = currentMemories
        ? `${BASE_SYSTEM_INSTRUCTION}\n\n--- MEMORIES ---\n${currentMemories}`
        : BASE_SYSTEM_INSTRUCTION;

    chat = ai.chats.create({
      model: 'gemini-2.5-flash-lite',
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
        tools: [{
            googleSearch: {}
        }]
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
const getSocraticElement = (): HTMLElement | null => editorElement.querySelector('.socratic-question');

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

const clearSocraticQuestion = () => {
    getSocraticElement()?.remove();
    // Also clear memory reflection questions
    const memoryReflectionElement = editorElement.querySelector('.memory-reflection');
    memoryReflectionElement?.remove();
    // Clear conversation reflection questions
    const conversationReflectionElement = editorElement.querySelector('.conversation-reflection');
    conversationReflectionElement?.remove();
    clearTimeout(socraticQuestionTimer);
};

const animateTyping = (element: HTMLElement, text: string, onComplete?: () => void) => {
    let i = 0;
    const typingSpeed = 40; // milliseconds per character - faster typing
    
    // Clear existing content - no emoji
    element.textContent = '';
    element.classList.add('typing');
    
    const typeWriter = () => {
        if (i < text.length) {
            element.textContent = text.substring(0, i + 1);
            i++;
            setTimeout(typeWriter, typingSpeed);
        } else {
            // Typing complete
            element.classList.remove('typing');
            if (onComplete) {
                onComplete();
            }
        }
    };
    
    // Start typing immediately
    typeWriter();
};

const generateStartupMemoryQuestion = async (memories: string): Promise<string> => {
    try {
        const prompt = `Based on this memory bank, generate ONE specific, insightful "Why?" question that would help the person continue their thinking from where they left off.

The question should:
- Reference specific themes or ideas from their memories
- Help them dive back into their previous line of thought
- Be genuinely thought-provoking and re-engaging
- Start with "Why"
- Be concise (under 20 words)

Memory Bank:
${memories.slice(-1000)}

Generate only the question, nothing else:`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                systemInstruction: "You are a socratic questioning expert. Generate precise, contextual 'Why?' questions that help people re-engage with their previous thinking.",
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        const question = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        // Fallback if AI fails
        if (!question || !question.toLowerCase().startsWith('why')) {
            return 'Why are you returning to these thoughts today?';
        }
        
        return question;
    } catch (error) {
        console.error('Error generating startup memory question:', error);
        return 'Why are you returning to these thoughts today?';
    }
};

const generateAIWhyQuestion = async (text: string, conversationHistory: string, memories: string): Promise<string> => {
    try {
        // Build context for the AI to understand what to question
        let context = `Recent input: "${text}"\n\n`;
        
        if (conversationHistory && conversationHistory.length > 50) {
            context += `Conversation context:\n${conversationHistory.slice(-800)}\n\n`;
        }
        
        if (socraticMemoryEnabled && memories) {
            context += `Memory bank context:\n${memories.slice(-500)}\n\n`;
        }
        
        const prompt = `Based on this context, generate ONE specific, insightful "Why?" question that would help the person think deeper about their most recent input. 

The question should:
- Reference specific content from their input (not generic)
- Challenge assumptions or explore reasoning
- Be genuinely thought-provoking
- Start with "Why"
- Be concise (under 15 words)

Context:
${context}

Generate only the question, nothing else:`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                systemInstruction: "You are a socratic questioning expert. Generate precise, contextual 'Why?' questions that reference specific content.",
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        const question = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        
        // Fallback to simple question if AI fails
        if (!question || !question.toLowerCase().startsWith('why')) {
            return `Why ${text.length > 30 ? 'are you exploring this idea' : 'does this matter to you'}?`;
        }
        
        return question;
    } catch (error) {
        console.error('Error generating AI Why question:', error);
        return `Why ${text.length > 30 ? 'are you exploring this idea' : 'does this matter to you'}?`;
    }
};



const showStartupMemoryQuestion = async (memories: string) => {
    // Generate AI-powered contextual Why question for startup
    const startupQuestion = await generateStartupMemoryQuestion(memories);
    
    // Create socratic question element with typing animation
    const socraticElement = document.createElement('div');
    socraticElement.className = 'socratic-question memory-reflection';
    socraticElement.style.display = 'block';
    socraticElement.style.marginTop = '1em';
    socraticElement.style.marginBottom = '0.5em';
    
    editorElement.appendChild(socraticElement);
    
    // Animate typing the question
    setTimeout(() => {
        animateTyping(socraticElement, startupQuestion, () => {
            // After typing completes, create new input with cursor indicator below the question
            createNewInputWithCursor();
        });
    }, 1000);
    
    // Scroll to show the question
    editorElement.scrollTop = editorElement.scrollHeight;
};

const showMemorySocraticQuestion = async (savedContext: string) => {
    // Generate AI-powered contextual Why question for memory saves
    const conversationHistory = editorElement.innerText || '';
    const aiQuestion = await generateAIWhyQuestion(savedContext, conversationHistory, currentMemories);
    
    // Create socratic question element with typing animation
    const socraticElement = document.createElement('div');
    socraticElement.className = 'socratic-question memory-reflection';
    socraticElement.style.display = 'block';
    socraticElement.style.marginTop = '1em';
    socraticElement.style.marginBottom = '0.5em';
    
    editorElement.appendChild(socraticElement);
    
    // Animate typing the question
    setTimeout(() => {
        animateTyping(socraticElement, aiQuestion, () => {
            // After typing completes, create new input with cursor indicator below the question
            createNewInputWithCursor();
        });
    }, 500);
    
    // Scroll to show the question
    editorElement.scrollTop = editorElement.scrollHeight;
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

const createNewInputWithCursor = () => {
    // Just create the input directly - no cursor indicator needed
    createNewInput();
};

const createNewInput = (): HTMLElement => {
  // Check if there's already an active input - if so, remove it to prevent duplicates
  const existingActiveInput = getActiveInput();
  if (existingActiveInput) {
    console.warn('Removing existing active input to prevent duplicates');
    existingActiveInput.remove();
  }
  
  const lastElement = editorElement.lastElementChild;
  
  // Add proper spacing after saved code blocks
  if (lastElement && lastElement.classList.contains('saved-to-memory')) {
    // Add two line breaks for spacing after code blocks
    editorElement.appendChild(document.createElement('br'));
    editorElement.appendChild(document.createElement('br'));
  } else if (lastElement && lastElement.tagName !== 'BR') {
    // Regular single line break for other elements
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

const handleSubmitWithSocraticQuestion = async () => {
  const activeInput = getActiveInput();
  if (!activeInput || activeInput.classList.contains('is-placeholder')) return;
  
  const userInput = activeInput.innerText.trim();
  if (!userInput) return;

  // First submit to conversation (this creates AI response + new input)
  await handleSubmit();
  
  // Then generate socratic question after 3 seconds
  // The question should appear BEFORE the new input that handleSubmit created
  setTimeout(() => {
    showConversationSocraticQuestionInFlow(userInput);
  }, 3000);
};

const showConversationSocraticQuestionInFlow = async (userInput: string) => {
    // Generate AI-powered contextual Why question for conversation
    const conversationHistory = editorElement.innerText || '';
    const aiQuestion = await generateAIWhyQuestion(userInput, conversationHistory, currentMemories);
    
    // Remove the current active input that handleSubmit created
    const currentActiveInput = getActiveInput();
    if (currentActiveInput) {
        currentActiveInput.remove();
    }
    
    // Create socratic question element with typing animation
    const socraticElement = document.createElement('div');
    socraticElement.className = 'socratic-question conversation-reflection';
    socraticElement.style.display = 'block';
    socraticElement.style.marginTop = '1em';
    socraticElement.style.marginBottom = '0.5em';
    
    // Append question to the end (after AI response)
    editorElement.appendChild(socraticElement);
    
    // Animate typing the question
    setTimeout(() => {
        animateTyping(socraticElement, aiQuestion, () => {
            // After typing completes, create new input below the question
            createNewInputWithCursor();
        });
    }, 500);
    
    // Scroll to show the question
    editorElement.scrollTop = editorElement.scrollHeight;
};

const showConversationSocraticQuestion = async (userInput: string) => {
    // Generate AI-powered contextual Why question for conversation
    const conversationHistory = editorElement.innerText || '';
    const aiQuestion = await generateAIWhyQuestion(userInput, conversationHistory, currentMemories);
    
    // Create socratic question element with typing animation
    const socraticElement = document.createElement('div');
    socraticElement.className = 'socratic-question conversation-reflection';
    socraticElement.style.display = 'block';
    socraticElement.style.marginTop = '1em';
    socraticElement.style.marginBottom = '0.5em';
    
    editorElement.appendChild(socraticElement);
    
    // Animate typing the question
    setTimeout(() => {
        animateTyping(socraticElement, aiQuestion, () => {
            // After typing completes, only create new input if none exists
            if (!getActiveInput()) {
                createNewInput();
            }
            // Questions persist - no auto-removal
        });
    }, 500);
    
    // Scroll to show the question
    editorElement.scrollTop = editorElement.scrollHeight;
};

const extractKeywordsFromMemories = (memories: string): string[] => {
    if (!memories.trim()) return [];
    
    // Split memories into words and phrases
    const words = memories.toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 3) // Only significant words
        .filter(word => !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'were', 'said', 'each', 'which', 'their', 'time', 'would', 'there', 'could', 'other', 'after', 'first', 'well', 'also', 'where', 'much', 'should', 'these', 'some', 'very', 'what', 'know', 'just', 'into', 'over', 'think', 'only', 'come', 'work', 'life', 'even', 'back', 'want', 'because', 'good', 'make', 'most', 'people', 'many', 'through', 'being', 'before'].includes(word)); // Filter common words
    
    // Also extract 2-3 word phrases
    const phrases: string[] = [];
    const wordArray = memories.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/);
    for (let i = 0; i < wordArray.length - 1; i++) {
        if (wordArray[i].length > 2 && wordArray[i + 1].length > 2) {
            phrases.push(`${wordArray[i]} ${wordArray[i + 1]}`);
        }
        if (i < wordArray.length - 2 && wordArray[i + 2].length > 2) {
            phrases.push(`${wordArray[i]} ${wordArray[i + 1]} ${wordArray[i + 2]}`);
        }
    }
    
    return [...new Set([...words, ...phrases])]; // Remove duplicates
};

const checkMemoryReference = (text: string, memoryKeywords: string[]): boolean => {
    if (!text || memoryKeywords.length === 0) return false;
    
    const lowerText = text.toLowerCase();
    
    // Check for exact keyword/phrase matches
    return memoryKeywords.some(keyword => {
        if (keyword.includes(' ')) {
            // For phrases, require exact match
            return lowerText.includes(keyword);
        } else {
            // For single words, check word boundaries
            return new RegExp(`\\b${keyword}\\b`).test(lowerText);
        }
    });
};

const streamPredictionToGhost = async (
    streamPromise: Promise<AsyncGenerator<GenerateContentResponse>>,
    signal: AbortSignal
) => {
    const activeInput = getActiveInput();
    if (!activeInput) return;

    getGhostElement()?.remove();
    const ghostElement = document.createElement('span');
    ghostElement.className = 'ghost-text'; // Start with default gray
    activeInput.insertAdjacentElement('afterend', ghostElement);

    // Extract keywords from current memories for matching
    const memoryKeywords = extractKeywordsFromMemories(currentMemories);
    console.log('Memory keywords:', memoryKeywords);
    console.log('Current memories:', currentMemories);

    try {
        const streamResponse = await streamPromise;
        let lastResponseChunk: GenerateContentResponse | undefined;
        let accumulatedText = '';

        for await (const chunk of streamResponse) {
            if (signal.aborted) return;
            
            const chunkText = chunk.text || '';
            accumulatedText += chunkText;
            ghostElement.textContent = accumulatedText;
            
            // Check if the accumulated text references memory content
            const referencesMemory = checkMemoryReference(accumulatedText, memoryKeywords);
            console.log('Checking text:', accumulatedText, 'References memory:', referencesMemory);
            
            // Update class based on memory reference detection
            ghostElement.className = referencesMemory ? 'ghost-text memory-prediction' : 'ghost-text';
            
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

    if (currentContextMode === 'memory') {
        const streamPromise = chat.sendMessageStream({ message: currentText });
        await streamPredictionToGhost(streamPromise, signal);
    } else {
        // Model mode - use inherent training data only (but still has web search available)
        const history = getChatHistoryFromDOM();
        const contents: Content[] = [...history, { role: 'user', parts: [{ text: currentText }] }];

        const streamPromise = ai.models.generateContentStream({
            model: 'gemini-2.5-flash-lite',
            contents: contents,
            config: {
                systemInstruction: BASE_SYSTEM_INSTRUCTION,
                thinkingConfig: { thinkingBudget: 0 },
                tools: [{
                    googleSearch: {}
                }]
            },
        });
        await streamPredictionToGhost(streamPromise, signal);
    }
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

const captureCurrentContext = (): string => {
    const editorChildren = Array.from(editorElement.children);
    let contextText = '';
    
    for (const child of editorChildren) {
        if (child.classList.contains('committed-input')) {
            const userText = (child as HTMLElement).innerText.trim();
            if (userText) {
                contextText += `User: ${userText}\n`;
            }
        } else if (child.classList.contains('ai-output')) {
            if (!child.classList.contains('is-placeholder')) {
                const aiText = (child as HTMLElement).innerText.trim();
                if (aiText) {
                    contextText += `AI: ${aiText}\n`;
                }
            }
        }
    }
    
    // Also capture current active input if it has content
    const activeInput = getActiveInput();
    if (activeInput && !activeInput.classList.contains('is-placeholder')) {
        const currentText = activeInput.innerText.trim();
        if (currentText) {
            contextText += `User (current): ${currentText}\n`;
        }
    }
    
    return contextText.trim();
};

const animateTextSaving = (elements: HTMLElement[]) => {
    elements.forEach((element, index) => {
        setTimeout(() => {
            element.classList.add('saving-to-memory');
            
            // After animation completes, add permanent saved class with code block styling
            setTimeout(() => {
                element.classList.remove('saving-to-memory');
                element.classList.add('saved-to-memory');
                
                // If this was the active input, make it non-editable and create new input
                if (element.classList.contains('input-active')) {
                    element.classList.remove('input-active');
                    element.setAttribute('contenteditable', 'false');
                    
                    // Create new input on next line for continued writing
                    createNewInput();
                }
            }, 800);
        }, index * 100); // Stagger the animations
    });
};

const saveContextToMemoryBank = async () => {
    const currentContext = captureCurrentContext();
    if (!currentContext) {
        console.log('No context to save');
        return;
    }
    
    // Get all text elements that are being saved
    const editorChildren = Array.from(editorElement.children);
    const elementsToAnimate: HTMLElement[] = [];
    
    for (const child of editorChildren) {
        if (child.classList.contains('committed-input') || child.classList.contains('ai-output')) {
            if (!child.classList.contains('is-placeholder')) {
                elementsToAnimate.push(child as HTMLElement);
            }
        }
    }
    
    // Also include active input if it has content
    const activeInput = getActiveInput();
    if (activeInput && !activeInput.classList.contains('is-placeholder')) {
        const currentText = activeInput.innerText.trim();
        if (currentText) {
            elementsToAnimate.push(activeInput);
        }
    }
    
    // Start the creative animation
    animateTextSaving(elementsToAnimate);
    
    // Add timestamp and separator
    const timestamp = new Date().toLocaleString();
    const contextEntry = `\n--- Context saved on ${timestamp} ---\n${currentContext}\n--- End of context ---\n`;
    
    // Append to current memories
    currentMemories = currentMemories ? currentMemories + contextEntry : contextEntry.trim();
    
    // Save to localStorage
    localStorage.setItem('memories', currentMemories);
    
    // Re-initialize chat with updated memories
    await initializeChat();
    
    // Show brief confirmation
    console.log('Context saved to memory bank');
    
    // Enhanced memory bank toggle animation
    memoryBankToggleElement.style.backgroundColor = '#00E6F5';
    memoryBankToggleElement.style.boxShadow = '0 0 20px rgba(0, 230, 245, 0.6)';
    memoryBankToggleElement.style.transform = 'scale(1.05)';
    
    setTimeout(() => {
        memoryBankToggleElement.style.backgroundColor = '';
        memoryBankToggleElement.style.boxShadow = '';
        memoryBankToggleElement.style.transform = '';
    }, 400);
    
    // Generate socratic question after 3 seconds
    setTimeout(() => {
        // Remove any existing active input first to prevent multiple inputs
        const existingActiveInput = getActiveInput();
        if (existingActiveInput) {
            existingActiveInput.remove();
        }
        showMemorySocraticQuestion(currentContext);
    }, 3000);
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
    ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });
    await initializeChat();

    // Check if we have memories and show startup question
    if (currentMemories && currentMemories.trim().length > 50) {
        // Wait a moment for the UI to settle, then show the startup question
        setTimeout(() => {
            showStartupMemoryQuestion(currentMemories);
        }, 1000);
    }

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
      const socraticElement = getSocraticElement();
      const hasGhostText = ghostElement && ghostElement.innerText.trim() !== '';
      const hasSocraticQuestion = socraticElement && socraticElement.innerText.trim() !== '';

      if (e.key === '>' && e.shiftKey) {
          e.preventDefault();
          updateContextModeIndicator('model');
          startPredictionStream();
      } else if (e.key === 'Tab' && e.shiftKey) {
          e.preventDefault();
          updateContextModeIndicator('memory');
          startPredictionStream();
      } else if (e.key === 'Tab' || (e.key === 'ArrowRight' && isCursorAtEnd(activeInput))) {
        if (hasGhostText) {
          e.preventDefault();
          acceptSuggestion();
        } else if (e.key === 'Tab') {
          e.preventDefault();
          // Tab alone no longer submits - only accepts suggestions
        }
      } else if (e.key === 'Escape') {
        if (hasGhostText || hasSocraticQuestion) {
          e.preventDefault();
          clearSuggestion();
          clearSocraticQuestion();
        }
      } else if (e.key.length > 1 && e.key !== 'Backspace' && e.key !== 'Delete') {
        clearSuggestion();
        // Don't clear socratic questions on regular typing
      }
    });

    editorElement.addEventListener('blur', (e) => {
      const target = e.target as HTMLElement;
      if (target.matches('.input-active')) {
        clearSuggestion();
        // Don't clear socratic questions on blur - let them persist
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

    contextModeIndicatorElement.addEventListener('click', () => {
        toggleContextMode();
    });

    // Socratic memory toggle click handler
    socraticMemoryToggleElement.addEventListener('click', () => {
        socraticMemoryEnabled = !socraticMemoryEnabled;
        socraticMemoryToggleElement.textContent = socraticMemoryEnabled 
            ? '[ Why? Memory: On ]' 
            : '[ Why? Memory: Off ]';
    });
    
    memoryBankToggleElement.addEventListener('click', () => {
        memoryBankTextareaElement.value = currentMemories;
        memoryBankModalElement.classList.remove('hidden');
    });

    memoryBankCloseElement.addEventListener('click', () => {
        memoryBankModalElement.classList.add('hidden');
    });

    memoryBankClearElement.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all memories? This cannot be undone.')) {
            memoryBankTextareaElement.value = '';
            currentMemories = '';
            localStorage.removeItem('memories');
            
            // Re-initialize chat without memories
            initializeChat();
            
            alert('Memory bank cleared successfully.');
        }
    });

    memoryBankSaveElement.addEventListener('click', async () => {
        currentMemories = memoryBankTextareaElement.value;
        localStorage.setItem('memories', currentMemories);
        memoryBankModalElement.classList.add('hidden');
        
        alert('Memories saved. The editor will now be reloaded.');
        handleClearEditor();
    });

    // Global keyboard event listener for Enter and Command+Return
    document.addEventListener('keydown', (e) => {
        // Command+Return (Cmd+Return on Mac) - Save to memory
        if ((e.key === 'Enter' || e.key === 'Return') && e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey) {
            e.preventDefault();
            saveContextToMemoryBank();
        }
        // Regular Enter - Submit to conversation
        else if ((e.key === 'Enter' || e.key === 'Return') && !e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey) {
            const activeInput = getActiveInput();
            if (activeInput && !activeInput.classList.contains('is-placeholder')) {
                e.preventDefault();
                handleSubmitWithSocraticQuestion();
            }
        }
    });

    // Final UI setup
    timerElement.textContent = '0.00s';
    tokenCounterElement.textContent = '0 tokens';
    costEstimatorElement.textContent = '$0.000000';
    updateContextModeIndicator('memory');
    createNewInput();
}

main();