
const input = document.getElementById('inputBox');
const buttons = document.querySelectorAll('.buttons button');
const micBtn = document.getElementById('mic');
const toggleAdvancedBtn = document.getElementById('toggleAdvanced');
const advancedPanel = document.getElementById('advancedPanel');

let expression = "";

// buttons
buttons.forEach(button => {
    button.addEventListener('click', (e) => {
        const val = e.target.innerHTML;

        if (['mic', 'toggleAdvanced'].includes(e.target.id)) return;

        switch (val) {
            case '=':
                try {

                    let cleanExpr = input.value
                        .replace(/sin\(([^)]+)\)/g, 'sin($1 deg)')
                        .replace(/cos\(([^)]+)\)/g, 'cos($1 deg)')
                        .replace(/tan\(([^)]+)\)/g, 'tan($1 deg)')
                        .replace(/log\(([^)]+)\)/g, 'log10($1)')
                        .replace(/√\(([^)]+)\)/g, 'sqrt($1)')
                        .replace(/π/g, 'pi')
                        .replace(/÷/g, '/')
                        .replace(/x/g, '*')
                        .replace(/%/g, '*0.01');

                    let result = math.evaluate(cleanExpr);
                    input.value = result;
                    expression = result.toString();
                } catch {
                    input.value = "Error";
                    expression = '';
                }
                break;

            case 'C':
                expression = "";
                input.value = "";
                break;

            case '⌫':
                expression = expression.slice(0, -1);
                input.value = expression;
                break;

            default:
                expression += val;
                input.value = expression;
                break;
        }
    });

});

// Advanced panel toggle
toggleAdvancedBtn.addEventListener('click', () => {
    advancedPanel.classList.toggle('show');
});

// Advanced buttons 
advancedPanel.addEventListener('click', (e) => {
    if (!e.target.classList.contains('adv-btn')) return;
    const val = e.target.textContent;

    switch (val) {
        case 'sin':
        case 'cos':
        case 'tan':
        case 'log':
            expression += val + '(';
            break;

        case 'π':
            expression += 'pi';
            break;

        case '^':
            expression += '^';
            break;

        case '✓':
            expression += '√(';
            break;

        case '%':
            expression += '%';
            break;

        case '()':
            const openCount = (expression.match(/\(/g) || []).length;
            const closeCount = (expression.match(/\)/g) || []).length;
            expression += openCount <= closeCount ? '(' : ')';
            break;

        default:
            return;
    }

    input.value = expression;
});

input.removeAttribute('readonly');


// Voice recognition
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;


if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;

    micBtn.addEventListener('click', () => {
        recognition.start();
        micBtn.classList.add('listening');
        input.placeholder = "Listening...";
        input.value = "";
    });

    recognition.onresult = function (event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
            let transcript = event.results[i][0].transcript.toLowerCase().replace(/[.,!?]/g, '');

            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        // Show live transcript
        if (interimTranscript) {
            input.value = interimTranscript.replace(/\b(what is|calculate|equals|equal to|the answer is)\b/gi, '').trim();
        }

        // Process final speech
        if (finalTranscript) {
            micBtn.classList.remove('listening');
            input.placeholder = "0";
            processSpeech(finalTranscript);
        }
    };

    recognition.onerror = function (event) {
        micBtn.classList.remove('listening');
        input.placeholder = "0";
        input.value = "Error: " + event.error;
    };
} else {
    micBtn.disabled = true;
    micBtn.title = "Speech Recognition not supported in this browser.";
}


function processSpeech(speech) {
    console.log("Speech input:", speech);

    // Step 1: Convert number words to digits
    const numbersMap = {
        zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5,
        six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
        eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
        sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20
    };
    speech = speech.replace(/\b(zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)\b/gi, match => {
        return numbersMap[match.toLowerCase()];
    });

    // Step 2: Replace words with operators/functions
    let parsed = speech
        .replace(/\b(what is|is|calculate|equals|equal to|the answer is)\b/g, '')

        .replace(/\bsine\b/g, 'sin')
        .replace(/\bsine of\b/g, 'sin')
        .replace(/\bsign\b/g, 'sin')
        .replace(/\bcosine\b/g, 'cos')
        .replace(/\bcoz\b/g, 'cos')
        .replace(/\bcause\b/g, 'cos')
        .replace(/\bcourse\b/g, 'cos')
        .replace(/\btangent\b/g, 'tan')
        .replace(/\broot of\b/g, 'sqrt')
        .replace(/\broute\b/g, 'sqrt')
        .replace(/\bpi\b|\bpai\b|\bpie\b/gi, 'pi')

        .replace(/\bplus\b/g, '+')
        .replace(/\bminus\b/g, '-')
        .replace(/\b(in to|into)\b/g, '*')
        .replace(/\b(x|ex|times|multiply by|multiplied by)\b/g, '*')
        .replace(/\b(divided by|divide|over)\b/g, '/')

        .replace(/(\d+)\s*percent of\s*(\d+)/gi, '($1*0.01*$2)')
        .replace(/(\d+)\s*percent\b/gi, '($1*0.01)')

        .replace(/\bsin\s*([0-9.]+)\b/gi, 'sin($1 deg)')
        .replace(/\bcos\s*([0-9.]+)\b/gi, 'cos($1 deg)')
        .replace(/\btan\s*([0-9.]+)\b/gi, 'tan($1 deg)')
        .replace(/\bsqrt\s*([0-9.]+)\b/gi, 'sqrt($1)')

        .trim();

    console.log("Parsed expression:", parsed);

    // Step 3: Evaluate
    try {
        let result = math.evaluate(parsed);
        input.value = result;
        expression = result.toString();
    } catch (err) {
        input.value = "Error";
        console.error("Math evaluate error:", err.message);
    }
}
