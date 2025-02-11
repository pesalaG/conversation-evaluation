let mediaRecorder;
let audioChunks = [];
let audioBlob;
let transcriptText = "";
let conversationHistory = [];
const controlButton = document.getElementById('controlButton');
const startConversationButton = document.getElementById('startConversation');
const stopConversationButton = document.getElementById('stopConversation');
const transcriptField = document.getElementById('transcript');
const audioPlayer = document.getElementById('audioPlayer');
const scoresTable = document.querySelector('#scoresTable tbody');
const phonemeButton = document.getElementById('phonemeButton');
const phonemeDetails = document.querySelector('.phoneme-details');
const phonemeTable = document.getElementById('phonemeTable');

// Event listeners
startConversationButton.addEventListener('click', startConversation);
stopConversationButton.addEventListener('click', stopConversation);
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
        startConversationButton.disabled = true;
        stopConversationButton.disabled = false;
        controlButton.disabled = false;
        conversationHistory = [];
        transcriptField.textContent = '';
        scoresTable.innerHTML = '';
        phonemeTable.innerHTML = '';
        phonemeDetails.style.display = 'none';
        phonemeButton.style.display = 'none';
        document.getElementById('ieltsBand').textContent = 'IELTS Band Score: ';
    }
}


//////////////////////////////////////////////////////////////////////////////////////
async function stopConversation() {
    const response = await fetch('/stop-conversation', { method: 'POST' });
    if (response.ok) {
        // Parse the JSON response
        const jsonData = await response.json();

        // to check wheter correct audio is being sent to evaluation
        // const audioResponse = await fetch('/get-audio'); // Add a new endpoint for audio
        // if (audioResponse.ok) {
        //     const audioBlob = await audioResponse.blob();
        //     const audioUrl = URL.createObjectURL(audioBlob);
        //     audioPlayer.src = audioUrl;
        //     audioPlayer.load();
        //     audioPlayer.play();
        // } else {
        //     alert('Failed to fetch the audio.');
        // }

        // Update the IELTS Band Score section
        document.getElementById('ieltsBand').textContent = `IELTS Band Score: ${jsonData.IELTS_band_score}`;
        startConversationButton.disabled = false;
        stopConversationButton.disabled = true;
        controlButton.disabled = true;
        controlButton.textContent = 'Start Speaking';

        let pronunciationResult = null;
        let ieltsBandScore = null;
        let whisperResult = null;
        whisperResult = jsonData.whisper_result;
        pronunciationResult = jsonData.pronunciation_result;
        ieltsBandScore = jsonData.IELTS_band_score;

        // Ensure pronunciation result is valid before proceeding
        if (!pronunciationResult || !pronunciationResult.NBest || pronunciationResult.NBest.length === 0) {
            alert('Pronunciation result does not contain a valid NBest array.');
            return;
        }

        const nBest = pronunciationResult.NBest[0];

        // Update the IELTS Band Score section
        const ieltsBandElement = document.getElementById('ieltsBand');
        ieltsBandElement.textContent = `IELTS Band Score: ${ieltsBandScore}`;

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
        learnPronunciationButton.style.display = 'inline-block';
    } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
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
}

// Stop recording
async function stopRecording() {
    mediaRecorder.stop();
    mediaRecorder.onstop = async () => {
        audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('audio', audioBlob, 'audio.wav');

        try {
            const response = await fetch('/process-user-audio', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                conversationHistory.push({ role: 'user', content: data.user_transcript });
                conversationHistory.push({ role: 'assistant', content: data.assistant_response });

                await fetchAndPlayTTS(data.assistant_response);


                updateTranscript();
                controlButton.textContent = 'Start Speaking';
 
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
        finally {
            audioChunks = []; // Clear audio chunks after processing
        }
    };
}


// function updateTranscript() {
//     const transcriptField = document.getElementById('transcript');
//     transcriptField.innerHTML = ''; // Clear existing content

//     conversationHistory.forEach(msg => {
//         const messageDiv = document.createElement('div');
//         messageDiv.className = `message ${msg.role}-message`;
        
//         const roleSpan = document.createElement('span');
//         roleSpan.className = 'message-role';
//         roleSpan.textContent = msg.role === 'user' ? 'You:' : 'Assistant:';
        
//         const contentSpan = document.createElement('span');
//         contentSpan.textContent = msg.content;

//         messageDiv.appendChild(roleSpan);
//         messageDiv.appendChild(contentSpan);
//         transcriptField.appendChild(messageDiv);
//     });

//     // Scroll to bottom
//     transcriptField.scrollTop = transcriptField.scrollHeight;
// }

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


controlButton.addEventListener('click', async () => {
    if (controlButton.textContent === 'Start Recording') {await startRecording();
    } else if (controlButton.textContent === 'Stop Recording') {stopRecording();} 
    else if (controlButton.textContent === 'Refresh') {resetUI();}
});



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
    controlButton.disabled = false;
}
