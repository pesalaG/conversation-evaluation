let mediaRecorder;
let audioChunks = [];
let audioBlob;
let transcriptText = "";
let conversationHistory = [];
const controlButton = document.getElementById('controlButton');
const ConversationButton = document.getElementById('ConversationButton');
const transcriptField = document.getElementById('transcript');
const audioPlayer = document.getElementById('audioPlayer');
const scoresTable = document.querySelector('#scoresTable tbody');
const phonemeButton = document.getElementById('phonemeButton');
const phonemeDetails = document.querySelector('.phoneme-details');
const phonemeTable = document.getElementById('phonemeTable');

// Event listeners
// startConversationButton.addEventListener('click', startConversation);
// stopConversationButton.addEventListener('click', stopConversation);
ConversationButton.addEventListener('click', async () => {
    if (ConversationButton.textContent === 'Start Conversation') {
        await startConversation();
    } else if (ConversationButton.textContent === 'Stop Conversation') {
        await stopConversation();
    }
});
controlButton.addEventListener('click', async () => {
    if (controlButton.textContent === 'Start Speaking') {
        await startRecording();
    } else if (controlButton.textContent === 'Stop Speaking') {
        await stopRecording();
    }
});
phonemeButton.addEventListener('click', () => {
    phonemeDetails.style.display = phonemeDetails.style.display === 'none' ? 'block' : 'none';
});

// Start conversation
async function startConversation() {
    const response = await fetch('/start-conversation', { method: 'POST' });
    if (response.ok) {
        ConversationButton.textContent = 'Stop Conversation';
        controlButton.disabled = false;
        conversationHistory = [];
        document.getElementById('ieltsBand').textContent = 'IELTS Band Score: ';
        resetUI();

    }
}


//////////////////////////////////////////////////////////////////////////////////////
async function stopConversation() {
    try {
        controlButton.disabled = true;
        controlButton.textContent = 'Start Speaking';
        ConversationButton.textContent = 'Start Conversation';
        ConversationButton.disabled = true;

        const response = await fetch('/stop-conversation', { method: 'POST' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Error: ${errorData.error}`);
        }

        // Parse the JSON response
        const jsonData = await response.json();

        // Fetch the audio
        const audioResponse = await fetch('/get-audio');
        if (!audioResponse.ok) {
            throw new Error('Failed to fetch the audio.');
        }

        const audioBlob = await audioResponse.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        audioPlayer.src = audioUrl;
        audioPlayer.load();

        // Update the IELTS Band Score section
        document.getElementById('ieltsBand').textContent = `IELTS Band Score: ${jsonData.IELTS_band_score}`;

        const { whisper_result, pronunciation_result, IELTS_band_score } = jsonData;

        // Ensure pronunciation result is valid before proceeding
        if (!pronunciation_result || !pronunciation_result.NBest || pronunciation_result.NBest.length === 0) {
            throw new Error('Pronunciation result does not contain a valid NBest array.');
        }

        const nBest = pronunciation_result.NBest[0];

        // Update the IELTS Band Score section
        const ieltsBandElement = document.getElementById('ieltsBand');
        ieltsBandElement.textContent = `IELTS Band Score: ${IELTS_band_score}`;

        scoresTable.innerHTML = 
            `<tr>
                <td>${nBest.PronunciationAssessment.AccuracyScore}</td>
                <td>${nBest.PronunciationAssessment.CompletenessScore}</td>
                <td>${nBest.PronunciationAssessment.FluencyScore}</td>
                <td>${nBest.PronunciationAssessment.ProsodyScore}</td>
                <td>${nBest.PronunciationAssessment.PronScore.toFixed(1)}</td>
            </tr>`;

        populatePhonemeTable(nBest.Words);

        phonemeButton.style.display = 'inline-block';
        //learnPronunciationButton.style.display = 'inline-block';

    } catch (error) {
        console.error('Error in stopConversation:', error);
        alert(error.message);
    } finally {
        // Ensure the button is enabled regardless of success or failure
        ConversationButton.disabled = false;
    }
}
//////////////////////////////////////////////////////////////////////////////////////

// Start recording
async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
    mediaRecorder.start();
    controlButton.textContent = 'Stop Speaking';
    ConversationButton.disabled = true;
}

// Stop recording
async function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder.onstop = async () => {
        controlButton.textContent = 'Start Speaking';
        controlButton.disabled = true;
        audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.wav');

        try {
            const TranscriptResponse = await fetch('/get-transcript', {
                method: 'POST',
                body: formData,
            });

            if (TranscriptResponse.ok) {
                const transcriptData = await TranscriptResponse.json();
                conversationHistory.push({ role: 'user', content: transcriptData.user_transcript });
                updateTranscript();
            }
            const AssistantResponse = await fetch('/get-assistant-response', { method: 'POST' });
            if (AssistantResponse.ok) {
                const assistantData = await AssistantResponse.json();
                conversationHistory.push({ role: 'assistant', content: assistantData.assistant_response });
                updateTranscript();
                await fetchAndPlayTTS(assistantData.assistant_response);
            }

        } catch (error) {
            alert('Error: ' + error.message);
        }
        finally {
            audioChunks = []; // Clear audio chunks after processing
            controlButton.disabled = false;
            ConversationButton.disabled = false;
        }
    };
}


function updateTranscript() {
    const transcriptField = document.getElementById('transcript');
    transcriptField.innerHTML = ''; // Clear existing content

    conversationHistory.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.role}-message`;
        
        // Remove role span and keep only content
        const contentSpan = document.createElement('span');
        contentSpan.textContent = msg.content;

        messageDiv.appendChild(contentSpan);
        transcriptField.appendChild(messageDiv);
    });

    // Scroll to bottom
    transcriptField.scrollTop = transcriptField.scrollHeight;
}



// Function to fetch TTS audio and play it
async function fetchAndPlayTTS(transcriptText) {
    if (!transcriptText) {
        alert('No transcript available for pronunciation.');
        return;
    }

    const formData = new FormData();
    formData.append('reftext', transcriptText);

    try {
        const response = await fetch('/gettts', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            audioPlayer.src = audioUrl;
            audioPlayer.load();
            audioPlayer.play();
        } else {
            alert('Failed to fetch the pronunciation audio.');
        }
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Event listener for the "Learn Pronunciation" button
learnPronunciationButton.addEventListener('click', async () => {
    await fetchAndPlayTTS(transcriptText);
});

function populatePhonemeTable(words) {
    let tableHTML = '<thead><tr><th>Word</th><th>Word Accuracy</th><th>Phoneme</th><th>Phoneme Accuracy</th></tr></thead><tbody>';

    words.forEach(word => {
        tableHTML += `<tr><td rowspan="${word.Phonemes.length + 1}">${word.Word}</td><td rowspan="${word.Phonemes.length + 1}">${word.PronunciationAssessment.AccuracyScore}</td></tr>`;
        word.Phonemes.forEach(phoneme => {
            tableHTML += `<tr><td>${phoneme.Phoneme}</td><td>${phoneme.PronunciationAssessment.AccuracyScore}</td></tr>`;
        });
    });

    tableHTML += '</tbody>';
    phonemeTable.innerHTML = tableHTML;
}

phonemeButton.addEventListener('click', () => {
    if (phonemeDetails.style.display === 'none') {
        phonemeDetails.style.display = 'block';
    } else {
        phonemeDetails.style.display = 'none';
    }
});
// Reset UI
function resetUI() {
    transcriptText = '';
    transcriptField.textContent = '';
    audioPlayer.src = '';
    scoresTable.innerHTML = '';
    phonemeTable.innerHTML = '';
    phonemeDetails.style.display = 'none';
    phonemeButton.style.display = 'none';
    controlButton.textContent = 'Start Speaking';
}
